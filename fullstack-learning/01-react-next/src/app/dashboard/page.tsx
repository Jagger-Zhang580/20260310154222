'use client'

import { useAuthStore } from '../../stores/auth-store'
import { Can, usePermission } from '../../components/providers'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function DashboardPage() {
  const { user, ability, logout } = useAuthStore()
  const router = useRouter()
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)

  useEffect(() => {
    if (!isAuthenticated) router.push('/login')
  }, [isAuthenticated])

  if (!user || !ability) return null

  const roleColors: Record<string, string> = {
    super_admin: 'bg-red-100 text-red-800',
    admin: 'bg-orange-100 text-orange-800',
    editor: 'bg-blue-100 text-blue-800',
    viewer: 'bg-gray-100 text-gray-800',
  }

  return (
    <div className="flex min-h-screen">
      {/* 侧边栏 */}
      <aside className="w-64 border-r bg-sidebar-background p-4 space-y-2">
        <h2 className="font-bold text-lg mb-4">📋 菜单</h2>
        
        <SidebarLink href="/dashboard" label="仪表盘" />
        <Can I="read" this="User">
          <SidebarLink href="/users" label="用户管理" />
        </Can>
        <Can I="create" this="User">
          <SidebarLink href="/users/create" label="新增用户" />
        </Can>
        <Can I="read" this="Post">
          <SidebarLink href="/posts" label="文章管理" />
        </Can>
        <Can I="create" this="Post">
          <SidebarLink href="/posts/create" label="写文章" />
        </Can>
        <Can I="read" this="Settings">
          <SidebarLink href="/settings" label="系统设置" />
        </Can>

        <div className="pt-4 border-t mt-4">
          <button onClick={() => { logout(); router.push('/login') }} className="text-sm text-destructive hover:underline">
            退出登录
          </button>
        </div>
      </aside>

      {/* 主内容 */}
      <main className="flex-1 p-8 space-y-6">
        {/* 用户信息卡 */}
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl">
              {user.name[0]}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{user.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-muted-foreground">{user.email}</span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${roleColors[user.role] || ''}`}>
                  {user.role}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 权限说明 */}
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">🔒 当前角色权限</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <PermBadge label="仪表盘" allowed={ability.can('read', 'Dashboard')} />
            <PermBadge label="用户管理" allowed={ability.can('manage', 'User')} />
            <PermBadge label="创建文章" allowed={ability.can('create', 'Post')} />
            <PermBadge label="编辑任意文章" allowed={ability.can('update', 'Post')} />
            <PermBadge label="删除文章" allowed={ability.can('delete', 'Post')} />
            <PermBadge label="系统设置" allowed={ability.can('read', 'Settings')} />
            <PermBadge label="管理评论" allowed={ability.can('manage', 'Comment')} />
            <PermBadge label="全部权限" allowed={ability.can('manage', 'all')} />
          </div>
        </div>

        {/* 功能区 - 按权限显示 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Can I="manage" this="User" fallback={
            <div className="rounded-lg border bg-muted/50 p-6 text-center">
              <p className="text-muted-foreground">🚫 用户管理需要 admin 权限</p>
            </div>
          }>
            <div className="rounded-lg border bg-card p-6">
              <h3 className="font-semibold mb-2">👥 用户管理</h3>
              <p className="text-sm text-muted-foreground">创建、编辑、删除用户，分配角色</p>
              <button className="mt-3 text-sm text-primary hover:underline">进入管理 →</button>
            </div>
          </Can>

          <Can I="create" this="Post" fallback={
            <div className="rounded-lg border bg-muted/50 p-6 text-center">
              <p className="text-muted-foreground">🚫 写文章需要 editor 权限</p>
            </div>
          }>
            <div className="rounded-lg border bg-card p-6">
              <h3 className="font-semibold mb-2">📝 内容创作</h3>
              <p className="text-sm text-muted-foreground">创建和编辑文章内容</p>
              <button className="mt-3 text-sm text-primary hover:underline">开始创作 →</button>
            </div>
          </Can>

          <Can I="read" this="Settings" fallback={
            <div className="rounded-lg border bg-muted/50 p-6 text-center">
              <p className="text-muted-foreground">🚫 系统设置需要 admin 权限</p>
            </div>
          }>
            <div className="rounded-lg border bg-card p-6">
              <h3 className="font-semibold mb-2">⚙️ 系统设置</h3>
              <p className="text-sm text-muted-foreground">配置系统参数、权限规则</p>
              <button className="mt-3 text-sm text-primary hover:underline">查看设置 →</button>
            </div>
          </Can>
        </div>
      </main>
    </div>
  )
}

function SidebarLink({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} className="block rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground">
      {label}
    </a>
  )
}

function PermBadge({ label, allowed }: { label: string; allowed: boolean }) {
  return (
    <div className={`rounded-md border p-3 text-center text-sm ${allowed ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
      {allowed ? '✅' : '❌'} {label}
    </div>
  )
}
