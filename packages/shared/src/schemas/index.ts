import { z } from 'zod'

// ══════════════════════════════════════════════════════════════════════════════
// TaskFlow Validation Schemas
// ══════════════════════════════════════════════════════════════════════════════

// ── Enums ───────────────────────────────────────────────

export const roleSchema = z.enum(['OWNER', 'ADMIN', 'MEMBER'])
export const orgRoleSchema = z.enum(['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'])
export const teamRoleSchema = z.enum(['LEAD', 'MEMBER'])
export const prioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])

// ── Auth Schemas ────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email('Geçerli bir e-posta girin'),
  password: z.string().min(1, 'Şifre gerekli'),
})

export const registerSchema = z.object({
  name: z.string().min(2, 'Ad en az 2 karakter olmalı'),
  email: z.string().email('Geçerli bir e-posta girin'),
  password: z
    .string()
    .min(8, 'Şifre en az 8 karakter olmalı')
    .regex(/[A-Z]/, 'En az bir büyük harf gerekli')
    .regex(/[a-z]/, 'En az bir küçük harf gerekli')
    .regex(/[0-9]/, 'En az bir rakam gerekli')
    .regex(/[^A-Za-z0-9]/, 'En az bir özel karakter gerekli'),
})

// ── User Schemas ────────────────────────────────────────

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  avatar: z.string().nullable().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
})

// ── Project Schemas ─────────────────────────────────────

export const projectModulesSchema = z.object({
  flow_control: z.boolean().optional(),
  subtasks: z.boolean().optional(),
  time_tracking: z.boolean().optional(),
  dependencies: z.boolean().optional(),
  recurring: z.boolean().optional(),
  custom_fields: z.boolean().optional(),
  automations: z.boolean().optional(),
  webhooks: z.boolean().optional(),
  ai_features: z.boolean().optional(),
})

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Proje adı gerekli').max(100, 'Proje adı en fazla 100 karakter olabilir'),
  description: z.string().max(500, 'Açıklama en fazla 500 karakter olabilir').optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Geçersiz renk kodu').optional(),
})

export const updateProjectSchema = z.object({
  name: z.string().min(1, 'Proje adı gerekli').max(100, 'Proje adı en fazla 100 karakter olabilir').optional(),
  description: z.string().max(500, 'Açıklama en fazla 500 karakter olabilir').nullable().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Geçersiz renk kodu').optional(),
  modules: projectModulesSchema.partial().optional(),
})

// ── List Schemas ────────────────────────────────────────

export const createListSchema = z.object({
  name: z.string().min(1, 'Liste adı gerekli').max(50, 'Liste adı en fazla 50 karakter olabilir'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Geçersiz renk kodu').optional(),
  position: z.number().int().min(0).optional(),
})

export const updateListSchema = z.object({
  name: z.string().min(1, 'Liste adı gerekli').max(50, 'Liste adı en fazla 50 karakter olabilir').optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Geçersiz renk kodu').nullable().optional(),
  requiredRoleToEnter: z.array(roleSchema).optional(),
  requiredRoleToLeave: z.array(roleSchema).optional(),
})

export const updateFlowControlSchema = z.object({
  requiredRoleToEnter: z.array(roleSchema),
  requiredRoleToLeave: z.array(roleSchema),
})

export const reorderListsSchema = z.object({
  listIds: z.array(z.string()).min(1, 'En az bir liste ID\'si gerekli'),
})

// ── Task Schemas ────────────────────────────────────────

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Görev başlığı gerekli').max(200, 'Başlık en fazla 200 karakter olabilir'),
  description: z.string().max(5000, 'Açıklama en fazla 5000 karakter olabilir').optional(),
  priority: prioritySchema.optional(),
  dueDate: z.string().datetime({ message: 'Geçersiz tarih formatı' }).optional(),
  assigneeId: z.string().optional(),
  labelIds: z.array(z.string()).optional(),
})

export const updateTaskSchema = z.object({
  title: z.string().min(1, 'Görev başlığı gerekli').max(200, 'Başlık en fazla 200 karakter olabilir').optional(),
  description: z.string().max(5000, 'Açıklama en fazla 5000 karakter olabilir').nullable().optional(),
  priority: prioritySchema.optional(),
  dueDate: z.string().datetime({ message: 'Geçersiz tarih formatı' }).nullable().optional(),
  assigneeId: z.string().nullable().optional(),
  labelIds: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
})

export const moveTaskSchema = z.object({
  listId: z.string().min(1, 'Liste ID\'si gerekli'),
  position: z.number().int().min(0).optional(),
})

export const reorderTasksSchema = z.object({
  taskIds: z.array(z.string()).min(1, 'En az bir görev ID\'si gerekli'),
})

export const restoreTaskSchema = z.object({
  listId: z.string().min(1, 'Liste ID\'si gerekli').optional(),
})

