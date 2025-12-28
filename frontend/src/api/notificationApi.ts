import axios from '@/utils/axios'
import type { ApiResponse } from '@/types'

export interface Notification {
  id: number
  type: string
  title: string
  message: string
  read: boolean
  relatedId?: number
  createdTime: string
  timeAgo: string
}

const notificationApi = {
  /**
   * 获取通知列表
   */
  getNotifications(type?: string): Promise<ApiResponse<Notification[]>> {
    const params = type && type !== 'all' ? { type } : {}
    return axios.get('/notifications', { params })
  },

  /**
   * 获取未读数量
   */
  getUnreadCount(): Promise<ApiResponse<number>> {
    return axios.get('/notifications/unread-count')
  },

  /**
   * 标记单条为已读
   */
  markAsRead(id: number): Promise<ApiResponse<void>> {
    return axios.put(`/notifications/${id}/read`)
  },

  /**
   * 标记全部已读
   */
  markAllAsRead(): Promise<ApiResponse<void>> {
    return axios.put('/notifications/read-all')
  },

  /**
   * 删除单条通知
   */
  deleteNotification(id: number): Promise<ApiResponse<void>> {
    return axios.delete(`/notifications/${id}`)
  },

  /**
   * 清空所有通知
   */
  clearAll(): Promise<ApiResponse<void>> {
    return axios.delete('/notifications/clear')
  }
}

export default notificationApi
