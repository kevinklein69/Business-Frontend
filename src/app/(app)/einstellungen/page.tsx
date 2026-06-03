import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function EinstellungenPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Einstellungen</h1>
      <Card>
        <CardHeader>
          <CardTitle>Rollen & Berechtigungen</CardTitle>
          <CardDescription>Verwaltung der Benutzerrollen und Zugriffsrechte</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Einstellungen werden in einem späteren Schritt implementiert.</p>
        </CardContent>
      </Card>
    </div>
  )
}
