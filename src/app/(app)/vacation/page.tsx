'use client'

import { useState } from 'react'
import type { DateRange } from 'react-day-picker'
import { format, differenceInBusinessDays } from 'date-fns'
import { de } from 'date-fns/locale'
import { CalendarDays, CheckCircle2, Clock, XCircle, PalmtreeIcon } from 'lucide-react'
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

const GESAMT_TAGE = 30

const statusConfig: Record<Urlaubsantrag['status'], {
  variant: 'default' | 'outline' | 'destructive'
  className?: string
  icon: React.ReactNode
}> = {
  Genehmigt: { variant: 'outline',     className: 'border-green-600 text-green-600 bg-green-600/10', icon: <CheckCircle2 className="size-4" /> },
  Offen:     { variant: 'outline',     icon: <Clock        className="size-4" /> },
  Abgelehnt: { variant: 'destructive', icon: <XCircle      className="size-4" /> },
}

function arbeitstage(von: string, bis: string) {
  return differenceInBusinessDays(new Date(bis), new Date(von)) + 1
}

export default function VacationPage() {
  const [antraege, setAntraege] = useState<Urlaubsantrag[]>(MOCK_ANTRAEGE)
  const [range, setRange] = useState<DateRange | undefined>(undefined)
  const [kommentar, setKommentar] = useState('')

  const genehmigteTage = antraege
    .filter((a) => a.status === 'Genehmigt')
    .reduce((sum, a) => sum + arbeitstage(a.von, a.bis), 0)
  const offeneTage = antraege
    .filter((a) => a.status === 'Offen')
    .reduce((sum, a) => sum + arbeitstage(a.von, a.bis), 0)
  const restTage = GESAMT_TAGE - genehmigteTage

  const selectedDays =
    range?.from && range?.to
      ? differenceInBusinessDays(range.to, range.from) + 1
      : null

  const handleSubmit = () => {
    if (!range?.from || !range?.to) return
    setAntraege((prev) => [
      {
        id: crypto.randomUUID(),
        benutzerId: 'me',
        von: format(range.from!, 'yyyy-MM-dd'),
        bis: format(range.to!, 'yyyy-MM-dd'),
        status: 'Offen',
        kommentar: kommentar.trim() || undefined,
      },
      ...prev,
    ])
    setRange(undefined)
    setKommentar('')
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Urlaub</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <PalmtreeIcon className="size-4" />
              Resturlaub
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{restTage}</p>
            <p className="text-sm text-muted-foreground mt-1">von {GESAMT_TAGE} Tagen gesamt</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <CheckCircle2 className="size-4" />
              Genehmigt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{genehmigteTage}</p>
            <p className="text-sm text-muted-foreground mt-1">Arbeitstage geplant</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Clock className="size-4" />
              Ausstehend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{offeneTage}</p>
            <p className="text-sm text-muted-foreground mt-1">Tage zur Genehmigung</p>
          </CardContent>
        </Card>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[auto_1fr]">

        {/* Form */}
        <Card className="w-full xl:w-80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <CalendarDays className="size-4" />
              Antrag stellen
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Calendar
              mode="range"
              selected={range}
              onSelect={setRange}
              locale={de}
              disabled={{ before: new Date() }}
            />

            {selectedDays !== null && (
              <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-2">
                <span className="text-sm text-muted-foreground">
                  {format(range!.from!, 'dd.MM.yyyy')}
                  {range?.to ? ` – ${format(range.to, 'dd.MM.yyyy')}` : ''}
                </span>
                <Badge variant="secondary">{selectedDays} Tage</Badge>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="kommentar">Kommentar (optional)</Label>
              <Input
                id="kommentar"
                value={kommentar}
                onChange={(e) => setKommentar(e.target.value)}
                placeholder="z.B. Familienurlaub"
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!range?.from || !range?.to}
              className="w-full"
            >
              Antrag einreichen
            </Button>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <CalendarDays className="size-4" />
              Meine Anträge
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Zeitraum</TableHead>
                  <TableHead>Tage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Kommentar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {antraege.map((a) => {
                  const tage = arbeitstage(a.von, a.bis)
                  const cfg = statusConfig[a.status]
                  return (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">
                        {format(new Date(a.von), 'dd.MM.yyyy')}
                        <span className="text-muted-foreground"> – </span>
                        {format(new Date(a.bis), 'dd.MM.yyyy')}
                      </TableCell>
                      <TableCell className="font-medium">{tage}</TableCell>
                      <TableCell>
                        <Badge variant={cfg.variant} className={`flex w-fit items-center gap-1 ${cfg.className ?? ''}`}>
                          {cfg.icon}
                          {a.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {a.kommentar ?? '—'}
                      </TableCell>
                    </TableRow>
                  )
                })}
                {antraege.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-10">
                      Noch keine Anträge gestellt
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
