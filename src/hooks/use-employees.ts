import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { Employee, EmployeeDetail, Role } from '@/types'

export function useEmployees() {
  return useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const res = await apiClient.get<Employee[]>('/api/employees')
      return res.data
    },
  })
}

export function useMyProfile() {
  return useQuery({
    queryKey: ['employees', 'me'],
    queryFn: async () => {
      const res = await apiClient.get<EmployeeDetail>('/api/employees/me')
      return res.data
    },
  })
}

export function useEmployee(id: string | undefined) {
  return useQuery({
    queryKey: ['employees', id],
    queryFn: async () => {
      const res = await apiClient.get<EmployeeDetail>(`/api/employees/${id}`)
      return res.data
    },
    enabled: !!id,
  })
}

export interface CreateEmployeeInput {
  firstName: string
  lastName: string
  email: string
  password: string
  role: Role
  department?: string
  street: string
  houseNumber: string
  zip: string
  city: string
  phone?: string
  entryDate: string
  probationMonths?: number
  probationEndDate?: string
  vacationDaysEntitlement: number
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
  street: string
  houseNumber: string
  zip: string
  city: string
  phone?: string
  entryDate: string
  probationMonths?: number
  probationEndDate?: string
  vacationDaysEntitlement: number
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

export function useUpdateEmployeeRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, role }: { id: string; role: Role }) => {
      const res = await apiClient.patch<Employee>(`/api/employees/${id}/role`, { role })
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
