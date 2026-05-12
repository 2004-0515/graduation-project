import { defineStore } from 'pinia'
import cartApi from '@/api/cartApi'
import { ElMessage } from 'element-plus'
import type { CartItem, ApiResponse } from '@/types'
import { debugError } from '@/utils/debug'

interface CartState {
  items: CartItem[]
  loading: boolean
  error: string | null
}

const getResponseMessage = (response: ApiResponse<unknown> | undefined, fallback: string): string =>
  response?.message || fallback

const createBusinessError = (response: ApiResponse<unknown> | undefined, fallback: string): Error =>
  new Error(getResponseMessage(response, fallback))

const isSuccessfulResponse = (response: ApiResponse<unknown> | undefined): boolean =>
  response?.code === 200

let latestFetchCartRequestId = 0
const invalidateFetchCartRequests = () => {
  latestFetchCartRequestId += 1
}

/**
 * 购物车状态管理
 */
export const useCartStore = defineStore('cart', {
  state: (): CartState => ({
    items: [],
    loading: false,
    error: null
  }),

  getters: {
    /**
     * 获取购物车商品种类数（不同商品的数量）
     */
    totalItems: (state): number => state.items.length,

    /**
     * 获取购物车商品总数量（所有商品数量之和）
     */
    totalQuantity: (state): number => 
      state.items.reduce((total, item) => total + item.quantity, 0),

    /**
     * 计算选中商品总金额
     */
    totalAmount: (state): number => 
      state.items
        .filter(item => item.selected)
        .reduce((total, item) => total + (item.price * item.quantity), 0),

    /**
     * 获取选中的购物车项
     */
    selectedItems: (state): CartItem[] => 
      state.items.filter(item => item.selected),

    /**
     * 检查商品是否已在购物车中
     */
    isProductInCart: (state) => (productId: number): boolean => 
      state.items.some(item => item.productId === productId),

    /**
     * 获取选中商品的数量
     */
    selectedCount: (state): number => 
      state.items
        .filter(item => item.selected)
        .reduce((total, item) => total + item.quantity, 0),

    /**
     * 检查是否全选
     */
    isAllSelected: (state): boolean => 
      state.items.length > 0 && state.items.every(item => item.selected)
  },
  
  actions: {
    /**
     * 获取用户购物车列表
     */
    async fetchCart(_userId?: number): Promise<CartItem[]> {
      const requestId = ++latestFetchCartRequestId
      this.loading = true
      this.error = null

      try {
        const response = await cartApi.getCart() as ApiResponse<CartItem[]>
        if (requestId !== latestFetchCartRequestId) {
          return this.items
        }
        if (isSuccessfulResponse(response)) {
          this.items = response.data || []
        } else {
          throw createBusinessError(response, '获取购物车列表失败')
        }
        return this.items
      } catch (error: unknown) {
        if (requestId !== latestFetchCartRequestId) {
          return this.items
        }
        const errorMessage = error instanceof Error ? error.message : '获取购物车列表失败'
        this.error = errorMessage
        debugError('获取购物车列表失败:', error)
        this.items = []
        return []
      } finally {
        if (requestId === latestFetchCartRequestId) {
          this.loading = false
        }
      }
    },
    
    /**
     * 添加商品到购物车
     */
    async addToCart(_userId: number | undefined, productId: number, quantity: number = 1): Promise<CartItem> {
      this.loading = true
      this.error = null

      try {
        const response = await cartApi.addToCart({ productId, quantity }) as ApiResponse<CartItem>
        if (isSuccessfulResponse(response)) {
          const cartItem = response.data
          invalidateFetchCartRequests()

          // 检查商品是否已在购物车中
          const existingItemIndex = this.items.findIndex(item => item.productId === productId)
          if (existingItemIndex > -1) {
            this.items[existingItemIndex] = cartItem
          } else {
            this.items.push(cartItem)
          }
        } else {
          throw createBusinessError(response, '添加商品到购物车失败')
        }

        ElMessage.success('商品已添加到购物车')
        return response.data
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : '添加商品到购物车失败'
        this.error = errorMessage
        ElMessage.error(this.error)
        debugError('添加商品到购物车失败:', error)
        throw error
      } finally {
        this.loading = false
      }
    },
    
    /**
     * 更新购物车项
     */
    async updateCartItem(id: number, quantityOrUpdates: number | { quantity?: number; selected?: boolean }): Promise<CartItem | null> {
      this.loading = true
      this.error = null

      const updates = typeof quantityOrUpdates === 'number' 
        ? { quantity: quantityOrUpdates } 
        : quantityOrUpdates

      try {
        const response = await cartApi.updateCartItem(id, updates) as ApiResponse<CartItem>
        if (isSuccessfulResponse(response)) {
          const updatedItem = response.data
          invalidateFetchCartRequests()

          if (updatedItem) {
            const index = this.items.findIndex(item => item.id === id)
            if (index > -1) {
              this.items[index] = updatedItem
            }
          } else {
            // 数量为0，已删除
            this.items = this.items.filter(item => item.id !== id)
          }
        } else {
          throw createBusinessError(response, '更新购物车失败')
        }

        return response.data
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : '更新购物车失败'
        this.error = errorMessage
        ElMessage.error(this.error)
        debugError('更新购物车失败:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * 更新购物车项数量
     */
    async updateQuantity(id: number, quantity: number): Promise<CartItem | null> {
      return this.updateCartItem(id, { quantity })
    },

    /**
     * 选择/取消选择购物车项
     */
    async selectItem(id: number, selected: boolean): Promise<void> {
      try {
        const response = await cartApi.selectCartItem(id, selected)
        if (!isSuccessfulResponse(response)) {
          throw createBusinessError(response, '操作失败')
        }
        invalidateFetchCartRequests()

        const index = this.items.findIndex(item => item.id === id)
        if (index > -1) {
          this.items[index].selected = selected
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : '操作失败'
        this.error = errorMessage
        ElMessage.error(this.error)
        debugError('切换购物车选中状态失败:', error)
        throw error
      }
    },

    /**
     * 全选/取消全选
     */
    async selectAll(selected: boolean): Promise<void> {
      try {
        const response = await cartApi.selectAll(selected)
        if (!isSuccessfulResponse(response)) {
          throw createBusinessError(response, '操作失败')
        }
        invalidateFetchCartRequests()

        this.items.forEach(item => {
          item.selected = selected
        })
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : '操作失败'
        this.error = errorMessage
        ElMessage.error(this.error)
        debugError('批量切换购物车选中状态失败:', error)
        throw error
      }
    },

    /**
     * 从购物车中移除商品
     */
    async removeFromCart(id: number): Promise<boolean> {
      this.loading = true
      this.error = null

      try {
        const response = await cartApi.deleteCartItem(id)
        if (!isSuccessfulResponse(response)) {
          throw createBusinessError(response, '从购物车中移除商品失败')
        }
        invalidateFetchCartRequests()
        this.items = this.items.filter(item => item.id !== id)

        return true
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : '从购物车中移除商品失败'
        this.error = errorMessage
        ElMessage.error(this.error)
        debugError('从购物车中移除商品失败:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * 批量删除购物车项
     */
    async batchDelete(ids: number[], options?: { silentSuccess?: boolean }): Promise<boolean> {
      this.loading = true
      this.error = null

      try {
        const response = await cartApi.batchDeleteCartItems(ids)
        if (!isSuccessfulResponse(response)) {
          throw createBusinessError(response, '批量删除失败')
        }
        invalidateFetchCartRequests()
        this.items = this.items.filter(item => !ids.includes(item.id))

        if (!options?.silentSuccess) {
          ElMessage.success('商品已从购物车中移除')
        }
        return true
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : '批量删除失败'
        this.error = errorMessage
        ElMessage.error(this.error)
        debugError('批量删除失败:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * 清空购物车
     */
    async clearCart(): Promise<boolean> {
      this.loading = true
      this.error = null

      try {
        const response = await cartApi.clearCart()
        if (!isSuccessfulResponse(response)) {
          throw createBusinessError(response, '清空购物车失败')
        }
        invalidateFetchCartRequests()
        this.items = []

        ElMessage.success('购物车已清空')
        return true
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : '清空购物车失败'
        this.error = errorMessage
        ElMessage.error(this.error)
        debugError('清空购物车失败:', error)
        throw error
      } finally {
        this.loading = false
      }
    },
    
    /**
     * 清除错误信息
     */
    clearError(): void {
      this.error = null
    },

    /**
     * 初始化购物车
     */
    async initialize(): Promise<void> {
      if (this.items.length === 0) {
        await this.fetchCart()
      }
    }
  }
})
