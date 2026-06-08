'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 py-20 text-center">
      <AlertTriangle className="size-8 text-destructive" />
      <p className="text-sm text-muted-foreground">Etwas ist schiefgelaufen.</p>
      <Button variant="outline" size="sm" onClick={reset}>
        Erneut versuchen
      </Button>
    </div>
  )
}
