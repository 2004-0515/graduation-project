import axios from '@/utils/axios'
import type { ApiResponse } from '@/types'

/**
 * 通知设置接口
 */
export interface NotificationSettings {
  id?: number
  userId?: number
  orderStatusEnabled: boolean
  deliveryEnabled: boolean
  promotionsEnabled: boolean
  newProductsEnabled: boolean
  systemEnabled: boolean
  inAppEnabled: boolean
  emailEnabled: boolean
  smsEnabled: boolean
  notificationFrequency: string
  notifyStartTime: number
  notifyEndTime: number
}

/**
 * 隐私设置接口
 */
export interface PrivacySettings {
  id?: number
  userId?: number
  profileVisibility: string
}

/**
 * 安全设置接口
 */
export interface SecuritySettings {
  id?: number
  userId?: number
  passwordLastChanged?: string
}

/**
 * 修改密码请求
 */
export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

/**
 * 设置相关API
 */
const settingsApi = {
  /**
   * 获取当前用户通知设置
   */
  getNotificationSettings(): Promise<ApiResponse<NotificationSettings>> {
    return axios.get('/notification-settings/me')
  },

  /**
   * 更新通知设置
   */
  updateNotificationSettings(settings: NotificationSettings): Promise<ApiResponse<NotificationSettings>> {
    return axios.put('/notification-settings/me', settings)
  },

  /**
   * 获取当前用户隐私设置
   */
  getPrivacySettings(): Promise<ApiResponse<PrivacySettings>> {
    return axios.get('/privacy-settings/me')
  },

  /**
   * 更新隐私设置
   */
  updatePrivacySettings(settings: PrivacySettings): Promise<ApiResponse<PrivacySettings>> {
    return axios.put('/privacy-settings/me', settings)
  },

  /**
   * 获取当前用户安全设置
   */
  getSecuritySettings(): Promise<ApiResponse<SecuritySettings>> {
    return axios.get('/security-settings/me')
  },

  /**
   * 修改密码
   */
  changePassword(data: ChangePasswordRequest): Promise<ApiResponse<void>> {
    return axios.post('/auth/change-password', data)
  }
}

export default settingsApi
