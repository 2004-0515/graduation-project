import axios from '../utils/axios'

/**
 * 地址相关API
 */
const addressApi = {
  /**
   * 获取用户地址列表
   * @returns {Promise}
   */
  getUserAddresses() {
    return axios.get('/addresses')
  },
  
  /**
   * 添加收货地址
   * @param {Object} addressData - 地址数据
   * @returns {Promise}
   */
  addAddress(addressData) {
    return axios.post('/addresses', addressData)
  },
  
  /**
   * 更新收货地址
   * @param {number} id - 地址ID
   * @param {Object} addressData - 更新的地址数据
   * @returns {Promise}
   */
  updateAddress(id, addressData) {
    return axios.put(`/addresses/${id}`, addressData)
  },
  
  /**
   * 删除收货地址
   * @param {number} id - 地址ID
   * @returns {Promise}
   */
  deleteAddress(id) {
    return axios.delete(`/addresses/${id}`)
  },
  
  /**
   * 设置默认地址
   * @param {number} id - 地址ID
   * @returns {Promise}
   */
  setDefaultAddress(id) {
    return axios.put(`/addresses/${id}/default`)
  }
}

export default addressApi