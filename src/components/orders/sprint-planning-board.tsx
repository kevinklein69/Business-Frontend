'use client'

import { useState } from 'react'
import {
  Building2, ChevronDown, ChevronRight, MoreVertical, Pencil,
  Play, Archive, Trash2, Plus, Inbox,
} from 'lucide-react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import {
  DndContext, DragOverlay, PointerSensor,
  useSensor, useSensors, useDraggable, useDroppable,
  type DragEndEvent, type DragStartEvent,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useIsManager } from '@/lib/auth'
import { useEmployees } from '@/hooks/use-employees'
import { useOrders, useUpdateOrder, useUpdateOrderPlanningPeriod } from '@/hooks/use-orders'
import {
  usePlanningPeriods, usePlanningPeriodOrders, useDeletePlanningPeriod, useUpdatePlanningPeriod,
} from '@/hooks/use-planning-periods'
import { PlanningPeriodDialog } from './planning-period-dialog'
import { ClosePeriodDialog } from './close-period-dialog'
import { OrderDetailDialog } from './kanban-board'
import type { Order, OrderStatus, PlanningPeriod, PlanningPeriodStatus } from '@/types'

const UNASSIGNED_ID = 'unassigned'

const MONTHS = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
]

/** Reference date used to group/filter a period by year & month (start date, else end date). */
function periodRefDate(p: PlanningPeriod): Date | null {
  const d = p.startDate ?? p.endDate
  return d ? new Date(d) : null
}

const periodStatusBadge: Record<PlanningPeriodStatus, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  Active:  { label: 'Aktiv',         variant: 'default'   },
  Planned: { label: 'Geplant',       variant: 'secondary' },
  Closed:  { label: 'Abgeschlossen', variant: 'outline'   },
}

const orderStatusLabel: Record<OrderStatus, string> = {
  ToDo:               'Zu Erledigen',
  InProgress:         'In Bearbeitung',
  ReadyForAcceptance: 'Bereit für Abnahme',
  Invoicing:          'Rechnungserstellung',
  Done:               'Erledigt',
}

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

function dateRangeLabel(start?: string | null, end?: string | null) {
  if (!start && !end) return null
  const fmt = (d: string) => format(new Date(d), 'dd.MM.yyyy', { locale: de })
  return `${start ? fmt(start) : '?'} – ${end ? fmt(end) : '?'}`
}

// ── Draggable order card ────────────────────────────────────────────────────

