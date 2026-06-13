'use client'

import { useState } from 'react'
import type { DateRange } from 'react-day-picker'
import { format } from 'date-fns'
import {
  useCreateAbsenceRequest, useAbsenceRequests, useUpdateAbsenceRequest,
} from '@/hooks/use-absences'
import { useCompanySettings } from '@/hooks/use-company-settings'
import { countWorkingDays } from '@/lib/holidays'
import { de } from 'date-fns/locale'
import { CalendarDays, CheckCircle2, Clock, XCircle, PalmtreeIcon, Timer, Pencil, Trash2 } from 'lucide-react'
import { CancelAbsenceRequestDialog } from '@/components/absences/cancel-absence-request-dialog'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { AbsenceRequest, AbsenceType } from '@/types'

const TOTAL_DAYS = 30

const selfServiceTypes: ('Vacation' | 'FlexTimeCompensation')[] = ['Vacation', 'FlexTimeCompensation']

const typeLabel: Record<'Vacation' | 'FlexTimeCompensation', string> = {
  Vacation:            'Urlaub',
  FlexTimeCompensation: 'Gleitzeitabbau',
}

const typeIcon: Record<'Vacation' | 'FlexTimeCompensation', React.ReactNode> = {
  Vacation:            <PalmtreeIcon className="size-4" />,
  FlexTimeCompensation: <Timer className="size-4" />,
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

export default function VacationPage() {
  const { data: allRequests = [], isLoading } = useAbsenceRequests()
  const { data: companySettings } = useCompanySettings()
  const createRequest = useCreateAbsenceRequest()
  const updateRequest = useUpdateAbsenceRequest()
  const [range,       setRange]       = useState<DateRange | undefined>(undefined)
  const [absenceType, setAbsenceType] = useState<AbsenceType | null>(null)
  const [comment,     setComment]     = useState('')
  const [typeError,   setTypeError]   = useState(false)
  const [editingId,   setEditingId]   = useState<string | null>(null)
  const [cancelTarget, setCancelTarget] = useState<AbsenceRequest | null>(null)

  const requests = allRequests.filter(
    (a) => a.type === 'Vacation' || a.type === 'FlexTimeCompensation',
  )

  // Anträge, deren Zeitraum noch nicht begonnen hat, können bearbeitet bzw. storniert werden.
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const canModify = (a: AbsenceRequest) => a.startDate >= todayStr

  const approvedDays = requests
    .filter((a) => a.status === 'Approved' && a.type === 'Vacation')
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
    if (!absenceType) {
      setTypeError(true)
      return
    }
    if (!range?.from || !range?.to) return

    const payload = {
      type:      absenceType,
      startDate: format(range.from, 'yyyy-MM-dd'),
      endDate:   format(range.to, 'yyyy-MM-dd'),
      comment: comment.trim() || undefined,
    }

    const onSuccess = () => {
      setRange(undefined)
      setAbsenceType(null)
      setComment('')
      setTypeError(false)
      setEditingId(null)
    }

    if (editingId) {
      updateRequest.mutate({ id: editingId, ...payload }, { onSuccess })
    } else {
      createRequest.mutate(payload, { onSuccess })
    }
  }

  const handleEdit = (a: AbsenceRequest) => {
    setEditingId(a.id)
    setAbsenceType(a.type)
    setRange({ from: new Date(a.startDate), to: new Date(a.endDate) })
    setComment(a.comment ?? '')
    setTypeError(false)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setRange(undefined)
    setAbsenceType(null)
    setComment('')
    setTypeError(false)
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
              {editingId ? 'Antrag bearbeiten' : 'Antrag stellen'}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">

            {/* Urlaubsart — Pflichtfeld (AC1 + AC2) */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="absence-type">
                Art der Abwesenheit <span className="text-destructive">*</span>
              </Label>
              <Select
                value={absenceType}
                onValueChange={(v) => {
                  setAbsenceType(v as AbsenceType)
                  setTypeError(false)
                }}
              >
                <SelectTrigger
                  id="absence-type"
                  className="w-full"
                  aria-invalid={typeError}
                >
                  <SelectValue placeholder="Bitte wählen…">
                    {(value: AbsenceType | null) =>
                      value && (value === 'Vacation' || value === 'FlexTimeCompensation') ? (
                        <span className="flex items-center gap-2">
                          {typeIcon[value]} {typeLabel[value]}
                        </span>
                      ) : (
                        'Bitte wählen…'
                      )
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {selfServiceTypes.map((t) => (
                    <SelectItem key={t} value={t}>
                      <span className="flex items-center gap-2">{typeIcon[t]} {typeLabel[t]}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {typeError && (
                <p className="text-xs text-destructive">Bitte wählen Sie eine Urlaubsart aus.</p>
              )}
            </div>

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

            <div className="flex gap-2">
              {editingId && (
                <Button variant="outline" onClick={handleCancelEdit} className="flex-1">
                  Abbrechen
                </Button>
              )}
              <Button
                onClick={handleSubmit}
                disabled={!range?.from || !range?.to || createRequest.isPending || updateRequest.isPending}
                className="flex-1"
              >
                {editingId ? 'Aktualisieren' : 'Antrag einreichen'}
              </Button>
            </div>
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
                  <TableHead>Art</TableHead>
                  <TableHead>Zeitraum</TableHead>
                  <TableHead>Tage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Kommentar</TableHead>
                  <TableHead>Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((a) => {
                  const days = a.businessDays
                  const cfg  = statusConfig[a.status]
                  const selfServiceType =
                    a.type === 'Vacation' || a.type === 'FlexTimeCompensation' ? a.type : null
                  return (
                    <TableRow key={a.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell>
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          {selfServiceType ? typeIcon[selfServiceType] : null}
                          {selfServiceType ? typeLabel[selfServiceType] : a.type}
                        </span>
                      </TableCell>
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
                      <TableCell>
                        {canModify(a) && (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7"
                              aria-label="Antrag bearbeiten"
                              onClick={() => handleEdit(a)}
                            >
                              <Pencil className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 text-destructive hover:text-destructive"
                              aria-label="Antrag stornieren"
                              onClick={() => setCancelTarget(a)}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                      Lade Anträge…
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && requests.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                      Noch keine Anträge gestellt
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

      </div>

      {cancelTarget && (
        <CancelAbsenceRequestDialog request={cancelTarget} onClose={() => setCancelTarget(null)} />
      )}
    </div>
  )
}
