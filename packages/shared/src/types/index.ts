// ══════════════════════════════════════════════════════════════════════════════
// TaskFlow Shared Types
// ══════════════════════════════════════════════════════════════════════════════

// ── Enums ───────────────────────────────────────────────

export type Role = 'OWNER' | 'ADMIN' | 'MEMBER'
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

// ── User Types ──────────────────────────────────────────

export interface User {
  id: string
  name: string
  email: string
  avatar?: string | null
  createdAt?: Date
  updatedAt?: Date
}

export interface UserWithPassword extends User {
  password: string
  failedLoginAttempts: number
  lockoutUntil: Date | null
}

// ── Auth Types ──────────────────────────────────────────

export interface AuthResponse {
  accessToken: string
  user: User
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
}

export interface RefreshResponse {
  accessToken: string
  user: User
}

// ── JWT Types ───────────────────────────────────────────

export interface TokenPayload {
  userId: string
  email: string
  iss?: string
  aud?: string
  jti?: string
}

// ── Project Types ───────────────────────────────────────

export interface ProjectModules {
  flow_control?: boolean
  subtasks?: boolean
  time_tracking?: boolean
  dependencies?: boolean
  recurring?: boolean
  custom_fields?: boolean
  automations?: boolean
  webhooks?: boolean
  ai_features?: boolean
}

export interface Project {
  id: string
  name: string
  description?: string | null
  color: string
  modules: ProjectModules
  createdAt: Date
  updatedAt: Date
}

export interface ProjectWithRole extends Project {
  role: Role  // kullanıcının bu projedeki rolü
}

export interface ProjectWithDetails extends ProjectWithRole {
  memberCount: number
  taskCount: number
}

export interface CreateProjectRequest {
  name: string
  description?: string
  color?: string
}

export interface UpdateProjectRequest {
  name?: string
  description?: string | null
  color?: string
  modules?: Partial<ProjectModules>
}

// ── List Types ──────────────────────────────────────────

export interface List {
  id: string
  name: string
  position: number
  color?: string | null
  isArchive: boolean
  requiredRoleToEnter: Role[]
  requiredRoleToLeave: Role[]
  projectId: string
  createdAt: Date
  updatedAt: Date
}

export interface ListWithTaskCount extends List {
  taskCount: number
}

export interface ListWithTasks extends List {
  tasks: Task[]
}

export interface CreateListRequest {
  name: string
  color?: string
  position?: number
}

export interface UpdateListRequest {
  name?: string
  color?: string | null
  requiredRoleToEnter?: Role[]
  requiredRoleToLeave?: Role[]
}

export interface UpdateFlowControlRequest {
  requiredRoleToEnter: Role[]
  requiredRoleToLeave: Role[]
}

export interface ReorderListsRequest {
  listIds: string[]
}

// ── Task Types ──────────────────────────────────────────

export interface Task {
  id: string
  title: string
  description?: string | null
  priority: Priority
  position: number
  dueDate?: Date | null
  metadata: Record<string, unknown>
  archivedAt?: Date | null
  listId: string
  projectId: string
  assigneeId?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface TaskWithDetails extends Task {
  assignee?: User | null
  labels: Label[]
  list?: { id: string; name: string } | null
}

export interface CreateTaskRequest {
  title: string
  description?: string
  priority?: Priority
  dueDate?: string  // ISO string
  assigneeId?: string
  labelIds?: string[]
}

export interface UpdateTaskRequest {
  title?: string
  description?: string | null
  priority?: Priority
  dueDate?: string | null  // ISO string or null to clear
  assigneeId?: string | null
  labelIds?: string[]
  metadata?: Record<string, unknown>
}

export interface MoveTaskRequest {
  listId: string
  position?: number  // omit to append at end
}

export interface ReorderTasksRequest {
  taskIds: string[]
}

// ── Label Types ─────────────────────────────────────────

export interface Label {
  id: string
  name: string
  color: string
  projectId: string
}

export interface CreateLabelRequest {
  name: string
  color: string
}

export interface UpdateLabelRequest {
  name?: string
  color?: string
}

// ── Project Member Types ────────────────────────────────

export interface ProjectMember {
  id: string
  role: Role
  joinedAt: Date
  user: User
}

export interface AddMemberRequest {
  email: string
  role?: Role
}

export interface UpdateMemberRequest {
  role: Role
}

// ── Board Types (Frontend için) ─────────────────────────

export interface BoardData {
  project: ProjectWithRole
  lists: ListWithTasks[]
  members: ProjectMember[]
  labels: Label[]
}

// ── API Error Types ─────────────────────────────────────

export interface ApiErrorResponse {
  message: string
  code?: string
  statusCode: number
  errors?: ValidationError[]
}

export interface ValidationError {
  field: string
  message: string
}

// ── Health Check Types ──────────────────────────────────

export interface HealthCheckResponse {
  status: 'ok' | 'degraded' | 'error'
  timestamp: string
  database?: {
    status: 'ok' | 'error'
    latencyMs?: number
  }
  version?: string
}

// ── Pagination Types ────────────────────────────────────

export interface PaginationParams {
  page?: number
  limit?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
