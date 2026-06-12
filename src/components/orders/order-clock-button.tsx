'use client'

import { useEffect, useState } from 'react'
import { LogIn, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useOrderClockStatus, useToggleOrderClock } from '@/hooks/use-time-tracking'

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/** Kompakter Stempel-Button für den Auftrags-Stempel (unabhängig vom allgemeinen Anwesenheits-Stempel). */
export function OrderClockButton({ orderId }: { orderId: string }) {
  const clockStatus = useOrderClockStatus(orderId)
  const toggleClock = useToggleOrderClock(orderId)
  const [isClockedIn, setIsClockedIn] = useState(false)
  const [startTime,   setStartTime]   = useState<number | null>(null)
  const [elapsed,     setElapsed]     = useState(0)

  // Server ist die Quelle der Wahrheit – lokalen Zustand nach (Re-)Laden synchronisieren.
  useEffect(() => {
    if (!clockStatus.data) return
    applyStatus(clockStatus.data)
  }, [clockStatus.data])

  useEffect(() => {
    if (!isClockedIn || startTime === null) return
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [isClockedIn, startTime])

  function applyStatus(result: { isClockedIn: boolean; clockIn?: string }) {
    setIsClockedIn(result.isClockedIn)
    if (result.isClockedIn && result.clockIn) {
      setStartTime(new Date(result.clockIn).getTime())
      setElapsed(Math.floor((Date.now() - new Date(result.clockIn).getTime()) / 1000))
    } else {
      setStartTime(null)
      setElapsed(0)
    }
  }

  const handleToggle = () => {
    toggleClock.mutate(undefined, { onSuccess: applyStatus })
  }

  return (
    <div className="flex items-center gap-2.5">
      <Button
        type="button"
        size="sm"
        variant={isClockedIn ? 'destructive' : 'outline'}
        onClick={handleToggle}
        disabled={toggleClock.isPending}
        className={cn(
          isClockedIn
            ? 'stamp-active'
            : 'border-success bg-success/10 text-success hover:bg-success/20 hover:text-success'
        )}
      >
        {isClockedIn ? <LogOut className="size-3.5" /> : <LogIn className="size-3.5" />}
        {isClockedIn ? 'Für diesen Auftrag ausstempeln' : 'Für diesen Auftrag einstempeln'}
      </Button>
      <span className={cn(
        'text-sm font-medium tabular-nums',
        isClockedIn ? 'text-destructive' : 'text-muted-foreground'
      )}>
        {isClockedIn ? formatDuration(elapsed) : 'Nicht eingestempelt'}
      </span>
    </div>
  )
}
