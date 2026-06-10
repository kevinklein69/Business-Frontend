'use client'

import { useState } from 'react'
import { Plus, User, Building2, Search, Check, CalendarRange, Euro, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'
import {
  DndContext, DragOverlay, PointerSensor,
  useSensor, useSensors, useDraggable, useDroppable,
  type DragEndEvent, type DragStartEvent,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { useEmployees } from '@/hooks/use-employees'
import { useCreateOrder, useOrders, useUpdateOrder, useUpdateOrderStatus } from '@/hooks/use-orders'
import type { Assignee, Employee, Order, OrderStatus } from '@/types'

const COLUMNS: { key: OrderStatus; label: string; badgeVariant: 'default' | 'secondary' | 'outline' }[] = [
  { key: 'Backlog',            label: 'Backlog',             badgeVariant: 'secondary' },
  { key: 'InProgress',         label: 'In Bearbeitung',      badgeVariant: 'default'   },
  { key: 'ReadyForAcceptance', label: 'Bereit für Abnahme',  badgeVariant: 'default'   },
  { key: 'Invoicing',          label: 'Rechnungserstellung', badgeVariant: 'default'   },
  { key: 'Done',               label: 'Erledigt',            badgeVariant: 'outline'   },
]

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase()
}

const currencyFormatter = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})

function shortDate(date: string) {
  return format(new Date(date), 'dd.MM.')
}

// ── Detail Dialog ─────────────────────────────────────────────────────────────

