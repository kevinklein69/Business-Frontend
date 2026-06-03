'use client'

import { format } from 'date-fns'
import { Clock, CalendarDays, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

const MOCK_BUCHUNGEN = [
  { datum: '2026-06-02', von: '07:45', bis: '16:30', dauer: '8:45', minuten: 525, typ: 'Normal' },
  { datum: '2026-06-01', von: '08:00', bis: '17:00', dauer: '9:00', minuten: 540, typ: 'Überstunden' },
  { datum: '2026-05-31', von: '07:30', bis: '15:00', dauer: '7:30', minuten: 450, typ: 'Kurztag' },
  { datum: '2026-05-30', von: '08:00', bis: '16:00', dauer: '8:00', minuten: 480, typ: 'Normal' },
  { datum: '2026-05-29', von: '07:50', bis: '16:15', dauer: '8:25', minuten: 505, typ: 'Normal' },
]

const SOLLZEIT = 480 // 8h in Minuten
const WOCHE_SOLL = SOLLZEIT * 5 // 40h

const typConfig: Record<string, { variant: 'default' | 'secondary' | 'outline'; row: string }> = {
  Überstunden: { variant: 'default',   row: 'bg-primary/5' },
  Kurztag:     { variant: 'outline',   row: 'bg-muted/30' },
  Normal:      { variant: 'secondary', row: '' },
}

// Weekly total in minutes (last 5 entries = 1 week mock)
const wocheMinuten = MOCK_BUCHUNGEN.slice(0, 5).reduce((s, b) => s + b.minuten, 0)
const wocheProzent = Math.min(Math.round((wocheMinuten / WOCHE_SOLL) * 100), 130)
const wocheDiff = wocheMinuten - WOCHE_SOLL
const wocheDiffStr = `${wocheDiff >= 0 ? '+' : ''}${Math.floor(Math.abs(wocheDiff) / 60)}:${String(Math.abs(wocheDiff) % 60).padStart(2, '0')}`

export default function TimeTrackingPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Zeiterfassung</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Clock className="size-4" />
              Diese Woche
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div>
              <p className="text-3xl font-bold">41:40</p>
              <p className={cn('text-sm mt-1 flex items-center gap-1', wocheDiff >= 0 ? 'text-green-600' : 'text-destructive')}>
                {wocheDiff >= 0 ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
                {wocheDiffStr} gegenüber Sollzeit
              </p>
            </div>
            {/* Progress bar */}
            <div className="flex flex-col gap-1">
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all', wocheProzent > 100 ? 'bg-primary' : 'bg-primary/60')}
                  style={{ width: `${Math.min(wocheProzent, 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">{wocheProzent}% von 40:00 h</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <CalendarDays className="size-4" />
              Dieser Monat
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">168:30</p>
            <p className="text-sm text-muted-foreground mt-1">Sollzeit: 168:00 h</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <TrendingUp className="size-4" />
              Gesamtsaldo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">+12:15</p>
            <p className="text-sm text-muted-foreground mt-1">Zeitkonto-Saldo</p>
          </CardContent>
        </Card>
      </div>

      {/* Booking table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Clock className="size-4" />
                Letzte Buchungen
              </CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Datum</TableHead>
                <TableHead>Von</TableHead>
                <TableHead className="flex items-center gap-1">
                  <ArrowRight className="size-3.5" />
                  Bis
                </TableHead>
                <TableHead>Dauer</TableHead>
                <TableHead>Typ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_BUCHUNGEN.map((b) => {
                const cfg = typConfig[b.typ] ?? typConfig.Normal
                return (
                  <TableRow key={b.datum} className={cfg.row}>
                    <TableCell className="font-medium">
                      {format(new Date(b.datum), 'dd.MM.yyyy')}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{b.von}</TableCell>
                    <TableCell className="text-muted-foreground">{b.bis}</TableCell>
                    <TableCell>
                      <span className={cn(
                        'font-semibold tabular-nums',
                        b.typ === 'Überstunden' && 'text-primary',
                        b.typ === 'Kurztag' && 'text-muted-foreground'
                      )}>
                        {b.dauer}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={cfg.variant}>{b.typ}</Badge>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
