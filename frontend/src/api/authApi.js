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
    // 直接构建后端可能期望的字段名，不进行复杂转换
    const requestData = {
      // 保留原始数据，同时添加可能的后端字段名
      ...data,
      // 添加可能的后端字段名映射
      nick_name: data.nickname,
      biography: data.bio,
      phone_number: data.phone
    }
    
    // 移除不需要的字段
    delete requestData.username // 用户名不可修改
    
    console.log('准备更新用户信息:', requestData)
    console.log('请求URL:', '/auth/me')
    console.log('请求方法:', 'POST')
    
    try {
      // 3. 直接调用axios，不使用拦截器，以便查看完整的请求和响应
      // 从日志发现后端不支持PUT请求，只支持POST请求
      const fullResponse = await axios({
        method: 'POST',
        url: '/auth/me',
        data: requestData,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        baseURL: 'http://localhost:8080/api'
      })
      
      console.log('完整响应:', fullResponse)
      console.log('响应状态:', fullResponse.status)
      console.log('响应数据:', fullResponse.data)
      
      return fullResponse.data
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
  }
}

export default authApi
