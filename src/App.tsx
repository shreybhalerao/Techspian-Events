import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthProvider'
import { DataProvider, useData } from './data/DataProvider'
import { isConfigured } from './lib/supabase'
import { FullScreenMessage, Spinner } from './components/ui'
import Login from './pages/Login'
import MeetingsList from './pages/MeetingsList'
import MeetingDetail from './pages/MeetingDetail'
import MeetingForm from './pages/MeetingForm'
import Events from './pages/Events'
import Settings from './pages/Settings'

export default function App() {
  if (!isConfigured) {
    return (
      <FullScreenMessage>
        <h1 className="text-xl font-semibold">Supabase isn’t connected yet</h1>
        <p className="max-w-sm text-muted">
          Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> (see the README), then rebuild.
        </p>
      </FullScreenMessage>
    )
  }
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  )
}

function Gate() {
  const { session, loading } = useAuth()
  if (loading) {
    return (
      <FullScreenMessage>
        <Spinner className="text-brand" />
      </FullScreenMessage>
    )
  }
  if (!session) return <Login />
  return (
    <DataProvider key={session.user.id} userId={session.user.id} email={session.user.email ?? ''}>
      <Ready />
    </DataProvider>
  )
}

function Ready() {
  const { loading, error, notOnTeam, refresh } = useData()
  const { signOut } = useAuth()

  if (loading) {
    return (
      <FullScreenMessage>
        <Spinner className="text-brand" />
        <p className="text-sm text-muted">Loading meetings…</p>
      </FullScreenMessage>
    )
  }
  if (error) {
    return (
      <FullScreenMessage>
        <h1 className="text-lg font-semibold">Couldn’t load data</h1>
        <p className="max-w-sm text-sm text-muted">{error}</p>
        <button className="btn-primary" onClick={refresh}>Try again</button>
      </FullScreenMessage>
    )
  }
  if (notOnTeam) {
    return (
      <FullScreenMessage>
        <h1 className="text-lg font-semibold">No access</h1>
        <p className="max-w-sm text-sm text-muted">
          You’re signed in, but this email isn’t on the Techspian team list. Ask your admin to add you.
        </p>
        <button className="btn-ghost" onClick={signOut}>Sign out</button>
      </FullScreenMessage>
    )
  }

  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<MeetingsList />} />
        <Route path="/meetings/new" element={<MeetingForm key="new" />} />
        <Route path="/meetings/:id" element={<MeetingDetail />} />
        <Route path="/meetings/:id/edit" element={<MeetingForm />} />
        <Route path="/events" element={<Events />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

/** New screen = start at the top (filters changing the query string don't count). */
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}
