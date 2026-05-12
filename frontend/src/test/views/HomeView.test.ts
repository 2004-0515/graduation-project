import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ElMessage } from 'element-plus'

const {
  mockPush,
  productApi,
  categoryApi,
  couponApi,
  userStore,
  debugError
} = vi.hoisted(() => ({
  mockPush: vi.fn(),
  productApi: {
    getProducts: vi.fn()
  },
  categoryApi: {
    getCategories: vi.fn()
  },
  couponApi: {
    getAvailableCoupons: vi.fn(),
    claimCoupon: vi.fn()
  },
  userStore: {
    isLoggedIn: false
  },
  debugError: vi.fn()
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush })
}))

vi.mock('element-plus', () => ({
  ElMessage: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn()
  }
}))

vi.mock('@/stores/userStore', () => ({
  useUserStore: () => userStore
}))

vi.mock('@/api/productApi', () => ({
  default: productApi
}))

vi.mock('@/api/categoryApi', () => ({
  default: categoryApi
}))

vi.mock('@/api/couponApi', () => ({
  default: couponApi
}))

vi.mock('@/api/fileApi', () => ({
  default: {
    getImageUrl: vi.fn(() => '/img.png')
  }
}))

vi.mock('@/utils/debug', () => ({
  debugError
}))

import HomeView from '@/views/HomeView.vue'

