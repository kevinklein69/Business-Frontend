import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { GermanState } from '@/lib/holidays'

export interface CompanySettings {
  state: GermanState
}

/** Bundesland der Firma — bestimmt, welche Feiertage bei Urlaubsanträgen berücksichtigt werden. */
export function useCompanySettings() {
  return useQuery({
    queryKey: ['company-settings'],
    queryFn: async () => {
      const res = await apiClient.get<CompanySettings>('/api/company-settings')
      return res.data
    },
  })
}

/** Admin-only: ändert das Bundesland der Firma. */
export function useUpdateCompanySettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (state: GermanState) => {
      const res = await apiClient.put<CompanySettings>('/api/company-settings', { state })
      return res.data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['company-settings'] }),
  })
}
