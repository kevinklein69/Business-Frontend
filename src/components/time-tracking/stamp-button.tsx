'use client'

import { useState, useEffect } from 'react'
import { Timer, LogIn, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function StempelButton() {
  const [isStamped, setIsStamped] = useState(false)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!isStamped || startTime === null) return
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [isStamped, startTime])

  const handleToggle = () => {
    if (isStamped) {
      setIsStamped(false)
      setStartTime(null)
      setElapsed(0)
    } else {
      setIsStamped(true)
      setStartTime(Date.now())
      setElapsed(0)
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={cn(
          'flex items-center gap-2 text-sm font-medium',
          isStamped ? 'text-green-600' : 'text-muted-foreground'
        )}
      >
        <Timer className="size-4" />
        {isStamped ? `Eingestempelt seit ${formatDuration(elapsed)}` : 'Nicht eingestempelt'}
      </div>
      <Button
        size="lg"
        variant="outline"
        onClick={handleToggle}
        className={cn(
          'h-16 w-48 text-base gap-2',
          isStamped
            ? 'border-destructive text-destructive hover:bg-destructive/10'
            : 'border-green-600 text-green-600 hover:bg-green-600/10'
        )}
      >
        {isStamped ? (
          <>
            <LogOut className="size-5" />
            Ausstempeln
          </>
        ) : (
          <>
            <LogIn className="size-5" />
            Einstempeln
          </>
        )}
      </Button>
    </div>
  )
}
