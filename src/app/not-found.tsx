import Link from 'next/link'
import { Compass } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 min-h-screen text-center">
      <Compass className="size-8 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">Diese Seite gibt es nicht.</p>
      <Link href="/dashboard" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
        Zum Dashboard
      </Link>
    </div>
  )
}
