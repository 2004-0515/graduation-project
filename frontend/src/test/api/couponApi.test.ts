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

import couponApi from '@/api/couponApi'

describe('couponApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('gets available coupons', async () => {
    const response = { code: 200, data: [] }
    axiosMock.get.mockResolvedValue(response)

    await expect(couponApi.getAvailableCoupons()).resolves.toBe(response)
    expect(axiosMock.get).toHaveBeenCalledWith('/coupons')
  })

  it('gets coupon by id', async () => {
    const response = { code: 200, data: { id: 2 } }
    axiosMock.get.mockResolvedValue(response)

    await expect(couponApi.getCouponById(2)).resolves.toBe(response)
    expect(axiosMock.get).toHaveBeenCalledWith('/coupons/2')
  })

  it('claims coupon', async () => {
    const response = { code: 200 }
    axiosMock.post.mockResolvedValue(response)

    await expect(couponApi.claimCoupon(5)).resolves.toBe(response)
    expect(axiosMock.post).toHaveBeenCalledWith('/coupons/5/claim')
  })

  it('gets my coupons with status filter', async () => {
    const response = { code: 200, data: [] }
    axiosMock.get.mockResolvedValue(response)

    await expect(couponApi.getMyCoupons('unused')).resolves.toBe(response)
    expect(axiosMock.get).toHaveBeenCalledWith('/coupons/my', { params: { status: 'unused' } })
  })

  it('gets coupons available for order amount', async () => {
    const response = { code: 200, data: [] }
    axiosMock.get.mockResolvedValue(response)

    await expect(couponApi.getAvailableForOrder(199)).resolves.toBe(response)
    expect(axiosMock.get).toHaveBeenCalledWith('/coupons/available', { params: { orderAmount: 199 } })
  })

  it('gets all admin coupons', async () => {
    const response = { code: 200, data: [] }
    axiosMock.get.mockResolvedValue(response)

    await expect(couponApi.getAllCoupons()).resolves.toBe(response)
    expect(axiosMock.get).toHaveBeenCalledWith('/coupons/admin/all')
  })

  it('creates coupon', async () => {
    const response = { code: 200, data: { id: 1 } }
    const payload = { name: '减10', amount: 10 }
    axiosMock.post.mockResolvedValue(response)

    await expect(couponApi.createCoupon(payload)).resolves.toBe(response)
    expect(axiosMock.post).toHaveBeenCalledWith('/coupons/admin', payload)
  })

  it('updates coupon', async () => {
    const response = { code: 200, data: { id: 1 } }
    const payload = { name: '减20', amount: 20 }
    axiosMock.put.mockResolvedValue(response)

    await expect(couponApi.updateCoupon(1, payload)).resolves.toBe(response)
    expect(axiosMock.put).toHaveBeenCalledWith('/coupons/admin/1', payload)
  })

  it('deletes coupon', async () => {
    const response = { code: 200 }
    axiosMock.delete.mockResolvedValue(response)

    await expect(couponApi.deleteCoupon(1)).resolves.toBe(response)
    expect(axiosMock.delete).toHaveBeenCalledWith('/coupons/admin/1')
  })
})
