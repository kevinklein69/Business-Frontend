'use client'

import { format } from 'date-fns'
import { ClipboardCheck, Pencil } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { usePendingEntries, useUpdateEntryStatus } from '@/hooks/use-time-tracking'

export function PendingEntriesCard() {
  const { data: entries = [], isLoading } = usePendingEntries()
  const updateStatus = useUpdateEntryStatus()

  const handleApprove = (id: string) => updateStatus.mutate({ id, status: 'Approved' })
  const handleReject  = (id: string) => updateStatus.mutate({ id, status: 'Rejected' })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <ClipboardCheck className="size-4" />
          Offene Zeitkorrekturen
          <Badge variant="secondary" className="tabular-nums">{entries.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mitarbeiter</TableHead>
              <TableHead>Datum</TableHead>
              <TableHead>Kommen</TableHead>
              <TableHead>Gehen</TableHead>
              <TableHead>Grund</TableHead>
              <TableHead className="text-right">Aktion</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((e) => (
              <TableRow key={e.id} className="hover:bg-muted/50 transition-colors">
                <TableCell className="font-medium">{e.userName}</TableCell>
                <TableCell className="text-muted-foreground">{format(new Date(e.date), 'dd.MM.yyyy')}</TableCell>
                <TableCell className="text-muted-foreground tabular-nums">{format(new Date(e.clockIn), 'HH:mm')}</TableCell>
                <TableCell className="text-muted-foreground tabular-nums">{format(new Date(e.clockOut), 'HH:mm')}</TableCell>
                <TableCell className="text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    {e.isManual && <Pencil className="size-3.5 shrink-0" />}
                    {e.note ?? '—'}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-success text-success hover:bg-success/10"
                      disabled={updateStatus.isPending}
                      onClick={() => handleApprove(e.id)}
                    >
                      Genehmigen
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-destructive text-destructive hover:bg-destructive/10"
                      disabled={updateStatus.isPending}
                      onClick={() => handleReject(e.id)}
                    >
                      Ablehnen
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                  Lade Zeitkorrekturen…
                </TableCell>
              </TableRow>
            )}
            {!isLoading && entries.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                  Keine offenen Zeitkorrekturen
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
