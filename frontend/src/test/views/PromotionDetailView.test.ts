import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ElMessage } from 'element-plus'

const { mockPush, mockBack, mockRoute, couponApi, productApi, cartStore, userStore, debugError } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockBack: vi.fn(),
  mockRoute: { params: { id: '12' } },
  couponApi: {
    getCouponById: vi.fn(),
    getAvailableCoupons: vi.fn(),
    claimCoupon: vi.fn()
  },
  productApi: {
    getProducts: vi.fn()
  },
  cartStore: {
    addToCart: vi.fn()
  },
  debugError: vi.fn(),
  userStore: {
    isLoggedIn: true,
    userInfo: { id: 1, username: 'buyer' }
  }
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush, back: mockBack }),
  useRoute: () => mockRoute
}))

vi.mock('element-plus', () => ({
  ElMessage: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn()
  }
}))

vi.mock('@/stores/cartStore', () => ({
  useCartStore: () => cartStore
}))

vi.mock('@/stores/userStore', () => ({
  useUserStore: () => userStore
}))

vi.mock('@/api/couponApi', () => ({
  default: couponApi
}))

vi.mock('@/api/productApi', () => ({
  default: productApi
}))

vi.mock('@/api/fileApi', () => ({
  default: {
    getImageUrl: vi.fn(() => '/img.png')
  }
}))

vi.mock('@/utils/debug', () => ({
  debugError
}))

import PromotionDetailView from '@/views/PromotionDetailView.vue'

function createDeferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('PromotionDetailView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    userStore.isLoggedIn = true
    userStore.userInfo = { id: 1, username: 'buyer' }
    couponApi.getCouponById.mockResolvedValue({
      code: 200,
      data: {
        id: 12,
        name: '618 满减券',
        description: '全场部分商品可用',
        type: 1,
        discountAmount: 30,
        minAmount: 199,
        startTime: '2026-05-01T00:00:00',
        endTime: '2026-05-31T23:59:59',
        remaining: 88,
        claimed: false
      }
    })
    couponApi.getAvailableCoupons.mockResolvedValue({
      code: 200,
      data: [
        {
          id: 12,
          name: '618 满减券',
          description: '全场部分商品可用',
          type: 1,
          discountAmount: 30,
          minAmount: 199,
          startTime: '2026-05-01T00:00:00',
          endTime: '2026-05-31T23:59:59',
          remaining: 88,
          claimed: false
        }
      ]
    })
    productApi.getProducts.mockResolvedValue({
      code: 200,
      data: {
        content: [
          { id: 101, name: '真实商品A', price: 99, sales: 12, mainImage: '/a.png' }
        ]
      }
    })
  })

  it('renders real coupon data and real product price without fake promotion pricing', async () => {
    const wrapper = mount(PromotionDetailView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true,
          ElImage: {
            template: '<img />'
          }
        }
      }
    })

    await flushPromises()

    expect(productApi.getProducts).toHaveBeenCalledWith({ pageNo: 0, pageSize: 8, sort: 'sales' })
    expect(wrapper.text()).toContain('618 满减券')
    expect(wrapper.text()).toContain('真实商品A')
    expect(wrapper.text()).toContain('¥99.00')
    expect(wrapper.text()).not.toContain('8折')
    expect(wrapper.text()).not.toContain('活动期间全场商品享受8折优惠')
  })

  it('redirects anonymous users to login with Chinese warning before claiming', async () => {
    userStore.isLoggedIn = false

    const wrapper = mount(PromotionDetailView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true,
          ElImage: {
            template: '<img />'
          }
        }
      }
    })

    await flushPromises()
    await wrapper.find('button.primary-btn').trigger('click')

    expect(ElMessage.warning).toHaveBeenCalledWith('请先登录')
    expect(mockPush).toHaveBeenCalledWith('/login')
    expect(couponApi.claimCoupon).not.toHaveBeenCalled()
  })

  it('refetches coupon state from backend after claim succeeds', async () => {
    const wrapper = mount(PromotionDetailView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true,
          ElImage: {
            template: '<img />'
          }
        }
      }
    })

    await flushPromises()
    couponApi.claimCoupon.mockResolvedValueOnce({ code: 200 })

    await (wrapper.vm as unknown as { claimCoupon: (coupon: { id: number }) => Promise<void> })
      .claimCoupon({ id: 12 })
    await flushPromises()

    expect(couponApi.claimCoupon).toHaveBeenCalledWith(12)
    expect(couponApi.getCouponById).toHaveBeenCalledTimes(2)
    expect(couponApi.getAvailableCoupons).toHaveBeenCalledTimes(2)
    expect(ElMessage.success).toHaveBeenCalledWith('领取成功')
  })

  it('keeps claim successful when featured coupon refresh fails afterward', async () => {
    couponApi.getCouponById
      .mockResolvedValueOnce({
        code: 200,
        data: {
          id: 12,
          name: '618 满减券',
          description: '全场部分商品可用',
          type: 1,
          discountAmount: 30,
          minAmount: 199,
          startTime: '2026-05-01T00:00:00',
          endTime: '2026-05-31T23:59:59',
          remaining: 88,
          claimed: false
        }
      })
      .mockRejectedValueOnce(new Error('refresh failed'))

    const wrapper = mount(PromotionDetailView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true,
          ElImage: {
            template: '<img />'
          }
        }
      }
    })

    await flushPromises()
    couponApi.claimCoupon.mockResolvedValueOnce({ code: 200 })

    await (wrapper.vm as unknown as { claimCoupon: (coupon: { id: number }) => Promise<void> })
      .claimCoupon({ id: 12 })
    await flushPromises()

    expect(ElMessage.success).toHaveBeenCalledWith('领取成功')
    expect(ElMessage.error).not.toHaveBeenCalled()
    expect(debugError).toHaveBeenCalledWith('获取优惠专题主优惠券失败:', expect.any(Error))
  })

  it('shows backend Chinese message when claiming fails', async () => {
    const wrapper = mount(PromotionDetailView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true,
          ElImage: {
            template: '<img />'
          }
        }
      }
    })

    await flushPromises()
    couponApi.claimCoupon.mockRejectedValueOnce({ response: { data: { message: '活动已结束' } } })

    await (wrapper.vm as unknown as { claimCoupon: (coupon: { id: number }) => Promise<void> })
      .claimCoupon({ id: 12 })
    await flushPromises()

    expect(ElMessage.error).toHaveBeenCalledWith('活动已结束')
    expect(debugError).toHaveBeenCalled()
  })

  it('renders hot products from the first sales page without emptying the section', async () => {
    productApi.getProducts.mockResolvedValue({
      code: 200,
      data: {
        content: [
          { id: 101, name: '真实商品A', price: 99, sales: 12, mainImage: '/a.png' },
          { id: 102, name: '真实商品B', price: 199, sales: 21, mainImage: '/b.png' }
        ]
      }
    })

    const wrapper = mount(PromotionDetailView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true,
          ElImage: {
            template: '<img />'
          }
        }
      }
    })

    await flushPromises()

    expect(wrapper.findAll('.product-card')).toHaveLength(2)
    expect(wrapper.text()).toContain('真实商品B')
  })

  it('logs backend message when claiming returns non-200 payload', async () => {
    const wrapper = mount(PromotionDetailView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true,
          ElImage: {
            template: '<img />'
          }
        }
      }
    })

    await flushPromises()
    couponApi.claimCoupon.mockResolvedValueOnce({ code: 500, message: '该专题优惠券已领完' })

    await (wrapper.vm as unknown as { claimCoupon: (coupon: { id: number }) => Promise<void> })
      .claimCoupon({ id: 12 })
    await flushPromises()

    expect(ElMessage.error).toHaveBeenCalledWith('该专题优惠券已领完')
    expect(debugError).toHaveBeenCalledWith('优惠专题领取优惠券失败:', '该专题优惠券已领完')
  })

  it('shows backend Chinese message when add to cart fails', async () => {
    const wrapper = mount(PromotionDetailView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true,
          ElImage: {
            template: '<img />'
          }
        }
      }
    })

    await flushPromises()
    cartStore.addToCart.mockRejectedValueOnce({ response: { data: { message: '库存不足' } } })

    await (wrapper.vm as unknown as { addToCart: (product: { id: number }) => Promise<void> })
      .addToCart({ id: 101 })
    await flushPromises()

    expect(ElMessage.error).toHaveBeenCalledWith('库存不足')
    expect(debugError).toHaveBeenCalled()
  })

  it('reloads promotion detail when route param id changes', async () => {
    const wrapper = mount(PromotionDetailView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true,
          ElImage: {
            template: '<img />'
          }
        }
      }
    })

    await flushPromises()

    mockRoute.params.id = '20'
    couponApi.getCouponById.mockResolvedValueOnce({
      code: 200,
      data: {
        id: 20,
        name: '新专题券',
        description: '新的专题说明',
        type: 1,
        discountAmount: 50,
        minAmount: 299,
        startTime: '2026-06-01T00:00:00',
        endTime: '2026-06-30T23:59:59',
        remaining: 20,
        claimed: false
      }
    })

    await (wrapper.vm as unknown as { reloadPromotionDetailFromRoute: () => Promise<void> }).reloadPromotionDetailFromRoute()
    await flushPromises()

    expect(couponApi.getCouponById).toHaveBeenLastCalledWith(20)
    expect(wrapper.text()).toContain('新专题券')
  })

  it('clears old coupon and product lists before reloading a new promotion route', async () => {
    const wrapper = mount(PromotionDetailView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true,
          ElImage: {
            template: '<img />'
          }
        }
      }
    })

    await flushPromises()

    ;(wrapper.vm as any).coupons = [{ id: 12, name: '旧券' }]
    ;(wrapper.vm as any).products = [{ id: 101, name: '旧商品' }]
    mockRoute.params.id = '21'
    couponApi.getCouponById.mockResolvedValueOnce({ code: 500, message: '专题不存在' })
    couponApi.getAvailableCoupons.mockResolvedValueOnce({ code: 500, message: '优惠券读取失败' })
    productApi.getProducts.mockResolvedValueOnce({ code: 500, message: '商品读取失败' })

    await (wrapper.vm as any).reloadPromotionDetailFromRoute()
    await flushPromises()

    expect((wrapper.vm as any).coupons).toEqual([])
    expect((wrapper.vm as any).products).toEqual([])
    expect((wrapper.vm as any).featuredCoupon).toBeNull()
  })

  it('does not add an extra success toast after add to cart succeeds', async () => {
    const wrapper = mount(PromotionDetailView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true,
          ElImage: {
            template: '<img />'
          }
        }
      }
    })

    await flushPromises()
    cartStore.addToCart.mockResolvedValueOnce(undefined)

    await (wrapper.vm as unknown as { addToCart: (product: { id: number }) => Promise<void> })
      .addToCart({ id: 101 })
    await flushPromises()

    expect(cartStore.addToCart).toHaveBeenCalledWith(1, 101, 1)
    expect(ElMessage.success).not.toHaveBeenCalled()
  })

  it('logs non-200 coupon and product payloads without crashing', async () => {
    couponApi.getCouponById.mockResolvedValueOnce({ code: 404, message: '专题不存在' })
    couponApi.getAvailableCoupons.mockResolvedValueOnce({ code: 500, message: '优惠券读取失败' })
    productApi.getProducts.mockResolvedValueOnce({ code: 500, message: '商品读取失败' })

    mount(PromotionDetailView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true,
          ElImage: {
            template: '<img />'
          }
        }
      }
    })

    await flushPromises()

    expect(debugError).toHaveBeenCalledWith('获取优惠专题主优惠券失败:', '专题不存在')
    expect(debugError).toHaveBeenCalledWith('获取优惠专题优惠券失败:', '优惠券读取失败')
    expect(debugError).toHaveBeenCalledWith('获取优惠专题商品失败:', '商品读取失败')
    expect(ElMessage.warning).toHaveBeenCalledWith('未找到对应优惠活动，已为你展示当前可用优惠券')
  })

  it('ignores stale available-coupon responses and keeps the newest promotion detail list', async () => {
    let resolveFirst: ((value: any) => void) | undefined
    let resolveSecond: ((value: any) => void) | undefined

    couponApi.getAvailableCoupons
      .mockImplementationOnce(() => new Promise((resolve) => { resolveFirst = resolve }))
      .mockImplementationOnce(() => new Promise((resolve) => { resolveSecond = resolve }))

    const wrapper = mount(PromotionDetailView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true,
          ElImage: {
            template: '<img />'
          }
        }
      }
    })

    ;(wrapper.vm as unknown as { fetchCoupons: () => Promise<void> }).fetchCoupons()

    resolveSecond?.({ code: 200, data: [{ id: 13, name: '新券' }] })
    await flushPromises()

    resolveFirst?.({ code: 200, data: [{ id: 12, name: '旧券' }] })
    await flushPromises()

    expect((wrapper.vm as any).coupons).toEqual([{ id: 13, name: '新券' }])
  })

  it('does not let in-flight featured/list coupon requests overwrite claim success', async () => {
    const firstFeatured = createDeferred<any>()
    const secondFeatured = createDeferred<any>()
    const firstCoupons = createDeferred<any>()
    const secondCoupons = createDeferred<any>()

    couponApi.getCouponById
      .mockImplementationOnce(() => firstFeatured.promise)
      .mockImplementationOnce(() => secondFeatured.promise)
    couponApi.getAvailableCoupons
      .mockImplementationOnce(() => firstCoupons.promise)
      .mockImplementationOnce(() => secondCoupons.promise)
    couponApi.claimCoupon.mockResolvedValueOnce({ code: 200 })

    const wrapper = mount(PromotionDetailView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true,
          ElImage: {
            template: '<img />'
          }
        }
      }
    })

    await flushPromises()
    ;(wrapper.vm as any).featuredCoupon = { id: 12, remaining: 88, claimed: false }
    ;(wrapper.vm as any).coupons = [{ id: 12, remaining: 88, claimed: false }]

    const claimPromise = (wrapper.vm as any).claimCoupon({ id: 12, remaining: 88, claimed: false })
    await flushPromises()

    expect((wrapper.vm as any).featuredCoupon).toMatchObject({ id: 12, remaining: 87, claimed: true })
    expect((wrapper.vm as any).coupons).toEqual([{ id: 12, remaining: 87, claimed: true }])

    secondFeatured.resolve({ code: 200, data: { id: 12, remaining: 87, claimed: true } })
    secondCoupons.resolve({ code: 200, data: [{ id: 12, remaining: 87, claimed: true }] })
    await claimPromise
    await flushPromises()

    firstFeatured.resolve({ code: 200, data: { id: 12, remaining: 88, claimed: false } })
    firstCoupons.resolve({ code: 200, data: [{ id: 12, remaining: 88, claimed: false }] })
    await flushPromises()

    expect((wrapper.vm as any).featuredCoupon).toMatchObject({ id: 12, remaining: 87, claimed: true })
    expect((wrapper.vm as any).coupons).toEqual([{ id: 12, remaining: 87, claimed: true }])
  })
})
