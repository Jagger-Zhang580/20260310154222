/**
 * CASL 权限定义 - 前后端共享
 * 
 * 这是整个权限系统的核心！前后端使用同一套权限模型
 * 
 * 学习要点:
 * 1. CASL 用 defineAbility 定义权限规则
 * 2. create/update/delete 是动作，Post/User 是主题
 * 3. conditions 支持属性级权限 (如只能编辑自己的文章)
 * 4. 前后端共享确保权限一致性
 */
import { AbilityBuilder, createMongoAbility, MongoAbility } from '@casl/ability'
import { z } from 'zod'

// ============ 角色定义 ============
export const RoleSchema = z.enum(['super_admin', 'admin', 'editor', 'viewer'])
export type Role = z.infer<typeof RoleSchema>

// ============ 权限主题 ============
export type Subjects = 
  | 'User'       // 用户管理
  | 'Post'       // 文章管理
  | 'Comment'    // 评论管理
  | 'Dashboard'  // 仪表盘
  | 'Settings'   // 系统设置
  | 'all'        // 所有主题

export type Actions = 'create' | 'read' | 'update' | 'delete' | 'manage'

export type AppAbility = MongoAbility<[Actions, Subjects]>

// ============ 为每个角色定义权限 ============
export function defineAbilitiesFor(role: Role) {
  const { can, cannot, build } = new AbilityBuilder<AppAbility>(createMongoAbility)

  switch (role) {
    case 'super_admin':
      // super_admin: 上帝视角，拥有所有权限
      can('manage', 'all')
      break

    case 'admin':
      // admin: 几乎所有权限，但不能删除超级管理员
      can('manage', 'all')
      cannot('delete', 'User', { role: 'super_admin' }).because('不能删除超级管理员')
      break

    case 'editor':
      // editor: 内容管理权限，用户只读
      can('read', 'all')
      can('create', 'Post')
      can('update', 'Post', { authorId: '${user.id}' }).because('只能编辑自己的文章')  // 只能编辑自己的
      can('delete', 'Post', { authorId: '${user.id}' })   // 只能删除自己的
      can('create', 'Comment')
      can('update', 'Comment', { userId: '${user.id}' })
      can('delete', 'Comment', { userId: '${user.id}' })
      can('read', 'Dashboard')
      cannot('manage', 'User')    // 不能管理用户
      cannot('manage', 'Settings') // 不能修改设置
      break

    case 'viewer':
      // viewer: 纯只读
      can('read', 'all')
      cannot('read', 'Settings')  // 连设置都看不到
      break
  }

  return build()
}

// ============ 路由权限映射 ============
export const RoutePermissions: Record<string, { subject: Subjects; action: Actions }> = {
  '/dashboard': { subject: 'Dashboard', action: 'read' },
  '/users': { subject: 'User', action: 'read' },
  '/users/create': { subject: 'User', action: 'create' },
  '/posts': { subject: 'Post', action: 'read' },
  '/posts/create': { subject: 'Post', action: 'create' },
  '/settings': { subject: 'Settings', action: 'read' },
}

// ============ 菜单权限映射 ============
export interface MenuItem {
  key: string
  label: string
  icon: string
  path: string
  permission: { subject: Subjects; action: Actions }
  children?: MenuItem[]
}

export const MenuConfig: MenuItem[] = [
  {
    key: 'dashboard',
    label: '仪表盘',
    icon: 'LayoutDashboard',
    path: '/dashboard',
    permission: { subject: 'Dashboard', action: 'read' },
  },
  {
    key: 'users',
    label: '用户管理',
    icon: 'Users',
    path: '/users',
    permission: { subject: 'User', action: 'read' },
    children: [
      { key: 'users-list', label: '用户列表', icon: 'List', path: '/users', permission: { subject: 'User', action: 'read' } },
      { key: 'users-create', label: '新增用户', icon: 'UserPlus', path: '/users/create', permission: { subject: 'User', action: 'create' } },
    ],
  },
  {
    key: 'posts',
    label: '文章管理',
    icon: 'FileText',
    path: '/posts',
    permission: { subject: 'Post', action: 'read' },
    children: [
      { key: 'posts-list', label: '文章列表', icon: 'List', path: '/posts', permission: { subject: 'Post', action: 'read' } },
      { key: 'posts-create', label: '写文章', icon: 'PenSquare', path: '/posts/create', permission: { subject: 'Post', action: 'create' } },
    ],
  },
  {
    key: 'settings',
    label: '系统设置',
    icon: 'Settings',
    path: '/settings',
    permission: { subject: 'Settings', action: 'read' },
  },
]
