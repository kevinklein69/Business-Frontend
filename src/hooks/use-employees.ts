import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { Employee } from '@/types'

export function useEmployees() {
  return useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const res = await apiClient.get<Employee[]>('/api/employees')
      return res.data
    },
  })
}
