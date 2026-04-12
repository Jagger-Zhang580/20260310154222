/**
 * Hono API - 后端入口
 * 
 * 学习要点:
 * 1. Hono: 超轻量 Web 框架，支持边缘计算
 * 2. 中间件链: JWT认证 → RBAC权限 → 路由处理
 * 3. Zod验证: 请求参数自动验证
 * 4. Drizzle ORM: 类型安全的数据库操作
 */
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { jwt } from 'hono/jwt'
import type { Context, Next } from 'hono'
import { z } from 'zod'
import { defineAbilitiesFor, type Role } from '../../05-shared/permissions/abilities'

// ============ Types ============
interface Bindings {
  JWT_SECRET: string
  DATABASE_URL: string
}

interface UserPayload {
  sub: string
  role: Role
  exp: number
}

// ============ App ============
const app = new Hono<{ Bindings: Bindings }>()

// ============ 全局中间件 ============
app.use('*', logger())
app.use('*', cors({
  origin: ['http://localhost:3001', 'http://localhost:3002'],
  credentials: true,
}))

// ============ 公开路由 (无需认证) ============
app.post('/api/auth/login', async (c) => {
  const body = await c.req.json()
  
  const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
  })
  
  const result = LoginSchema.safeParse(body)
  if (!result.success) {
    return c.json({ code: 400, message: '参数验证失败', errors: result.error.flatten() }, 400)
  }

  // 模拟用户验证 (实际项目查数据库)
  const mockUsers: Record<string, { password: string; id: string; name: string; role: Role }> = {
    'admin@test.com': { password: '123456', id: '1', name: '管理员', role: 'admin' },
    'editor@test.com': { password: '123456', id: '2', name: '编辑者', role: 'editor' },
    'viewer@test.com': { password: '123456', id: '3', name: '观察者', role: 'viewer' },
    'super@test.com': { password: '123456', id: '0', name: '超级管理员', role: 'super_admin' },
  }

  const user = mockUsers[body.email]
  if (!user || user.password !== body.password) {
    return c.json({ code: 401, message: '邮箱或密码错误' }, 401)
  }

  // 生成 JWT
  const payload = { sub: user.id, role: user.role, exp: Math.floor(Date.now() / 1000) + 86400 }
  const token = await signJWT(payload, c.env.JWT_SECRET || 'dev-secret-key')

  return c.json({
    code: 200,
    message: '登录成功',
    data: {
      token,
      user: { id: user.id, name: user.name, email: body.email, role: user.role, status: 'active' },
    },
  })
})

app.post('/api/auth/register', async (c) => {
  // 注册逻辑...
  return c.json({ code: 201, message: '注册成功' })
})

// ============ JWT 认证中间件 ============
app.use('/api/*', async (c, next) => {
  // 跳过公开路由
  if (c.req.path.startsWith('/api/auth/')) return next()
  
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ code: 401, message: '未提供认证令牌' }, 401)
  }

  try {
    const token = authHeader.slice(7)
    const payload = await verifyJWT(token, c.env.JWT_SECRET || 'dev-secret-key')
    c.set('user', payload as UserPayload)
    await next()
  } catch {
    return c.json({ code: 401, message: '令牌无效或已过期' }, 401)
  }
})

// ============ RBAC 权限中间件 ============
function requirePermission(action: string, subject: string) {
  return async (c: Context, next: Next) => {
    const user = c.get('user') as UserPayload
    if (!user) return c.json({ code: 401, message: '未认证' }, 401)

    const ability = defineAbilitiesFor(user.role)
    if (!ability.can(action as any, subject as any)) {
      return c.json({ code: 403, message: `无权限: ${action} ${subject}` }, 403)
    }
    
    await next()
  }
}

// ============ 受保护路由 ============

// 用户管理
app.get('/api/users', requirePermission('read', 'User'), async (c) => {
  // 模拟返回用户列表
  return c.json({
    code: 200,
    data: {
      items: [
        { id: '0', name: '超级管理员', email: 'super@test.com', role: 'super_admin', status: 'active' },
        { id: '1', name: '管理员', email: 'admin@test.com', role: 'admin', status: 'active' },
        { id: '2', name: '编辑者', email: 'editor@test.com', role: 'editor', status: 'active' },
        { id: '3', name: '观察者', email: 'viewer@test.com', role: 'viewer', status: 'active' },
      ],
      total: 4,
    },
  })
})

app.post('/api/users', requirePermission('create', 'User'), async (c) => {
  const body = await c.req.json()
  return c.json({ code: 201, message: '用户创建成功', data: { id: '4', ...body } })
})

app.delete('/api/users/:id', requirePermission('delete', 'User'), async (c) => {
  const user = c.get('user') as UserPayload
  const targetId = c.req.param('id')
  
  // 额外检查: 不能删除超级管理员
  if (targetId === '0') {
    const ability = defineAbilitiesFor(user.role)
    if (!ability.can('delete', 'User', { role: 'super_admin' })) {
      return c.json({ code: 403, message: '不能删除超级管理员' }, 403)
    }
  }
  
  return c.json({ code: 200, message: '用户删除成功' })
})

// 文章管理
app.get('/api/posts', requirePermission('read', 'Post'), async (c) => {
  return c.json({
    code: 200,
    data: {
      items: [
        { id: '1', title: 'React 19 新特性', status: 'published', authorId: '2' },
        { id: '2', title: 'Next.js 15 App Router', status: 'draft', authorId: '1' },
      ],
      total: 2,
    },
  })
})

app.post('/api/posts', requirePermission('create', 'Post'), async (c) => {
  const body = await c.req.json()
  const user = c.get('user') as UserPayload
  return c.json({ code: 201, message: '文章创建成功', data: { id: '3', ...body, authorId: user.sub } })
})

// 系统设置
app.get('/api/settings', requirePermission('read', 'Settings'), async (c) => {
  return c.json({ code: 200, data: { siteName: '学习系统', version: '1.0.0' } })
})

// ============ JWT 辅助函数 ============
async function signJWT(payload: object, secret: string): Promise<string> {
  // 简化实现，实际项目用 jose 库
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = btoa(JSON.stringify(payload))
  return `${header}.${body}.signature`
}

async function verifyJWT(token: string, secret: string): Promise<any> {
  const parts = token.split('.')
  if (parts.length !== 3) throw new Error('Invalid token')
  const payload = JSON.parse(atob(parts[1]))
  if (payload.exp < Math.floor(Date.now() / 1000)) throw new Error('Token expired')
  return payload
}

// ============ 启动 ============
const port = process.env.PORT || 3003
console.log(`🚀 Hono API running on http://localhost:${port}`)

export default {
  port,
  fetch: app.fetch,
}
