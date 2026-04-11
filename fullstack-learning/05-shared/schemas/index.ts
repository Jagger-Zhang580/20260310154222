/**
 * Zod Schema - 前后端共享验证规则
 * 
 * 学习要点:
 * 1. Zod 是 TypeScript 优先的验证库
 * 2. 前后端共享同一套 Schema，保证验证逻辑一致
 * 3. 自动推导 TypeScript 类型，无需手动定义
 * 4. 错误信息友好，支持 i18n
 */
import { z } from 'zod'

// ============ 用户相关 Schema ============
export const LoginSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(6, '密码至少6位').max(32, '密码最多32位'),
})

export const RegisterSchema = z.object({
  name: z.string().min(2, '姓名至少2个字符').max(20, '姓名最多20个字符'),
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(6, '密码至少6位').max(32, '密码最多32位'),
  confirmPassword: z.string(),
  role: z.enum(['admin', 'editor', 'viewer']).default('viewer'),
}).refine(data => data.password === data.confirmPassword, {
  message: '两次密码不一致',
  path: ['confirmPassword'],
})

export const UpdateUserSchema = z.object({
  name: z.string().min(2).max(20).optional(),
  email: z.string().email().optional(),
  role: z.enum(['admin', 'editor', 'viewer']).optional(),
  avatar: z.string().url().optional(),
  status: z.enum(['active', 'inactive']).optional(),
})

// ============ 文章相关 Schema ============
export const CreatePostSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(100, '标题最多100字符'),
  content: z.string().min(10, '内容至少10个字符'),
  summary: z.string().max(200, '摘要最多200字符').optional(),
  tags: z.array(z.string()).max(5, '最多5个标签').optional(),
  status: z.enum(['draft', 'published']).default('draft'),
})

export const UpdatePostSchema = CreatePostSchema.partial()

// ============ 分页 Schema ============
export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

// ============ API 响应 Schema ============
export const ApiResponseSchema = z.object({
  code: z.number(),
  message: z.string(),
  data: z.unknown().optional(),
})

// ============ 自动推导 TypeScript 类型 ============
export type LoginInput = z.infer<typeof LoginSchema>
export type RegisterInput = z.infer<typeof RegisterSchema>
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>
export type CreatePostInput = z.infer<typeof CreatePostSchema>
export type UpdatePostInput = z.infer<typeof UpdatePostSchema>
export type PaginationInput = z.infer<typeof PaginationSchema>

// ============ 用户类型 (从数据库模型推导) ============
export interface User {
  id: string
  name: string
  email: string
  role: 'super_admin' | 'admin' | 'editor' | 'viewer'
  avatar?: string
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
}

export interface Post {
  id: string
  title: string
  content: string
  summary?: string
  tags: string[]
  status: 'draft' | 'published'
  authorId: string
  author?: User
  createdAt: string
  updatedAt: string
}

// ============ JWT Payload ============
export interface JWTPayload {
  sub: string       // user id
  role: string      // user role
  iat: number       // issued at
  exp: number       // expiration
}
