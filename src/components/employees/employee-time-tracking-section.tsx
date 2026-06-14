'use client'

import { useState } from 'react'
import { format, addMonths, subMonths, startOfMonth } from 'date-fns'
import { de } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Clock, XCircle, Pencil, MessageSquare, ClipboardList } from 'lucide-react'
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useEmployeeTimeBalance, useEmployeeTimeEntries } from '@/hooks/use-time-tracking'
import { formatDiff, formatMinutes } from '@/lib/format'
import { cn } from '@/lib/utils'

const DAILY_TARGET_MINUTES = 480

export function EmployeeTimeTrackingSection({ employeeId }: { employeeId: string }) {
  const now = new Date()
  const [viewDate, setViewDate] = useState(startOfMonth(now))

  const viewYear = viewDate.getFullYear()
  const viewMonth = viewDate.getMonth() + 1
  const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth() + 1

  const { data: balance, isLoading: balanceLoading } = useEmployeeTimeBalance(employeeId)
  const { data: entries = [], isLoading: entriesLoading } = useEmployeeTimeEntries(employeeId, viewYear, viewMonth)

  return (
    <div className="flex flex-col gap-3">
      {/* Balance summary */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-0.5">
          <p className="text-xs text-muted-foreground">Diese Woche</p>
          <p className="text-sm font-medium tabular-nums">
            {balanceLoading || !balance ? '—' : `${formatMinutes(balance.weekMinutes)} h`}
          </p>
        </div>
        <div className="flex flex-col gap-0.5">
          <p className="text-xs text-muted-foreground">Dieser Monat</p>
          <p className="text-sm font-medium tabular-nums">
            {balanceLoading || !balance ? '—' : `${formatMinutes(balance.monthMinutes)} h`}
          </p>
        </div>
        <div className="flex flex-col gap-0.5">
          <p className="text-xs text-muted-foreground">Gesamtsaldo</p>
          <p className={cn(
            'text-sm font-medium tabular-nums',
            !balanceLoading && balance && (balance.totalBalanceMinutes >= 0 ? 'text-success' : 'text-destructive'),
          )}>
            {balanceLoading || !balance ? '—' : formatDiff(balance.totalBalanceMinutes)}
          </p>
        </div>
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          {format(viewDate, 'MMMM yyyy', { locale: de })}
          {isCurrentMonth && <span className="ml-1 font-normal normal-case">(aktueller Monat)</span>}
        </p>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => setViewDate((d) => subMonths(d, 1))}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            disabled={isCurrentMonth}
            onClick={() => setViewDate((d) => addMonths(d, 1))}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {/* Entries table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Datum</TableHead>
              <TableHead>Von</TableHead>
              <TableHead>Bis</TableHead>
              <TableHead>Pause</TableHead>
              <TableHead>Netto</TableHead>
              <TableHead>Differenz</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entriesLoading && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-6">
                  Lade Buchungen…
                </TableCell>
              </TableRow>
            )}
            {!entriesLoading && entries.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-6">
                  Keine Buchungen in diesem Monat
                </TableCell>
              </TableRow>
            )}
            {entries.map((b) => {
              const diff = b.netDurationMinutes - DAILY_TARGET_MINUTES
              return (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{format(new Date(b.date), 'dd.MM.yyyy')}</TableCell>
                  <TableCell className="text-muted-foreground tabular-nums">{format(new Date(b.clockIn), 'HH:mm')}</TableCell>
                  <TableCell className="text-muted-foreground tabular-nums">{format(new Date(b.clockOut), 'HH:mm')}</TableCell>
                  <TableCell className="text-muted-foreground tabular-nums">
                    {b.breakMinutes > 0 ? `${b.breakMinutes} min` : '—'}
                  </TableCell>
                  <TableCell className="font-semibold tabular-nums">{formatMinutes(b.netDurationMinutes)}</TableCell>
                  <TableCell>
                    {b.status === 'Approved' ? (
                      <span className={cn(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums',
                        diff > 0 && 'bg-success/10 text-success',
                        diff < 0 && 'bg-destructive/10 text-destructive',
                        diff === 0 && 'text-muted-foreground',
                      )}>
                        {formatDiff(diff)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-1">
                      {b.orderTitle && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <ClipboardList className="size-3" /> {b.orderTitle}
                        </Badge>
                      )}
                      {b.isManual && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Pencil className="size-3" /> Manuell
                        </Badge>
                      )}
                      {b.status === 'Pending' && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Clock className="size-3" /> Ausstehend
                        </Badge>
                      )}
                      {b.status === 'Rejected' && (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <XCircle className="size-3" /> Abgelehnt
                        </Badge>
                      )}
                      {b.note && (
                        <span title={b.note}>
                          <MessageSquare className="size-3.5 text-muted-foreground shrink-0" />
                        </span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
