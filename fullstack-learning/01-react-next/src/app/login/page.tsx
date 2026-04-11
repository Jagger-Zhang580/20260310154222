/**
 * 登录页 - Next.js 15 App Router
 * 
 * 学习要点:
 * 1. 'use client' - 客户端组件 (需要交互)
 * 2. Server Actions vs Client-side fetch
 * 3. Zod 表单验证
 * 4. JWT Token 存储
 */
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '../../stores/auth-store'
import type { User } from '../../../05-shared/schemas'

// 模拟用户数据 (实际项目从后端 API 获取)
const MOCK_USERS: Record<string, { password: string; user: User }> = {
  'admin@test.com': {
    password: '123456',
    user: { id: '1', name: '管理员', email: 'admin@test.com', role: 'admin', status: 'active', createdAt: '', updatedAt: '' }
  },
  'editor@test.com': {
    password: '123456',
    user: { id: '2', name: '编辑者', email: 'editor@test.com', role: 'editor', status: 'active', createdAt: '', updatedAt: '' }
  },
  'viewer@test.com': {
    password: '123456',
    user: { id: '3', name: '观察者', email: 'viewer@test.com', role: 'viewer', status: 'active', createdAt: '', updatedAt: '' }
  },
  'super@test.com': {
    password: '123456',
    user: { id: '0', name: '超级管理员', email: 'super@test.com', role: 'super_admin', status: 'active', createdAt: '', updatedAt: '' }
  },
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const login = useAuthStore(state => state.login)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // 模拟 API 请求延迟
    await new Promise(resolve => setTimeout(resolve, 800))

    const mockUser = MOCK_USERS[email]
    if (mockUser && mockUser.password === password) {
      // 生成模拟 JWT token
      const token = btoa(JSON.stringify({ sub: mockUser.user.id, role: mockUser.user.role, exp: Date.now() + 86400000 }))
      login(token, mockUser.user)
      router.push('/dashboard')
    } else {
      setError('邮箱或密码错误')
    }
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 p-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold">登录</h2>
          <p className="mt-2 text-muted-foreground">
            体验不同角色的权限差异
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@test.com"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="123456"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        <div className="mt-8 rounded-lg border bg-muted/50 p-4">
          <h3 className="mb-3 text-sm font-semibold">快速体验 (点击自动填充)</h3>
          <div className="space-y-2">
            {Object.entries(MOCK_USERS).map(([email, data]) => (
              <button
                key={email}
                onClick={() => { setEmail(email); setPassword(data.password) }}
                className="w-full rounded border bg-background px-3 py-2 text-left text-sm hover:bg-accent"
              >
                <span className="font-medium">{data.user.role}</span>
                <span className="text-muted-foreground"> - {email}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
