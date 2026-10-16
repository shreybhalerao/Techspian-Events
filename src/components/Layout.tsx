import type { ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { IconBack, IconCalendar, IconList, IconPlus, IconSettings } from './Icons'

/** Page shell: sticky header + content + bottom tab bar. */
export function Page({
  title,
  back,
  actions,
  children,
  hideNav,
}: {
  title: ReactNode
  back?: boolean
  actions?: ReactNode
  children: ReactNode
  hideNav?: boolean
}) {
  const navigate = useNavigate()
  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col">
      <header className="sticky top-0 z-30 bg-ink pt-[env(safe-area-inset-top)] text-white">
        <div className="flex h-14 items-center gap-2 px-3">
          {back ? (
            <button
              className="-ml-1 rounded-full p-2 hover:bg-white/10"
              onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
              aria-label="Back"
            >
              <IconBack />
            </button>
          ) : (
            <img src="/techspian-mark-512.png" alt="" className="ml-1 size-7 rounded-md" />
          )}
          <h1 className="min-w-0 flex-1 truncate text-[17px] font-semibold">{title}</h1>
          {actions}
          {!back && (
            <NavLink to="/settings" className="-mr-1 rounded-full p-2 hover:bg-white/10" aria-label="Account and settings">
              <IconSettings />
            </NavLink>
          )}
        </div>
      </header>
      <main className={`flex-1 px-4 pt-4 ${hideNav ? 'pb-8' : 'pb-[calc(6rem+env(safe-area-inset-bottom))]'}`}>{children}</main>
      {!hideNav && <BottomNav />}
    </div>
  )
}

function Tab({ to, label, icon, end }: { to: string; label: string; icon: ReactNode; end?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${isActive ? 'text-ink' : 'text-muted'}`
      }
    >
      {icon}
      {label}
    </NavLink>
  )
}

function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <div className="mx-auto flex max-w-2xl items-center">
        <Tab to="/" end label="Meetings" icon={<IconList />} />
        <NavLink
          to="/meetings/new"
          className="mx-4 -mt-6 flex size-14 shrink-0 items-center justify-center rounded-full bg-brand text-white shadow-lg shadow-brand/30 active:scale-95"
          aria-label="New meeting"
        >
          <IconPlus width={26} height={26} />
        </NavLink>
        <Tab to="/events" label="Events" icon={<IconCalendar />} />
      </div>
    </nav>
  )
}
