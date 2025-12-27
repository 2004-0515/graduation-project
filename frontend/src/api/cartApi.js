import axios from '../utils/axios'

/**
 * 购物车相关API
 */
const cartApi = {
  /**
   * 获取当前用户购物车列表
   * @returns {Promise}
   */
  getCart() {
    return axios.get('/cart')
  },

  /**
   * 添加商品到购物车
   * @param {Object} data - 包含productId和quantity的对象
   * @returns {Promise}
   */
  addToCart(data) {
    return axios.post('/cart', data)
  },

  /**
   * 更新购物车项
   * @param {number} id - 购物车项ID
   * @param {Object} updates - 更新内容
   * @returns {Promise}
   */
  updateCartItem(id, updates) {
    return axios.put(`/cart/${id}`, updates)
  },

  /**
   * 选择/取消选择购物车项
   * @param {number} id - 购物车项ID
   * @param {boolean} selected - 是否选中
   * @returns {Promise}
   */
  selectCartItem(id, selected) {
    return axios.put(`/cart/${id}/select?selected=${selected}`)
  },

  /**
   * 全选/取消全选购物车项
   * @param {boolean} selected - 是否全选
   * @returns {Promise}
   */
  selectAll(selected) {
    return axios.put(`/cart/select-all?selected=${selected}`)
  },

  /**
   * 删除购物车项
   * @param {number} id - 购物车项ID
   * @returns {Promise}
   */
  deleteCartItem(id) {
    return axios.delete(`/cart/${id}`)
  },

  /**
   * 批量删除购物车项
   * @param {Array} ids - 购物车项ID数组
   * @returns {Promise}
   */
  batchDeleteCartItems(ids) {
    return axios.delete('/cart/batch', { data: { ids } })
  },

  /**
   * 清空购物车
   * @returns {Promise}
   */
  clearCart() {
    return axios.delete('/cart/clear')
  },

  /**
   * 获取购物车商品总数
   * @returns {Promise}
   */
  getCartItemCount() {
    return axios.get('/cart/count')
  }
}

export default cartApi