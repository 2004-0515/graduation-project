import axios from '@/utils/axios'
import { API_PATHS, PAGINATION } from '@/constants'
import type { Product, PageResponse, ApiResponse } from '@/types'

/**
 * 商品相关API
 */
const productApi = {
  /**
   * 获取商品列表
   */
  getProducts(params?: {
    page?: number
    size?: number
    pageNo?: number
    pageSize?: number
    categoryId?: number
    keyword?: string
    minPrice?: number
    maxPrice?: number
    sort?: string
  }): Promise<ApiResponse<PageResponse<Product>>> {
    const queryParams = {
      pageNo: params?.page || params?.pageNo || PAGINATION.DEFAULT_PAGE,
      pageSize: params?.size || params?.pageSize || PAGINATION.DEFAULT_SIZE,
      ...params
    }
    return axios.get(API_PATHS.PRODUCTS.BASE, { params: queryParams })
  },
  
  /**
   * 根据ID获取商品详情
   */
  getProductById(id: number): Promise<ApiResponse<Product>> {
    return axios.get(`${API_PATHS.PRODUCTS.BASE}/${id}`)
  },
  
  /**
   * 根据分类ID获取商品列表
   */
  getProductsByCategoryId(categoryId: number): Promise<ApiResponse<Product[]>> {
    return axios.get(API_PATHS.PRODUCTS.BY_CATEGORY(categoryId))
  },
  
  /**
   * 根据名称搜索商品
   */
  searchProductsByName(name: string): Promise<ApiResponse<Product[]>> {
    return axios.get(API_PATHS.PRODUCTS.SEARCH, { params: { name } })
  }
}

export default productApi
