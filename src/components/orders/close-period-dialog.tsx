'use client'

import { useState } from 'react'
import { isAxiosError } from 'axios'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useClosePlanningPeriod, type ReassignTarget } from '@/hooks/use-planning-periods'
import type { PlanningPeriod } from '@/types'

export function ClosePeriodDialog({
  period,
  periods,
  onClose,
}: {
  period: PlanningPeriod
  periods: PlanningPeriod[]
  onClose: () => void
}) {
  const [target, setTarget] = useState<ReassignTarget>('Unassigned')
  const [targetPeriodId, setTargetPeriodId] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  const close = useClosePlanningPeriod()
  const plannedPeriods = periods.filter((p) => p.status === 'Planned' && p.id !== period.id)

  const handleConfirm = async () => {
    setError(null)
    try {
      await close.mutateAsync({
        id: period.id,
        reassignTarget: target,
        targetPeriodId: target === 'NextPeriod' ? (targetPeriodId || null) : null,
      })
      onClose()
    } catch (err) {
      const message = isAxiosError(err)
        ? 'Der Zeitraum konnte nicht abgeschlossen werden.'
        : 'Der Zeitraum konnte nicht abgeschlossen werden.'
      setError(message)
    }
  }

  const options: { value: ReassignTarget; label: string; hint: string }[] = [
    { value: 'Unassigned', label: 'In die Planung verschieben', hint: 'Nicht erledigte Aufträge landen wieder in der globalen Planung.' },
    { value: 'NextPeriod', label: 'In den nächsten Zeitraum verschieben', hint: 'Nicht erledigte Aufträge wandern in einen geplanten Zeitraum.' },
  ]

  return (
    <Dialog open onOpenChange={(o) => !o && !close.isPending && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>„{period.name}&ldquo; abschließen</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3 py-1">
          <p className="text-sm text-muted-foreground">
            Erledigte Aufträge bleiben im Zeitraum. Wohin sollen die <strong>nicht erledigten</strong> Aufträge verschoben werden?
          </p>

          <div className="flex flex-col gap-2">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTarget(opt.value)}
                className={cn(
                  'flex flex-col items-start gap-0.5 rounded-lg border px-3 py-2 text-left transition-colors',
                  target === opt.value ? 'border-primary bg-primary/5 ring-1 ring-primary/30' : 'hover:bg-muted'
                )}
              >
                <span className="text-sm font-medium">{opt.label}</span>
                <span className="text-xs text-muted-foreground">{opt.hint}</span>
              </button>
            ))}
          </div>

          {target === 'NextPeriod' && (
            <div className="flex flex-col gap-1.5">
              <Select value={targetPeriodId} onValueChange={(v) => setTargetPeriodId(v ?? '')}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Automatisch (nächster geplanter Zeitraum)" />
                </SelectTrigger>
                <SelectContent>
                  {plannedPeriods.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {plannedPeriods.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Kein geplanter Zeitraum vorhanden – die Aufträge landen in der Planung.
                </p>
              )}
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={close.isPending}>Abbrechen</Button>
          <Button onClick={handleConfirm} disabled={close.isPending}>Abschließen</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
