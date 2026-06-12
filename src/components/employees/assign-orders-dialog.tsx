'use client'

import { Check, ClipboardList } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useOrders, useUpdateOrder } from '@/hooks/use-orders'
import type { Employee, Order, OrderStatus } from '@/types'

const statusLabel: Record<OrderStatus, string> = {
  ToDo:               'Zu Erledigen',
  InProgress:         'In Bearbeitung',
  ReadyForAcceptance: 'Bereit für Abnahme',
  Invoicing:          'Rechnungserstellung',
  Done:               'Erledigt',
}

export function AssignOrdersDialog({ employee, onClose }: { employee: Employee; onClose: () => void }) {
  const { data: orders = [] } = useOrders()
  const updateOrder = useUpdateOrder()

  const openOrders = orders.filter((o) => o.status !== 'Done')
  const name = `${employee.firstName} ${employee.lastName}`

  const toggleAssignment = (order: Order) => {
    const assigned = order.assignees.some((a) => a.id === employee.id)
    const assigneeIds = assigned
      ? order.assignees.filter((a) => a.id !== employee.id).map((a) => a.id)
      : [...order.assignees.map((a) => a.id), employee.id]

    // Alle Felder mitsenden — der PUT-Endpunkt überschreibt den kompletten Auftrag.
    updateOrder.mutate({
      id: order.id,
      title: order.title,
      customer: order.customer,
      street: order.street,
      houseNumber: order.houseNumber,
      zip: order.zip,
      city: order.city,
      description: order.description,
      assigneeIds,
      revenue: order.revenue,
      invoiceDate: order.invoiceDate,
      estimatedHours: order.estimatedHours,
      plannedStartDate: order.plannedStartDate,
      plannedEndDate: order.plannedEndDate,
      deviationReason: order.deviationReason,
      positions: order.positions.map((p) => ({
        description: p.description,
        quantity: p.quantity,
        unitPrice: p.unitPrice,
      })),
    })
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Aufträge für {name}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-1.5 py-1 max-h-80 overflow-y-auto pr-0.5">
          {openOrders.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-6">Keine offenen Aufträge vorhanden</p>
          ) : openOrders.map((order) => {
            const assigned = order.assignees.some((a) => a.id === employee.id)
            return (
              <button
                key={order.id}
                type="button"
                onClick={() => toggleAssignment(order)}
                className={cn(
                  'flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors text-left',
                  assigned
                    ? 'border-primary bg-primary/10 text-primary font-medium'
                    : 'border-border text-foreground hover:bg-muted'
                )}
              >
                <div className={cn(
                  'flex size-6 shrink-0 items-center justify-center rounded-full',
                  assigned ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                )}>
                  {assigned ? <Check className="size-3.5" /> : <ClipboardList className="size-3.5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate">{order.title}</p>
                  {order.customer && <p className="text-xs text-muted-foreground truncate">{order.customer}</p>}
                </div>
                <Badge variant="secondary" className="shrink-0">{statusLabel[order.status]}</Badge>
              </button>
            )
          })}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Schließen</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
