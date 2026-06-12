import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { Balance, OrderClockStatus, OrderTimeBreakdownEntry, PendingTimeEntry, TimeEntry, TimeEntryStatus, ToggleClockResult } from '@/types'

export interface ManualEntryInput {
  date: string
  startTime: string
  endTime: string
  note: string
}

export function useTimeEntries(year: number, month: number) {
  return useQuery({
    queryKey: ['time-tracking', 'entries', year, month],
    queryFn: async () => {
      const res = await apiClient.get<TimeEntry[]>(`/api/time-tracking/entries?year=${year}&month=${month}`)
      return res.data
    },
  })
}

export function useClockStatus() {
  return useQuery({
    queryKey: ['time-tracking', 'status'],
    queryFn: async () => {
      const res = await apiClient.get<ToggleClockResult>('/api/time-tracking/status')
      return res.data
    },
  })
}

export function useTimeBalance() {
  return useQuery({
    queryKey: ['time-tracking', 'balance'],
    queryFn: async () => {
      const res = await apiClient.get<Balance>('/api/time-tracking/balance')
      return res.data
    },
  })
}

/** Für Chef/Manager: Zeiteinträge eines bestimmten Mitarbeiters in einem Monat. */
export function useEmployeeTimeEntries(employeeId: string, year: number, month: number) {
  return useQuery({
    queryKey: ['time-tracking', 'entries', employeeId, year, month],
    queryFn: async () => {
      const res = await apiClient.get<TimeEntry[]>(`/api/time-tracking/entries/${employeeId}?year=${year}&month=${month}`)
      return res.data
    },
  })
}

/** Für Chef/Manager: Zeitkonto-Saldo eines bestimmten Mitarbeiters. */
export function useEmployeeTimeBalance(employeeId: string) {
  return useQuery({
    queryKey: ['time-tracking', 'balance', employeeId],
    queryFn: async () => {
      const res = await apiClient.get<Balance>(`/api/time-tracking/balance/${employeeId}`)
      return res.data
    },
  })
}

export function useToggleClock() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const res = await apiClient.post<ToggleClockResult>('/api/time-tracking/clock')
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-tracking'] })
    },
  })
}

export function useCreateManualEntry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: ManualEntryInput) => {
      const res = await apiClient.post<TimeEntry>('/api/time-tracking/manual', input)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-tracking'] })
    },
  })
}

export function useEditEntry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...input }: ManualEntryInput & { id: string }) => {
      const res = await apiClient.put<TimeEntry>(`/api/time-tracking/edit/${id}`, input)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-tracking'] })
    },
  })
}

/** Für Chef/Manager: alle Zeiteinträge, die auf Freigabe warten. */
export function usePendingEntries() {
  return useQuery({
    queryKey: ['time-tracking', 'pending'],
    queryFn: async () => {
      const res = await apiClient.get<PendingTimeEntry[]>('/api/time-tracking/pending')
      return res.data
    },
  })
}

/** Stempel-Status des aktuellen Benutzers für einen bestimmten Auftrag (Auftrags-Stempel). */
export function useOrderClockStatus(orderId: string) {
  return useQuery({
    queryKey: ['time-tracking', 'order-status', orderId],
    queryFn: async () => {
      const res = await apiClient.get<OrderClockStatus>(`/api/orders/${orderId}/clock-status`)
      return res.data
    },
    enabled: !!orderId,
  })
}

/** Pro-Mitarbeiter-Aufstellung der für diesen Auftrag geleisteten Netto-Minuten. */
export function useOrderTimeBreakdown(orderId: string) {
  return useQuery({
    queryKey: ['time-tracking', 'order-breakdown', orderId],
    queryFn: async () => {
      const res = await apiClient.get<OrderTimeBreakdownEntry[]>(`/api/orders/${orderId}/time-breakdown`)
      return res.data
    },
    enabled: !!orderId,
  })
}

/** Ein-/Ausstempeln für einen bestimmten Auftrag. Aktualisiert auch Order.actualHours. */
export function useToggleOrderClock(orderId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const res = await apiClient.post<OrderClockStatus>(`/api/orders/${orderId}/clock`)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-tracking'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}

export function useUpdateEntryStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TimeEntryStatus }) => {
      const res = await apiClient.patch<TimeEntry>(`/api/time-tracking/${id}/status`, { status })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-tracking'] })
    },
  })
}
