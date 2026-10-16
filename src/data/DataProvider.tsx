import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import type { EventInput, EventRow, Meeting, MeetingInput, TeamMember } from '../lib/types'

/**
 * All app data lives here and is loaded once after sign-in. Screens read from
 * these arrays and filter/search locally, which keeps the UI instant and gives
 * Phase 2 (offline mode) a single place to swap in IndexedDB.
 */
interface DataState {
  events: EventRow[]
  meetings: Meeting[]
  team: TeamMember[]
  me: TeamMember | null
  userId: string
  loading: boolean
  error: string | null
  /** Signed in, but not on the team list (or removed from it). */
  notOnTeam: boolean
  refresh: () => Promise<void>
  createEvent: (input: EventInput) => Promise<EventRow>
  updateEvent: (id: string, input: EventInput) => Promise<EventRow>
  deleteEvent: (id: string) => Promise<void>
  createMeeting: (input: MeetingInput) => Promise<Meeting>
  updateMeeting: (id: string, patch: Partial<MeetingInput>) => Promise<Meeting>
  deleteMeeting: (id: string) => Promise<void>
}

const DataContext = createContext<DataState | null>(null)

const PAGE = 1000 // Supabase returns at most 1000 rows per request

async function fetchAllMeetings(): Promise<Meeting[]> {
  const rows: Meeting[] = []
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from('meetings')
      .select('*')
      .order('created_at', { ascending: true })
      .range(from, from + PAGE - 1)
    if (error) throw error
    rows.push(...(data as Meeting[]))
    if (data.length < PAGE) return rows
  }
}

function sortEvents(list: EventRow[]) {
  return [...list].sort((a, b) => (b.start_date ?? '').localeCompare(a.start_date ?? '') || a.name.localeCompare(b.name))
}

export function DataProvider({ userId, email, children }: { userId: string; email: string; children: ReactNode }) {
  const [events, setEvents] = useState<EventRow[]>([])
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [team, setTeam] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setError(null)
    try {
      const [ev, mt, tm] = await Promise.all([
        supabase.from('events').select('*'),
        fetchAllMeetings(),
        supabase.from('team_members').select('email, full_name, user_id').order('full_name'),
      ])
      if (ev.error) throw ev.error
      if (tm.error) throw tm.error
      setEvents(sortEvents(ev.data as EventRow[]))
      setMeetings(mt)
      setTeam(tm.data as TeamMember[])
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Link this login to the team list first so "booked by" works, then load.
    supabase.rpc('claim_team_membership').then(() => refresh())
  }, [refresh])

  // Pick up teammates' changes when the app comes back to the foreground.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [refresh])

  const me = useMemo(
    () => team.find((t) => t.user_id === userId) ?? team.find((t) => t.email === email.toLowerCase()) ?? null,
    [team, userId, email],
  )

  const createEvent = useCallback(async (input: EventInput) => {
    const { data, error } = await supabase.from('events').insert(input).select().single()
    if (error) throw error
    setEvents((list) => sortEvents([...list, data as EventRow]))
    return data as EventRow
  }, [])

  const updateEvent = useCallback(async (id: string, input: EventInput) => {
    const { data, error } = await supabase.from('events').update(input).eq('id', id).select().single()
    if (error) throw error
    setEvents((list) => sortEvents(list.map((e) => (e.id === id ? (data as EventRow) : e))))
    return data as EventRow
  }, [])

  const deleteEvent = useCallback(async (id: string) => {
    const { error } = await supabase.from('events').delete().eq('id', id)
    if (error) {
      if (error.code === '23503') throw new Error('This event still has meetings. Delete or move them first.')
      throw error
    }
    setEvents((list) => list.filter((e) => e.id !== id))
  }, [])

  const createMeeting = useCallback(async (input: MeetingInput) => {
    const { data, error } = await supabase.from('meetings').insert(input).select().single()
    if (error) throw error
    setMeetings((list) => [...list, data as Meeting])
    return data as Meeting
  }, [])

  const updateMeeting = useCallback(async (id: string, patch: Partial<MeetingInput>) => {
    const { data, error } = await supabase.from('meetings').update(patch).eq('id', id).select().single()
    if (error) throw error
    setMeetings((list) => list.map((m) => (m.id === id ? (data as Meeting) : m)))
    return data as Meeting
  }, [])

  const deleteMeeting = useCallback(async (id: string) => {
    const { error } = await supabase.from('meetings').delete().eq('id', id)
    if (error) throw error
    setMeetings((list) => list.filter((m) => m.id !== id))
  }, [])

  const value: DataState = {
    events,
    meetings,
    team,
    me,
    userId,
    loading,
    error,
    notOnTeam: !loading && !error && !me,
    refresh,
    createEvent,
    updateEvent,
    deleteEvent,
    createMeeting,
    updateMeeting,
    deleteMeeting,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used inside DataProvider')
  return ctx
}
