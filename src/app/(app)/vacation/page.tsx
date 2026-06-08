'use client'

import { useState } from 'react'
import type { DateRange } from 'react-day-picker'
import { format } from 'date-fns'
import { useCreateAbsenceRequest, useAbsenceRequests } from '@/hooks/use-absences'
import { useCompanySettings } from '@/hooks/use-company-settings'
import { countWorkingDays } from '@/lib/holidays'
import { de } from 'date-fns/locale'
import { CalendarDays, CheckCircle2, Clock, XCircle, PalmtreeIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { AbsenceRequest } from '@/types'

const TOTAL_DAYS = 30

const statusLabel: Record<AbsenceRequest['status'], string> = {
  Approved: 'Genehmigt',
  Open:     'Offen',
  Rejected: 'Abgelehnt',
}

const statusConfig: Record<AbsenceRequest['status'], {
  variant: 'default' | 'outline' | 'destructive'
  className?: string
  icon: React.ReactNode
}> = {
  Approved: { variant: 'outline', className: 'border-success text-success bg-success/10', icon: <CheckCircle2 className="size-4" /> },
  Open:     { variant: 'outline', icon: <Clock className="size-4" /> },
  Rejected: { variant: 'destructive', icon: <XCircle className="size-4" /> },
}

export default function VacationPage() {
  const { data: allRequests = [], isLoading } = useAbsenceRequests()
  const { data: companySettings } = useCompanySettings()
  const createRequest = useCreateAbsenceRequest()
  const [range,    setRange]    = useState<DateRange | undefined>(undefined)
  const [comment,  setComment]  = useState('')

  const requests = allRequests.filter((a) => a.type === 'Vacation')

  const approvedDays = requests
    .filter((a) => a.status === 'Approved')
    .reduce((sum, a) => sum + a.businessDays, 0)
  const openDays = requests
    .filter((a) => a.status === 'Open')
    .reduce((sum, a) => sum + a.businessDays, 0)
  const remainingDays = TOTAL_DAYS - approvedDays
  const usedPct       = Math.round((approvedDays / TOTAL_DAYS) * 100)

  const selectedDays =
    range?.from && range?.to && companySettings
      ? countWorkingDays(range.from, range.to, companySettings.state)
      : null

  const handleSubmit = () => {
    if (!range?.from || !range?.to) return
    createRequest.mutate(
      {
        startDate: format(range.from, 'yyyy-MM-dd'),
        endDate:   format(range.to, 'yyyy-MM-dd'),
        comment: comment.trim() || undefined,
      },
      {
        onSuccess: () => {
          setRange(undefined)
          setComment('')
        },
      }
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Urlaub</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-l-[4px] border-l-success flex flex-col">
          <CardContent className="flex-1 flex flex-col items-center justify-center gap-2 py-6 text-center">
            <div className="flex items-center justify-center size-10 rounded-full bg-muted text-muted-foreground">
              <PalmtreeIcon className="size-5" />
            </div>
            <p className="text-3xl font-bold leading-none">{remainingDays}</p>
            <p className="text-sm text-muted-foreground">von {TOTAL_DAYS} Tagen gesamt</p>
            {/* Quota bar */}
            <div className="w-full mt-1">
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-success/70 to-success transition-all"
                  style={{ width: `${usedPct}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">{usedPct}% verbraucht</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-[4px] border-l-ring flex flex-col">
          <CardContent className="flex-1 flex flex-col items-center justify-center gap-2 py-6 text-center">
            <div className="flex items-center justify-center size-10 rounded-full bg-ring/10 text-ring">
              <CheckCircle2 className="size-5" />
            </div>
            <p className="text-3xl font-bold leading-none">{approvedDays}</p>
            <p className="text-sm text-muted-foreground">Urlaubstage geplant</p>
          </CardContent>
        </Card>

        <Card className="border-l-[4px] border-l-muted-foreground flex flex-col">
          <CardContent className="flex-1 flex flex-col items-center justify-center gap-2 py-6 text-center">
            <div className="flex items-center justify-center size-10 rounded-full bg-muted text-muted-foreground">
              <Clock className="size-5" />
            </div>
            <p className="text-3xl font-bold leading-none">{openDays}</p>
            <p className="text-sm text-muted-foreground">Tage zur Genehmigung</p>
          </CardContent>
        </Card>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[auto_1fr]">

        {/* Form */}
        <Card className="w-full xl:w-80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <CalendarDays className="size-4" />
              Antrag stellen
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Calendar
              mode="range"
              selected={range}
              onSelect={setRange}
              locale={de}
              disabled={{ before: new Date() }}
            />

            {selectedDays !== null && (
              <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-2">
                <span className="text-sm text-muted-foreground">
                  {format(range!.from!, 'dd.MM.yyyy')}
                  {range?.to ? ` – ${format(range.to, 'dd.MM.yyyy')}` : ''}
                </span>
                <Badge variant="secondary">{selectedDays} Tage</Badge>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="comment">Kommentar (optional)</Label>
              <Input
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="z.B. Familienurlaub"
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!range?.from || !range?.to}
              className="w-full"
            >
              Antrag einreichen
            </Button>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <CalendarDays className="size-4" />
              Meine Anträge
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Zeitraum</TableHead>
                  <TableHead>Tage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Kommentar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((a) => {
                  const days = a.businessDays
                  const cfg  = statusConfig[a.status]
                  return (
                    <TableRow key={a.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-medium">
                        {format(new Date(a.startDate), 'dd.MM.yyyy')}
                        <span className="text-muted-foreground"> – </span>
                        {format(new Date(a.endDate), 'dd.MM.yyyy')}
                      </TableCell>
                      <TableCell className="font-medium tabular-nums">{days}</TableCell>
                      <TableCell>
                        <Badge
                          variant={cfg.variant}
                          className={`flex w-fit items-center gap-1 ${cfg.className ?? ''}`}
                        >
                          {cfg.icon}
                          {statusLabel[a.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {a.comment ?? '—'}
                      </TableCell>
                    </TableRow>
                  )
                })}
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-10">
                      Lade Anträge…
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && requests.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-10">
                      Noch keine Anträge gestellt
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
