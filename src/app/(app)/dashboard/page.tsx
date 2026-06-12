'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ClockButton } from '@/components/time-tracking/stamp-button'
import { ClipboardList, CalendarCheck, TrendingUp, Timer, PartyPopper } from 'lucide-react'
import { useCompanySettings } from '@/hooks/use-company-settings'
import { useOrders } from '@/hooks/use-orders'
import { useTimeBalance } from '@/hooks/use-time-tracking'
import { useAbsenceRequests } from '@/hooks/use-absences'
import { getNextHoliday } from '@/lib/holidays'
import { formatDiff } from '@/lib/format'
import { cn } from '@/lib/utils'
import { differenceInCalendarDays, format } from 'date-fns'

export default function DashboardPage() {
  const { data: companySettings } = useCompanySettings()
  const { data: orders = [] } = useOrders()
  const { data: balance, isLoading: balanceLoading, isError: balanceError } = useTimeBalance()
  const { data: absenceRequests = [], isLoading: absencesLoading } = useAbsenceRequests()
  const nextHoliday = companySettings ? getNextHoliday(new Date(), companySettings.state) : null
  const daysUntil = nextHoliday ? differenceInCalendarDays(nextHoliday.date, new Date()) : null

  const openOrders = orders.filter((o) => o.status !== 'Done')
  const inProgressOrders = orders.filter((o) => o.status === 'InProgress')

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const nextVacation = absenceRequests
    .filter((a) => a.type === 'Vacation' && a.status === 'Approved' && new Date(a.endDate) >= today)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())[0]

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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
              <CalendarCheck className="size-4" />
              Nächster Urlaubstag
            </CardTitle>
          </CardHeader>
          <CardContent>
            {absencesLoading ? (
              <p className="text-sm text-muted-foreground">Lädt…</p>
            ) : nextVacation ? (
              <>
                <p className="text-3xl font-bold">{format(new Date(nextVacation.startDate), 'dd.MM.')}</p>
                <p className="text-sm text-muted-foreground mt-1">Genehmigt · {nextVacation.businessDays} Tage</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Kein Urlaub geplant</p>
            )}
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
            {balanceLoading || balanceError || !balance ? (
              <p className="text-sm text-muted-foreground">{balanceError ? '—' : 'Lädt…'}</p>
            ) : (
              <p className={cn(
                'text-3xl font-bold',
                balance.totalBalanceMinutes >= 0 ? 'text-success' : 'text-destructive'
              )}>
                {formatDiff(balance.totalBalanceMinutes)}
              </p>
            )}
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
