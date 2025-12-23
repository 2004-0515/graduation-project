import axios from '../utils/axios'

/**
 * 认证相关API
 */
const authApi = {
  /**
   * 用户登录
   * @param {Object} data - 登录数据
   * @param {string} data.username - 用户名
   * @param {string} data.password - 密码
   * @returns {Promise}
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
   * @returns {Promise}
   */
  register(data) {
    return axios.post('/auth/register', data)
  },
  
  /**
   * 用户退出登录
   * @returns {Promise}
   */
  logout() {
    return axios.post('/auth/logout')
  },
  
  /**
   * 获取当前用户信息
   * @returns {Promise}
   */
  getCurrentUser() {
    return axios.get('/auth/me')
  }
}

export default authApi
