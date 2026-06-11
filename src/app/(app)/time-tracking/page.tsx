'use client'

import { useState } from 'react'
import { format, addMonths, subMonths, startOfMonth } from 'date-fns'
import { de } from 'date-fns/locale'
import { Clock, CalendarDays, TrendingUp, TrendingDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { ClockButton } from '@/components/time-tracking/stamp-button'
import { useTimeBalance, useTimeEntries } from '@/hooks/use-time-tracking'
import { cn } from '@/lib/utils'

const DAILY_TARGET_MINUTES = 480

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

export default function TimeTrackingPage() {
  const now = new Date()
  const [viewDate, setViewDate] = useState(startOfMonth(now))

  const viewYear  = viewDate.getFullYear()
  const viewMonth = viewDate.getMonth() + 1
  const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth() + 1

  const { data: entries = [], isLoading: entriesLoading } = useTimeEntries(viewYear, viewMonth)
  const { data: balance, isLoading: balanceLoading, isError: balanceError } = useTimeBalance()

  const hasBalance        = !!balance
  const weekMinutes       = balance?.weekMinutes ?? 0
  const weekTargetMinutes = balance?.weekTargetMinutes || 1
  const weekPercent       = Math.min(Math.round((weekMinutes / weekTargetMinutes) * 100), 130)
  const weekDiff          = weekMinutes - weekTargetMinutes
  const balanceText       = balanceLoading ? 'Lädt…' : balanceError ? '—' : null

  const totalNetMinutes = entries.reduce((sum, e) => sum + e.netDurationMinutes, 0)

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
            {!hasBalance ? (
              <p className="text-sm text-muted-foreground">{balanceText}</p>
            ) : (
            <>
            <div>
              <p className="text-3xl font-bold tabular-nums">{formatMinutes(weekMinutes)}</p>
              <p className={cn('text-sm mt-1 flex items-center gap-1', weekDiff >= 0 ? 'text-success' : 'text-destructive')}>
                {weekDiff >= 0
                  ? <TrendingUp  className="size-3.5" />
                  : <TrendingDown className="size-3.5" />}
                {formatDiff(weekDiff)} gegenüber Sollzeit
              </p>
            </div>
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
                {weekPercent}% von {formatMinutes(weekTargetMinutes)} h
                {weekPercent > 100 && <span className="text-success ml-1">· +{weekPercent - 100}% Überstunden</span>}
                {weekPercent < 100 && <span className="text-destructive ml-1">· -{100 - weekPercent}% fehlen noch</span>}
              </p>
            </div>
            </>
            )}
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
            {!hasBalance ? (
              <p className="text-sm text-muted-foreground">{balanceText}</p>
            ) : (
            <>
              <p className="text-3xl font-bold tabular-nums">{formatMinutes(balance.monthMinutes)}</p>
              <p className="text-sm text-muted-foreground mt-1">Sollzeit: {formatMinutes(balance.monthTargetMinutes)} h</p>
            </>
            )}
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
            {!hasBalance ? (
              <p className="text-sm text-muted-foreground">{balanceText}</p>
            ) : (
            <>
              <p className={cn(
                'text-3xl font-bold tabular-nums',
                balance.totalBalanceMinutes >= 0 ? 'text-success' : 'text-destructive'
              )}>
                {formatDiff(balance.totalBalanceMinutes)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Zeitkonto-Saldo</p>
            </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly bookings table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Clock className="size-4" />
              {format(viewDate, 'MMMM yyyy', { locale: de })}
              {isCurrentMonth && <span className="text-xs font-normal text-muted-foreground">(aktueller Monat)</span>}
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={() => setViewDate(d => subMonths(d, 1))}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                disabled={isCurrentMonth}
                onClick={() => setViewDate(d => addMonths(d, 1))}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Datum</TableHead>
                <TableHead>Von</TableHead>
                <TableHead>Bis</TableHead>
                <TableHead>Pause</TableHead>
                <TableHead>Netto</TableHead>
                <TableHead>Differenz</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entriesLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                    Lade Buchungen…
                  </TableCell>
                </TableRow>
              )}
              {!entriesLoading && entries.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                    Keine Buchungen in diesem Monat
                  </TableCell>
                </TableRow>
              )}
              {entries.map((b) => {
                const diff = b.netDurationMinutes - DAILY_TARGET_MINUTES
                return (
                  <TableRow key={b.clockIn} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-medium">
                      {format(new Date(b.date), 'dd.MM.yyyy')}
                    </TableCell>
                    <TableCell className="text-muted-foreground tabular-nums">{format(new Date(b.clockIn), 'HH:mm')}</TableCell>
                    <TableCell className="text-muted-foreground tabular-nums">{format(new Date(b.clockOut), 'HH:mm')}</TableCell>
                    <TableCell className="text-muted-foreground tabular-nums">
                      {b.breakMinutes > 0 ? `${b.breakMinutes} min` : '—'}
                    </TableCell>
                    <TableCell className="font-semibold tabular-nums">{formatMinutes(b.netDurationMinutes)}</TableCell>
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

          {/* Monthly total */}
          {!entriesLoading && entries.length > 0 && (
            <div className="flex items-center justify-between border-t px-4 py-3 text-sm font-medium">
              <span className="text-muted-foreground">{entries.length} {entries.length === 1 ? 'Buchung' : 'Buchungen'}</span>
              <span>
                Gesamt:{' '}
                <span className="tabular-nums font-bold">{formatMinutes(totalNetMinutes)} h</span>
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
