'use client'

import { useState } from 'react'
import { isAxiosError } from 'axios'
import { format, subDays } from 'date-fns'
import { Pencil, Plus } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useCreateManualEntry, useEditEntry, type ManualEntryInput } from '@/hooks/use-time-tracking'
import { useIsManager } from '@/lib/auth'
import type { TimeEntry } from '@/types'

const MAX_BACKDATE_DAYS = 30
const MAX_NOTE_LENGTH = 500

interface FormState {
  date: string
  startTime: string
  endTime: string
  note: string
}

const todayIso = () => format(new Date(), 'yyyy-MM-dd')

// The form fields show the date/time in the user's local timezone, but the API
// stores Date/StartTime/EndTime as literal UTC values (no conversion). Convert
// the local values to their UTC equivalent before sending.
function toUtcDateAndTime(date: string, time: string) {
  const iso = new Date(`${date}T${time}`).toISOString()
  return { date: iso.slice(0, 10), time: iso.slice(11, 19) }
}

const toInput = (form: FormState): ManualEntryInput => {
  const startTime = form.startTime.length === 5 ? `${form.startTime}:00` : form.startTime
  const endTime = form.endTime.length === 5 ? `${form.endTime}:00` : form.endTime
  const start = toUtcDateAndTime(form.date, startTime)
  const end = toUtcDateAndTime(form.date, endTime)
  return {
    date: start.date,
    startTime: start.time,
    endTime: end.time,
    note: form.note.trim(),
  }
}

function extractErrorMessages(err: unknown): string[] {
  if (isAxiosError(err) && err.response?.data) {
    const data = err.response.data as { errors?: Record<string, string[]>; detail?: string }
    if (data.errors) return Object.values(data.errors).flat()
    if (data.detail) return [data.detail]
  }
  return ['Der Eintrag konnte nicht gespeichert werden.']
}

function useFieldErrors(form: FormState, isEmployee: boolean, original?: Pick<FormState, 'date' | 'startTime' | 'endTime'>) {
  const earliestAllowed = format(subDays(new Date(), MAX_BACKDATE_DAYS), 'yyyy-MM-dd')

  const timeUnchanged = !!original
    && form.date === original.date
    && form.startTime === original.startTime
    && form.endTime === original.endTime

  return {
    date: !form.date
      ? 'Das Datum ist erforderlich.'
      : form.date > todayIso()
        ? 'Die Zeiterfassung darf nicht in der Zukunft liegen.'
        : isEmployee && form.date < earliestAllowed
          ? `Mitarbeiter können Einträge nur für die letzten ${MAX_BACKDATE_DAYS} Tage erfassen.`
          : null,
    startTime: !form.startTime ? 'Bitte die Kommen-Zeit angeben.' : null,
    endTime: !form.endTime
      ? 'Bitte die Gehen-Zeit angeben.'
      : (form.startTime && form.endTime <= form.startTime)
        ? 'Die Endzeit muss nach der Startzeit liegen.'
        : null,
    note: !form.note.trim()
      ? 'Bitte geben Sie einen Grund für die Korrektur an.'
      : form.note.length > MAX_NOTE_LENGTH
        ? `Der Grund darf maximal ${MAX_NOTE_LENGTH} Zeichen lang sein.`
        : null,
    general: timeUnchanged
      ? 'Bitte ändern Sie die Kommen- oder Gehen-Zeit, um eine Korrektur einzureichen.'
      : null,
  }
}

interface ManualEntryFieldsProps {
  form: FormState
  setForm: (updater: (f: FormState) => FormState) => void
  errors: ReturnType<typeof useFieldErrors>
  showError: (field: keyof FormState) => boolean
  markTouched: (field: keyof FormState) => () => void
  highlightFields?: (keyof FormState)[]
}

