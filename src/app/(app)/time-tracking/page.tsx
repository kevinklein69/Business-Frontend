'use client'

import { format } from 'date-fns'
import { Clock, CalendarDays, TrendingUp, TrendingDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

const MOCK_BUCHUNGEN = [
  { datum: '2026-06-02', von: '07:45', bis: '16:30', dauer: '8:45', minuten: 525 },
  { datum: '2026-06-01', von: '08:00', bis: '17:00', dauer: '9:00', minuten: 540 },
  { datum: '2026-05-31', von: '07:30', bis: '15:00', dauer: '7:30', minuten: 450 },
  { datum: '2026-05-30', von: '08:00', bis: '16:00', dauer: '8:00', minuten: 480 },
  { datum: '2026-05-29', von: '07:50', bis: '16:15', dauer: '8:25', minuten: 505 },
]

const SOLLZEIT = 480
const WOCHE_SOLL = SOLLZEIT * 5

function formatDiff(diff: number) {
  const abs = Math.abs(diff)
  const h = Math.floor(abs / 60)
  const m = String(abs % 60).padStart(2, '0')
  return `${diff >= 0 ? '+' : '-'}${h}:${m}h`
}

const wocheMinuten = MOCK_BUCHUNGEN.reduce((s, b) => s + b.minuten, 0)
const wocheProzent = Math.min(Math.round((wocheMinuten / WOCHE_SOLL) * 100), 130)
const wocheDiff    = wocheMinuten - WOCHE_SOLL

export default function TimeTrackingPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Zeiterfassung</h1>

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
              <p className={cn('text-sm mt-1 flex items-center gap-1', wocheDiff >= 0 ? 'text-success' : 'text-destructive')}>
                {wocheDiff >= 0 ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
                {formatDiff(wocheDiff)} gegenüber Sollzeit
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden flex">
                {wocheProzent >= 100 ? (
                  <>
                    <div className="h-full bg-muted-foreground/40 transition-all" style={{ width: `${(100 / wocheProzent) * 100}%` }} />
                    <div className="h-full bg-success transition-all"            style={{ width: `${((wocheProzent - 100) / wocheProzent) * 100}%` }} />
                  </>
                ) : (
                  <>
                    <div className="h-full bg-muted-foreground/40 transition-all" style={{ width: `${wocheProzent}%` }} />
                    <div className="h-full bg-destructive/50 transition-all"      style={{ width: `${100 - wocheProzent}%` }} />
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
            <p className="text-3xl font-bold text-success">+12:15</p>
            <p className="text-sm text-muted-foreground mt-1">Zeitkonto-Saldo</p>
          </CardContent>
        </Card>
      </div>

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
                  <TableRow key={b.datum}>
                    <TableCell className="font-medium">
                      {format(new Date(b.datum), 'dd.MM.yyyy')}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{b.von}</TableCell>
                    <TableCell className="text-muted-foreground">{b.bis}</TableCell>
                    <TableCell className="font-semibold tabular-nums">{b.dauer}</TableCell>
                    <TableCell>
                      <span className={cn(
                        'font-semibold tabular-nums',
                        diff > 0 && 'text-success',
                        diff < 0 && 'text-destructive',
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
