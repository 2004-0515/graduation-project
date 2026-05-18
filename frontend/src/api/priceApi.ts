import axios from '@/utils/axios'
import type { ApiResponse } from '@/types'

/**
 * 价格历史记录
 */
export interface PriceHistory {
  id: number
  productId: number
  price: number
  originalPrice: number | null
  recordedTime: string
  changeType: 'INITIAL' | 'INCREASE' | 'DECREASE' | 'UNCHANGED'
  changeAmount: number | null
  changeRate: number | null
}

/**
 * 价格统计信息
 */
export interface PriceStats {
  currentPrice: number
  lowestPrice: number
  highestPrice: number
  avgPrice: number
  recordCount: number
  pricePosition: number
  isLowestPrice: boolean
}

/**
 * 降价提醒
 */
export interface PriceAlert {
  id: number
  userId: number
  productId: number
  targetPrice: number
  currentPrice: number
  status: number // 0-监控中, 1-已触发, 2-已取消
  triggeredTime: string | null
  triggeredPrice: number | null
  notified: boolean
  createdTime: string
  updatedTime: string
}

export interface PriceAlertDetail extends PriceAlert {
  productName?: string
  productImage?: string
  productPrice?: number
}

export interface AdminPriceAlert extends PriceAlert {
  username?: string
  productName?: string
}

/**
 * 价格相关API
 */
const priceApi = {
  /**
   * 获取商品价格历史
   */
  getPriceHistory(productId: number): Promise<ApiResponse<PriceHistory[]>> {
    return axios.get(`/price/history/${productId}`)
  },

  /**
   * 获取指定时间范围内的价格历史
   */
  getPriceHistoryInRange(productId: number, startTime?: string, endTime?: string): Promise<ApiResponse<PriceHistory[]>> {
    const params: Record<string, string> = {}
    if (startTime) params.startTime = startTime
    if (endTime) params.endTime = endTime
    return axios.get(`/price/history/${productId}/range`, { params })
  },

  /**
   * 获取价格统计信息
   */
  getPriceStats(productId: number): Promise<ApiResponse<PriceStats>> {
    return axios.get(`/price/stats/${productId}`)
  },

  /**
   * 获取后台降价提醒列表
   */
  getAdminAlerts(params?: { status?: number | string; keyword?: string }): Promise<ApiResponse<AdminPriceAlert[]>> {
    return axios.get('/price/admin/alerts', { params: params || {} })
  },

  /**
   * 获取后台激活降价提醒数量
   */
  getAdminActiveAlertCount(): Promise<ApiResponse<number>> {
    return axios.get('/price/admin/alerts/count')
  },

  /**
   * 后台手动记录商品价格
   */
  recordAdminPrice(data: { productId: number; price: number; originalPrice: number | null }): Promise<ApiResponse<PriceHistory>> {
    return axios.post('/price/admin/record', data)
  },

  /**
   * 删除后台价格历史记录
   */
  deleteAdminPriceHistory(historyId: number): Promise<ApiResponse<void>> {
    return axios.delete(`/price/admin/history/${historyId}`)
  },

  /**
   * 后台手动触发降价提醒
   */
  triggerAdminAlert(alertId: number): Promise<ApiResponse<void>> {
    return axios.post(`/price/admin/alert/${alertId}/trigger`)
  },

  /**
   * 后台回退降价提醒
   */
  resetAdminAlert(alertId: number): Promise<ApiResponse<void>> {
    return axios.post(`/price/admin/alert/${alertId}/reset`)
  },

  /**
   * 后台删除降价提醒
   */
  deleteAdminAlert(alertId: number): Promise<ApiResponse<void>> {
    return axios.delete(`/price/admin/alert/${alertId}`)
  },

  /**
   * 创建降价提醒
   */
  createAlert(productId: number, targetPrice: number): Promise<ApiResponse<PriceAlert>> {
    return axios.post('/price/alert', { productId, targetPrice })
  },

  /**
   * 取消降价提醒
   */
  cancelAlert(productId: number): Promise<ApiResponse<void>> {
    return axios.delete(`/price/alert/${productId}`)
  },

  /**
   * 删除降价提醒记录
   */
  deleteAlertRecord(productId: number): Promise<ApiResponse<void>> {
    return axios.delete(`/price/alert/${productId}/record`)
  },

  /**
   * 获取用户的降价提醒列表
   */
  getUserAlerts(): Promise<ApiResponse<PriceAlert[]>> {
    return axios.get('/price/alerts')
  },

  /**
   * 获取带商品信息的降价提醒列表
   */
  getUserAlertDetails(): Promise<ApiResponse<PriceAlertDetail[]>> {
    return axios.get('/price/alerts/detail')
  },

  /**
   * 获取用户对某商品的降价提醒
   */
  getUserProductAlert(productId: number): Promise<ApiResponse<PriceAlert | null>> {
    return axios.get(`/price/alert/${productId}`)
  },

  /**
   * 检查用户是否已设置某商品的降价提醒
   */
  hasActiveAlert(productId: number): Promise<ApiResponse<boolean>> {
    return axios.get(`/price/alert/${productId}/exists`)
  }
}

export default priceApi
