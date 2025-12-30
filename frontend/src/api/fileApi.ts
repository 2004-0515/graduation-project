import axios from '@/utils/axios'

/**
 * 文件上传 API
 * 
 * 文件存储结构:
 * uploads/
 * ├── avatars/          # 用户头像
 * ├── products/         # 商品图片
 * ├── categories/       # 分类图片
 * ├── promotions/       # 促销活动图片
 * └── reviews/          # 评价图片
 */

const fileApi = {
  /**
   * 上传用户头像 (最大2MB)
   */
  uploadAvatar(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    return axios.post('/files/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  /**
   * 上传商品图片 (最大5MB)
   * @param file 图片文件
   * @param categoryName 可选的分类名称，用于按分类存储图片
   * @param productId 可选的商品ID，用于审核通过后更新商品图片
   */
  uploadProductImage(file: File, categoryName?: string, productId?: number) {
    const formData = new FormData()
    formData.append('file', file)
    if (categoryName) {
      formData.append('categoryName', categoryName)
    }
    if (productId) {
      formData.append('productId', productId.toString())
    }
    return axios.post('/files/product', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  /**
   * 上传分类图片 (最大2MB)
   */
  uploadCategoryImage(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    return axios.post('/files/category', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  /**
   * 上传促销活动图片 (最大5MB)
   */
  uploadPromotionImage(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    return axios.post('/files/promotion', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  /**
   * 上传评价图片 (最大10MB)
   */
  uploadReviewImage(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    return axios.post('/files/review', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  /**
   * 获取完整的图片URL
   */
  getImageUrl(path: string | undefined | null): string {
    if (!path) return ''
    // 已经是完整URL
    if (path.startsWith('http://') || path.startsWith('https://')) return path
    // 确保路径以/开头
    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    return `http://localhost:8080/api${normalizedPath}`
  }
}

export default fileApi
