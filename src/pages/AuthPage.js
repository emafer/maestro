import { useState } from 'react'
import { useAuth } from '../lib/AuthContext'

export default function AuthPage() {
  const { signIn, signUp, resetPassword } = useAuth()
  const [mode, setMode] = useState('login') // login | register | forgot
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)

  const handle = async (e) => {
    e.preventDefault()
    setError(''); setInfo(''); setLoading(true)
    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password)
        if (error) setError(error.message)
      } else if (mode === 'register') {
        const { error } = await signUp(email, password)
        if (error) setError(error.message)
        else setInfo('Controlla la tua email per confermare la registrazione.')
      } else {
        const { error } = await resetPassword(email)
        if (error) setError(error.message)
        else setInfo('Email di reset inviata! Controlla la tua casella.')
      }
    } finally { setLoading(false) }
  }

  return (
    <div className="auth-root">
      <div className="auth-bg"/>
      <div className="auth-card">
        <div className="auth-logo">
          <span className="auth-logo-icon">♩</span>
          <div>
            <div className="auth-logo-title">Maestro</div>
            <div className="auth-logo-sub">Registro Musicale</div>
          </div>
        </div>

        <div className="auth-tabs">
          {[['login','Accedi'],['register','Registrati']].map(([k,l]) => (
            <button key={k} className={`auth-tab ${mode===k?'active':''}`}
              onClick={() => { setMode(k); setError(''); setInfo('') }}>{l}</button>
          ))}
        </div>

        {mode === 'forgot' && (
          <p className="auth-forgot-title">Recupero password</p>
        )}

        <form onSubmit={handle} className="auth-form">
          {mode === 'register' && (
            <div className="auth-field">
              <label className="label">Nome completo</label>
              <input className="auth-input" type="text" value={name}
                onChange={e => setName(e.target.value)} placeholder="Mario Rossi" required/>
            </div>
          )}
          <div className="auth-field">
            <label className="label">Email</label>
            <input className="auth-input" type="email" value={email}
              onChange={e => setEmail(e.target.value)} placeholder="docente@email.it" required/>
          </div>
          {mode !== 'forgot' && (
            <div className="auth-field">
              <label className="label">Password</label>
              <input className="auth-input" type="password" value={password}
                onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={6}/>
            </div>
          )}

          {error && <div className="auth-error">{error}</div>}
          {info  && <div className="auth-info">{info}</div>}

          <button className="auth-submit-btn" type="submit" disabled={loading}>
            {loading ? '...' : mode === 'login' ? 'Accedi' : mode === 'register' ? 'Crea account' : 'Invia email di reset'}
          </button>

          {mode === 'login' && (
            <button type="button" className="auth-link-btn"
              onClick={() => { setMode('forgot'); setError(''); setInfo('') }}>
              Password dimenticata?
            </button>
          )}
          {mode === 'forgot' && (
            <button type="button" className="auth-link-btn" onClick={() => setMode('login')}>
              ← Torna al login
            </button>
          )}
        </form>
      </div>
    </div>
  )
}
