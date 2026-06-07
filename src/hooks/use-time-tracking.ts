import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { Balance, TimeEntry, ToggleClockResult } from '@/types'

export function useTimeEntries() {
  return useQuery({
    queryKey: ['time-tracking', 'entries'],
    queryFn: async () => {
      const res = await apiClient.get<TimeEntry[]>('/api/time-tracking/entries')
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