function PlanningOrderCard({ order, overlay = false, onOpen }: {
  order: Order
  overlay?: boolean
  onOpen?: (o: Order) => void
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: order.id,
    data: { order },
  })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      {...listeners}
      {...attributes}
      className={cn('touch-none', isDragging && !overlay && 'opacity-0', overlay && 'shadow-xl')}
    >
      <div
        onClick={() => !isDragging && onOpen?.(order)}
        className={cn(
          'flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm select-none',
          overlay ? 'cursor-grabbing' : 'cursor-pointer hover:shadow-sm hover:ring-2 hover:ring-primary/20 active:cursor-grabbing'
        )}
      >
        <span className="font-medium truncate min-w-0">{order.title}</span>
        {order.customer && (
          <span className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground truncate min-w-0">
            <Building2 className="size-3 shrink-0" />
            {order.customer}
          </span>
        )}
        <Badge variant="outline" className="ml-auto shrink-0 text-xs font-normal">
          {orderStatusLabel[order.status]}
        </Badge>
        {order.assignees.length > 0 && (
          <div className="flex items-center -space-x-1.5 shrink-0">
            {order.assignees.slice(0, 3).map((a) => (
              <div
                key={a.id}
                title={a.name}
                className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-[0.6rem] font-semibold ring-2 ring-background"
              >
                {initials(a.name)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Swimlane (droppable section) ────────────────────────────────────────────

function Swimlane({
  id, title, badge, dateLabel, count, expanded, onToggle, actions, items, activeId, loading, onOpen,
}: {
  id: string
  title: React.ReactNode
  badge?: React.ReactNode
  dateLabel?: string | null
  count: number
  expanded: boolean
  onToggle: () => void
  actions?: React.ReactNode
  items: Order[]
  activeId: string | null
  loading?: boolean
  onOpen?: (o: Order) => void
}) {
  const { isOver, setNodeRef } = useDroppable({ id })

  return (
    <div className="rounded-xl border bg-background">
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          type="button"
          onClick={onToggle}
          className="flex items-center justify-center text-muted-foreground hover:text-foreground"
          aria-label={expanded ? 'Einklappen' : 'Ausklappen'}
        >
          {expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        </button>
        <span className="text-sm font-semibold">{title}</span>
        {badge}
        {dateLabel && <span className="text-xs text-muted-foreground">{dateLabel}</span>}
        <Badge variant="secondary" className="ml-auto">{count}</Badge>
        {actions}
      </div>

      {expanded && (
        <div
          ref={setNodeRef}
          className={cn(
            'flex flex-col gap-2 px-3 pb-3 min-h-16 rounded-b-xl transition-colors',
            isOver && 'bg-primary/10'
          )}
        >
          {loading ? (
            <p className="py-3 text-xs text-muted-foreground">Wird geladen…</p>
          ) : items.length === 0 ? (
            <p className="py-3 text-xs text-muted-foreground">Keine Aufträge</p>
          ) : (
            items.map((o) => <PlanningOrderCard key={o.id} order={o} onOpen={onOpen} />)
          )}
          {isOver && activeId && !items.find((i) => i.id === activeId) && (
            <div className="h-10 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5" />
          )}
        </div>
      )}
    </div>
  )
}

// ── Closed period (lazy-loaded orders) ──────────────────────────────────────

function ClosedPeriodLane({
  period, expanded, onToggle, activeId, actions, onOpen,
}: {
  period: PlanningPeriod
  expanded: boolean
  onToggle: () => void
  activeId: string | null
  actions?: React.ReactNode
  onOpen?: (o: Order) => void
}) {
  const { data: orders = [], isLoading } = usePlanningPeriodOrders(period.id, expanded)
  const badge = periodStatusBadge[period.status]

  return (
    <Swimlane
      id={period.id}
      title={period.name}
      badge={<Badge variant={badge.variant}>{badge.label}</Badge>}
      dateLabel={dateRangeLabel(period.startDate, period.endDate)}
      count={period.orderCount}
      expanded={expanded}
      onToggle={onToggle}
      actions={actions}
      items={expanded ? orders : []}
      activeId={activeId}
      loading={isLoading}
      onOpen={onOpen}
    />
  )
}

// ── Closed periods card (grouped, with year/month filter) ────────────────────

function ClosedPeriodsSection({
  periods, activeId, isExpanded, toggle, renderActions, onOpen,
}: {
  periods: PlanningPeriod[]
  activeId: string | null
  isExpanded: (id: string, def: boolean) => boolean
  toggle: (id: string, def: boolean) => void
  renderActions: (p: PlanningPeriod) => React.ReactNode
  onOpen?: (o: Order) => void
}) {
  const [open, setOpen] = useState(false)
  const [year, setYear] = useState('all')
  const [month, setMonth] = useState('all')

  const years = [...new Set(
    periods.map((p) => periodRefDate(p)?.getFullYear()).filter((y): y is number => y != null)
  )].sort((a, b) => b - a)

  const filtered = periods.filter((p) => {
    const d = periodRefDate(p)
    if (year !== 'all' && (!d || d.getFullYear() !== Number(year))) return false
    return !(month !== 'all' && (!d || d.getMonth() !== Number(month)))
  })

  return (
    <div className="rounded-xl border bg-muted/30">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-3 py-2"
      >
        {open ? <ChevronDown className="size-4 text-muted-foreground" /> : <ChevronRight className="size-4 text-muted-foreground" />}
        <span className="text-sm font-semibold">Abgeschlossen</span>
        <Badge variant="secondary" className="ml-auto">{periods.length}</Badge>
      </button>

      {open && (
        <div className="flex flex-col gap-2 px-3 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <Select value={year} onValueChange={(v) => setYear(v ?? 'all')}>
              <SelectTrigger size="sm" className="min-w-28">
                <SelectValue>{(v: string | null) => (v && v !== 'all' ? v : 'Alle Jahre')}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Jahre</SelectItem>
                {years.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={month} onValueChange={(v) => setMonth(v ?? 'all')}>
              <SelectTrigger size="sm" className="min-w-32">
                <SelectValue>{(v: string | null) => (v && v !== 'all' ? MONTHS[Number(v)] : 'Alle Monate')}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Monate</SelectItem>
                {MONTHS.map((m, i) => <SelectItem key={m} value={String(i)}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {filtered.length === 0 ? (
            <p className="py-2 text-xs text-muted-foreground">Keine abgeschlossenen Zeiträume für diese Auswahl.</p>
          ) : (
            filtered.map((period) => (
              <ClosedPeriodLane
                key={period.id}
                period={period}
                expanded={isExpanded(period.id, false)}
                onToggle={() => toggle(period.id, false)}
                activeId={activeId}
                actions={renderActions(period)}
                onOpen={onOpen}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}

// ── Board ───────────────────────────────────────────────────────────────────

export function SprintPlanningBoard() {
  const isManager = useIsManager()
  const { data: orders = [] } = useOrders()
  const { data: periods = [] } = usePlanningPeriods()
  const { data: employees = [] } = useEmployees()

  const updatePeriod = useUpdatePlanningPeriod()
  const deletePeriod = useDeletePlanningPeriod()
  const updateOrderPeriod = useUpdateOrderPlanningPeriod()
  const updateOrder = useUpdateOrder()

  const [activeId, setActiveId]       = useState<string | null>(null)
  const [activeOrder, setActiveOrder] = useState<Order | null>(null)
  const [overrides, setOverrides]     = useState<Record<string, boolean>>({})
  const [detailOrder, setDetailOrder] = useState<Order | null>(null)

  const [creating, setCreating]   = useState(false)
  const [editing, setEditing]     = useState<PlanningPeriod | null>(null)
  const [closing, setClosing]     = useState<PlanningPeriod | null>(null)

  // Re-resolve against the live list so the dialog shows fresh data after a refetch.
  // Closed-period orders aren't in `orders`, so fall back to the clicked object.
  const detailFresh = detailOrder
    ? (orders.find((o) => o.id === detailOrder.id) ?? detailOrder)
    : null

  const handleSaveDetail = (updated: {
    title: string; customer?: string; street: string; houseNumber: string; zip: string; city: string
    description?: string; assigneeIds: string[]
    revenue?: number; invoiceDate?: string; estimatedHours?: number
    plannedStartDate?: string; plannedEndDate?: string
    deviationReason?: string
  }) => {
    if (!detailFresh) return
    updateOrder.mutate({ id: detailFresh.id, ...updated })
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const isExpanded = (id: string, def: boolean) => overrides[id] ?? def
  const toggle = (id: string, def: boolean) =>
    setOverrides((o) => ({ ...o, [id]: !(o[id] ?? def) }))

  const handleDragStart = (e: DragStartEvent) => {
    setActiveId(e.active.id as string)
    setActiveOrder((e.active.data.current?.order as Order | undefined) ?? null)
  }

  const handleDragEnd = (e: DragEndEvent) => {
    const order = e.active.data.current?.order as Order | undefined
    const overId = e.over?.id as string | undefined
    setActiveId(null)
    setActiveOrder(null)
    if (!order || !overId) return
    const targetPeriodId = overId === UNASSIGNED_ID ? null : overId
    if ((order.planningPeriodId ?? null) === targetPeriodId) return
    updateOrderPeriod.mutate({ id: order.id, planningPeriodId: targetPeriodId })
  }

  const unassignedOrders = orders.filter((o) => !o.planningPeriodId)
  const openPeriods = periods.filter((p) => p.status !== 'Closed')
  const closedPeriods = periods.filter((p) => p.status === 'Closed')

  const activatePeriod = (period: PlanningPeriod) =>
    updatePeriod.mutate({
      id: period.id,
      name: period.name,
      startDate: period.startDate ?? '',
      endDate: period.endDate ?? '',
      status: 'Active',
    })

  const periodActions = (period: PlanningPeriod) =>
    isManager ? (
      <div className="flex items-center gap-1">
        {period.status === 'Planned' && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1 border-success bg-success/10 text-success hover:bg-success/20 hover:text-success"
            onClick={() => activatePeriod(period)}
          >
            <Play className="size-3.5" /> Starten
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="size-7" />}>
            <MoreVertical className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setEditing(period)}>
              <Pencil className="size-4" /> Bearbeiten
            </DropdownMenuItem>
            {period.status !== 'Closed' && (
              <DropdownMenuItem onClick={() => setClosing(period)}>
                <Archive className="size-4" /> Abschließen
              </DropdownMenuItem>
            )}
            <DropdownMenuItem variant="destructive" onClick={() => deletePeriod.mutate(period.id)}>
              <Trash2 className="size-4" /> Löschen
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    ) : null

  return (
    <>
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex flex-col gap-3">
          {isManager && (
            <Button variant="outline" size="sm" className="self-start" onClick={() => setCreating(true)}>
              <Plus className="size-4" /> Neuen Zeitraum anlegen
            </Button>
          )}

          {/* Active & planned periods */}
          {openPeriods.map((period) => {
            const badge = periodStatusBadge[period.status]
            return (
              <Swimlane
                key={period.id}
                id={period.id}
                title={period.name}
                badge={<Badge variant={badge.variant}>{badge.label}</Badge>}
                dateLabel={dateRangeLabel(period.startDate, period.endDate)}
                count={period.orderCount}
                expanded={isExpanded(period.id, true)}
                onToggle={() => toggle(period.id, true)}
                actions={periodActions(period)}
                items={orders.filter((o) => o.planningPeriodId === period.id)}
                activeId={activeId}
                onOpen={setDetailOrder}
              />
            )
          })}

          {/* Global planning pool (unassigned orders) */}
          <Swimlane
            id={UNASSIGNED_ID}
            title={<span className="flex items-center gap-1.5"><Inbox className="size-4" /> Planung</span>}
            badge={<Badge variant="outline">Unzugeordnet</Badge>}
            count={unassignedOrders.length}
            expanded={isExpanded(UNASSIGNED_ID, true)}
            onToggle={() => toggle(UNASSIGNED_ID, true)}
            items={unassignedOrders}
            activeId={activeId}
            onOpen={setDetailOrder}
          />

          {/* Closed periods grouped into one collapsible card with year/month filter */}
          {closedPeriods.length > 0 && (
            <ClosedPeriodsSection
              periods={closedPeriods}
              activeId={activeId}
              isExpanded={isExpanded}
              toggle={toggle}
              renderActions={periodActions}
              onOpen={setDetailOrder}
            />
          )}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeOrder && <PlanningOrderCard order={activeOrder} overlay />}
        </DragOverlay>
      </DndContext>

      {creating && <PlanningPeriodDialog onClose={() => setCreating(false)} />}
      {editing && <PlanningPeriodDialog period={editing} onClose={() => setEditing(null)} />}
      {closing && (
        <ClosePeriodDialog period={closing} periods={periods} onClose={() => setClosing(null)} />
      )}
      {detailFresh && (
        <OrderDetailDialog
          order={detailFresh}
          employees={employees}
          open={!!detailFresh}
          onClose={() => setDetailOrder(null)}
          onSave={handleSaveDetail}
        />
      )}
    </>
  )
}
