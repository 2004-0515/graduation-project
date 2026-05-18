import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
const { mockPush, mockRoute, addressApi, couponApi, orderApi, productApi, rationalApi, mockCartStore, mockUserStore, debugError } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockRoute: { query: {} as Record<string, string> },
  addressApi: {
    getUserAddresses: vi.fn()
  },
  couponApi: {
    getAvailableForOrder: vi.fn()
  },
  orderApi: {
    createOrder: vi.fn()
  },
  productApi: {
    getProductById: vi.fn()
  },
  rationalApi: {
    getBudgetStatus: vi.fn()
  },
  mockCartStore: {
    items: [] as any[],
    fetchCart: vi.fn(),
    batchDelete: vi.fn()
  },
  mockUserStore: {
    isLoggedIn: true,
    userInfo: { id: 10, username: 'seller-user' }
  },
  debugError: vi.fn()
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
  useRoute: () => mockRoute
}))

vi.mock('element-plus', () => ({
  ElMessage: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn()
  },
  ElMessageBox: {
    confirm: vi.fn()
  }
}))

vi.mock('@/stores/cartStore', () => ({
  useCartStore: () => mockCartStore
}))

vi.mock('@/stores/userStore', () => ({
  useUserStore: () => mockUserStore
}))

vi.mock('@/api/addressApi', () => ({
  default: addressApi
}))

vi.mock('@/api/couponApi', () => ({
  default: couponApi
}))

vi.mock('@/api/fileApi', () => ({
  default: {
    getImageUrl: vi.fn(() => '/img.png')
  }
}))

vi.mock('@/api/orderApi', () => ({
  default: orderApi
}))

vi.mock('@/api/productApi', () => ({
  default: productApi
}))

vi.mock('@/api/rationalApi', () => ({
  default: rationalApi
}))

vi.mock('@/utils/debug', () => ({
  debugError
}))

import { ElMessage } from 'element-plus'
import CheckoutView from '@/views/CheckoutView.vue'

