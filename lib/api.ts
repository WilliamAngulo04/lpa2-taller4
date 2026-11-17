export type Usuario = { id: number; nombre: string; correo: string; fecha_registro: string }
export type Cancion = { id: number; titulo: string; artista: string; album: string | null; duracion: number; año: number; genero: string; fecha_creacion: string }
export type Favorito = { id: number; id_usuario: number; id_cancion: number; fecha_marcado: string }
export type Pagina<T> = { total: number; pagina: number; tamaño: number; paginas: number; items: T[] }
export type Health = { status: string; database: string; uptime_segundos: number; version: string }

export const demoUsuarios: Usuario[] = [
  { id: 1, nombre: 'Ana Pérez', correo: 'ana@example.com', fecha_registro: '2026-10-28T10:20:00Z' },
  { id: 2, nombre: 'Diego Martín', correo: 'diego@example.com', fecha_registro: '2026-10-22T12:00:00Z' },
  { id: 3, nombre: 'Lucía Torres', correo: 'lucia@example.com', fecha_registro: '2026-10-18T09:30:00Z' },
  { id: 4, nombre: 'Mateo Díaz', correo: 'mateo@example.com', fecha_registro: '2026-10-12T15:10:00Z' },
  { id: 5, nombre: 'Sofía Herrera', correo: 'sofia@example.com', fecha_registro: '2026-10-04T08:00:00Z' },
]
export const demoCanciones: Cancion[] = [
  { id: 1, titulo: 'Dreams', artista: 'Fleetwood Mac', album: 'Rumours', duracion: 257, año: 1977, genero: 'Rock', fecha_creacion: '2026-11-16T18:40:00Z' },
  { id: 2, titulo: 'Eres', artista: 'Café Tacvba', album: 'Cuatro Caminos', duracion: 271, año: 2003, genero: 'Rock', fecha_creacion: '2026-11-15T16:00:00Z' },
  { id: 3, titulo: 'La vida es un carnaval', artista: 'Celia Cruz', album: 'Mi vida es cantar', duracion: 285, año: 1998, genero: 'Salsa', fecha_creacion: '2026-11-14T11:20:00Z' },
  { id: 4, titulo: 'Tadow', artista: 'Masego, FKJ', album: 'Lady Lady', duracion: 313, año: 2018, genero: 'Jazz', fecha_creacion: '2026-11-13T14:00:00Z' },
  { id: 5, titulo: 'telepatía', artista: 'Kali Uchis', album: 'Sin miedo', duracion: 160, año: 2020, genero: 'Pop', fecha_creacion: '2026-11-12T12:30:00Z' },
  { id: 6, titulo: 'Ojos color sol', artista: 'Calle 13, Silvio Rodríguez', album: 'Multi_Viral', duracion: 218, año: 2014, genero: 'Pop', fecha_creacion: '2026-11-11T15:30:00Z' },
  { id: 7, titulo: 'Midnight City', artista: 'M83', album: 'Hurry Up, We’re Dreaming', duracion: 244, año: 2011, genero: 'Electrónica', fecha_creacion: '2026-11-10T10:00:00Z' },
  { id: 8, titulo: 'Disfruto', artista: 'Carla Morrison', album: 'Déjenme llorar', duracion: 245, año: 2012, genero: 'Pop', fecha_creacion: '2026-11-09T16:30:00Z' },
  { id: 9, titulo: 'Todo de ti', artista: 'Rauw Alejandro', album: 'Vice Versa', duracion: 199, año: 2021, genero: 'Reggaetón', fecha_creacion: '2026-11-08T09:15:00Z' },
  { id: 10, titulo: 'Clair de Lune', artista: 'Claude Debussy', album: 'Suite bergamasque', duracion: 300, año: 1905, genero: 'Clásica', fecha_creacion: '2026-11-07T13:00:00Z' },
]
export const demoFavoritos: Favorito[] = [
  { id: 1, id_usuario: 1, id_cancion: 1, fecha_marcado: '2026-11-16T10:00:00Z' },
  { id: 2, id_usuario: 1, id_cancion: 4, fecha_marcado: '2026-11-15T12:00:00Z' },
  { id: 3, id_usuario: 1, id_cancion: 7, fecha_marcado: '2026-11-14T12:00:00Z' },
  { id: 4, id_usuario: 2, id_cancion: 2, fecha_marcado: '2026-11-12T12:00:00Z' },
  { id: 5, id_usuario: 3, id_cancion: 3, fecha_marcado: '2026-11-11T12:00:00Z' },
]

let base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
export function setApiBase(value: string) { base = value.replace(/\/$/, '') }
export function getApiBase() { return base }

// Token OAuth2 (Bearer) guardado en el navegador
const TOKEN_KEY = 'musica-lpa-token'
export const LOGOUT_EVENT = 'musica-lpa-logout'
export function getToken() { try { return localStorage.getItem(TOKEN_KEY) } catch { return null } }
export function setToken(token: string | null) { try { if (token) localStorage.setItem(TOKEN_KEY, token); else localStorage.removeItem(TOKEN_KEY) } catch {} }

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  const token = getToken()
  try {
    response = await fetch(`${base}${path}`, { ...init, credentials: 'omit', headers: { ...(typeof init?.body === 'string' ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init?.headers } })
  } catch {
    throw new Error('No se pudo conectar con la API')
  }
  if (response.status === 401 && token && path !== '/api/auth/token') {
    setToken(null)
    window.dispatchEvent(new Event(LOGOUT_EVENT))
  }
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    const detail = payload.detail
    if (Array.isArray(detail)) throw Object.assign(new Error(detail.map((item: { msg: string }) => item.msg).join('. ')), { fields: detail })
    throw new Error(typeof detail === 'string' ? detail : `Error ${response.status}`)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}
// Flujo de contraseña de OAuth2: el correo va en el campo username
export async function login(correo: string, password: string) {
  const { access_token } = await api<{ access_token: string; token_type: string }>('/api/auth/token', { method: 'POST', body: new URLSearchParams({ username: correo, password }) })
  setToken(access_token)
  return api<Usuario>('/api/auth/me')
}
export async function register(nombre: string, correo: string, password: string) {
  await api<Usuario>('/api/auth/registro', { method: 'POST', body: JSON.stringify({ nombre, correo, password }) })
  return login(correo, password)
}
export const pageQuery =(page: number, size: number) => `pagina=${page}&tamaño=${size}`
