import type { ApiResponse, Category, PageResponse, Product, SellerOrderItem, User } from '@/types'

export const okResponse = <T>(data: T, message = 'success'): ApiResponse<T> => ({
  code: 200,
  message,
  success: true,
  data
})

export const failResponse = <T>(message: string, data: T, code = 500): ApiResponse<T> => ({
  code,
  message,
  success: false,
  data
})

export const buildPage = <T>(content: T[], overrides: Partial<PageResponse<T>> = {}): PageResponse<T> => ({
  content,
  totalElements: content.length,
  totalPages: 1,
  size: content.length || 10,
  number: 0,
  first: true,
  last: true,
  ...overrides
})

export const okPageResponse = <T>(
  content: T[],
  overrides: Partial<PageResponse<T>> = {},
  message = 'success'
): ApiResponse<PageResponse<T>> => okResponse(buildPage(content, overrides), message)

export const buildUser = (overrides: Partial<User> = {}): User => ({
  id: 1,
  username: 'buyer',
  role: 'BUYER',
  status: 1,
  email: 'buyer@example.com',
  phone: '13800138000',
  nickname: '测试用户',
  bio: '',
  avatar: '',
  points: 0,
  growthValue: 0,
  memberDays: 0,
  createdTime: '2026-05-07T10:00:00',
  updatedTime: '2026-05-07T10:00:00',
  lastLoginTime: '2026-05-07T10:00:00',
  ...overrides
})

export const buildCategory = (overrides: Partial<Category> = {}): Category => ({
  id: 1,
  name: '分类A',
  parentId: 0,
  level: 1,
  sort: 1,
  icon: null,
  description: '',
  status: 1,
  createdTime: '2026-05-07T10:00:00',
  updatedTime: '2026-05-07T10:00:00',
  ...overrides
})

export const buildProduct = (overrides: Partial<Product> = {}): Product => ({
  id: 1,
  name: '测试商品',
  description: '描述',
  categoryId: 1,
  categoryName: '分类A',
  price: 99,
  originalPrice: 129,
  pendingPrice: undefined,
  stock: 5,
  sales: 3,
  status: 1,
  mainImage: '/a.png',
  images: ['/a.png'],
  sellerId: 2,
  sellerName: '测试卖家',
  auditStatus: 0,
  rejectRemark: '',
  adVideo: '',
  adVideoDuration: 5,
  adVideoEnabled: 0,
  createdTime: '2026-05-07T10:00:00',
  updatedTime: '2026-05-07T10:00:00',
  ...overrides
})

export const buildSellerOrderItem = (overrides: Partial<SellerOrderItem> = {}): SellerOrderItem => ({
  id: 11,
  orderId: 1,
  productId: 100,
  productName: '商品A',
  productImage: '/a.png',
  price: 99,
  quantity: 1,
  shipStatus: 0,
  orderNo: 'ORD-1',
  orderStatus: 1,
  buyerName: 'buyer',
  createdTime: '2026-05-07T10:00:00',
  shippingAddress: {
    id: 1,
    userId: 1,
    name: '张三',
    receiver: '张三',
    phone: '13800138000',
    province: '广东',
    city: '深圳',
    district: '南山',
    detail: '科技园',
    isDefault: true
  },
  ...overrides
})
