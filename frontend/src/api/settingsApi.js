import axios from '../utils/axios'

/**
 * 设置相关API
 */
const settingsApi = {
  /**
   * 获取当前用户的安全设置
   * @returns {Promise<{success: boolean, data: Object, message?: string}>}
   */
  async getSecuritySettings() {
    try {
      const response = await axios.get('/api/security-settings/me')
      return response
    } catch (error) {
      console.error('获取安全设置失败:', error)
      throw error
    }
  },


  /**
   * 获取当前用户的隐私设置
   * @returns {Promise<{success: boolean, data: Object, message?: string}>}
   */
  async getPrivacySettings() {
    try {
      const response = await axios.get('/api/privacy-settings/me')
      return response
    } catch (error) {
      console.error('获取隐私设置失败:', error)
      throw error
    }
  },

  /**
   * 更新当前用户的隐私设置
   * @param {Object} settings - 隐私设置
   * @returns {Promise<{success: boolean, data: Object, message?: string}>}
   */
  async updatePrivacySettings(settings) {
    try {
      const response = await axios.put('/api/privacy-settings/me', settings)
      return response
    } catch (error) {
      console.error('更新隐私设置失败:', error)
      throw error
    }
  },

  /**
   * 获取当前用户的通知设置
   * @returns {Promise<{success: boolean, data: Object, message?: string}>}
   */
  async getNotificationSettings() {
    try {
      const response = await axios.get('/api/notification-settings/me')
      return response
    } catch (error) {
      console.error('获取通知设置失败:', error)
      throw error
    }
  },

  /**
   * 更新当前用户的通知设置
   * @param {Object} settings - 通知设置
   * @returns {Promise<{success: boolean, data: Object, message?: string}>}
   */
  async updateNotificationSettings(settings) {
    try {
      const response = await axios.put('/api/notification-settings/me', settings)
      return response
    } catch (error) {
      console.error('更新通知设置失败:', error)
      throw error
    }
  }
}

export default settingsApi
