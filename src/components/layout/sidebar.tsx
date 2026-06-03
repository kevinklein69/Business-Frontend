'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Clock,
  ClipboardList,
  CalendarDays,
  Users,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/zeiterfassung', label: 'Zeiterfassung', icon: Clock },
  { href: '/auftraege', label: 'Aufträge', icon: ClipboardList },
  { href: '/urlaub', label: 'Urlaub', icon: CalendarDays },
  { href: '/mitarbeiter', label: 'Mitarbeiter', icon: Users },
  { href: '/einstellungen', label: 'Einstellungen', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-56 shrink-0 flex flex-col border-r bg-sidebar text-sidebar-foreground h-full">
      <div className="flex items-center h-14 px-4 border-b">
        <span className="font-semibold text-sm">Betrieb-App</span>
      </div>
      <nav className="flex-1 overflow-y-auto py-2">
        <ul className="flex flex-col gap-0.5 px-2">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors',
                    active
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}
