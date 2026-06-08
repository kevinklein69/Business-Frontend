'use client'

import { useState } from 'react'
import { isAxiosError } from 'axios'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useDeleteEmployee } from '@/hooks/use-employees'
import type { Employee } from '@/types'

export function DeleteEmployeeDialog({ employee, onClose }: { employee: Employee; onClose: () => void }) {
  const [error, setError] = useState<string | null>(null)
  const deleteEmployee = useDeleteEmployee()
  const name = `${employee.firstName} ${employee.lastName}`

  const handleDelete = () => {
    setError(null)
    deleteEmployee.mutate(employee.id, {
      onSuccess: () => onClose(),
      onError: (err) => {
        const detail = isAxiosError(err) && err.response?.status === 400
          ? 'Sie können Ihr eigenes Konto nicht löschen.'
          : 'Mitarbeiter konnte nicht gelöscht werden.'
        setError(detail)
      },
    })
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Mitarbeiter löschen</DialogTitle>
          <DialogDescription>
            Möchten Sie {name} wirklich entfernen? Diese Aktion kann nicht rückgängig gemacht werden.
          </DialogDescription>
        </DialogHeader>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Abbrechen</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleteEmployee.isPending}>
            Löschen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
