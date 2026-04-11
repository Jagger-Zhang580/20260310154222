/**
 * Zustand Auth Store - 认证状态管理
 * 
 * 学习要点:
 * 1. Zustand v5: 简化 API，不用 create()(set) 了
 * 2. persist middleware: 自动持久化到 localStorage
 * 3. 与 CASL 集成: 登录后自动生成权限
 */
'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, JWTPayload } from '../../../05-shared/schemas'
import { defineAbilitiesFor, type AppAbility, type Role } from '../../../05-shared/permissions/abilities'
import { jwtDecode } from 'jwt-decode'

interface AuthState {
  // 状态
  user: User | null
  token: string | null
  ability: AppAbility | null
  isAuthenticated: boolean

  // 操作
  login: (token: string, user: User) => void
  logout: () => void
  updateUser: (user: Partial<User>) => void
  hasPermission: (action: string, subject: string) => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      ability: null,
      isAuthenticated: false,

      login: (token: string, user: User) => {
        // 根据 role 生成 CASL 权限
        const ability = defineAbilitiesFor(user.role as Role)
        set({ user, token, ability, isAuthenticated: true })
      },

      logout: () => {
        set({ user: null, token: null, ability: null, isAuthenticated: false })
      },

      updateUser: (userData: Partial<User>) => {
        const currentUser = get().user
        if (currentUser) {
          const updatedUser = { ...currentUser, ...userData }
          // 如果角色变了，重新生成权限
          const ability = userData.role 
            ? defineAbilitiesFor(userData.role as Role)
            : get().ability
          set({ user: updatedUser, ability })
        }
      },

      hasPermission: (action: string, subject: string) => {
        const ability = get().ability
        if (!ability) return false
        return ability.can(action as any, subject as any)
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
      }),
      // 从 localStorage 恢复时重新生成权限
      onRehydrateStorage: () => (state) => {
        if (state?.user && state?.token) {
          state.ability = defineAbilitiesFor(state.user.role as Role)
          state.isAuthenticated = true
        }
      },
    }
  )
)
