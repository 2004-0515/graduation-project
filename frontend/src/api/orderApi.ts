import axios from '@/utils/axios'
import { API_PATHS, PAGINATION } from '@/constants'
import type { Order, CreateOrderRequest, ApiResponse, PageResponse } from '@/types'

/**
 * 订单相关API
 */
const orderApi = {
  /**
   * 创建订单
   */
  createOrder(orderData: CreateOrderRequest): Promise<ApiResponse<Order>> {
    return axios.post(API_PATHS.ORDERS.BASE, orderData)
  },
  
  /**
   * 获取当前用户订单列表
   */
  getOrders(
    pageNo: number = PAGINATION.DEFAULT_PAGE, 
    pageSize: number = PAGINATION.DEFAULT_SIZE,
    status?: number
  ): Promise<ApiResponse<PageResponse<Order>>> {
    const params: Record<string, number | undefined> = { pageNo, pageSize }
    if (status !== undefined) {
      params.status = status
    }
    return axios.get(API_PATHS.ORDERS.BASE, { params })
  },
  
  /**
   * 获取用户订单列表
   */
  getUserOrders(userId: number): Promise<ApiResponse<Order[]>> {
    return axios.get(`${API_PATHS.ORDERS.BASE}/user/${userId}`)
  },
  
  /**
   * 根据ID获取订单详情
   */
  getOrderById(id: number): Promise<ApiResponse<Order>> {
    return axios.get(API_PATHS.ORDERS.BY_ID(id))
  },
  
  /**
   * 取消订单
   */
  cancelOrder(id: number): Promise<ApiResponse<void>> {
    return axios.put(API_PATHS.ORDERS.CANCEL(id))
  },
  
  /**
   * 支付订单
   */
  payOrder(id: number, paymentMethod: number): Promise<ApiResponse<Order>> {
    return axios.post(API_PATHS.ORDERS.PAY(id), { paymentMethod })
  },
  
  /**
   * 确认收货
   */
  confirmReceive(id: number): Promise<ApiResponse<void>> {
    return axios.put(`${API_PATHS.ORDERS.BASE}/${id}/receive`)
  }
}

export default orderApi
