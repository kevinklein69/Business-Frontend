import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { Balance, PendingTimeEntry, TimeEntry, TimeEntryStatus, ToggleClockResult } from '@/types'

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
