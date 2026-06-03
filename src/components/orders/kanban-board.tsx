'use client'

import { useState } from 'react'
import { Plus, User, Building2, Search, Check } from 'lucide-react'
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
import type { Auftrag } from '@/types'

type AuftragStatus = Auftrag['status']

const MITARBEITER = [
  'Max Müller', 'Anna Schmidt', 'Tom Wagner',
  'Lisa Bauer', 'Jonas Fischer', 'Maria Hoffmann',
]

const INITIAL_AUFTRAEGE: Auftrag[] = [
  { id: '1', titel: 'Heizungsanlage prüfen', kunde: 'Familie Berger', status: 'Backlog', zugewiesenAn: [], erstelltAm: '2026-06-01' },
  { id: '2', titel: 'Dach-Inspektion', beschreibung: 'Jährliche Kontrolle', kunde: 'Hausverwaltung GmbH', status: 'InBearbeitung', zugewiesenAn: ['Max Müller', 'Anna Schmidt'], erstelltAm: '2026-06-02' },
  { id: '3', titel: 'Elektroinstallation EG', status: 'InBearbeitung', zugewiesenAn: ['Tom Wagner'], erstelltAm: '2026-05-28' },
  { id: '4', titel: 'Sanitär OG', kunde: 'Herr Meier', status: 'BereitFuerAbnahme', zugewiesenAn: ['Max Müller'], erstelltAm: '2026-05-20' },
  { id: '5', titel: 'Fensteraustausch 2. OG', beschreibung: 'Alle 4 Fenster', kunde: 'Frau Koch', status: 'Rechnungserstellung', zugewiesenAn: ['Tom Wagner', 'Jonas Fischer'], erstelltAm: '2026-05-15' },
  { id: '6', titel: 'Malerarbeiten EG', status: 'Erledigt', zugewiesenAn: ['Lisa Bauer'], erstelltAm: '2026-05-10' },
]

const COLUMNS: { key: AuftragStatus; label: string; badgeVariant: 'default' | 'secondary' | 'outline' }[] = [
  { key: 'Backlog',             label: 'Backlog',             badgeVariant: 'secondary' },
  { key: 'InBearbeitung',       label: 'In Bearbeitung',      badgeVariant: 'default'   },
  { key: 'BereitFuerAbnahme',   label: 'Bereit für Abnahme', badgeVariant: 'default'   },
  { key: 'Rechnungserstellung', label: 'Rechnungserstellung', badgeVariant: 'default'   },
  { key: 'Erledigt',            label: 'Erledigt',            badgeVariant: 'outline'   },
]

const COL_KEYS = COLUMNS.map((c) => c.key)

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase()
}

// ── Detail Dialog ─────────────────────────────────────────────────────────────

