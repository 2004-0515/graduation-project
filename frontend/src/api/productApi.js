import axios from '../utils/axios'

/**
 * 商品相关API
 */
const productApi = {
  /**
   * 获取商品列表
   * @param {number} pageNo - 页码（从0开始）
   * @param {number} pageSize - 每页记录数
   * @returns {Promise}
   */
  getProducts(pageNo = 0, pageSize = 10) {
    return axios.get('/products', { params: { pageNo, pageSize } })
  },
  
  /**
   * 根据ID获取商品详情
   * @param {number} id - 商品ID
   * @returns {Promise}
   */
  getProductById(id) {
    return axios.get(`/products/${id}`)
  },
  
  /**
   * 根据分类ID获取商品列表
   * @param {number} categoryId - 分类ID
   * @returns {Promise}
   */
  getProductsByCategoryId(categoryId) {
    return axios.get(`/products/category/${categoryId}`)
  },
  
  /**
   * 根据名称搜索商品
   * @param {string} name - 商品名称
   * @returns {Promise}
   */
  searchProductsByName(name) {
    return axios.get('/products/search', { params: { name } })
  }
}

export default productApi
