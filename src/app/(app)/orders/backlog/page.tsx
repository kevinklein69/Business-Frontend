import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function BacklogPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Backlog</h1>
      <Card>
        <CardHeader>
          <CardTitle>Auftrags-Backlog</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Detailansicht des Backlogs folgt in einem späteren Schritt.</p>
        </CardContent>
      </Card>
    </div>
  )
}