function ManualEntryFields({ form, setForm, errors, showError, markTouched, highlightFields = [] }: ManualEntryFieldsProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="me-date">Datum *</Label>
          <Input
            id="me-date"
            type="date"
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            onBlur={markTouched('date')}
            required
            aria-invalid={showError('date') && !!errors.date}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="me-start">Kommen *</Label>
          <Input
            id="me-start"
            type="time"
            value={form.startTime}
            onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
            onBlur={markTouched('startTime')}
            required
            aria-invalid={(showError('startTime') && !!errors.startTime) || highlightFields.includes('startTime')}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="me-end">Gehen *</Label>
          <Input
            id="me-end"
            type="time"
            value={form.endTime}
            onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
            onBlur={markTouched('endTime')}
            required
            aria-invalid={(showError('endTime') && !!errors.endTime) || highlightFields.includes('endTime')}
          />
        </div>
      </div>
      {(['date', 'startTime', 'endTime'] as const).map((field) => (
        showError(field) && errors[field] && (
          <p key={field} className="text-sm text-destructive -mt-2">{errors[field]}</p>
        )
      ))}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="me-note">Grund / Anmerkung *</Label>
        <Textarea
          id="me-note"
          value={form.note}
          onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
          onBlur={markTouched('note')}
          placeholder="z.B. Vergessen einzustempeln"
          maxLength={MAX_NOTE_LENGTH}
          required
          aria-invalid={showError('note') && !!errors.note}
        />
        {showError('note') && errors.note && (
          <p className="text-sm text-destructive">{errors.note}</p>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Create — "Zeit manuell erfassen"
// ---------------------------------------------------------------------------

const emptyForm: FormState = { date: todayIso(), startTime: '', endTime: '', note: '' }

export function CreateManualEntryDialog() {
  const [open, setOpen] = useState(false)
  const isEmployee = !useIsManager()

  const [form, setForm] = useState<FormState>(emptyForm)
  const [touched, setTouched] = useState<Partial<Record<keyof FormState, boolean>>>({})
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [serverErrors, setServerErrors] = useState<string[]>([])

  const createManualEntry = useCreateManualEntry()

  const reset = () => {
    setForm(emptyForm)
    setTouched({})
    setSubmitAttempted(false)
    setServerErrors([])
  }

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) reset()
  }

  const markTouched = (field: keyof FormState) => () => setTouched((t) => ({ ...t, [field]: true }))
  const showError = (field: keyof FormState) => touched[field] || submitAttempted

  const errors = useFieldErrors(form, isEmployee)
  const canSubmit = !Object.values(errors).some(Boolean)

  const handleSubmit = () => {
    setSubmitAttempted(true)
    setServerErrors([])
    if (!canSubmit) return
    createManualEntry.mutate(toInput(form), {
      onSuccess: () => {
        handleOpenChange(false)
        toast.success('Eintrag eingereicht', {
          description: 'Der Eintrag wartet auf Genehmigung durch einen Vorgesetzten.',
        })
      },
      onError: (err) => {
        const messages = extractErrorMessages(err)
        setServerErrors(messages)
        toast.error('Eintrag konnte nicht gespeichert werden', { description: messages[0] })
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button variant="outline" />}>
        <Plus className="size-4" /> Zeit manuell erfassen
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Zeit manuell erfassen</DialogTitle>
        </DialogHeader>

        <ManualEntryFields form={form} setForm={setForm} errors={errors} showError={showError} markTouched={markTouched} />

        {serverErrors.map((msg) => (
          <p key={msg} className="text-sm text-destructive">{msg}</p>
        ))}

        <p className="text-xs text-muted-foreground">
          Der Eintrag wird zur Prüfung eingereicht und zählt erst nach Genehmigung zur Arbeitszeit.
        </p>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>Abbrechen</Button>
          <Button onClick={handleSubmit} disabled={createManualEntry.isPending}>Einreichen</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Edit — Stift-Icon an einer bestehenden Buchung
// ---------------------------------------------------------------------------

export function EditTimeEntryDialog({ entry, onClose }: { entry: TimeEntry; onClose: () => void }) {
  const isEmployee = !useIsManager()

  // Use the local date of clockIn, matching the locally-displayed time fields below
  // (entry.date is the UTC date and can differ near midnight).
  const [original] = useState<FormState>({
    date: format(new Date(entry.clockIn), 'yyyy-MM-dd'),
    startTime: format(new Date(entry.clockIn), 'HH:mm'),
    endTime: format(new Date(entry.clockOut), 'HH:mm'),
    note: entry.note ?? '',
  })
  const [form, setForm] = useState<FormState>(original)
  const [touched, setTouched] = useState<Partial<Record<keyof FormState, boolean>>>({})
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [serverErrors, setServerErrors] = useState<string[]>([])

  const editEntry = useEditEntry()

  const markTouched = (field: keyof FormState) => () => setTouched((t) => ({ ...t, [field]: true }))
  const showError = (field: keyof FormState) => touched[field] || submitAttempted
  const showGeneralError = submitAttempted

  const errors = useFieldErrors(form, isEmployee, original)
  const canSubmit = !Object.values(errors).some(Boolean)

  const handleSubmit = () => {
    setSubmitAttempted(true)
    setServerErrors([])
    if (!canSubmit) return
    editEntry.mutate({ id: entry.id, ...toInput(form) }, {
      onSuccess: (updated) => {
        onClose()
        if (updated.status === 'Pending') {
          toast.success('Korrektur eingereicht', {
            description: 'Die Zeiten haben sich geändert und werden erneut geprüft.',
          })
        } else {
          toast.success('Gespeichert')
        }
      },
      onError: (err) => {
        const messages = extractErrorMessages(err)
        setServerErrors(messages)
        toast.error('Eintrag konnte nicht gespeichert werden', { description: messages[0] })
      },
    })
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Zeiteintrag bearbeiten</DialogTitle>
        </DialogHeader>

        <ManualEntryFields
          form={form}
          setForm={setForm}
          errors={errors}
          showError={showError}
          markTouched={markTouched}
          highlightFields={showGeneralError && errors.general ? ['startTime', 'endTime'] : []}
        />

        {showGeneralError && errors.general && (
          <p className="text-sm text-destructive -mt-2">{errors.general}</p>
        )}

        {serverErrors.map((msg) => (
          <p key={msg} className="text-sm text-destructive">{msg}</p>
        ))}

        <p className="text-xs text-muted-foreground">
          Die Korrektur wird zur Prüfung eingereicht und zählt erst nach erneuter Genehmigung zur Arbeitszeit.
        </p>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Abbrechen</Button>
          <Button onClick={handleSubmit} disabled={editEntry.isPending}>
            <Pencil className="size-4" /> Speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
