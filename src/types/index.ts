export type Role = 'Admin' | 'Manager' | 'Employee'

export interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  role: Role
  department?: string
}

export interface TimeEntry {
  id: string
  userId: string
  clockIn: string
  clockOut?: string
  durationMinutes?: number
}

export type OrderStatus = 'Backlog' | 'InProgress' | 'ReadyForAcceptance' | 'Invoicing' | 'Done'

export interface Order {
  id: string
  title: string
  description?: string
  customer?: string
  status: OrderStatus
  assignees: string[]
  createdAt: string
}

export type VacationStatus = 'Open' | 'Approved' | 'Rejected'

export interface VacationRequest {
  id: string
  userId: string
  startDate: string
  endDate: string
  status: VacationStatus
  comment?: string
}
