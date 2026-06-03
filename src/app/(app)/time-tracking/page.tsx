'use client'

import { format } from 'date-fns'
import { Clock, CalendarDays, TrendingUp, TrendingDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { StempelButton } from '@/components/time-tracking/stamp-button'
import { cn } from '@/lib/utils'

const MOCK_BUCHUNGEN = [
  { datum: '2026-06-02', von: '07:45', bis: '16:30', dauer: '8:45', minuten: 525 },
  { datum: '2026-06-01', von: '08:00', bis: '17:00', dauer: '9:00', minuten: 540 },
  { datum: '2026-05-31', von: '07:30', bis: '15:00', dauer: '7:30', minuten: 450 },
  { datum: '2026-05-30', von: '08:00', bis: '16:00', dauer: '8:00', minuten: 480 },
  { datum: '2026-05-29', von: '07:50', bis: '16:15', dauer: '8:25', minuten: 505 },
]

const SOLLZEIT   = 480
const WOCHE_SOLL = SOLLZEIT * 5

function formatDiff(diff: number) {
  const abs = Math.abs(diff)
  const h   = Math.floor(abs / 60)
  const m   = String(abs % 60).padStart(2, '0')
  return `${diff >= 0 ? '+' : '-'}${h}:${m}h`
}

const wocheMinuten = MOCK_BUCHUNGEN.reduce((s, b) => s + b.minuten, 0)
const wocheProzent = Math.min(Math.round((wocheMinuten / WOCHE_SOLL) * 100), 130)
const wocheDiff    = wocheMinuten - WOCHE_SOLL

export default function TimeTrackingPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Zeiterfassung</h1>

      {/* Stempel widget + stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[auto_1fr_1fr_1fr]">
        {/* Stamp-in card */}
        <Card className="flex items-center justify-center px-6 py-5 border-l-[4px] border-l-ring">
          <StempelButton />
        </Card>

        {/* Diese Woche */}
        <Card className="border-l-[4px] border-l-ring">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Clock className="size-4" />
              Diese Woche
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div>
              <p className="text-3xl font-bold tabular-nums">41:40</p>
              <p className={cn('text-sm mt-1 flex items-center gap-1', wocheDiff >= 0 ? 'text-success' : 'text-destructive')}>
                {wocheDiff >= 0
                  ? <TrendingUp  className="size-3.5" />
                  : <TrendingDown className="size-3.5" />}
                {formatDiff(wocheDiff)} gegenüber Sollzeit
              </p>
            </div>
            {/* Progress bar: neutral fill + green (Überstunden) or red (Minusstunden) */}
            <div className="flex flex-col gap-1.5">
              <div className="h-3 w-full rounded-full bg-muted overflow-hidden flex">
                {wocheProzent >= 100 ? (
                  <>
                    <div className="h-full bg-ring/40 transition-all shrink-0" style={{ width: `${(100 / wocheProzent) * 100}%` }} />
                    <div className="h-full bg-success transition-all shrink-0"  style={{ width: `${((wocheProzent - 100) / wocheProzent) * 100}%` }} />
                  </>
                ) : (
                  <>
                    <div className="h-full bg-ring/40 transition-all shrink-0"      style={{ width: `${wocheProzent}%` }} />
                    <div className="h-full bg-destructive/40 transition-all shrink-0" style={{ width: `${100 - wocheProzent}%` }} />
                  </>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {wocheProzent}% von 40:00 h
                {wocheProzent > 100 && <span className="text-success ml-1">· +{wocheProzent - 100}% Überstunden</span>}
                {wocheProzent < 100 && <span className="text-destructive ml-1">· -{100 - wocheProzent}% fehlen noch</span>}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Dieser Monat */}
        <Card className="border-l-[4px] border-l-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <CalendarDays className="size-4" />
              Dieser Monat
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tabular-nums">168:30</p>
            <p className="text-sm text-muted-foreground mt-1">Sollzeit: 168:00 h</p>
          </CardContent>
        </Card>

        {/* Gesamtsaldo */}
        <Card className="border-l-[4px] border-l-success">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <TrendingUp className="size-4" />
              Gesamtsaldo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-success tabular-nums">+12:15</p>
            <p className="text-sm text-muted-foreground mt-1">Zeitkonto-Saldo</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent bookings table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Clock className="size-4" />
            Letzte Buchungen
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Datum</TableHead>
                <TableHead>Von</TableHead>
                <TableHead>Bis</TableHead>
                <TableHead>Dauer</TableHead>
                <TableHead>Differenz</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_BUCHUNGEN.map((b) => {
                const diff = b.minuten - SOLLZEIT
                return (
                  <TableRow key={b.datum} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-medium">
                      {format(new Date(b.datum), 'dd.MM.yyyy')}
                    </TableCell>
                    <TableCell className="text-muted-foreground tabular-nums">{b.von}</TableCell>
                    <TableCell className="text-muted-foreground tabular-nums">{b.bis}</TableCell>
                    <TableCell className="font-semibold tabular-nums">{b.dauer}</TableCell>
                    <TableCell>
                      <span className={cn(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums',
                        diff > 0  && 'bg-success/10 text-success',
                        diff < 0  && 'bg-destructive/10 text-destructive',
                        diff === 0 && 'text-muted-foreground'
                      )}>
                        {formatDiff(diff)}
                      </span>
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
