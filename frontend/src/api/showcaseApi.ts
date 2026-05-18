import axios from '@/utils/axios'
import type { ApiResponse } from '@/types'

export interface ShowcaseBanner {
  id?: number
  placement: 'HOME_HERO' | 'PROMOTION_HERO' | 'CATEGORY_SPOTLIGHT'
  title: string
  subtitle?: string | null
  description?: string | null
  badgeText?: string | null
  imagePath: string
  mobileImagePath?: string | null
  buttonText?: string | null
  linkType?: 'NONE' | 'CATEGORY' | 'PRODUCT' | 'PROMOTION' | 'URL' | 'ROUTE'
  linkTarget?: string | null
  sortOrder?: number
  status?: number
  startTime?: string | null
  endTime?: string | null
  createdTime?: string
  updatedTime?: string
}

const showcaseApi = {
  getPublicBanners(placement: ShowcaseBanner['placement']): Promise<ApiResponse<ShowcaseBanner[]>> {
    return axios.get('/content/banners', { params: { placement } })
  },

  getAdminBanners(placement?: ShowcaseBanner['placement'] | ''): Promise<ApiResponse<ShowcaseBanner[]>> {
    return axios.get('/admin/content/banners', { params: placement ? { placement } : {} })
  },

  createBanner(data: ShowcaseBanner): Promise<ApiResponse<ShowcaseBanner>> {
    return axios.post('/admin/content/banners', data)
  },

  updateBanner(id: number, data: ShowcaseBanner): Promise<ApiResponse<ShowcaseBanner>> {
    return axios.put(`/admin/content/banners/${id}`, data)
  },

  deleteBanner(id: number): Promise<ApiResponse<void>> {
    return axios.delete(`/admin/content/banners/${id}`)
  }
}

export default showcaseApi
