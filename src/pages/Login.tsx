import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { friendlyAuthError } from '../auth/AuthProvider'
import { ErrorNote, Spinner } from '../components/ui'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [forgot, setForgot] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password })
    setBusy(false)
    if (error) setError(friendlyAuthError(error.message))
    // On success, AuthProvider picks up the new session and the app opens.
  }

  return (
    <div className="flex min-h-dvh flex-col bg-ink px-6 pt-[max(4rem,env(safe-area-inset-top))] pb-10 text-white">
      <div className="mx-auto w-full max-w-sm flex-1">
        <img src="/techspian-mark-512.png" alt="Techspian" className="mb-8 size-14 rounded-xl" />
        <h1 className="text-3xl font-semibold tracking-tight">Event Meetings</h1>
        <p className="mt-2 text-white/60">Log and track the meetings you book at travel-industry events.</p>

        <form onSubmit={onSubmit} className="mt-10 space-y-4 rounded-3xl bg-white p-5 text-ink">
          <div>
            <label htmlFor="email" className="label">Work email</label>
            <input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="username"
              autoCapitalize="none"
              required
              className="input"
              placeholder="you@techspian.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="password" className="label">Password</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                className="input pr-16"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute top-1/2 right-2 -translate-y-1/2 rounded-lg px-2 py-1 text-sm font-medium text-muted"
                onClick={() => setShowPassword((s) => !s)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
          <ErrorNote>{error}</ErrorNote>
          <button className="btn-primary w-full" disabled={busy || !email || !password}>
            {busy ? <Spinner /> : 'Sign in'}
          </button>
          <button type="button" className="w-full text-sm font-medium text-muted" onClick={() => setForgot((f) => !f)}>
            Forgot password?
          </button>
          {forgot && (
            <p className="rounded-xl bg-surface-2 px-3.5 py-2.5 text-sm text-muted">
              Ask your Techspian admin to reset it. Once you’re signed in you can change it under Account.
            </p>
          )}
        </form>
      </div>
      <p className="mx-auto mt-8 max-w-sm text-center text-xs text-white/40">Techspian team members only.</p>
    </div>
  )
}
