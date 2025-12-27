import { defineStore } from 'pinia'
import authApi from '@/api/authApi'
import { STORAGE_KEYS } from '@/constants'
import type { User, LoginCredentials, RegisterData, PasswordChangeData, UserUpdateData, ApiResponse } from '@/types'

interface UserState {
  userInfo: User | null
  token: string | null
  loading: boolean
  error: string | null
}

/**
 * 用户状态管理
 * 统一处理用户认证、信息管理等功能
 */
export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    userInfo: null,
    token: localStorage.getItem(STORAGE_KEYS.TOKEN),
    loading: false,
    error: null
  }),

  getters: {
    /**
     * 判断用户是否已登录
     */
    isLoggedIn: (state): boolean => !!state.token,

    /**
     * 获取用户信息
     */
    currentUser: (state): User | null => state.userInfo
  },

  actions: {
    /**
     * 初始化用户信息
     */
    async initUser(): Promise<void> {
      if (!this.token) {
        // 没有 token，不需要初始化
        return
      }
      
      if (!this.userInfo) {
        // 尝试从本地存储恢复用户信息
        const storedUserInfo = localStorage.getItem(STORAGE_KEYS.USER_INFO)
        if (storedUserInfo) {
          try {
            this.userInfo = JSON.parse(storedUserInfo)
          } catch {
            // 解析失败，清除无效数据
            localStorage.removeItem(STORAGE_KEYS.USER_INFO)
          }
        }
        
        // 从服务器获取最新用户信息
        try {
          await this.fetchCurrentUser()
        } catch (error) {
          console.error('初始化用户信息失败:', error)
          // 如果获取失败（如 token 过期），清除登录状态
          this.token = null
          this.userInfo = null
          localStorage.removeItem(STORAGE_KEYS.TOKEN)
          localStorage.removeItem(STORAGE_KEYS.USER_INFO)
        }
      }
    },

    /**
     * 用户登录
     */
    async login(credentials: LoginCredentials): Promise<{ token: string; user: User }> {
      this.loading = true
      this.error = null

      try {
        const response = await authApi.login(credentials) as ApiResponse<{ token: string; user: User }>

        if (response.success && response.data) {
          const { token, user } = response.data
          this.token = token
          this.userInfo = user

          // 保存到本地存储
          localStorage.setItem(STORAGE_KEYS.TOKEN, token)
          localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(user))

          return response.data
        } else {
          throw new Error(response.message || '登录失败')
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : '登录失败'
        this.error = errorMessage
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * 用户注册
     */
    async register(userData: RegisterData): Promise<User> {
      this.loading = true
      this.error = null

      try {
        const response = await authApi.register(userData) as ApiResponse<User>

        if (response.success) {
          return response.data
        } else {
          throw new Error(response.message || '注册失败')
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : '注册失败'
        this.error = errorMessage
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * 用户退出登录
     */
    async logout(): Promise<void> {
      // 清除本地状态
      this.token = null
      this.userInfo = null
      localStorage.removeItem(STORAGE_KEYS.TOKEN)
      localStorage.removeItem(STORAGE_KEYS.USER_INFO)

      // 调用后端logout API
      try {
        await authApi.logout()
      } catch (error) {
        console.error('退出登录API调用失败:', error)
      }
    },

    /**
     * 获取当前用户信息
     */
    async fetchCurrentUser(): Promise<User | undefined> {
      if (!this.token) return

      this.loading = true
      this.error = null

      try {
        const response = await authApi.getCurrentUser() as ApiResponse<User>

        if (response.success && response.data) {
          this.userInfo = response.data
          localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(response.data))
          return response.data
        } else {
          throw new Error(response.message || '获取用户信息失败')
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : '获取用户信息失败'
        this.error = errorMessage
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * 更新用户信息
     */
    async updateUserInfo(userData: UserUpdateData): Promise<User | null> {
      this.loading = true
      this.error = null

      try {
        // 乐观更新
        const updatedUserInfo = {
          ...this.userInfo,
          ...userData
        } as User

        this.userInfo = updatedUserInfo
        localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(this.userInfo))

        // 调用API
        const response = await authApi.updateUserInfo(userData) as ApiResponse<User>

        if (response.success) {
          return this.userInfo
        } else {
          throw new Error(response.message || '更新用户信息失败')
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : '更新用户信息失败'
        this.error = errorMessage
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * 修改密码
     */
    async changePassword(passwordData: PasswordChangeData): Promise<string> {
      this.loading = true
      this.error = null

      try {
        const response = await authApi.changePassword(passwordData) as ApiResponse<string>

        if (response.success) {
          return response.message || '密码修改成功'
        } else {
          throw new Error(response.message || '修改密码失败')
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : '修改密码失败'
        this.error = errorMessage
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * 清除错误信息
     */
    clearError(): void {
      this.error = null
    }
  }
})
