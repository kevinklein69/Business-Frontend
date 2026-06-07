import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { Order, OrderStatus } from '@/types'

export interface UpsertOrderInput {
  title: string
  description?: string
  customer?: string
  assigneeIds: string[]
}

export function useOrders() {
  return useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const res = await apiClient.get<Order[]>('/api/orders')
      return res.data
    },
  })
}

export function useCreateOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: UpsertOrderInput) => {
      const res = await apiClient.post<Order>('/api/orders', input)
      return res.data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] }),
  })
}

export function useUpdateOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...input }: UpsertOrderInput & { id: string }) => {
      const res = await apiClient.put<Order>(`/api/orders/${id}`, input)
      return res.data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] }),
  })
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => {
      const res = await apiClient.patch<Order>(`/api/orders/${id}/status`, { status })
      return res.data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] }),
  })
}
