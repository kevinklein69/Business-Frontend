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
  street?: string
  houseNumber?: string
  zip?: string
  city?: string
  phone?: string
  entryDate?: string
  probationMonths?: number
  probationEndDate?: string
  vacationDaysEntitlement?: number
}

export interface EmployeeDetail extends Employee {
  remainingVacationDays: number
  sickDaysThisYear: number
}

export type TimeEntryStatus = 'Approved' | 'Pending' | 'Rejected'

export interface TimeEntry {
  id: string
  date: string
  clockIn: string
  clockOut: string
  grossDurationMinutes: number
  breakMinutes: number
  netDurationMinutes: number
  isManual: boolean
  status: TimeEntryStatus
  note?: string | null
  orderId?: string | null
  orderTitle?: string | null
}

export interface PendingTimeEntry {
  id: string
  userId: string
  userName: string
  date: string
  clockIn: string
  clockOut: string
  isManual: boolean
  status: TimeEntryStatus
  note?: string | null
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

export interface OrderClockStatus {
  isClockedIn: boolean
  clockIn?: string
}

export interface OrderTimeBreakdownEntry {
  userId: string
  userName: string
  netMinutes: number
}

export type OrderStatus = 'ToDo' | 'InProgress' | 'ReadyForAcceptance' | 'Invoicing' | 'Done'

export type PlanningPeriodStatus = 'Planned' | 'Active' | 'Closed'

export interface PlanningPeriod {
  id: string
  name: string
  startDate?: string | null
  endDate?: string | null
  status: PlanningPeriodStatus
  orderCount: number
}

export interface Assignee {
  id: string
  name: string
}

export interface OrderPosition {
  id: string
  description: string
  quantity: number
  unitPrice: number
  sortOrder: number
}

export interface OrderPositionInput {
  description: string
  quantity: number
  unitPrice: number
}

export interface OrderAttachment {
  id: string
  fileName: string
  contentType: string
  sizeBytes: number
  uploadedAt: string
}

export interface Order {
  id: string
  title: string
  description?: string
  customer?: string
  street: string
  houseNumber: string
  zip: string
  city: string
  status: OrderStatus
  planningPeriodId?: string | null
  assignees: Assignee[]
  createdAt: string
  revenue?: number | null
  invoiceDate?: string | null
  estimatedHours?: number | null
  plannedStartDate?: string | null
  plannedEndDate?: string | null
  actualHours?: number | null
  deviationReason?: string | null
  positions: OrderPosition[]
  attachments: OrderAttachment[]
}

export type AbsenceStatus = 'Open' | 'Approved' | 'Rejected'

export type AbsenceType = 'Vacation' | 'Sick' | 'ChildSick' | 'FlexTimeCompensation'

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
