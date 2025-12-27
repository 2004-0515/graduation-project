import { defineStore } from 'pinia'
import cartApi from '../api/cartApi'
import { ElMessage } from 'element-plus'

/**
 * 购物车状态管理
 */
export const useCartStore = defineStore('cart', {
  state: () => ({
    cartItems: [],
    loading: false,
    error: null
  }),

  getters: {
    /**
     * 获取购物车商品总数
     */
    totalItems: (state) => state.cartItems.reduce((total, item) => total + item.quantity, 0),

    /**
     * 计算选中商品总金额
     */
    totalAmount: (state) => {
      return state.cartItems
        .filter(item => item.selected)
        .reduce((total, item) => total + (item.price * item.quantity), 0)
    },

    /**
     * 获取选中的购物车项
     */
    selectedItems: (state) => state.cartItems.filter(item => item.selected),

    /**
     * 检查商品是否已在购物车中
     */
    isProductInCart: (state) => (productId) => {
      return state.cartItems.some(item => item.productId === productId)
    },

    /**
     * 获取选中商品的数量
     */
    selectedCount: (state) => {
      return state.cartItems
        .filter(item => item.selected)
        .reduce((total, item) => total + item.quantity, 0)
    },

    /**
     * 检查是否全选
     */
    isAllSelected: (state) => {
      return state.cartItems.length > 0 && state.cartItems.every(item => item.selected)
    }
  },
  
  actions: {
    /**
     * 获取用户购物车列表
     */
    async fetchCartItems() {
      this.loading = true
      this.error = null

      try {
        const response = await cartApi.getCart()
        if (response.success) {
          this.cartItems = response.data || []
        }
        return this.cartItems
      } catch (error) {
        this.error = error.message || '获取购物车列表失败'
        console.error('获取购物车列表失败:', error)
        this.cartItems = []
        return []
      } finally {
        this.loading = false
      }
    },
    
    /**
     * 添加商品到购物车
     * @param {number} productId - 商品ID
     * @param {number} quantity - 商品数量
     */
    async addToCart(productId, quantity = 1) {
      this.loading = true
      this.error = null

      try {
        const response = await cartApi.addToCart({ productId, quantity })
        if (response.success) {
          const cartItem = response.data

          // 检查商品是否已在购物车中
          const existingItemIndex = this.cartItems.findIndex(item => item.productId === productId)
          if (existingItemIndex > -1) {
            // 更新现有商品数量
            this.cartItems[existingItemIndex] = cartItem
          } else {
            // 添加新商品到购物车
            this.cartItems.push(cartItem)
          }
        }

        ElMessage.success('商品已添加到购物车')
        return response.data
      } catch (error) {
        this.error = error.message || '添加商品到购物车失败'
        ElMessage.error(this.error)
        console.error('添加商品到购物车失败:', error)
        throw error
      } finally {
        this.loading = false
      }
    },
    
    /**
     * 更新购物车项
     * @param {number} id - 购物车项ID
     * @param {Object} updates - 更新内容
     */
    async updateCartItem(id, updates) {
      this.loading = true
      this.error = null

      try {
        const response = await cartApi.updateCartItem(id, updates)
        if (response.success) {
          const updatedItem = response.data

          if (updatedItem) {
            // 更新成功
            const index = this.cartItems.findIndex(item => item.id === id)
            if (index > -1) {
              this.cartItems[index] = updatedItem
            }
          } else {
            // 数量为0，已删除
            this.cartItems = this.cartItems.filter(item => item.id !== id)
          }
        }

        ElMessage.success('购物车已更新')
        return response.data
      } catch (error) {
        this.error = error.message || '更新购物车失败'
        ElMessage.error(this.error)
        console.error('更新购物车失败:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * 更新购物车项数量
     * @param {number} id - 购物车项ID
     * @param {number} quantity - 新的数量
     */
    async updateQuantity(id, quantity) {
      return this.updateCartItem(id, { quantity })
    },

    /**
     * 选择/取消选择购物车项
     * @param {number} id - 购物车项ID
     * @param {boolean} selected - 是否选中
     */
    async selectItem(id, selected) {
      try {
        await cartApi.selectCartItem(id, selected)

        const index = this.cartItems.findIndex(item => item.id === id)
        if (index > -1) {
          this.cartItems[index].selected = selected
        }
      } catch (error) {
        this.error = error.message || '操作失败'
        ElMessage.error(this.error)
        throw error
      }
    },

    /**
     * 全选/取消全选
     * @param {boolean} selected - 是否全选
     */
    async selectAll(selected) {
      try {
        await cartApi.selectAll(selected)

        this.cartItems.forEach(item => {
          item.selected = selected
        })
      } catch (error) {
        this.error = error.message || '操作失败'
        ElMessage.error(this.error)
        throw error
      }
    },

    /**
     * 从购物车中移除商品
     * @param {number} id - 购物车项ID
     */
    async removeFromCart(id) {
      this.loading = true
      this.error = null

      try {
        await cartApi.deleteCartItem(id)

        // 从本地购物车中移除商品
        this.cartItems = this.cartItems.filter(item => item.id !== id)

        ElMessage.success('商品已从购物车中移除')
        return true
      } catch (error) {
        this.error = error.message || '从购物车中移除商品失败'
        ElMessage.error(this.error)
        console.error('从购物车中移除商品失败:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * 批量删除购物车项
     * @param {Array} ids - 购物车项ID数组
     */
    async batchDelete(ids) {
      this.loading = true
      this.error = null

      try {
        await cartApi.batchDeleteCartItems(ids)

        // 从本地购物车中移除商品
        this.cartItems = this.cartItems.filter(item => !ids.includes(item.id))

        ElMessage.success('商品已从购物车中移除')
        return true
      } catch (error) {
        this.error = error.message || '批量删除失败'
        ElMessage.error(this.error)
        console.error('批量删除失败:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * 清空购物车
     */
    async clearCart() {
      this.loading = true
      this.error = null

      try {
        await cartApi.clearCart()

        // 清空本地购物车数据
        this.cartItems = []

        ElMessage.success('购物车已清空')
        return true
      } catch (error) {
        this.error = error.message || '清空购物车失败'
        ElMessage.error(this.error)
        console.error('清空购物车失败:', error)
        throw error
      } finally {
        this.loading = false
      }
    },
    
    /**
     * 清除错误信息
     */
    clearError() {
      this.error = null
    },

    /**
     * 初始化购物车（在用户登录后调用）
     */
    async initialize() {
      if (this.cartItems.length === 0) {
        await this.fetchCartItems()
      }
    }
  }
})