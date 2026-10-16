import { useEffect, type ReactNode } from 'react'
import { STATUS_LABEL, STATUS_STYLE } from '../lib/format'
import type { MeetingStatus } from '../lib/types'
import { IconX } from './Icons'

export function StatusBadge({ status }: { status: MeetingStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  )
}

export function Spinner({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-block size-5 animate-spin rounded-full border-2 border-current border-r-transparent ${className}`}
      role="status"
      aria-label="Loading"
    />
  )
}

export function ErrorNote({ children }: { children: ReactNode }) {
  if (!children) return null
  return <p className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{children}</p>
}

export function FullScreenMessage({ children }: { children: ReactNode }) {
  return <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">{children}</div>
}

/** Bottom sheet on phones, centred dialog on wider screens. */
export function Sheet({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={title}>
      <button className="absolute inset-0 bg-ink/40" aria-label="Close" onClick={onClose} />
      <div className="relative max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:max-w-md sm:rounded-3xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button className="-mr-2 rounded-full p-2 text-muted hover:bg-surface-2" onClick={onClose} aria-label="Close">
            <IconX />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
