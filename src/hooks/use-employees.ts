import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { Employee, Role } from '@/types'

export function useEmployees() {
  return useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const res = await apiClient.get<Employee[]>('/api/employees')
      return res.data
    },
  })
}

export interface CreateEmployeeInput {
  firstName: string
  lastName: string
  email: string
  password: string
  role: Role
  department?: string
}

export function useCreateEmployee() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateEmployeeInput) => {
      const res = await apiClient.post<Employee>('/api/employees', input)
      return res.data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employees'] }),
  })
}

export interface UpdateEmployeeInput {
  id: string
  firstName: string
  lastName: string
  email: string
  role: Role
  department?: string
  password?: string
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateEmployeeInput) => {
      const res = await apiClient.put<Employee>(`/api/employees/${id}`, input)
      return res.data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employees'] }),
  })
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/api/employees/${id}`)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employees'] }),
  })
}
