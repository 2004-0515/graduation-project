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
    // 直接返回响应数据，保持与现有代码兼容
    return response.data
  },
  error => {
    // 处理错误响应
    const { response } = error
    
    // 如果服务器返回了响应
    if (response) {
      // 使用服务器返回的错误信息
      if (response.data && typeof response.data === 'object') {
        return Promise.reject({
          ...response.data,
          success: false
        })
      }
      
      // 否则，包装成标准格式返回
      let errorMessage = '请求失败，请稍后重试'
      let errorCode = response.status
      
      // 根据状态码设置错误信息
      switch (response.status) {
        case 401:
          errorMessage = '未授权，请重新登录'
          // 未授权，清除token和用户信息并跳转登录页
          localStorage.removeItem('token')
          localStorage.removeItem('userInfo')
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
      
      return Promise.reject({
        code: errorCode,
        message: errorMessage,
        success: false
      })
    } else {
      // 网络错误或其他错误
      return Promise.reject({
        code: 0,
        message: '网络错误，请检查网络连接',
        success: false
      })
    }
  }
)

export default instance
