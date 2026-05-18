import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ElMessage } from 'element-plus'

const {
  mockPush,
  mockBack,
  mockRoute,
  couponApi,
  userStore,
  debugError
} = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockBack: vi.fn(),
  mockRoute: { params: { id: '8' }, fullPath: '/coupon/8' },
  couponApi: {
    getCouponById: vi.fn(),
    claimCoupon: vi.fn()
  },
  userStore: {
    isLoggedIn: false
  },
  debugError: vi.fn()
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

vi.mock('@/stores/userStore', () => ({
  useUserStore: () => userStore
}))

vi.mock('@/api/couponApi', () => ({
  default: couponApi
}))

vi.mock('@/utils/debug', () => ({
  debugError
}))

vi.mock('@/utils/navigation', () => ({
  buildLoginLocation: (redirect: string) => ({ path: '/login', query: { redirect } }),
  goBackOr: vi.fn()
}))

import CouponDetailView from '@/views/CouponDetailView.vue'

function createDeferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('CouponDetailView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    userStore.isLoggedIn = false
    couponApi.getCouponById.mockResolvedValue({
      code: 200,
      data: {
        id: 8,
        name: '详情券',
        type: 1,
        discountAmount: 15,
        minAmount: 99,
        totalCount: 100,
        remaining: 66,
        limitPerUser: 1,
        userClaimedCount: 0,
        claimed: false,
        statusText: '进行中',
        startTime: '2026-05-01T00:00:00',
        endTime: '2026-05-31T23:59:59'
      }
    })
  })

  const mountView = () =>
    mount(CouponDetailView, {
      global: {
        directives: {
          loading: {}
        },
        stubs: {
          Navbar: true,
          Footer: true
        }
      }
    })

  it('shows Chinese login warning before anonymous claim', async () => {
    const wrapper = mountView()
    await flushPromises()

    await (wrapper.vm as unknown as { handleClaim: () => Promise<void> }).handleClaim()

    expect(ElMessage.warning).toHaveBeenCalledWith('请先登录')
    expect(mockPush).toHaveBeenCalledWith({ path: '/login', query: { redirect: '/coupon/8' } })
    expect(couponApi.claimCoupon).not.toHaveBeenCalled()
  })

  it('refetches coupon detail after successful claim', async () => {
    userStore.isLoggedIn = true
    couponApi.claimCoupon.mockResolvedValue({ code: 200 })

    const wrapper = mountView()
    await flushPromises()

    await (wrapper.vm as unknown as { handleClaim: () => Promise<void> }).handleClaim()
    await flushPromises()

    expect(couponApi.claimCoupon).toHaveBeenCalledWith(8)
    expect(couponApi.getCouponById).toHaveBeenCalledTimes(2)
    expect(ElMessage.success).toHaveBeenCalledWith('领取成功')
  })

  it('keeps claim success when coupon detail refresh fails afterward', async () => {
    userStore.isLoggedIn = true
    couponApi.getCouponById
      .mockResolvedValueOnce({
        code: 200,
        data: {
          id: 8,
          name: '详情券',
          type: 1,
          discountAmount: 15,
          minAmount: 99,
          totalCount: 100,
          remaining: 66,
          limitPerUser: 1,
          userClaimedCount: 0,
          claimed: false,
          statusText: '进行中',
          startTime: '2026-05-01T00:00:00',
          endTime: '2026-05-31T23:59:59'
        }
      })
      .mockRejectedValue(new Error('刷新失败'))
    couponApi.claimCoupon.mockResolvedValue({ code: 200 })

    const wrapper = mountView()
    await flushPromises()

    await (wrapper.vm as unknown as { handleClaim: () => Promise<void> }).handleClaim()
    await flushPromises()

    expect(ElMessage.success).toHaveBeenCalledWith('领取成功')
    expect(ElMessage.error).not.toHaveBeenCalledWith('刷新失败')
    expect(debugError).toHaveBeenCalledWith('获取优惠券详情失败', expect.any(Error))
  })

  it('shows backend message when coupon detail loading throws', async () => {
    couponApi.getCouponById.mockRejectedValue({ response: { data: { message: '优惠券不存在' } } })

    mountView()
    await flushPromises()

    expect(ElMessage.error).toHaveBeenCalledWith('优惠券不存在')
    expect(debugError).toHaveBeenCalled()
  })

  it('shows backend message when claim throws', async () => {
    userStore.isLoggedIn = true
    couponApi.claimCoupon.mockRejectedValue({ response: { data: { message: '已超过领取上限' } } })

    const wrapper = mountView()
    await flushPromises()

    await (wrapper.vm as unknown as { handleClaim: () => Promise<void> }).handleClaim()
    await flushPromises()

    expect(ElMessage.error).toHaveBeenCalledWith('已超过领取上限')
    expect(debugError).toHaveBeenCalled()
  })

  it('logs backend message when coupon detail returns non-200 payload', async () => {
    couponApi.getCouponById.mockResolvedValue({ code: 500, message: '优惠券详情加载失败' })

    mountView()
    await flushPromises()

    expect(ElMessage.error).toHaveBeenCalledWith('优惠券详情加载失败')
    expect(debugError).toHaveBeenCalledWith('获取优惠券详情失败', '优惠券详情加载失败')
  })

  it('logs backend message when claim returns non-200 payload', async () => {
    userStore.isLoggedIn = true
    couponApi.claimCoupon.mockResolvedValue({ code: 500, message: '领取次数已达上限' })

    const wrapper = mountView()
    await flushPromises()

    await (wrapper.vm as unknown as { handleClaim: () => Promise<void> }).handleClaim()
    await flushPromises()

    expect(ElMessage.error).toHaveBeenCalledWith('领取次数已达上限')
    expect(debugError).toHaveBeenCalledWith('领取优惠券失败', '领取次数已达上限')
  })

  it('ignores stale coupon detail responses when a newer refresh finishes first', async () => {
    const firstRequest = createDeferred<any>()
    const secondRequest = createDeferred<any>()

    couponApi.getCouponById
      .mockImplementationOnce(() => firstRequest.promise)
      .mockImplementationOnce(() => secondRequest.promise)

    const wrapper = mountView()
    await flushPromises()

    const vm = wrapper.vm as unknown as { fetchCoupon: () => Promise<void> }
    const refetchPromise = vm.fetchCoupon()
    await flushPromises()

    secondRequest.resolve({
      code: 200,
      data: {
        id: 8,
        name: '最新优惠券',
        type: 1,
        discountAmount: 20,
        minAmount: 99,
        totalCount: 100,
        remaining: 10,
        limitPerUser: 1,
        userClaimedCount: 1,
        claimed: true,
        statusText: '进行中',
        startTime: '2026-05-01T00:00:00',
        endTime: '2026-05-31T23:59:59'
      }
    })
    await refetchPromise
    await flushPromises()

    expect(wrapper.text()).toContain('最新优惠券')
    expect(wrapper.text()).toContain('已领取')

    firstRequest.resolve({
      code: 200,
      data: {
        id: 8,
        name: '旧优惠券',
        type: 1,
        discountAmount: 15,
        minAmount: 99,
        totalCount: 100,
        remaining: 66,
        limitPerUser: 1,
        userClaimedCount: 0,
        claimed: false,
        statusText: '进行中',
        startTime: '2026-05-01T00:00:00',
        endTime: '2026-05-31T23:59:59'
      }
    })
    await flushPromises()

    expect(wrapper.text()).toContain('最新优惠券')
    expect(wrapper.text()).not.toContain('旧优惠券')
  })

  it('reloads coupon detail when route param id changes', async () => {
    const wrapper = mountView()
    await flushPromises()

    mockRoute.params.id = '9'
    couponApi.getCouponById.mockResolvedValueOnce({
      code: 200,
      data: {
        id: 9,
        name: '新详情券',
        type: 1,
        discountAmount: 20,
        minAmount: 199,
        totalCount: 50,
        remaining: 10,
        limitPerUser: 1,
        userClaimedCount: 0,
        claimed: false,
        statusText: '进行中',
        startTime: '2026-06-01T00:00:00',
        endTime: '2026-06-30T23:59:59'
      }
    })

    await (wrapper.vm as unknown as { reloadCouponDetailFromRoute: () => void }).reloadCouponDetailFromRoute()
    await flushPromises()

    expect(couponApi.getCouponById).toHaveBeenLastCalledWith(9)
    expect(wrapper.text()).toContain('新详情券')
  })

  it('does not let an in-flight coupon detail request overwrite claim success', async () => {
    userStore.isLoggedIn = true
    const firstRequest = createDeferred<any>()
    const secondRequest = createDeferred<any>()

    couponApi.getCouponById
      .mockImplementationOnce(() => firstRequest.promise)
      .mockImplementationOnce(() => secondRequest.promise)
    couponApi.claimCoupon.mockResolvedValue({ code: 200 })

    const wrapper = mountView()
    await flushPromises()

    ;(wrapper.vm as any).coupon = {
      id: 8,
      name: '详情券',
      remaining: 66,
      claimed: false,
      userClaimedCount: 0,
      statusText: '进行中'
    }

    const claimPromise = (wrapper.vm as any).handleClaim()
    await flushPromises()

    expect((wrapper.vm as any).coupon).toMatchObject({
      id: 8,
      remaining: 65,
      claimed: true,
      userClaimedCount: 1
    })

    secondRequest.resolve({
      code: 200,
      data: {
        id: 8,
        name: '详情券',
        remaining: 65,
        claimed: true,
        userClaimedCount: 1,
        statusText: '进行中'
      }
    })
    await claimPromise
    await flushPromises()

    firstRequest.resolve({
      code: 200,
      data: {
        id: 8,
        name: '详情券',
        remaining: 66,
        claimed: false,
        userClaimedCount: 0,
        statusText: '进行中'
      }
    })
    await flushPromises()

    expect((wrapper.vm as any).coupon).toMatchObject({
      id: 8,
      remaining: 65,
      claimed: true,
      userClaimedCount: 1
    })
  })
})
