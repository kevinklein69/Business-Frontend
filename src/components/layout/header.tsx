'use client'

import { useRouter, usePathname } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { removeToken, useUserName } from '@/lib/auth'

const pageTitles: Record<string, string> = {
  '/dashboard':    'Dashboard',
  '/time-tracking': 'Zeiterfassung',
  '/orders':       'Aufträge',
  '/vacation':     'Urlaub',
  '/absences':     'Fehlzeiten',
  '/employees':    'Mitarbeiter',
  '/statistics':   'Statistik',
  '/settings':     'Einstellungen',
}

function usePageTitle(): string {
  const pathname = usePathname()
  for (const [prefix, title] of Object.entries(pageTitles)) {
    if (pathname === prefix || pathname.startsWith(prefix + '/')) return title
  }
  return 'Betrieb-App'
}

function initials(name: string) {
  return name.split(' ').filter(Boolean).map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

export function Header() {
  const router  = useRouter()
  const title   = usePageTitle()
  const userName = useUserName()

  const handleLogout = () => {
    removeToken()
    router.push('/login')
  }

  return (
    <header className="h-14 border-b flex items-center justify-between px-6 bg-card shrink-0 shadow-[0_1px_6px_rgba(13,27,42,0.06)]">
      <h2 className="text-base font-semibold tracking-tight text-foreground">{title}</h2>

      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="rounded-full" />}>
          <Avatar>
            <AvatarFallback className="bg-ring text-primary-foreground text-xs font-bold">
              {userName ? initials(userName) : ''}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuLabel>{userName ?? 'Mein Konto'}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={handleLogout}>
              <LogOut />
              Abmelden
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
