'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useEmployees } from '@/hooks/use-employees'
import { usePlanningPeriods } from '@/hooks/use-planning-periods'
import { useIsManager } from '@/lib/auth'
import { cn } from '@/lib/utils'
import { CreateOrderDialog } from './create-order-dialog'
import { KanbanBoard } from './kanban-board'
import { SprintPlanningBoard } from './sprint-planning-board'

type View = 'planning' | 'sprint'

export function OrdersView() {
  const isManager = useIsManager()
  const { data: employees = [] } = useEmployees()
  const { data: periods = [] } = usePlanningPeriods()
  const activePeriod = periods.find((p) => p.status === 'Active') ?? null

  const [view, setView] = useState<View>('sprint')

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h1 className="text-2xl font-semibold">Aufträge</h1>
        {isManager && <CreateOrderDialog employees={employees} />}
      </div>

      {isManager && (
        <div className="flex gap-1 rounded-lg bg-muted p-1 w-fit">
          {([
            { key: 'planning' as const, label: 'Planung' },
            { key: 'sprint' as const, label: activePeriod ? `Aktive Aufträge: ${activePeriod.name}` : 'Aktive Aufträge' },
          ]).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setView(tab.key)}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                view === tab.key
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {isManager && view === 'planning' ? (
        <SprintPlanningBoard />
      ) : activePeriod ? (
        <KanbanBoard periodId={activePeriod.id} />
      ) : (
        <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          {isManager ? (
            <>
              Es ist kein Zeitraum aktiv. Lege unter <strong>Planung</strong> einen Zeitraum an und drücke auf
              <strong> Starten</strong>, um hier die aktiven Aufträge zu sehen.
              <div className="mt-3">
                <Button variant="outline" size="sm" onClick={() => setView('planning')}>Zur Planung</Button>
              </div>
            </>
          ) : (
            'Es ist aktuell kein Zeitraum aktiv.'
          )}
        </div>
      )}
    </div>
  )
}
