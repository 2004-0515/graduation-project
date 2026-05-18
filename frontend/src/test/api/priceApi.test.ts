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

import priceApi from '@/api/priceApi'

describe('priceApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('gets admin alerts with empty params by default', async () => {
    const response = { code: 200, data: [] }
    axiosMock.get.mockResolvedValue(response)

    await expect(priceApi.getAdminAlerts()).resolves.toBe(response)
    expect(axiosMock.get).toHaveBeenCalledWith('/price/admin/alerts', { params: {} })
  })

  it('gets admin alerts with filters', async () => {
    const response = { code: 200, data: [] }
    axiosMock.get.mockResolvedValue(response)

    await expect(priceApi.getAdminAlerts({ status: 0, keyword: 'alice' })).resolves.toBe(response)
    expect(axiosMock.get).toHaveBeenCalledWith('/price/admin/alerts', { params: { status: 0, keyword: 'alice' } })
  })

  it('gets admin active alert count', async () => {
    const response = { code: 200, data: 4 }
    axiosMock.get.mockResolvedValue(response)

    await expect(priceApi.getAdminActiveAlertCount()).resolves.toBe(response)
    expect(axiosMock.get).toHaveBeenCalledWith('/price/admin/alerts/count')
  })

  it('records admin price', async () => {
    const response = { code: 200, data: { id: 3 } }
    const payload = { productId: 1, price: 88, originalPrice: 99 }
    axiosMock.post.mockResolvedValue(response)

    await expect(priceApi.recordAdminPrice(payload)).resolves.toBe(response)
    expect(axiosMock.post).toHaveBeenCalledWith('/price/admin/record', payload)
  })

  it('deletes admin price history', async () => {
    const response = { code: 200 }
    axiosMock.delete.mockResolvedValue(response)

    await expect(priceApi.deleteAdminPriceHistory(7)).resolves.toBe(response)
    expect(axiosMock.delete).toHaveBeenCalledWith('/price/admin/history/7')
  })

  it('triggers admin alert', async () => {
    const response = { code: 200 }
    axiosMock.post.mockResolvedValue(response)

    await expect(priceApi.triggerAdminAlert(9)).resolves.toBe(response)
    expect(axiosMock.post).toHaveBeenCalledWith('/price/admin/alert/9/trigger')
  })

  it('resets admin alert', async () => {
    const response = { code: 200 }
    axiosMock.post.mockResolvedValue(response)

    await expect(priceApi.resetAdminAlert(9)).resolves.toBe(response)
    expect(axiosMock.post).toHaveBeenCalledWith('/price/admin/alert/9/reset')
  })

  it('deletes admin alert', async () => {
    const response = { code: 200 }
    axiosMock.delete.mockResolvedValue(response)

    await expect(priceApi.deleteAdminAlert(9)).resolves.toBe(response)
    expect(axiosMock.delete).toHaveBeenCalledWith('/price/admin/alert/9')
  })

  it('gets user alert details', async () => {
    const response = { code: 200, data: [] }
    axiosMock.get.mockResolvedValue(response)

    await expect(priceApi.getUserAlertDetails()).resolves.toBe(response)
    expect(axiosMock.get).toHaveBeenCalledWith('/price/alerts/detail')
  })
})