function AuftragDetailDialog({
  auftrag,
  open,
  onClose,
  onSave,
}: {
  auftrag: Auftrag
  open: boolean
  onClose: () => void
  onSave: (updated: Auftrag) => void
}) {
  const [titel,           setTitel]        = useState(auftrag.titel)
  const [kunde,           setKunde]        = useState(auftrag.kunde ?? '')
  const [beschreibung,    setBeschreibung] = useState(auftrag.beschreibung ?? '')
  const [mitarbeiter,     setMitarbeiter]  = useState<string[]>(auftrag.zugewiesenAn)
  const [mitarbeiterSuche, setMitarbeiterSuche] = useState('')

  const gefilterteMitarbeiter = MITARBEITER.filter((m) =>
    m.toLowerCase().includes(mitarbeiterSuche.toLowerCase())
  )

  const toggleMitarbeiter = (name: string) =>
    setMitarbeiter((prev) =>
      prev.includes(name) ? prev.filter((m) => m !== name) : [...prev, name]
    )

  const handleSave = () => {
    onSave({
      ...auftrag,
      titel:        titel.trim() || auftrag.titel,
      kunde:        kunde.trim() || undefined,
      beschreibung: beschreibung.trim() || undefined,
      zugewiesenAn: mitarbeiter,
    })
    onClose()
  }

  const statusLabel: Record<AuftragStatus, string> = {
    Backlog:             'Backlog',
    InBearbeitung:       'In Bearbeitung',
    BereitFuerAbnahme:   'Bereit für Abnahme',
    Rechnungserstellung: 'Rechnungserstellung',
    Erledigt:            'Erledigt',
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Auftrag bearbeiten</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-1">
          {/* Status badge */}
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{statusLabel[auftrag.status]}</Badge>
            <span className="text-sm text-muted-foreground">Erstellt am {format(new Date(auftrag.erstelltAm), 'dd.MM.yyyy')}</span>
          </div>

          {/* Titel */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="d-titel">Titel</Label>
            <Input id="d-titel" value={titel} onChange={(e) => setTitel(e.target.value)} />
          </div>

          {/* Kunde */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="d-kunde" className="flex items-center gap-1.5">
              <Building2 className="size-3.5" /> Kunde
            </Label>
            <Input
              id="d-kunde"
              value={kunde}
              onChange={(e) => setKunde(e.target.value)}
              placeholder="Kundenname"
            />
          </div>

          {/* Beschreibung */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="d-beschreibung">Beschreibung</Label>
            <textarea
              id="d-beschreibung"
              value={beschreibung}
              onChange={(e) => setBeschreibung(e.target.value)}
              placeholder="Auftragsdetails…"
              rows={3}
              className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-base resize-none outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 placeholder:text-muted-foreground"
            />
          </div>

          {/* Mitarbeiter */}
          <div className="flex flex-col gap-2">
            <Label className="flex items-center gap-1.5">
              <User className="size-3.5" /> Mitarbeiter
              {mitarbeiter.length > 0 && (
                <span className="ml-auto text-xs font-normal text-muted-foreground">
                  {mitarbeiter.length} ausgewählt
                </span>
              )}
            </Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Mitarbeiter suchen…"
                value={mitarbeiterSuche}
                onChange={(e) => setMitarbeiterSuche(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-0.5">
              {gefilterteMitarbeiter.length === 0 ? (
                <p className="col-span-2 text-center text-sm text-muted-foreground py-4">
                  Kein Mitarbeiter gefunden
                </p>
              ) : gefilterteMitarbeiter.map((name) => {
                const selected = mitarbeiter.includes(name)
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => toggleMitarbeiter(name)}
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
  auftrag,
  overlay = false,
  onOpen,
}: {
  auftrag: Auftrag
  overlay?: boolean
  onOpen?: (a: Auftrag) => void
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: auftrag.id })

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
        onClick={() => !isDragging && onOpen?.(auftrag)}
        className={cn(
          'select-none transition-shadow',
          !overlay && 'cursor-pointer hover:shadow-md hover:ring-2 hover:ring-primary/20 active:cursor-grabbing'
        )}
      >
        <CardHeader>
          <CardTitle className="text-sm leading-snug">{auftrag.titel}</CardTitle>
        </CardHeader>

        {(auftrag.kunde || auftrag.beschreibung || auftrag.zugewiesenAn.length > 0) && (
          <CardContent className="flex flex-col gap-2">
            {auftrag.kunde && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Building2 className="size-3 shrink-0" />
                {auftrag.kunde}
              </p>
            )}
            {auftrag.beschreibung && (
              <p className="text-sm text-muted-foreground line-clamp-2">{auftrag.beschreibung}</p>
            )}
            {auftrag.zugewiesenAn.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap">
                {auftrag.zugewiesenAn.slice(0, 3).map((name) => (
                  <div
                    key={name}
                    title={name}
                    className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold ring-2 ring-background"
                  >
                    {initials(name).slice(0, 2)}
                  </div>
                ))}
                {auftrag.zugewiesenAn.length > 3 && (
                  <div className="flex size-6 items-center justify-center rounded-full bg-muted text-muted-foreground text-xs ring-2 ring-background">
                    +{auftrag.zugewiesenAn.length - 3}
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
  items: Auftrag[]
  activeId: string | null
  onOpenCard: (a: Auftrag) => void
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
          'flex flex-col gap-2 min-h-32 rounded-xl p-2 transition-colors duration-150 ring-1',
          isOver ? 'bg-primary/10 ring-primary/30' : 'bg-muted ring-border'
        )}
      >
        {items.map((auftrag) => (
          <KanbanCard key={auftrag.id} auftrag={auftrag} onOpen={onOpenCard} />
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
  const [auftraege,       setAuftraege]       = useState<Auftrag[]>(INITIAL_AUFTRAEGE)
  const [activeId,        setActiveId]        = useState<string | null>(null)
  const [detailAuftrag,   setDetailAuftrag]   = useState<Auftrag | null>(null)
  const [newDialogOpen,   setNewDialogOpen]   = useState(false)
  const [newTitel,        setNewTitel]        = useState('')
  const [newBeschreibung, setNewBeschreibung] = useState('')

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))
  const activeAuftrag = auftraege.find((a) => a.id === activeId) ?? null

  const handleDragStart = (e: DragStartEvent) => setActiveId(e.active.id as string)

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveId(null)
    if (!e.over) return
    setAuftraege((prev) =>
      prev.map((a) => a.id === e.active.id ? { ...a, status: e.over!.id as AuftragStatus } : a)
    )
  }

  const handleSaveDetail = (updated: Auftrag) => {
    setAuftraege((prev) => prev.map((a) => a.id === updated.id ? updated : a))
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
        zugewiesenAn: [],
        erstelltAm: new Date().toISOString().slice(0, 10),
      },
    ])
    setNewTitel('')
    setNewBeschreibung('')
    setNewDialogOpen(false)
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
                    <Label htmlFor="n-titel">Titel</Label>
                    <Input id="n-titel" value={newTitel} onChange={(e) => setNewTitel(e.target.value)} placeholder="Auftragstitel" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="n-beschreibung">Beschreibung (optional)</Label>
                    <Input id="n-beschreibung" value={newBeschreibung} onChange={(e) => setNewBeschreibung(e.target.value)} placeholder="Kurze Beschreibung" />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleCreate} disabled={!newTitel.trim()}>Erstellen</Button>
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
                onOpenCard={setDetailAuftrag}
              />
            ))}
          </div>
        </div>

        <DragOverlay dropAnimation={null}>
          {activeAuftrag && <KanbanCard auftrag={activeAuftrag} overlay />}
        </DragOverlay>
      </DndContext>

      {detailAuftrag && (
        <AuftragDetailDialog
          auftrag={detailAuftrag}
          open={!!detailAuftrag}
          onClose={() => setDetailAuftrag(null)}
          onSave={handleSaveDetail}
        />
      )}
    </>
  )
}
