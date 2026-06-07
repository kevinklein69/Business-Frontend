export type Role = 'Admin' | 'Manager' | 'Employee'

export interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  role: Role
  department?: string
}

export interface Employee extends User {
  hasActiveOrder: boolean
}

export interface TimeEntry {
  date: string
  clockIn: string
  clockOut: string
  durationMinutes: number
}

export interface Balance {
  weekMinutes: number
  weekTargetMinutes: number
  monthMinutes: number
  monthTargetMinutes: number
  totalBalanceMinutes: number
}

export interface ToggleClockResult {
  isClockedIn: boolean
  clockIn?: string
}

export type OrderStatus = 'Backlog' | 'InProgress' | 'ReadyForAcceptance' | 'Invoicing' | 'Done'

export interface Assignee {
  id: string
  name: string
}

export interface Order {
  id: string
  title: string
  description?: string
  customer?: string
  status: OrderStatus
  assignees: Assignee[]
  createdAt: string
}

export type VacationStatus = 'Open' | 'Approved' | 'Rejected'

export interface VacationRequest {
  id: string
  startDate: string
  endDate: string
  businessDays: number
  status: VacationStatus
  comment?: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResult {
  token: string
}
