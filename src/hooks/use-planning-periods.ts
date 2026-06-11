import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { Order, PlanningPeriod, PlanningPeriodStatus } from '@/types'

export interface CreatePlanningPeriodInput {
  name: string
  startDate: string
  endDate: string
}

export interface UpdatePlanningPeriodInput extends CreatePlanningPeriodInput {
  id: string
  status: PlanningPeriodStatus
}

export type ReassignTarget = 'Unassigned' | 'NextPeriod'

export interface ClosePlanningPeriodInput {
  id: string
  reassignTarget: ReassignTarget
  targetPeriodId?: string | null
}

export function usePlanningPeriods() {
  return useQuery({
    queryKey: ['planning-periods'],
    queryFn: async () => {
      const res = await apiClient.get<PlanningPeriod[]>('/api/planning-periods')
      return res.data
    },
  })
}

/** Lazily loads the orders of a single period — used when expanding a closed period. */
export function usePlanningPeriodOrders(periodId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['planning-periods', periodId, 'orders'],
    enabled,
    queryFn: async () => {
      const res = await apiClient.get<Order[]>(`/api/planning-periods/${periodId}/orders`)
      return res.data
    },
  })
}

export function useCreatePlanningPeriod() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreatePlanningPeriodInput) => {
      const res = await apiClient.post<PlanningPeriod>('/api/planning-periods', input)
      return res.data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['planning-periods'] }),
  })
}

export function useUpdatePlanningPeriod() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...input }: UpdatePlanningPeriodInput) => {
      const res = await apiClient.put<PlanningPeriod>(`/api/planning-periods/${id}`, input)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planning-periods'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}

export function useClosePlanningPeriod() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, reassignTarget, targetPeriodId }: ClosePlanningPeriodInput) => {
      const res = await apiClient.post<PlanningPeriod>(`/api/planning-periods/${id}/close`, {
        reassignTarget,
        targetPeriodId: targetPeriodId ?? null,
      })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planning-periods'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}

export function useDeletePlanningPeriod() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/api/planning-periods/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planning-periods'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}
