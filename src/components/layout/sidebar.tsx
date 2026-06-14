'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Clock,
  ClipboardList,
  CalendarDays,
  Stethoscope,
  Users,
  Settings,
  BarChart3,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useIsManager } from '@/lib/auth'
import { Logo } from '@/components/brand/logo'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

const navItems = [
  { href: '/dashboard',    label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/time-tracking', label: 'Zeiterfassung', icon: Clock },
  { href: '/orders',       label: 'Aufträge',      icon: ClipboardList },
  { href: '/vacation',     label: 'Urlaub',        icon: CalendarDays },
]

const absencesItem = { href: '/absences',  label: 'Fehlzeiten',  icon: Stethoscope }
const employeesItem = { href: '/employees', label: 'Mitarbeiter', icon: Users }
const statisticsItem = { href: '/statistics', label: 'Statistik', icon: BarChart3 }

const settingsItem = { href: '/settings', label: 'Einstellungen', icon: Settings }

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const showManagerNav = useIsManager()

  const items = showManagerNav
    ? [...navItems, absencesItem, employeesItem, statisticsItem]
    : [...navItems]

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  return (
    <>
      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto py-3">
        <p className="px-4 pb-1.5 text-[0.55rem] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
          Navigation
        </p>
        <ul className="flex flex-col gap-0.5 px-2">
          {items.map(({ href, label, icon: Icon }) => {
            const active = isActive(href)
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={onNavigate}
                  className={cn(
                    'relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors',
                    active
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'
                  )}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-sidebar-ring" />
                  )}
                  <Icon className="size-4 shrink-0" />
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Settings — separated at bottom */}
      <div className="border-t border-sidebar-border px-2 py-3">
        <Link
          href={settingsItem.href}
          onClick={onNavigate}
          className={cn(
            'relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors',
            isActive(settingsItem.href)
              ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
              : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'
          )}
        >
          {isActive(settingsItem.href) && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-sidebar-ring" />
          )}
          <settingsItem.icon className="size-4 shrink-0" />
          {settingsItem.label}
        </Link>
      </div>
    </>
  )
}

/** Fixed sidebar shown on desktop (lg and up). */
export function Sidebar() {
  return (
    <aside className="hidden lg:flex w-56 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground h-full">
      <div className="flex items-center h-14 px-4 border-b border-sidebar-border">
        <Logo onDark markClassName="size-7" textClassName="text-base" />
      </div>
      <SidebarNav />
    </aside>
  )
}

/** Slide-in drawer sidebar for mobile/tablet, triggered from the header. */
export function MobileSidebar({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="w-72 max-w-[80vw] gap-0 bg-sidebar text-sidebar-foreground p-0 [&>button]:text-sidebar-foreground [&>button]:hover:bg-sidebar-accent"
      >
        <SheetHeader className="h-14 flex-row items-center border-b border-sidebar-border px-4 py-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <Logo onDark markClassName="size-7" textClassName="text-base" />
        </SheetHeader>
        <SidebarNav onNavigate={() => onOpenChange(false)} />
      </SheetContent>
    </Sheet>
  )
}
