import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { STORAGE_KEYS, HTTP_STATUS } from '@/constants'
import type { ApiResponse } from '@/types'

const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
} as const

const instance: AxiosInstance = axios.create(API_CONFIG)

instance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

instance.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const data = response.data as ApiResponse
    return {
      ...data,
      success: data.code === 200
    } as unknown as AxiosResponse
  },
  (error) => {
    const { response } = error

    if (response) {
      if (response.data && typeof response.data === 'object') {
        const errorData = {
          ...response.data,
          success: false,
          message: response.data.message || handleHttpError(response.status).message
        }

        const err = new Error(errorData.message) as Error & { response?: unknown; code?: number }
        err.response = { data: errorData }
        err.code = response.data.code || response.status
        return Promise.reject(err)
      }

      const errorResponse = handleHttpError(response.status)

      if (response.status === HTTP_STATUS.UNAUTHORIZED) {
        localStorage.removeItem(STORAGE_KEYS.TOKEN)
        localStorage.removeItem(STORAGE_KEYS.USER_INFO)
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login'
        }
      }

      const err = new Error(errorResponse.message) as Error & { response?: unknown; code?: number }
      err.response = { data: errorResponse }
      err.code = errorResponse.code
      return Promise.reject(err)
    }

    const networkError = new Error('Network request failed') as Error & { response?: unknown }
    networkError.response = {
      data: {
        code: 0,
        message: 'Network request failed',
        success: false
      }
    }
    return Promise.reject(networkError)
  }
)

function handleHttpError(status: number): { code: number; message: string; success: boolean } {
  switch (status) {
    case HTTP_STATUS.BAD_REQUEST:
      return { code: status, message: 'Bad request', success: false }
    case HTTP_STATUS.UNAUTHORIZED:
      return { code: status, message: 'Unauthorized, please log in again', success: false }
    case HTTP_STATUS.FORBIDDEN:
      return { code: status, message: 'Forbidden', success: false }
    case HTTP_STATUS.NOT_FOUND:
      return { code: status, message: 'Resource not found', success: false }
    case HTTP_STATUS.INTERNAL_SERVER_ERROR:
      return { code: status, message: 'Server error', success: false }
    default:
      return { code: status, message: 'Request failed', success: false }
  }
}

export default instance
