import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { VacationRequest, VacationStatus } from '@/types'

export interface CreateVacationRequestInput {
  startDate: string
  endDate: string
  comment?: string
}

export function useVacationRequests() {
  return useQuery({
    queryKey: ['vacation-requests'],
    queryFn: async () => {
      const res = await apiClient.get<VacationRequest[]>('/api/vacation-requests')
      return res.data
    },
  })
}

export function useCreateVacationRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateVacationRequestInput) => {
      const res = await apiClient.post<VacationRequest>('/api/vacation-requests', input)
      return res.data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vacation-requests'] }),
  })
}

export function useUpdateVacationRequestStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: VacationStatus }) => {
      const res = await apiClient.patch<VacationRequest>(`/api/vacation-requests/${id}/status`, { status })
      return res.data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vacation-requests'] }),
  })
}
