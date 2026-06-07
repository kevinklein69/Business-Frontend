import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { AbsenceRequest, AbsenceStatus, AbsenceType } from '@/types'

export interface CreateAbsenceRequestInput {
  startDate: string
  endDate: string
  comment?: string
}

export interface RecordAbsenceInput {
  userId: string
  type: AbsenceType
  startDate: string
  endDate: string
  comment?: string
}

const invalidateAbsences = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: ['absence-requests'] })
  queryClient.invalidateQueries({ queryKey: ['time-tracking'] })
}

/** Eigene Fehlzeiten-Anträge (Urlaub, Krankheit, Kind krank, …) des angemeldeten Nutzers. */
export function useAbsenceRequests() {
  return useQuery({
    queryKey: ['absence-requests', 'mine'],
    queryFn: async () => {
      const res = await apiClient.get<AbsenceRequest[]>('/api/absence-requests')
      return res.data
    },
  })
}

/** Stellt einen Urlaubsantrag im eigenen Namen (Self-Service). */
export function useCreateAbsenceRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateAbsenceRequestInput) => {
      const res = await apiClient.post<AbsenceRequest>('/api/absence-requests', input)
      return res.data
    },
    onSuccess: () => invalidateAbsences(queryClient),
  })
}

export function useUpdateAbsenceRequestStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: AbsenceStatus }) => {
      const res = await apiClient.patch<AbsenceRequest>(`/api/absence-requests/${id}/status`, { status })
      return res.data
    },
    onSuccess: () => invalidateAbsences(queryClient),
  })
}

/** Für Chef/Manager: Fehlzeiten aller Mitarbeiter (z.B. zur Übersicht & Genehmigung). */
export function useTeamAbsences() {
  return useQuery({
    queryKey: ['absence-requests', 'team'],
    queryFn: async () => {
      const res = await apiClient.get<AbsenceRequest[]>('/api/absence-requests/team')
      return res.data
    },
  })
}

/** Für Chef/Manager: trägt eine Abwesenheit (z.B. Krankheit, Kind krank) für einen Mitarbeiter ein.
 *  Der Eintrag gilt als bereits genehmigt, da hier ein Sachverhalt dokumentiert statt beantragt wird. */
export function useRecordAbsence() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: RecordAbsenceInput) => {
      const res = await apiClient.post<AbsenceRequest>('/api/absence-requests/record', input)
      return res.data
    },
    onSuccess: () => {
      invalidateAbsences(queryClient)
      queryClient.invalidateQueries({ queryKey: ['absence-requests', 'team'] })
    },
  })
}
