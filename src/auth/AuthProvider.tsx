import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthState {
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      setLoading(false)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return <AuthContext.Provider value={{ session, loading, signOut }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

/** Turns Supabase auth errors into something a salesperson can act on. */
export function friendlyAuthError(message: string) {
  const m = message.toLowerCase()
  if (m.includes('invalid login credentials')) return 'Wrong email or password.'
  if (m.includes('email not confirmed'))
    return 'This account isn’t confirmed yet. Ask your admin to tick “Auto Confirm User” or confirm it in Supabase.'
  if (m.includes('rate limit') || m.includes('too many'))
    return 'Too many attempts. Please wait a minute and try again.'
  if (m.includes('should be different')) return 'The new password must be different from the current one.'
  if (m.includes('weak') || m.includes('at least')) return 'That password is too short or too simple. Use at least 8 characters.'
  if (m.includes('fetch')) return 'Can’t reach the server. Check your internet connection.'
  return message
}
