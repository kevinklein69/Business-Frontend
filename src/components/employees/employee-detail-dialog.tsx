'use client'

import { format, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useEmployee } from '@/hooks/use-employees'
import { useIsManager } from '@/lib/auth'
import { cn } from '@/lib/utils'
import { EmployeeTimeTrackingSection } from '@/components/employees/employee-time-tracking-section'
import type { Role } from '@/types'

const roleLabel: Record<Role, string> = {
  Admin:    'Admin',
  Manager:  'Manager',
  Employee: 'Mitarbeiter',
}

const formatDate = (date?: string) => (date ? format(parseISO(date), 'dd.MM.yyyy', { locale: de }) : '—')

const formatDays = (days: number) =>
  `${days.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 1 })} Tage`

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 border-t pt-3 first:border-t-0 first:pt-0">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{title}</p>
      <div className="grid grid-cols-2 gap-3">{children}</div>
    </div>
  )
}

export function EmployeeDetailDialog({ employeeId, onClose }: { employeeId: string; onClose: () => void }) {
  const { data: employee, isLoading, isError } = useEmployee(employeeId)
  const isManager = useIsManager()

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className={cn('sm:max-w-2xl', isManager && 'sm:max-w-3xl')}>
        <DialogHeader>
          <DialogTitle>Mitarbeiterdetails</DialogTitle>
        </DialogHeader>

        {isLoading && <p className="text-muted-foreground text-sm py-6 text-center">Lade Details…</p>}
        {isError && <p className="text-destructive text-sm py-6 text-center">Details konnten nicht geladen werden.</p>}

        {employee && (
          <div className="flex flex-col gap-4 py-1 max-h-[70vh] overflow-y-auto pr-1">
            <Section title="Persönliche Daten">
              <Field label="Name" value={`${employee.firstName} ${employee.lastName}`} />
              <Field label="Rolle" value={roleLabel[employee.role]} />
              <Field label="E-Mail" value={employee.email} />
              <Field label="Telefon" value={employee.phone || '—'} />
            </Section>

            <Section title="Adresse">
              <Field label="Straße & Hausnr." value={employee.street ? `${employee.street} ${employee.houseNumber ?? ''}`.trim() : '—'} />
              <Field label="PLZ & Ort" value={employee.zip ? `${employee.zip} ${employee.city ?? ''}`.trim() : '—'} />
            </Section>

            <Section title="Vertragsdetails">
              <Field label="Eintrittsdatum" value={formatDate(employee.entryDate)} />
              <Field label="Probezeitdauer" value={employee.probationMonths != null ? `${employee.probationMonths} Monate` : '—'} />
              <Field label="Probezeitende" value={formatDate(employee.probationEndDate)} />
            </Section>

            <Section title="Urlaub & Fehlzeiten">
              <Field label="Urlaubsanspruch (gesamt)" value={employee.vacationDaysEntitlement != null ? `${employee.vacationDaysEntitlement} Tage` : '—'} />
              {isManager && (
                <>
                  <Field label="Resturlaub" value={formatDays(employee.remainingVacationDays)} />
                  <Field label="Krankheitstage (akt. Jahr)" value={formatDays(employee.sickDaysThisYear)} />
                </>
              )}
            </Section>

            {isManager && (
              <div className="flex flex-col gap-3 border-t pt-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Zeiterfassung</p>
                <EmployeeTimeTrackingSection employeeId={employeeId} />
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Schließen</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
