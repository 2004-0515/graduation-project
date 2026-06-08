import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  mockPush,
  mockRoute,
  messages,
  messageBox,
  userStore,
  rationalApi,
  fileApi,
  debugError
} = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockRoute: { query: {} as Record<string, unknown> },
  messages: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn()
  },
  messageBox: {
    confirm: vi.fn()
  },
  userStore: {
    isLoggedIn: true
  },
  rationalApi: {
    getBudgetStatus: vi.fn(),
    getReport: vi.fn(),
    getWishlist: vi.fn(),
    getWishlistStats: vi.fn(),
    getAchievements: vi.fn(),
    setBudget: vi.fn(),
    removeFromWishlist: vi.fn(),
    markAsPurchased: vi.fn()
  },
  fileApi: {
    getImageUrl: vi.fn((path: string) => path)
  },
  debugError: vi.fn()
}))

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
  useRouter: () => ({ push: mockPush })
}))

vi.mock('element-plus', () => ({
  ElMessage: messages,
  ElMessageBox: messageBox
}))

vi.mock('@/stores/userStore', () => ({
  useUserStore: () => userStore
}))

vi.mock('@/api/rationalApi', () => ({
  default: rationalApi
}))

vi.mock('@/api/fileApi', () => ({
  default: fileApi
}))

vi.mock('@/utils/debug', () => ({
  debugError
}))

import RationalConsumptionView from '@/views/RationalConsumptionView.vue'

