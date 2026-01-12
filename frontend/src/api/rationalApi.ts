import axios from '@/utils/axios'
import type { ApiResponse } from '@/types'

/**
 * 理性消费助手API
 */
const rationalApi = {
  /**
   * 获取预算状态
   */
  getBudgetStatus(): Promise<ApiResponse<any>> {
    return axios.get('/rational-consumption/budget/status')
  },

  /**
   * 获取当前预算设置
   */
  getCurrentBudget(): Promise<ApiResponse<any>> {
    return axios.get('/rational-consumption/budget')
  },

  /**
   * 设置月度预算
   */
  setBudget(amount: number, alertThreshold?: number): Promise<ApiResponse<any>> {
    return axios.post('/rational-consumption/budget', { amount, alertThreshold })
  },

  /**
   * 获取消费报告
   */
  getReport(period?: string): Promise<ApiResponse<any>> {
    const params = period ? { period } : {}
    return axios.get('/rational-consumption/report', { params })
  },

  /**
   * 检测重复购买
   */
  checkDuplicate(productId: number): Promise<ApiResponse<any[]>> {
    return axios.get(`/rational-consumption/duplicate-check/${productId}`)
  },

  /**
   * 批量检测重复购买
   */
  checkDuplicateBatch(productIds: number[]): Promise<ApiResponse<Record<number, any[]>>> {
    return axios.post('/rational-consumption/duplicate-check/batch', productIds)
  },

  // ==================== 想要清单 ====================

  /**
   * 添加到想要清单
   */
  addToWishlist(productId: number, coolingDays?: number, reason?: string): Promise<ApiResponse<any>> {
    return axios.post('/rational-consumption/wishlist', { productId, coolingDays, reason })
  },

  /**
   * 检查商品是否在想要清单中
   */
  checkInWishlist(productId: number): Promise<ApiResponse<{ inWishlist: boolean }>> {
    return axios.get(`/rational-consumption/wishlist/check/${productId}`)
  },

  /**
   * 获取想要清单
   */
  getWishlist(): Promise<ApiResponse<any[]>> {
    return axios.get('/rational-consumption/wishlist')
  },

  /**
   * 获取想要清单统计
   */
  getWishlistStats(): Promise<ApiResponse<any>> {
    return axios.get('/rational-consumption/wishlist/stats')
  },

  /**
   * 从想要清单移除
   */
  removeFromWishlist(id: number): Promise<ApiResponse<any>> {
    return axios.delete(`/rational-consumption/wishlist/${id}`)
  },

  /**
   * 标记为已购买
   */
  markAsPurchased(id: number): Promise<ApiResponse<any>> {
    return axios.post(`/rational-consumption/wishlist/${id}/purchased`)
  },

  // ==================== 成就系统 ====================

  /**
   * 获取成就列表
   */
  getAchievements(): Promise<ApiResponse<any[]>> {
    return axios.get('/rational-consumption/achievements')
  },

  // ==================== 管理员接口 ====================

  /**
   * 【管理员】获取理性消费统计数据
   */
  getAdminStats(): Promise<ApiResponse<any>> {
    return axios.get('/rational-consumption/admin/stats')
  },

  /**
   * 【管理员】获取全站消费趋势
   */
  getConsumptionTrend(): Promise<ApiResponse<any[]>> {
    return axios.get('/rational-consumption/admin/consumption-trend')
  },

  /**
   * 【管理员】获取最近想要清单活动
   */
  getWishlistActivity(): Promise<ApiResponse<any[]>> {
    return axios.get('/rational-consumption/admin/wishlist-activity')
  },

  /**
   * 【管理员】获取最近成就记录
   */
  getRecentAchievements(): Promise<ApiResponse<any[]>> {
    return axios.get('/rational-consumption/admin/recent-achievements')
  },

  /**
   * 【管理员】手动授予成就
   */
  grantAchievement(userId: number, type: string): Promise<ApiResponse<any>> {
    return axios.post('/rational-consumption/admin/grant-achievement', { userId, type })
  },

  /**
   * 【管理员】撤销成就
   */
  revokeAchievement(userId: number, type: string): Promise<ApiResponse<any>> {
    return axios.post('/rational-consumption/admin/revoke-achievement', { userId, type })
  }
}

export default rationalApi
