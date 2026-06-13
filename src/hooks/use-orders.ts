import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { Order, OrderAttachment, OrderPositionInput, OrderStatus } from '@/types'

export interface UpsertOrderInput {
  title: string
  description?: string
  customer?: string
  street: string
  houseNumber: string
  zip: string
  city: string
  assigneeIds: string[]
  revenue?: number | null
  invoiceDate?: string | null
  estimatedHours?: number | null
  plannedStartDate?: string | null
  plannedEndDate?: string | null
  deviationReason?: string | null
  positions: OrderPositionInput[]
  planningPeriodId?: string | null
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

export function useUploadOrderAttachments() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ orderId, files }: { orderId: string; files: File[] }) => {
      const formData = new FormData()
      files.forEach((file) => formData.append('files', file, file.name))
      const res = await apiClient.post<OrderAttachment[]>(`/api/orders/${orderId}/attachments`, formData)
      return res.data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] }),
  })
}

export function useDeleteOrderAttachment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ orderId, attachmentId }: { orderId: string; attachmentId: string }) => {
      await apiClient.delete(`/api/orders/${orderId}/attachments/${attachmentId}`)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] }),
  })
}

export async function downloadOrderAttachment(orderId: string, attachmentId: string, fileName: string) {
  const res = await apiClient.get<Blob>(`/api/orders/${orderId}/attachments/${attachmentId}`, {
    responseType: 'blob',
  })
  const url = URL.createObjectURL(res.data)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
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

export function useSignOrderAcceptance() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, signerName, signatureImageBase64 }: { id: string; signerName: string; signatureImageBase64: string }) => {
      const res = await apiClient.post<Order>(`/api/orders/${id}/acceptance`, { signerName, signatureImageBase64 })
      return res.data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] }),
  })
}

export function useUpdateOrderPlanningPeriod() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, planningPeriodId }: { id: string; planningPeriodId: string | null }) => {
      const res = await apiClient.patch<Order>(`/api/orders/${id}/planning-period`, { planningPeriodId })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['planning-periods'] })
    },
  })
}
