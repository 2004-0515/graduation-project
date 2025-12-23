import axios from '../utils/axios'

/**
 * 购物车相关API
 */
const cartApi = {
  /**
   * 获取用户购物车列表
   * @param {number} userId - 用户ID
   * @returns {Promise}
   */
  getCartByUserId(userId) {
    return axios.get(`/cart/user/${userId}`)
  },
  
  /**
   * 添加商品到购物车
   * @param {number} userId - 用户ID
   * @param {number} productId - 商品ID
   * @param {number} quantity - 商品数量
   * @returns {Promise}
   */
  addToCart(userId, productId, quantity) {
    return axios.post('/cart', { userId, productId, quantity })
  },
  
  /**
   * 更新购物车项数量
   * @param {number} id - 购物车项ID
   * @param {number} quantity - 新的数量
   * @returns {Promise}
   */
  updateCartQuantity(id, quantity) {
    return axios.put(`/cart/${id}`, { quantity })
  },
  
  /**
   * 删除购物车项
   * @param {number} id - 购物车项ID
   * @returns {Promise}
   */
  removeFromCart(id) {
    return axios.delete(`/cart/${id}`)
  },
  
  /**
   * 清空用户购物车
   * @param {number} userId - 用户ID
   * @returns {Promise}
   */
  clearCart(userId) {
    return axios.delete(`/cart/user/${userId}`)
  },
  
  /**
   * 获取用户购物车商品总数
   * @param {number} userId - 用户ID
   * @returns {Promise}
   */
  getCartItemCount(userId) {
    return axios.get(`/cart/count/${userId}`)
  }
}

export default cartApi