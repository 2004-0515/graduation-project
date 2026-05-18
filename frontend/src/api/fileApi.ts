import axios from '@/utils/axios'
import type { ApiResponse, PageResponse } from '@/types'

export interface FileReviewRecord {
  id: number
  filePath: string
  originalName: string
  fileType: string
  username: string
  status: number
  createdTime: string
  reviewerName?: string
  reviewRemark?: string
}

export interface FileReviewQuery {
  pageNo: number
  pageSize: number
  status?: number
  fileType?: string
}

/**
 * 文件上传 API
 * 
 * 文件存储结构:
 * uploads/
 * ├── avatars/          # 用户头像
 * ├── products/         # 商品图片
 * ├── banners/          # 展示内容图片
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
   * 上传展示内容图片 (最大5MB)
   */
  uploadBannerImage(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    return axios.post('/files/banner', formData, {
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
   * 上传广告视频 (最大50MB)
   */
  uploadAdVideo(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    return axios.post('/files/ad-video', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  /**
   * 获取文件审核列表
   */
  getPendingFiles(params: FileReviewQuery): Promise<ApiResponse<PageResponse<FileReviewRecord>>> {
    return axios.get('/files/pending', { params })
  },

  /**
   * 审核文件
   */
  reviewFile(fileId: number, status: number, remark: string): Promise<ApiResponse<void>> {
    return axios.put(`/files/${fileId}/review`, { status, remark })
  },

  /**
   * 删除文件审核记录
   */
  deleteFile(fileId: number): Promise<ApiResponse<void>> {
    return axios.delete(`/files/${fileId}`)
  },

  /**
   * 获取完整的图片URL
   */
  getImageUrl(path: string | undefined | null): string {
    if (!path) return ''
    // 已经是完整URL
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) return path
    // 开发环境通过 Vite 代理 /uploads，生产环境走同源路径，避免硬编码旧端口
    return path.startsWith('/') ? path : `/${path}`
  }
}

export default fileApi
