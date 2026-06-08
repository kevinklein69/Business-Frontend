'use client'

import { useState } from 'react'
import { isAxiosError } from 'axios'
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

const emptyForm = { firstName: '', lastName: '', email: '', password: '', department: '' }

export function CreateEmployeeDialog() {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [role, setRole] = useState<Role>('Employee')
  const [error, setError] = useState<string | null>(null)

  const createEmployee = useCreateEmployee()

  const reset = () => {
    setForm(emptyForm)
    setRole('Employee')
    setError(null)
  }

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) reset()
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
    form.firstName.trim() && form.lastName.trim() && form.email.trim() && form.password.length >= 8

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button />}>
        <Plus className="size-4" /> Neuer Mitarbeiter
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Neuen Mitarbeiter anlegen</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-1">
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
