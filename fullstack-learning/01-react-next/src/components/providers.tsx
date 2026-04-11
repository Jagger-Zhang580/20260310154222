/**
 * CASL 权限组件 - 前端权限控制的核心
 * 
 * 学习要点:
 * 1. <Can> 组件: 条件渲染，有权限才显示
 * 2. useAbility hook: 在组件中检查权限
 * 3. 前端权限 = UI 展示控制 (后端必须有权限验证！)
 */
'use client'

import React, { createContext, useContext } from 'react'
import type { AppAbility } from '../../../05-shared/permissions/abilities'
import { useAuthStore } from '../stores/auth-store'

// ============ Ability Context ============
const AbilityContext = createContext<AppAbility | null>(null)

export function AbilityProvider({ children }: { children: React.ReactNode }) {
  const ability = useAuthStore(state => state.ability)
  return (
    <AbilityContext.Provider value={ability}>
      {children}
    </AbilityContext.Provider>
  )
}

export function useAbility() {
  const ability = useContext(AbilityContext)
  if (!ability) {
    throw new Error('useAbility must be used within AbilityProvider')
  }
  return ability
}

// ============ <Can> 权限组件 ============
interface CanProps {
  I: string        // action: create | read | update | delete | manage
  this: string     // subject: User | Post | Comment | Dashboard | Settings
  children: React.ReactNode
  fallback?: React.ReactNode  // 无权限时显示的内容
}

/**
 * 使用示例:
 * <Can I="create" this="Post">
 *   <button>写文章</button>
 * </Can>
 * 
 * <Can I="delete" this="User" fallback={<span>无权限</span>}>
 *   <button>删除用户</button>
 * </Can>
 */
export function Can({ I: action, this: subject, children, fallback = null }: CanProps) {
  const ability = useAbility()
  
  if (ability.can(action as any, subject as any)) {
    return <>{children}</>
  }
  
  return <>{fallback}</>
}

// ============ 路由守卫 Hook ============
export function usePermission(action: string, subject: string): boolean {
  const ability = useAbility()
  return ability.can(action as any, subject as any)
}
