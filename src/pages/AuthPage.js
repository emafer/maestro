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
    <div style={s.root}>
      <div style={s.bg}/>
      <div style={s.card}>
        <div style={s.logo}>
          <span style={s.logoIcon}>♩</span>
          <div>
            <div style={s.logoTitle}>Maestro</div>
            <div style={s.logoSub}>Registro Musicale</div>
          </div>
        </div>

        <div style={s.tabs}>
          {[['login','Accedi'],['register','Registrati']].map(([k,l]) => (
            <button key={k} style={{...s.tab,...(mode===k?s.tabActive:{})}}
              onClick={() => { setMode(k); setError(''); setInfo('') }}>{l}</button>
          ))}
        </div>

        {mode === 'forgot' && (
          <p style={s.forgotTitle}>Recupero password</p>
        )}

        <form onSubmit={handle} style={s.form}>
          {mode === 'register' && (
            <div style={s.field}>
              <label style={s.label}>Nome completo</label>
              <input style={s.input} type="text" value={name}
                onChange={e => setName(e.target.value)} placeholder="Mario Rossi" required/>
            </div>
          )}
          <div style={s.field}>
            <label style={s.label}>Email</label>
            <input style={s.input} type="email" value={email}
              onChange={e => setEmail(e.target.value)} placeholder="docente@email.it" required/>
          </div>
          {mode !== 'forgot' && (
            <div style={s.field}>
              <label style={s.label}>Password</label>
              <input style={s.input} type="password" value={password}
                onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={6}/>
            </div>
          )}

          {error && <div style={s.error}>{error}</div>}
          {info  && <div style={s.info}>{info}</div>}

          <button style={s.submitBtn} type="submit" disabled={loading}>
            {loading ? '...' : mode === 'login' ? 'Accedi' : mode === 'register' ? 'Crea account' : 'Invia email di reset'}
          </button>

          {mode === 'login' && (
            <button type="button" style={s.linkBtn}
              onClick={() => { setMode('forgot'); setError(''); setInfo('') }}>
              Password dimenticata?
            </button>
          )}
          {mode === 'forgot' && (
            <button type="button" style={s.linkBtn} onClick={() => setMode('login')}>
              ← Torna al login
            </button>
          )}
        </form>
      </div>
    </div>
  )
}

const s = {
  root: { minHeight:'100vh', background:'#0f0f13', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Crimson Pro', Georgia, serif", position:'relative' },
  bg: { position:'fixed', inset:0, backgroundImage:`radial-gradient(ellipse 80% 50% at 50% -10%, #E8A83818 0%, transparent 70%)`, pointerEvents:'none' },
  card: { background:'#16161f', border:'1px solid #252535', borderRadius:20, padding:'40px 36px', width:'min(400px,92vw)', position:'relative', zIndex:1, boxShadow:'0 32px 80px #000a' },
  logo: { display:'flex', alignItems:'center', gap:14, marginBottom:28 },
  logoIcon: { fontSize:44, color:'#E8A838', lineHeight:1 },
  logoTitle: { fontWeight:800, fontSize:24, color:'#f0f0f0', letterSpacing:.5 },
  logoSub: { fontSize:12, color:'#555', letterSpacing:2, textTransform:'uppercase' },
  tabs: { display:'flex', background:'#0f0f13', borderRadius:10, border:'1px solid #2a2a3a', marginBottom:24, overflow:'hidden' },
  tab: { flex:1, padding:'10px', background:'none', border:'none', color:'#666', cursor:'pointer', fontSize:15, fontFamily:'inherit', transition:'all .15s' },
  tabActive: { background:'#E8A83818', color:'#E8A838', fontWeight:700 },
  forgotTitle: { color:'#E8A838', fontWeight:700, marginBottom:16, fontSize:16 },
  form: { display:'flex', flexDirection:'column', gap:14 },
  field: { display:'flex', flexDirection:'column', gap:6 },
  label: { fontSize:12, color:'#666', letterSpacing:.5, textTransform:'uppercase' },
  input: { background:'#0f0f13', border:'1px solid #2a2a3a', borderRadius:8, padding:'10px 14px', color:'#e0e0e0', fontSize:15, fontFamily:'inherit', outline:'none' },
  submitBtn: { background:'#E8A838', color:'#000', border:'none', borderRadius:10, padding:'12px', fontWeight:800, fontSize:16, cursor:'pointer', marginTop:6, fontFamily:'inherit' },
  linkBtn: { background:'none', border:'none', color:'#5B8DD9', cursor:'pointer', fontSize:13, fontFamily:'inherit', textAlign:'center', padding:'4px' },
  error: { background:'#E8585818', border:'1px solid #E85858', borderRadius:8, padding:'10px 12px', color:'#E85858', fontSize:13 },
  info:  { background:'#52C07A18', border:'1px solid #52C07A', borderRadius:8, padding:'10px 12px', color:'#52C07A', fontSize:13 },
}
