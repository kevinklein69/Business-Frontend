'use client'

import { useState } from 'react'
import { isAxiosError } from 'axios'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useCreatePlanningPeriod, useUpdatePlanningPeriod } from '@/hooks/use-planning-periods'
import type { PlanningPeriod, PlanningPeriodStatus } from '@/types'

/** Default-Vorschlag für den Namen: aktueller Monat, z. B. „Juni 2026". */
export function defaultPeriodName() {
  const name = format(new Date(), 'LLLL yyyy', { locale: de })
  return name.charAt(0).toUpperCase() + name.slice(1)
}

const editableStatusLabels: Record<Exclude<PlanningPeriodStatus, 'Closed'>, string> = {
  Planned: 'Geplant',
  Active: 'Aktiv',
}

function errorMessage(err: unknown, fallback: string) {
  if (isAxiosError(err) && err.response?.status === 400) {
    const errors = err.response.data?.errors as Record<string, string[]> | undefined
    if (errors) return Object.values(errors).flat().join(' ')
    return 'Die Eingaben sind ungültig.'
  }
  return fallback
}

export function PlanningPeriodDialog({
  period,
  onClose,
}: {
  /** Vorhandener Zeitraum ⇒ Bearbeiten-Modus; sonst Anlegen-Modus. */
  period?: PlanningPeriod | null
  onClose: () => void
}) {
  const isEdit = !!period
  const [name, setName] = useState(period?.name ?? defaultPeriodName())
  const [startDate, setStartDate] = useState(period?.startDate ?? '')
  const [endDate, setEndDate] = useState(period?.endDate ?? '')
  const [status, setStatus] = useState<PlanningPeriodStatus>(period?.status ?? 'Planned')
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const create = useCreatePlanningPeriod()
  const update = useUpdatePlanningPeriod()
  const isPending = create.isPending || update.isPending

  const markTouched = (field: string) => () => setTouched((t) => ({ ...t, [field]: true }))
  const showError = (field: string) => touched[field] || submitAttempted

  const fieldErrors = {
    name: name.trim() ? null : 'Der Name darf nicht leer sein.',
    startDate: startDate ? null : 'Das Startdatum ist erforderlich.',
    endDate: !endDate
      ? 'Das Enddatum ist erforderlich.'
      : startDate && endDate < startDate
        ? 'Das Enddatum darf nicht vor dem Startdatum liegen.'
        : null,
  }
  const canSubmit = !Object.values(fieldErrors).some(Boolean)

  const handleSubmit = async () => {
    setSubmitAttempted(true)
    setError(null)
    if (!canSubmit) return
    const trimmed = name.trim()

    try {
      if (isEdit) {
        await update.mutateAsync({
          id: period!.id,
          name: trimmed,
          startDate,
          endDate,
          status,
        })
      } else {
        await create.mutateAsync({
          name: trimmed,
          startDate,
          endDate,
        })
      }
      onClose()
    } catch (err) {
      setError(errorMessage(err, 'Der Zeitraum konnte nicht gespeichert werden.'))
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && !isPending && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Zeitraum bearbeiten' : 'Neuen Zeitraum anlegen'}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-1">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="p-name">Name</Label>
            <Input
              id="p-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={markTouched('name')}
              placeholder="z.B. Juni 2026"
              required
              aria-invalid={showError('name') && !!fieldErrors.name}
            />
            {showError('name') && fieldErrors.name && (
              <p className="text-sm text-destructive">{fieldErrors.name}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="p-start">Start</Label>
              <Input
                id="p-start"
                type="date"
                required
                aria-invalid={showError('startDate') && !!fieldErrors.startDate}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                onBlur={markTouched('startDate')}
              />
              {showError('startDate') && fieldErrors.startDate && (
                <p className="text-sm text-destructive">{fieldErrors.startDate}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="p-end">Ende</Label>
              <Input
                id="p-end"
                type="date"
                required
                aria-invalid={showError('endDate') && !!fieldErrors.endDate}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                onBlur={markTouched('endDate')}
              />
              {showError('endDate') && fieldErrors.endDate && (
                <p className="text-sm text-destructive">{fieldErrors.endDate}</p>
              )}
            </div>
          </div>

          {isEdit && status !== 'Closed' && (
            <div className="flex flex-col gap-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as PlanningPeriodStatus)}>
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {(value: PlanningPeriodStatus | null) =>
                      value ? editableStatusLabels[value as Exclude<PlanningPeriodStatus, 'Closed'>] : ''}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(editableStatusLabels) as Array<keyof typeof editableStatusLabels>).map((s) => (
                    <SelectItem key={s} value={s}>{editableStatusLabels[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {status === 'Active' && period?.status !== 'Active' && (
                <p className="text-xs text-muted-foreground">
                  Ein bereits aktiver Zeitraum wird dabei automatisch abgeschlossen.
                </p>
              )}
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>Abbrechen</Button>
          <Button onClick={handleSubmit} disabled={isPending}>Speichern</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
