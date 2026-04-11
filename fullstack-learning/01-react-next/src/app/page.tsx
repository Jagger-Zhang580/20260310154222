/**
 * 首页 - Next.js 15 App Router
 * 
 * 学习要点:
 * 1. 默认导出 = Server Component (默认在 App Router 中)
 * 2. 'use client' 指令标记客户端组件
 * 3. Suspense 支持流式渲染
 */
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-3xl text-center space-y-8">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          全栈前后端分离
          <span className="text-primary">学习系统</span>
        </h1>
        
        <p className="text-lg text-muted-foreground">
          React 19 + Next.js 15 + Hono + Drizzle ORM + CASL 权限控制
        </p>

        <div className="grid grid-cols-2 gap-4 text-left max-w-lg mx-auto">
          <TechCard title="Next.js 15" desc="App Router + Server Components" />
          <TechCard title="React 19" desc="use() + Actions + Transitions" />
          <TechCard title="Hono" desc="超轻量 TypeScript API 框架" />
          <TechCard title="Drizzle ORM" desc="类型安全的 SQL-like ORM" />
          <TechCard title="shadcn/ui" desc="可定制 UI 组件代码" />
          <TechCard title="CASL" desc="前后端统一权限模型" />
        </div>

        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            登录体验
          </Link>
          <Link
            href="/dashboard"
            className="rounded-md border border-input px-6 py-3 text-sm font-medium hover:bg-accent"
          >
            查看仪表盘
          </Link>
        </div>

        <div className="mt-12 text-sm text-muted-foreground space-y-2">
          <p>4 种角色权限体验: super_admin / admin / editor / viewer</p>
          <p>测试账号: admin@test.com / editor@test.com / viewer@test.com (密码: 123456)</p>
        </div>
      </div>
    </div>
  )
}

function TechCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </div>
  )
}
