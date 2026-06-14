'use client'

import { useState } from 'react'
import { Check, Search, User } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { Assignee, Employee } from '@/types'

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase()
}

export function AssigneePicker({
  employees,
  assignees,
  onChange,
  label = 'Mitarbeiter',
  required = false,
  error,
}: {
  employees: Employee[]
  assignees: Assignee[]
  onChange: (assignees: Assignee[]) => void
  label?: string
  required?: boolean
  error?: string | null
}) {
  const [search, setSearch] = useState('')

  const filteredEmployees = employees.filter((m) =>
    `${m.firstName} ${m.lastName}`.toLowerCase().includes(search.toLowerCase())
  )

  const toggleAssignee = (employee: Employee) =>
    onChange(
      assignees.some((a) => a.id === employee.id)
        ? assignees.filter((a) => a.id !== employee.id)
        : [...assignees, { id: employee.id, name: `${employee.firstName} ${employee.lastName}` }]
    )

  return (
    <div className="flex flex-col gap-2">
      <Label className="flex items-center gap-1.5">
        <User className="size-3.5" /> {label}{required && ' *'}
        {assignees.length > 0 && (
          <span className="ml-auto text-xs font-normal text-muted-foreground">
            {assignees.length} ausgewählt
          </span>
        )}
      </Label>
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Mitarbeiter suchen…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8"
        />
      </div>
      <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-0.5">
        {filteredEmployees.length === 0 ? (
          <p className="col-span-2 text-center text-sm text-muted-foreground py-4">
            Kein Mitarbeiter gefunden
          </p>
        ) : filteredEmployees.map((employee) => {
          const name = `${employee.firstName} ${employee.lastName}`
          const selected = assignees.some((a) => a.id === employee.id)
          return (
            <button
              key={employee.id}
              type="button"
              onClick={() => toggleAssignee(employee)}
              className={cn(
                'flex items-center gap-2 rounded-lg border px-2.5 py-2 text-sm transition-colors text-left',
                selected
                  ? 'border-primary bg-primary/10 text-primary font-medium'
                  : 'border-border text-foreground hover:bg-muted'
              )}
            >
              <div className={cn(
                'flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                selected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              )}>
                {selected ? <Check className="size-3" /> : initials(name).slice(0,2)}
              </div>
              <span className="truncate min-w-0">{name}</span>
            </button>
          )
        })}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
