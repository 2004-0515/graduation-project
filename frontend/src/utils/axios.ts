import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { STORAGE_KEYS, HTTP_STATUS } from '@/constants'
import type { ApiResponse } from '@/types'
import { debugError } from '@/utils/debug'

const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
} as const

const instance: AxiosInstance = axios.create(API_CONFIG)

const readStorage = (key: string): string | null => {
  try {
    return localStorage.getItem(key)
  } catch (error) {
    debugError(`读取本地存储失败(${key})`, error)
    return null
  }
}

const removeStorage = (key: string): void => {
  try {
    localStorage.removeItem(key)
  } catch (error) {
    debugError(`删除本地存储失败(${key})`, error)
  }
}

instance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = readStorage(STORAGE_KEYS.TOKEN)
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
          message: response.data.message || getDefaultHttpError(response.status).message
        }

        const err = new Error(errorData.message) as Error & { response?: unknown; code?: number }
        err.response = { data: errorData }
        err.code = response.data.code || response.status
        return Promise.reject(err)
      }

      const errorResponse = getDefaultHttpError(response.status)

      if (response.status === HTTP_STATUS.UNAUTHORIZED) {
        removeStorage(STORAGE_KEYS.TOKEN)
        removeStorage(STORAGE_KEYS.USER_INFO)
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login'
        }
      }

      const err = new Error(errorResponse.message) as Error & { response?: unknown; code?: number }
      err.response = { data: errorResponse }
      err.code = errorResponse.code
      return Promise.reject(err)
    }

    const networkError = new Error('网络请求失败，请检查网络连接') as Error & { response?: unknown }
    networkError.response = {
      data: {
        code: 0,
        message: '网络请求失败，请检查网络连接',
        success: false
      }
    }
    return Promise.reject(networkError)
  }
)

export function getDefaultHttpError(status: number): { code: number; message: string; success: boolean } {
  switch (status) {
    case HTTP_STATUS.BAD_REQUEST:
      return { code: status, message: '请求参数错误', success: false }
    case HTTP_STATUS.UNAUTHORIZED:
      return { code: status, message: '登录状态已失效，请重新登录', success: false }
    case HTTP_STATUS.FORBIDDEN:
      return { code: status, message: '没有权限执行该操作', success: false }
    case HTTP_STATUS.NOT_FOUND:
      return { code: status, message: '请求的资源不存在', success: false }
    case HTTP_STATUS.INTERNAL_SERVER_ERROR:
      return { code: status, message: '服务器开小差了，请稍后重试', success: false }
    default:
      return { code: status, message: '请求失败，请稍后重试', success: false }
  }
}

export default instance
