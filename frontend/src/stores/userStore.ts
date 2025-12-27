import { defineStore } from 'pinia'
import authApi from '@/api/authApi'
import addressApi from '@/api/addressApi'

// 类型定义
interface User {
  id: number
  username: string
  email: string
  phone?: string
  nickname?: string
  bio?: string
  avatar?: string
  points: number
  growthValue: number
  memberDays: number
  createdTime: string
  updatedTime: string
  lastLoginTime?: string
}

interface LoginCredentials {
  username: string
  password: string
}

interface RegisterData {
  username: string
  password: string
  email: string
  phone?: string
}

interface PasswordChangeData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

interface UserUpdateData {
  email?: string
  phone?: string
  nickname?: string
  bio?: string
  avatar?: string
}

/**
 * 用户状态管理
 */
export const useUserStore = defineStore('user', {
  state: () => ({
    userInfo: null as User | null,
    token: localStorage.getItem('token') || null as string | null,
    loading: false,
    error: null as string | null
  }),

  getters: {
    /**
     * 判断用户是否已登录
     */
    isLoggedIn: (state) => !!state.token,

    /**
     * 获取用户信息
     */
    currentUser: (state) => state.userInfo
  },

  actions: {
    /**
     * 初始化用户信息
     */
    async initUser() {
      // 检查是否已有token但没有用户信息
      if (this.token && !this.userInfo) {
        try {
          await this.fetchCurrentUser()
        } catch (error) {
          console.error('初始化用户信息失败:', error)
          // 初始化失败不影响应用启动
        }
      }
    },

    /**
     * 用户登录
     */
    async login(credentials: LoginCredentials) {
      this.loading = true
      this.error = null

      try {
        const response = await authApi.login(credentials)

        if (response.success && response.data) {
          const { token, user } = response.data
          this.token = token
          this.userInfo = user

          // 保存到本地存储
          localStorage.setItem('token', token)
          localStorage.setItem('userInfo', JSON.stringify(user))

          return response.data
        } else {
          throw new Error(response.message || '登录失败')
        }
      } catch (error: any) {
        this.error = error.message || '登录失败'
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * 用户注册
     */
    async register(userData: RegisterData) {
      this.loading = true
      this.error = null

      try {
        const response = await authApi.register(userData)

        if (response.success) {
          return response.data
        } else {
          throw new Error(response.message || '注册失败')
        }
      } catch (error: any) {
        this.error = error.message || '注册失败'
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * 用户退出登录
     */
    async logout() {
      // 清除本地状态
      this.token = null
      this.userInfo = null
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')

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
    async fetchCurrentUser() {
      if (!this.token) return

      this.loading = true
      this.error = null

      try {
        const response = await authApi.getCurrentUser()

        if (response.success && response.data) {
          this.userInfo = response.data
          localStorage.setItem('userInfo', JSON.stringify(response.data))
          return response.data
        } else {
          throw new Error(response.message || '获取用户信息失败')
        }
      } catch (error: any) {
        this.error = error.message || '获取用户信息失败'
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * 更新用户信息
     */
    async updateUserInfo(userData: UserUpdateData) {
      this.loading = true
      this.error = null

      try {
        // 乐观更新
        const updatedUserInfo = {
          ...this.userInfo,
          ...userData
        } as User

        this.userInfo = updatedUserInfo
        localStorage.setItem('userInfo', JSON.stringify(this.userInfo))

        // 调用API
        const response = await authApi.updateUserInfo(userData)

        if (response.success) {
          return this.userInfo
        } else {
          throw new Error(response.message || '更新用户信息失败')
        }
      } catch (error: any) {
        this.error = error.message || '更新用户信息失败'
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * 修改密码
     */
    async changePassword(passwordData: PasswordChangeData) {
      this.loading = true
      this.error = null

      try {
        const response = await authApi.changePassword(passwordData)

        if (response.success) {
          return response.message
        } else {
          throw new Error(response.message || '修改密码失败')
        }
      } catch (error: any) {
        this.error = error.message || '修改密码失败'
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * 清除错误信息
     */
    clearError() {
      this.error = null
    }
  }
})
