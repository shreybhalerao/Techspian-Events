import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useData } from '../data/DataProvider'
import { Page } from '../components/Layout'
import { StatusBadge } from '../components/ui'
import { IconRefresh, IconSearch, IconX } from '../components/Icons'
import { STATUSES, type Meeting, type MeetingStatus } from '../lib/types'
import { INTEREST_DOT, STATUS_LABEL, dayKey, formatDay, formatTime, initials, memberName, todayKey } from '../lib/format'
import { getLastEvent, setLastEvent } from '../lib/prefs'

export default function MeetingsList() {
  const { meetings, events, team, userId, refresh } = useData()
  const [params, setParams] = useSearchParams()
  const [refreshing, setRefreshing] = useState(false)

  const eventId = params.get('event') ?? ''
  const status = (params.get('status') ?? '') as MeetingStatus | ''
  const by = params.get('by') ?? ''
  const q = params.get('q') ?? ''

  // Open on the event the user last looked at.
  useEffect(() => {
    if (params.has('event')) return
    const last = getLastEvent()
    if (last && events.some((e) => e.id === last)) {
      const next = new URLSearchParams(params)
      next.set('event', last)
      setParams(next, { replace: true })
    }
  }, [events, params, setParams])

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params)
    if (key === 'event') {
      setLastEvent(value)
      next.set('event', value) // keep empty value so "All events" sticks
    } else if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  const byUser = by === 'me' ? userId : by

  // Everything except the status filter, so the chips can show counts.
  const baseFiltered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return meetings.filter((m) => {
      if (eventId && m.event_id !== eventId) return false
      if (byUser && m.booked_by !== byUser) return false
      if (needle) {
        const hay = [m.company, m.contact_name, m.designation, m.email, m.phone, m.notes].join(' ').toLowerCase()
        if (!hay.includes(needle)) return false
      }
      return true
    })
  }, [meetings, eventId, byUser, q])

  const counts = useMemo(() => {
    const c = Object.fromEntries(STATUSES.map((s) => [s, 0])) as Record<MeetingStatus, number>
    baseFiltered.forEach((m) => c[m.status]++)
    return c
  }, [baseFiltered])

  const visible = useMemo(() => (status ? baseFiltered.filter((m) => m.status === status) : baseFiltered), [baseFiltered, status])
  const groups = useMemo(() => groupByDay(visible), [visible])

  const eventName = (id: string) => events.find((e) => e.id === id)?.name ?? ''
  const teamByUser = useMemo(() => new Map(team.filter((t) => t.user_id).map((t) => [t.user_id!, t])), [team])
  const filtersActive = Boolean(eventId || status || by || q)

  async function onRefresh() {
    setRefreshing(true)
    await refresh()
    setRefreshing(false)
  }

  return (
    <Page
      title="Meetings"
      actions={
        <button className="rounded-full p-2 hover:bg-white/10" onClick={onRefresh} aria-label="Refresh">
          <IconRefresh className={refreshing ? 'animate-spin' : ''} />
        </button>
      }
    >
      {/* Search */}
      <div className="relative">
        <IconSearch className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted" width={18} height={18} />
        <input
          type="search"
          className="input pl-10"
          placeholder="Search company, name, email…"
          value={q}
          onChange={(e) => setParam('q', e.target.value)}
        />
      </div>

      {/* Event + booked-by */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <select className="input py-2.5" value={eventId} onChange={(e) => setParam('event', e.target.value)} aria-label="Event">
          <option value="">All events</option>
          {events.map((e) => (
            <option key={e.id} value={e.id}>{e.name}</option>
          ))}
        </select>
        <select className="input py-2.5" value={by} onChange={(e) => setParam('by', e.target.value)} aria-label="Booked by">
          <option value="">Anyone</option>
          <option value="me">Booked by me</option>
          {team
            .filter((t) => t.user_id && t.user_id !== userId)
            .map((t) => (
              <option key={t.user_id} value={t.user_id!}>{memberName(t)}</option>
            ))}
        </select>
      </div>

      {/* Status chips */}
      <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        <button
          className={`chip ${!status ? 'border-ink bg-ink text-white' : 'border-line bg-white text-ink'}`}
          onClick={() => setParam('status', '')}
        >
          All <span className="opacity-60">{baseFiltered.length}</span>
        </button>
        {STATUSES.map((s) => (
          <button
            key={s}
            className={`chip ${status === s ? 'border-ink bg-ink text-white' : 'border-line bg-white text-ink'}`}
            onClick={() => setParam('status', status === s ? '' : s)}
          >
            {STATUS_LABEL[s]} <span className="opacity-60">{counts[s]}</span>
          </button>
        ))}
      </div>

      {/* List */}
      <div className="mt-4 space-y-5">
        {groups.map(([key, items]) => (
          <section key={key}>
            <h2 className="mb-2 px-1 text-xs font-semibold tracking-wide text-muted uppercase">
              {key === 'none' ? 'No time set' : key === todayKey() ? `Today · ${formatDay(items[0]!.meeting_datetime!)}` : formatDay(items[0]!.meeting_datetime!)}
            </h2>
            <ul className="card divide-y divide-line overflow-hidden">
              {items.map((m) => {
                const owner = m.booked_by ? teamByUser.get(m.booked_by) : undefined
                return (
                  <li key={m.id}>
                    <Link to={`/meetings/${m.id}`} className="flex gap-3 px-4 py-3.5 active:bg-surface-2">
                      <div className="w-[4.5rem] shrink-0 pt-0.5 text-sm font-semibold whitespace-nowrap tabular-nums">
                        {m.meeting_datetime ? formatTime(m.meeting_datetime) : '—'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {m.interest_level && <span className={`size-2 shrink-0 rounded-full ${INTEREST_DOT[m.interest_level]}`} />}
                          <p className="truncate font-semibold">{m.company}</p>
                        </div>
                        <p className="truncate text-sm text-muted">
                          {[m.contact_name, m.designation].filter(Boolean).join(' · ') || 'No contact yet'}
                        </p>
                        {!eventId && <p className="mt-0.5 truncate text-xs text-muted">{eventName(m.event_id)}</p>}
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        <StatusBadge status={m.status} />
                        {owner && (
                          <span
                            className="flex size-6 items-center justify-center rounded-full bg-stone text-[10px] font-bold"
                            title={`Booked by ${memberName(owner)}`}
                          >
                            {initials(memberName(owner))}
                          </span>
                        )}
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}

        {visible.length === 0 && (
          <div className="card px-6 py-10 text-center">
            <p className="font-semibold">{meetings.length === 0 ? 'No meetings yet' : 'Nothing matches'}</p>
            <p className="mt-1 text-sm text-muted">
              {meetings.length === 0
                ? events.length === 0
                  ? 'Add an event first, then log your meetings.'
                  : 'Tap + to log your first meeting.'
                : 'Try another search or filter.'}
            </p>
            {filtersActive && meetings.length > 0 && (
              <button className="btn-ghost mt-4" onClick={() => setParams(new URLSearchParams({ event: '' }), { replace: true })}>
                <IconX width={18} height={18} /> Clear filters
              </button>
            )}
            {events.length === 0 && (
              <Link to="/events" className="btn-primary mt-4">Add an event</Link>
            )}
          </div>
        )}
      </div>
    </Page>
  )
}

/** Groups meetings by calendar day, earliest first; undated ones go last. */
function groupByDay(list: Meeting[]): [string, Meeting[]][] {
  const map = new Map<string, Meeting[]>()
  for (const m of list) {
    const k = m.meeting_datetime ? dayKey(m.meeting_datetime) : 'none'
    if (!map.has(k)) map.set(k, [])
    map.get(k)!.push(m)
  }
  for (const items of map.values()) {
    items.sort((a, b) => (a.meeting_datetime ?? '').localeCompare(b.meeting_datetime ?? '') || a.company.localeCompare(b.company))
  }
  return [...map.entries()].sort(([a], [b]) => (a === 'none' ? 1 : b === 'none' ? -1 : a.localeCompare(b)))
}
