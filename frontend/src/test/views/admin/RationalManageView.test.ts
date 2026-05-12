import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { rationalApi, messages, messageBox, debugError } = vi.hoisted(() => ({
  rationalApi: {
    getAdminStats: vi.fn(),
    getConsumptionTrend: vi.fn(),
    getWishlistActivity: vi.fn(),
    getRecentAchievements: vi.fn(),
    grantAchievement: vi.fn(),
    revokeAchievement: vi.fn()
  },
  messages: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn()
  },
  messageBox: {
    confirm: vi.fn()
  },
  debugError: vi.fn()
}))

vi.mock('element-plus', () => ({
  ElMessage: messages,
  ElMessageBox: messageBox
}))

vi.mock('@/api/rationalApi', () => ({
  default: rationalApi
}))

vi.mock('@/api/fileApi', () => ({
  default: {
    getImageUrl: vi.fn(() => '/img.png')
  }
}))

vi.mock('@/utils/debug', () => ({
  debugError
}))

vi.mock('echarts/core', () => ({
  use: vi.fn(),
  init: vi.fn(() => ({
    setOption: vi.fn(),
    dispose: vi.fn(),
    resize: vi.fn()
  }))
}))

import RationalManageView from '@/views/admin/RationalManageView.vue'

const deferred = <T>() => {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('RationalManageView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    messageBox.confirm.mockResolvedValue(undefined)
    rationalApi.getAdminStats.mockResolvedValue({ code: 200, data: {} })
    rationalApi.getConsumptionTrend.mockResolvedValue({ code: 200, data: [] })
    rationalApi.getWishlistActivity.mockResolvedValue({ code: 200, data: [] })
    rationalApi.getRecentAchievements.mockResolvedValue({ code: 200, data: [] })
  })

  const mountView = () =>
    mount(RationalManageView, {
      global: {
        stubs: {
          AdminLayout: { template: '<div><slot /></div>' },
          ElForm: { template: '<form><slot /></form>' },
          ElFormItem: { template: '<div><slot /></div>' },
          ElInputNumber: true,
          ElSelect: true,
          ElOption: true,
          ElButton: { template: '<button @click="$emit(\'click\')"><slot /></button>' }
        }
      }
    })

  it('logs when admin stats returns non-200 payload', async () => {
    rationalApi.getAdminStats.mockResolvedValue({ code: 500, message: '读取失败' })

    mountView()
    await flushPromises()

    expect(debugError).toHaveBeenCalledWith('获取理性消费统计数据失败:', '读取失败')
  })

  it('shows backend message when granting achievement returns non-200 payload', async () => {
    rationalApi.grantAchievement.mockResolvedValue({ code: 422, message: '成就类型无效' })
    const wrapper = mountView()

    await flushPromises()
    ;(wrapper.vm as unknown as { grantForm: { userId: number | null; type: string } }).grantForm = {
      userId: 1,
      type: 'BAD_TYPE'
    }

    await (wrapper.vm as unknown as { handleGrantAchievement: () => Promise<void> }).handleGrantAchievement()
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('成就类型无效')
    expect(debugError).toHaveBeenCalledWith('授予成就失败', '成就类型无效')
  })

  it('does not show an error when revoke confirmation is cancelled', async () => {
    messageBox.confirm.mockRejectedValue('cancel')
    const wrapper = mountView()

    await flushPromises()
    await (wrapper.vm as unknown as { handleRevokeAchievement: (item: any) => Promise<void> }).handleRevokeAchievement({
      userId: 1,
      type: 'FIRST_WISHLIST',
      username: 'buyer',
      name: '理性第一步'
    })
    await flushPromises()

    expect(rationalApi.revokeAchievement).not.toHaveBeenCalled()
    expect(messages.error).not.toHaveBeenCalled()
  })

  it('shows backend message when revoke achievement request fails', async () => {
    rationalApi.revokeAchievement.mockRejectedValue({
      response: {
        data: {
          message: '撤销失败'
        }
      }
    })
    const wrapper = mountView()

    await flushPromises()
    await (wrapper.vm as unknown as { handleRevokeAchievement: (item: any) => Promise<void> }).handleRevokeAchievement({
      userId: 1,
      type: 'FIRST_WISHLIST',
      username: 'buyer',
      name: '理性第一步'
    })
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('撤销失败')
    expect(debugError).toHaveBeenCalled()
  })

  it('logs backend message when revoking achievement returns non-200 payload', async () => {
    rationalApi.revokeAchievement.mockResolvedValue({ code: 500, message: '撤销成就失败' })
    const wrapper = mountView()

    await flushPromises()
    await (wrapper.vm as unknown as { handleRevokeAchievement: (item: any) => Promise<void> }).handleRevokeAchievement({
      userId: 1,
      type: 'FIRST_WISHLIST',
      username: 'buyer',
      name: '理性第一步'
    })
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('撤销成就失败')
    expect(debugError).toHaveBeenCalledWith('撤销成就失败', '撤销成就失败')
  })

  it('refreshes stats and achievements after granting achievement successfully', async () => {
    rationalApi.grantAchievement.mockResolvedValue({ code: 200 })
    const wrapper = mountView()

    await flushPromises()
    ;(wrapper.vm as unknown as { grantForm: { userId: number | null; type: string } }).grantForm = {
      userId: 1,
      type: 'FIRST_WISHLIST'
    }

    await (wrapper.vm as unknown as { handleGrantAchievement: () => Promise<void> }).handleGrantAchievement()
    await flushPromises()

    expect(rationalApi.getAdminStats).toHaveBeenCalledTimes(2)
    expect(rationalApi.getRecentAchievements).toHaveBeenCalledTimes(2)
    expect(messages.success).toHaveBeenCalledWith('成就授予成功')
  })

  it('keeps grant success when achievement refresh rejects afterward', async () => {
    rationalApi.grantAchievement.mockResolvedValue({ code: 200 })
    rationalApi.getAdminStats
      .mockResolvedValueOnce({
        code: 200,
        data: { totalAchievementsGranted: 0, achievementDistribution: {} }
      })
      .mockRejectedValueOnce(new Error('refresh failed'))
    rationalApi.getRecentAchievements
      .mockResolvedValueOnce({ code: 200, data: [] })
      .mockRejectedValueOnce(new Error('refresh failed'))
    const wrapper = mountView()

    await flushPromises()
    ;(wrapper.vm as unknown as { grantForm: { userId: number | null; type: string } }).grantForm = {
      userId: 1,
      type: 'FIRST_WISHLIST'
    }

    await (wrapper.vm as unknown as { handleGrantAchievement: () => Promise<void> }).handleGrantAchievement()
    await flushPromises()

    expect(messages.success).toHaveBeenCalledWith('成就授予成功')
    expect(messages.error).not.toHaveBeenCalled()
    expect((wrapper.vm as any).recentAchievements[0]).toEqual(expect.objectContaining({
      userId: 1,
      type: 'FIRST_WISHLIST',
      name: '理性第一步'
    }))
    expect((wrapper.vm as any).stats).toEqual(expect.objectContaining({
      totalAchievementsGranted: 1,
      achievementDistribution: expect.objectContaining({ FIRST_WISHLIST: 1 })
    }))
    expect(debugError).toHaveBeenCalledWith('获取成就记录失败', expect.any(Error))
  })

  it('keeps newer wishlist activity when older request resolves later', async () => {
    const first = deferred<any>()
    const second = deferred<any>()
    rationalApi.getWishlistActivity
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)

    const wrapper = mountView()
    await flushPromises()

    const vm = wrapper.vm as unknown as { fetchWishlistActivity: () => Promise<void> }
    const secondFetch = vm.fetchWishlistActivity()
    await flushPromises()

    second.resolve({
      code: 200,
      data: [{ id: 2, username: 'newer', productName: '新品', statusName: '冷静中' }]
    })
    await secondFetch
    await flushPromises()

    expect((wrapper.vm as any).wishlistActivity).toEqual([
      { id: 2, username: 'newer', productName: '新品', statusName: '冷静中' }
    ])

    first.resolve({
      code: 200,
      data: [{ id: 1, username: 'older', productName: '旧品', statusName: '冷静中' }]
    })
    await flushPromises()

    expect((wrapper.vm as any).wishlistActivity).toEqual([
      { id: 2, username: 'newer', productName: '新品', statusName: '冷静中' }
    ])
  })

  it('does not let an in-flight achievements request restore a revoked achievement', async () => {
    const first = deferred<any>()
    const second = deferred<any>()
    rationalApi.getRecentAchievements
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)
    rationalApi.revokeAchievement.mockResolvedValue({ code: 200 })

    const wrapper = mountView()
    await flushPromises()
    ;(wrapper.vm as any).recentAchievements = [{
      id: 1,
      userId: 2,
      type: 'FIRST_WISHLIST',
      name: '理性第一步',
      username: 'buyer',
      achievedTime: '2026-05-10T10:00:00'
    }]
    Object.assign((wrapper.vm as any).stats, {
      totalAchievementsGranted: 1,
      achievementDistribution: { FIRST_WISHLIST: 1 }
    })

    const revokePromise = (wrapper.vm as any).handleRevokeAchievement((wrapper.vm as any).recentAchievements[0])
    await flushPromises()

    expect((wrapper.vm as any).recentAchievements).toEqual([])

    second.resolve({ code: 200, data: [] })
    await revokePromise
    await flushPromises()

    first.resolve({
      code: 200,
      data: [{
        id: 1,
        userId: 2,
        type: 'FIRST_WISHLIST',
        name: '理性第一步',
        username: 'buyer',
        achievedTime: '2026-05-10T10:00:00'
      }]
    })
    await flushPromises()

    expect((wrapper.vm as any).recentAchievements).toEqual([])
  })

  it('does not let an in-flight achievements request overwrite local grant success', async () => {
    const first = deferred<any>()
    const second = deferred<any>()
    rationalApi.getRecentAchievements
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)
    rationalApi.getAdminStats
      .mockResolvedValueOnce({ code: 200, data: { totalAchievementsGranted: 0, achievementDistribution: {} } })
      .mockResolvedValueOnce({ code: 200, data: { totalAchievementsGranted: 1, achievementDistribution: { FIRST_WISHLIST: 1 } } })
    rationalApi.grantAchievement.mockResolvedValue({
      code: 200,
      data: {
        id: 3,
        userId: 1,
        type: 'FIRST_WISHLIST',
        name: '理性第一步',
        username: 'buyer',
        achievedTime: '2026-05-12T10:00:00'
      }
    })

    const wrapper = mountView()
    await flushPromises()
    ;(wrapper.vm as any).recentAchievements = []
    Object.assign((wrapper.vm as any).stats, {
      totalAchievementsGranted: 0,
      achievementDistribution: {}
    })
    ;(wrapper.vm as any).grantForm = { userId: 1, type: 'FIRST_WISHLIST' }

    const grantPromise = (wrapper.vm as any).handleGrantAchievement()
    await flushPromises()

    expect((wrapper.vm as any).recentAchievements[0]).toEqual(expect.objectContaining({
      id: 3,
      userId: 1,
      type: 'FIRST_WISHLIST',
      username: 'buyer'
    }))
    expect((wrapper.vm as any).stats).toEqual(expect.objectContaining({
      totalAchievementsGranted: 1,
      achievementDistribution: expect.objectContaining({ FIRST_WISHLIST: 1 })
    }))

    second.resolve({
      code: 200,
      data: [{
        id: 3,
        userId: 1,
        type: 'FIRST_WISHLIST',
        name: '理性第一步',
        username: 'buyer',
        achievedTime: '2026-05-12T10:00:00'
      }]
    })
    await grantPromise
    await flushPromises()

    first.resolve({ code: 200, data: [] })
    await flushPromises()

    expect((wrapper.vm as any).recentAchievements[0]).toEqual(expect.objectContaining({
      id: 3,
      userId: 1,
      type: 'FIRST_WISHLIST',
      username: 'buyer'
    }))
  })
})
