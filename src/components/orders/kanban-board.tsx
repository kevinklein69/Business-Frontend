'use client'

import { useState } from 'react'
import { Building2, CalendarRange, Clock, Download, Euro, AlertTriangle, FileSignature, MapPin, Paperclip, Trash2, Upload, User } from 'lucide-react'
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
  DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { formatMinutes } from '@/lib/format'
import { useIsManager, useUserId } from '@/lib/auth'
import { useEmployees } from '@/hooks/use-employees'
import { useOrderClockStatus, useOrderTimeBreakdown } from '@/hooks/use-time-tracking'
import {
  downloadOrderAttachment, useDeleteOrderAttachment, useOrders,
  useUpdateOrder, useUpdateOrderStatus, useUploadOrderAttachments,
} from '@/hooks/use-orders'
import { AcceptanceDialog } from './acceptance-dialog'
import { AssigneePicker } from './assignee-picker'
import { DeleteOrderDialog } from './delete-order-dialog'
import { OrderClockButton } from './order-clock-button'
import { FileUploadZone, fileIcon, formatFileSize } from './file-upload-zone'
import type { Assignee, Employee, Order, OrderStatus } from '@/types'

const COLUMNS: { key: OrderStatus; label: string; badgeVariant: 'default' | 'secondary' | 'outline' }[] = [
  { key: 'ToDo',               label: 'Zu Erledigen',        badgeVariant: 'secondary' },
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

export function OrderDetailDialog({
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
    title: string; customer?: string; street: string; houseNumber: string; zip: string; city: string
    description?: string; assigneeIds: string[]
    revenue?: number; invoiceDate?: string; estimatedHours?: number
    plannedStartDate?: string; plannedEndDate?: string
    deviationReason?: string
  }) => void
}) {
  const [title,            setTitle]            = useState(order.title)
  const [customer,         setCustomer]         = useState(order.customer ?? '')
  const [street,           setStreet]           = useState(order.street)
  const [houseNumber,      setHouseNumber]      = useState(order.houseNumber)
  const [zip,              setZip]              = useState(order.zip)
  const [city,             setCity]             = useState(order.city)
  const [description,      setDescription]      = useState(order.description ?? '')
  const [assignees,        setAssignees]        = useState<Assignee[]>(order.assignees)
  const [revenue,          setRevenue]          = useState(order.revenue?.toString() ?? '')
  const [invoiceDate,      setInvoiceDate]      = useState(order.invoiceDate ?? '')
  const [estimatedHours,   setEstimatedHours]   = useState(order.estimatedHours?.toString() ?? '')
  const [plannedStartDate, setPlannedStartDate] = useState(order.plannedStartDate ?? '')
  const [plannedEndDate,   setPlannedEndDate]   = useState(order.plannedEndDate ?? '')
  const [deviationReason,  setDeviationReason]  = useState(order.deviationReason ?? '')
  const [saveAttempted, setSaveAttempted] = useState(false)
  const [newFiles,      setNewFiles]      = useState<File[]>([])
  const [acceptanceOpen, setAcceptanceOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const uploadAttachments = useUploadOrderAttachments()
  const deleteAttachment  = useDeleteOrderAttachment()
  const isManager         = useIsManager()
  const { data: timeBreakdown } = useOrderTimeBreakdown(order.id)

  const num = (s: string) => (s.trim() === '' ? undefined : parseFloat(s))
  const str = (s: string) => (s.trim() === '' ? undefined : s)

  const addressValid = !!(street.trim() && houseNumber.trim() && zip.trim() && city.trim())

  const handleSave = () => {
    setSaveAttempted(true)
    if (!addressValid) return
    onSave({
      title:       title.trim() || order.title,
      customer:    customer.trim() || undefined,
      street:      street.trim(),
      houseNumber: houseNumber.trim(),
      zip:         zip.trim(),
      city:        city.trim(),
      description: description.trim() || undefined,
      assigneeIds: assignees.map((a) => a.id),
      revenue:          num(revenue),
      invoiceDate:      str(invoiceDate),
      estimatedHours:   num(estimatedHours),
      plannedStartDate: str(plannedStartDate),
      plannedEndDate:   str(plannedEndDate),
      deviationReason:  str(deviationReason),
    })
    onClose()
  }

  const handleUpload = () => {
    if (newFiles.length === 0) return
    uploadAttachments.mutate(
      { orderId: order.id, files: newFiles },
      { onSuccess: () => setNewFiles([]) }
    )
  }

  const statusLabel: Record<OrderStatus, string> = {
    ToDo:               'Zu Erledigen',
    InProgress:         'In Bearbeitung',
    ReadyForAcceptance: 'Bereit für Abnahme',
    Invoicing:          'Rechnungserstellung',
    Done:               'Erledigt',
  }

  return (
    <>
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Auftrag bearbeiten</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-1">
          {/* Status badge */}
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{statusLabel[order.status]}</Badge>
            <span className="text-sm text-muted-foreground">Erstellt am {format(new Date(order.createdAt), 'dd.MM.yyyy')}</span>
            {order.status === 'ReadyForAcceptance' && isManager && (
              <Button
                variant="outline"
                size="sm"
                className="ml-auto"
                onClick={() => setAcceptanceOpen(true)}
              >
                <FileSignature className="size-3.5" /> Kundenabnahme durchführen
              </Button>
            )}
          </div>

          {/* Titel */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="d-title">Titel</Label>
            <Input id="d-title" value={title} onChange={(e) => setTitle(e.target.value)} disabled={!isManager} />
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
              disabled={!isManager}
            />
          </div>

          {/* Adresse */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label htmlFor="d-street" className="flex items-center gap-1.5">
                <MapPin className="size-3.5" /> Straße *
              </Label>
              <Input
                id="d-street"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder="Straße"
                required
                aria-invalid={saveAttempted && !street.trim()}
                disabled={!isManager}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="d-house-number">Hausnummer *</Label>
              <Input
                id="d-house-number"
                value={houseNumber}
                onChange={(e) => setHouseNumber(e.target.value)}
                placeholder="Nr."
                required
                aria-invalid={saveAttempted && !houseNumber.trim()}
                disabled={!isManager}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="d-zip">PLZ *</Label>
              <Input
                id="d-zip"
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                placeholder="PLZ"
                required
                aria-invalid={saveAttempted && !zip.trim()}
                disabled={!isManager}
              />
            </div>
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label htmlFor="d-city">Ort *</Label>
              <Input
                id="d-city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ort"
                required
                aria-invalid={saveAttempted && !city.trim()}
                disabled={!isManager}
              />
            </div>
          </div>
          {saveAttempted && !addressValid && (
            <p className="text-xs text-destructive">Bitte Straße, Hausnummer, PLZ und Ort angeben.</p>
          )}

          {/* Beschreibung */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="d-description">Beschreibung</Label>
            <textarea
              id="d-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Auftragsdetails…"
              rows={3}
              disabled={!isManager}
              className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-base resize-none outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 dark:disabled:bg-input/80"
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
                  disabled={!isManager}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="d-planned-end">Geplantes Ende</Label>
                <Input
                  id="d-planned-end"
                  type="date"
                  value={plannedEndDate}
                  onChange={(e) => setPlannedEndDate(e.target.value)}
                  disabled={!isManager}
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
                  disabled={!isManager}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Ist-Stunden</Label>
                <div
                  className="flex h-8 items-center rounded-lg border border-input bg-input/50 px-2.5 text-base text-muted-foreground opacity-50 md:text-sm dark:bg-input/80"
                >
                  {order.actualHours != null ? `${formatMinutes(Math.round(order.actualHours * 60))} h` : '–'}
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="flex items-center gap-1.5">
                <Clock className="size-3.5" /> Auftrags-Stempel
              </Label>
              <OrderClockButton orderId={order.id} />
            </div>
            {timeBreakdown != null && timeBreakdown.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <Label>Geleistete Zeit pro Mitarbeiter</Label>
                <div className="flex flex-col gap-1 rounded-lg border border-input p-2.5 text-sm">
                  {timeBreakdown.map((entry) => (
                    <div key={entry.userId} className="flex items-center justify-between">
                      <span>{entry.userName}</span>
                      <span className="text-muted-foreground">{formatMinutes(entry.netMinutes)} h</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {order.actualHours != null && (
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

          {/* Mitarbeiter */}
          <div className="border-t pt-3">
            {isManager ? (
              <AssigneePicker
                employees={employees}
                assignees={assignees}
                onChange={setAssignees}
              />
            ) : (
              <div className="flex flex-col gap-2">
                <Label className="flex items-center gap-1.5">
                  <User className="size-3.5" /> Mitarbeiter
                </Label>
                {assignees.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Keine Mitarbeiter zugewiesen</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {assignees.map((a) => (
                      <Badge key={a.id} variant="secondary">{a.name}</Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Abrechnung */}
          {isManager && (
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
          )}

          {/* Anhänge */}
          <div className="flex flex-col gap-2 border-t pt-3">
            <Label className="flex items-center gap-1.5">
              <Paperclip className="size-3.5" /> Anhänge
            </Label>
            {order.attachments.length > 0 && (
              <ul className="flex flex-col gap-1">
                {order.attachments.map((attachment) => {
                  const Icon = fileIcon(attachment.fileName)
                  return (
                    <li
                      key={attachment.id}
                      className="flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-sm"
                    >
                      <Icon className="size-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate">{attachment.fileName}</span>
                      <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                        {formatFileSize(attachment.sizeBytes)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-6 shrink-0"
                        aria-label={`${attachment.fileName} herunterladen`}
                        onClick={() => downloadOrderAttachment(order.id, attachment.id, attachment.fileName)}
                      >
                        <Download className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-6 shrink-0 text-destructive hover:text-destructive"
                        aria-label={`${attachment.fileName} löschen`}
                        disabled={deleteAttachment.isPending}
                        onClick={() => deleteAttachment.mutate({ orderId: order.id, attachmentId: attachment.id })}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </li>
                  )
                })}
              </ul>
            )}
            <FileUploadZone files={newFiles} onChange={setNewFiles} label="Neue Anhänge" />
            {newFiles.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="self-end"
                onClick={handleUpload}
                disabled={uploadAttachments.isPending}
              >
                <Upload className="size-3.5" /> Hochladen
              </Button>
            )}
          </div>
        </div>


        <DialogFooter>
          {isManager && (
            <Button
              variant="destructive"
              className="sm:mr-auto"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="size-3.5" /> Löschen
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>Abbrechen</Button>
          <Button onClick={handleSave}>Speichern</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    <AcceptanceDialog order={order} open={acceptanceOpen} onClose={() => setAcceptanceOpen(false)} />
    {deleteOpen && (
      <DeleteOrderDialog
        order={order}
        onClose={() => setDeleteOpen(false)}
        onDeleted={() => {
          setDeleteOpen(false)
          onClose()
        }}
      />
    )}
    </>
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
  const { data: clockStatus } = useOrderClockStatus(order.id)
  const isClockedIn = !!clockStatus?.isClockedIn
  const isManager = useIsManager()

  const hasDeviation =
    order.status === 'Done' &&
    order.estimatedHours != null &&
    order.actualHours != null &&
    Math.abs(order.actualHours - order.estimatedHours) > 0.01

  const hasPlannedRange = !!(order.plannedStartDate || order.plannedEndDate)
  const hasAddress = !!(order.street || order.houseNumber || order.zip || order.city)

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      {...listeners}
      {...attributes}
      className={cn('touch-none', isDragging && !overlay && 'opacity-0', overlay && 'shadow-xl cursor-grabbing')}
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

        {(order.customer || hasAddress || order.description || order.assignees.length > 0
          || (isManager && order.revenue != null) || hasPlannedRange || hasDeviation || isClockedIn) && (
          <CardContent className="flex flex-col gap-2">
            {order.customer && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Building2 className="size-3 shrink-0" />
                {order.customer}
              </p>
            )}
            {hasAddress && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="size-3 shrink-0" />
                {order.street} {order.houseNumber}, {order.zip} {order.city}
              </p>
            )}
            {order.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">{order.description}</p>
            )}
            {((isManager && order.revenue != null) || hasPlannedRange || hasDeviation || isClockedIn) && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {isClockedIn && (
                  <Badge variant="outline" className="gap-1 text-xs font-normal border-success text-success bg-success/10">
                    <Clock className="size-3" />
                    Eingestempelt
                  </Badge>
                )}
                {isManager && order.revenue != null && (
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

export function KanbanBoard({ periodId }: { periodId: string | null }) {
  const { data: allOrders = [] } = useOrders()
  const { data: employees = [] } = useEmployees()
  const isManager = useIsManager()
  const userId    = useUserId()

  // Employees only ever see orders they are assigned to.
  const orders = isManager
    ? allOrders
    : allOrders.filter((o) => o.assignees.some((a) => a.id === userId))

  // Only orders assigned to the active planning period appear on the working board.
  const boardOrders = orders.filter((o) => (o.planningPeriodId ?? null) === periodId)

  const updateStatus = useUpdateOrderStatus()
  const updateOrder  = useUpdateOrder()

  const [activeId,      setActiveId]      = useState<string | null>(null)
  const [detailOrderId, setDetailOrderId] = useState<string | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))
  const activeOrder = orders.find((a) => a.id === activeId) ?? null
  // Aus der Liste auflösen, damit der Dialog nach Refetch (z.B. Anhang-Upload) frische Daten sieht.
  const detailOrder = orders.find((a) => a.id === detailOrderId) ?? null

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
    title: string; customer?: string; street: string; houseNumber: string; zip: string; city: string
    description?: string; assigneeIds: string[]
    revenue?: number; invoiceDate?: string; estimatedHours?: number
    plannedStartDate?: string; plannedEndDate?: string
    deviationReason?: string
  }) => {
    if (!detailOrder) return
    updateOrder.mutate({ id: detailOrder.id, ...updated })
  }

  return (
    <>
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-2 w-full min-w-0">
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.key}
              col={col}
              items={boardOrders.filter((a) => a.status === col.key)}
              activeId={activeId}
              onOpenCard={(order) => setDetailOrderId(order.id)}
            />
          ))}
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
          onClose={() => setDetailOrderId(null)}
          onSave={handleSaveDetail}
        />
      )}
    </>
  )
}
