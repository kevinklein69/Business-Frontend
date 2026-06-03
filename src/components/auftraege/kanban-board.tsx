'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
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
import type { Auftrag } from '@/types'

const INITIAL_AUFTRAEGE: Auftrag[] = [
  { id: '1', titel: 'Heizungsanlage prüfen', status: 'Backlog', erstelltAm: '2026-06-01' },
  { id: '2', titel: 'Dach-Inspektion', beschreibung: 'Jährliche Kontrolle', status: 'InBearbeitung', zugewiesenAn: 'M. Müller', erstelltAm: '2026-06-02' },
  { id: '3', titel: 'Elektroinstallation EG', status: 'InBearbeitung', zugewiesenAn: 'T. Schmidt', erstelltAm: '2026-05-28' },
  { id: '4', titel: 'Sanitär OG', status: 'Erledigt', erstelltAm: '2026-05-20' },
]

const COLUMNS: { key: Auftrag['status']; label: string; color: string }[] = [
  { key: 'Backlog', label: 'Backlog', color: 'secondary' },
  { key: 'InBearbeitung', label: 'In Bearbeitung', color: 'default' },
  { key: 'Erledigt', label: 'Erledigt', color: 'outline' },
]

export function KanbanBoard() {
  const [auftraege, setAuftraege] = useState<Auftrag[]>(INITIAL_AUFTRAEGE)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newTitel, setNewTitel] = useState('')
  const [newBeschreibung, setNewBeschreibung] = useState('')

  const handleStatusChange = (id: string, newStatus: Auftrag['status']) => {
    setAuftraege((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
    )
  }

  const handleCreate = () => {
    if (!newTitel.trim()) return
    const newAuftrag: Auftrag = {
      id: crypto.randomUUID(),
      titel: newTitel.trim(),
      beschreibung: newBeschreibung.trim() || undefined,
      status: 'Backlog',
      erstelltAm: new Date().toISOString().slice(0, 10),
    }
    setAuftraege((prev) => [...prev, newAuftrag])
    setNewTitel('')
    setNewBeschreibung('')
    setDialogOpen(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Aufträge</h1>
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {COLUMNS.map((col) => {
          const items = auftraege.filter((a) => a.status === col.key)
          return (
            <div key={col.key} className="flex flex-col gap-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-sm font-medium">{col.label}</span>
                <Badge variant={col.color as 'default' | 'secondary' | 'outline'}>
                  {items.length}
                </Badge>
              </div>
              <div className="flex flex-col gap-2 min-h-32 rounded-xl bg-muted/40 p-2">
                {items.map((auftrag) => (
                  <Card key={auftrag.id} size="sm">
                    <CardHeader>
                      <CardTitle className="text-sm">{auftrag.titel}</CardTitle>
                    </CardHeader>
                    {(auftrag.beschreibung || auftrag.zugewiesenAn) && (
                      <CardContent className="flex flex-col gap-1">
                        {auftrag.beschreibung && (
                          <p className="text-xs text-muted-foreground">{auftrag.beschreibung}</p>
                        )}
                        {auftrag.zugewiesenAn && (
                          <p className="text-xs text-muted-foreground">→ {auftrag.zugewiesenAn}</p>
                        )}
                      </CardContent>
                    )}
                    <div className="flex gap-1 px-3 pb-3">
                      {COLUMNS.filter((c) => c.key !== col.key).map((target) => (
                        <Button
                          key={target.key}
                          size="xs"
                          variant="outline"
                          onClick={() => handleStatusChange(auftrag.id, target.key)}
                        >
                          → {target.label}
                        </Button>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
