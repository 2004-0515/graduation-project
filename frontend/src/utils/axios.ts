import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { STORAGE_KEYS, HTTP_STATUS } from '@/constants'
import type { ApiResponse } from '@/types'

// API 基础配置
const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
} as const

// 创建axios实例
const instance: AxiosInstance = axios.create(API_CONFIG)

// 请求拦截器
instance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 从本地存储获取token
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
instance.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    // 直接返回响应数据，添加 success 字段
    const data = response.data as ApiResponse
    return {
      ...data,
      success: data.code === 200
    } as unknown as AxiosResponse
  },
  (error) => {
    // 处理错误响应
    const { response } = error
    
    if (response) {
      // 服务器返回了响应，优先使用服务器返回的错误信息
      if (response.data && typeof response.data === 'object') {
        const errorData = {
          ...response.data,
          success: false,
          message: response.data.message || handleHttpError(response.status).message
        }
        // 创建一个带有 response 属性的错误对象，方便前端获取
        const err = new Error(errorData.message) as any
        err.response = { data: errorData }
        err.code = response.data.code || response.status
        err.message = errorData.message
        return Promise.reject(err)
      }
      
      // 根据状态码处理错误
      const errorResponse = handleHttpError(response.status)
      
      // 401 未授权，清除token并跳转登录页
      if (response.status === HTTP_STATUS.UNAUTHORIZED) {
        localStorage.removeItem(STORAGE_KEYS.TOKEN)
        localStorage.removeItem(STORAGE_KEYS.USER_INFO)
        // 避免在登录页面重复跳转
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login'
        }
      }
      
      const err = new Error(errorResponse.message) as any
      err.response = { data: errorResponse }
      err.code = errorResponse.code
      return Promise.reject(err)
    }
    
    // 网络错误
    const networkError = new Error('网络错误，请检查网络连接') as any
    networkError.response = { data: { code: 0, message: '网络错误，请检查网络连接', success: false } }
    return Promise.reject(networkError)
  }
)

/**
 * 根据HTTP状态码返回对应的错误信息
 */
function handleHttpError(status: number): { code: number; message: string; success: boolean } {
  const errorMessages: Record<number, string> = {
    [HTTP_STATUS.BAD_REQUEST]: '请求参数错误',
    [HTTP_STATUS.UNAUTHORIZED]: '未授权，请重新登录',
    [HTTP_STATUS.FORBIDDEN]: '拒绝访问',
    [HTTP_STATUS.NOT_FOUND]: '请求资源不存在',
    [HTTP_STATUS.UNPROCESSABLE_ENTITY]: '请求数据验证失败',
    [HTTP_STATUS.INTERNAL_SERVER_ERROR]: '服务器内部错误'
  }
  
  return {
    code: status,
    message: errorMessages[status] || `请求错误: ${status}`,
    success: false
  }
}

export default instance
