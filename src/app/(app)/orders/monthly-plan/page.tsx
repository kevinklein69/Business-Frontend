import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function MonatsplanPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Monatsplan</h1>
      <Card>
        <CardHeader>
          <CardTitle>Monatsplanung</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Monatsplanung folgt in einem späteren Schritt.</p>
        </CardContent>
      </Card>
    </div>
  )
}
