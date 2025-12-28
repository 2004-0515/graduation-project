/**
 * 前端常量定义文件
 * 消除魔法数字，提高代码可维护性
 */

// ==================== 订单状态 ====================

export const ORDER_STATUS = {
  PENDING_PAYMENT: 0,
  PENDING_SHIPMENT: 1,
  PENDING_RECEIPT: 2,
  COMPLETED: 3,
  CANCELLED: 4,
  CANCEL_REQUESTED: 6
} as const

export const ORDER_STATUS_MAP: Record<number, string> = {
  [ORDER_STATUS.PENDING_PAYMENT]: '待支付',
  [ORDER_STATUS.PENDING_SHIPMENT]: '待发货',
  [ORDER_STATUS.PENDING_RECEIPT]: '待收货',
  [ORDER_STATUS.COMPLETED]: '已完成',
  [ORDER_STATUS.CANCELLED]: '已取消',
  [ORDER_STATUS.CANCEL_REQUESTED]: '申请取消中'
}

export const ORDER_STATUS_OPTIONS = [
  { label: '待支付', value: ORDER_STATUS.PENDING_PAYMENT },
  { label: '待发货', value: ORDER_STATUS.PENDING_SHIPMENT },
  { label: '待收货', value: ORDER_STATUS.PENDING_RECEIPT },
  { label: '已完成', value: ORDER_STATUS.COMPLETED },
  { label: '已取消', value: ORDER_STATUS.CANCELLED },
  { label: '申请取消中', value: ORDER_STATUS.CANCEL_REQUESTED }
]

// ==================== 支付状态 ====================

export const PAYMENT_STATUS = {
  UNPAID: 0,
  PAID: 1,
  FAILED: 2
} as const

export const PAYMENT_STATUS_MAP: Record<number, string> = {
  [PAYMENT_STATUS.UNPAID]: '未支付',
  [PAYMENT_STATUS.PAID]: '已支付',
  [PAYMENT_STATUS.FAILED]: '支付失败'
}

// ==================== 支付方式 ====================

export const PAYMENT_METHOD = {
  WECHAT: 1,
  ALIPAY: 2
} as const

export const PAYMENT_METHOD_MAP: Record<number, string> = {
  [PAYMENT_METHOD.WECHAT]: '微信支付',
  [PAYMENT_METHOD.ALIPAY]: '支付宝'
}

export const PAYMENT_METHOD_OPTIONS = [
  { label: '微信支付', value: PAYMENT_METHOD.WECHAT },
  { label: '支付宝', value: PAYMENT_METHOD.ALIPAY }
]

// ==================== 商品状态 ====================

export const PRODUCT_STATUS = {
  OFF_SHELF: 0,
  ON_SHELF: 1
} as const

export const PRODUCT_STATUS_MAP: Record<number, string> = {
  [PRODUCT_STATUS.OFF_SHELF]: '已下架',
  [PRODUCT_STATUS.ON_SHELF]: '在售'
}

// ==================== 用户状态 ====================

export const USER_STATUS = {
  DISABLED: 0,
  ENABLED: 1
} as const

// ==================== 分页配置 ====================

export const PAGINATION = {
  DEFAULT_PAGE: 0,
  DEFAULT_SIZE: 10,
  PAGE_SIZES: [10, 20, 50, 100]
} as const

// ==================== 表单验证规则 ====================

export const VALIDATION = {
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 20
  },
  PASSWORD: {
    MIN_LENGTH: 6,
    MAX_LENGTH: 20
  },
  NICKNAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 20
  },
  PHONE: {
    PATTERN: /^1[3-9]\d{9}$/
  },
  EMAIL: {
    PATTERN: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|cn|net|org|edu|gov|mil|biz|info|io|us)$/
  }
} as const

// ==================== 本地存储键 ====================

export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER_INFO: 'userInfo',
  CART: 'cart',
  THEME: 'theme',
  LANGUAGE: 'language'
} as const

// ==================== HTTP 状态码 ====================

export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500
} as const

// ==================== API 路径 ====================

export const API_PATHS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
    CHANGE_PASSWORD: '/auth/change-password'
  },
  PRODUCTS: {
    BASE: '/products',
    BY_CATEGORY: (id: number) => `/products/category/${id}`,
    SEARCH: '/products/search'
  },
  CATEGORIES: {
    BASE: '/categories'
  },
  CART: {
    BASE: '/cart',
    ITEM: (id: number) => `/cart/${id}`,
    SELECT: (id: number) => `/cart/${id}/select`,
    SELECT_ALL: '/cart/select-all',
    BATCH: '/cart/batch',
    CLEAR: '/cart/clear',
    COUNT: '/cart/count'
  },
  ORDERS: {
    BASE: '/orders',
    BY_ID: (id: number) => `/orders/${id}`,
    CANCEL: (id: number) => `/orders/${id}/cancel`,
    PAY: (id: number) => `/orders/${id}/pay`
  },
  ADDRESSES: {
    BASE: '/addresses',
    BY_ID: (id: number) => `/addresses/${id}`,
    DEFAULT: '/addresses/default'
  }
} as const
