import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ElMessage } from 'element-plus'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import productApi from '@/api/productApi'
import categoryApi from '@/api/categoryApi'
import couponApi from '@/api/couponApi'
import showcaseApi from '@/api/showcaseApi'
import fileApi from '@/api/fileApi'
import { useUserStore } from '@/stores/userStore'
import * as debugModule from '@/utils/debug'
import HomeView from '@/views/HomeView.vue'

const messages = {
  success: vi.spyOn(ElMessage, 'success').mockImplementation(() => '' as any),
  error: vi.spyOn(ElMessage, 'error').mockImplementation(() => '' as any),
  warning: vi.spyOn(ElMessage, 'warning').mockImplementation(() => '' as any)
}

const getProductsSpy = vi.spyOn(productApi, 'getProducts')
const getCategoriesSpy = vi.spyOn(categoryApi, 'getCategories')
const getAvailableCouponsSpy = vi.spyOn(couponApi, 'getAvailableCoupons')
const claimCouponSpy = vi.spyOn(couponApi, 'claimCoupon')
const getPublicBannersSpy = vi.spyOn(showcaseApi, 'getPublicBanners')
const getImageUrlSpy = vi.spyOn(fileApi, 'getImageUrl')
const debugError = vi.spyOn(debugModule, 'debugError').mockImplementation(() => {})

