'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { isLoggedIn } from '@/lib/auth'

// Client-side entry redirect. A server-side `redirect()` here is not compatible with
// `output: 'export'` (static / Capacitor build), so route on the client instead:
// logged-in users land on the dashboard, everyone else on login.
export default function RootPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace(isLoggedIn() ? '/dashboard' : '/login')
  }, [router])

  return null
}
