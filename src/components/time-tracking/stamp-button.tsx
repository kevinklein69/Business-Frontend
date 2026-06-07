'use client'

import { useState, useEffect } from 'react'
import { LogIn, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function ClockButton() {
  const [isClockedIn, setIsClockedIn] = useState(false)
  const [startTime,   setStartTime]   = useState<number | null>(null)
  const [elapsed,     setElapsed]     = useState(0)

  useEffect(() => {
    if (!isClockedIn || startTime === null) return
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [isClockedIn, startTime])

  const handleToggle = () => {
    if (isClockedIn) {
      setIsClockedIn(false)
      setStartTime(null)
      setElapsed(0)
    } else {
      setIsClockedIn(true)
      setStartTime(Date.now())
      setElapsed(0)
    }
  }

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Elapsed time / status label */}
      <div className={cn(
        'text-sm font-medium tabular-nums tracking-wide transition-colors',
        isClockedIn ? 'text-destructive' : 'text-muted-foreground'
      )}>
        {isClockedIn ? formatDuration(elapsed) : 'Nicht eingestempelt'}
      </div>

      {/* Circular CTA button */}
      <button
        onClick={handleToggle}
        className={cn(
          'flex flex-col items-center justify-center size-32 rounded-full border-2 cursor-pointer select-none',
          'transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          isClockedIn
            ? 'bg-destructive/10 border-destructive text-destructive stamp-active'
            : 'bg-success/10 border-success text-success hover:bg-success/20 active:scale-95'
        )}
      >
        {isClockedIn ? (
          <>
            <LogOut className="size-6 mb-1" />
            <span className="text-[0.6rem] font-bold uppercase tracking-widest">Ausstempeln</span>
          </>
        ) : (
          <>
            <LogIn className="size-6 mb-1" />
            <span className="text-[0.6rem] font-bold uppercase tracking-widest">Einstempeln</span>
          </>
        )}
      </button>
    </div>
  )
}
