'use client'

import { useState } from 'react'
import { isAxiosError } from 'axios'
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

export function EditEmployeeDialog({ employee, onClose }: { employee: Employee; onClose: () => void }) {
  const [form, setForm] = useState({
    firstName: employee.firstName,
    lastName: employee.lastName,
    email: employee.email,
    department: employee.department ?? '',
    password: '',
  })
  const [role, setRole] = useState<Role>(employee.role)
  const [error, setError] = useState<string | null>(null)

  const updateEmployee = useUpdateEmployee()

  const handleSave = () => {
    setError(null)
    updateEmployee.mutate(
      {
        id: employee.id,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        role,
        department: form.department.trim() || undefined,
        password: form.password ? form.password : undefined,
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

  const canSubmit =
    form.firstName.trim() && form.lastName.trim() && form.email.trim() &&
    (form.password.length === 0 || form.password.length >= 8)

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Mitarbeiter bearbeiten</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ee-firstName">Vorname</Label>
              <Input
                id="ee-firstName"
                value={form.firstName}
                onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                placeholder="Vorname"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ee-lastName">Nachname</Label>
              <Input
                id="ee-lastName"
                value={form.lastName}
                onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                placeholder="Nachname"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ee-email">E-Mail</Label>
            <Input
              id="ee-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="name@firma.de"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ee-password">Neues Passwort (optional)</Label>
            <Input
              id="ee-password"
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder="Leer lassen, um Passwort beizubehalten"
            />
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
