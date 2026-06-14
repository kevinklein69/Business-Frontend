'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Users, ClipboardList, CheckCircle2, Pencil, Trash2, Eye } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { useEmployees } from '@/hooks/use-employees'
import { isManager, useIsAdmin, useIsManager } from '@/lib/auth'
import { AssignOrdersDialog } from '@/components/employees/assign-orders-dialog'
import { CreateEmployeeDialog } from '@/components/employees/create-employee-dialog'
import { EditEmployeeDialog } from '@/components/employees/edit-employee-dialog'
import { DeleteEmployeeDialog } from '@/components/employees/delete-employee-dialog'
import { EmployeeDetailDialog } from '@/components/employees/employee-detail-dialog'
import type { Employee, Role } from '@/types'

type FilterKey = 'Alle' | 'HatAuftrag' | 'KeinAuftrag' | string

const roleLabel: Record<Role, string> = {
  Admin:    'Admin',
  Manager:  'Manager',
  Employee: 'Mitarbeiter',
}

const roleVariant: Record<Role, 'default' | 'secondary' | 'outline'> = {
  Admin:    'default',
  Manager:  'secondary',
  Employee: 'outline',
}

/* Each index gets a distinct strip gradient (from → to) + matching avatar bg */
const cardThemes = [
  { strip: 'from-[#415a77] to-[#2d4260]', avatar: 'bg-[#415a77] text-white' },
  { strip: 'from-[#1b263b] to-[#0d1b2a]', avatar: 'bg-[#1b263b] text-white' },
  { strip: 'from-[#5a7a9a] to-[#415a77]', avatar: 'bg-[#778da9] text-white' },
  { strip: 'from-[#253450] to-[#1b263b]', avatar: 'bg-[#253450] text-white' },
]

