'use client'

import { useState } from 'react'
import { isAxiosError } from 'axios'
import { User, Shield, Building2, ChevronRight, ChevronLeft, KeyRound, Search } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useIsAdmin } from '@/lib/auth'
import { useCompanySettings, useUpdateCompanySettings, type CompanySettings } from '@/hooks/use-company-settings'
import { useEmployees, useMyProfile, useUpdateEmployeeRole } from '@/hooks/use-employees'
import type { Role } from '@/types'
import { useChangePassword } from '@/hooks/use-auth'
import { GERMAN_STATES, GERMAN_STATE_LABELS } from '@/lib/holidays'

const ROLE_LABELS = { Admin: 'Admin', Manager: 'Manager', Employee: 'Mitarbeiter' } as const

const ALL_SECTIONS = [
  { key: 'profil',          label: 'Profil',            icon: User,     desc: 'Deine Daten, Passwort' },
  { key: 'unternehmen',     label: 'Unternehmen',       icon: Building2, desc: 'Standort, Feiertage' },
  { key: 'rollen',          label: 'Rollen & Zugriff',  icon: Shield,   desc: 'Berechtigungen verwalten' },
]

function extractErrorMessage(err: unknown): string {
  if (isAxiosError(err) && err.response?.data) {
    const data = err.response.data as { errors?: Record<string, string[]>; detail?: string }
    if (data.errors) return Object.values(data.errors).flat()[0]
    if (data.detail) return data.detail
  }
  return 'Bitte versuche es erneut.'
}