describe('HomeView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    userStore.isLoggedIn = false

    categoryApi.getCategories.mockResolvedValue({ code: 200, data: [] })
    productApi.getProducts.mockResolvedValue({ code: 200, data: { content: [] } })
    couponApi.getAvailableCoupons.mockResolvedValue({
      code: 200,
      data: [
        {
          id: 1,
          name: '首页券',
          type: 1,
          discountAmount: 10,
          minAmount: 100,
          claimed: false
        }
      ]
    })
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  const mountView = () =>
    mount(HomeView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true,
          RouterLink: {
            template: '<a><slot /></a>'
          }
        }
      }
    })

  it('shows Chinese login warning before anonymous quick claim', async () => {
    const wrapper = mountView()

    await flushPromises()
    await (wrapper.vm as unknown as { claimQuickCoupon: (coupon: { id: number; claimed: boolean }) => Promise<void> })
      .claimQuickCoupon({ id: 1, claimed: false })

    expect(ElMessage.warning).toHaveBeenCalledWith('请先登录')
    expect(mockPush).toHaveBeenCalledWith('/login')
    expect(couponApi.claimCoupon).not.toHaveBeenCalled()
  })

  it('refetches coupons after quick claim succeeds', async () => {
    userStore.isLoggedIn = true
    couponApi.claimCoupon.mockResolvedValue({ code: 200 })

    const wrapper = mountView()
    await flushPromises()

    await (wrapper.vm as unknown as { claimQuickCoupon: (coupon: { id: number; claimed: boolean }) => Promise<void> })
      .claimQuickCoupon({ id: 1, claimed: false })
    await flushPromises()

    expect(couponApi.claimCoupon).toHaveBeenCalledWith(1)
    expect(couponApi.getAvailableCoupons).toHaveBeenCalledTimes(2)
    expect(ElMessage.success).toHaveBeenCalledWith('领取成功')
  })

  it('keeps quick claim successful when coupon refresh fails afterward', async () => {
    userStore.isLoggedIn = true
    couponApi.claimCoupon.mockResolvedValue({ code: 200 })
    couponApi.getAvailableCoupons
      .mockResolvedValueOnce({
        code: 200,
        data: [{ id: 1, name: '首页券', type: 1, discountAmount: 10, minAmount: 100, claimed: false }]
      })
      .mockRejectedValueOnce(new Error('refresh failed'))

    const wrapper = mountView()
    await flushPromises()

    await (wrapper.vm as unknown as { claimQuickCoupon: (coupon: { id: number; claimed: boolean }) => Promise<void> })
      .claimQuickCoupon({ id: 1, claimed: false })
    await flushPromises()

    expect(ElMessage.success).toHaveBeenCalledWith('领取成功')
    expect(ElMessage.error).not.toHaveBeenCalled()
    expect(debugError).toHaveBeenCalledWith('获取首页优惠券失败', expect.any(Error))
  })

  it('shows backend message when quick claim throws', async () => {
    userStore.isLoggedIn = true
    couponApi.claimCoupon.mockRejectedValue({ response: { data: { message: '优惠券已领完' } } })

    const wrapper = mountView()
    await flushPromises()

    await (wrapper.vm as unknown as { claimQuickCoupon: (coupon: { id: number; claimed: boolean }) => Promise<void> })
      .claimQuickCoupon({ id: 1, claimed: false })
    await flushPromises()

    expect(ElMessage.error).toHaveBeenCalledWith('优惠券已领完')
    expect(debugError).toHaveBeenCalled()
  })

  it('logs backend message when quick claim returns non-200 payload', async () => {
    userStore.isLoggedIn = true
    couponApi.claimCoupon.mockResolvedValue({ code: 500, message: '活动已结束' })

    const wrapper = mountView()
    await flushPromises()

    await (wrapper.vm as unknown as { claimQuickCoupon: (coupon: { id: number; claimed: boolean }) => Promise<void> })
      .claimQuickCoupon({ id: 1, claimed: false })
    await flushPromises()

    expect(ElMessage.error).toHaveBeenCalledWith('活动已结束')
    expect(debugError).toHaveBeenCalledWith('首页快捷领取优惠券失败', '活动已结束')
  })

  it('ignores stale coupon responses and keeps the newest homepage coupon state', async () => {
    let resolveFirst: ((value: any) => void) | undefined
    let resolveSecond: ((value: any) => void) | undefined

    couponApi.getAvailableCoupons
      .mockImplementationOnce(() => new Promise((resolve) => { resolveFirst = resolve }))
      .mockImplementationOnce(() => new Promise((resolve) => { resolveSecond = resolve }))

    const wrapper = mountView()
    await flushPromises()

    ;(wrapper.vm as unknown as { fetchCoupons: () => Promise<void> }).fetchCoupons()

    resolveSecond?.({
      code: 200,
      data: [{ id: 2, name: '新券', type: 1, discountAmount: 20, minAmount: 100, claimed: false }]
    })
    await flushPromises()

    resolveFirst?.({
      code: 200,
      data: [{ id: 1, name: '旧券', type: 1, discountAmount: 10, minAmount: 100, claimed: false }]
    })
    await flushPromises()

    expect((wrapper.vm as any).quickCoupons).toEqual([
      { id: 2, name: '新券', type: 1, discountAmount: 20, minAmount: 100, claimed: false }
    ])
    expect((wrapper.vm as any).availableCouponsCount).toBe(1)
  })

  it('logs backend message when homepage categories return non-200 payload', async () => {
    categoryApi.getCategories.mockResolvedValue({ code: 500, message: '分类读取失败' })

    mountView()
    await flushPromises()

    expect(debugError).toHaveBeenCalledWith('获取首页分类失败', '分类读取失败')
  })

  it('logs backend message when homepage hot products return non-200 payload', async () => {
    productApi.getProducts
      .mockResolvedValueOnce({ code: 500, message: '热销商品读取失败' })
      .mockResolvedValueOnce({ code: 200, data: { content: [] } })

    mountView()
    await flushPromises()

    expect(debugError).toHaveBeenCalledWith('获取首页热销商品失败', '热销商品读取失败')
  })

  it('logs backend message when homepage newest products return non-200 payload', async () => {
    productApi.getProducts
      .mockResolvedValueOnce({ code: 200, data: { content: [] } })
      .mockResolvedValueOnce({ code: 500, message: '新品读取失败' })

    mountView()
    await flushPromises()

    expect(debugError).toHaveBeenCalledWith('获取首页新品失败', '新品读取失败')
  })
})
