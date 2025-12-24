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
     * 修复版：处理多种登录结果格式，避免误判
     * @param {Object} credentials - 登录凭证
     * @returns {Promise}
     */
    async login(credentials) {
      this.loading = true
      this.error = null
      
      try {
        // 注意：由于axios响应拦截器直接返回response.data，所以response就是登录结果
        const loginResult = await authApi.login(credentials)
        
        // 检查登录是否成功
        // 处理多种登录结果格式：
        // 1. { token: '...', user: {...} } - 直接返回token和user
        // 2. { success: true, data: { token: '...', user: {...} } } - 成功信息在data中
        // 3. { success: false, message: '...' } - 登录失败
        let actualLoginData = loginResult
        let isSuccess = false
        
        // 处理带success字段的响应格式
        if (loginResult && typeof loginResult === 'object') {
          if (loginResult.success === false) {
            // 明确返回失败，抛出错误
            const errorMessage = loginResult.message || '登录失败，请重试'
            this.error = errorMessage
            throw new Error(errorMessage)
          } else if (loginResult.success === true) {
            // 明确返回成功
            isSuccess = true
            // 检查是否有data字段
            if (loginResult.data) {
              actualLoginData = loginResult.data
            }
          }
        }
        
        // 检查实际登录数据是否包含token
        if (actualLoginData && typeof actualLoginData === 'object') {
          if (actualLoginData.token) {
            // 登录成功，处理登录结果
            this.token = actualLoginData.token
            this.userInfo = actualLoginData.user || { username: credentials.username }
            
            // 保存token和用户信息到本地存储
            localStorage.setItem('token', this.token)
            localStorage.setItem('userInfo', JSON.stringify(this.userInfo))
            
            return actualLoginData
          } else if (isSuccess) {
            // 后端返回success: true，但没有token字段
            // 这是一个成功响应，不应该抛出错误
            // 保存用户信息，如果有的话
            if (actualLoginData.user) {
              this.userInfo = actualLoginData.user
              localStorage.setItem('userInfo', JSON.stringify(this.userInfo))
            }
            
            return actualLoginData
          } else {
            // 登录失败，没有token且没有明确的success: true
            const errorMessage = actualLoginData?.message || '登录失败，请重试'
            this.error = errorMessage
            throw new Error(errorMessage)
          }
        } else {
          // 登录失败，返回数据格式不正确
          const errorMessage = '登录失败，服务器返回数据格式不正确'
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
     * 修复版：根据axios拦截器的实际行为调整API响应处理
     * @param {Object} userData - 用户注册数据
     * @returns {Promise}
     */
    async register(userData) {
      this.loading = true
      this.error = null
      
      try {
        // 注意：由于axios响应拦截器直接返回response.data，所以response就是注册结果
        const registerResult = await authApi.register(userData)
        
        // 检查注册是否成功
        // 由于axios响应拦截器直接返回response.data，需要调整验证逻辑
        const isRegisterSuccess = registerResult && typeof registerResult === 'object' && 
                                (registerResult.success !== false)
        
        if (isRegisterSuccess) {
          return registerResult
        } else {
          // 注册失败，抛出错误
          const errorMessage = registerResult?.message || '注册失败，请重试'
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
     * 修复版：根据axios拦截器的实际行为调整API响应处理
     */
    async fetchCurrentUser() {
      if (!this.token) return
      
      this.loading = true
      this.error = null
      
      try {
        // 注意：由于axios响应拦截器直接返回response.data，所以response就是用户信息
        const userData = await authApi.getCurrentUser()
        
        // 检查获取用户信息是否成功
        // 由于axios响应拦截器直接返回response.data，需要调整验证逻辑
        if (userData && typeof userData === 'object') {
          this.userInfo = userData
          // 保存用户信息到本地存储
          localStorage.setItem('userInfo', JSON.stringify(this.userInfo))
          return userData
        } else {
          // 获取失败，清除token和用户信息
          const errorMessage = '获取用户信息失败'
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
    },
    
    /**
     * 更新用户信息
     * 修复版：确保用户信息不会丢失，处理各种错误情况
     * @param {Object} userData - 用户数据
     */
    async updateUserInfo(userData) {
      this.loading = true
      this.error = null
      
      try {
        // 1. 先在本地更新用户信息，这样用户可以立即看到修改
        //    即使API调用失败，用户也能看到修改了哪些字段
        const updatedUserInfo = {
          ...this.userInfo,
          ...userData
        }
        
        // 2. 更新store和localStorage
        this.userInfo = updatedUserInfo
        localStorage.setItem('userInfo', JSON.stringify(this.userInfo))
        
        // 3. 调用API更新用户信息
        // 注意：authApi.updateUserInfo已经处理了数据过滤，只发送需要更新的字段
        const updateResult = await authApi.updateUserInfo(userData)
        
        // 4. API调用成功，不需要重新获取用户信息
        //    保留本地已更新的用户信息，避免因API返回格式问题导致用户信息丢失
        return this.userInfo
      } catch (error) {
        // 5. 错误处理
        this.error = error.message || '更新用户信息失败'
        console.error('更新用户信息失败:', error)
        
        // 6. 保留本地已修改的用户信息，这样用户可以看到修改了哪些字段
        //    让用户决定是否重试或放弃修改
        
        throw error
      } finally {
        // 7. 确保加载状态更新
        this.loading = false
      }
    }
  }
})
