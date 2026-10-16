import { useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useData } from '../data/DataProvider'
import { Page } from '../components/Layout'
import { ErrorNote, Spinner, StatusBadge } from '../components/ui'
import { IconMail, IconPhone } from '../components/Icons'
import { STATUSES, type MeetingStatus } from '../lib/types'
import { INTEREST_DOT, INTEREST_LABEL, STATUS_LABEL, formatDateRange, formatDateTime, memberName } from '../lib/format'

export default function MeetingDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { meetings, events, team, updateMeeting, deleteMeeting } = useData()
  const meeting = meetings.find((m) => m.id === id)
  const [busy, setBusy] = useState<MeetingStatus | 'delete' | null>(null)
  const [error, setError] = useState('')

  if (!meeting) {
    return (
      <Page title="Meeting" back hideNav>
        <div className="card p-6 text-center">
          <p className="font-semibold">Meeting not found</p>
          <p className="mt-1 text-sm text-muted">It may have been deleted by a teammate.</p>
          <Link to="/" className="btn-ghost mt-4">Back to meetings</Link>
        </div>
      </Page>
    )
  }

  const event = events.find((e) => e.id === meeting.event_id)
  const owner = team.find((t) => t.user_id === meeting.booked_by)

  async function setStatus(s: MeetingStatus) {
    if (!meeting || s === meeting.status) return
    setBusy(s)
    setError('')
    try {
      await updateMeeting(meeting.id, { status: s })
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
    setBusy(null)
  }

  async function onDelete() {
    if (!meeting || !window.confirm(`Delete the meeting with ${meeting.company}? This can’t be undone.`)) return
    setBusy('delete')
    try {
      await deleteMeeting(meeting.id)
      navigate('/', { replace: true })
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setBusy(null)
    }
  }

  return (
    <Page
      title={meeting.company}
      back
      hideNav
      actions={
        <Link to={`/meetings/${meeting.id}/edit`} className="rounded-full px-3 py-1.5 text-sm font-semibold hover:bg-white/10">
          Edit
        </Link>
      }
    >
      <div className="space-y-4">
        {/* Header card */}
        <div className="card p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-xl font-semibold">{meeting.company}</h2>
              {(meeting.contact_name || meeting.designation) && (
                <p className="mt-0.5 text-muted">{[meeting.contact_name, meeting.designation].filter(Boolean).join(' · ')}</p>
              )}
            </div>
            <StatusBadge status={meeting.status} />
          </div>

          {(meeting.phone || meeting.email) && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              {meeting.phone && (
                <a href={`tel:${meeting.phone.replace(/[^\d+]/g, '')}`} className="btn-ghost min-h-11 text-sm">
                  <IconPhone width={18} height={18} /> Call
                </a>
              )}
              {meeting.email && (
                <a href={`mailto:${meeting.email}`} className="btn-ghost min-h-11 text-sm">
                  <IconMail width={18} height={18} /> Email
                </a>
              )}
            </div>
          )}
        </div>

        {/* Quick status */}
        <div className="card p-4">
          <p className="label">Update status</p>
          <div className="flex flex-wrap gap-2">
            {STATUSES.map((s) => (
              <button
                key={s}
                disabled={busy !== null}
                onClick={() => setStatus(s)}
                className={`chip py-2 ${meeting.status === s ? 'border-ink bg-ink text-white' : 'border-line bg-white'}`}
              >
                {busy === s && <Spinner className="size-3.5" />}
                {STATUS_LABEL[s]}
              </button>
            ))}
          </div>
        </div>

        <ErrorNote>{error}</ErrorNote>

        {/* Details */}
        <dl className="card divide-y divide-line">
          <Row label="When">{meeting.meeting_datetime ? formatDateTime(meeting.meeting_datetime) : '—'}</Row>
          <Row label="Event">
            {event ? (
              <>
                {event.name}
                <span className="block text-sm text-muted">
                  {[event.city, formatDateRange(event.start_date, event.end_date)].filter(Boolean).join(' · ')}
                </span>
              </>
            ) : '—'}
          </Row>
          <Row label="Interest">
            {meeting.interest_level ? (
              <span className="inline-flex items-center gap-2">
                <span className={`size-2.5 rounded-full ${INTEREST_DOT[meeting.interest_level]}`} />
                {INTEREST_LABEL[meeting.interest_level]}
              </span>
            ) : '—'}
          </Row>
          <Row label="Email">{meeting.email ? <span className="break-all">{meeting.email}</span> : '—'}</Row>
          <Row label="Phone">{meeting.phone || '—'}</Row>
          <Row label="Booked by">{owner ? memberName(owner) : '—'}</Row>
        </dl>

        <div className="card p-4">
          <p className="label">Notes</p>
          <p className="whitespace-pre-wrap">{meeting.notes || <span className="text-muted">No notes yet.</span>}</p>
        </div>

        <p className="px-1 text-xs text-muted">
          Added {formatDateTime(meeting.created_at)} · Last updated {formatDateTime(meeting.updated_at)}
        </p>

        <button className="btn-danger w-full" onClick={onDelete} disabled={busy !== null}>
          {busy === 'delete' ? <Spinner /> : 'Delete meeting'}
        </button>
      </div>
    </Page>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex gap-4 px-4 py-3">
      <dt className="w-24 shrink-0 text-sm text-muted">{label}</dt>
      <dd className="min-w-0 flex-1">{children}</dd>
    </div>
  )
}
