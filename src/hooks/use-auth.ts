import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

export interface ChangePasswordInput {
  currentPassword: string
  newPassword: string
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async (input: ChangePasswordInput) => {
      await apiClient.post('/api/auth/change-password', input)
    },
  })
}
