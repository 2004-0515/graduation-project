import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ElMessage } from 'element-plus'

const {
  mockPush,
  couponApi,
  productApi,
  showcaseApi,
  userStore,
  debugError
} = vi.hoisted(() => ({
  mockPush: vi.fn(),
  couponApi: {
    getAvailableCoupons: vi.fn(),
    getMyCoupons: vi.fn(),
    claimCoupon: vi.fn()
  },
  productApi: {
    getProducts: vi.fn()
  },
  showcaseApi: {
    getPublicBanners: vi.fn()
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

vi.mock('@/api/couponApi', () => ({
  default: couponApi
}))

vi.mock('@/api/productApi', () => ({
  default: productApi
}))

vi.mock('@/api/showcaseApi', () => ({
  default: showcaseApi
}))

vi.mock('@/api/fileApi', () => ({
  default: {
    getImageUrl: vi.fn(() => '/img.png')
  }
}))

vi.mock('@/utils/debug', () => ({
  debugError
}))

import PromotionsView from '@/views/PromotionsView.vue'

function createDeferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('PromotionsView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    userStore.isLoggedIn = false
    couponApi.getAvailableCoupons.mockResolvedValue({ code: 200, data: [] })
    couponApi.getMyCoupons.mockResolvedValue({ code: 200, data: [] })
    productApi.getProducts.mockResolvedValue({ code: 200, data: { content: [] } })
    showcaseApi.getPublicBanners.mockResolvedValue({ code: 200, data: [] })
  })

  const mountView = () =>
    mount(PromotionsView, {
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

  it('shows Chinese login warning before anonymous claim', async () => {
    const wrapper = mountView()
    await flushPromises()

    expect(productApi.getProducts).toHaveBeenCalledWith({ pageNo: 0, pageSize: 4, sort: 'sales' })

    await (wrapper.vm as unknown as { claimCoupon: (coupon: { id: number; claimed: boolean; remaining: number }) => Promise<void> })
      .claimCoupon({ id: 2, claimed: false, remaining: 5 })

    expect(ElMessage.warning).toHaveBeenCalledWith('请先登录')
    expect(mockPush).toHaveBeenCalledWith('/login')
    expect(couponApi.claimCoupon).not.toHaveBeenCalled()
  })

  it('refetches list and my coupons after successful claim', async () => {
    userStore.isLoggedIn = true
    couponApi.claimCoupon.mockResolvedValue({ code: 200 })

    const wrapper = mountView()
    await flushPromises()

    await (wrapper.vm as unknown as { claimCoupon: (coupon: { id: number; claimed: boolean; remaining: number }) => Promise<void> })
      .claimCoupon({ id: 2, claimed: false, remaining: 5 })
    await flushPromises()

    expect(couponApi.claimCoupon).toHaveBeenCalledWith(2)
    expect(couponApi.getAvailableCoupons).toHaveBeenCalledTimes(2)
    expect(couponApi.getMyCoupons).toHaveBeenCalledTimes(2)
    expect(ElMessage.success).toHaveBeenCalledWith('领取成功')
  })

  it('keeps claim successful when my coupons refresh fails afterward', async () => {
    userStore.isLoggedIn = true
    couponApi.claimCoupon.mockResolvedValue({ code: 200 })
    couponApi.getMyCoupons
      .mockResolvedValueOnce({ code: 200, data: [] })
      .mockRejectedValueOnce(new Error('refresh failed'))

    const wrapper = mountView()
    await flushPromises()

    await (wrapper.vm as unknown as { claimCoupon: (coupon: { id: number; claimed: boolean; remaining: number }) => Promise<void> })
      .claimCoupon({ id: 2, claimed: false, remaining: 5 })
    await flushPromises()

    expect(ElMessage.success).toHaveBeenCalledWith('领取成功')
    expect(ElMessage.error).not.toHaveBeenCalled()
    expect(debugError).toHaveBeenCalledWith('获取我的优惠券失败', expect.any(Error))
  })

  it('shows backend message when claim throws', async () => {
    userStore.isLoggedIn = true
    couponApi.claimCoupon.mockRejectedValue({ response: { data: { message: '活动已结束' } } })

    const wrapper = mountView()
    await flushPromises()

    await (wrapper.vm as unknown as { claimCoupon: (coupon: { id: number; claimed: boolean; remaining: number }) => Promise<void> })
      .claimCoupon({ id: 2, claimed: false, remaining: 5 })
    await flushPromises()

    expect(ElMessage.error).toHaveBeenCalledWith('活动已结束')
    expect(debugError).toHaveBeenCalled()
  })

  it('logs backend message when claim returns non-200 payload', async () => {
    userStore.isLoggedIn = true
    couponApi.claimCoupon.mockResolvedValue({ code: 500, message: '该优惠券已领完' })

    const wrapper = mountView()
    await flushPromises()

    await (wrapper.vm as unknown as { claimCoupon: (coupon: { id: number; claimed: boolean; remaining: number }) => Promise<void> })
      .claimCoupon({ id: 2, claimed: false, remaining: 5 })
    await flushPromises()

    expect(ElMessage.error).toHaveBeenCalledWith('该优惠券已领完')
    expect(debugError).toHaveBeenCalledWith('领取优惠券失败', '该优惠券已领完')
  })

  it('ignores stale coupon responses and keeps the newest promotion list', async () => {
    let resolveFirst: ((value: any) => void) | undefined
    let resolveSecond: ((value: any) => void) | undefined

    couponApi.getAvailableCoupons
      .mockImplementationOnce(() => new Promise((resolve) => { resolveFirst = resolve }))
      .mockImplementationOnce(() => new Promise((resolve) => { resolveSecond = resolve }))

    const wrapper = mountView()
    ;(wrapper.vm as unknown as { fetchCoupons: () => Promise<void> }).fetchCoupons()

    resolveSecond?.({ code: 200, data: [{ id: 2, name: '新券' }] })
    await flushPromises()

    resolveFirst?.({ code: 200, data: [{ id: 1, name: '旧券' }] })
    await flushPromises()

    expect((wrapper.vm as any).coupons).toEqual([{ id: 2, name: '新券' }])
  })

  it('does not let an in-flight coupon request overwrite claim success in available list', async () => {
    userStore.isLoggedIn = true
    const firstCoupons = createDeferred<any>()
    const secondCoupons = createDeferred<any>()
    couponApi.getAvailableCoupons
      .mockImplementationOnce(() => firstCoupons.promise)
      .mockImplementationOnce(() => secondCoupons.promise)
    couponApi.getMyCoupons
      .mockResolvedValueOnce({ code: 200, data: [] })
      .mockResolvedValueOnce({ code: 200, data: [{ id: 2, claimed: true, remaining: 4 }] })
    couponApi.claimCoupon.mockResolvedValue({ code: 200 })

    const wrapper = mountView()
    await flushPromises()

    ;(wrapper.vm as any).coupons = [{ id: 2, claimed: false, remaining: 5 }]

    const claimPromise = (wrapper.vm as any).claimCoupon({ id: 2, claimed: false, remaining: 5 })
    await flushPromises()

    expect((wrapper.vm as any).coupons).toEqual([{ id: 2, claimed: true, remaining: 4 }])

    secondCoupons.resolve({ code: 200, data: [{ id: 2, claimed: true, remaining: 4 }] })
    await claimPromise
    await flushPromises()

    firstCoupons.resolve({ code: 200, data: [{ id: 2, claimed: false, remaining: 5 }] })
    await flushPromises()

    expect((wrapper.vm as any).coupons).toEqual([{ id: 2, claimed: true, remaining: 4 }])
  })

  it('does not let an in-flight my-coupons request overwrite claim success', async () => {
    userStore.isLoggedIn = true
    couponApi.getAvailableCoupons.mockResolvedValue({ code: 200, data: [] })
    const firstMyCoupons = createDeferred<any>()
    const secondMyCoupons = createDeferred<any>()
    couponApi.getMyCoupons
      .mockImplementationOnce(() => firstMyCoupons.promise)
      .mockImplementationOnce(() => secondMyCoupons.promise)
    couponApi.claimCoupon.mockResolvedValue({ code: 200 })

    const wrapper = mountView()
    await flushPromises()

    const claimPromise = (wrapper.vm as any).claimCoupon({ id: 2, name: '新券', claimed: false, remaining: 5 })
    await flushPromises()

    expect((wrapper.vm as any).myCoupons).toEqual([{ id: 2, name: '新券', claimed: true, remaining: 4 }])

    secondMyCoupons.resolve({ code: 200, data: [{ id: 2, name: '新券', claimed: true, remaining: 4 }] })
    await claimPromise
    await flushPromises()

    firstMyCoupons.resolve({ code: 200, data: [] })
    await flushPromises()

    expect((wrapper.vm as any).myCoupons).toEqual([{ id: 2, name: '新券', claimed: true, remaining: 4 }])
  })

  it('renders hot products from a single-page sales payload', async () => {
    productApi.getProducts.mockResolvedValue({
      code: 200,
      data: {
        content: [
          { id: 11, name: '热销商品一', price: 88, sales: 320, mainImage: '/a.png' },
          { id: 12, name: '热销商品二', price: 66, sales: 280, mainImage: '/b.png' }
        ]
      }
    })

    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.text()).toContain('热销商品一')
    expect(wrapper.text()).toContain('热销商品二')
    expect(wrapper.findAll('.flash-card')).toHaveLength(2)
  })
})
