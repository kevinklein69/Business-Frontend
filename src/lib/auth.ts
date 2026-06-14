import * as React from 'react'

export const getToken = () =>
  typeof window !== 'undefined' ? localStorage.getItem('token') : null

export const setToken = (token: string) =>
  localStorage.setItem('token', token)

export const removeToken = () =>
  localStorage.removeItem('token')

export const isLoggedIn = () => !!getToken()

const ROLE_CLAIM = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'
const NAMEID_CLAIM = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'

/** Decodes the JWT payload from localStorage (no signature check — purely for UI gating). */
const getClaims = (): Record<string, unknown> | null => {
  const token = getToken()
  if (!token) return null

  try {
    const payload = token.split('.')[1]
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(json) as Record<string, unknown>
  } catch {
    return null
  }
}

export const getRole = (): string | null => {
  const claims = getClaims()
  const role = claims?.[ROLE_CLAIM] ?? claims?.role
  return typeof role === 'string' ? role : null
}

/** The current user's id (matches Employee/Assignee ids returned by the API). */
export const getUserId = (): string | null => {
  const claims = getClaims()
  const id = claims?.[NAMEID_CLAIM] ?? claims?.sub
  return typeof id === 'string' ? id : null
}

export const isManager = () => {
  const role = getRole()
  return role === 'Admin' || role === 'Manager'
}

export const isAdmin = () => getRole() === 'Admin'

const noopSubscribe = () => () => {}

/** SSR-safe read of the current user's manager status from the JWT in localStorage.
 *  The role is fixed for the lifetime of a session (changes only via re-login/navigation),
 *  so we read it through useSyncExternalStore rather than effect+setState. */
export const useIsManager = () =>
  React.useSyncExternalStore(noopSubscribe, isManager, () => false)

export const useIsAdmin = () =>
  React.useSyncExternalStore(noopSubscribe, isAdmin, () => false)

export const useUserId = () =>
  React.useSyncExternalStore(noopSubscribe, getUserId, () => null)

/** SSR-safe read of the login state, mirroring useIsManager — see its comment for why. */
export const useIsLoggedIn = () =>
  React.useSyncExternalStore(noopSubscribe, isLoggedIn, () => false)