function OrderDetailDialog({
  order,
  employees,
  open,
  onClose,
  onSave,
}: {
  order: Order
  employees: Employee[]
  open: boolean
  onClose: () => void
  onSave: (updated: {
    title: string; customer?: string; description?: string; assigneeIds: string[]
    revenue?: number; invoiceDate?: string; estimatedHours?: number
    plannedStartDate?: string; plannedEndDate?: string; actualHours?: number
    deviationReason?: string
  }) => void
}) {
  const [title,            setTitle]            = useState(order.title)
  const [customer,         setCustomer]         = useState(order.customer ?? '')
  const [description,      setDescription]      = useState(order.description ?? '')
  const [assignees,        setAssignees]        = useState<Assignee[]>(order.assignees)
  const [assigneeSearch,   setAssigneeSearch]   = useState('')
  const [revenue,          setRevenue]          = useState(order.revenue?.toString() ?? '')
  const [invoiceDate,      setInvoiceDate]      = useState(order.invoiceDate ?? '')
  const [estimatedHours,   setEstimatedHours]   = useState(order.estimatedHours?.toString() ?? '')
  const [plannedStartDate, setPlannedStartDate] = useState(order.plannedStartDate ?? '')
  const [plannedEndDate,   setPlannedEndDate]   = useState(order.plannedEndDate ?? '')
  const [actualHours,      setActualHours]      = useState(order.actualHours?.toString() ?? '')
  const [deviationReason,  setDeviationReason]  = useState(order.deviationReason ?? '')

  const filteredEmployees = employees.filter((m) =>
    `${m.firstName} ${m.lastName}`.toLowerCase().includes(assigneeSearch.toLowerCase())
  )

  const toggleAssignee = (employee: Employee) =>
    setAssignees((prev) =>
      prev.some((a) => a.id === employee.id)
        ? prev.filter((a) => a.id !== employee.id)
        : [...prev, { id: employee.id, name: `${employee.firstName} ${employee.lastName}` }]
    )

  const num = (s: string) => (s.trim() === '' ? undefined : parseFloat(s))
  const str = (s: string) => (s.trim() === '' ? undefined : s)

  const handleSave = () => {
    onSave({
      title:       title.trim() || order.title,
      customer:    customer.trim() || undefined,
      description: description.trim() || undefined,
      assigneeIds: assignees.map((a) => a.id),
      revenue:          num(revenue),
      invoiceDate:      str(invoiceDate),
      estimatedHours:   num(estimatedHours),
      plannedStartDate: str(plannedStartDate),
      plannedEndDate:   str(plannedEndDate),
      actualHours:      num(actualHours),
      deviationReason:  str(deviationReason),
    })
    onClose()
  }

  const statusLabel: Record<OrderStatus, string> = {
    Backlog:            'Backlog',
    InProgress:         'In Bearbeitung',
    ReadyForAcceptance: 'Bereit für Abnahme',
    Invoicing:          'Rechnungserstellung',
    Done:               'Erledigt',
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Auftrag bearbeiten</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-1">
          {/* Status badge */}
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{statusLabel[order.status]}</Badge>
            <span className="text-sm text-muted-foreground">Erstellt am {format(new Date(order.createdAt), 'dd.MM.yyyy')}</span>
          </div>

          {/* Titel */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="d-title">Titel</Label>
            <Input id="d-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          {/* Kunde */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="d-customer" className="flex items-center gap-1.5">
              <Building2 className="size-3.5" /> Kunde
            </Label>
            <Input
              id="d-customer"
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              placeholder="Kundenname"
            />
          </div>

          {/* Beschreibung */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="d-description">Beschreibung</Label>
            <textarea
              id="d-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Auftragsdetails…"
              rows={3}
              className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-base resize-none outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 placeholder:text-muted-foreground"
            />
          </div>

          {/* Zeitplanung */}
          <div className="flex flex-col gap-3 border-t pt-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <CalendarRange className="size-3.5" /> Zeitplanung
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="d-planned-start">Geplanter Start</Label>
                <Input
                  id="d-planned-start"
                  type="date"
                  value={plannedStartDate}
                  onChange={(e) => setPlannedStartDate(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="d-planned-end">Geplantes Ende</Label>
                <Input
                  id="d-planned-end"
                  type="date"
                  value={plannedEndDate}
                  onChange={(e) => setPlannedEndDate(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="d-estimated-hours">Soll-Stunden</Label>
                <Input
                  id="d-estimated-hours"
                  type="number"
                  step="0.25"
                  min="0"
                  placeholder="z.B. 8"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="d-actual-hours">Ist-Stunden</Label>
                <Input
                  id="d-actual-hours"
                  type="number"
                  step="0.25"
                  min="0"
                  placeholder="z.B. 9.5"
                  value={actualHours}
                  onChange={(e) => setActualHours(e.target.value)}
                />
              </div>
            </div>
            {actualHours.trim() !== '' && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="d-deviation-reason">Abweichungsgrund</Label>
                <textarea
                  id="d-deviation-reason"
                  value={deviationReason}
                  onChange={(e) => setDeviationReason(e.target.value)}
                  placeholder="Grund für Abweichung von der Zeitprognose (optional)…"
                  rows={2}
                  className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-base resize-none outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 placeholder:text-muted-foreground"
                />
              </div>
            )}
          </div>

          {/* Abrechnung */}
          <div className="flex flex-col gap-3 border-t pt-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <Euro className="size-3.5" /> Abrechnung
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="d-revenue">Umsatz (€)</Label>
                <Input
                  id="d-revenue"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="z.B. 1500"
                  value={revenue}
                  onChange={(e) => setRevenue(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="d-invoice-date">Rechnungsdatum</Label>
                <Input
                  id="d-invoice-date"
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Mitarbeiter */}
          <div className="flex flex-col gap-2">
            <Label className="flex items-center gap-1.5">
              <User className="size-3.5" /> Mitarbeiter
              {assignees.length > 0 && (
                <span className="ml-auto text-xs font-normal text-muted-foreground">
                  {assignees.length} ausgewählt
                </span>
              )}
            </Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Mitarbeiter suchen…"
                value={assigneeSearch}
                onChange={(e) => setAssigneeSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-0.5">
              {filteredEmployees.length === 0 ? (
                <p className="col-span-2 text-center text-sm text-muted-foreground py-4">
                  Kein Mitarbeiter gefunden
                </p>
              ) : filteredEmployees.map((employee) => {
                const name = `${employee.firstName} ${employee.lastName}`
                const selected = assignees.some((a) => a.id === employee.id)
                return (
                  <button
                    key={employee.id}
                    type="button"
                    onClick={() => toggleAssignee(employee)}
                    className={cn(
                      'flex items-center gap-2 rounded-lg border px-2.5 py-2 text-sm transition-colors text-left',
                      selected
                        ? 'border-primary bg-primary/10 text-primary font-medium'
                        : 'border-border text-foreground hover:bg-muted'
                    )}
                  >
                    <div className={cn(
                      'flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                      selected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    )}>
                      {selected ? <Check className="size-3" /> : initials(name).slice(0,2)}
                    </div>
                    <span className="truncate">{name}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>


        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Abbrechen</Button>
          <Button onClick={handleSave}>Speichern</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Kanban Card ───────────────────────────────────────────────────────────────

function KanbanCard({
  order,
  overlay = false,
  onOpen,
}: {
  order: Order
  overlay?: boolean
  onOpen?: (a: Order) => void
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: order.id })

  const hasDeviation =
    order.status === 'Done' &&
    order.estimatedHours != null &&
    order.actualHours != null &&
    Math.abs(order.actualHours - order.estimatedHours) > 0.01

  const hasPlannedRange = !!(order.plannedStartDate || order.plannedEndDate)

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      {...listeners}
      {...attributes}
      className={cn('touch-none', isDragging && !overlay && 'opacity-40', overlay && 'rotate-2 shadow-xl cursor-grabbing')}
    >
      <Card
        size="sm"
        onClick={() => !isDragging && onOpen?.(order)}
        className={cn(
          'select-none transition-shadow',
          !overlay && 'cursor-pointer hover:shadow-md hover:ring-2 hover:ring-primary/20 active:cursor-grabbing'
        )}
      >
        <CardHeader>
          <CardTitle className="text-sm leading-snug">{order.title}</CardTitle>
        </CardHeader>

        {(order.customer || order.description || order.assignees.length > 0
          || order.revenue != null || hasPlannedRange || hasDeviation) && (
          <CardContent className="flex flex-col gap-2">
            {order.customer && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Building2 className="size-3 shrink-0" />
                {order.customer}
              </p>
            )}
            {order.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">{order.description}</p>
            )}
            {(order.revenue != null || hasPlannedRange || hasDeviation) && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {order.revenue != null && (
                  <Badge variant="outline" className="gap-1 text-xs font-normal">
                    <Euro className="size-3" />
                    {currencyFormatter.format(order.revenue)}
                  </Badge>
                )}
                {hasPlannedRange && (
                  <Badge variant="outline" className="gap-1 text-xs font-normal">
                    <CalendarRange className="size-3" />
                    {order.plannedStartDate ? shortDate(order.plannedStartDate) : '?'}
                    {' – '}
                    {order.plannedEndDate ? shortDate(order.plannedEndDate) : '?'}
                  </Badge>
                )}
                {hasDeviation && (
                  <Badge
                    variant="destructive"
                    className="gap-1 text-xs font-normal"
                    title={`Soll: ${order.estimatedHours}h / Ist: ${order.actualHours}h`}
                  >
                    <AlertTriangle className="size-3" />
                    Abweichung
                  </Badge>
                )}
              </div>
            )}
            {order.assignees.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap">
                {order.assignees.slice(0, 3).map((assignee) => (
                  <div
                    key={assignee.id}
                    title={assignee.name}
                    className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold ring-2 ring-background"
                  >
                    {initials(assignee.name).slice(0, 2)}
                  </div>
                ))}
                {order.assignees.length > 3 && (
                  <div className="flex size-6 items-center justify-center rounded-full bg-muted text-muted-foreground text-xs ring-2 ring-background">
                    +{order.assignees.length - 3}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  )
}

// ── Column ────────────────────────────────────────────────────────────────────

function KanbanColumn({
  col, items, activeId, onOpenCard,
}: {
  col: typeof COLUMNS[number]
  items: Order[]
  activeId: string | null
  onOpenCard: (a: Order) => void
}) {
  const { isOver, setNodeRef } = useDroppable({ id: col.key })

  return (
    <div className="flex flex-col gap-2 flex-1 min-w-40">
      <div className="flex items-center justify-between px-1">
        <span className="text-sm font-medium">{col.label}</span>
        <Badge variant={col.badgeVariant}>{items.length}</Badge>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          'flex flex-col gap-2 min-h-32 rounded-xl p-2 transition-colors duration-150 ring-1',
          isOver ? 'bg-primary/10 ring-primary/30' : 'bg-muted ring-border'
        )}
      >
        {items.map((order) => (
          <KanbanCard key={order.id} order={order} onOpen={onOpenCard} />
        ))}
        {isOver && activeId && !items.find((a) => a.id === activeId) && (
          <div className="h-20 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5" />
        )}
      </div>
    </div>
  )
}

// ── Board ─────────────────────────────────────────────────────────────────────

export function KanbanBoard() {
  const { data: orders = [] }    = useOrders()
  const { data: employees = [] } = useEmployees()

  const updateStatus = useUpdateOrderStatus()
  const updateOrder  = useUpdateOrder()
  const createOrder  = useCreateOrder()

  const [activeId,       setActiveId]       = useState<string | null>(null)
  const [detailOrder,    setDetailOrder]    = useState<Order | null>(null)
  const [newDialogOpen,  setNewDialogOpen]  = useState(false)
  const [newTitle,       setNewTitle]       = useState('')
  const [newDescription, setNewDescription] = useState('')

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))
  const activeOrder = orders.find((a) => a.id === activeId) ?? null

  const handleDragStart = (e: DragStartEvent) => setActiveId(e.active.id as string)

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveId(null)
    if (!e.over) return
    const order = orders.find((a) => a.id === e.active.id)
    const status = e.over.id as OrderStatus
    if (!order || order.status === status) return
    updateStatus.mutate({ id: order.id, status })
  }

  const handleSaveDetail = (updated: {
    title: string; customer?: string; description?: string; assigneeIds: string[]
    revenue?: number; invoiceDate?: string; estimatedHours?: number
    plannedStartDate?: string; plannedEndDate?: string; actualHours?: number
    deviationReason?: string
  }) => {
    if (!detailOrder) return
    updateOrder.mutate({ id: detailOrder.id, ...updated })
  }

  const handleCreate = () => {
    if (!newTitle.trim()) return
    createOrder.mutate(
      {
        title: newTitle.trim(),
        description: newDescription.trim() || undefined,
        assigneeIds: [],
      },
      { onSuccess: () => setNewDialogOpen(false) }
    )
    setNewTitle('')
    setNewDescription('')
  }

  return (
    <>
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">Aufträge</h1>
            <Dialog open={newDialogOpen} onOpenChange={setNewDialogOpen}>
              <DialogTrigger render={<Button />}>
                <Plus className="size-4" /> Neuer Auftrag
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Neuen Auftrag erstellen</DialogTitle></DialogHeader>
                <div className="flex flex-col gap-4 py-2">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="n-title">Titel</Label>
                    <Input id="n-title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Auftragstitel" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="n-description">Beschreibung (optional)</Label>
                    <Input id="n-description" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} placeholder="Kurze Beschreibung" />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleCreate} disabled={!newTitle.trim()}>Erstellen</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-2 w-full min-w-0">
            {COLUMNS.map((col) => (
              <KanbanColumn
                key={col.key}
                col={col}
                items={orders.filter((a) => a.status === col.key)}
                activeId={activeId}
                onOpenCard={setDetailOrder}
              />
            ))}
          </div>
        </div>

        <DragOverlay dropAnimation={null}>
          {activeOrder && <KanbanCard order={activeOrder} overlay />}
        </DragOverlay>
      </DndContext>

      {detailOrder && (
        <OrderDetailDialog
          order={detailOrder}
          employees={employees}
          open={!!detailOrder}
          onClose={() => setDetailOrder(null)}
          onSave={handleSaveDetail}
        />
      )}
    </>
  )
}
