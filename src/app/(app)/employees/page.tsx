'use client'

import { useState } from 'react'
import { Search, Users, ClipboardList, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import type { Benutzer } from '@/types'

const MOCK_MITARBEITER: (Benutzer & { hatAuftrag: boolean })[] = [
  { id: '1', vorname: 'Max',   nachname: 'Müller',   email: 'max.mueller@firma.de',  rolle: 'Admin',       abteilung: 'Leitung',    hatAuftrag: false },
  { id: '2', vorname: 'Anna',  nachname: 'Schmidt',  email: 'a.schmidt@firma.de',    rolle: 'Manager',     abteilung: 'Technik',    hatAuftrag: true  },
  { id: '3', vorname: 'Tom',   nachname: 'Wagner',   email: 't.wagner@firma.de',     rolle: 'Mitarbeiter', abteilung: 'Technik',    hatAuftrag: true  },
  { id: '4', vorname: 'Lisa',  nachname: 'Bauer',    email: 'l.bauer@firma.de',      rolle: 'Mitarbeiter', abteilung: 'Verwaltung', hatAuftrag: false },
  { id: '5', vorname: 'Jonas', nachname: 'Fischer',  email: 'j.fischer@firma.de',    rolle: 'Mitarbeiter', abteilung: 'Technik',    hatAuftrag: false },
  { id: '6', vorname: 'Maria', nachname: 'Hoffmann', email: 'm.hoffmann@firma.de',   rolle: 'Manager',     abteilung: 'Vertrieb',   hatAuftrag: true  },
  { id: '7', vorname: 'Felix', nachname: 'Koch',     email: 'f.koch@firma.de',       rolle: 'Mitarbeiter', abteilung: 'Vertrieb',   hatAuftrag: false },
  { id: '8', vorname: 'Sara',  nachname: 'Becker',   email: 's.becker@firma.de',     rolle: 'Mitarbeiter', abteilung: 'Verwaltung', hatAuftrag: true  },
]

const ABTEILUNGEN = [...new Set(MOCK_MITARBEITER.map((m) => m.abteilung!))].sort()

type FilterKey = 'Alle' | 'HatAuftrag' | 'KeinAuftrag' | string

const rolleVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
  Admin:       'default',
  Manager:     'secondary',
  Mitarbeiter: 'outline',
}

const avatarColors = [
  'bg-[#415a77] text-white',
  'bg-[#1b263b] text-white',
  'bg-[#778da9] text-white',
  'bg-[#253450] text-white',
]

export default function EmployeesPage() {
  const [search, setSearch]   = useState('')
  const [filter, setFilter]   = useState<FilterKey>('Alle')

  const filtered = MOCK_MITARBEITER.filter((m) => {
    const matchSearch =
      search === '' ||
      `${m.vorname} ${m.nachname} ${m.email}`.toLowerCase().includes(search.toLowerCase())
    const matchFilter =
      filter === 'Alle' ||
      (filter === 'HatAuftrag'  && m.hatAuftrag)  ||
      (filter === 'KeinAuftrag' && !m.hatAuftrag) ||
      m.abteilung === filter
    return matchSearch && matchFilter
  })

  const total      = MOCK_MITARBEITER.length
  const mitAuftrag = MOCK_MITARBEITER.filter((m) => m.hatAuftrag).length
  const verfuegbar = total - mitAuftrag

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Mitarbeiter</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Users className="size-4" />
              Gesamt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{total}</p>
            <p className="text-sm text-muted-foreground mt-1">Aktive Mitarbeiter</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <ClipboardList className="size-4" />
              Im Einsatz
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{mitAuftrag}</p>
            <p className="text-sm text-muted-foreground mt-1">Hat aktiven Auftrag</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <CheckCircle2 className="size-4" />
              Verfügbar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{verfuegbar}</p>
            <p className="text-sm text-muted-foreground mt-1">Kein aktiver Auftrag</p>
          </CardContent>
        </Card>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col gap-3">
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Name oder E-Mail suchen…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(['Alle', 'HatAuftrag', 'KeinAuftrag', ...ABTEILUNGEN] as FilterKey[]).map((f) => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? 'default' : 'outline'}
              onClick={() => setFilter(f)}
            >
              {f === 'HatAuftrag' ? 'Im Einsatz' : f === 'KeinAuftrag' ? 'Verfügbar' : f}
            </Button>
          ))}
        </div>
      </div>

      {/* Card grid */}
      {filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm py-10 text-center">
          Keine Mitarbeiter gefunden
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((m, i) => (
            <Card key={m.id} className="flex flex-col gap-0">
              <CardContent className="pt-5 flex flex-col gap-3">

                {/* Avatar + Status dot */}
                <div className="flex items-start justify-between">
                  <Avatar size="lg" className={cn(avatarColors[i % avatarColors.length])}>
                    <AvatarFallback className={cn('text-base font-semibold', avatarColors[i % avatarColors.length])}>
                      {m.vorname[0]}{m.nachname[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className={cn(
                    'mt-1 h-2.5 w-2.5 rounded-full ring-2 ring-background',
                    m.hatAuftrag ? 'bg-[#415a77]' : 'bg-green-500'
                  )} />
                </div>

                {/* Name + email */}
                <div>
                  <p className="font-semibold leading-tight">{m.vorname} {m.nachname}</p>
                  <p className="text-sm text-muted-foreground mt-0.5 truncate">{m.email}</p>
                </div>

                {/* Rolle + Abteilung */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={rolleVariant[m.rolle]}>{m.rolle}</Badge>
                  <span className="text-sm text-muted-foreground">{m.abteilung}</span>
                </div>

                {/* Status */}
                <div className="border-t pt-3">
                  {m.hatAuftrag ? (
                    <p className="text-sm font-medium text-primary">Im Einsatz</p>
                  ) : (
                    <p className="text-sm font-medium text-green-600">Verfügbar</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
