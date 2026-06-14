'use client'

import { format } from 'date-fns'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useDeleteAbsenceRequest } from '@/hooks/use-absences'
import type { AbsenceRequest } from '@/types'

export function CancelAbsenceRequestDialog({ request, onClose }: { request: AbsenceRequest; onClose: () => void }) {
  const deleteRequest = useDeleteAbsenceRequest()

  const handleConfirm = () => {
    deleteRequest.mutate(request.id, { onSuccess: onClose })
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Antrag stornieren</DialogTitle>
          <DialogDescription>
            Möchten Sie den Antrag von {request.userName} für den Zeitraum {format(new Date(request.startDate), 'dd.MM.yyyy')} – {format(new Date(request.endDate), 'dd.MM.yyyy')} wirklich stornieren?
          </DialogDescription>
        </DialogHeader>

        {deleteRequest.isError && (
          <p className="text-sm text-destructive">Antrag konnte nicht storniert werden.</p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Abbrechen</Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={deleteRequest.isPending}>
            Stornieren
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
