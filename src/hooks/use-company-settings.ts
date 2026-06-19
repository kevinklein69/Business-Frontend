import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { GermanState } from '@/lib/holidays'

export interface CompanySettings {
  state: GermanState
  street: string
  houseNumber: string
  zip: string
  city: string
}

export function useCompanySettings() {
  return useQuery({
    queryKey: ['company-settings'],
    queryFn: async () => {
      const res = await apiClient.get<CompanySettings>('/api/company-settings')
      return res.data
    },
  })
}

/** Admin-only: ändert Adresse und Bundesland der Firma. */
export function useUpdateCompanySettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CompanySettings) => {
      const res = await apiClient.put<CompanySettings>('/api/company-settings', input)
      return res.data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['company-settings'] }),
  })
}
