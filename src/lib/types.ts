export const STATUSES = ['booked', 'met', 'no-show', 'cancelled', 'rescheduled'] as const
export type MeetingStatus = (typeof STATUSES)[number]

export const INTEREST_LEVELS = ['high', 'medium', 'low'] as const
export type InterestLevel = (typeof INTEREST_LEVELS)[number]

export interface EventRow {
  id: string
  name: string
  city: string | null
  start_date: string | null
  end_date: string | null
  created_by: string | null
  created_at: string
}

export interface Meeting {
  id: string
  event_id: string
  company: string
  contact_name: string | null
  designation: string | null
  email: string | null
  phone: string | null
  meeting_datetime: string | null
  booked_by: string | null
  status: MeetingStatus
  interest_level: InterestLevel | null
  notes: string | null
  card_photo_path: string | null
  voice_note_path: string | null
  created_at: string
  updated_at: string
}

export interface TeamMember {
  email: string
  full_name: string | null
  user_id: string | null
}

export type EventInput = Pick<EventRow, 'name' | 'city' | 'start_date' | 'end_date'>

export type MeetingInput = Pick<
  Meeting,
  | 'event_id'
  | 'company'
  | 'contact_name'
  | 'designation'
  | 'email'
  | 'phone'
  | 'meeting_datetime'
  | 'booked_by'
  | 'status'
  | 'interest_level'
  | 'notes'
>
