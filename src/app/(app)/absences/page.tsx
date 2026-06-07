'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { DateRange } from 'react-day-picker'
import { format, differenceInBusinessDays } from 'date-fns'
import { de } from 'date-fns/locale'
import {
  CalendarDays, CheckCircle2, Clock, XCircle,
  Stethoscope, PalmtreeIcon, BabyIcon, Users,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { useEmployees } from '@/hooks/use-employees'
import {
  useRecordAbsence, useTeamAbsences, useUpdateAbsenceRequestStatus,
} from '@/hooks/use-absences'
import { isManager } from '@/lib/auth'
import { cn } from '@/lib/utils'
import type { AbsenceRequest, AbsenceType } from '@/types'

const typeLabel: Record<AbsenceType, string> = {
  Vacation:  'Urlaub',
  Sick:      'Krankheit',
  ChildSick: 'Kind krank',
}

const typeIcon: Record<AbsenceType, React.ReactNode> = {
  Vacation:  <PalmtreeIcon className="size-4" />,
  Sick:      <Stethoscope className="size-4" />,
  ChildSick: <BabyIcon className="size-4" />,
}

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

const recordableTypes: AbsenceType[] = ['Sick', 'ChildSick', 'Vacation']

export default function AbsencesPage() {
  const router = useRouter()

  // Client-side gate — the API enforces the real authorization (Admin/Manager only).
  // Read the role directly (not via the SSR-safe useIsManager hook): on the very first
  // client render that hook still reports the hydration-safe `false`, which would redirect
  // legitimate managers away before the corrected value lands.
  useEffect(() => {
    if (!isManager()) router.replace('/dashboard')
  }, [router])

  const { data: employees = [] }      = useEmployees()
  const { data: requests = [], isLoading } = useTeamAbsences()
  const recordAbsence    = useRecordAbsence()
  const updateStatus     = useUpdateAbsenceRequestStatus()

  const [employeeId, setEmployeeId] = useState<string>('')
  const [type,       setType]       = useState<AbsenceType>('Sick')
  const [range,      setRange]      = useState<DateRange | undefined>(undefined)
  const [comment,    setComment]    = useState('')

  const selectedDays =
    range?.from && range?.to
      ? differenceInBusinessDays(range.to, range.from) + 1
      : null

  const openVacationRequests = requests.filter((r) => r.type === 'Vacation' && r.status === 'Open')
  const sickThisMonth = requests.filter((r) =>
    (r.type === 'Sick' || r.type === 'ChildSick') &&
    new Date(r.startDate).getMonth() === new Date().getMonth()
  ).length

  const handleSubmit = () => {
    if (!employeeId || !range?.from || !range?.to) return
    recordAbsence.mutate(
      {
        userId: employeeId,
        type,
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
      <h1 className="text-2xl font-semibold tracking-tight">Fehlzeiten</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-l-[4px] border-l-ring flex flex-col">
          <CardContent className="flex-1 flex flex-col items-center justify-center gap-2 py-6 text-center">
            <div className="flex items-center justify-center size-10 rounded-full bg-ring/10 text-ring">
              <Clock className="size-5" />
            </div>
            <p className="text-3xl font-bold leading-none">{openVacationRequests.length}</p>
            <p className="text-sm text-muted-foreground">Urlaubsanträge offen</p>
          </CardContent>
        </Card>

        <Card className="border-l-[4px] border-l-destructive flex flex-col">
          <CardContent className="flex-1 flex flex-col items-center justify-center gap-2 py-6 text-center">
            <div className="flex items-center justify-center size-10 rounded-full bg-destructive/10 text-destructive">
              <Stethoscope className="size-5" />
            </div>
            <p className="text-3xl font-bold leading-none">{sickThisMonth}</p>
            <p className="text-sm text-muted-foreground">Krankmeldungen diesen Monat</p>
          </CardContent>
        </Card>

        <Card className="border-l-[4px] border-l-muted-foreground flex flex-col">
          <CardContent className="flex-1 flex flex-col items-center justify-center gap-2 py-6 text-center">
            <div className="flex items-center justify-center size-10 rounded-full bg-muted text-muted-foreground">
              <Users className="size-5" />
            </div>
            <p className="text-3xl font-bold leading-none">{requests.length}</p>
            <p className="text-sm text-muted-foreground">Fehlzeiten gesamt erfasst</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[auto_1fr]">

        {/* Record form */}
        <Card className="w-full xl:w-80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Stethoscope className="size-4" />
              Abwesenheit erfassen
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="employee">Mitarbeiter</Label>
              <Select value={employeeId} onValueChange={(v) => setEmployeeId(v as string)}>
                <SelectTrigger id="employee" className="w-full">
                  <SelectValue placeholder="Mitarbeiter wählen…">
                    {(value: string | null) => {
                      const employee = employees.find((e) => e.id === value)
                      return employee ? `${employee.firstName} ${employee.lastName}` : 'Mitarbeiter wählen…'
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {employees?.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.firstName} {e.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="type">Art der Abwesenheit</Label>
              <Select value={type} onValueChange={(v) => setType(v as AbsenceType)}>
                <SelectTrigger id="type" className="w-full">
                  <SelectValue placeholder="Typ wählen…">
                    {(value: AbsenceType | null) =>
                      value ? (
                        <span className="flex items-center gap-2">{typeIcon[value]} {typeLabel[value]}</span>
                      ) : (
                        'Typ wählen…'
                      )
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {recordableTypes.map((t) => (
                    <SelectItem key={t} value={t}>
                      <span className="flex items-center gap-2">{typeIcon[t]} {typeLabel[t]}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Calendar
              mode="range"
              selected={range}
              onSelect={setRange}
              locale={de}
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
                placeholder="z.B. Grippaler Infekt"
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!employeeId || !range?.from || !range?.to || recordAbsence.isPending}
              className="w-full"
            >
              Eintragen
            </Button>
            <p className="text-xs text-muted-foreground -mt-2">
              Der Eintrag gilt sofort als bestätigt und zählt mit 8h pro Tag in der Zeiterfassung.
            </p>
          </CardContent>
        </Card>

        {/* Team overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <CalendarDays className="size-4" />
              Fehlzeiten im Team
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mitarbeiter</TableHead>
                  <TableHead>Art</TableHead>
                  <TableHead>Zeitraum</TableHead>
                  <TableHead>Tage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Kommentar</TableHead>
                  <TableHead className="text-right">Aktion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((a) => {
                  const cfg = statusConfig[a.status]
                  return (
                    <TableRow key={a.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-medium">{a.userName}</TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          {typeIcon[a.type]} {typeLabel[a.type]}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(a.startDate), 'dd.MM.yyyy')}
                        <span> – </span>
                        {format(new Date(a.endDate), 'dd.MM.yyyy')}
                      </TableCell>
                      <TableCell className="font-medium tabular-nums">{a.businessDays}</TableCell>
                      <TableCell>
                        <Badge
                          variant={cfg.variant}
                          className={cn('flex w-fit items-center gap-1', cfg.className ?? '')}
                        >
                          {cfg.icon}
                          {statusLabel[a.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{a.comment ?? '—'}</TableCell>
                      <TableCell className="text-right">
                        {a.status === 'Open' ? (
                          <div className="flex justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-success text-success hover:bg-success/10"
                              disabled={updateStatus.isPending}
                              onClick={() => updateStatus.mutate({ id: a.id, status: 'Approved' })}
                            >
                              Genehmigen
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-destructive text-destructive hover:bg-destructive/10"
                              disabled={updateStatus.isPending}
                              onClick={() => updateStatus.mutate({ id: a.id, status: 'Rejected' })}
                            >
                              Ablehnen
                            </Button>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                      Lade Fehlzeiten…
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && requests.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                      Noch keine Fehlzeiten erfasst
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
