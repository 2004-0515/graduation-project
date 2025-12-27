/**
 * 前端类型定义文件
 * 统一管理所有 TypeScript 类型
 */

// ==================== 用户相关类型 ====================

export interface User {
  id: number
  username: string
  email: string
  phone?: string
  nickname?: string
  bio?: string
  avatar?: string
  points: number
  growthValue: number
  memberDays: number
  createdTime: string
  updatedTime: string
  lastLoginTime?: string
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface RegisterData {
  username: string
  password: string
  email: string
  phone?: string
}

export interface PasswordChangeData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export interface UserUpdateData {
  email?: string
  phone?: string
  nickname?: string
  bio?: string
  avatar?: string
}

// ==================== 商品相关类型 ====================

export interface Product {
  id: number
  name: string
  description?: string
  categoryId: number
  price: number
  originalPrice?: number
  stock: number
  sales: number
  status: ProductStatus
  mainImage?: string
  images?: string
  discount?: number
  createdTime: string
  updatedTime: string
}

export enum ProductStatus {
  OFF_SHELF = 0,
  ON_SHELF = 1
}

export interface Category {
  id: number
  name: string
  parentId: number
  level: number
  sort: number
  icon?: string
  description?: string
  status: number
  createdTime: string
  updatedTime: string
}

// ==================== 购物车相关类型 ====================

export interface CartItem {
  id: number
  userId: number
  productId: number
  productName: string
  productImage?: string
  price: number
  quantity: number
  selected: boolean
  stock: number
}

export interface AddToCartRequest {
  productId: number
  quantity: number
}

export interface UpdateCartRequest {
  quantity?: number
  selected?: boolean
}

// ==================== 订单相关类型 ====================

export interface Order {
  id: number
  orderNo: string
  userId: number
  username: string
  totalAmount: number
  paymentMethod: PaymentMethod
  paymentMethodName: string
  paymentStatus: PaymentStatus
  paymentStatusName: string
  orderStatus: OrderStatus
  orderStatusName: string
  shippingAddress?: Address
  paymentTime?: string
  shippingTime?: string
  endTime?: string
  items: OrderItem[]
  createdTime: string
  updatedTime: string
}

export interface OrderItem {
  id: number
  orderId: number
  productId: number
  productName: string
  productImage?: string
  price: number
  quantity: number
}

export enum PaymentMethod {
  WECHAT = 1,
  ALIPAY = 2
}

export enum PaymentStatus {
  UNPAID = 0,
  PAID = 1,
  FAILED = 2
}

export enum OrderStatus {
  PENDING_PAYMENT = 0,
  PENDING_SHIPMENT = 1,
  PENDING_RECEIPT = 2,
  COMPLETED = 3,
  CANCELLED = 4
}

export interface CreateOrderRequest {
  addressId: number
  paymentMethod: PaymentMethod
  items: CreateOrderItemRequest[]
}

export interface CreateOrderItemRequest {
  productId: number
  quantity: number
}

// ==================== 地址相关类型 ====================

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
  createdTime: string
  updatedTime: string
}

export interface AddressFormData {
  name: string
  phone: string
  province: string
  city: string
  district: string
  detail: string
  isDefault?: boolean
}

// ==================== API 响应类型 ====================

export interface ApiResponse<T = unknown> {
  code: number
  message: string
  success: boolean
  data: T
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
}

// ==================== 通用类型 ====================

export interface SelectOption {
  label: string
  value: string | number
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error'
