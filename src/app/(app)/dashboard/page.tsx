import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StempelButton } from '@/components/zeiterfassung/stempel-button'
import { ClipboardList, CalendarCheck, TrendingUp } from 'lucide-react'

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Dashboard</h1>

      <Card>
        <CardHeader>
          <CardTitle>Stempeluhr</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-4">
          <StempelButton />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <ClipboardList className="size-4" />
              Offene Aufträge
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">5</p>
            <p className="text-xs text-muted-foreground mt-1">2 in Bearbeitung</p>
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
            <p className="text-xs text-muted-foreground mt-1">Genehmigt · 5 Tage</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <TrendingUp className="size-4" />
              Überstunden diese Woche
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">+2:30</p>
            <p className="text-xs text-muted-foreground mt-1">Sollzeit: 40:00 h</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
