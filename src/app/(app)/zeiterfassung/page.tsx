import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const MOCK_BUCHUNGEN = [
  { datum: '2026-06-02', von: '07:45', bis: '16:30', dauer: '8:45', typ: 'Normal' },
  { datum: '2026-06-01', von: '08:00', bis: '17:00', dauer: '9:00', typ: 'Überstunden' },
  { datum: '2026-05-31', von: '07:30', bis: '15:00', dauer: '7:30', typ: 'Kurztag' },
  { datum: '2026-05-30', von: '08:00', bis: '16:00', dauer: '8:00', typ: 'Normal' },
  { datum: '2026-05-29', von: '07:50', bis: '16:15', dauer: '8:25', typ: 'Normal' },
]

export default function ZeiterfassungPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Zeiterfassung</h1>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Diese Woche</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">41:40</p>
            <p className="text-xs text-muted-foreground">+1:40 Überstunden</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Dieser Monat</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">168:30</p>
            <p className="text-xs text-muted-foreground">Sollzeit: 168:00</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Gesamtsaldo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">+12:15</p>
            <p className="text-xs text-muted-foreground">Überstundenkonto</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Buchungen</CardTitle>
          <CardDescription>Letzte Zeitbuchungen</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Datum</TableHead>
                <TableHead>Von</TableHead>
                <TableHead>Bis</TableHead>
                <TableHead>Dauer</TableHead>
                <TableHead>Typ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_BUCHUNGEN.map((b) => (
                <TableRow key={b.datum}>
                  <TableCell>{b.datum}</TableCell>
                  <TableCell>{b.von}</TableCell>
                  <TableCell>{b.bis}</TableCell>
                  <TableCell className="font-medium">{b.dauer}</TableCell>
                  <TableCell>
                    <Badge variant={b.typ === 'Überstunden' ? 'default' : b.typ === 'Kurztag' ? 'outline' : 'secondary'}>
                      {b.typ}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
