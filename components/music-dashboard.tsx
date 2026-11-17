'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'
import { toast, Toaster } from 'sonner'
import { api, type Cancion, type Favorito, type Pagina, type Usuario, demoCanciones, demoFavoritos, demoUsuarios, getApiBase, getToken, LOGOUT_EVENT, pageQuery, setApiBase, setToken } from '@/lib/api'
import { AuthScreen } from '@/components/auth-screen'
import { Activity, Album, ArrowDownRight, ArrowUpRight, Check, ChevronDown, ChevronLeft, ChevronRight, Disc3, Heart, Home, LogOut, Menu, Moon, Music2, Plus, Search, Settings2, SlidersHorizontal, Sparkles, Sun, Users, X } from 'lucide-react'

type View = 'Inicio' | 'Canciones' | 'Usuarios' | 'Favoritos'
const nav: { name: View; icon: typeof Home }[] = [{ name: 'Inicio', icon: Home }, { name: 'Canciones', icon: Music2 }, { name: 'Usuarios', icon: Users }, { name: 'Favoritos', icon: Heart }]
const coverColors = ['cover-mint', 'cover-coral', 'cover-lilac', 'cover-blue', 'cover-gold']
const fmtTime = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`
const fmtDate = (value: string) => new Date(value).toLocaleDateString('es-ES')

export function MusicDashboard() {
  const [view, setView] = useState<View>('Inicio')
  const [apiBase, setApiBaseState] = useState(getApiBase())
  const [apiDraft, setApiDraft] = useState(getApiBase())
  const [apiOpen, setApiOpen] = useState(false)
  const [demo, setDemo] = useState(false)
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(true)
  const [dark, setDark] = useState(false)
  const [mobileNav, setMobileNav] = useState(false)
  const [users, setUsers] = useState<Usuario[]>([])
  const [songs, setSongs] = useState<Cancion[]>([])
  const [favorites, setFavorites] = useState<Favorito[]>([])
  const [totals, setTotals] = useState({ usuarios: 0, canciones: 0, favoritos: 0 })
  const [activeUser, setActiveUser] = useState(1)
  const [session, setSession] = useState<Usuario | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(10)
  const [query, setQuery] = useState({ titulo: '', artista: '', genero: '' })
  const [debouncedQuery, setDebouncedQuery] = useState(query)
  const [dialog, setDialog] = useState<'song' | 'user' | null>(null)
  const [editing, setEditing] = useState<Cancion | Usuario | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'song' | 'user'; id: number } | null>(null)
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null)
  const [configTest, setConfigTest] = useState<'idle' | 'ok' | 'fail'>('idle')
  const [themeReady, setThemeReady] = useState(false)

  const { data: health, mutate: checkHealth } = useSWR('music-api-health', async () => api<{ status: string; version?: string }>('/health'), { shouldRetryOnError: false, revalidateOnFocus: false })
  const connected = Boolean(health?.status === 'healthy')
  // Con la API real el usuario activo es el que inició sesión; en demostración se elige
  const user = demo ? users.find((item) => item.id === activeUser) || users[0] : session
  const activeId = user?.id ?? 0
  const currentFavorites = favorites.filter((item) => item.id_usuario === activeId)
  const favoriteSongs = currentFavorites.map((favorite) => ({ favorite, song: songs.find((song) => song.id === favorite.id_cancion) })).filter((item) => item.song)
  const filtered = useMemo(() => songs.filter((song) => song.titulo.toLowerCase().includes(debouncedQuery.titulo.toLowerCase()) && song.artista.toLowerCase().includes(debouncedQuery.artista.toLowerCase()) && song.genero.toLowerCase().includes(debouncedQuery.genero.toLowerCase())), [songs, debouncedQuery])

  // Con la API real, las tablas usan la paginación y la búsqueda del servidor (/buscar)
  const live = ready && !demo && !loading
  const searchParams = new URLSearchParams(Object.entries(debouncedQuery).filter(([, value]) => value.trim()))
  const songsPath = live && view === 'Canciones' ? `/api/canciones/buscar?${searchParams.toString() ? `${searchParams}&` : ''}${pageQuery(page, size)}` : null
  const usersPath = live && view === 'Usuarios' ? `/api/usuarios?${pageQuery(page, size)}` : null
  const { data: songsPage, error: songsError, mutate: reloadSongsPage } = useSWR(songsPath && [apiBase, songsPath], ([, path]: [string, string]) => api<Pagina<Cancion>>(path), { keepPreviousData: true, revalidateOnFocus: false })
  const { data: usersPage, error: usersError, mutate: reloadUsersPage } = useSWR(usersPath && [apiBase, usersPath], ([, path]: [string, string]) => api<Pagina<Usuario>>(path), { keepPreviousData: true, revalidateOnFocus: false })

  const songTotal = demo ? filtered.length : songsPage?.total ?? 0
  const userTotal = demo ? users.length : usersPage?.total ?? 0
  const counts = demo ? { usuarios: users.length, canciones: songs.length, favoritos: favorites.length } : totals
  const localPages = (count: number) => Math.max(1, Math.ceil(count / size))
  const totalPages = view === 'Canciones' ? (demo ? localPages(filtered.length) : Math.max(1, songsPage?.paginas ?? 1)) : view === 'Usuarios' ? (demo ? localPages(users.length) : Math.max(1, usersPage?.paginas ?? 1)) : localPages(favoriteSongs.length)
  const visibleSongs = demo ? filtered.slice((page - 1) * size, page * size) : songsPage?.items ?? []
  const visibleUsers = demo ? users.slice((page - 1) * size, page * size) : usersPage?.items ?? []
  const visibleFavorites = favoriteSongs.slice((page - 1) * size, page * size)
  const songsLoading = loading || (live && !songsPage && !songsError)
  const usersLoading = loading || (live && !usersPage && !usersError)
  const today = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()
  const showDemo = useCallback((message?: string) => {
    setDemo(true); setLoading(false); setUsers(demoUsuarios); setSongs(demoCanciones); setFavorites(demoFavoritos)
    if (message) toast.info(message)
  }, [])

  useEffect(() => {
    const savedBase = localStorage.getItem('musica-lpa-api')
    const savedUser = Number(localStorage.getItem('musica-lpa-user'))
    const savedTheme = localStorage.getItem('musica-lpa-theme')
    if (savedBase) { setApiBase(savedBase); setApiBaseState(savedBase); setApiDraft(savedBase) }
    if (savedUser) setActiveUser(savedUser)
    if (savedTheme === 'dark') { setDark(true); document.documentElement.classList.add('dark') }
    setReady(true); setThemeReady(true)
  }, [])
  useEffect(() => { const timeout = window.setTimeout(() => setDebouncedQuery(query), 300); return () => window.clearTimeout(timeout) }, [query])
  useEffect(() => {
    if (!ready) return
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const [u, s, f] = await Promise.all([
          api<Pagina<Usuario>>(`/api/usuarios?${pageQuery(1, 100)}`),
          api<Pagina<Cancion>>(`/api/canciones?${pageQuery(1, 100)}`),
          api<Pagina<Favorito>>(`/api/favoritos?${pageQuery(1, 100)}`),
        ])
        const me = getToken() ? await api<Usuario>('/api/auth/me').catch(() => null) : null
        if (!cancelled) { setUsers(u.items); setSongs(s.items); setFavorites(f.items); setTotals({ usuarios: u.total, canciones: s.total, favoritos: f.total }); setSession(me); setDemo(false); setLoading(false) }
      } catch { if (!cancelled) showDemo('No se pudo conectar con la API: se activó el modo demostración') }
    }
    load()
    return () => { cancelled = true }
  }, [ready, showDemo, apiBase, reloadKey])
  useEffect(() => {
    const expired = () => { setSession(null); toast.error('Tu sesión expiró, vuelve a ingresar') }
    window.addEventListener(LOGOUT_EVENT, expired)
    return () => window.removeEventListener(LOGOUT_EVENT, expired)
  }, [])

  const toggleTheme = () => { const next = !dark; setDark(next); document.documentElement.classList.toggle('dark', next); localStorage.setItem('musica-lpa-theme', next ? 'dark' : 'light') }
  const chooseUser = (id: number) => { setActiveUser(id); localStorage.setItem('musica-lpa-user', String(id)) }
  const onAuth = (me: Usuario) => { setSession(me); setView('Inicio'); toast.success(`Hola, ${me.nombre}`); void refreshData() }
  const logout = () => {
    setToken(null); setSession(null); setView('Inicio')
    if (demo) { setDemo(false); setReloadKey((key) => key + 1) } else toast.success('Sesión cerrada')
  }
  const refreshData = async () => {
    if (demo) return
    try {
      const [u, s, f] = await Promise.all([api<Pagina<Usuario>>(`/api/usuarios?${pageQuery(1, 100)}`), api<Pagina<Cancion>>(`/api/canciones?${pageQuery(1, 100)}`), api<Pagina<Favorito>>(`/api/favoritos?${pageQuery(1, 100)}`)])
      setUsers(u.items); setSongs(s.items); setFavorites(f.items); setTotals({ usuarios: u.total, canciones: s.total, favoritos: f.total })
      await Promise.all([checkHealth(), reloadSongsPage(), reloadUsersPage()])
    } catch (error) { toast.error(error instanceof Error ? error.message : 'No se pudo actualizar'); showDemo() }
  }
  const toggleFavorite = async (song: Cancion) => {
    if (!user) { toast.error('Crea un usuario antes de guardar favoritos'); return }
    const existing = favorites.find((item) => item.id_usuario === activeId && item.id_cancion === song.id)
    if (demo) {
      setFavorites((current) => existing ? current.filter((item) => item.id !== existing.id) : [...current, { id: Date.now(), id_usuario: activeId, id_cancion: song.id, fecha_marcado: new Date().toISOString() }])
      toast.success(existing ? 'Canción eliminada de favoritos' : 'Añadida a tus favoritos'); return
    }
    try { await api(existing ? `/api/usuarios/${activeId}/favoritos/${song.id}` : '/api/favoritos', { method: existing ? 'DELETE' : 'POST', ...(existing ? {} : { body: JSON.stringify({ id_usuario: activeId, id_cancion: song.id }) }) }); toast.success(existing ? 'Canción eliminada de favoritos' : 'Añadida a tus favoritos'); await refreshData() } catch (error) { toast.error(error instanceof Error ? error.message : 'No se pudo guardar') }
  }
  const removeFavorite = async (favorite: Favorito) => {
    if (demo) { setFavorites((current) => current.filter((item) => item.id !== favorite.id)); toast.success('Favorito eliminado'); return }
    try { await api(`/api/usuarios/${favorite.id_usuario}/favoritos/${favorite.id_cancion}`, { method: 'DELETE' }); toast.success('Favorito eliminado'); await refreshData() } catch (error) { toast.error(error instanceof Error ? error.message : 'No se pudo eliminar') }
  }
  const saveSong = async (form: FormData) => {
    const payload = { titulo: String(form.get('titulo')), artista: String(form.get('artista')), album: String(form.get('album')) || null, duracion: Number(form.get('duracion')), año: Number(form.get('año')), genero: String(form.get('genero')) }
    const time = String(form.get('duracion')).match(/^(\d+):([0-5]\d)$/)
    if (time) payload.duracion = Number(time[1]) * 60 + Number(time[2])
    const errors = songErrors(payload)
    if (errors.length) { toast.error(errors.join(' · ')); return }
    if (demo) {
      const item: Cancion = { ...payload, id: editing?.id || Date.now(), fecha_creacion: editing && 'fecha_creacion' in editing ? editing.fecha_creacion : new Date().toISOString() }
      setSongs((current) => editing ? current.map((song) => song.id === item.id ? item : song) : [item, ...current]); toast.success(editing ? 'Canción actualizada' : 'Canción creada')
    } else {
      try { await api(editing ? `/api/canciones/${editing.id}` : '/api/canciones', { method: editing ? 'PUT' : 'POST', body: JSON.stringify(payload) }); toast.success(editing ? 'Canción actualizada' : 'Canción creada'); await refreshData() } catch (error) { toast.error(error instanceof Error ? error.message : 'No se pudo guardar'); return }
    }
    setDialog(null); setEditing(null)
  }
  const saveUser = async (form: FormData) => {
    const payload = { nombre: String(form.get('nombre')).trim(), correo: String(form.get('correo')).trim() }
    if (payload.nombre.length < 2 || payload.nombre.length > 100) { toast.error('El nombre debe tener entre 2 y 100 caracteres'); return }
    if (payload.correo.length > 150 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.correo)) { toast.error('Introduce un correo válido (máximo 150 caracteres)'); return }
    if (demo) {
      const item: Usuario = { ...payload, id: editing?.id || Date.now(), fecha_registro: editing && 'fecha_registro' in editing ? editing.fecha_registro : new Date().toISOString() }
      setUsers((current) => editing ? current.map((entry) => entry.id === item.id ? item : entry) : [...current, item]); toast.success(editing ? 'Usuario actualizado' : 'Usuario creado')
      if (!editing && !user) chooseUser(item.id)
    } else {
      try { await api(editing ? `/api/usuarios/${editing.id}` : '/api/usuarios', { method: editing ? 'PUT' : 'POST', body: JSON.stringify(payload) }); toast.success(editing ? 'Usuario actualizado' : 'Usuario creado'); await refreshData() } catch (error) { toast.error(error instanceof Error ? error.message : 'No se pudo guardar'); return }
    }
    setDialog(null); setEditing(null)
  }
  const confirmDelete = async () => {
    if (!deleteTarget) return
    const { type, id } = deleteTarget
    try {
      if (demo) {
        if (type === 'song') { setSongs((current) => current.filter((item) => item.id !== id)); setFavorites((current) => current.filter((item) => item.id_cancion !== id)) }
        else { setUsers((current) => current.filter((item) => item.id !== id)); setFavorites((current) => current.filter((item) => item.id_usuario !== id)); if (activeId === id) chooseUser(users.find((item) => item.id !== id)?.id || 0) }
      } else { await api(`/api/${type === 'song' ? 'canciones' : 'usuarios'}/${id}`, { method: 'DELETE' }); await refreshData() }
      toast.success(type === 'song' ? 'Canción eliminada' : 'Usuario eliminado'); setDeleteTarget(null)
    } catch (error) { toast.error(error instanceof Error ? error.message : 'No se pudo eliminar') }
  }
  const testApi = async () => {
    setConfigTest('idle')
    try {
      const response = await fetch(`${apiDraft.replace(/\/$/, '')}/health`, { credentials: 'omit' })
      if (!response.ok) throw new Error()
      setConfigTest('ok'); toast.success('Conexión establecida')
    } catch { setConfigTest('fail'); toast.error('No se pudo conectar con la API') }
  }
  const changeApi = () => { setApiBase(apiDraft); localStorage.setItem('musica-lpa-api', getApiBase()); setApiBaseState(getApiBase()); setApiOpen(false); setDemo(false); void checkHealth(); toast.success('URL de API actualizada') }
  const openCreate = (type: 'song' | 'user', item?: Cancion | Usuario) => { setEditing(item || null); setDialog(type) }

  const navContent = <><div className="brand-lockup"><div className="brand-mark"><Disc3 size={23} strokeWidth={1.8} /></div><div><strong>Música <span>LPA2</span></strong><small>Tu biblioteca, en orden</small></div></div><div className="nav-label">ESPACIO DE TRABAJO</div><nav className="nav-list" aria-label="Navegación principal">{nav.map(({ name, icon: Icon }) => <button key={name} className={`nav-item ${view === name ? 'active' : ''}`} onClick={() => { setView(name); setPage(1); setMobileNav(false) }}><Icon size={18} strokeWidth={1.8} /><span>{name}</span>{name === 'Favoritos' && <span className="nav-count">{currentFavorites.length}</span>}</button>)}</nav><div className="sidebar-bottom"><div className="sidebar-note"><Sparkles size={17} /><div><b>Un buen día empieza</b><span>con una buena canción.</span></div></div><div className="profile-mini"><div className="avatar">{user?.nombre.split(' ').map((part) => part[0]).slice(0, 2).join('') || '—'}</div><div className="profile-copy"><strong>{user?.nombre || 'Sin usuario'}</strong><span>Usuario activo</span></div><button className="icon-button" aria-label={demo ? 'Salir del modo demostración' : 'Cerrar sesión'} title={demo ? 'Salir del modo demostración' : 'Cerrar sesión'} onClick={logout}><LogOut size={16} /></button></div></div></>

  if (!demo && !loading && !session) return <><AuthScreen onAuth={onAuth} onDemo={() => showDemo('Modo demostración: los cambios no se guardan en la API')} />{themeReady && <Toaster position="bottom-right" richColors closeButton />}</>

  return <div className={`app-shell ${dark ? 'dark-shell' : ''}`}>
    <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>{navContent}</aside>
    {mobileNav && <button className="mobile-scrim" aria-label="Cerrar menú" onClick={() => setMobileNav(false)} />}
    <main className="main-area">
      <header className="topbar"><div className="topbar-left"><button className="mobile-menu icon-button" aria-label="Abrir menú" onClick={() => setMobileNav(true)}><Menu size={20} /></button><span className="breadcrumb">Biblioteca <span>/</span> {view}</span></div><div className="topbar-actions">{demo && <span className="demo-pill"><span /> Modo demostración</span>}<div className="active-user"><span className="online-dot" /><span>{user?.nombre || 'Sin usuario'}</span></div><button className="icon-button" aria-label="Configuración de la API" title="Configuración de la API" onClick={() => setApiOpen(true)}><Settings2 size={18} /></button><button className="icon-button" aria-label={dark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'} onClick={toggleTheme}>{dark ? <Sun size={18} /> : <Moon size={18} />}</button></div></header>
      <div className="content-wrap">
        {view === 'Inicio' && <section className="view-content">
          <div className="page-heading"><div><p className="eyebrow" suppressHydrationWarning>{today} <span className="eyebrow-line" /></p><h1>Tu música, <em>a tu manera.</em></h1><p className="page-subtitle">Un espacio para organizar lo que suena en tu vida.</p></div><button className="button-primary" onClick={() => { setView('Canciones'); openCreate('song') }}><Plus size={17} /> Añadir canción</button></div>
          <div className="hero-banner"><div className="hero-copy"><div className="hero-kicker"><span className="equalizer"><i /><i /><i /><i /></span> TU COLECCIÓN MUSICAL</div><h2>Todo lo que<br />te hace <em>sentir.</em></h2><p>Una biblioteca construida canción a canción. Sigue explorando.</p><button className="hero-button" onClick={() => setView('Canciones')}>Explorar canciones <ArrowDownRight size={16} /></button></div><div className="hero-art" aria-hidden="true"><div className="vinyl"><div className="vinyl-center"><Music2 size={20} /></div></div><div className="hero-spark spark-one">✳</div><div className="hero-spark spark-two">✳</div><div className="hero-number">N.º 001<br /><span>PLAY YOUR<br />OWN SOUND</span></div></div><div className="hero-index">01 <span>—</span> 04</div></div>
          <div className="stats-grid"><StatCard icon={<Users />} label="USUARIOS" value={counts.usuarios} detail="en tu comunidad" tint="mint" /><StatCard icon={<Music2 />} label="CANCIONES" value={counts.canciones} detail="en la biblioteca" tint="lilac" /><StatCard icon={<Heart />} label="FAVORITOS" value={counts.favoritos} detail="guardados por todos" tint="peach" /><div className="stat-card api-card"><div className={`api-orbit ${connected ? 'is-online' : ''}`}><Activity size={19} /></div><div><div className="stat-label">ESTADO DE LA API</div><strong className="api-status"><span className={connected ? 'status-dot' : 'status-dot offline'} />{connected ? 'Conectada' : 'Sin conexión'}</strong><span className="stat-detail">{connected ? `Versión ${health?.version || '1.0.0'}` : 'Los datos se guardan en esta vista'}</span></div></div></div>
          <div className="section-heading"><div><p className="eyebrow">RECIÉN AÑADIDAS</p><h2>Últimas canciones</h2></div><button className="text-link" onClick={() => setView('Canciones')}>Ver biblioteca <ArrowUpRight size={15} /></button></div>
          <div className="recent-list">{[...songs].sort((a, b) => +new Date(b.fecha_creacion) - +new Date(a.fecha_creacion)).slice(0, 5).map((song, index) => <div className="recent-row" key={song.id}><div className={`album-thumb ${coverColors[index % coverColors.length]}`}><Album size={20} /><span>{String(index + 1).padStart(2, '0')}</span></div><div className="recent-title"><strong>{song.titulo}</strong><span>{song.artista}</span></div><span className="genre-chip">{song.genero}</span><span className="recent-album">{song.album || 'Sencillo'}</span><span className="recent-duration">{fmtTime(song.duracion)}</span><button className={`heart-button ${currentFavorites.some((f) => f.id_cancion === song.id) ? 'hearted' : ''}`} aria-label="Alternar favorito" onClick={() => void toggleFavorite(song)}><Heart size={17} fill={currentFavorites.some((f) => f.id_cancion === song.id) ? 'currentColor' : 'none'} /></button></div>)}</div>
        </section>}
        {view === 'Canciones' && <section className="view-content"><div className="page-heading compact-heading"><div><p className="eyebrow">LA BIBLIOTECA</p><h1>Encuentra tu <em>sonido.</em></h1><p className="page-subtitle">Todas las canciones que guardas cerca.</p></div><button className="button-primary" onClick={() => openCreate('song')}><Plus size={17} /> Nueva canción</button></div><div className="filter-panel"><div className="filter-title"><SlidersHorizontal size={17} /><span>Filtrar canciones</span></div><div className="filter-inputs">{(['titulo', 'artista', 'genero'] as const).map((field) => <label className="filter-field" key={field}><span>{field[0].toUpperCase() + field.slice(1)}</span><div className="input-wrap"><Search size={15} /><input value={query[field]} onChange={(event) => { setQuery({ ...query, [field]: event.target.value }); setPage(1) }} placeholder={`Buscar por ${field}...`} /></div></label>)}</div></div><div className="table-container"><div className="table-toolbar"><span><b>{songTotal}</b> canciones encontradas</span><span className="live-indicator"><i /> Actualizado</span></div><div className="table-scroll"><table><thead><tr><th>TÍTULO</th><th>ARTISTA</th><th>ÁLBUM</th><th>DURACIÓN</th><th>AÑO</th><th>GÉNERO</th><th aria-label="Acciones" /></tr></thead><tbody>{songsLoading && <SkeletonRows columns={7} />}{visibleSongs.map((song, index) => <tr key={song.id}><td><div className="song-name-cell"><span className={`mini-cover ${coverColors[index % coverColors.length]}`}><Music2 size={15} /></span><strong>{song.titulo}</strong></div></td><td>{song.artista}</td><td className="muted-cell">{song.album || '—'}</td><td className="mono-cell">{fmtTime(song.duracion)}</td><td>{song.año}</td><td><span className="genre-chip">{song.genero}</span></td><td><div className="row-actions"><button className={`heart-button ${currentFavorites.some((f) => f.id_cancion === song.id) ? 'hearted' : ''}`} aria-label="Alternar favorito" onClick={() => void toggleFavorite(song)}><Heart size={17} fill={currentFavorites.some((f) => f.id_cancion === song.id) ? 'currentColor' : 'none'} /></button><button className="icon-button tiny" aria-label={`Editar ${song.titulo}`} onClick={() => openCreate('song', song)}><Settings2 size={15} /></button><button className="icon-button tiny danger-icon" aria-label={`Eliminar ${song.titulo}`} onClick={() => setDeleteTarget({ type: 'song', id: song.id })}><X size={15} /></button></div></td></tr>)}</tbody></table></div>{songsError && !songsPage ? <ErrorState message={songsError.message} onRetry={() => void reloadSongsPage()} /> : !songsLoading && songTotal === 0 && <EmptyState label="No encontramos canciones" onCreate={() => openCreate('song')} />}{songTotal > 0 && <Pagination page={page} pages={totalPages} size={size} setPage={setPage} setSize={(value) => { setSize(value); setPage(1) }} total={songTotal} />}</div></section>}
        {view === 'Usuarios' && <section className="view-content"><div className="page-heading compact-heading"><div><p className="eyebrow">TU COMUNIDAD</p><h1>Las personas <em>que escuchan.</em></h1><p className="page-subtitle">Conoce a quienes comparten este espacio.</p></div><button className="button-primary" onClick={() => openCreate('user')}><Plus size={17} /> Nuevo usuario</button></div><div className="table-container users-table"><div className="table-toolbar"><span><b>{userTotal}</b> usuarios registrados</span><span className="muted-cell">Haz clic en una persona para ver sus favoritos</span></div><div className="table-scroll"><table><thead><tr><th>USUARIO</th><th>CORREO ELECTRÓNICO</th><th>FECHA DE REGISTRO</th><th>FAVORITOS</th><th /></tr></thead><tbody>{usersLoading && <SkeletonRows columns={5} />}{visibleUsers.map((item, index) => <tr key={item.id} className="clickable-row" onClick={() => setSelectedUser(item)}><td><div className="user-name-cell"><span className={`avatar table-avatar avatar-${index % 5}`}>{item.nombre.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span><strong>{item.nombre}</strong></div></td><td className="muted-cell">{item.correo}</td><td>{fmtDate(item.fecha_registro)}</td><td><span className="favorite-count"><Heart size={13} /> {favorites.filter((favorite) => favorite.id_usuario === item.id).length}</span></td><td onClick={(event) => event.stopPropagation()}><div className="row-actions"><button className="icon-button tiny" aria-label={`Editar ${item.nombre}`} onClick={() => openCreate('user', item)}><Settings2 size={15} /></button><button className="icon-button tiny danger-icon" aria-label={`Eliminar ${item.nombre}`} onClick={() => setDeleteTarget({ type: 'user', id: item.id })}><X size={15} /></button></div></td></tr>)}</tbody></table></div>{usersError && !usersPage ? <ErrorState message={usersError.message} onRetry={() => void reloadUsersPage()} /> : !usersLoading && userTotal === 0 && <EmptyState label="Todavía no hay usuarios" onCreate={() => openCreate('user')} />}{userTotal > 0 && <Pagination page={page} pages={totalPages} size={size} setPage={setPage} setSize={(value) => { setSize(value); setPage(1) }} total={userTotal} />}</div></section>}
        {view === 'Favoritos' && <section className="view-content"><div className="page-heading compact-heading"><div><p className="eyebrow">TU COLECCIÓN PERSONAL</p><h1>Favoritas, <em>para siempre.</em></h1><p className="page-subtitle">Una selección hecha solo para ti.</p></div>{demo ? <label className="user-select-wrap"><span>ESCUCHANDO COMO</span><select value={activeUser} onChange={(event) => chooseUser(Number(event.target.value))}>{users.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</select><ChevronDown size={15} /></label> : <div className="user-select-wrap"><span>ESCUCHANDO COMO</span><strong>{user?.nombre}</strong></div>}</div><div className="favorites-intro"><div className="favorite-big-icon"><Heart size={22} fill="currentColor" /></div><div><strong>{currentFavorites.length} <span>canciones favoritas</span></strong><p>Tu banda sonora personal, siempre a mano.</p></div><div className="favorite-wave" aria-hidden="true">{Array.from({ length: 30 }, (_, i) => <i key={i} style={{ height: `${12 + (i * 19 % 31)}px` }} />)}</div></div>{favoriteSongs.length === 0 ? <EmptyState label="Aún no tienes favoritos" onCreate={() => setView('Canciones')} /> : <><div className="favorite-cards">{visibleFavorites.map(({ favorite, song }, index) => song && <article className="favorite-card" key={favorite.id}><div className={`favorite-cover ${coverColors[index % coverColors.length]}`}><span className="cover-index">LPA — {String(index + 1).padStart(2, '0')}</span><Music2 size={32} /><button className="favorite-remove" aria-label="Quitar de favoritos" onClick={() => void removeFavorite(favorite)}><Heart size={16} fill="currentColor" /></button></div><div className="favorite-card-info"><span className="genre-chip">{song.genero}</span><strong>{song.titulo}</strong><span>{song.artista}</span><div className="favorite-card-bottom"><span>{song.album || 'Sencillo'}</span><span>{fmtTime(song.duracion)}</span></div></div></article>)}</div><Pagination page={page} pages={totalPages} size={size} setPage={setPage} setSize={(value) => { setSize(value); setPage(1) }} total={favoriteSongs.length} /></>}</section>}
        <footer className="page-footer"><span>HECHO PARA ESCUCHAR MEJOR</span><span>MÚSICA LPA2 <i>©</i> 2026</span></footer>
      </div>
    </main>
    {dialog && <FormDialog type={dialog} editing={editing} onClose={() => { setDialog(null); setEditing(null) }} onSubmit={dialog === 'song' ? saveSong : saveUser} />}
    {deleteTarget && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setDeleteTarget(null) }}><section className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title"><div className="confirm-icon"><X size={20} /></div><h2 id="confirm-title">¿Eliminar {deleteTarget.type === 'song' ? 'esta canción' : 'este usuario'}?</h2><p>Esta acción no se puede deshacer. También se eliminarán los favoritos asociados.</p><div className="dialog-actions"><button className="button-quiet" onClick={() => setDeleteTarget(null)}>Cancelar</button><button className="button-danger" onClick={() => void confirmDelete()}>Sí, eliminar</button></div></section></div>}
    {apiOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setApiOpen(false) }}><form className="form-dialog api-dialog" onSubmit={(event) => { event.preventDefault(); changeApi() }}><button type="button" className="modal-close icon-button" aria-label="Cerrar" onClick={() => setApiOpen(false)}><X size={18} /></button><div className="dialog-kicker">AJUSTES DE CONEXIÓN</div><h2>Configuración de la API</h2><p className="dialog-description">Conecta tu biblioteca con el servidor de Música LPA2.</p><label className="form-field"><span>URL base</span><input value={apiDraft} onChange={(event) => { setApiDraft(event.target.value); setConfigTest('idle') }} placeholder="http://localhost:8000" /></label><div className={`connection-result ${configTest}`}>{configTest === 'ok' ? <><Check size={15} /> Conexión establecida correctamente</> : configTest === 'fail' ? <><X size={15} /> No se pudo conectar con la API</> : 'La URL se guarda solo en este navegador.'}</div><div className="dialog-actions"><button type="button" className="button-quiet" onClick={() => void testApi()}>Probar conexión</button><button className="button-primary" type="submit">Guardar URL</button></div></form></div>}
    {selectedUser && <div className="modal-backdrop sheet-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedUser(null) }}><aside className="user-sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title"><button className="modal-close icon-button" aria-label="Cerrar panel" onClick={() => setSelectedUser(null)}><X size={18} /></button><div className="sheet-avatar">{selectedUser.nombre.split(' ').map((part) => part[0]).slice(0, 2).join('')}</div><p className="eyebrow">PERFIL DE USUARIO</p><h2 id="sheet-title">{selectedUser.nombre}</h2><p className="sheet-email">{selectedUser.correo}</p><div className="sheet-divider" /><div className="sheet-favorites-heading"><div><p className="eyebrow">SU COLECCIÓN</p><h3>Canciones favoritas</h3></div><span>{favorites.filter((favorite) => favorite.id_usuario === selectedUser.id).length}</span></div><div className="sheet-track-list">{favorites.filter((favorite) => favorite.id_usuario === selectedUser.id).map((favorite, index) => { const song = songs.find((item) => item.id === favorite.id_cancion); return song ? <div className="sheet-track" key={favorite.id}><span className={`mini-cover ${coverColors[index % coverColors.length]}`}><Music2 size={15} /></span><div><strong>{song.titulo}</strong><span>{song.artista}</span></div><small>{fmtTime(song.duracion)}</small></div> : null })}{favorites.filter((favorite) => favorite.id_usuario === selectedUser.id).length === 0 && <p className="sheet-empty">Todavía no ha guardado canciones.</p>}</div><div className="sheet-meta">Miembro desde {fmtDate(selectedUser.fecha_registro)}</div></aside></div>}
    {themeReady && <Toaster position="bottom-right" richColors closeButton />}
  </div>
}

function songErrors(song: { titulo: string; artista: string; album: string | null; duracion: number; año: number; genero: string }) {
  const errors: string[] = []
  if (!song.titulo.trim() || song.titulo.length > 200) errors.push('El título debe tener entre 1 y 200 caracteres')
  if (!song.artista.trim() || song.artista.length > 150) errors.push('El artista debe tener entre 1 y 150 caracteres')
  if ((song.album?.length || 0) > 200) errors.push('El álbum admite hasta 200 caracteres')
  if (!Number.isInteger(song.duracion) || song.duracion <= 0) errors.push('La duración debe ser un entero mayor que 0')
  if (!Number.isInteger(song.año) || song.año < 1900 || song.año > new Date().getFullYear()) errors.push('El año debe estar entre 1900 y el año actual')
  if (!song.genero.trim() || song.genero.length > 50) errors.push('El género debe tener entre 1 y 50 caracteres')
  return errors
}

function StatCard({ icon, label, value, detail, tint }: { icon: React.ReactNode; label: string; value: number; detail: string; tint: string }) {
  return <div className="stat-card"><div className={`stat-icon ${tint}`}>{icon}</div><div className="stat-copy"><div className="stat-label">{label}</div><div className="stat-value">{value.toLocaleString('es-ES')}</div><div className="stat-detail">{detail}</div></div><span className="stat-spark" aria-hidden="true">↗</span></div>
}
function SkeletonRows({ columns }: { columns: number }) { return <>{Array.from({ length: 4 }, (_, row) => <tr key={row} aria-hidden="true">{Array.from({ length: columns }, (_, col) => <td key={col}><span className="skeleton-bar" /></td>)}</tr>)}</> }
function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) { return <div className="empty-state"><div className="empty-art error-art"><X size={26} /></div><strong>No se pudieron cargar los datos</strong><p>{message}</p><button className="button-quiet small-button" onClick={onRetry}>Reintentar</button></div> }
function EmptyState({ label, onCreate }: { label: string; onCreate: () => void }) { return <div className="empty-state"><div className="empty-art"><Disc3 size={30} /><span>♪</span></div><strong>{label}</strong><p>Todo gran catálogo empieza con una canción.</p><button className="button-primary small-button" onClick={onCreate}><Plus size={15} /> Crear el primero</button></div> }
function Pagination({ page, pages, size, total, setPage, setSize }: { page: number; pages: number; size: number; total: number; setPage: (value: number) => void; setSize: (value: number) => void }) { return <div className="pagination"><span>Mostrando <b>{total ? Math.min((page - 1) * size + 1, total) : 0}–{Math.min(page * size, total)}</b> de <b>{total}</b></span><div className="pagination-controls"><label>Filas <select value={size} onChange={(event) => setSize(Number(event.target.value))}>{[5, 10, 20, 50].map((value) => <option key={value} value={value}>{value}</option>)}</select></label><button className="page-arrow" aria-label="Página anterior" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft size={16} /></button><span className="page-number">{page} <i>/</i> {pages}</span><button className="page-arrow" aria-label="Página siguiente" disabled={page >= pages} onClick={() => setPage(page + 1)}><ChevronRight size={16} /></button></div></div> }
function FormDialog({ type, editing, onClose, onSubmit }: { type: 'song' | 'user'; editing: Cancion | Usuario | null; onClose: () => void; onSubmit: (form: FormData) => void }) {
  const isSong = type === 'song'; const song = editing && 'titulo' in editing ? editing : null; const user = editing && 'correo' in editing && !('titulo' in editing) ? editing : null
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><form className="form-dialog" onSubmit={(event) => { event.preventDefault(); onSubmit(new FormData(event.currentTarget)) }}><button type="button" className="modal-close icon-button" aria-label="Cerrar" onClick={onClose}><X size={18} /></button><div className="dialog-kicker">{editing ? 'EDITAR' : 'AÑADIR A TU BIBLIOTECA'}</div><h2>{editing ? `Editar ${isSong ? 'canción' : 'usuario'}` : `Nueva ${isSong ? 'canción' : 'persona'}`}</h2><p className="dialog-description">{isSong ? 'Completa los detalles para añadirla a tu colección.' : 'Añade a alguien a la comunidad musical.'}</p>{isSong ? <><div className="form-grid"><label className="form-field full-field"><span>Título <i>*</i></span><input name="titulo" required maxLength={200} defaultValue={song?.titulo || ''} placeholder="Nombre de la canción" /></label><label className="form-field"><span>Artista <i>*</i></span><input name="artista" required maxLength={150} defaultValue={song?.artista || ''} placeholder="Nombre del artista" /></label><label className="form-field"><span>Álbum</span><input name="album" maxLength={200} defaultValue={song?.album || ''} placeholder="Nombre del álbum" /></label><label className="form-field"><span>Duración <i>*</i></span><input name="duracion" required defaultValue={song ? fmtTime(song.duracion) : ''} placeholder="mm:ss o segundos" /></label><label className="form-field"><span>Año <i>*</i></span><input name="año" type="number" required min={1900} max={new Date().getFullYear()} defaultValue={song?.año || ''} placeholder="2026" /></label><label className="form-field full-field"><span>Género <i>*</i></span><input name="genero" list="genre-options" required maxLength={50} defaultValue={song?.genero || ''} placeholder="Elige o escribe un género" /><datalist id="genre-options">{['Rock', 'Pop', 'Jazz', 'Salsa', 'Reggaetón', 'Electrónica', 'Clásica', 'Hip Hop'].map((item) => <option key={item} value={item} />)}</datalist></label></div></> : <div className="form-grid"><label className="form-field full-field"><span>Nombre <i>*</i></span><input name="nombre" required minLength={2} maxLength={100} defaultValue={user?.nombre || ''} placeholder="Nombre y apellidos" /></label><label className="form-field full-field"><span>Correo electrónico <i>*</i></span><input name="correo" type="email" required maxLength={150} defaultValue={user?.correo || ''} placeholder="persona@ejemplo.com" /></label></div>}<div className="dialog-actions"><button type="button" className="button-quiet" onClick={onClose}>Cancelar</button><button className="button-primary" type="submit"><Check size={16} /> {editing ? 'Guardar cambios' : 'Crear'}</button></div></form></div>
}
