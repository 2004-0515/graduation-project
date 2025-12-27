import axios from '../utils/axios'

/**
 * 商品分类相关API
 */
const categoryApi = {
  /**
   * 获取所有商品分类
   * @returns {Promise}
   */
  getAllCategories() {
    return axios.get('/categories')
  },
  
  /**
   * 根据ID获取商品分类
   * @param {number} id - 分类ID
   * @returns {Promise}
   */
  getCategoryById(id) {
    return axios.get(`/categories/${id}`)
  },
  
  /**
   * 根据父分类ID获取子分类
   * @param {number} parentId - 父分类ID
   * @returns {Promise}
   */
  getCategoriesByParentId(parentId) {
    return axios.get(`/categories/parent/${parentId}`)
  }
}

export default categoryApi
