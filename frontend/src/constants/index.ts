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
  REFUNDING: 5,
  CANCEL_REQUESTED: 6
} as const

export const ORDER_STATUS_MAP: Record<number, string> = {
  [ORDER_STATUS.PENDING_PAYMENT]: '待支付',
  [ORDER_STATUS.PENDING_SHIPMENT]: '待发货',
  [ORDER_STATUS.PENDING_RECEIPT]: '待收货',
  [ORDER_STATUS.COMPLETED]: '已完成',
  [ORDER_STATUS.CANCELLED]: '已取消',
  [ORDER_STATUS.REFUNDING]: '退款中',
  [ORDER_STATUS.CANCEL_REQUESTED]: '申请取消中'
}

export const ORDER_STATUS_OPTIONS = [
  { label: '待支付', value: ORDER_STATUS.PENDING_PAYMENT },
  { label: '待发货', value: ORDER_STATUS.PENDING_SHIPMENT },
  { label: '待收货', value: ORDER_STATUS.PENDING_RECEIPT },
  { label: '已完成', value: ORDER_STATUS.COMPLETED },
  { label: '已取消', value: ORDER_STATUS.CANCELLED },
  { label: '退款中', value: ORDER_STATUS.REFUNDING },
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

// ==================== 商品审核状态 ====================

export const AUDIT_STATUS = {
  PENDING: 0,
  APPROVED: 1,
  REJECTED: 2
} as const

export const AUDIT_STATUS_MAP: Record<number, string> = {
  [AUDIT_STATUS.PENDING]: '待审核',
  [AUDIT_STATUS.APPROVED]: '已通过',
  [AUDIT_STATUS.REJECTED]: '已拒绝'
}

// ==================== 文件审核状态 ====================

export const FILE_REVIEW_STATUS = {
  PENDING: 0,
  APPROVED: 1,
  REJECTED: 2
} as const

export const FILE_REVIEW_STATUS_MAP: Record<number, string> = {
  [FILE_REVIEW_STATUS.PENDING]: '待审核',
  [FILE_REVIEW_STATUS.APPROVED]: '已通过',
  [FILE_REVIEW_STATUS.REJECTED]: '已拒绝'
}

// ==================== 卖家发货状态 ====================

export const SHIP_STATUS = {
  PENDING: 0,
  SHIPPED: 1
} as const

export const SHIP_STATUS_MAP: Record<number, string> = {
  [SHIP_STATUS.PENDING]: '待发货',
  [SHIP_STATUS.SHIPPED]: '已发货'
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


// ==================== 优惠券类型 ====================

export const COUPON_TYPE = {
  REDUCE: 1,      // 满减券
  DISCOUNT: 2,    // 折扣券
  NO_THRESHOLD: 3 // 无门槛券
} as const

export const COUPON_TYPE_MAP: Record<number, string> = {
  [COUPON_TYPE.REDUCE]: '满减券',
  [COUPON_TYPE.DISCOUNT]: '折扣券',
  [COUPON_TYPE.NO_THRESHOLD]: '无门槛券'
}

// ==================== 优惠券状态 ====================

export const COUPON_STATUS = {
  DISABLED: 0,
  ENABLED: 1
} as const

export const COUPON_STATUS_MAP: Record<number, string> = {
  [COUPON_STATUS.DISABLED]: '禁用',
  [COUPON_STATUS.ENABLED]: '启用'
}

// ==================== 用户优惠券状态 ====================

export const USER_COUPON_STATUS = {
  UNUSED: 0,
  USED: 1,
  EXPIRED: 2
} as const

export const USER_COUPON_STATUS_MAP: Record<number, string> = {
  [USER_COUPON_STATUS.UNUSED]: '未使用',
  [USER_COUPON_STATUS.USED]: '已使用',
  [USER_COUPON_STATUS.EXPIRED]: '已过期'
}

// ==================== 价格提醒状态 ====================

export const PRICE_ALERT_STATUS = {
  MONITORING: 0,
  TRIGGERED: 1,
  CANCELLED: 2
} as const

export const PRICE_ALERT_STATUS_MAP: Record<number, string> = {
  [PRICE_ALERT_STATUS.MONITORING]: '监控中',
  [PRICE_ALERT_STATUS.TRIGGERED]: '已触发',
  [PRICE_ALERT_STATUS.CANCELLED]: '已取消'
}


// ==================== 通知类型 ====================

export const NOTIFICATION_TYPE = {
  SYSTEM: 'system',
  PROMOTION: 'promotion',
  ORDER: 'order',
  FILE_REVIEW: 'file_review',
  PRODUCT: 'product'
} as const

export const NOTIFICATION_TYPE_MAP: Record<string, string> = {
  [NOTIFICATION_TYPE.SYSTEM]: '系统通知',
  [NOTIFICATION_TYPE.PROMOTION]: '促销通知',
  [NOTIFICATION_TYPE.ORDER]: '订单通知',
  [NOTIFICATION_TYPE.FILE_REVIEW]: '文件审核',
  [NOTIFICATION_TYPE.PRODUCT]: '商品通知'
}

// ==================== 通知状态 ====================

export const NOTIFICATION_STATUS = {
  UNREAD: 0,
  READ: 1
} as const


// ==================== 文件类型 ====================

export const FILE_TYPE = {
  AVATAR: 'AVATAR',
  PRODUCT: 'PRODUCT',
  REVIEW: 'REVIEW',
  CATEGORY: 'CATEGORY',
  PROMOTION: 'PROMOTION'
} as const

export const FILE_TYPE_MAP: Record<string, string> = {
  [FILE_TYPE.AVATAR]: '用户头像',
  [FILE_TYPE.PRODUCT]: '商品图片',
  [FILE_TYPE.REVIEW]: '评价图片',
  [FILE_TYPE.CATEGORY]: '分类图片',
  [FILE_TYPE.PROMOTION]: '促销图片'
}

// ==================== 心愿单状态 ====================

export const WISHLIST_STATUS = {
  COOLING: 0,    // 冷静中
  READY: 1,      // 可购买
  PURCHASED: 2,  // 已购买
  REMOVED: 3     // 已移除
} as const

export const WISHLIST_STATUS_MAP: Record<number, string> = {
  [WISHLIST_STATUS.COOLING]: '冷静中',
  [WISHLIST_STATUS.READY]: '可购买',
  [WISHLIST_STATUS.PURCHASED]: '已购买',
  [WISHLIST_STATUS.REMOVED]: '已移除'
}
