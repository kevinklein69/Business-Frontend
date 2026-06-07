'use client'

import { format } from 'date-fns'
import { Clock, CalendarDays, TrendingUp, TrendingDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { ClockButton } from '@/components/time-tracking/stamp-button'
import { cn } from '@/lib/utils'

const MOCK_ENTRIES = [
  { date: '2026-06-02', clockIn: '07:45', clockOut: '16:30', durationMinutes: 525 },
  { date: '2026-06-01', clockIn: '08:00', clockOut: '17:00', durationMinutes: 540 },
  { date: '2026-05-31', clockIn: '07:30', clockOut: '15:00', durationMinutes: 450 },
  { date: '2026-05-30', clockIn: '08:00', clockOut: '16:00', durationMinutes: 480 },
  { date: '2026-05-29', clockIn: '07:50', clockOut: '16:15', durationMinutes: 505 },
]

const DAILY_TARGET_MINUTES  = 480
const WEEKLY_TARGET_MINUTES = DAILY_TARGET_MINUTES * 5

function formatDiff(diff: number) {
  const abs = Math.abs(diff)
  const h   = Math.floor(abs / 60)
  const m   = String(abs % 60).padStart(2, '0')
  return `${diff >= 0 ? '+' : '-'}${h}:${m}h`
}

function formatMinutes(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = String(minutes % 60).padStart(2, '0')
  return `${h}:${m}`
}

const weekMinutes = MOCK_ENTRIES.reduce((s, b) => s + b.durationMinutes, 0)
const weekPercent = Math.min(Math.round((weekMinutes / WEEKLY_TARGET_MINUTES) * 100), 130)
const weekDiff    = weekMinutes - WEEKLY_TARGET_MINUTES

export default function TimeTrackingPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Zeiterfassung</h1>

      {/* Stempel widget + stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[auto_1fr_1fr_1fr]">
        {/* Stamp-in card */}
        <Card className="flex items-center justify-center px-6 py-5 border-l-[4px] border-l-ring">
          <ClockButton />
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
              <p className={cn('text-sm mt-1 flex items-center gap-1', weekDiff >= 0 ? 'text-success' : 'text-destructive')}>
                {weekDiff >= 0
                  ? <TrendingUp  className="size-3.5" />
                  : <TrendingDown className="size-3.5" />}
                {formatDiff(weekDiff)} gegenüber Sollzeit
              </p>
            </div>
            {/* Progress bar: neutral fill + green (Überstunden) or red (Minusstunden) */}
            <div className="flex flex-col gap-1.5">
              <div className="h-3 w-full rounded-full bg-muted overflow-hidden flex">
                {weekPercent >= 100 ? (
                  <>
                    <div className="h-full bg-ring/40 transition-all shrink-0" style={{ width: `${(100 / weekPercent) * 100}%` }} />
                    <div className="h-full bg-success transition-all shrink-0"  style={{ width: `${((weekPercent - 100) / weekPercent) * 100}%` }} />
                  </>
                ) : (
                  <>
                    <div className="h-full bg-ring/40 transition-all shrink-0"      style={{ width: `${weekPercent}%` }} />
                    <div className="h-full bg-destructive/40 transition-all shrink-0" style={{ width: `${100 - weekPercent}%` }} />
                  </>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {weekPercent}% von 40:00 h
                {weekPercent > 100 && <span className="text-success ml-1">· +{weekPercent - 100}% Überstunden</span>}
                {weekPercent < 100 && <span className="text-destructive ml-1">· -{100 - weekPercent}% fehlen noch</span>}
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
              {MOCK_ENTRIES.map((b) => {
                const diff = b.durationMinutes - DAILY_TARGET_MINUTES
                return (
                  <TableRow key={b.date} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-medium">
                      {format(new Date(b.date), 'dd.MM.yyyy')}
                    </TableCell>
                    <TableCell className="text-muted-foreground tabular-nums">{b.clockIn}</TableCell>
                    <TableCell className="text-muted-foreground tabular-nums">{b.clockOut}</TableCell>
                    <TableCell className="font-semibold tabular-nums">{formatMinutes(b.durationMinutes)}</TableCell>
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
