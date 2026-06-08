'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { useIsLoggedIn } from '@/lib/auth'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const loggedIn = useIsLoggedIn()

  useEffect(() => {
    if (!loggedIn) router.replace('/login')
  }, [loggedIn, router])

  // Don't render protected content until the token check has passed (matches the
  // SSR-safe `false` snapshot) — avoids a flash of the dashboard/sidebar pre-redirect.
  if (!loggedIn) return null

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
