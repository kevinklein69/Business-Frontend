'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { Auftrag } from '@/types'

type AuftragStatus = Auftrag['status']

const INITIAL_AUFTRAEGE: Auftrag[] = [
  { id: '1', titel: 'Heizungsanlage prüfen', status: 'Backlog', erstelltAm: '2026-06-01' },
  { id: '2', titel: 'Dach-Inspektion', beschreibung: 'Jährliche Kontrolle', status: 'InBearbeitung', zugewiesenAn: 'M. Müller', erstelltAm: '2026-06-02' },
  { id: '3', titel: 'Elektroinstallation EG', status: 'InBearbeitung', zugewiesenAn: 'T. Schmidt', erstelltAm: '2026-05-28' },
  { id: '4', titel: 'Sanitär OG', status: 'BereitFuerAbnahme', zugewiesenAn: 'M. Müller', erstelltAm: '2026-05-20' },
  { id: '5', titel: 'Fensteraustausch 2. OG', beschreibung: 'Alle 4 Fenster', status: 'Rechnungserstellung', zugewiesenAn: 'T. Schmidt', erstelltAm: '2026-05-15' },
  { id: '6', titel: 'Malerarbeiten EG', status: 'Erledigt', erstelltAm: '2026-05-10' },
]

const COLUMNS: { key: AuftragStatus; label: string; badgeVariant: 'default' | 'secondary' | 'outline' }[] = [
  { key: 'Backlog',             label: 'Backlog',             badgeVariant: 'secondary' },
  { key: 'InBearbeitung',       label: 'In Bearbeitung',      badgeVariant: 'default'   },
  { key: 'BereitFuerAbnahme',   label: 'Bereit für Abnahme', badgeVariant: 'default'   },
  { key: 'Rechnungserstellung', label: 'Rechnungserstellung', badgeVariant: 'default'   },
  { key: 'Erledigt',            label: 'Erledigt',            badgeVariant: 'outline'   },
]

// ── Card component ────────────────────────────────────────────────────────────

function KanbanCard({ auftrag, overlay = false }: { auftrag: Auftrag; overlay?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: auftrag.id,
  })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      {...listeners}
      {...attributes}
      className={cn(
        'touch-none',
        isDragging && !overlay && 'opacity-40',
        overlay && 'rotate-2 shadow-xl cursor-grabbing'
      )}
    >
      <Card size="sm" className={cn('select-none', !overlay && 'cursor-grab active:cursor-grabbing')}>
        <CardHeader>
          <CardTitle className="text-sm leading-snug">{auftrag.titel}</CardTitle>
        </CardHeader>
        {(auftrag.beschreibung || auftrag.zugewiesenAn) && (
          <CardContent className="flex flex-col gap-0.5">
            {auftrag.beschreibung && (
              <p className="text-sm text-muted-foreground">{auftrag.beschreibung}</p>
            )}
            {auftrag.zugewiesenAn && (
              <p className="text-sm text-muted-foreground">→ {auftrag.zugewiesenAn}</p>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  )
}

// ── Column component ──────────────────────────────────────────────────────────

function KanbanColumn({
  col,
  items,
  activeId,
}: {
  col: typeof COLUMNS[number]
  items: Auftrag[]
  activeId: string | null
}) {
  const { isOver, setNodeRef } = useDroppable({ id: col.key })

  return (
    <div className="flex flex-col gap-2 flex-1 min-w-[160px]">
      <div className="flex items-center justify-between px-1">
        <span className="text-sm font-medium">{col.label}</span>
        <Badge variant={col.badgeVariant}>{items.length}</Badge>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          'flex flex-col gap-2 min-h-32 rounded-xl p-2 transition-colors duration-150',
          isOver ? 'bg-primary/10 ring-2 ring-primary/30' : 'bg-muted ring-1 ring-border'
        )}
      >
        {items.map((auftrag) => (
          <KanbanCard key={auftrag.id} auftrag={auftrag} />
        ))}

        {/* Drop placeholder while dragging over this column */}
        {isOver && activeId && !items.find((a) => a.id === activeId) && (
          <div className="h-20 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5" />
        )}
      </div>
    </div>
  )
}

// ── Board ─────────────────────────────────────────────────────────────────────

export function KanbanBoard() {
  const [auftraege, setAuftraege] = useState<Auftrag[]>(INITIAL_AUFTRAEGE)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newTitel, setNewTitel] = useState('')
  const [newBeschreibung, setNewBeschreibung] = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  )

  const activeAuftrag = auftraege.find((a) => a.id === activeId) ?? null

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    if (!over) return
    const newStatus = over.id as AuftragStatus
    setAuftraege((prev) =>
      prev.map((a) => (a.id === active.id ? { ...a, status: newStatus } : a))
    )
  }

  const handleCreate = () => {
    if (!newTitel.trim()) return
    setAuftraege((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        titel: newTitel.trim(),
        beschreibung: newBeschreibung.trim() || undefined,
        status: 'Backlog',
        erstelltAm: new Date().toISOString().slice(0, 10),
      },
    ])
    setNewTitel('')
    setNewBeschreibung('')
    setDialogOpen(false)
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Aufträge</h1>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger render={<Button />}>
              <Plus className="size-4" />
              Neuer Auftrag
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Neuen Auftrag erstellen</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-4 py-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="titel">Titel</Label>
                  <Input
                    id="titel"
                    value={newTitel}
                    onChange={(e) => setNewTitel(e.target.value)}
                    placeholder="Auftragstitel"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="beschreibung">Beschreibung (optional)</Label>
                  <Input
                    id="beschreibung"
                    value={newBeschreibung}
                    onChange={(e) => setNewBeschreibung(e.target.value)}
                    placeholder="Kurze Beschreibung"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreate} disabled={!newTitel.trim()}>
                  Erstellen
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-2 w-full min-w-0">
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.key}
              col={col}
              items={auftraege.filter((a) => a.status === col.key)}
              activeId={activeId}
            />
          ))}
        </div>
      </div>

      {/* Floating card shown under cursor while dragging */}
      <DragOverlay dropAnimation={null}>
        {activeAuftrag && <KanbanCard auftrag={activeAuftrag} overlay />}
      </DragOverlay>
    </DndContext>
  )
}
