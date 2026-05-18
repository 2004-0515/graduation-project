import axios from '@/utils/axios'
import { API_PATHS, PAGINATION } from '@/constants'
import type { Product, PageResponse, ApiResponse } from '@/types'

/**
 * 商品相关 API
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
      pageNo: params?.page ?? params?.pageNo ?? PAGINATION.DEFAULT_PAGE,
      pageSize: params?.size ?? params?.pageSize ?? PAGINATION.DEFAULT_SIZE,
      ...params
    }
    return axios.get(API_PATHS.PRODUCTS.BASE, { params: queryParams })
  },

  /**
   * 根据 ID 获取商品详情
   */
  getProductById(id: number): Promise<ApiResponse<Product>> {
    return axios.get(`${API_PATHS.PRODUCTS.BASE}/${id}`)
  },

  /**
   * 根据分类 ID 获取商品列表
   */
  getProductsByCategoryId(categoryId: number): Promise<ApiResponse<Product[]>> {
    return axios.get(API_PATHS.PRODUCTS.BY_CATEGORY(categoryId))
  },

  /**
   * 根据名称搜索商品
   */
  searchProductsByName(name: string): Promise<ApiResponse<Product[]>> {
    return axios.get(API_PATHS.PRODUCTS.SEARCH, { params: { name } })
  },

  /**
   * 获取当前卖家的商品列表
   */
  getMyProducts(): Promise<ApiResponse<Product[]>> {
    return axios.get(`${API_PATHS.PRODUCTS.BASE}/my`)
  },

  /**
   * 提交商品审核
   */
  submitProduct(data: Record<string, unknown>): Promise<ApiResponse<Product>> {
    return axios.post(`${API_PATHS.PRODUCTS.BASE}/submit`, data)
  },

  /**
   * 更新商品
   */
  updateProduct(id: number, data: Record<string, unknown>): Promise<ApiResponse<Product>> {
    return axios.put(`${API_PATHS.PRODUCTS.BASE}/${id}`, data)
  },

  /**
   * 删除商品
   */
  deleteProduct(id: number): Promise<ApiResponse<void>> {
    return axios.delete(`${API_PATHS.PRODUCTS.BASE}/${id}`)
  }
}

export default productApi
