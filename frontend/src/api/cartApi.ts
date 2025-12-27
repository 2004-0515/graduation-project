import axios from '@/utils/axios'
import { API_PATHS } from '@/constants'
import type { CartItem, AddToCartRequest, UpdateCartRequest, ApiResponse } from '@/types'

/**
 * 购物车相关API
 */
const cartApi = {
  /**
   * 获取当前用户购物车列表
   */
  getCart(): Promise<ApiResponse<CartItem[]>> {
    return axios.get(API_PATHS.CART.BASE)
  },

  /**
   * 添加商品到购物车
   */
  addToCart(data: AddToCartRequest): Promise<ApiResponse<CartItem>> {
    return axios.post(API_PATHS.CART.BASE, data)
  },

  /**
   * 更新购物车项
   */
  updateCartItem(id: number, updates: UpdateCartRequest): Promise<ApiResponse<CartItem>> {
    return axios.put(API_PATHS.CART.ITEM(id), updates)
  },

  /**
   * 选择/取消选择购物车项
   */
  selectCartItem(id: number, selected: boolean): Promise<ApiResponse<void>> {
    return axios.put(`${API_PATHS.CART.SELECT(id)}?selected=${selected}`)
  },

  /**
   * 全选/取消全选购物车项
   */
  selectAll(selected: boolean): Promise<ApiResponse<void>> {
    return axios.put(`${API_PATHS.CART.SELECT_ALL}?selected=${selected}`)
  },

  /**
   * 删除购物车项
   */
  deleteCartItem(id: number): Promise<ApiResponse<void>> {
    return axios.delete(API_PATHS.CART.ITEM(id))
  },

  /**
   * 批量删除购物车项
   */
  batchDeleteCartItems(ids: number[]): Promise<ApiResponse<void>> {
    return axios.delete(API_PATHS.CART.BATCH, { data: { ids } })
  },

  /**
   * 清空购物车
   */
  clearCart(): Promise<ApiResponse<void>> {
    return axios.delete(API_PATHS.CART.CLEAR)
  },

  /**
   * 获取购物车商品总数
   */
  getCartItemCount(): Promise<ApiResponse<number>> {
    return axios.get(API_PATHS.CART.COUNT)
  }
}

export default cartApi
