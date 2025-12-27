import axios from '@/utils/axios'
import { API_PATHS } from '@/constants'
import type { 
  User, 
  LoginCredentials, 
  RegisterData, 
  PasswordChangeData, 
  UserUpdateData,
  ApiResponse 
} from '@/types'

/**
 * 认证相关API
 */
const authApi = {
  /**
   * 用户登录
   */
  login(data: LoginCredentials): Promise<ApiResponse<{ token: string; user: User }>> {
    return axios.post(API_PATHS.AUTH.LOGIN, data)
  },
  
  /**
   * 用户注册
   */
  register(data: RegisterData): Promise<ApiResponse<User>> {
    return axios.post(API_PATHS.AUTH.REGISTER, data)
  },
  
  /**
   * 用户退出登录
   */
  logout(): Promise<ApiResponse<void>> {
    return axios.post(API_PATHS.AUTH.LOGOUT)
  },
  
  /**
   * 获取当前用户信息
   */
  getCurrentUser(): Promise<ApiResponse<User>> {
    return axios.get(API_PATHS.AUTH.ME)
  },
  
  /**
   * 更新用户信息
   */
  updateUserInfo(data: UserUpdateData): Promise<ApiResponse<User>> {
    return axios.put(API_PATHS.AUTH.ME, data)
  },
  
  /**
   * 修改用户密码
   */
  changePassword(data: PasswordChangeData): Promise<ApiResponse<string>> {
    return axios.post(API_PATHS.AUTH.CHANGE_PASSWORD, data)
  }
}

export default authApi
