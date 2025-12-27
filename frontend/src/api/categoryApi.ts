import axios from '@/utils/axios'
import type { ApiResponse } from '@/types'

export interface Category {
  id: number
  name: string
  parentId?: number
  icon?: string
  sort?: number
}

const categoryApi = {
  getCategories(): Promise<ApiResponse<Category[]>> {
    return axios.get('/categories')
  },
  
  getCategoryById(id: number): Promise<ApiResponse<Category>> {
    return axios.get(`/categories/${id}`)
  }
}

export default categoryApi
