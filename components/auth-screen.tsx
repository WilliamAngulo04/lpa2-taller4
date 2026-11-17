'use client'

import { useState } from 'react'
import { Disc3, Eye, EyeOff, LogIn, Sparkles, UserPlus } from 'lucide-react'
import { login, register, type Usuario } from '@/lib/api'

type Mode = 'login' | 'register'

export function AuthScreen({ onAuth, onDemo }: { onAuth: (user: Usuario) => void; onDemo: () => void }) {
  const [mode, setMode] = useState<Mode>('login')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const submit = async (form: FormData) => {
    const nombre = String(form.get('nombre') || '').trim()
    const correo = String(form.get('correo')).trim().toLowerCase()
    const password = String(form.get('password'))
    if (mode === 'register') {
      if (nombre.length < 2 || nombre.length > 100) return setError('El nombre debe tener entre 2 y 100 caracteres')
      if (password.length < 8 || password.length > 72) return setError('La contraseña debe tener entre 8 y 72 caracteres')
      if (password !== String(form.get('confirmar'))) return setError('Las contraseñas no coinciden')
    }
    setError(''); setSending(true)
    try {
      onAuth(mode === 'login' ? await login(correo, password) : await register(nombre, correo, password))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión')
    } finally { setSending(false) }
  }

  const switchMode = (next: Mode) => { setMode(next); setError(''); setShowPassword(false) }
  const toggle = <button type="button" className="password-toggle" aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={showPassword} onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>

  return <div className="auth-shell">
    <form className="form-dialog auth-card" onSubmit={(event) => { event.preventDefault(); void submit(new FormData(event.currentTarget)) }}>
      <div className="brand-lockup auth-brand"><div className="brand-mark"><Disc3 size={23} strokeWidth={1.8} /></div><div><strong>Música <span>LPA2</span></strong><small>Tu biblioteca, en orden</small></div></div>
      <div className="auth-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={mode === 'login'} className={mode === 'login' ? 'active' : ''} onClick={() => switchMode('login')}>Ingresar</button>
        <button type="button" role="tab" aria-selected={mode === 'register'} className={mode === 'register' ? 'active' : ''} onClick={() => switchMode('register')}>Registrarse</button>
      </div>
      <h2>{mode === 'login' ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}</h2>
      <p className="dialog-description">{mode === 'login' ? 'Ingresa con tu correo y contraseña para gestionar tu biblioteca.' : 'Regístrate para crear canciones y guardar tus favoritas.'}</p>
      <div className="form-grid">
        {mode === 'register' && <label className="form-field full-field"><span>Nombre <i>*</i></span><input name="nombre" required minLength={2} maxLength={100} autoComplete="name" placeholder="Nombre y apellidos" /></label>}
        <label className="form-field full-field"><span>Correo electrónico <i>*</i></span><input name="correo" type="email" required maxLength={150} autoComplete="email" placeholder="persona@ejemplo.com" /></label>
        <label className="form-field full-field"><span>Contraseña <i>*</i></span><div className="password-wrap"><input name="password" type={showPassword ? 'text' : 'password'} required minLength={mode === 'register' ? 8 : 1} maxLength={72} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} placeholder={mode === 'register' ? 'Mínimo 8 caracteres' : '••••••••'} />{toggle}</div></label>
        {mode === 'register' && <label className="form-field full-field"><span>Confirmar contraseña <i>*</i></span><div className="password-wrap"><input name="confirmar" type={showPassword ? 'text' : 'password'} required maxLength={72} autoComplete="new-password" placeholder="Repite la contraseña" />{toggle}</div></label>}
      </div>
      {error && <p className="auth-error" role="alert">{error}</p>}
      <button className="button-primary auth-submit" type="submit" disabled={sending}>{mode === 'login' ? <LogIn size={16} /> : <UserPlus size={16} />} {sending ? 'Un momento…' : mode === 'login' ? 'Ingresar' : 'Crear cuenta'}</button>
      <button type="button" className="text-link auth-demo" onClick={onDemo}><Sparkles size={14} /> Explorar en modo demostración</button>
    </form>
  </div>
}
