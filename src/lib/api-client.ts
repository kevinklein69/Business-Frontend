import axios from 'axios'
import { Capacitor } from '@capacitor/core'

function resolveBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5228'
  // The Android emulator can't reach the host machine via "localhost" — the host is
  // mapped to the special address 10.0.2.2. iOS simulator and web reach localhost directly.
  // (No effect once NEXT_PUBLIC_API_URL points at a real host/IP for device/production builds.)
  if (Capacitor.getPlatform() === 'android') {
    return configured.replace('localhost', '10.0.2.2').replace('127.0.0.1', '10.0.2.2')
  }
  return configured
}

export const apiClient = axios.create({
  baseURL: resolveBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  // Bei FormData muss der Browser den multipart-Content-Type samt Boundary setzen.
  if (config.data instanceof FormData) {
    config.headers.delete('Content-Type')
  }
  return config
})

apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)
