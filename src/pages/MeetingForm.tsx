import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useData } from '../data/DataProvider'
import { Page } from '../components/Layout'
import { ErrorNote, Spinner } from '../components/ui'
import { INTEREST_LEVELS, STATUSES, type EventRow, type MeetingInput } from '../lib/types'
import { INTEREST_LABEL, STATUS_LABEL, fromLocalInput, memberName, toLocalInput, todayKey } from '../lib/format'
import { getLastEvent, setLastEvent } from '../lib/prefs'

/** Event happening today, else the one last used on this phone, else the newest. */
function defaultEventId(events: EventRow[], fromUrl: string | null) {
  if (fromUrl && events.some((e) => e.id === fromUrl)) return fromUrl
  const today = todayKey()
  const live = events.find((e) => e.start_date && e.start_date <= today && (e.end_date ?? e.start_date) >= today)
  if (live) return live.id
  const last = getLastEvent()
  if (last && events.some((e) => e.id === last)) return last
  return events[0]?.id ?? ''
}

export default function MeetingForm() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { meetings, events, team, userId, createMeeting, updateMeeting } = useData()
  const existing = id ? meetings.find((m) => m.id === id) : undefined

  const [form, setForm] = useState<MeetingInput>(() =>
    existing
      ? {
          event_id: existing.event_id,
          company: existing.company,
          contact_name: existing.contact_name,
          designation: existing.designation,
          email: existing.email,
          phone: existing.phone,
          meeting_datetime: existing.meeting_datetime,
          booked_by: existing.booked_by,
          status: existing.status,
          interest_level: existing.interest_level,
          notes: existing.notes,
        }
      : {
          event_id: defaultEventId(events, params.get('event')),
          company: '',
          contact_name: null,
          designation: null,
          email: null,
          phone: null,
          meeting_datetime: null,
          booked_by: userId,
          status: 'booked',
          interest_level: null,
          notes: null,
        },
  )
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (id && !existing) {
    return (
      <Page title="Meeting" back hideNav>
        <p className="text-muted">This meeting no longer exists.</p>
      </Page>
    )
  }

  if (events.length === 0) {
    return (
      <Page title="New meeting" back hideNav>
        <div className="card p-6 text-center">
          <p className="font-semibold">Add an event first</p>
          <p className="mt-1 text-sm text-muted">Every meeting belongs to an event.</p>
          <Link to="/events?new=1" className="btn-primary mt-4">Add an event</Link>
        </div>
      </Page>
    )
  }

  const set = <K extends keyof MeetingInput>(key: K, value: MeetingInput[K]) => setForm((f) => ({ ...f, [key]: value }))
  // Text inputs: store empty as null so the database stays clean.
  const text = (key: 'contact_name' | 'designation' | 'email' | 'phone' | 'notes') => ({
    value: form[key] ?? '',
    onChange: (e: { target: { value: string } }) => set(key, e.target.value === '' ? null : e.target.value),
  })

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    const clean: MeetingInput = {
      ...form,
      company: form.company.trim(),
      email: form.email?.trim().toLowerCase() || null,
      phone: form.phone?.trim() || null,
      contact_name: form.contact_name?.trim() || null,
      designation: form.designation?.trim() || null,
      notes: form.notes?.trim() || null,
    }
    try {
      const saved = existing ? await updateMeeting(existing.id, clean) : await createMeeting(clean)
      setLastEvent(saved.event_id)
      navigate(`/meetings/${saved.id}`, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setBusy(false)
    }
  }

  const assignable = team.filter((t) => t.user_id)

  return (
    <Page title={existing ? 'Edit meeting' : 'New meeting'} back hideNav>
      <form onSubmit={onSubmit} className="space-y-5">
        <Section title="Event">
          <select className="input" value={form.event_id} onChange={(e) => set('event_id', e.target.value)} required>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>{ev.name}{ev.city ? ` · ${ev.city}` : ''}</option>
            ))}
          </select>
        </Section>

        <Section title="Contact">
          <Field label="Company *">
            <input className="input" required autoCapitalize="words" value={form.company} onChange={(e) => set('company', e.target.value)} />
          </Field>
          <Field label="Contact name">
            <input className="input" autoCapitalize="words" autoComplete="off" {...text('contact_name')} />
          </Field>
          <Field label="Designation">
            <input className="input" autoCapitalize="words" {...text('designation')} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email">
              <input className="input" type="email" inputMode="email" autoCapitalize="none" autoComplete="off" {...text('email')} />
            </Field>
            <Field label="Phone">
              <input className="input" type="tel" inputMode="tel" autoComplete="off" {...text('phone')} />
            </Field>
          </div>
        </Section>

        <Section title="Meeting">
          <Field label="Date & time">
            <input
              className="input"
              type="datetime-local"
              value={toLocalInput(form.meeting_datetime)}
              onChange={(e) => set('meeting_datetime', fromLocalInput(e.target.value))}
            />
          </Field>
          <Field label="Status" group>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => set('status', s)}
                  className={`chip py-2 ${form.status === s ? 'border-ink bg-ink text-white' : 'border-line bg-white'}`}
                >
                  {STATUS_LABEL[s]}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Interest level" group>
            <div className="grid grid-cols-4 gap-2">
              {[null, ...INTEREST_LEVELS].map((lvl) => (
                <button
                  type="button"
                  key={lvl ?? 'none'}
                  onClick={() => set('interest_level', lvl)}
                  className={`chip justify-center py-2 ${form.interest_level === lvl ? 'border-ink bg-ink text-white' : 'border-line bg-white'}`}
                >
                  {lvl ? INTEREST_LABEL[lvl] : '—'}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Booked by">
            <select className="input" value={form.booked_by ?? ''} onChange={(e) => set('booked_by', e.target.value || null)}>
              {!form.booked_by && <option value="">—</option>}
              {assignable.map((t) => (
                <option key={t.user_id} value={t.user_id!}>
                  {memberName(t)}{t.user_id === userId ? ' (me)' : ''}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Notes">
            <textarea className="input min-h-28" rows={4} {...text('notes')} />
          </Field>
        </Section>

        <ErrorNote>{error}</ErrorNote>

        <div className="sticky bottom-0 -mx-4 border-t border-line bg-surface-2/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur">
          <button className="btn-primary w-full" disabled={busy || !form.company.trim() || !form.event_id}>
            {busy ? <Spinner /> : existing ? 'Save changes' : 'Save meeting'}
          </button>
        </div>
      </form>
    </Page>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-4">
      <legend className="mb-2 px-1 text-xs font-semibold tracking-wide text-muted uppercase">{title}</legend>
      {children}
    </fieldset>
  )
}

function Field({ label, group, children }: { label: string; group?: boolean; children: ReactNode }) {
  // Button groups must not sit inside a <label>, or tapping the label presses the first button.
  const Tag = group ? 'div' : 'label'
  return (
    <Tag className="block" role={group ? 'group' : undefined} aria-label={group ? label : undefined}>
      <span className="label">{label}</span>
      {children}
    </Tag>
  )
}