const deferred = <T>() => {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('CheckoutView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
    mockRoute.query = {}
    mockCartStore.fetchCart.mockResolvedValue([])
    mockCartStore.batchDelete.mockResolvedValue(true)
    mockCartStore.items = [
      {
        id: 1,
        productId: 101,
        productName: '自己的商品',
        productImage: '/own.png',
        price: 20,
        quantity: 1,
        sellerId: 10,
        sellerName: '我自己',
        productStatus: 1,
        selected: true
      },
      {
        id: 2,
        productId: 202,
        productName: '正常商品',
        productImage: '/ok.png',
        price: 35,
        quantity: 2,
        sellerId: 30,
        sellerName: '其他商家',
        productStatus: 1,
        selected: true
      }
    ]
    addressApi.getUserAddresses.mockResolvedValue({
      code: 200,
      data: [
        {
          id: 9,
          name: '张三',
          phone: '13800138000',
          province: '上海',
          city: '上海',
          district: '浦东',
          detail: '软件园',
          isDefault: true
        }
      ]
    })
    couponApi.getAvailableForOrder.mockResolvedValue({ code: 200, data: [] })
    rationalApi.getBudgetStatus.mockResolvedValue({ code: 200, data: {} })
  })

  it('filters own products out of cart checkout items', async () => {
    const wrapper = mount(CheckoutView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true,
          RouterLink: true,
          ElImage: true,
          ElInput: true
        }
      }
    })

    await flushPromises()

    expect(wrapper.text()).toContain('正常商品')
    expect(wrapper.text()).not.toContain('自己的商品')
  })

  it('removes stock-insufficient cart items and keeps valid items', async () => {
    mockCartStore.items = [
      {
        id: 1,
        productId: 101,
        productName: '库存不足商品',
        productImage: '/low-stock.png',
        price: 20,
        quantity: 3,
        stock: 1,
        sellerId: 30,
        sellerName: '其他商家',
        productStatus: 1,
        selected: true
      },
      {
        id: 2,
        productId: 202,
        productName: '正常商品',
        productImage: '/ok.png',
        price: 35,
        quantity: 1,
        stock: 5,
        sellerId: 31,
        sellerName: '其他商家',
        productStatus: 1,
        selected: true
      }
    ]

    const wrapper = mount(CheckoutView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true,
          RouterLink: true,
          ElImage: true,
          ElInput: true
        }
      }
    })

    await flushPromises()

    expect(ElMessage.warning).toHaveBeenCalledWith('商品“库存不足商品”因库存不足，已从结算中移除')
    expect(wrapper.text()).toContain('正常商品')
    expect(wrapper.text()).not.toContain('库存不足商品')
  })

  it('redirects back to cart when direct purchase product is unavailable', async () => {
    mockRoute.query = { productId: '303', quantity: '1' }
    productApi.getProductById.mockResolvedValue({
      code: 200,
      data: {
        id: 303,
        name: '已下架商品',
        status: 0,
        stock: 10,
        sellerId: 99
      }
    })

    mount(CheckoutView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true,
          RouterLink: true,
          ElImage: true,
          ElInput: true
        }
      }
    })

    await flushPromises()

    expect(ElMessage.error).toHaveBeenCalledWith('该商品已下架')
    expect(mockPush).toHaveBeenCalledWith('/cart')
    expect(debugError).toHaveBeenCalledWith('加载结算商品失败', expect.any(Error))
  })

  it('shows backend message when creating order fails', async () => {
    orderApi.createOrder.mockRejectedValue({ response: { data: { message: '库存不足，无法下单' } } })

    const wrapper = mount(CheckoutView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true,
          RouterLink: true,
          ElImage: true,
          ElInput: true
        }
      }
    })

    await flushPromises()
    await (wrapper.vm as any).submitOrder()
    await flushPromises()

    expect(ElMessage.error).toHaveBeenCalledWith('库存不足，无法下单')
    expect(debugError).toHaveBeenCalled()
  })

  it('logs backend message when creating order returns non-200 payload', async () => {
    orderApi.createOrder.mockResolvedValue({ code: 500, message: '订单创建校验失败' })

    const wrapper = mount(CheckoutView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true,
          RouterLink: true,
          ElImage: true,
          ElInput: true
        }
      }
    })

    await flushPromises()
    await (wrapper.vm as any).submitOrder()
    await flushPromises()

    expect(ElMessage.error).toHaveBeenCalledWith('订单创建校验失败')
    expect(debugError).toHaveBeenCalledWith('订单创建失败', '订单创建校验失败')
  })

  it('cleans cart items silently after order creation succeeds', async () => {
    orderApi.createOrder.mockResolvedValue({ code: 200, data: { id: 99 } })

    const wrapper = mount(CheckoutView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true,
          RouterLink: true,
          ElImage: true,
          ElInput: true
        }
      }
    })

    await flushPromises()
    await (wrapper.vm as any).submitOrder()
    await flushPromises()

    expect(mockCartStore.batchDelete).toHaveBeenCalledWith([2], { silentSuccess: true })
    expect(ElMessage.success).toHaveBeenCalledWith('订单创建成功')
    expect(mockPush).toHaveBeenCalledWith('/payment/99')
  })

  it('keeps order creation successful when cart cleanup fails afterward', async () => {
    orderApi.createOrder.mockResolvedValue({ code: 200, data: { id: 99 } })
    mockCartStore.batchDelete.mockRejectedValue(new Error('cleanup failed'))

    const wrapper = mount(CheckoutView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true,
          RouterLink: true,
          ElImage: true,
          ElInput: true
        }
      }
    })

    await flushPromises()
    await (wrapper.vm as any).submitOrder()
    await flushPromises()

    expect(ElMessage.success).toHaveBeenCalledWith('订单创建成功')
    expect(ElMessage.error).not.toHaveBeenCalled()
    expect(debugError).toHaveBeenCalledWith('订单创建成功后清理购物车失败', expect.any(Error))
    expect(mockPush).toHaveBeenCalledWith('/payment/99')
  })

  it('logs non-200 payload when address loading returns business failure', async () => {
    addressApi.getUserAddresses.mockResolvedValue({ code: 500, message: '地址服务异常' })

    mount(CheckoutView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true,
          RouterLink: true,
          ElImage: true,
          ElInput: true
        }
      }
    })

    await flushPromises()

    expect(debugError).toHaveBeenCalledWith('加载地址失败', '地址服务异常')
  })

  it('keeps checkout page usable when reading saved checkout snapshot throws', async () => {
    mockCartStore.items = []
    mockCartStore.fetchCart.mockResolvedValue([])
    const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(function (this: Storage, key: string) {
      if (this === sessionStorage && key === 'checkout_order_items') {
        throw new Error('snapshot unreadable')
      }
      return null
    })

    const wrapper = mount(CheckoutView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true,
          RouterLink: true,
          ElImage: true,
          ElInput: true
        }
      }
    })

    await flushPromises()

    expect(wrapper.text()).toContain('当前没有可结算商品')
    expect(debugError).toHaveBeenCalledWith('读取结算商品失败', expect.any(Error))
    getItemSpy.mockRestore()
  })

  it('ignores stale coupon responses when subtotal changes quickly', async () => {
    mockCartStore.items = []
    let resolveFirst: ((value: any) => void) | undefined
    let resolveSecond: ((value: any) => void) | undefined

    couponApi.getAvailableForOrder
      .mockImplementationOnce(() => new Promise((resolve) => { resolveFirst = resolve }))
      .mockImplementationOnce(() => new Promise((resolve) => { resolveSecond = resolve }))

    const wrapper = mount(CheckoutView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true,
          RouterLink: true,
          ElImage: true,
          ElInput: true
        }
      }
    })

    await flushPromises()
    vi.clearAllMocks()
    ;(wrapper.vm as any).orderItems = [
      { id: 202, productId: 202, name: '正常商品', mainImage: '/ok.png', price: 35, quantity: 1 }
    ]
    await flushPromises()

    ;(wrapper.vm as any).orderItems = [
      { id: 202, productId: 202, name: '正常商品', mainImage: '/ok.png', price: 35, quantity: 2 }
    ]
    await flushPromises()

    resolveSecond?.({ code: 200, data: [{ id: 2, name: '新券' }] })
    await flushPromises()

    resolveFirst?.({ code: 200, data: [{ id: 1, name: '旧券' }] })
    await flushPromises()

    expect((wrapper.vm as any).availableCoupons).toEqual([{ id: 2, name: '新券' }])
  })

  it('keeps newer address list when older address request resolves later', async () => {
    const first = deferred<any>()
    const second = deferred<any>()
    addressApi.getUserAddresses
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)

    const wrapper = mount(CheckoutView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true,
          RouterLink: true,
          ElImage: true,
          ElInput: true
        }
      }
    })

    await flushPromises()

    const vm = wrapper.vm as any
    const secondFetch = vm.fetchAddresses()
    await flushPromises()

    second.resolve({
      code: 200,
      data: [{ id: 11, name: '李四', phone: '13900000000', province: '北京', city: '北京', district: '海淀', detail: '新地址', isDefault: true }]
    })
    await secondFetch
    await flushPromises()

    expect(vm.addresses).toEqual([
      { id: 11, name: '李四', phone: '13900000000', province: '北京', city: '北京', district: '海淀', detail: '新地址', isDefault: true }
    ])

    first.resolve({
      code: 200,
      data: [{ id: 9, name: '张三', phone: '13800138000', province: '上海', city: '上海', district: '浦东', detail: '旧地址', isDefault: true }]
    })
    await flushPromises()

    expect(vm.addresses).toEqual([
      { id: 11, name: '李四', phone: '13900000000', province: '北京', city: '北京', district: '海淀', detail: '新地址', isDefault: true }
    ])
  })

  it('clears selected address when refreshed address list becomes empty', async () => {
    addressApi.getUserAddresses
      .mockResolvedValueOnce({
        code: 200,
        data: [{ id: 9, name: '张三', phone: '13800138000', province: '上海', city: '上海', district: '浦东', detail: '旧地址', isDefault: true }]
      })
      .mockResolvedValueOnce({
        code: 200,
        data: []
      })

    const wrapper = mount(CheckoutView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true,
          RouterLink: true,
          ElImage: true,
          ElInput: true
        }
      }
    })

    await flushPromises()

    const vm = wrapper.vm as any
    expect(vm.selectedAddress).toBe(9)

    await vm.fetchAddresses()
    await flushPromises()

    expect(vm.addresses).toEqual([])
    expect(vm.selectedAddress).toBeNull()
  })

  it('clears selected coupon when refreshed available coupons become empty', async () => {
    couponApi.getAvailableForOrder
      .mockResolvedValueOnce({
        code: 200,
        data: [{ id: 5, name: '满减券', discount: 10 }]
      })
      .mockResolvedValueOnce({
        code: 200,
        data: []
      })

    const wrapper = mount(CheckoutView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true,
          RouterLink: true,
          ElImage: true,
          ElInput: true
        }
      }
    })

    await flushPromises()

    const vm = wrapper.vm as any
    vm.selectCoupon({ id: 5, name: '满减券', discount: 10 })
    expect(vm.selectedCoupon).toBe(5)
    expect(vm.couponDiscount).toBe(10)

    await vm.fetchAvailableCoupons()
    await flushPromises()

    expect(vm.availableCoupons).toEqual([])
    expect(vm.selectedCoupon).toBeNull()
    expect(vm.couponDiscount).toBe(0)
  })

  it('clears stale coupon list when coupon refresh returns business failure', async () => {
    const wrapper = mount(CheckoutView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true,
          RouterLink: true,
          ElImage: true,
          ElInput: true
        }
      }
    })

    await flushPromises()

    const vm = wrapper.vm as any
    vm.availableCoupons = [{ id: 5, name: '旧券', discount: 10 }]
    vm.selectedCoupon = 5
    vm.couponDiscount = 10
    couponApi.getAvailableForOrder.mockResolvedValueOnce({ code: 500, message: '优惠券服务异常' })

    await vm.fetchAvailableCoupons()
    await flushPromises()

    expect(vm.availableCoupons).toEqual([])
    expect(vm.selectedCoupon).toBeNull()
    expect(vm.couponDiscount).toBe(0)
    expect(debugError).toHaveBeenCalledWith('加载优惠券失败', '优惠券服务异常')
  })

  it('refreshes selected coupon discount from the latest available coupon payload', async () => {
    couponApi.getAvailableForOrder
      .mockResolvedValueOnce({
        code: 200,
        data: [{ id: 5, name: '满减券', discount: 10 }]
      })
      .mockResolvedValueOnce({
        code: 200,
        data: [{ id: 5, name: '满减券', discount: 15 }]
      })

    const wrapper = mount(CheckoutView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true,
          RouterLink: true,
          ElImage: true,
          ElInput: true
        }
      }
    })

    await flushPromises()

    const vm = wrapper.vm as any
    vm.selectCoupon({ id: 5, name: '满减券', discount: 10 })
    expect(vm.selectedCoupon).toBe(5)
    expect(vm.couponDiscount).toBe(10)

    await vm.fetchAvailableCoupons()
    await flushPromises()

    expect(vm.availableCoupons).toEqual([{ id: 5, name: '满减券', discount: 15 }])
    expect(vm.selectedCoupon).toBe(5)
    expect(vm.couponDiscount).toBe(15)
  })

  it('clears broken saved checkout items and logs the parse failure', async () => {
    mockCartStore.items = []
    sessionStorage.setItem('checkout_order_items', '{broken-items')

    const wrapper = mount(CheckoutView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true,
          RouterLink: true,
          ElImage: true,
          ElInput: true
        }
      }
    })

    await flushPromises()

    expect((wrapper.vm as any).orderItems).toEqual([])
    expect(sessionStorage.getItem('checkout_order_items')).toBeNull()
    expect(debugError).toHaveBeenCalledWith('恢复结算商品失败', expect.any(Error))
  })

  it('keeps direct-purchase checkout items when snapshot save throws', async () => {
    mockRoute.query = { productId: '301', quantity: '2' }
    productApi.getProductById.mockResolvedValue({
      code: 200,
      data: { id: 301, name: '直购商品', mainImage: '/buy.png', price: 88, quantity: 1, stock: 10, status: 1, sellerId: 33 }
    })
    const originalSessionStorage = window.sessionStorage
    Object.defineProperty(window, 'sessionStorage', {
      value: {
        ...originalSessionStorage,
        getItem: vi.fn(() => null),
        setItem: vi.fn(() => {
          throw new Error('session full')
        }),
        removeItem: vi.fn()
      },
      configurable: true
    })

    const wrapper = mount(CheckoutView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true,
          RouterLink: true,
          ElImage: true,
          ElInput: true
        }
      }
    })

    await flushPromises()

    expect((wrapper.vm as any).orderItems).toHaveLength(1)
    expect((wrapper.vm as any).orderItems[0].id).toBe(301)
    expect(debugError).toHaveBeenCalledWith('保存结算商品失败', expect.any(Error))

    Object.defineProperty(window, 'sessionStorage', {
      value: originalSessionStorage,
      configurable: true
    })
  })

  it('still routes to payment when clearing checkout snapshot throws after order creation', async () => {
    orderApi.createOrder.mockResolvedValue({ code: 200, data: { id: 99 } })
    const originalSessionStorage = window.sessionStorage
    Object.defineProperty(window, 'sessionStorage', {
      value: {
        ...originalSessionStorage,
        getItem: vi.fn(() => null),
        setItem: vi.fn(),
        removeItem: vi.fn(() => {
          throw new Error('remove blocked')
        })
      },
      configurable: true
    })

    const wrapper = mount(CheckoutView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true,
          RouterLink: true,
          ElImage: true,
          ElInput: true
        }
      }
    })

    await flushPromises()
    await (wrapper.vm as any).submitOrder()
    await flushPromises()

    expect(ElMessage.success).toHaveBeenCalledWith('订单创建成功')
    expect(mockPush).toHaveBeenCalledWith('/payment/99')
    expect(debugError).toHaveBeenCalledWith('清理结算商品失败', expect.any(Error))

    Object.defineProperty(window, 'sessionStorage', {
      value: originalSessionStorage,
      configurable: true
    })
  })
})
