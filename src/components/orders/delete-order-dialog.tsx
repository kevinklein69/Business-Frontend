'use client'

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useDeleteOrder } from '@/hooks/use-orders'
import type { Order } from '@/types'

export function DeleteOrderDialog({ order, onClose, onDeleted }: { order: Order; onClose: () => void; onDeleted: () => void }) {
  const deleteOrder = useDeleteOrder()

  const handleDelete = () => {
    deleteOrder.mutate(order.id, { onSuccess: onDeleted })
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Auftrag löschen</DialogTitle>
          <DialogDescription>
            Möchten Sie &quot;{order.title}&quot; wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
          </DialogDescription>
        </DialogHeader>

        {deleteOrder.isError && (
          <p className="text-sm text-destructive">Auftrag konnte nicht gelöscht werden.</p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Abbrechen</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleteOrder.isPending}>
            Löschen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
