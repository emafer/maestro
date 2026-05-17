import { useAuth } from './lib/AuthContext'
import AuthPage from './pages/AuthPage'
import AppPage from './pages/AppPage'

export default function Root() {
  const { user, loading } = useAuth()

  if (loading) return (
    <div style={{minHeight:'100vh',background:'#0f0f13',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Georgia,serif',color:'#E8A838',fontSize:32}}>
      ♩
    </div>
  )

  return user ? <AppPage /> : <AuthPage />
}
