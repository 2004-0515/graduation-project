import { beforeEach, describe, expect, it, vi } from 'vitest'

const axiosMock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn()
}))

vi.mock('@/utils/axios', () => ({
  default: axiosMock
}))

import rationalApi from '@/api/rationalApi'

describe('rationalApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('gets budget status', async () => {
    const response = { code: 200, data: {} }
    axiosMock.get.mockResolvedValue(response)

    await expect(rationalApi.getBudgetStatus()).resolves.toBe(response)
    expect(axiosMock.get).toHaveBeenCalledWith('/rational-consumption/budget/status')
  })

  it('gets current budget', async () => {
    const response = { code: 200, data: {} }
    axiosMock.get.mockResolvedValue(response)

    await expect(rationalApi.getCurrentBudget()).resolves.toBe(response)
    expect(axiosMock.get).toHaveBeenCalledWith('/rational-consumption/budget')
  })

  it('sets budget', async () => {
    const response = { code: 200, data: {} }
    axiosMock.post.mockResolvedValue(response)

    await expect(rationalApi.setBudget(1000, 80)).resolves.toBe(response)
    expect(axiosMock.post).toHaveBeenCalledWith('/rational-consumption/budget', { amount: 1000, alertThreshold: 80 })
  })

  it('gets report without period filter', async () => {
    const response = { code: 200, data: [] }
    axiosMock.get.mockResolvedValue(response)

    await expect(rationalApi.getReport()).resolves.toBe(response)
    expect(axiosMock.get).toHaveBeenCalledWith('/rational-consumption/report', { params: {} })
  })

  it('gets report with period filter', async () => {
    const response = { code: 200, data: [] }
    axiosMock.get.mockResolvedValue(response)

    await expect(rationalApi.getReport('month')).resolves.toBe(response)
    expect(axiosMock.get).toHaveBeenCalledWith('/rational-consumption/report', { params: { period: 'month' } })
  })

  it('checks duplicate purchase', async () => {
    const response = { code: 200, data: [] }
    axiosMock.get.mockResolvedValue(response)

    await expect(rationalApi.checkDuplicate(5)).resolves.toBe(response)
    expect(axiosMock.get).toHaveBeenCalledWith('/rational-consumption/duplicate-check/5')
  })

  it('checks duplicate purchase in batch', async () => {
    const response = { code: 200, data: {} }
    axiosMock.post.mockResolvedValue(response)

    await expect(rationalApi.checkDuplicateBatch([1, 2])).resolves.toBe(response)
    expect(axiosMock.post).toHaveBeenCalledWith('/rational-consumption/duplicate-check/batch', [1, 2])
  })

  it('adds product to wishlist', async () => {
    const response = { code: 200, data: {} }
    axiosMock.post.mockResolvedValue(response)

    await expect(rationalApi.addToWishlist(9, 7, 'wait')).resolves.toBe(response)
    expect(axiosMock.post).toHaveBeenCalledWith('/rational-consumption/wishlist', {
      productId: 9,
      coolingDays: 7,
      reason: 'wait'
    })
  })

  it('checks whether product is in wishlist', async () => {
    const response = { code: 200, data: { inWishlist: true } }
    axiosMock.get.mockResolvedValue(response)

    await expect(rationalApi.checkInWishlist(9)).resolves.toBe(response)
    expect(axiosMock.get).toHaveBeenCalledWith('/rational-consumption/wishlist/check/9')
  })

  it('gets wishlist', async () => {
    const response = { code: 200, data: [] }
    axiosMock.get.mockResolvedValue(response)

    await expect(rationalApi.getWishlist()).resolves.toBe(response)
    expect(axiosMock.get).toHaveBeenCalledWith('/rational-consumption/wishlist')
  })

  it('gets wishlist stats', async () => {
    const response = { code: 200, data: {} }
    axiosMock.get.mockResolvedValue(response)

    await expect(rationalApi.getWishlistStats()).resolves.toBe(response)
    expect(axiosMock.get).toHaveBeenCalledWith('/rational-consumption/wishlist/stats')
  })

  it('removes wishlist item', async () => {
    const response = { code: 200 }
    axiosMock.delete.mockResolvedValue(response)

    await expect(rationalApi.removeFromWishlist(3)).resolves.toBe(response)
    expect(axiosMock.delete).toHaveBeenCalledWith('/rational-consumption/wishlist/3')
  })

  it('marks wishlist item as purchased', async () => {
    const response = { code: 200 }
    axiosMock.post.mockResolvedValue(response)

    await expect(rationalApi.markAsPurchased(3)).resolves.toBe(response)
    expect(axiosMock.post).toHaveBeenCalledWith('/rational-consumption/wishlist/3/purchased')
  })

  it('gets achievements', async () => {
    const response = { code: 200, data: [] }
    axiosMock.get.mockResolvedValue(response)

    await expect(rationalApi.getAchievements()).resolves.toBe(response)
    expect(axiosMock.get).toHaveBeenCalledWith('/rational-consumption/achievements')
  })

  it('gets admin stats', async () => {
    const response = { code: 200, data: {} }
    axiosMock.get.mockResolvedValue(response)

    await expect(rationalApi.getAdminStats()).resolves.toBe(response)
    expect(axiosMock.get).toHaveBeenCalledWith('/rational-consumption/admin/stats')
  })

  it('gets consumption trend', async () => {
    const response = { code: 200, data: [] }
    axiosMock.get.mockResolvedValue(response)

    await expect(rationalApi.getConsumptionTrend()).resolves.toBe(response)
    expect(axiosMock.get).toHaveBeenCalledWith('/rational-consumption/admin/consumption-trend')
  })

  it('gets wishlist activity', async () => {
    const response = { code: 200, data: [] }
    axiosMock.get.mockResolvedValue(response)

    await expect(rationalApi.getWishlistActivity()).resolves.toBe(response)
    expect(axiosMock.get).toHaveBeenCalledWith('/rational-consumption/admin/wishlist-activity')
  })

  it('gets recent achievements', async () => {
    const response = { code: 200, data: [] }
    axiosMock.get.mockResolvedValue(response)

    await expect(rationalApi.getRecentAchievements()).resolves.toBe(response)
    expect(axiosMock.get).toHaveBeenCalledWith('/rational-consumption/admin/recent-achievements')
  })

  it('grants achievement', async () => {
    const response = { code: 200, data: {} }
    axiosMock.post.mockResolvedValue(response)

    await expect(rationalApi.grantAchievement(2, 'saver')).resolves.toBe(response)
    expect(axiosMock.post).toHaveBeenCalledWith('/rational-consumption/admin/grant-achievement', { userId: 2, type: 'saver' })
  })

  it('revokes achievement', async () => {
    const response = { code: 200, data: {} }
    axiosMock.post.mockResolvedValue(response)

    await expect(rationalApi.revokeAchievement(2, 'saver')).resolves.toBe(response)
    expect(axiosMock.post).toHaveBeenCalledWith('/rational-consumption/admin/revoke-achievement', { userId: 2, type: 'saver' })
  })
})