describe('HomeView', () => {
  let pinia: ReturnType<typeof createPinia>
  let userStore: ReturnType<typeof useUserStore>

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()

    pinia = createPinia()
    setActivePinia(pinia)
    userStore = useUserStore()
    userStore.token = null
    userStore.userInfo = null

    getCategoriesSpy.mockResolvedValue({ code: 200, data: [] } as any)
    getPublicBannersSpy.mockResolvedValue({ code: 200, data: [] } as any)
    getProductsSpy.mockResolvedValue({ code: 200, data: { content: [] } } as any)
    getAvailableCouponsSpy.mockResolvedValue({
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
    } as any)
    claimCouponSpy.mockResolvedValue({ code: 200 } as any)
    getImageUrlSpy.mockReturnValue('/img.png')
    debugError.mockImplementation(() => {})
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  const mountView = async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: { template: '<div />' } },
        { path: '/login', component: { template: '<div />' } },
        { path: '/hot', component: { template: '<div />' } },
        { path: '/category', component: { template: '<div />' } },
        { path: '/product/:id', component: { template: '<div />' } },
        { path: '/promotions', component: { template: '<div />' } },
        { path: '/promotion/:id', component: { template: '<div />' } }
      ]
    })

    await router.push('/')
    await router.isReady()

    const wrapper = mount(HomeView, {
      global: {
        plugins: [pinia, router],
        stubs: {
          Navbar: true,
          Footer: true
        }
      }
    })

    return { wrapper, router }
  }

  it('shows Chinese login warning before anonymous quick claim', async () => {
    const { wrapper, router } = await mountView()

    await flushPromises()
    await (wrapper.vm as unknown as { claimQuickCoupon: (coupon: { id: number; claimed: boolean }) => Promise<void> })
      .claimQuickCoupon({ id: 1, claimed: false })
    await flushPromises()

    expect(messages.warning).toHaveBeenCalledWith('请先登录')
    expect(router.currentRoute.value.fullPath).toBe('/login')
    expect(claimCouponSpy).not.toHaveBeenCalled()
  })

  it('refetches coupons after quick claim succeeds', async () => {
    userStore.token = 'token'
    userStore.userInfo = { id: 1, username: 'buyer' } as any

    const { wrapper } = await mountView()
    await flushPromises()

    await (wrapper.vm as unknown as { claimQuickCoupon: (coupon: { id: number; claimed: boolean }) => Promise<void> })
      .claimQuickCoupon({ id: 1, claimed: false })
    await flushPromises()

    expect(claimCouponSpy).toHaveBeenCalledWith(1)
    expect(getAvailableCouponsSpy).toHaveBeenCalledTimes(2)
    expect(messages.success).toHaveBeenCalledWith('领取成功')
  })

  it('keeps quick claim successful when coupon refresh fails afterward', async () => {
    userStore.token = 'token'
    userStore.userInfo = { id: 1, username: 'buyer' } as any
    getAvailableCouponsSpy
      .mockResolvedValueOnce({
        code: 200,
        data: [{ id: 1, name: '首页券', type: 1, discountAmount: 10, minAmount: 100, claimed: false }]
      } as any)
      .mockRejectedValueOnce(new Error('refresh failed'))

    const { wrapper } = await mountView()
    await flushPromises()

    await (wrapper.vm as unknown as { claimQuickCoupon: (coupon: { id: number; claimed: boolean }) => Promise<void> })
      .claimQuickCoupon({ id: 1, claimed: false })
    await flushPromises()

    expect(messages.success).toHaveBeenCalledWith('领取成功')
    expect(messages.error).not.toHaveBeenCalled()
    expect(debugError).toHaveBeenCalledWith('获取首页优惠券失败', expect.any(Error))
  })

  it('shows backend message when quick claim throws', async () => {
    userStore.token = 'token'
    userStore.userInfo = { id: 1, username: 'buyer' } as any
    claimCouponSpy.mockRejectedValue({ response: { data: { message: '优惠券已领完' } } })

    const { wrapper } = await mountView()
    await flushPromises()

    await (wrapper.vm as unknown as { claimQuickCoupon: (coupon: { id: number; claimed: boolean }) => Promise<void> })
      .claimQuickCoupon({ id: 1, claimed: false })
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('优惠券已领完')
    expect(debugError).toHaveBeenCalled()
  })

  it('logs backend message when quick claim returns non-200 payload', async () => {
    userStore.token = 'token'
    userStore.userInfo = { id: 1, username: 'buyer' } as any
    claimCouponSpy.mockResolvedValue({ code: 500, message: '活动已结束' } as any)

    const { wrapper } = await mountView()
    await flushPromises()

    await (wrapper.vm as unknown as { claimQuickCoupon: (coupon: { id: number; claimed: boolean }) => Promise<void> })
      .claimQuickCoupon({ id: 1, claimed: false })
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('活动已结束')
    expect(debugError).toHaveBeenCalledWith('首页快捷领取优惠券失败', '活动已结束')
  })

  it('ignores stale coupon responses and keeps the newest homepage coupon state', async () => {
    let resolveFirst: ((value: any) => void) | undefined
    let resolveSecond: ((value: any) => void) | undefined

    getAvailableCouponsSpy
      .mockImplementationOnce(() => new Promise((resolve) => { resolveFirst = resolve }))
      .mockImplementationOnce(() => new Promise((resolve) => { resolveSecond = resolve }))

    const { wrapper } = await mountView()
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
    getCategoriesSpy.mockResolvedValue({ code: 500, message: '分类读取失败' } as any)

    await mountView()
    await flushPromises()

    expect(debugError).toHaveBeenCalledWith('获取首页分类失败', '分类读取失败')
  })

  it('logs backend message when homepage hot products return non-200 payload', async () => {
    getProductsSpy
      .mockResolvedValueOnce({ code: 500, message: '热销商品读取失败' } as any)
      .mockResolvedValueOnce({ code: 200, data: { content: [] } } as any)

    await mountView()
    await flushPromises()

    expect(debugError).toHaveBeenCalledWith('获取首页热销商品失败', '热销商品读取失败')
  })

  it('logs backend message when homepage newest products return non-200 payload', async () => {
    getProductsSpy
      .mockResolvedValueOnce({ code: 200, data: { content: [] } } as any)
      .mockResolvedValueOnce({ code: 500, message: '新品读取失败' } as any)

    await mountView()
    await flushPromises()

    expect(debugError).toHaveBeenCalledWith('获取首页新品失败', '新品读取失败')
  })
})
