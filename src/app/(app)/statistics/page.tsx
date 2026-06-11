'use client'

import { useState } from 'react'
import {
  Bar, BarChart, CartesianGrid, Legend, Pie, PieChart, ResponsiveContainer, Sector, Tooltip, XAxis, YAxis,
} from 'recharts'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Euro, ClipboardList, CheckCircle2, AlertTriangle } from 'lucide-react'
import { useOrders } from '@/hooks/use-orders'
import {
  startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, isWithinInterval, format,
} from 'date-fns'
import { de } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import type { OrderStatus } from '@/types'

const currencyFormatter = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' })

const STATUS_CONFIG: { key: OrderStatus; label: string; color: string }[] = [
  { key: 'ToDo',               label: 'Zu Erledigen',        color: 'var(--chart-1)' },
  { key: 'InProgress',         label: 'In Bearbeitung',      color: 'var(--chart-2)' },
  { key: 'ReadyForAcceptance', label: 'Bereit für Abnahme',  color: 'var(--chart-3)' },
  { key: 'Invoicing',          label: 'Rechnungserstellung', color: 'var(--chart-4)' },
  { key: 'Done',               label: 'Erledigt',            color: 'var(--success)' },
]

export default function StatisticsPage() {
  const { data: orders = [] } = useOrders()
  const [revenueRange, setRevenueRange] = useState<6 | 12>(6)

  const now = new Date()

  // KPIs
  const yearStart = startOfYear(now)
  const yearEnd = endOfYear(now)
  const yearlyRevenue = orders
    .filter((o) => o.invoiceDate && isWithinInterval(new Date(o.invoiceDate), { start: yearStart, end: yearEnd }))
    .reduce((sum, o) => sum + (o.revenue ?? 0), 0)

  const doneOrders = orders.filter((o) => o.status === 'Done')
  const openOrders = orders.filter((o) => o.status !== 'Done')
  const inProgressOrders = orders.filter((o) => o.status === 'InProgress')

  const deviations = doneOrders
    .filter((o) => o.estimatedHours != null && o.actualHours != null)
    .map((o) => o.actualHours! - o.estimatedHours!)
  const avgDeviation = deviations.length
    ? deviations.reduce((a, b) => a + b, 0) / deviations.length
    : null

  // Umsatz pro Monat
  const revenueData = Array.from({ length: revenueRange }, (_, i) => {
    const monthStart = subMonths(startOfMonth(now), revenueRange - 1 - i)
    const monthEnd = endOfMonth(monthStart)
    const total = orders
      .filter((o) => o.invoiceDate && isWithinInterval(new Date(o.invoiceDate), { start: monthStart, end: monthEnd }))
      .reduce((sum, o) => sum + (o.revenue ?? 0), 0)
    return { month: format(monthStart, 'MMM yy', { locale: de }), total }
  })

  // Aufträge nach Status
  const statusData = STATUS_CONFIG
    .map((s) => ({ ...s, count: orders.filter((o) => o.status === s.key).length }))
    .filter((s) => s.count > 0)

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Statistik</h1>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Euro className="size-4" />
              Umsatz (laufendes Jahr)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{currencyFormatter.format(yearlyRevenue)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <CheckCircle2 className="size-4" />
              Abgeschlossene Aufträge
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{doneOrders.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <ClipboardList className="size-4" />
              Offene Aufträge
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{openOrders.length}</p>
            <p className="text-sm text-muted-foreground mt-1">{inProgressOrders.length} in Bearbeitung</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <AlertTriangle className="size-4" />
              Ø Soll/Ist-Abweichung
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={cn(
                'text-3xl font-bold',
                avgDeviation != null && avgDeviation > 0 && 'text-destructive',
                avgDeviation != null && avgDeviation <= 0 && 'text-green-600'
              )}
            >
              {avgDeviation != null ? `${avgDeviation > 0 ? '+' : ''}${avgDeviation.toFixed(1)}h` : '–'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Umsatz pro Monat</CardTitle>
            <CardAction>
              <div className="flex gap-1">
                <Button size="sm" variant={revenueRange === 6 ? 'secondary' : 'outline'} onClick={() => setRevenueRange(6)}>
                  6 Monate
                </Button>
                <Button size="sm" variant={revenueRange === 12 ? 'secondary' : 'outline'} onClick={() => setRevenueRange(12)}>
                  12 Monate
                </Button>
              </div>
            </CardAction>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                  <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" width={64} tickFormatter={(v) => currencyFormatter.format(Number(v))} />
                  <Tooltip
                    formatter={(value) => currencyFormatter.format(Number(value))}
                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '0.5rem', fontSize: '0.875rem' }}
                  />
                  <Bar dataKey="total" name="Umsatz" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aufträge nach Status</CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length === 0 ? (
              <p className="text-sm text-muted-foreground">Noch keine Aufträge.</p>
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      dataKey="count"
                      nameKey="label"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      shape={(props) => <Sector {...props} fill={props.payload.color} />}
                    />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '0.5rem', fontSize: '0.875rem' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
