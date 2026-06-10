'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ClockButton } from '@/components/time-tracking/stamp-button'
import { ClipboardList, CalendarCheck, TrendingUp, Timer, PartyPopper, Euro } from 'lucide-react'
import { useCompanySettings } from '@/hooks/use-company-settings'
import { useOrders } from '@/hooks/use-orders'
import { getNextHoliday } from '@/lib/holidays'
import { differenceInCalendarDays, format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns'

const currencyFormatter = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' })

export default function DashboardPage() {
  const { data: companySettings } = useCompanySettings()
  const { data: orders = [] } = useOrders()
  const nextHoliday = companySettings ? getNextHoliday(new Date(), companySettings.state) : null
  const daysUntil = nextHoliday ? differenceInCalendarDays(nextHoliday.date, new Date()) : null

  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  const monthlyOrders = orders.filter(
    (o) => o.invoiceDate && isWithinInterval(new Date(o.invoiceDate), { start: monthStart, end: monthEnd })
  )
  const monthlyRevenue = monthlyOrders.reduce((sum, o) => sum + (o.revenue ?? 0), 0)

  const openOrders = orders.filter((o) => o.status !== 'Done')
  const inProgressOrders = orders.filter((o) => o.status === 'InProgress')

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Timer className="size-4" />
              Stempeluhr
            </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-4">
          <ClockButton />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
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
              <Euro className="size-4" />
              Umsatz diesen Monat
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{currencyFormatter.format(monthlyRevenue)}</p>
            <p className="text-sm text-muted-foreground mt-1">{monthlyOrders.length} Aufträge abgerechnet</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <CalendarCheck className="size-4" />
              Nächster Urlaubstag
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">15.07</p>
            <p className="text-sm text-muted-foreground mt-1">Genehmigt · 5 Tage</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <TrendingUp className="size-4" />
              Überstunden gesamt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">+2:30</p>
            <p className="text-sm text-muted-foreground mt-1">Zeitkonto-Saldo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <PartyPopper className="size-4" />
              Nächster Feiertag
            </CardTitle>
          </CardHeader>
          <CardContent>
            {nextHoliday ? (
              <>
                <p className="text-3xl font-bold">{format(nextHoliday.date, 'dd.MM.')}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {nextHoliday.name}
                  {daysUntil !== null && (
                    <> · {daysUntil === 0 ? 'heute' : daysUntil === 1 ? 'morgen' : `in ${daysUntil} Tagen`}</>
                  )}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Lädt…</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
