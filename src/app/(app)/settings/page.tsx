'use client'

import { useState } from 'react'
import { User, Bell, Shield, Palette, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

const SECTIONS = [
  { key: 'profil',          label: 'Profil',            icon: User,    desc: 'Name, E-Mail, Avatar' },
  { key: 'benachrichtigungen', label: 'Benachrichtigungen', icon: Bell, desc: 'Push, E-Mail, In-App' },
  { key: 'rollen',          label: 'Rollen & Zugriff',  icon: Shield,  desc: 'Berechtigungen verwalten' },
  { key: 'darstellung',     label: 'Darstellung',       icon: Palette, desc: 'Farben, Schriftgröße' },
]

type NotifKey = 'stempel' | 'auftrag' | 'urlaub' | 'system'

const NOTIF_LABELS: Record<NotifKey, string> = {
  stempel: 'Stempelung vergessen',
  auftrag: 'Neuer Auftrag zugewiesen',
  urlaub:  'Urlaubsantrag genehmigt/abgelehnt',
  system:  'Systembenachrichtigungen',
}

export default function SettingsPage() {
  const [active, setActive]   = useState('profil')
  const [notifs, setNotifs]   = useState<Record<NotifKey, boolean>>({
    stempel: true, auftrag: true, urlaub: true, system: false,
  })
  const [vorname, setVorname] = useState('Max')
  const [nachname, setNachname] = useState('Müller')
  const [email]               = useState('max.mueller@firma.de')

  const toggleNotif = (key: NotifKey) =>
    setNotifs((prev) => ({ ...prev, [key]: !prev[key] }))

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Einstellungen</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">

        {/* Sidebar nav */}
        <div className="flex flex-col gap-1">
          {SECTIONS.map((s) => (
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <User className="size-4" />
                  Profil
                </CardTitle>
                <CardDescription>Deine persönlichen Informationen</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-6">
                <div className="flex items-center gap-4">
                  <Avatar size="lg" className="bg-primary text-primary-foreground">
                    <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
                      {vorname[0]}{nachname[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{vorname} {nachname}</p>
                    <p className="text-sm text-muted-foreground">{email}</p>
                    <Badge variant="default" className="mt-1">Admin</Badge>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label>Vorname</Label>
                    <Input value={vorname} onChange={(e) => setVorname(e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>Nachname</Label>
                    <Input value={nachname} onChange={(e) => setNachname(e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <Label>E-Mail</Label>
                    <Input value={email} disabled className="opacity-60" />
                  </div>
                </div>
                <Button className="self-start">Änderungen speichern</Button>
              </CardContent>
            </Card>
          )}

          {active === 'benachrichtigungen' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Bell className="size-4" />
                  Benachrichtigungen
                </CardTitle>
                <CardDescription>Steuere welche Meldungen du erhältst</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-0 divide-y">
                {(Object.keys(NOTIF_LABELS) as NotifKey[]).map((key) => (
                  <div key={key} className="flex items-center justify-between py-4">
                    <div>
                      <p className="font-medium text-sm">{NOTIF_LABELS[key]}</p>
                      <p className="text-sm text-muted-foreground">Push & In-App</p>
                    </div>
                    <button
                      onClick={() => toggleNotif(key)}
                      className={cn(
                        'relative h-6 w-11 rounded-full transition-colors',
                        notifs[key] ? 'bg-primary' : 'bg-muted'
                      )}
                    >
                      <span className={cn(
                        'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
                        notifs[key] ? 'left-[22px]' : 'left-0.5'
                      )} />
                    </button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {active === 'rollen' && (
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
          )}

          {active === 'darstellung' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Palette className="size-4" />
                  Darstellung
                </CardTitle>
                <CardDescription>Farbpalette und Schriftgröße der App</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium">Farbpalette</p>
                  <div className="flex gap-2">
                    {['#0d1b2a','#1b263b','#415a77','#778da9','#e0e1dd','#c04050'].map((c) => (
                      <div key={c} className="flex flex-col items-center gap-1">
                        <div className="h-8 w-8 rounded-lg ring-1 ring-border" style={{ background: c }} />
                        <span className="text-xs text-muted-foreground font-mono">{c}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium">Schriftgröße</p>
                  <p className="text-sm text-muted-foreground">20px Basis — alle Größen skalieren proportional.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
