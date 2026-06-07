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

export type AbsenceStatus = 'Open' | 'Approved' | 'Rejected'

export type AbsenceType = 'Vacation' | 'Sick' | 'ChildSick'

export interface AbsenceRequest {
  id: string
  userId: string
  userName: string
  type: AbsenceType
  startDate: string
  endDate: string
  businessDays: number
  status: AbsenceStatus
  comment?: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResult {
  token: string
}
