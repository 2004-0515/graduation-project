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
    totalItems: (state) => state.cartItems.length,
    
    /**
     * 计算总金额
     */
    totalAmount: (state) => {
      return state.cartItems.reduce((total, item) => {
        return total + (parseFloat(item.product.price) * item.quantity)
      }, 0)
    },
    
    /**
     * 检查商品是否已在购物车中
     */
    isProductInCart: (state) => (productId) => {
      return state.cartItems.some(item => item.product.id === productId)
    }
  },
  
  actions: {
    /**
     * 获取用户购物车列表
     * @param {number} userId - 用户ID
     */
    async fetchCartItems(userId) {
      this.loading = true
      this.error = null
      
      try {
        const cartItems = await cartApi.getCartByUserId(userId)
        this.cartItems = cartItems
        return cartItems
      } catch (error) {
        this.error = error.response?.data?.message || '获取购物车列表失败'
        console.error('获取购物车列表失败:', error)
        return []
      } finally {
        this.loading = false
      }
    },
    
    /**
     * 添加商品到购物车
     * @param {number} userId - 用户ID
     * @param {number} productId - 商品ID
     * @param {number} quantity - 商品数量
     */
    async addToCart(userId, productId, quantity) {
      this.loading = true
      this.error = null
      
      try {
        const cartItem = await cartApi.addToCart(userId, productId, quantity)
        
        // 检查商品是否已在购物车中
        const existingItemIndex = this.cartItems.findIndex(item => item.product.id === productId)
        if (existingItemIndex > -1) {
          // 更新现有商品数量
          this.cartItems[existingItemIndex].quantity += quantity
        } else {
          // 添加新商品到购物车
          this.cartItems.push(cartItem)
        }
        
        ElMessage.success('商品已添加到购物车')
        return cartItem
      } catch (error) {
        this.error = error.response?.data?.message || '添加商品到购物车失败'
        ElMessage.error(this.error)
        console.error('添加商品到购物车失败:', error)
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
    async updateCartQuantity(id, quantity) {
      this.loading = true
      this.error = null
      
      try {
        const updatedItem = await cartApi.updateCartQuantity(id, quantity)
        
        // 更新本地购物车数据
        const index = this.cartItems.findIndex(item => item.id === id)
        if (index > -1) {
          this.cartItems[index] = updatedItem
        }
        
        ElMessage.success('购物车商品数量已更新')
        return updatedItem
      } catch (error) {
        this.error = error.response?.data?.message || '更新购物车商品数量失败'
        ElMessage.error(this.error)
        console.error('更新购物车商品数量失败:', error)
        throw error
      } finally {
        this.loading = false
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
        await cartApi.removeFromCart(id)
        
        // 从本地购物车中移除商品
        this.cartItems = this.cartItems.filter(item => item.id !== id)
        
        ElMessage.success('商品已从购物车中移除')
        return true
      } catch (error) {
        this.error = error.response?.data?.message || '从购物车中移除商品失败'
        ElMessage.error(this.error)
        console.error('从购物车中移除商品失败:', error)
        throw error
      } finally {
        this.loading = false
      }
    },
    
    /**
     * 清空用户购物车
     * @param {number} userId - 用户ID
     */
    async clearCart(userId) {
      this.loading = true
      this.error = null
      
      try {
        await cartApi.clearCart(userId)
        
        // 清空本地购物车数据
        this.cartItems = []
        
        ElMessage.success('购物车已清空')
        return true
      } catch (error) {
        this.error = error.response?.data?.message || '清空购物车失败'
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
    }
  }
})