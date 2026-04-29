import axios from '@/utils/axios'
import { API_PATHS, PAGINATION } from '@/constants'
import type { Order, CreateOrderRequest, ApiResponse } from '@/types'

const orderApi = {
  createOrder(orderData: CreateOrderRequest): Promise<ApiResponse<Order>> {
    return axios.post(API_PATHS.ORDERS.BASE, orderData)
  },

  getOrders(
    pageNo: number = PAGINATION.DEFAULT_PAGE,
    pageSize: number = PAGINATION.DEFAULT_SIZE,
    status?: number
  ): Promise<ApiResponse<Order[]>> {
    const params: Record<string, number | undefined> = {
      page: pageNo - 1,
      size: pageSize
    }
    if (status !== undefined) {
      params.status = status
    }
    return axios.get(API_PATHS.ORDERS.BASE, { params })
  },

  getUserOrders(_userId?: number): Promise<ApiResponse<Order[]>> {
    return axios.get(API_PATHS.ORDERS.BASE)
  },

  getOrderById(id: number): Promise<ApiResponse<Order>> {
    return axios.get(API_PATHS.ORDERS.BY_ID(id))
  },

  cancelOrder(id: number): Promise<ApiResponse<void>> {
    return axios.put(API_PATHS.ORDERS.CANCEL(id))
  },

  requestCancelOrder(id: number): Promise<ApiResponse<void>> {
    return axios.put(`${API_PATHS.ORDERS.BASE}/${id}/request-cancel`)
  },

  payOrder(id: number, paymentMethod: number): Promise<ApiResponse<Order>> {
    return axios.put(API_PATHS.ORDERS.PAY(id), { paymentMethod })
  },

  confirmReceive(id: number): Promise<ApiResponse<void>> {
    return axios.put(`${API_PATHS.ORDERS.BASE}/${id}/confirm`)
  }
}

export default orderApi
