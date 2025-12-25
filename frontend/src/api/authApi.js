import axios from '../utils/axios'

/**
 * 认证相关API
 * 设计原则：
 * 1. 统一的API路径和方法命名
 * 2. 清晰的请求和响应数据格式
 * 3. 符合RESTful API设计规范
 * 4. 明确的错误处理机制
 */
const authApi = {
  /**
   * 用户登录
   * @param {Object} data - 登录数据
   * @param {string} data.username - 用户名
   * @param {string} data.password - 密码
   * @returns {Promise<{success: boolean, data: {token: string, user: Object}, message?: string}>}
   */
  login(data) {
    return axios.post('/auth/login', data)
  },
  
  /**
   * 用户注册
   * @param {Object} data - 注册数据
   * @param {string} data.username - 用户名
   * @param {string} data.password - 密码
   * @param {string} data.email - 邮箱
   * @param {string} data.nickname - 昵称
   * @returns {Promise<{success: boolean, data?: Object, message?: string}>}
   */
  register(data) {
    return axios.post('/auth/register', data)
  },
  
  /**
   * 用户退出登录
   * @returns {Promise<{success: boolean, message?: string}>}
   */
  logout() {
    return axios.post('/auth/logout')
  },
  
  /**
   * 获取当前用户信息
   * @returns {Promise<{success: boolean, data: Object, message?: string}>}
   */
  getCurrentUser() {
    return axios.get('/auth/me')
  },
  
  /**
   * 更新用户信息
   * 使用与后端一致的API路径和方法
   * @param {Object} data - 更新的数据
   * @returns {Promise}
   */
  async updateUserInfo(data) {
    // 1. 检查token是否存在
    const token = localStorage.getItem('token')
    console.log('当前token:', token ? '存在' : '不存在')
    
    // 2. 准备请求数据
    // 直接使用与后端User实体类一致的字段名
    const requestData = {
      ...data
    }
    
    // 移除不需要的字段
    delete requestData.username // 用户名不可修改
    
    console.log('准备更新用户信息:', requestData)
    console.log('请求URL:', '/auth/me')
    console.log('请求方法:', 'POST')
    
    try {
      // 3. 调用axios更新用户信息
      // 注意：axios拦截器直接返回response.data，所以response就是响应数据
      const response = await axios.post('/auth/me', requestData)
      
      console.log('响应数据:', response)
      
      return response
    } catch (error) {
      console.error('更新用户信息失败:', error)
      if (error.response) {
        console.error('错误响应状态:', error.response.status)
        console.error('错误响应数据:', error.response.data)
        console.error('错误响应头:', error.response.headers)
      } else if (error.request) {
        console.error('没有收到响应:', error.request)
      } else {
        console.error('请求配置错误:', error.message)
      }
      throw error
    }
  },
  
  /**
   * 修改用户密码
   * @param {Object} data - 密码修改数据
   * @param {string} data.currentPassword - 当前密码
   * @param {string} data.newPassword - 新密码
   * @param {string} data.confirmPassword - 确认新密码
   * @returns {Promise<{success: boolean, message?: string}>}
   */
  async changePassword(data) {
    try {
      // 调用axios修改密码
      const response = await axios.post('/auth/change-password', data)
      
      // 检查响应是否成功
      if (response.success) {
        return response
      } else {
        // 如果响应不成功，抛出包含错误信息的异常
        throw new Error(response.message || '密码修改失败')
      }
    } catch (error) {
      console.error('修改密码失败:', error)
      
      // 处理不同类型的错误
      let errorMessage = '密码修改失败，请稍后重试'
      
      if (error.response) {
        // 服务器返回了错误响应
        const responseData = error.response.data
        errorMessage = responseData.message || errorMessage
        console.error('错误响应状态:', error.response.status)
        console.error('错误响应数据:', responseData)
      } else if (error.request) {
        // 请求已发送但没有收到响应
        errorMessage = '服务器无响应，请检查网络连接'
        console.error('没有收到响应:', error.request)
      } else {
        // 请求配置错误
        errorMessage = error.message
        console.error('请求配置错误:', error.message)
      }
      
      // 抛出包含详细错误信息的异常
      throw new Error(errorMessage)
    }
  },
  
  /**
   * 删除当前用户账号
   * @returns {Promise<{success: boolean, message?: string}>}
   */
  async deleteAccount() {
    try {
      // 调用axios删除账号
      const response = await axios.delete('/users/me')
      
      // 检查响应是否成功
      if (response.success) {
        return response
      } else {
        // 如果响应不成功，抛出包含错误信息的异常
        throw new Error(response.message || '账号删除失败')
      }
    } catch (error) {
      console.error('账号删除失败:', error)
      
      // 处理不同类型的错误
      let errorMessage = '账号删除失败，请稍后重试'
      
      if (error.response) {
        // 服务器返回了错误响应
        const responseData = error.response.data
        errorMessage = responseData.message || errorMessage
        console.error('错误响应状态:', error.response.status)
        console.error('错误响应数据:', responseData)
      } else if (error.request) {
        // 请求已发送但没有收到响应
        errorMessage = '服务器无响应，请检查网络连接'
        console.error('没有收到响应:', error.request)
      } else {
        // 请求配置错误
        errorMessage = error.message
        console.error('请求配置错误:', error.message)
      }
      
      // 抛出包含详细错误信息的异常
      throw new Error(errorMessage)
    }
  }
}

export default authApi
