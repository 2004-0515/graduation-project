import axios from 'axios'

// 创建axios实例
const instance = axios.create({
  baseURL: 'http://localhost:8080/api',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
instance.interceptors.request.use(
  config => {
    // 从本地存储获取token
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
instance.interceptors.response.use(
  response => {
    // 如果响应数据已经是后端返回的标准格式，则直接返回
    if (response.data && typeof response.data === 'object') {
      return response.data
    }
    // 否则，包装成标准格式返回
    return {
      code: 200,
      message: 'success',
      data: response.data
    }
  },
  error => {
    // 处理错误响应
    const { response } = error
    let errorMessage = '请求失败，请稍后重试'
    let errorCode = 500
    
    if (response) {
      // 服务器返回错误状态码
      errorCode = response.status
      switch (response.status) {
        case 401:
          errorMessage = '未授权，请重新登录'
          // 未授权，清除token并跳转登录页
          localStorage.removeItem('token')
          window.location.href = '/login'
          break
        case 403:
          errorMessage = '拒绝访问'
          break
        case 404:
          errorMessage = '请求资源不存在'
          break
        case 500:
          errorMessage = '服务器内部错误'
          break
        default:
          errorMessage = `请求错误: ${response.status}`
      }
    } else {
      // 网络错误或其他错误
      errorMessage = '网络错误，请检查网络连接'
      errorCode = 0
    }
    
    // 包装错误响应为标准格式
    return Promise.reject({
      code: errorCode,
      message: errorMessage
    })
  }
)

export default instance
