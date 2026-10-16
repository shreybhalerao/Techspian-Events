import type { SVGProps } from 'react'

type P = SVGProps<SVGSVGElement>
const base = (p: P) => ({
  width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
  strokeWidth: 1.9, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, ...p,
})

export const IconList = (p: P) => <svg {...base(p)}><path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" /></svg>
export const IconCalendar = (p: P) => <svg {...base(p)}><rect x="3" y="4.5" width="18" height="16" rx="2.5" /><path d="M3 9.5h18M8 2.5v4M16 2.5v4" /></svg>
export const IconPlus = (p: P) => <svg {...base(p)}><path d="M12 5v14M5 12h14" /></svg>
export const IconSettings = (p: P) => <svg {...base(p)}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" /></svg>
export const IconSearch = (p: P) => <svg {...base(p)}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
export const IconBack = (p: P) => <svg {...base(p)}><path d="m15 18-6-6 6-6" /></svg>
export const IconX = (p: P) => <svg {...base(p)}><path d="M18 6 6 18M6 6l12 12" /></svg>
export const IconPhone = (p: P) => <svg {...base(p)}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" /></svg>
export const IconMail = (p: P) => <svg {...base(p)}><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="m3.5 6.5 8.5 6.5 8.5-6.5" /></svg>
export const IconRefresh = (p: P) => <svg {...base(p)}><path d="M20 11a8 8 0 0 0-14.9-3.5M4 4v4h4M4 13a8 8 0 0 0 14.9 3.5M20 20v-4h-4" /></svg>
export const IconPin = (p: P) => <svg {...base(p)}><path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12Z" /><circle cx="12" cy="9" r="2.5" /></svg>
export const IconFilter = (p: P) => <svg {...base(p)}><path d="M4 5h16l-6 7.5V19l-4 1.5v-8L4 5Z" /></svg>