export default function EmployeesPage() {
  const router = useRouter()

  // Client-side gate — the API enforces the real authorization (Admin/Manager only).
  // Read the role directly (not via the SSR-safe useIsManager hook): on the very first
  // client render that hook still reports the hydration-safe `false`, which would redirect
  // legitimate managers away before the corrected value lands.
  useEffect(() => {
    if (!isManager()) router.replace('/dashboard')
  }, [router])

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterKey>('Alle')
  const [assigningEmployee, setAssigningEmployee] = useState<Employee | null>(null)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null)
  const [viewingEmployeeId, setViewingEmployeeId] = useState<string | null>(null)

  const isManagerUser = useIsManager()
  const isAdmin = useIsAdmin()
  const { data: employees, isLoading, isError } = useEmployees()
  const list = employees ?? []

  const departments = [...new Set(list.map((m) => m.department).filter((d): d is string => !!d))].sort()

  const filtered = list.filter((m) => {
    const matchSearch =
      search === '' ||
      `${m.firstName} ${m.lastName} ${m.email}`.toLowerCase().includes(search.toLowerCase())
    const matchFilter =
      filter === 'Alle' ||
      (filter === 'HatAuftrag'  && m.hasActiveOrder)  ||
      (filter === 'KeinAuftrag' && !m.hasActiveOrder) ||
      m.department === filter
    return matchSearch && matchFilter
  })

  const total      = list.length
  const mitAuftrag = list.filter((m) => m.hasActiveOrder).length
  const verfuegbar = total - mitAuftrag

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Mitarbeiter</h1>
        {isAdmin && <CreateEmployeeDialog />}
      </div>

      {isLoading && <p className="text-muted-foreground text-sm py-10 text-center">Lade Mitarbeiter…</p>}
      {isError && <p className="text-destructive text-sm py-10 text-center">Mitarbeiter konnten nicht geladen werden.</p>}
      {!isLoading && !isError && (
      <>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-l-[4px] border-l-primary">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="flex items-center justify-center size-10 rounded-lg bg-primary/10 text-primary shrink-0">
              <Users className="size-5" />
            </div>
            <div>
              <p className="text-2xl font-bold leading-none">{total}</p>
              <p className="text-xs text-muted-foreground mt-1">Aktive Mitarbeiter</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-[4px] border-l-ring">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="flex items-center justify-center size-10 rounded-lg bg-ring/10 text-ring shrink-0">
              <ClipboardList className="size-5" />
            </div>
            <div>
              <p className="text-2xl font-bold leading-none">{mitAuftrag}</p>
              <p className="text-xs text-muted-foreground mt-1">Hat aktiven Auftrag</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-[4px] border-l-success">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="flex items-center justify-center size-10 rounded-lg bg-success/10 text-success shrink-0">
              <CheckCircle2 className="size-5" />
            </div>
            <div>
              <p className="text-2xl font-bold leading-none">{verfuegbar}</p>
              <p className="text-xs text-muted-foreground mt-1">Kein aktiver Auftrag</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col gap-3">
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Name oder E-Mail suchen…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(['Alle', 'HatAuftrag', 'KeinAuftrag', ...departments] as FilterKey[]).map((f) => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? 'default' : 'outline'}
              onClick={() => setFilter(f)}
            >
              {f === 'HatAuftrag' ? 'Im Einsatz' : f === 'KeinAuftrag' ? 'Verfügbar' : f}
            </Button>
          ))}
        </div>
      </div>

      {/* Card grid */}
      {filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm py-10 text-center">
          Keine Mitarbeiter gefunden
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((m, i) => {
            const theme = cardThemes[i % cardThemes.length]
            return (
              <Card key={m.id} className="flex flex-col overflow-hidden p-0 gap-0">
                {/* Gradient strip */}
                <div className={cn('h-12 bg-gradient-to-br shrink-0', theme.strip)} />

                <CardContent className="flex flex-col gap-3 px-4 pb-4 pt-0 -mt-6">
                  {/* Avatar overlapping strip */}
                  <div className="flex items-start justify-between">
                    <Avatar
                      size="lg"
                      className={cn('ring-2 ring-card shrink-0', theme.avatar)}
                    >
                      <AvatarFallback className={cn('text-base font-bold', theme.avatar)}>
                        {m.firstName[0]}{m.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="mt-7 flex items-center gap-2">
                      {isManagerUser && (
                        <button
                          type="button"
                          onClick={() => setViewingEmployeeId(m.id)}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                          aria-label="Mitarbeiter Details anzeigen"
                        >
                          <Eye className="size-3.5" />
                        </button>
                      )}
                      {isAdmin && (
                        <>
                          <button
                            type="button"
                            onClick={() => setEditingEmployee(m)}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                            aria-label="Mitarbeiter bearbeiten"
                          >
                            <Pencil className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingEmployee(m)}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                            aria-label="Mitarbeiter löschen"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Name + email */}
                  <div>
                    <p className="font-semibold leading-tight">{m.firstName} {m.lastName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{m.email}</p>
                  </div>

                  {/* Rolle + Abteilung */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={roleVariant[m.role]}>{roleLabel[m.role]}</Badge>
                    <span className="text-xs text-muted-foreground">{m.department}</span>
                  </div>

                  {/* Status */}
                  <div className="border-t pt-2.5 flex items-center justify-between gap-2">
                    {m.hasActiveOrder ? (
                      <p className="text-xs font-semibold text-ring uppercase tracking-wide">Im Einsatz</p>
                    ) : (
                      <p className="text-xs font-semibold text-success uppercase tracking-wide">Verfügbar</p>
                    )}
                    {isManagerUser && (
                      <Button size="xs" variant="outline" onClick={() => setAssigningEmployee(m)}>
                        <ClipboardList className="size-3" /> Zuweisen
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
      </>
      )}

      {assigningEmployee && (
        <AssignOrdersDialog employee={assigningEmployee} onClose={() => setAssigningEmployee(null)} />
      )}

      {editingEmployee && (
        <EditEmployeeDialog employee={editingEmployee} onClose={() => setEditingEmployee(null)} />
      )}

      {deletingEmployee && (
        <DeleteEmployeeDialog employee={deletingEmployee} onClose={() => setDeletingEmployee(null)} />
      )}

      {viewingEmployeeId && (
        <EmployeeDetailDialog employeeId={viewingEmployeeId} onClose={() => setViewingEmployeeId(null)} />
      )}
    </div>
  )
}
