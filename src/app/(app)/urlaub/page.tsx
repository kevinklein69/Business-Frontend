'use client'

import { useState } from 'react'
import type { DateRange } from 'react-day-picker'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Urlaubsantrag } from '@/types'

const MOCK_ANTRAEGE: Urlaubsantrag[] = [
  { id: '1', benutzerId: 'me', von: '2026-07-15', bis: '2026-07-19', status: 'Genehmigt', kommentar: 'Sommerurlaub' },
  { id: '2', benutzerId: 'me', von: '2026-09-01', bis: '2026-09-05', status: 'Offen' },
  { id: '3', benutzerId: 'me', von: '2026-12-27', bis: '2026-12-31', status: 'Abgelehnt', kommentar: 'Betriebsferien' },
]

const statusVariant: Record<Urlaubsantrag['status'], 'default' | 'outline' | 'destructive'> = {
  Genehmigt: 'default',
  Offen: 'outline',
  Abgelehnt: 'destructive',
}

export default function UrlaubPage() {
  const [antraege, setAntraege] = useState<Urlaubsantrag[]>(MOCK_ANTRAEGE)
  const [range, setRange] = useState<DateRange | undefined>(undefined)
  const [kommentar, setKommentar] = useState('')

  const handleSubmit = () => {
    if (!range?.from || !range?.to) return
    const neuerAntrag: Urlaubsantrag = {
      id: crypto.randomUUID(),
      benutzerId: 'me',
      von: format(range.from, 'yyyy-MM-dd'),
      bis: format(range.to, 'yyyy-MM-dd'),
      status: 'Offen',
      kommentar: kommentar.trim() || undefined,
    }
    setAntraege((prev) => [neuerAntrag, ...prev])
    setRange(undefined)
    setKommentar('')
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Urlaub</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Urlaubsantrag stellen</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Calendar
              mode="range"
              selected={range}
              onSelect={setRange}
              locale={de}
              disabled={{ before: new Date() }}
            />
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="kommentar">Kommentar (optional)</Label>
              <Input
                id="kommentar"
                value={kommentar}
                onChange={(e) => setKommentar(e.target.value)}
                placeholder="z.B. Familienurlaub"
              />
            </div>
            {range?.from && range?.to && (
              <p className="text-sm text-muted-foreground">
                {format(range.from, 'dd. MMM', { locale: de })} –{' '}
                {format(range.to, 'dd. MMM yyyy', { locale: de })}
              </p>
            )}
            <Button onClick={handleSubmit} disabled={!range?.from || !range?.to}>
              Antrag einreichen
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Meine Anträge</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Von</TableHead>
                  <TableHead>Bis</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Kommentar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {antraege.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>{a.von}</TableCell>
                    <TableCell>{a.bis}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[a.status]}>{a.status}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {a.kommentar ?? '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
