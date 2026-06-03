'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Benutzer } from '@/types'

const MOCK_MITARBEITER: (Benutzer & { hatAuftrag: boolean })[] = [
  { id: '1', vorname: 'Max', nachname: 'Müller', email: 'max.mueller@firma.de', rolle: 'Admin', abteilung: 'Leitung', hatAuftrag: false },
  { id: '2', vorname: 'Anna', nachname: 'Schmidt', email: 'a.schmidt@firma.de', rolle: 'Manager', abteilung: 'Technik', hatAuftrag: true },
  { id: '3', vorname: 'Tom', nachname: 'Wagner', email: 't.wagner@firma.de', rolle: 'Mitarbeiter', abteilung: 'Technik', hatAuftrag: true },
  { id: '4', vorname: 'Lisa', nachname: 'Bauer', email: 'l.bauer@firma.de', rolle: 'Mitarbeiter', abteilung: 'Verwaltung', hatAuftrag: false },
  { id: '5', vorname: 'Jonas', nachname: 'Fischer', email: 'j.fischer@firma.de', rolle: 'Mitarbeiter', abteilung: 'Technik', hatAuftrag: false },
  { id: '6', vorname: 'Maria', nachname: 'Hoffmann', email: 'm.hoffmann@firma.de', rolle: 'Manager', abteilung: 'Vertrieb', hatAuftrag: true },
  { id: '7', vorname: 'Felix', nachname: 'Koch', email: 'f.koch@firma.de', rolle: 'Mitarbeiter', abteilung: 'Vertrieb', hatAuftrag: false },
  { id: '8', vorname: 'Sara', nachname: 'Becker', email: 's.becker@firma.de', rolle: 'Mitarbeiter', abteilung: 'Verwaltung', hatAuftrag: true },
]

type FilterKey = 'Alle' | 'HatAuftrag' | 'KeinAuftrag' | string

const ABTEILUNGEN = [...new Set(MOCK_MITARBEITER.map((m) => m.abteilung!))].sort()

export default function MitarbeiterPage() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterKey>('Alle')

  const filtered = MOCK_MITARBEITER.filter((m) => {
    const matchSearch =
      search === '' ||
      `${m.vorname} ${m.nachname} ${m.email}`.toLowerCase().includes(search.toLowerCase())

    const matchFilter =
      filter === 'Alle' ||
      (filter === 'HatAuftrag' && m.hatAuftrag) ||
      (filter === 'KeinAuftrag' && !m.hatAuftrag) ||
      m.abteilung === filter

    return matchSearch && matchFilter
  })

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Mitarbeiter</h1>

      <div className="flex flex-col gap-3">
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Suchen…"
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
              {f === 'HatAuftrag' ? 'Hat Auftrag' : f === 'KeinAuftrag' ? 'Kein Auftrag' : f}
            </Button>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mitarbeiter</TableHead>
                <TableHead>E-Mail</TableHead>
                <TableHead>Rolle</TableHead>
                <TableHead>Abteilung</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar size="sm">
                        <AvatarFallback>
                          {m.vorname[0]}{m.nachname[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{m.vorname} {m.nachname}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{m.email}</TableCell>
                  <TableCell>
                    <Badge variant={m.rolle === 'Admin' ? 'default' : m.rolle === 'Manager' ? 'secondary' : 'outline'}>
                      {m.rolle}
                    </Badge>
                  </TableCell>
                  <TableCell>{m.abteilung}</TableCell>
                  <TableCell>
                    {m.hatAuftrag ? (
                      <Badge variant="default">Hat Auftrag</Badge>
                    ) : (
                      <Badge variant="outline">Verfügbar</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Keine Mitarbeiter gefunden
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
