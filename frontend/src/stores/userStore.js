import { defineStore } from 'pinia'
import authApi from '../api/authApi'
import addressApi from '../api/addressApi'

/**
 * 用户状态管理
 */
export const useUserStore = defineStore('user', {
  state: () => ({
    userInfo: (() => {
      try {
        const userInfoStr = localStorage.getItem('userInfo')
        return userInfoStr && userInfoStr !== 'undefined' ? JSON.parse(userInfoStr) : null
      } catch (error) {
        console.error('解析用户信息失败:', error)
        return null
      }
    })(),
    token: localStorage.getItem('token') || null,
    loading: false,
    error: null
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
      if (this.token && !this.userInfo) {
        try {
          await this.fetchCurrentUser()
        } catch (error) {
          console.error('初始化用户信息失败:', error)
        }
      }
    },
    /**
     * 用户登录
     * @param {Object} credentials - 登录凭证
     * @returns {Promise}
     */
    async login(credentials) {
      this.loading = true
      this.error = null
      
      try {
        const response = await authApi.login(credentials)
        // 检查登录是否成功
        if (response.success && response.data) {
          this.token = response.data.token
          this.userInfo = response.data.user
          
          // 保存token和用户信息到本地存储
          localStorage.setItem('token', this.token)
          localStorage.setItem('userInfo', JSON.stringify(this.userInfo))
          
          return response
        } else {
          // 登录失败，抛出错误
          const errorMessage = response.message || '登录失败，请重试'
          this.error = errorMessage
          throw new Error(errorMessage)
        }
      } catch (error) {
        this.error = error.message || '登录失败，请重试'
        throw error
      } finally {
        this.loading = false
      }
    },
    
    /**
     * 用户注册
     * @param {Object} userData - 用户注册数据
     * @returns {Promise}
     */
    async register(userData) {
      this.loading = true
      this.error = null
      
      try {
        const response = await authApi.register(userData)
        // 检查注册是否成功
        if (response.success) {
          return response
        } else {
          // 注册失败，抛出错误
          const errorMessage = response.message || '注册失败，请重试'
          this.error = errorMessage
          throw new Error(errorMessage)
        }
      } catch (error) {
        this.error = error.message || '注册失败，请重试'
        throw error
      } finally {
        this.loading = false
      }
    },
    
    /**
     * 用户退出登录
     */
    async logout() {
      try {
        await authApi.logout()
      } catch (error) {
        console.error('退出登录失败:', error)
      } finally {
        // 清除状态和本地存储
        this.token = null
        this.userInfo = null
        localStorage.removeItem('token')
        localStorage.removeItem('userInfo')
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
        // 检查获取用户信息是否成功
        if (response.success && response.data) {
          this.userInfo = response.data
          // 保存用户信息到本地存储
          localStorage.setItem('userInfo', JSON.stringify(this.userInfo))
          return response
        } else {
          // 获取失败，清除token和用户信息
          const errorMessage = response.message || '获取用户信息失败'
          this.error = errorMessage
          this.token = null
          this.userInfo = null
          localStorage.removeItem('token')
          localStorage.removeItem('userInfo')
          throw new Error(errorMessage)
        }
      } catch (error) {
        this.error = error.message || '获取用户信息失败'
        // 如果获取失败，清除token和用户信息
        this.token = null
        this.userInfo = null
        localStorage.removeItem('token')
        localStorage.removeItem('userInfo')
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
    },
    
    /**
     * 获取用户收货地址列表
     */
    async fetchAddresses() {
      this.loading = true
      this.error = null
      
      try {
        const response = await addressApi.getUserAddresses()
        // 检查获取收货地址是否成功
        if (response.success) {
          return response
        } else {
          // 获取失败
          const errorMessage = response.message || '获取收货地址失败'
          this.error = errorMessage
          console.error('获取收货地址失败:', errorMessage)
          throw new Error(errorMessage)
        }
      } catch (error) {
        this.error = error.message || '获取收货地址失败'
        console.error('获取收货地址失败:', error)
        throw error
      } finally {
        this.loading = false
      }
    }
  }
})
