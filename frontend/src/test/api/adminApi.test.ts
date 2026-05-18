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

import adminApi from '@/api/adminApi'

describe('adminApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('gets pending file count', async () => {
    const response = { code: 200, data: 3 }
    axiosMock.get.mockResolvedValue(response)

    await expect(adminApi.getPendingFileCount()).resolves.toBe(response)
    expect(axiosMock.get).toHaveBeenCalledWith('/files/pending/count')
  })

  it('gets pending product count', async () => {
    const response = { code: 200, data: 5 }
    axiosMock.get.mockResolvedValue(response)

    await expect(adminApi.getPendingProductCount()).resolves.toBe(response)
    expect(axiosMock.get).toHaveBeenCalledWith('/products/pending/count')
  })

  it('gets pending products', async () => {
    const response = { code: 200, data: [{ id: 1, name: '商品A' }] }
    axiosMock.get.mockResolvedValue(response)

    await expect(adminApi.getPendingProducts()).resolves.toBe(response)
    expect(axiosMock.get).toHaveBeenCalledWith('/products/pending')
  })

  it('updates user role', async () => {
    const response = { code: 200, data: { id: 1, role: 'SELLER' } }
    axiosMock.put.mockResolvedValue(response)

    await expect(adminApi.updateUserRole(1, 'SELLER' as any)).resolves.toBe(response)
    expect(axiosMock.put).toHaveBeenCalledWith('/users/1/role', { role: 'SELLER' })
  })

  it('updates all product status in batch', async () => {
    const response = { code: 200 }
    axiosMock.put.mockResolvedValue(response)

    await expect(adminApi.batchUpdateAllProductStatus(1)).resolves.toBe(response)
    expect(axiosMock.put).toHaveBeenCalledWith('/products/batch-status', { status: 1 })
  })

  it('reviews product with audit payload', async () => {
    const response = { code: 200 }
    const payload = { auditStatus: 1, adVideoEnabled: 1, adVideoDuration: 5 }
    axiosMock.post.mockResolvedValue(response)

    await expect(adminApi.reviewProduct(12, payload)).resolves.toBe(response)
    expect(axiosMock.post).toHaveBeenCalledWith('/products/12/audit', payload)
  })

  it('gets pending cancel request count', async () => {
    const response = { code: 200, data: 2 }
    axiosMock.get.mockResolvedValue(response)

    await expect(adminApi.getPendingOrderCount()).resolves.toBe(response)
    expect(axiosMock.get).toHaveBeenCalledWith('/orders/cancel-requests/count')
  })
})
