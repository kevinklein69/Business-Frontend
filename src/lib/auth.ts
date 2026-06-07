import * as React from 'react'

export const getToken = () =>
  typeof window !== 'undefined' ? localStorage.getItem('token') : null

export const setToken = (token: string) =>
  localStorage.setItem('token', token)

export const removeToken = () =>
  localStorage.removeItem('token')

export const isLoggedIn = () => !!getToken()

const ROLE_CLAIM = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'

/** Decodes the role claim from the JWT payload (no signature check — purely for UI gating). */
export const getRole = (): string | null => {
  const token = getToken()
  if (!token) return null

  try {
    const payload = token.split('.')[1]
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    const claims = JSON.parse(json) as Record<string, unknown>
    const role = claims[ROLE_CLAIM] ?? claims.role
    return typeof role === 'string' ? role : null
  } catch {
    return null
  }
}

export const isManager = () => {
  const role = getRole()
  return role === 'Admin' || role === 'Manager'
}

const noopSubscribe = () => () => {}

/** SSR-safe read of the current user's manager status from the JWT in localStorage.
 *  The role is fixed for the lifetime of a session (changes only via re-login/navigation),
 *  so we read it through useSyncExternalStore rather than effect+setState. */
export const useIsManager = () =>
  React.useSyncExternalStore(noopSubscribe, isManager, () => false)
