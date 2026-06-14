'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { isLoggedIn, useIsLoggedIn } from '@/lib/auth'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const loggedIn = useIsLoggedIn()

  // Read the token directly here (not via the SSR-safe hook): on the very first
  // client render useIsLoggedIn still reports the hydration-safe `false`, which
  // would redirect logged-in users away on every hard navigation/reload.
  useEffect(() => {
    if (!isLoggedIn()) router.replace('/login')
  }, [router])

  // Don't render protected content until the corrected value lands (matches the
  // SSR-safe `false` snapshot) — avoids a flash of the dashboard/sidebar pre-redirect.
  if (!loggedIn) return null

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 [scrollbar-gutter:stable]">{children}</main>
      </div>
    </div>
  )
}
