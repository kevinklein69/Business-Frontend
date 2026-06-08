import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <div className="flex flex-1 items-center justify-center py-20 text-muted-foreground text-sm">
      <Loader2 className="size-4 animate-spin mr-2" />
      Lädt…
    </div>
  )
}
