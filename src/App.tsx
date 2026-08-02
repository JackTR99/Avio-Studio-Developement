import { type ReactNode } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './auth/AuthContext'
import { isSupabaseConfigured } from './lib/supabase'
import AppShell from './components/AppShell'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Siteler from './pages/Siteler'
import Analytics from './pages/Analytics'
import Raporlar from './pages/Raporlar'
import Ayarlar from './pages/Ayarlar'

function FullScreenLoader() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-slate-50">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-brand" />
    </div>
  )
}

/**
 * Oturum koruması.
 * TASLAK MODU: Supabase ayarı yoksa giriş atlanır, ekranlar doğrudan açılır.
 * Gerçek sisteme geçince (.env dolunca) giriş ekranı kendiliğinden devreye girer.
 */
function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth()
  const location = useLocation()

  if (!isSupabaseConfigured) return <>{children}</>
  if (loading) return <FullScreenLoader />
  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/siteler" element={<Siteler />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/raporlar" element={<Raporlar />} />
        <Route path="/ayarlar" element={<Ayarlar />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
