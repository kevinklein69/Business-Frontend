'use client'

import { useState } from 'react'
import type { DateRange } from 'react-day-picker'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { PalmtreeIcon, Stethoscope, BabyIcon, Timer } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Calendar } from '@/components/ui/calendar'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useUpdateAbsenceRequest } from '@/hooks/use-absences'
import type { AbsenceRequest, AbsenceType } from '@/types'

const typeLabel: Record<AbsenceType, string> = {
  Vacation:             'Urlaub',
  Sick:                 'Krankheit',
  ChildSick:            'Kind krank',
  FlexTimeCompensation: 'Gleitzeitabbau',
}

const typeIcon: Record<AbsenceType, React.ReactNode> = {
  Vacation:             <PalmtreeIcon className="size-4" />,
  Sick:                 <Stethoscope className="size-4" />,
  ChildSick:            <BabyIcon className="size-4" />,
  FlexTimeCompensation: <Timer className="size-4" />,
}

const allTypes: AbsenceType[] = ['Vacation', 'Sick', 'ChildSick', 'FlexTimeCompensation']

export function EditAbsenceRequestDialog({ request, onClose }: { request: AbsenceRequest; onClose: () => void }) {
  const updateRequest = useUpdateAbsenceRequest()
  const [type, setType] = useState<AbsenceType>(request.type)
  const [range, setRange] = useState<DateRange | undefined>({
    from: new Date(request.startDate),
    to: new Date(request.endDate),
  })
  const [comment, setComment] = useState(request.comment ?? '')

  const handleSave = () => {
    if (!range?.from || !range?.to) return
    updateRequest.mutate(
      {
        id: request.id,
        type,
        startDate: format(range.from, 'yyyy-MM-dd'),
        endDate:   format(range.to, 'yyyy-MM-dd'),
        comment: comment.trim() || undefined,
      },
      { onSuccess: onClose },
    )
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Antrag bearbeiten</DialogTitle>
          <DialogDescription>
            Antrag von {request.userName}. Geänderte Anträge müssen erneut genehmigt werden.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-absence-type">Art der Abwesenheit</Label>
            <Select value={type} onValueChange={(v) => setType(v as AbsenceType)}>
              <SelectTrigger id="edit-absence-type" className="w-full">
                <SelectValue>
                  <span className="flex items-center gap-2">{typeIcon[type]} {typeLabel[type]}</span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {allTypes.map((t) => (
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
            disabled={{ before: new Date() }}
          />

          {range?.from && range?.to && (
            <div className="flex items-center justify-center rounded-lg bg-muted px-3 py-2">
              <span className="text-sm text-muted-foreground">
                {format(range.from, 'dd.MM.yyyy')} – {format(range.to, 'dd.MM.yyyy')}
              </span>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-absence-comment">Kommentar (optional)</Label>
            <Input
              id="edit-absence-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
        </div>

        {updateRequest.isError && (
          <p className="text-sm text-destructive">Antrag konnte nicht aktualisiert werden.</p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Abbrechen</Button>
          <Button onClick={handleSave} disabled={!range?.from || !range?.to || updateRequest.isPending}>
            Speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
