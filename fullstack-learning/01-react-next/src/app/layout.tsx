import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '全栈学习系统 - React + Next.js 15',
  description: '前后端分离学习系统，包含权限控制、RBAC、最新技术栈',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
