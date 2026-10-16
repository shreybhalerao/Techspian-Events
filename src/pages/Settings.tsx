import { useState, type FormEvent } from 'react'
import { friendlyAuthError, useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabase'
import { ErrorNote, Spinner } from '../components/ui'
import { useData } from '../data/DataProvider'
import { Page } from '../components/Layout'
import { initials, memberName } from '../lib/format'

export default function Settings() {
  const { signOut } = useAuth()
  const { me, team } = useData()
  const myName = memberName(me ?? undefined)

  return (
    <Page title="Account" back>
      <div className="space-y-4">
        <div className="card flex items-center gap-4 p-5">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand text-lg font-bold text-white">
            {initials(myName)}
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold">{myName}</p>
            <p className="truncate text-sm text-muted">{me?.email}</p>
          </div>
        </div>

        <div className="card p-4">
          <p className="label">Team ({team.length})</p>
          <ul className="space-y-2">
            {team.map((t) => (
              <li key={t.email} className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate">{memberName(t)}</span>
                <span className="shrink-0 text-xs text-muted">{t.user_id ? 'Active' : 'Not signed in yet'}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted">Admins add teammates in Supabase → Table Editor → team_members.</p>
        </div>

        <ChangePassword />

        <button className="btn-ghost w-full" onClick={signOut}>Sign out</button>
      </div>
    </Page>
  )
}

function ChangePassword() {
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (password !== confirm) return setError('The two passwords don’t match.')
    setBusy(true)
    setError('')
    const { error } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (error) return setError(friendlyAuthError(error.message))
    setDone(true)
    setOpen(false)
    setPassword('')
    setConfirm('')
  }

  if (!open) {
    return (
      <div className="card flex items-center justify-between gap-3 p-4">
        <p className="text-sm">{done ? 'Password changed.' : 'Password'}</p>
        <button className="text-sm font-semibold text-brand-deep" onClick={() => { setOpen(true); setDone(false) }}>
          Change password
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4 p-4">
      <label className="block">
        <span className="label">New password</span>
        <input className="input" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>
      <label className="block">
        <span className="label">Repeat new password</span>
        <input className="input" type="password" autoComplete="new-password" minLength={8} required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      </label>
      <ErrorNote>{error}</ErrorNote>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" className="btn-ghost" onClick={() => { setOpen(false); setError('') }}>Cancel</button>
        <button className="btn-primary" disabled={busy || password.length < 8}>{busy ? <Spinner /> : 'Save'}</button>
      </div>
    </form>
  )
}
