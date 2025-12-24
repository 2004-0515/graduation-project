import axios from '../utils/axios'

/**
 * 订单相关API
 */
const orderApi = {
  /**
   * 创建订单
   * @param {Object} orderData - 订单数据
   * @returns {Promise}
   */
  createOrder(orderData) {
    return axios.post('/orders', orderData)
  },
  
  /**
   * 获取订单列表
   * @param {number} userId - 用户ID
   * @param {number} pageNo - 页码（从0开始）
   * @param {number} pageSize - 每页记录数
   * @returns {Promise}
   */
  getOrdersByUserId(userId, pageNo = 0, pageSize = 10) {
    return axios.get(`/orders/user/${userId}`, { params: { pageNo, pageSize } })
  },
  
  /**
   * 根据ID获取订单详情
   * @param {number} id - 订单ID
   * @returns {Promise}
   */
  getOrderById(id) {
    return axios.get(`/orders/${id}`)
  },
  
  /**
   * 取消订单
   * @param {number} id - 订单ID
   * @returns {Promise}
   */
  cancelOrder(id) {
    return axios.put(`/orders/${id}/cancel`)
  },
  
  /**
   * 支付订单
   * @param {number} id - 订单ID
   * @param {string} paymentMethod - 支付方式
   * @returns {Promise}
   */
  payOrder(id, paymentMethod) {
    return axios.post(`/orders/${id}/pay`, { paymentMethod })
  }
}

export default orderApi