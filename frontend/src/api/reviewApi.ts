import axios from '../utils/axios'

export interface Review {
  id?: number
  productId: number
  orderId: number
  orderItemId?: number
  rating: number
  content: string
  images?: string
  anonymous?: boolean
  username?: string
  avatar?: string
  reply?: string
  replyTime?: string
  createdTime?: string
}

export interface ReviewStats {
  total: number
  avgRating: number
  goodRate: number
  ratingCounts: Record<number, number>
}

export default {
  // 创建评价
  createReview(review: Review) {
    return axios.post('/reviews', review)
  },
  
  // 获取商品评价列表（分页）
  getProductReviews(productId: number, page = 0, size = 10) {
    return axios.get(`/reviews/product/${productId}`, { params: { page, size } })
  },
  
  // 获取商品所有评价
  getAllProductReviews(productId: number) {
    return axios.get(`/reviews/product/${productId}/all`)
  },
  
  // 获取商品评价统计
  getProductReviewStats(productId: number) {
    return axios.get(`/reviews/product/${productId}/stats`)
  },
  
  // 获取我的评价
  getMyReviews() {
    return axios.get('/reviews/my')
  },
  
  // 检查是否已评价
  checkReviewed(orderId: number, productId: number) {
    return axios.get('/reviews/check', { params: { orderId, productId } })
  }
}
