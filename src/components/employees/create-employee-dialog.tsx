'use client'

import { useState } from 'react'
import { isAxiosError } from 'axios'
import { addMonths, format, parseISO } from 'date-fns'
import { Plus } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useCreateEmployee } from '@/hooks/use-employees'
import type { Role } from '@/types'

const roleLabel: Record<Role, string> = {
  Admin:    'Admin',
  Manager:  'Manager',
  Employee: 'Mitarbeiter',
}

const roles: Role[] = ['Employee', 'Manager', 'Admin']

const emptyForm = {
  firstName: '', lastName: '', email: '', password: '', department: '',
  phone: '', street: '', houseNumber: '', zip: '', city: '',
  entryDate: '', probationMonths: '', probationEndDate: '', vacationDaysEntitlement: '30',
}

const computeProbationEnd = (entryDate: string, months: string) => {
  if (!entryDate || !months.trim()) return ''
  const monthsNum = Number(months)
  if (Number.isNaN(monthsNum)) return ''
  return format(addMonths(parseISO(entryDate), monthsNum), 'yyyy-MM-dd')
}

export function CreateEmployeeDialog() {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [role, setRole] = useState<Role>('Employee')
  const [probationEndTouched, setProbationEndTouched] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createEmployee = useCreateEmployee()

  const reset = () => {
    setForm(emptyForm)
    setRole('Employee')
    setProbationEndTouched(false)
    setError(null)
  }

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) reset()
  }

  const updateField = (field: keyof typeof emptyForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setForm((f) => {
      const next = { ...f, [field]: value }
      if ((field === 'entryDate' || field === 'probationMonths') && !probationEndTouched) {
        next.probationEndDate = computeProbationEnd(next.entryDate, next.probationMonths)
      }
      return next
    })
  }

  const handleCreate = () => {
    setError(null)
    createEmployee.mutate(
      {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        password: form.password,
        role,
        department: form.department.trim() || undefined,
        phone: form.phone.trim() || undefined,
        street: form.street.trim(),
        houseNumber: form.houseNumber.trim(),
        zip: form.zip.trim(),
        city: form.city.trim(),
        entryDate: form.entryDate,
        probationMonths: form.probationMonths.trim() ? Number(form.probationMonths) : undefined,
        probationEndDate: form.probationEndDate || undefined,
        vacationDaysEntitlement: Number(form.vacationDaysEntitlement),
      },
      {
        onSuccess: () => handleOpenChange(false),
        onError: (err) => {
          const detail = isAxiosError(err) && err.response?.status === 400
            ? 'Diese E-Mail-Adresse wird bereits verwendet, oder die Eingaben sind ungültig.'
            : 'Mitarbeiter konnte nicht angelegt werden.'
          setError(detail)
        },
      }
    )
  }

  const canSubmit =
    form.firstName.trim() && form.lastName.trim() && form.email.trim() && form.password.length >= 8 &&
    form.street.trim() && form.houseNumber.trim() && /^\d{5}$/.test(form.zip.trim()) && form.city.trim() &&
    form.entryDate && form.vacationDaysEntitlement.trim() && Number(form.vacationDaysEntitlement) >= 0

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button />}>
        <Plus className="size-4" /> Neuer Mitarbeiter
      </DialogTrigger>
      <DialogContent className="max-w-2xl sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Neuen Mitarbeiter anlegen</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-1 max-h-[70vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="e-firstName">Vorname</Label>
              <Input
                id="e-firstName"
                value={form.firstName}
                onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                placeholder="Vorname"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="e-lastName">Nachname</Label>
              <Input
                id="e-lastName"
                value={form.lastName}
                onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                placeholder="Nachname"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="e-email">E-Mail</Label>
            <Input
              id="e-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="name@firma.de"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="e-password">Initial-Passwort</Label>
            <Input
              id="e-password"
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder="Mindestens 8 Zeichen"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="e-phone">Telefonnummer (optional)</Label>
            <Input
              id="e-phone"
              type="tel"
              value={form.phone}
              onChange={updateField('phone')}
              placeholder="+49 …"
            />
          </div>

          {/* Adresse */}
          <div className="flex flex-col gap-3 border-t pt-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Adresse</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5 col-span-2">
                <Label htmlFor="e-street">Straße *</Label>
                <Input id="e-street" value={form.street} onChange={updateField('street')} placeholder="Musterstraße" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="e-houseNumber">Hausnr. *</Label>
                <Input id="e-houseNumber" value={form.houseNumber} onChange={updateField('houseNumber')} placeholder="12a" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="e-zip">PLZ *</Label>
                <Input id="e-zip" value={form.zip} onChange={updateField('zip')} placeholder="12345" maxLength={5} />
              </div>
              <div className="flex flex-col gap-1.5 col-span-2">
                <Label htmlFor="e-city">Ort *</Label>
                <Input id="e-city" value={form.city} onChange={updateField('city')} placeholder="Musterstadt" />
              </div>
            </div>
          </div>

          {/* Vertragsdaten */}
          <div className="flex flex-col gap-3 border-t pt-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Vertragsdaten</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="e-entryDate">Eintrittsdatum *</Label>
                <Input id="e-entryDate" type="date" value={form.entryDate} onChange={updateField('entryDate')} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="e-probationMonths">Probezeit (Monate)</Label>
                <Input id="e-probationMonths" type="number" min={0} value={form.probationMonths} onChange={updateField('probationMonths')} placeholder="z.B. 6" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="e-probationEndDate">Probezeitende</Label>
                <Input
                  id="e-probationEndDate"
                  type="date"
                  value={form.probationEndDate}
                  onChange={(e) => {
                    setProbationEndTouched(true)
                    setForm((f) => ({ ...f, probationEndDate: e.target.value }))
                  }}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="e-vacationDays">Urlaubsanspruch (Tage) *</Label>
                <Input id="e-vacationDays" type="number" min={0} value={form.vacationDaysEntitlement} onChange={updateField('vacationDaysEntitlement')} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="e-role">Rolle</Label>
              <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                <SelectTrigger id="e-role" className="w-full">
                  <SelectValue placeholder="Rolle wählen…">
                    {(value: Role | null) => value ? roleLabel[value] : 'Rolle wählen…'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r} value={r}>{roleLabel[r]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="e-department">Abteilung (optional)</Label>
              <Input
                id="e-department"
                value={form.department}
                onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                placeholder="z.B. Technical"
              />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>Abbrechen</Button>
          <Button onClick={handleCreate} disabled={!canSubmit || createEmployee.isPending}>
            Anlegen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
