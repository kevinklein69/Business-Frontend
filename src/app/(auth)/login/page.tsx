'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ClipboardList, Clock, CalendarDays } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { setToken } from '@/lib/auth'
import { apiClient } from '@/lib/api-client'
import { Logo, LogoMark } from '@/components/brand/logo'

const loginSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  password: z.string().min(6, 'Passwort muss mindestens 6 Zeichen lang sein'),
})

type LoginForm = z.infer<typeof loginSchema>

const FEATURES = [
  { icon: Clock,        text: 'Zeiterfassung & Stempeluhr' },
  { icon: ClipboardList, text: 'Aufträge per Kanban verwalten' },
  { icon: CalendarDays, text: 'Urlaubsplanung & Genehmigungen' },
]

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setError(null)
    try {
      const res = await apiClient.post<{ token: string }>('/api/auth/login', data)
      setToken(res.data.token)
      router.push('/dashboard')
    } catch {
      setError('Anmeldung fehlgeschlagen. Bitte E-Mail und Passwort prüfen.')
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">

      {/* Left — brand panel */}
      <div className="hidden lg:flex flex-col justify-between bg-[#1b263b] text-white p-12">
        <div className="flex items-center gap-3.5">
          <LogoMark onDark className="size-12 shrink-0 drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight leading-none">Betrieb-App</h1>
            <p className="text-[#778da9] text-sm mt-1.5">Betriebsverwaltung leicht gemacht</p>
          </div>
        </div>
        <div className="flex flex-col gap-6">
          {FEATURES.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#415a77]/40">
                <Icon className="size-5 text-[#e0e1dd]" />
              </div>
              <p className="text-[#e0e1dd] font-medium">{text}</p>
            </div>
          ))}
        </div>
        <p className="text-[#778da9] text-xs">© {new Date().getFullYear()} Betrieb-App</p>
      </div>

      {/* Right — form */}
      <div className="flex items-center justify-center bg-background p-8">
        <div className="w-full max-w-sm flex flex-col gap-8">

          {/* Mobile header */}
          <div className="lg:hidden flex justify-center">
            <Logo markClassName="size-9" textClassName="text-2xl font-bold" />
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-semibold">Willkommen zurück</h2>
            <p className="text-muted-foreground text-sm">Melde dich mit deinem Konto an</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@firma.de"
                {...register('email')}
                aria-invalid={!!errors.email}
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Passwort</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register('password')}
                aria-invalid={!!errors.password}
              />
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
            )}

            <Button type="submit" disabled={isSubmitting} className="w-full mt-2">
              {isSubmitting ? 'Anmelden…' : 'Anmelden'}
            </Button>

            {process.env.NODE_ENV !== 'production' && (
              <>
                <div className="relative flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex-1 border-t" />
                  <span>Entwicklung</span>
                  <span className="flex-1 border-t" />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => { setToken('dev-mock-token'); router.push('/dashboard') }}
                >
                  Demo-Login (kein Backend nötig)
                </Button>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
