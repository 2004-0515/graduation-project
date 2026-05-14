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

export interface UserOrderStats {
  orderCount: number
  pendingPayment: number
  pendingShipment: number
  pendingReceive: number
  cartCount: number
  priceAlertCount: number
  sellerPendingCount: number
}

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
  images?: string | string[]
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
  productStatus?: number
  sellerId?: number
  sellerName?: string
}

export interface AddToCartRequest {
  productId: number
  quantity: number
}

export interface UpdateCartRequest {
  quantity?: number
  selected?: boolean
}

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
  remark?: string
  couponId?: number
  couponDiscount?: number
  payAmount?: number
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
  reviewed?: boolean
  shipStatus?: number
  shipTime?: string
  orderNo?: string
  orderStatus?: OrderStatus
  buyerName?: string
  createdTime?: string
  shippingAddress?: Address
}

export interface SellerOrderItem extends OrderItem {
  shipStatus: number
  orderNo: string
  orderStatus: OrderStatus
  buyerName: string
  createdTime: string
}

export type NotificationType =
  | 'system'
  | 'order'
  | 'promotion'
  | 'file_review'
  | 'product_review'
  | 'review'

export interface NotificationSettingsState {
  order: boolean
  promotion: boolean
  system: boolean
  logistics: boolean
  comment: boolean
}

export interface PrivacySettingsState {
  profileVisibility: 'public' | 'friends' | 'private'
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
  CANCELLED = 4,
  REFUNDING = 5,
  CANCEL_REQUESTED = 6
}

export interface CreateOrderRequest {
  addressId: number
  paymentMethod: PaymentMethod
  items: CreateOrderItemRequest[]
  remark?: string | null
  userCouponId?: number
}

export interface CreateOrderItemRequest {
  productId: number
  quantity: number
}

export interface Address {
  id: number
  userId: number
  name: string
  receiver?: string
  phone: string
  province: string
  city: string
  district: string
  detail: string
  isDefault: boolean
  status?: number
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

export interface SelectOption {
  label: string
  value: string | number
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

export interface SearchSuggestion {
  keyword: string
  type: 'product' | 'category'
  highlight: string
}

export interface HotKeyword {
  keyword: string
  searchCount: number
}

export interface SearchHistory {
  id: number
  keyword: string
  searchTime: string
}