// ── Label Schemas ───────────────────────────────────────

export const createLabelSchema = z.object({
  name: z.string().min(1, 'Etiket adı gerekli').max(30, 'Etiket adı en fazla 30 karakter olabilir'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Geçersiz renk kodu'),
})

export const updateLabelSchema = z.object({
  name: z.string().min(1, 'Etiket adı gerekli').max(30, 'Etiket adı en fazla 30 karakter olabilir').optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Geçersiz renk kodu').optional(),
})

// ── Member Schemas ──────────────────────────────────────

export const addMemberSchema = z.object({
  email: z.string().email('Geçerli bir e-posta girin'),
  role: roleSchema.optional().default('MEMBER'),
})

export const updateMemberSchema = z.object({
  role: roleSchema,
})

// ── Organization Schemas ────────────────────────────────

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export const createOrganizationSchema = z.object({
  name: z.string().min(2, 'Organizasyon adı en az 2 karakter olmalı').max(100, 'Organizasyon adı en fazla 100 karakter olabilir'),
  slug: z.string().regex(slugRegex, 'Slug sadece küçük harf, rakam ve tire içerebilir').min(2).max(50).optional(),
  logo: z.string().url('Geçerli bir URL girin').optional(),
})

export const updateOrganizationSchema = z.object({
  name: z.string().min(2, 'Organizasyon adı en az 2 karakter olmalı').max(100, 'Organizasyon adı en fazla 100 karakter olabilir').optional(),
  slug: z.string().regex(slugRegex, 'Slug sadece küçük harf, rakam ve tire içerebilir').min(2).max(50).optional(),
  logo: z.string().url('Geçerli bir URL girin').nullable().optional(),
})

export const addOrgMemberSchema = z.object({
  email: z.string().email('Geçerli bir e-posta girin'),
  role: orgRoleSchema.optional().default('MEMBER'),
})

export const updateOrgMemberSchema = z.object({
  role: orgRoleSchema,
})

// ── Team Schemas ────────────────────────────────────────

export const createTeamSchema = z.object({
  name: z.string().min(2, 'Takım adı en az 2 karakter olmalı').max(100, 'Takım adı en fazla 100 karakter olabilir'),
  description: z.string().max(500, 'Açıklama en fazla 500 karakter olabilir').optional(),
})

export const updateTeamSchema = z.object({
  name: z.string().min(2, 'Takım adı en az 2 karakter olmalı').max(100, 'Takım adı en fazla 100 karakter olabilir').optional(),
  description: z.string().max(500, 'Açıklama en fazla 500 karakter olabilir').nullable().optional(),
})

export const addTeamMemberSchema = z.object({
  userId: z.string().min(1, 'Kullanıcı ID gerekli'),
  role: teamRoleSchema.optional().default('MEMBER'),
})

export const updateTeamMemberSchema = z.object({
  role: teamRoleSchema,
})

// ── Response Schemas ────────────────────────────────────

export const authResponseSchema = z.object({
  accessToken: z.string(),
  user: userSchema,
})

export const apiErrorSchema = z.object({
  message: z.string(),
  code: z.string().optional(),
  statusCode: z.number(),
  errors: z
    .array(
      z.object({
        field: z.string(),
        message: z.string(),
      }),
    )
    .optional(),
})

// ── Type exports from schemas ───────────────────────────

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type UserDTO = z.infer<typeof userSchema>
export type AuthResponseDTO = z.infer<typeof authResponseSchema>
export type ApiErrorDTO = z.infer<typeof apiErrorSchema>

export type CreateProjectInput = z.infer<typeof createProjectSchema>
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>

export type CreateListInput = z.infer<typeof createListSchema>
export type UpdateListInput = z.infer<typeof updateListSchema>
export type UpdateFlowControlInput = z.infer<typeof updateFlowControlSchema>
export type ReorderListsInput = z.infer<typeof reorderListsSchema>

export type CreateTaskInput = z.infer<typeof createTaskSchema>
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>
export type MoveTaskInput = z.infer<typeof moveTaskSchema>
export type ReorderTasksInput = z.infer<typeof reorderTasksSchema>
export type RestoreTaskInput = z.infer<typeof restoreTaskSchema>

export type CreateLabelInput = z.infer<typeof createLabelSchema>
export type UpdateLabelInput = z.infer<typeof updateLabelSchema>

export type AddMemberInput = z.infer<typeof addMemberSchema>
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>
export type AddOrgMemberInput = z.infer<typeof addOrgMemberSchema>
export type UpdateOrgMemberInput = z.infer<typeof updateOrgMemberSchema>

export type CreateTeamInput = z.infer<typeof createTeamSchema>
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>
export type AddTeamMemberInput = z.infer<typeof addTeamMemberSchema>
export type UpdateTeamMemberInput = z.infer<typeof updateTeamMemberSchema>
