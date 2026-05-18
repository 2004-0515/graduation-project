import axios from '@/utils/axios'
import type { ApiResponse, PageResponse, User, Product, Order, Category } from '@/types'

/**
 * 管理员API
 */
const adminApi = {
  // ==================== 用户管理 ====================
  
  /**
   * 获取用户列表
   */
  getUsers(params?: { page?: number; size?: number; keyword?: string; status?: number }): Promise<ApiResponse<PageResponse<User>>> {
    return axios.get('/users', { params: { pageNo: params?.page || 0, pageSize: params?.size || 10, ...params } })
  },

  /**
   * 更新用户状态
   */
  updateUserStatus(userId: number, status: number): Promise<ApiResponse<void>> {
    return axios.put(`/users/${userId}/status`, { status })
  },

  /**
   * 更新用户角色
   */
  updateUserRole(userId: number, role: User['role']): Promise<ApiResponse<User>> {
    return axios.put(`/users/${userId}/role`, { role })
  },

  /**
   * 删除用户
   */
  deleteUser(userId: number): Promise<ApiResponse<void>> {
    return axios.delete(`/users/${userId}`)
  },

  // ==================== 商品管理 ====================

  /**
   * 获取商品列表（管理后台）
   */
  getProducts(params?: { page?: number; size?: number; keyword?: string; categoryId?: number; status?: number; sort?: string }): Promise<ApiResponse<PageResponse<Product>>> {
    return axios.get('/products', { params: { pageNo: params?.page || 0, pageSize: params?.size || 10, admin: true, ...params } })
  },

  /**
   * 创建商品
   */
  createProduct(data: Partial<Product>): Promise<ApiResponse<Product>> {
    return axios.post('/products', data)
  },

  /**
   * 更新商品
   */
  updateProduct(id: number, data: Partial<Product>): Promise<ApiResponse<Product>> {
    return axios.put(`/products/${id}`, data)
  },

  /**
   * 删除商品
   */
  deleteProduct(id: number): Promise<ApiResponse<void>> {
    return axios.delete(`/products/${id}`)
  },

  /**
   * 更新商品状态（上架/下架）
   */
  updateProductStatus(id: number, status: number): Promise<ApiResponse<void>> {
    return axios.put(`/products/${id}`, { status })
  },

  // ==================== 分类管理 ====================

  /**
   * 获取分类列表
   */
  getCategories(): Promise<ApiResponse<Category[]>> {
    return axios.get('/categories')
  },

  /**
   * 创建分类
   */
  createCategory(data: Partial<Category>): Promise<ApiResponse<Category>> {
    return axios.post('/categories', data)
  },

  /**
   * 更新分类
   */
  updateCategory(id: number, data: Partial<Category>): Promise<ApiResponse<Category>> {
    return axios.put(`/categories/${id}`, data)
  },

  /**
   * 删除分类
   */
  deleteCategory(id: number): Promise<ApiResponse<void>> {
    return axios.delete(`/categories/${id}`)
  },

  // ==================== 订单管理 ====================

  /**
   * 获取所有订单
   */
  getAllOrders(params?: { page?: number; size?: number; status?: number; keyword?: string }): Promise<ApiResponse<PageResponse<Order>>> {
    const queryParams: any = { page: params?.page || 0, size: params?.size || 10 }
    // 只有当 status 是数字类型时才添加到参数中（排除 undefined 和非数字）
    if (typeof params?.status === 'number') {
      queryParams.status = params.status
    }
    return axios.get('/orders/admin', { params: queryParams })
  },

  /**
   * 更新订单状态
   */
  updateOrderStatus(orderId: number, status: number): Promise<ApiResponse<void>> {
    return axios.put(`/orders/${orderId}/status`, { status })
  },

  /**
   * 发货
   */
  shipOrder(orderId: number): Promise<ApiResponse<void>> {
    return axios.put(`/orders/${orderId}/ship`)
  },
  
  /**
   * 审核取消申请
   */
  reviewCancelRequest(orderId: number, approved: boolean): Promise<ApiResponse<void>> {
    return axios.put(`/orders/${orderId}/review-cancel`, { approved })
  },

  /**
   * 删除订单（仅限已完成或已取消的订单）
   */
  deleteOrder(orderId: number): Promise<ApiResponse<void>> {
    return axios.delete(`/orders/${orderId}/admin`)
  },

  // ==================== 统计数据 ====================

  /**
   * 获取仪表盘统计数据
   */
  getDashboardStats(): Promise<ApiResponse<{
    totalUsers: number
    totalProducts: number
    totalOrders: number
    totalRevenue: number
    todayOrders: number
    todayRevenue: number
    pendingOrders: number
    lowStockProducts: number
    salesTrend: Array<{ date: string; revenue: number; orderCount: number }>
    orderStatusDistribution: Array<{ status: number; count: number }>
    topCategories: Array<{ categoryName: string; sales: number }>
    recentOrders: Order[]
  }>> {
    return axios.get('/admin/stats')
  },

  /**
   * 获取待审核文件数量
   */
  getPendingFileCount(): Promise<ApiResponse<number>> {
    return axios.get('/files/pending/count')
  },

  /**
   * 获取待审核商品数量
   */
  getPendingProductCount(): Promise<ApiResponse<number>> {
    return axios.get('/products/pending/count')
  },

  /**
   * 获取待审核商品列表
   */
  getPendingProducts(): Promise<ApiResponse<Product[]>> {
    return axios.get('/products/pending')
  },

  /**
   * 批量更新全部商品上下架状态
   */
  batchUpdateAllProductStatus(status: number): Promise<ApiResponse<void>> {
    return axios.put('/products/batch-status', { status })
  },

  /**
   * 审核商品
   */
  reviewProduct(
    productId: number,
    data: { auditStatus: number; remark?: string; adVideoEnabled?: number; adVideoDuration?: number }
  ): Promise<ApiResponse<void>> {
    return axios.post(`/products/${productId}/audit`, data)
  },

  /**
   * 获取待审核取消申请数量
   */
  getPendingOrderCount(): Promise<ApiResponse<number>> {
    return axios.get('/orders/cancel-requests/count')
  },

  // ==================== 消息通知 ====================

  /**
   * 发送通知给指定用户
   */
  sendNotification(data: { userId: number; type: string; title: string; message: string }): Promise<ApiResponse<void>> {
    return axios.post('/notifications/admin/send', data)
  },

  /**
   * 发送通知给多个用户
   */
  broadcastNotification(data: { userIds: number[]; type: string; title: string; message: string; relatedId?: number }): Promise<ApiResponse<void>> {
    return axios.post('/notifications/admin/broadcast', data)
  },
  
  /**
   * 重置用户的优惠券领取记录
   */
  resetUserCoupons(userId: number, couponId?: number): Promise<ApiResponse<number>> {
    return axios.post('/coupons/admin/reset-user-coupon', { userId, couponId })
  },

  getContactMessages(): Promise<ApiResponse<Array<{
    id: number
    name: string
    contact: string
    type: string
    content: string
    status: string
    createdTime: string
  }>>> {
    return axios.get('/contact-messages/admin')
  },

  updateContactMessageStatus(id: number, status: 'pending' | 'handled'): Promise<ApiResponse<void>> {
    return axios.put(`/contact-messages/admin/${id}/status`, { status })
  },

  deleteContactMessage(id: number): Promise<ApiResponse<void>> {
    return axios.delete(`/contact-messages/admin/${id}`)
  }
}

export default adminApi
