'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table'
import { Building2, CalendarRange } from 'lucide-react'
import { useOrders } from '@/hooks/use-orders'
import { format, getISOWeek, getISOWeekYear, startOfISOWeek, endOfISOWeek } from 'date-fns'
import { cn } from '@/lib/utils'
import type { Order, OrderStatus } from '@/types'

const statusLabel: Record<OrderStatus, string> = {
  Backlog:            'Backlog',
  InProgress:         'In Bearbeitung',
  ReadyForAcceptance: 'Bereit für Abnahme',
  Invoicing:          'Rechnungserstellung',
  Done:               'Erledigt',
}

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase()
}

function shortDate(date: string) {
  return format(new Date(date), 'dd.MM.')
}

export default function MonatsplanPage() {
  const { data: orders = [] } = useOrders()

  const planningOrders = orders.filter((o) => o.plannedStartDate && o.status !== 'Done')

  const weekGroups = new Map<string, { sampleDate: Date; orders: Order[] }>()
  for (const order of planningOrders) {
    const date = new Date(order.plannedStartDate!)
    const key = `${getISOWeekYear(date)}-W${getISOWeek(date)}`
    const group = weekGroups.get(key) ?? { sampleDate: date, orders: [] }
    group.orders.push(order)
    weekGroups.set(key, group)
  }
  const sortedWeeks = [...weekGroups.values()].sort((a, b) => a.sampleDate.getTime() - b.sampleDate.getTime())

  const doneOrdersWithHours = orders.filter(
    (o) => o.status === 'Done' && (o.estimatedHours != null || o.actualHours != null)
  )

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Monatsplan</h1>

      <Card>
        <CardHeader>
          <CardTitle>Wochenplanung</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {sortedWeeks.length === 0 ? (
            <p className="text-sm text-muted-foreground">Noch keine Aufträge mit Zeitplanung.</p>
          ) : sortedWeeks.map((group) => (
            <div key={group.sampleDate.toISOString()} className="flex flex-col gap-2">
              <p className="text-sm font-semibold">
                KW {getISOWeek(group.sampleDate)}{' '}
                <span className="font-normal text-muted-foreground">
                  ({format(startOfISOWeek(group.sampleDate), 'dd.MM.')} – {format(endOfISOWeek(group.sampleDate), 'dd.MM.')})
                </span>
              </p>
              <div className="flex flex-col gap-2">
                {group.orders.map((order) => (
                  <div
                    key={order.id}
                    className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-medium">{order.title}</p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        {order.customer && (
                          <span className="flex items-center gap-1">
                            <Building2 className="size-3" />
                            {order.customer}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <CalendarRange className="size-3" />
                          {order.plannedStartDate ? shortDate(order.plannedStartDate) : '?'}
                          {' – '}
                          {order.plannedEndDate ? shortDate(order.plannedEndDate) : '?'}
                        </span>
                        {order.estimatedHours != null && <span>{order.estimatedHours}h geplant</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {order.assignees.length > 0 && (
                        <div className="flex items-center -space-x-1.5">
                          {order.assignees.map((a) => (
                            <div
                              key={a.id}
                              title={a.name}
                              className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold ring-2 ring-background"
                            >
                              {initials(a.name).slice(0, 2)}
                            </div>
                          ))}
                        </div>
                      )}
                      <Badge variant="secondary">{statusLabel[order.status]}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Soll/Ist-Vergleich (abgeschlossen)</CardTitle>
        </CardHeader>
        <CardContent>
          {doneOrdersWithHours.length === 0 ? (
            <p className="text-sm text-muted-foreground">Keine abgeschlossenen Aufträge mit Zeiterfassung.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titel</TableHead>
                  <TableHead>Kunde</TableHead>
                  <TableHead>Soll-Stunden</TableHead>
                  <TableHead>Ist-Stunden</TableHead>
                  <TableHead>Differenz</TableHead>
                  <TableHead>Abweichungsgrund</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {doneOrdersWithHours.map((order) => {
                  const est = order.estimatedHours
                  const act = order.actualHours
                  const diff = est != null && act != null ? act - est : null
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.title}</TableCell>
                      <TableCell>{order.customer ?? '–'}</TableCell>
                      <TableCell>{est != null ? `${est}h` : '–'}</TableCell>
                      <TableCell>{act != null ? `${act}h` : '–'}</TableCell>
                      <TableCell className={cn(diff != null && diff > 0 && 'text-destructive', diff != null && diff <= 0 && 'text-green-600')}>
                        {diff != null ? `${diff > 0 ? '+' : ''}${diff}h` : '–'}
                      </TableCell>
                      <TableCell className="max-w-[240px] truncate" title={order.deviationReason ?? undefined}>
                        {order.deviationReason || '–'}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
