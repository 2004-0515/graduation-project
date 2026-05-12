import { defineStore } from 'pinia'
import authApi from '@/api/authApi'
import { STORAGE_KEYS } from '@/constants'
import type { User, LoginCredentials, RegisterData, PasswordChangeData, UserUpdateData, ApiResponse } from '@/types'
import { debugError } from '@/utils/debug'

interface UserState {
  userInfo: User | null
  token: string | null
  loading: boolean
  error: string | null
}

let latestFetchCurrentUserRequestId = 0
const invalidateFetchCurrentUserRequests = () => {
  latestFetchCurrentUserRequestId += 1
}
const isSuccessfulResponse = (response: ApiResponse<unknown> | undefined): boolean =>
  response?.code === 200
const readStorage = (key: string): string | null => {
  try {
    return localStorage.getItem(key)
  } catch (error) {
    debugError(`读取本地存储失败(${key})`, error)
    return null
  }
}

const writeStorage = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value)
  } catch (error) {
    debugError(`写入本地存储失败(${key})`, error)
  }
}

const removeStorage = (key: string): void => {
  try {
    localStorage.removeItem(key)
  } catch (error) {
    debugError(`删除本地存储失败(${key})`, error)
  }
}

/**
 * 用户状态管理
 * 统一处理用户认证、信息管理等功能
 */
export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    userInfo: null,
    token: readStorage(STORAGE_KEYS.TOKEN),
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
        const storedUserInfo = readStorage(STORAGE_KEYS.USER_INFO)
        if (storedUserInfo) {
          try {
            this.userInfo = JSON.parse(storedUserInfo)
          } catch (error) {
            debugError('解析本地用户信息失败', error)
            // 解析失败，清除无效数据
            removeStorage(STORAGE_KEYS.USER_INFO)
          }
        }
        
        // 从服务器获取最新用户信息
        try {
          await this.fetchCurrentUser()
        } catch (error) {
          debugError('初始化用户信息失败', error)
          // 如果获取失败（如 token 过期），清除登录状态
          this.token = null
          this.userInfo = null
          removeStorage(STORAGE_KEYS.TOKEN)
          removeStorage(STORAGE_KEYS.USER_INFO)
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

        if (isSuccessfulResponse(response) && response.data) {
          const { token, user } = response.data
          this.token = token
          this.userInfo = user

          // 保存到本地存储
          writeStorage(STORAGE_KEYS.TOKEN, token)
          writeStorage(STORAGE_KEYS.USER_INFO, JSON.stringify(user))

          return response.data
        } else {
          throw new Error(response.message || '登录失败')
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : '登录失败'
        this.error = errorMessage
        debugError('登录失败', error)
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

        if (isSuccessfulResponse(response)) {
          return response.data
        } else {
          throw new Error(response.message || '注册失败')
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : '注册失败'
        this.error = errorMessage
        debugError('注册失败', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * 用户退出登录
     */
    async logout(): Promise<void> {
      invalidateFetchCurrentUserRequests()
      // 清除本地状态
      this.token = null
      this.userInfo = null
      removeStorage(STORAGE_KEYS.TOKEN)
      removeStorage(STORAGE_KEYS.USER_INFO)

      // 调用后端logout API
      try {
        await authApi.logout()
      } catch (error) {
        debugError('退出登录API调用失败', error)
      }
    },

    /**
     * 获取当前用户信息
     */
    async fetchCurrentUser(): Promise<User | undefined> {
      if (!this.token) return

      const requestId = ++latestFetchCurrentUserRequestId
      this.loading = true
      this.error = null

      try {
        const response = await authApi.getCurrentUser() as ApiResponse<User>
        if (requestId !== latestFetchCurrentUserRequestId) {
          return this.userInfo || undefined
        }

        if (isSuccessfulResponse(response) && response.data) {
          this.userInfo = response.data
          writeStorage(STORAGE_KEYS.USER_INFO, JSON.stringify(response.data))
          return response.data
        } else {
          throw new Error(response.message || '获取用户信息失败')
        }
      } catch (error: unknown) {
        if (requestId !== latestFetchCurrentUserRequestId) {
          return this.userInfo || undefined
        }
        const errorMessage = error instanceof Error ? error.message : '获取用户信息失败'
        this.error = errorMessage
        debugError('获取当前用户信息失败', error)
        throw error
      } finally {
        if (requestId === latestFetchCurrentUserRequestId) {
          this.loading = false
        }
      }
    },

    /**
     * 更新用户信息
     */
    async updateUserInfo(userData: UserUpdateData): Promise<User | null> {
      this.loading = true
      this.error = null

      const previousUserInfo = this.userInfo
      const previousStoredUserInfo = readStorage(STORAGE_KEYS.USER_INFO)

      try {
        // 乐观更新
        const updatedUserInfo = {
          ...this.userInfo,
          ...userData
        } as User

        invalidateFetchCurrentUserRequests()
        this.userInfo = updatedUserInfo
        writeStorage(STORAGE_KEYS.USER_INFO, JSON.stringify(this.userInfo))

        // 调用API
        const response = await authApi.updateUserInfo(userData) as ApiResponse<User>

        if (isSuccessfulResponse(response)) {
          const finalUserInfo = response.data || updatedUserInfo
          this.userInfo = finalUserInfo
          writeStorage(STORAGE_KEYS.USER_INFO, JSON.stringify(finalUserInfo))
          return finalUserInfo
        } else {
          throw new Error(response.message || '更新用户信息失败')
        }
      } catch (error: unknown) {
        this.userInfo = previousUserInfo
        if (previousStoredUserInfo) {
          writeStorage(STORAGE_KEYS.USER_INFO, previousStoredUserInfo)
        } else {
          removeStorage(STORAGE_KEYS.USER_INFO)
        }

        const errorMessage = error instanceof Error ? error.message : '更新用户信息失败'
        this.error = errorMessage
        debugError('更新用户信息失败', error)
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

        if (isSuccessfulResponse(response)) {
          return response.message || '密码修改成功'
        } else {
          throw new Error(response.message || '修改密码失败')
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : '修改密码失败'
        this.error = errorMessage
        debugError('修改密码失败', error)
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