export default function SettingsPage() {
  const isAdmin = useIsAdmin()
  const sections = ALL_SECTIONS.filter((s) => s.key !== 'rollen' || isAdmin)

  const [active, setActive] = useState('profil')

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Einstellungen</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">

        {/* Sidebar nav */}
        <div className="flex flex-col gap-1">
          {sections.map((s) => (
            <button
              key={s.key}
              onClick={() => setActive(s.key)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
                active === s.key
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground hover:bg-muted'
              )}
            >
              <s.icon className="size-4 shrink-0" />
              <div className="flex flex-col">
                <span className="text-sm font-medium">{s.label}</span>
                <span className={cn('text-xs', active === s.key ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                  {s.desc}
                </span>
              </div>
              <ChevronRight className={cn('ml-auto size-4 shrink-0', active === s.key ? 'opacity-100' : 'opacity-0')} />
            </button>
          ))}
        </div>

        {/* Content */}
        <div>
          {active === 'profil' && (
            <div className="flex flex-col gap-6">
              <ProfilSection />
              <PasswortSection />
            </div>
          )}

          {active === 'unternehmen' && <UnternehmenSection />}

          {active === 'rollen' && isAdmin && (
            <div className="flex flex-col gap-6">
              <MitarbeiterRollenSection />

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Shield className="size-4" />
                    Rollen & Zugriff
                  </CardTitle>
                  <CardDescription>Berechtigungen für Mitarbeiterrollen</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-0 divide-y">
                  {[
                    { rolle: 'Admin',       rechte: ['Alles', 'Nutzerverwaltung', 'Einstellungen'] },
                    { rolle: 'Manager',     rechte: ['Aufträge', 'Urlaub genehmigen', 'Mitarbeiter sehen'] },
                    { rolle: 'Mitarbeiter', rechte: ['Eigene Zeiterfassung', 'Eigene Aufträge', 'Urlaubsantrag'] },
                  ].map(({ rolle, rechte }) => (
                    <div key={rolle} className="flex items-start justify-between py-4">
                      <div className="flex flex-col gap-1.5">
                        <Badge variant={rolle === 'Admin' ? 'default' : rolle === 'Manager' ? 'secondary' : 'outline'}>
                          {rolle}
                        </Badge>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {rechte.map((r) => (
                            <span key={r} className="text-xs text-muted-foreground bg-muted rounded px-2 py-0.5">{r}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const ROLES: Role[] = ['Employee', 'Manager', 'Admin']
const EMPLOYEES_PAGE_SIZE = 10

function MitarbeiterRollenSection() {
  const { data: employees, isLoading } = useEmployees()
  const updateRole = useUpdateEmployeeRole()

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)

  const filtered = (employees ?? []).filter((e) =>
    `${e.firstName} ${e.lastName} ${e.email}`.toLowerCase().includes(search.toLowerCase())
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / EMPLOYEES_PAGE_SIZE))
  const currentPage = Math.min(page, totalPages - 1)
  const paged = filtered.slice(currentPage * EMPLOYEES_PAGE_SIZE, (currentPage + 1) * EMPLOYEES_PAGE_SIZE)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Shield className="size-4" />
          Mitarbeiter-Rollen
        </CardTitle>
        <CardDescription>Wer hat welche Rolle — hier direkt ändern.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Name oder E-Mail suchen…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(0)
            }}
            className="pl-8"
          />
        </div>

        <div className="flex flex-col gap-0 divide-y">
          {isLoading && <p className="text-sm text-muted-foreground py-4">Lädt…</p>}
          {!isLoading && filtered.length === 0 && (
            <p className="text-sm text-muted-foreground py-4">Keine Mitarbeiter gefunden.</p>
          )}
          {paged.map((e) => (
            <div key={e.id} className="flex items-center justify-between gap-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar className="bg-primary text-primary-foreground shrink-0">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                    {e.firstName[0]}{e.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{e.firstName} {e.lastName}</p>
                  <p className="text-xs text-muted-foreground truncate">{e.email}</p>
                </div>
              </div>
              <Select
                value={e.role}
                onValueChange={(v) => v && updateRole.mutate({ id: e.id, role: v as Role })}
                disabled={updateRole.isPending}
              >
                <SelectTrigger className="w-36 shrink-0">
                  <SelectValue placeholder="Rolle wählen…" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>

        {filtered.length > EMPLOYEES_PAGE_SIZE && (
          <div className="flex items-center justify-between pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              Seite {currentPage + 1} von {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={currentPage === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={currentPage >= totalPages - 1}
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ProfilSection() {
  const { data: profile, isLoading } = useMyProfile()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <User className="size-4" />
          Profil
        </CardTitle>
        <CardDescription>
          Deine persönlichen Informationen — Änderungen bitte bei deinem Chef anfragen.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {isLoading || !profile ? (
          <p className="text-sm text-muted-foreground">Lädt…</p>
        ) : (
          <>
            <div className="flex items-center gap-4">
              <Avatar size="lg" className="bg-primary text-primary-foreground">
                <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
                  {profile.firstName[0]}{profile.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{profile.firstName} {profile.lastName}</p>
                <p className="text-sm text-muted-foreground">{profile.email}</p>
                <Badge variant="default" className="mt-1">{ROLE_LABELS[profile.role]}</Badge>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <Label className="text-muted-foreground">Adresse</Label>
                <p className="text-sm">
                  {profile.street
                    ? <>{profile.street} {profile.houseNumber}<br />{profile.zip} {profile.city}</>
                    : '—'}
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-muted-foreground">Telefon</Label>
                <p className="text-sm">{profile.phone || '—'}</p>
              </div>
              {profile.department && (
                <div className="flex flex-col gap-1">
                  <Label className="text-muted-foreground">Abteilung</Label>
                  <p className="text-sm">{profile.department}</p>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function PasswortSection() {
  const changePassword = useChangePassword()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')

  const reset = () => {
    setCurrentPassword('')
    setNewPassword('')
    setRepeatPassword('')
  }

  const handleSubmit = () => {
    if (newPassword.length < 8) {
      toast.error('Passwort konnte nicht geändert werden', { description: 'Das neue Passwort muss mindestens 8 Zeichen lang sein.' })
      return
    }
    if (newPassword !== repeatPassword) {
      toast.error('Passwort konnte nicht geändert werden', { description: 'Die neuen Passwörter stimmen nicht überein.' })
      return
    }

    changePassword.mutate({ currentPassword, newPassword }, {
      onSuccess: () => {
        toast.success('Passwort geändert')
        reset()
      },
      onError: (err) => {
        toast.error('Passwort konnte nicht geändert werden', { description: extractErrorMessage(err) })
      },
    })
  }

  const canSubmit = currentPassword.length > 0 && newPassword.length > 0 && repeatPassword.length > 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <KeyRound className="size-4" />
          Passwort ändern
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 sm:max-w-xs">
        <div className="flex flex-col gap-1.5">
          <Label>Aktuelles Passwort</Label>
          <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Neues Passwort</Label>
          <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Neues Passwort wiederholen</Label>
          <Input type="password" value={repeatPassword} onChange={(e) => setRepeatPassword(e.target.value)} />
        </div>
        <Button
          className="self-start"
          disabled={!canSubmit || changePassword.isPending}
          onClick={handleSubmit}
        >
          Passwort ändern
        </Button>
      </CardContent>
    </Card>
  )
}

function UnternehmenSection() {
  const isAdmin = useIsAdmin()
  const { data: settings, isLoading } = useCompanySettings()
  const updateSettings = useUpdateCompanySettings()

  const [draft, setDraft] = useState<CompanySettings | null>(null)
  const current = draft ?? settings

  const setField = (field: keyof CompanySettings, value: string) => {
    if (!settings) return
    setDraft({ ...(draft ?? settings), [field]: value })
  }

  const hasChanges = draft !== null && settings !== undefined && (
    draft.state !== settings.state
    || draft.street !== settings.street
    || draft.houseNumber !== settings.houseNumber
    || draft.zip !== settings.zip
    || draft.city !== settings.city
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Building2 className="size-4" />
          Unternehmen
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {isLoading || !current ? (
          <p className="text-sm text-muted-foreground">Lädt…</p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:max-w-lg">
              <div className="sm:col-span-2 flex flex-col gap-1.5">
                <Label htmlFor="company-street">Straße</Label>
                <Input
                  id="company-street"
                  value={current.street}
                  onChange={(e) => setField('street', e.target.value)}
                  disabled={!isAdmin}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="company-house-number">Hausnummer</Label>
                <Input
                  id="company-house-number"
                  value={current.houseNumber}
                  onChange={(e) => setField('houseNumber', e.target.value)}
                  disabled={!isAdmin}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:max-w-lg">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="company-zip">PLZ</Label>
                <Input
                  id="company-zip"
                  value={current.zip}
                  onChange={(e) => setField('zip', e.target.value)}
                  disabled={!isAdmin}
                />
              </div>
              <div className="sm:col-span-2 flex flex-col gap-1.5">
                <Label htmlFor="company-city">Ort</Label>
                <Input
                  id="company-city"
                  value={current.city}
                  onChange={(e) => setField('city', e.target.value)}
                  disabled={!isAdmin}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5 sm:max-w-xs">
              <Label>Bundesland</Label>
              <Select
                value={current.state}
                onValueChange={(v) => v && setField('state', v)}
                disabled={!isAdmin}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Bundesland wählen…" />
                </SelectTrigger>
                <SelectContent>
                  {GERMAN_STATES.map((s) => (
                    <SelectItem key={s} value={s}>{GERMAN_STATE_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isAdmin && (
              <Button
                className="self-start"
                disabled={!hasChanges || updateSettings.isPending}
                onClick={() => {
                  if (draft) updateSettings.mutate(draft, { onSuccess: () => setDraft(null) })
                }}
              >
                Änderungen speichern
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
