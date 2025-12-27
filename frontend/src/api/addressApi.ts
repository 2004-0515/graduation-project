import axios from '@/utils/axios'
import type { ApiResponse } from '@/types'

export interface Address {
  id: number
  userId: number
  name: string
  phone: string
  province: string
  city: string
  district: string
  detail: string
  isDefault: boolean
}

const addressApi = {
  getUserAddresses(userId: number): Promise<ApiResponse<Address[]>> {
    return axios.get(`/addresses/user/${userId}`)
  },
  
  addAddress(data: Partial<Address>): Promise<ApiResponse<Address>> {
    return axios.post('/addresses', data)
  },
  
  updateAddress(id: number, data: Partial<Address>): Promise<ApiResponse<Address>> {
    return axios.put(`/addresses/${id}`, data)
  },
  
  deleteAddress(id: number): Promise<ApiResponse<void>> {
    return axios.delete(`/addresses/${id}`)
  },
  
  setDefaultAddress(id: number): Promise<ApiResponse<void>> {
    return axios.put(`/addresses/${id}/default`)
  }
}

export default addressApi
