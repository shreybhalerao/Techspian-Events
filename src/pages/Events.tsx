import { useMemo, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useData } from '../data/DataProvider'
import { Page } from '../components/Layout'
import { ErrorNote, Sheet, Spinner } from '../components/ui'
import { IconPin, IconPlus } from '../components/Icons'
import type { EventInput, EventRow } from '../lib/types'
import { formatDateRange, todayKey } from '../lib/format'
import { setLastEvent } from '../lib/prefs'

export default function Events() {
  const { events, meetings } = useData()
  const [params, setParams] = useSearchParams()
  const [editing, setEditing] = useState<EventRow | 'new' | null>(params.get('new') ? 'new' : null)

  const counts = useMemo(() => {
    const c = new Map<string, { total: number; met: number }>()
    for (const m of meetings) {
      const x = c.get(m.event_id) ?? { total: 0, met: 0 }
      x.total++
      if (m.status === 'met') x.met++
      c.set(m.event_id, x)
    }
    return c
  }, [meetings])

  const today = todayKey()
  const phase = (e: EventRow) => {
    if (!e.start_date) return 'upcoming'
    const end = e.end_date ?? e.start_date
    if (end < today) return 'past'
    if (e.start_date <= today) return 'live'
    return 'upcoming'
  }
  const live = events.filter((e) => phase(e) === 'live')
  const upcoming = events.filter((e) => phase(e) === 'upcoming').reverse() // soonest first
  const past = events.filter((e) => phase(e) === 'past')

  function close() {
    setEditing(null)
    if (params.has('new')) setParams({}, { replace: true })
  }

  const section = (title: string, list: EventRow[]) =>
    list.length > 0 && (
      <section>
        <h2 className="mb-2 px-1 text-xs font-semibold tracking-wide text-muted uppercase">{title}</h2>
        <ul className="card divide-y divide-line overflow-hidden">
          {list.map((e) => {
            const c = counts.get(e.id)
            return (
              <li key={e.id} className="flex items-center">
                <Link to={`/?event=${e.id}`} onClick={() => setLastEvent(e.id)} className="min-w-0 flex-1 px-4 py-3.5 active:bg-surface-2">
                  <p className="truncate font-semibold">{e.name}</p>
                  <p className="mt-0.5 flex items-center gap-1 truncate text-sm text-muted">
                    {e.city && (
                      <>
                        <IconPin width={14} height={14} className="shrink-0" /> {e.city} ·{' '}
                      </>
                    )}
                    {formatDateRange(e.start_date, e.end_date) || 'No dates'}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {c ? `${c.total} meeting${c.total === 1 ? '' : 's'} · ${c.met} met` : 'No meetings yet'}
                  </p>
                </Link>
                <button className="mr-2 rounded-lg px-3 py-2 text-sm font-medium text-brand-deep hover:bg-surface-2" onClick={() => setEditing(e)}>
                  Edit
                </button>
              </li>
            )
          })}
        </ul>
      </section>
    )

  return (
    <Page
      title="Events"
      actions={
        <button className="rounded-full p-2 hover:bg-white/10" onClick={() => setEditing('new')} aria-label="Add event">
          <IconPlus />
        </button>
      }
    >
      <div className="space-y-5">
        {events.length === 0 && (
          <div className="card px-6 py-10 text-center">
            <p className="font-semibold">No events yet</p>
            <p className="mt-1 text-sm text-muted">Add the trade shows and conferences your team is attending.</p>
            <button className="btn-primary mt-4" onClick={() => setEditing('new')}>Add an event</button>
          </div>
        )}
        {section('Happening now', live)}
        {section('Upcoming', upcoming)}
        {section('Past', past)}
      </div>

      <Sheet open={editing !== null} title={editing === 'new' ? 'New event' : 'Edit event'} onClose={close}>
        {editing && <EventForm key={editing === 'new' ? 'new' : editing.id} event={editing === 'new' ? null : editing} onDone={close} />}
      </Sheet>
    </Page>
  )
}

function EventForm({ event, onDone }: { event: EventRow | null; onDone: () => void }) {
  const { createEvent, updateEvent, deleteEvent, meetings } = useData()
  const [form, setForm] = useState<EventInput>({
    name: event?.name ?? '',
    city: event?.city ?? '',
    start_date: event?.start_date ?? '',
    end_date: event?.end_date ?? '',
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const meetingCount = event ? meetings.filter((m) => m.event_id === event.id).length : 0

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    const clean: EventInput = {
      name: form.name.trim(),
      city: form.city?.trim() || null,
      start_date: form.start_date || null,
      end_date: form.end_date || form.start_date || null,
    }
    try {
      if (event) await updateEvent(event.id, clean)
      else await createEvent(clean)
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setBusy(false)
    }
  }

  async function onDelete() {
    if (!event || !window.confirm(`Delete “${event.name}”?`)) return
    setBusy(true)
    try {
      await deleteEvent(event.id)
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setBusy(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block">
        <span className="label">Event name *</span>
        <input
          className="input"
          required
          autoCapitalize="words"
          placeholder="e.g. ITB Berlin 2027"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </label>
      <label className="block">
        <span className="label">City</span>
        <input className="input" autoCapitalize="words" value={form.city ?? ''} onChange={(e) => setForm({ ...form, city: e.target.value })} />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="label">Start date</span>
          <input className="input" type="date" value={form.start_date ?? ''} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
        </label>
        <label className="block">
          <span className="label">End date</span>
          <input
            className="input"
            type="date"
            min={form.start_date || undefined}
            value={form.end_date ?? ''}
            onChange={(e) => setForm({ ...form, end_date: e.target.value })}
          />
        </label>
      </div>
      <ErrorNote>{error}</ErrorNote>
      <button className="btn-primary w-full" disabled={busy || !form.name.trim()}>
        {busy ? <Spinner /> : event ? 'Save changes' : 'Add event'}
      </button>
      {event && (
        <>
          <button type="button" className="btn-danger w-full" onClick={onDelete} disabled={busy || meetingCount > 0}>
            Delete event
          </button>
          {meetingCount > 0 && (
            <p className="text-center text-xs text-muted">
              Has {meetingCount} meeting{meetingCount === 1 ? '' : 's'}, so it can’t be deleted.
            </p>
          )}
        </>
      )}
    </form>
  )
}
