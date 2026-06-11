'use client'

import { useState } from 'react'
import { isAxiosError } from 'axios'
import { addMonths, format, parseISO } from 'date-fns'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useUpdateEmployee } from '@/hooks/use-employees'
import type { Employee, Role } from '@/types'

const roleLabel: Record<Role, string> = {
  Admin:    'Admin',
  Manager:  'Manager',
  Employee: 'Mitarbeiter',
}

const roles: Role[] = ['Employee', 'Manager', 'Admin']

const computeProbationEnd = (entryDate: string, months: string) => {
  if (!entryDate || !months.trim()) return ''
  const monthsNum = Number(months)
  if (Number.isNaN(monthsNum)) return ''
  return format(addMonths(parseISO(entryDate), monthsNum), 'yyyy-MM-dd')
}

export function EditEmployeeDialog({ employee, onClose }: { employee: Employee; onClose: () => void }) {
  const [form, setForm] = useState({
    firstName: employee.firstName,
    lastName: employee.lastName,
    email: employee.email,
    department: employee.department ?? '',
    password: '',
    phone: employee.phone ?? '',
    street: employee.street ?? '',
    houseNumber: employee.houseNumber ?? '',
    zip: employee.zip ?? '',
    city: employee.city ?? '',
    entryDate: employee.entryDate ?? '',
    probationMonths: employee.probationMonths != null ? String(employee.probationMonths) : '',
    probationEndDate: employee.probationEndDate ?? '',
    vacationDaysEntitlement: employee.vacationDaysEntitlement != null ? String(employee.vacationDaysEntitlement) : '30',
  })
  const [role, setRole] = useState<Role>(employee.role)
  const [probationEndTouched, setProbationEndTouched] = useState(false)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateEmployee = useUpdateEmployee()

  const markTouched = (field: string) => () => setTouched((t) => ({ ...t, [field]: true }))
  const showError = (field: string) => touched[field] || submitAttempted

  const updateField = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setForm((f) => {
      const next = { ...f, [field]: value }
      if ((field === 'entryDate' || field === 'probationMonths') && !probationEndTouched) {
        next.probationEndDate = computeProbationEnd(next.entryDate, next.probationMonths)
      }
      return next
    })
  }

  const handleSave = () => {
    setSubmitAttempted(true)
    setError(null)
    if (!canSubmit) return
    updateEmployee.mutate(
      {
        id: employee.id,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        role,
        department: form.department.trim() || undefined,
        password: form.password ? form.password : undefined,
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
        onSuccess: () => onClose(),
        onError: (err) => {
          const detail = isAxiosError(err) && err.response?.status === 400
            ? 'Diese E-Mail-Adresse wird bereits verwendet, oder die Eingaben sind ungültig.'
            : 'Mitarbeiter konnte nicht aktualisiert werden.'
          setError(detail)
        },
      }
    )
  }

  const fieldErrors = {
    firstName: form.firstName.trim() ? null : 'Der Vorname ist erforderlich.',
    lastName: form.lastName.trim() ? null : 'Der Nachname ist erforderlich.',
    email: form.email.trim() ? null : 'Die E-Mail-Adresse ist erforderlich.',
    password: form.password.length === 0 || form.password.length >= 8
      ? null
      : 'Das Passwort muss mindestens 8 Zeichen haben.',
    street: form.street.trim() ? null : 'Die Straße ist erforderlich.',
    houseNumber: form.houseNumber.trim() ? null : 'Die Hausnummer ist erforderlich.',
    zip: /^\d{5}$/.test(form.zip.trim()) ? null : 'Die PLZ muss aus 5 Ziffern bestehen.',
    city: form.city.trim() ? null : 'Der Ort ist erforderlich.',
    entryDate: form.entryDate ? null : 'Das Eintrittsdatum ist erforderlich.',
    vacationDaysEntitlement: form.vacationDaysEntitlement.trim() && Number(form.vacationDaysEntitlement) >= 0
      ? null
      : 'Der Urlaubsanspruch muss 0 oder größer sein.',
  }
  const canSubmit = !Object.values(fieldErrors).some(Boolean)

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Mitarbeiter bearbeiten</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-1 max-h-[70vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ee-firstName">Vorname *</Label>
              <Input
                id="ee-firstName"
                value={form.firstName}
                onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                onBlur={markTouched('firstName')}
                placeholder="Vorname"
                required
                aria-invalid={showError('firstName') && !!fieldErrors.firstName}
              />
              {showError('firstName') && fieldErrors.firstName && (
                <p className="text-sm text-destructive">{fieldErrors.firstName}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ee-lastName">Nachname *</Label>
              <Input
                id="ee-lastName"
                value={form.lastName}
                onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                onBlur={markTouched('lastName')}
                placeholder="Nachname"
                required
                aria-invalid={showError('lastName') && !!fieldErrors.lastName}
              />
              {showError('lastName') && fieldErrors.lastName && (
                <p className="text-sm text-destructive">{fieldErrors.lastName}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ee-email">E-Mail *</Label>
            <Input
              id="ee-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              onBlur={markTouched('email')}
              placeholder="name@firma.de"
              required
              aria-invalid={showError('email') && !!fieldErrors.email}
            />
            {showError('email') && fieldErrors.email && (
              <p className="text-sm text-destructive">{fieldErrors.email}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ee-password">Neues Passwort (optional)</Label>
            <Input
              id="ee-password"
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              onBlur={markTouched('password')}
              placeholder="Leer lassen, um Passwort beizubehalten"
              aria-invalid={showError('password') && !!fieldErrors.password}
            />
            {showError('password') && fieldErrors.password && (
              <p className="text-sm text-destructive">{fieldErrors.password}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ee-phone">Telefonnummer (optional)</Label>
            <Input
              id="ee-phone"
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
                <Label htmlFor="ee-street">Straße *</Label>
                <Input
                  id="ee-street"
                  value={form.street}
                  onChange={updateField('street')}
                  onBlur={markTouched('street')}
                  placeholder="Musterstraße"
                  required
                  aria-invalid={showError('street') && !!fieldErrors.street}
                />
                {showError('street') && fieldErrors.street && (
                  <p className="text-sm text-destructive">{fieldErrors.street}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ee-houseNumber">Hausnr. *</Label>
                <Input
                  id="ee-houseNumber"
                  value={form.houseNumber}
                  onChange={updateField('houseNumber')}
                  onBlur={markTouched('houseNumber')}
                  placeholder="12a"
                  required
                  aria-invalid={showError('houseNumber') && !!fieldErrors.houseNumber}
                />
                {showError('houseNumber') && fieldErrors.houseNumber && (
                  <p className="text-sm text-destructive">{fieldErrors.houseNumber}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ee-zip">PLZ *</Label>
                <Input
                  id="ee-zip"
                  value={form.zip}
                  onChange={updateField('zip')}
                  onBlur={markTouched('zip')}
                  placeholder="12345"
                  maxLength={5}
                  required
                  aria-invalid={showError('zip') && !!fieldErrors.zip}
                />
                {showError('zip') && fieldErrors.zip && (
                  <p className="text-sm text-destructive">{fieldErrors.zip}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5 col-span-2">
                <Label htmlFor="ee-city">Ort *</Label>
                <Input
                  id="ee-city"
                  value={form.city}
                  onChange={updateField('city')}
                  onBlur={markTouched('city')}
                  placeholder="Musterstadt"
                  required
                  aria-invalid={showError('city') && !!fieldErrors.city}
                />
                {showError('city') && fieldErrors.city && (
                  <p className="text-sm text-destructive">{fieldErrors.city}</p>
                )}
              </div>
            </div>
          </div>

          {/* Vertragsdaten */}
          <div className="flex flex-col gap-3 border-t pt-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Vertragsdaten</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ee-entryDate">Eintrittsdatum *</Label>
                <Input
                  id="ee-entryDate"
                  type="date"
                  value={form.entryDate}
                  onChange={updateField('entryDate')}
                  onBlur={markTouched('entryDate')}
                  required
                  aria-invalid={showError('entryDate') && !!fieldErrors.entryDate}
                />
                {showError('entryDate') && fieldErrors.entryDate && (
                  <p className="text-sm text-destructive">{fieldErrors.entryDate}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ee-probationMonths">Probezeit (Monate)</Label>
                <Input id="ee-probationMonths" type="number" min={0} value={form.probationMonths} onChange={updateField('probationMonths')} placeholder="z.B. 6" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ee-probationEndDate">Probezeitende</Label>
                <Input
                  id="ee-probationEndDate"
                  type="date"
                  value={form.probationEndDate}
                  onChange={(e) => {
                    setProbationEndTouched(true)
                    setForm((f) => ({ ...f, probationEndDate: e.target.value }))
                  }}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ee-vacationDays">Urlaubsanspruch (Tage) *</Label>
                <Input
                  id="ee-vacationDays"
                  type="number"
                  min={0}
                  value={form.vacationDaysEntitlement}
                  onChange={updateField('vacationDaysEntitlement')}
                  onBlur={markTouched('vacationDaysEntitlement')}
                  required
                  aria-invalid={showError('vacationDaysEntitlement') && !!fieldErrors.vacationDaysEntitlement}
                />
                {showError('vacationDaysEntitlement') && fieldErrors.vacationDaysEntitlement && (
                  <p className="text-sm text-destructive">{fieldErrors.vacationDaysEntitlement}</p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ee-role">Rolle</Label>
              <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                <SelectTrigger id="ee-role" className="w-full">
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
              <Label htmlFor="ee-department">Abteilung (optional)</Label>
              <Input
                id="ee-department"
                value={form.department}
                onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                placeholder="z.B. Technical"
              />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Abbrechen</Button>
          <Button onClick={handleSave} disabled={!canSubmit || updateEmployee.isPending}>
            Speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
