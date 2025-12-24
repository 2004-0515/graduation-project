import { defineStore } from 'pinia'
import cartApi from '../api/cartApi'
import productApi from '../api/productApi'
import orderApi from '../api/orderApi'
import { ElMessage } from 'element-plus'
import { logUtils } from '../utils/logUtils'

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
        logUtils.cartLog('开始获取购物车列表', { userId })
        const response = await cartApi.getCartByUserId(userId)
        logUtils.cartLog('获取购物车列表响应', response)
        // 处理响应数据，考虑axios拦截器返回的响应格式
        let cartItems = []
        if (response.success === true && response.data) {
          // 后端Response类返回的格式：{ success: true, data: [购物车列表] }
          if (Array.isArray(response.data)) {
            cartItems = response.data
          }
        }
        
        logUtils.cartLog('处理后的购物车列表', cartItems)
        this.cartItems = cartItems
        return this.cartItems
      } catch (error) {
        this.error = error.message || '获取购物车列表失败'
        logUtils.cartLog('获取购物车列表失败', error)
        console.error('获取购物车列表失败:', error)
        this.cartItems = []
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
        const response = await cartApi.addToCart(userId, productId, quantity)
        logUtils.cartLog('添加商品到购物车响应', response)
        
        // 处理响应数据，考虑两种情况：
        // 1. 响应是购物车数据本身（axios拦截器直接返回了response.data）
        // 2. 响应是包含code、message、success和data字段的对象（后端标准Response格式）
        let cartItem = response
        if (response.code !== undefined && response.data !== undefined) {
          // 情况2：响应是后端标准Response格式
          if (response.success === true && response.data) {
            cartItem = response.data
          } else {
            // API调用失败
            throw new Error(response.message || '添加商品到购物车失败')
          }
        }
        
        if (cartItem) {
          // 检查商品是否已在购物车中
          const existingItemIndex = this.cartItems.findIndex(item => item.product.id === productId)
          if (existingItemIndex > -1) {
            // 更新现有商品数量
            this.cartItems[existingItemIndex].quantity += quantity
          } else {
            // 添加新商品到购物车
            this.cartItems.push(cartItem)
          }
        }
        
        ElMessage.success('商品已添加到购物车')
        return cartItem
      } catch (error) {
        this.error = error.message || '添加商品到购物车失败'
        logUtils.cartLog('添加商品到购物车失败', error)
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
        const response = await cartApi.updateCartQuantity(id, quantity)
        
        // 处理响应数据，考虑两种情况：
        // 1. 响应是购物车数据本身（axios拦截器直接返回了response.data）
        // 2. 响应是包含code、message、success和data字段的对象（后端标准Response格式）
        let updatedItem = response
        let success = true
        let message = '购物车商品数量已更新'
        
        if (response.code !== undefined && response.data !== undefined) {
          // 情况2：响应是后端标准Response格式
          success = response.success
          message = response.message
          
          if (success) {
            updatedItem = response.data
          } else {
            // API调用失败
            throw new Error(message || '更新购物车商品数量失败')
          }
        } else if (response.data) {
          // axios响应包含data字段
          updatedItem = response.data
        }
        
        // 更新本地购物车数据
        const index = this.cartItems.findIndex(item => item.id === id)
        if (index > -1) {
          if (updatedItem) {
            // 正常更新数量
            this.cartItems[index].quantity = quantity
          } else {
            // 数量为0，移除该商品
            this.cartItems.splice(index, 1)
            message = '购物车商品已移除'
          }
        }
        
        ElMessage.success(message)
        return updatedItem
      } catch (error) {
        this.error = error.message || '更新购物车商品数量失败'
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
    },
    
    /**
     * 根据ID获取商品详情
     * @param {number} productId - 商品ID
     */
    async fetchProductById(productId) {
      this.loading = true
      this.error = null
      
      try {
        const response = await productApi.getProductById(productId)
        return response
      } catch (error) {
        this.error = error.message || '获取商品详情失败'
        console.error('获取商品详情失败:', error)
        throw error
      } finally {
        this.loading = false
      }
    },
    
    /**
     * 创建订单
     * @param {Object} orderData - 订单数据
     */
    async createOrder(orderData) {
      this.loading = true
      this.error = null
      
      try {
        const response = await orderApi.createOrder(orderData)
        return response
      } catch (error) {
        this.error = error.message || '创建订单失败'
        console.error('创建订单失败:', error)
        throw error
      } finally {
        this.loading = false
      }
    }
  }
})