const deferred = <T>() => {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

const mountView = () =>
  mount(RationalConsumptionView, {
    global: {
      stubs: {
        Navbar: true,
        Footer: true,
        ElDialog: { template: '<div><slot /><slot name="footer" /></div>' },
        ElForm: { template: '<form><slot /></form>' },
        ElFormItem: { template: '<div><slot /></div>' },
        ElInputNumber: { template: '<input />' },
        ElSlider: { template: '<div />' },
        ElButton: {
          template: '<button><slot /></button>'
        }
      }
    }
  })

describe('RationalConsumptionView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRoute.query = {}
    userStore.isLoggedIn = true
    rationalApi.getBudgetStatus.mockResolvedValue({
      code: 200,
      data: { budget: 2000, spent: 500, remaining: 1500, usedPercent: 25, alertThreshold: 80 }
    })
    rationalApi.getReport.mockResolvedValue({
      code: 200,
      data: { rationalIndex: 88, rationalLevel: '良好', orderCount: 3, savedAmount: 50, impulseBlockedCount: 1, duplicateAlertCount: 2 }
    })
    rationalApi.getWishlist.mockResolvedValue({ code: 200, data: [] })
    rationalApi.getWishlistStats.mockResolvedValue({ code: 200, data: { coolingCount: 1, readyCount: 2, removedCount: 3, purchasedCount: 4 } })
    rationalApi.getAchievements.mockResolvedValue({ code: 200, data: [] })
    rationalApi.markAsPurchased.mockResolvedValue({ code: 200 })
  })

  it('shows unavailable hint instead of fake zeros when budget and report requests fail', async () => {
    rationalApi.getBudgetStatus.mockRejectedValueOnce(new Error('budget failed'))
    rationalApi.getReport.mockResolvedValueOnce({ code: 500, message: 'report failed' })

    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.text()).toContain('部分预算与报告数据暂未同步，请稍后刷新重试。')
    expect(wrapper.text()).toContain('--')
    expect(debugError).toHaveBeenCalledWith('获取消费报告失败:', 'report failed')
  })

  it('shows wishlist unavailable hint instead of empty state when wishlist data fails', async () => {
    rationalApi.getWishlist.mockResolvedValue({ code: 500, message: 'wishlist failed' })
    rationalApi.getWishlistStats.mockRejectedValue(new Error('wishlist stats failed'))

    const wrapper = mountView()
    await flushPromises()

    const wishlistTab = wrapper.findAll('button').find((button) => button.text() === '心愿单')
    await wishlistTab!.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('心愿单数据暂未同步，请稍后刷新重试。')
    expect(wrapper.text()).not.toContain('心愿单为空')
    expect(debugError).toHaveBeenCalled()
  })

  it('shows achievements unavailable hint and avoids fake progress when achievements fail', async () => {
    rationalApi.getAchievements.mockResolvedValue({ code: 500, message: 'achievements failed' })

    const wrapper = mountView()
    await flushPromises()

    const achievementsTab = wrapper.findAll('button').find((button) => button.text() === '消费成就')
    await achievementsTab!.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('消费成就数据暂未同步，请稍后刷新重试。')
    expect(wrapper.text()).toContain('消费成就暂未同步')
    expect(wrapper.text()).toContain('已解锁 --')
    expect(debugError).toHaveBeenCalledWith('获取成就失败:', 'achievements failed')
  })

  it('shows purchased wishlist count from backend stats', async () => {
    const wrapper = mountView()
    await flushPromises()

    const wishlistTab = wrapper.findAll('button').find((button) => button.text() === '心愿单')
    await wishlistTab!.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('已购买')
    expect(wrapper.text()).toContain('4')
  })

  it('shows duplicate purchase alert count from report data', async () => {
    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.text()).toContain('重复购买提醒')
    expect(wrapper.text()).toContain('2')
  })

  it('refreshes wishlist stats and achievements after marking an item as purchased', async () => {
    rationalApi.getWishlist
      .mockResolvedValueOnce({
        code: 200,
        data: [{ id: 7, productId: 9, productName: '待买商品', currentPrice: 88, status: 1, createdTime: '2026-05-07T10:00:00', hoursLeft: 0 }]
      })
      .mockResolvedValue({
        code: 200,
        data: []
      })

    const wrapper = mountView()
    await flushPromises()

    const wishlistTab = wrapper.findAll('button').find((button) => button.text() === '心愿单')
    await wishlistTab!.trigger('click')
    await flushPromises()

    await (wrapper.vm as any).goToBuy(9, 7)
    await flushPromises()

    expect(rationalApi.markAsPurchased).toHaveBeenCalledWith(7)
    expect(rationalApi.getWishlistStats).toHaveBeenCalledTimes(3)
    expect(rationalApi.getAchievements).toHaveBeenCalledTimes(2)
    expect(mockPush).toHaveBeenCalledWith('/product/9')
  })

  it('keeps wishlist removal successful when achievements refresh rejects afterward', async () => {
    messageBox.confirm.mockResolvedValueOnce(undefined)
    rationalApi.removeFromWishlist.mockResolvedValueOnce({ code: 200 })
    rationalApi.getAchievements
      .mockResolvedValueOnce({ code: 200, data: [] })
      .mockRejectedValueOnce(new Error('achievements refresh failed'))

    const wrapper = mountView()
    await flushPromises()

    await (wrapper.vm as any).handleRemoveWishlist(5)
    await flushPromises()

    expect(messages.success).toHaveBeenCalledWith('已移除')
    expect(messages.error).not.toHaveBeenCalled()
    expect(debugError).toHaveBeenCalledWith('获取成就失败:', expect.any(Error))
  })

  it('shows backend Chinese message when saving budget throws', async () => {
    rationalApi.setBudget.mockRejectedValueOnce({ response: { data: { message: '预算服务暂不可用' } } })

    const wrapper = mountView()
    await flushPromises()

    await (wrapper.vm as any).saveBudget()
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('预算服务暂不可用')
    expect(debugError).toHaveBeenCalledWith('保存预算失败:', expect.any(Object))
  })

  it('keeps budget save successful when budget refresh rejects afterward', async () => {
    rationalApi.setBudget.mockResolvedValueOnce({ code: 200 })
    rationalApi.getBudgetStatus
      .mockResolvedValueOnce({
        code: 200,
        data: { budget: 2000, spent: 500, remaining: 1500, usedPercent: 25, alertThreshold: 80 }
      })
      .mockRejectedValueOnce(new Error('budget refresh failed'))

    const wrapper = mountView()
    await flushPromises()

    await (wrapper.vm as any).saveBudget()
    await flushPromises()

    expect(messages.success).toHaveBeenCalledWith('预算设置成功')
    expect(messages.error).not.toHaveBeenCalled()
    expect(debugError).toHaveBeenCalledWith('获取预算状态失败:', expect.any(Error))
  })

  it('logs backend message when saving budget returns non-200 payload', async () => {
    rationalApi.setBudget.mockResolvedValueOnce({ code: 500, message: '预算设置失败' })

    const wrapper = mountView()
    await flushPromises()

    await (wrapper.vm as any).saveBudget()
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('预算设置失败')
    expect(debugError).toHaveBeenCalledWith('保存预算失败:', '预算设置失败')
  })

  it('shows backend Chinese message when removing wishlist fails', async () => {
    messageBox.confirm.mockResolvedValueOnce(undefined)
    rationalApi.removeFromWishlist.mockRejectedValueOnce({ response: { data: { message: '清单项不存在' } } })

    const wrapper = mountView()
    await flushPromises()

    await (wrapper.vm as any).handleRemoveWishlist(5)
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('清单项不存在')
    expect(debugError).toHaveBeenCalledWith('移除心愿单失败:', expect.any(Object))
  })

  it('logs backend message when removing wishlist returns non-200 payload', async () => {
    messageBox.confirm.mockResolvedValueOnce(undefined)
    rationalApi.removeFromWishlist.mockResolvedValueOnce({ code: 500, message: '清单移除失败' })

    const wrapper = mountView()
    await flushPromises()

    await (wrapper.vm as any).handleRemoveWishlist(5)
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('清单移除失败')
    expect(debugError).toHaveBeenCalledWith('移除心愿单失败:', '清单移除失败')
  })

  it('logs non-200 mark purchased response and still navigates to product', async () => {
    rationalApi.markAsPurchased.mockResolvedValueOnce({ code: 500, message: '标记失败' })

    const wrapper = mountView()
    await flushPromises()

    await (wrapper.vm as any).goToBuy(15, 8)
    await flushPromises()

    expect(debugError).toHaveBeenCalledWith('标记心愿单为已购买失败:', '标记失败')
    expect(mockPush).toHaveBeenCalledWith('/product/15')
  })

  it('keeps newer wishlist data when older request resolves later', async () => {
    const initialBudget = Promise.resolve({
      code: 200,
      data: { budget: 2000, spent: 500, remaining: 1500, usedPercent: 25, alertThreshold: 80 }
    })
    const initialReport = Promise.resolve({
      code: 200,
      data: { rationalIndex: 88, rationalLevel: '良好', orderCount: 3, savedAmount: 50, impulseBlockedCount: 1, duplicateAlertCount: 2 }
    })
    const initialWishlistStats = Promise.resolve({ code: 200, data: { coolingCount: 1, readyCount: 2, removedCount: 3, purchasedCount: 4 } })
    const initialAchievements = Promise.resolve({ code: 200, data: [] })
    const first = deferred<any>()
    const second = deferred<any>()

    rationalApi.getBudgetStatus.mockReset()
    rationalApi.getReport.mockReset()
    rationalApi.getWishlist.mockReset()
    rationalApi.getWishlistStats.mockReset()
    rationalApi.getAchievements.mockReset()

    rationalApi.getBudgetStatus.mockReturnValue(initialBudget)
    rationalApi.getReport.mockReturnValue(initialReport)
    rationalApi.getWishlist
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)
    rationalApi.getWishlistStats.mockReturnValue(initialWishlistStats)
    rationalApi.getAchievements.mockReturnValue(initialAchievements)

    const wrapper = mountView()
    await flushPromises()

    const vm = wrapper.vm as unknown as { fetchWishlist: () => Promise<void> }
    const secondFetch = vm.fetchWishlist()
    await flushPromises()

    second.resolve({
      code: 200,
      data: [{ id: 2, productId: 11, productName: '新清单商品', status: 1, createdTime: '2026-05-10T10:00:00', hoursLeft: 0 }]
    })
    await secondFetch
    await flushPromises()

    expect((wrapper.vm as any).wishlist).toEqual([
      { id: 2, productId: 11, productName: '新清单商品', status: 1, createdTime: '2026-05-10T10:00:00', hoursLeft: 0 }
    ])

    first.resolve({
      code: 200,
      data: [{ id: 1, productId: 9, productName: '旧清单商品', status: 0, createdTime: '2026-05-09T10:00:00', hoursLeft: 12 }]
    })
    await flushPromises()

    expect((wrapper.vm as any).wishlist).toEqual([
      { id: 2, productId: 11, productName: '新清单商品', status: 1, createdTime: '2026-05-10T10:00:00', hoursLeft: 0 }
    ])
  })

  it('does not let an in-flight wishlist request restore a removed wishlist item', async () => {
    const first = deferred<any>()
    const second = deferred<any>()

    rationalApi.getWishlist.mockReset()
    rationalApi.getWishlist
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)
    rationalApi.removeFromWishlist.mockResolvedValueOnce({ code: 200 })
    messageBox.confirm.mockResolvedValueOnce(undefined)

    const wrapper = mountView()
    await flushPromises()
    ;(wrapper.vm as any).wishlist = [{ id: 7, productId: 9, productName: '待移除商品', status: 1 }]
    Object.assign((wrapper.vm as any).wishlistStats, { coolingCount: 1, readyCount: 2, removedCount: 3, purchasedCount: 4 })

    const removePromise = (wrapper.vm as any).handleRemoveWishlist(7)
    await flushPromises()

    expect((wrapper.vm as any).wishlist).toEqual([])

    second.resolve({ code: 200, data: [] })
    await removePromise
    await flushPromises()

    first.resolve({ code: 200, data: [{ id: 7, productId: 9, productName: '待移除商品', status: 1 }] })
    await flushPromises()

    expect((wrapper.vm as any).wishlist).toEqual([])
  })

  it('does not let an in-flight wishlist request overwrite mark-as-purchased success', async () => {
    const first = deferred<any>()
    const second = deferred<any>()

    rationalApi.getWishlist.mockReset()
    rationalApi.getWishlist
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)
    rationalApi.markAsPurchased.mockResolvedValueOnce({ code: 200 })

    const wrapper = mountView()
    await flushPromises()
    ;(wrapper.vm as any).wishlist = [{ id: 7, productId: 9, productName: '待购买商品', status: 1 }]
    Object.assign((wrapper.vm as any).wishlistStats, { coolingCount: 1, readyCount: 2, removedCount: 3, purchasedCount: 4 })

    const buyPromise = (wrapper.vm as any).goToBuy(9, 7)
    await flushPromises()

    expect((wrapper.vm as any).wishlist).toEqual([])

    second.resolve({ code: 200, data: [] })
    await buyPromise
    await flushPromises()

    first.resolve({ code: 200, data: [{ id: 7, productId: 9, productName: '待购买商品', status: 1 }] })
    await flushPromises()

    expect((wrapper.vm as any).wishlist).toEqual([])
  })

  it('removes purchased wishlist item locally before refresh completes', async () => {
    rationalApi.markAsPurchased.mockResolvedValueOnce({ code: 200 })

    const wrapper = mountView()
    await flushPromises()
    ;(wrapper.vm as any).wishlist = [{ id: 7, productId: 9, productName: '待购买商品', status: 1 }]
    Object.assign((wrapper.vm as any).wishlistStats, { coolingCount: 1, readyCount: 2, removedCount: 3, purchasedCount: 4 })
    rationalApi.getWishlist.mockResolvedValueOnce({ code: 200, data: [] })
    rationalApi.getWishlistStats.mockResolvedValueOnce({
      code: 200,
      data: { coolingCount: 1, readyCount: 1, removedCount: 3, purchasedCount: 5 }
    })
    rationalApi.getAchievements.mockResolvedValueOnce({ code: 200, data: [] })

    await (wrapper.vm as any).goToBuy(9, 7)
    await flushPromises()

    expect((wrapper.vm as any).wishlist).toEqual([])
    expect((wrapper.vm as any).wishlistStats.readyCount).toBe(1)
    expect((wrapper.vm as any).wishlistStats.purchasedCount).toBe(5)
    expect(mockPush).toHaveBeenCalledWith('/product/9')
  })

  it('does not let an in-flight budget request overwrite budget save success', async () => {
    const first = deferred<any>()
    const second = deferred<any>()

    rationalApi.getBudgetStatus.mockReset()
    rationalApi.getBudgetStatus
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)
    rationalApi.setBudget.mockResolvedValueOnce({ code: 200 })

    const wrapper = mountView()
    await flushPromises()
    Object.assign((wrapper.vm as any).budgetStatus, { budget: 2000, spent: 500, remaining: 1500, usedPercent: 25, alertThreshold: 80 })
    ;(wrapper.vm as any).budgetForm.amount = 3000
    ;(wrapper.vm as any).budgetForm.alertThreshold = 70

    const savePromise = (wrapper.vm as any).saveBudget()
    await flushPromises()

    expect((wrapper.vm as any).budgetStatus.budget).toBe(3000)
    expect((wrapper.vm as any).budgetStatus.alertThreshold).toBe(70)

    second.resolve({ code: 200, data: { budget: 3000, spent: 500, remaining: 2500, usedPercent: 16.67, alertThreshold: 70 } })
    await savePromise
    await flushPromises()

    first.resolve({ code: 200, data: { budget: 2000, spent: 500, remaining: 1500, usedPercent: 25, alertThreshold: 80 } })
    await flushPromises()

    expect((wrapper.vm as any).budgetStatus.budget).toBe(3000)
    expect((wrapper.vm as any).budgetStatus.alertThreshold).toBe(70)
  })
})
