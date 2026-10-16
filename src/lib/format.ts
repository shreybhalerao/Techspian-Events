import type { MeetingStatus, InterestLevel, TeamMember } from './types'

export const STATUS_LABEL: Record<MeetingStatus, string> = {
  booked: 'Booked',
  met: 'Met',
  'no-show': 'No-show',
  cancelled: 'Cancelled',
  rescheduled: 'Rescheduled',
}

export const STATUS_STYLE: Record<MeetingStatus, string> = {
  booked: 'bg-brand-faint text-brand-deep border-brand/30',
  met: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'no-show': 'bg-amber-50 text-amber-700 border-amber-200',
  cancelled: 'bg-zinc-100 text-zinc-600 border-zinc-200',
  rescheduled: 'bg-violet-50 text-violet-700 border-violet-200',
}

export const INTEREST_LABEL: Record<InterestLevel, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

export const INTEREST_DOT: Record<InterestLevel, string> = {
  high: 'bg-emerald-500',
  medium: 'bg-amber-400',
  low: 'bg-zinc-300',
}

const dayFmt = new Intl.DateTimeFormat(undefined, { weekday: 'short', day: 'numeric', month: 'short' })
const timeFmt = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' })
const fullFmt = new Intl.DateTimeFormat(undefined, {
  weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit',
})

export const formatDay = (iso: string) => dayFmt.format(new Date(iso))
export const formatTime = (iso: string) => timeFmt.format(new Date(iso))
export const formatDateTime = (iso: string) => fullFmt.format(new Date(iso))

/** Local "YYYY-MM-DD" key for grouping by calendar day. */
export function dayKey(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** ISO timestamp -> value for <input type="datetime-local"> in the phone's time zone. */
export function toLocalInput(iso: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  const off = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - off).toISOString().slice(0, 16)
}

export function fromLocalInput(value: string) {
  return value ? new Date(value).toISOString() : null
}

/** "12 Mar – 14 Mar 2026" style range for event dates (date-only strings). */
export function formatDateRange(start: string | null, end: string | null) {
  if (!start) return ''
  const f = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
  const s = f.format(new Date(start))
  if (!end || end === start) return s
  return `${s} – ${f.format(new Date(end))}`
}

export function memberName(m: TeamMember | undefined) {
  if (!m) return 'Unknown'
  return m.full_name || m.email.split('@')[0]
}

export function initials(name: string) {
  return name
    .split(/[\s.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('')
}

/** Today as "YYYY-MM-DD" in the phone's local time. */
export function todayKey() {
  return dayKey(new Date().toISOString())
}
