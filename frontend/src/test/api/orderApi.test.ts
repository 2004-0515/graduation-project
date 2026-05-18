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

import orderApi from '@/api/orderApi'

describe('orderApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates order', async () => {
    const response = { code: 200, data: { id: 1 } }
    const payload = { addressId: 2, items: [{ productId: 3, quantity: 1 }] }
    axiosMock.post.mockResolvedValue(response)

    await expect(orderApi.createOrder(payload as any)).resolves.toBe(response)
    expect(axiosMock.post).toHaveBeenCalledWith('/orders', payload)
  })

  it('gets orders with default paging', async () => {
    const response = { code: 200, data: [] }
    axiosMock.get.mockResolvedValue(response)

    await expect(orderApi.getOrders()).resolves.toBe(response)
    expect(axiosMock.get).toHaveBeenCalledWith('/orders', { params: { page: 0, size: 10 } })
  })

  it('gets orders with custom paging and status', async () => {
    const response = { code: 200, data: [] }
    axiosMock.get.mockResolvedValue(response)

    await expect(orderApi.getOrders(3, 20, 2)).resolves.toBe(response)
    expect(axiosMock.get).toHaveBeenCalledWith('/orders', { params: { page: 2, size: 20, status: 2 } })
  })

  it('gets user orders with fixed paging', async () => {
    const response = { code: 200, data: [] }
    axiosMock.get.mockResolvedValue(response)

    await expect(orderApi.getUserOrders(99)).resolves.toBe(response)
    expect(axiosMock.get).toHaveBeenCalledWith('/orders', { params: { page: 0, size: 200 } })
  })

  it('gets seller pending count', async () => {
    const response = { code: 200, data: 4 }
    axiosMock.get.mockResolvedValue(response)

    await expect(orderApi.getSellerPendingCount()).resolves.toBe(response)
    expect(axiosMock.get).toHaveBeenCalledWith('/orders/seller/pending/count')
  })

  it('gets seller order items without filter', async () => {
    const response = { code: 200, data: [] }
    axiosMock.get.mockResolvedValue(response)

    await expect(orderApi.getSellerOrderItems()).resolves.toBe(response)
    expect(axiosMock.get).toHaveBeenCalledWith('/orders/seller/items', { params: {} })
  })

  it('gets seller order items with ship status filter', async () => {
    const response = { code: 200, data: [] }
    axiosMock.get.mockResolvedValue(response)

    await expect(orderApi.getSellerOrderItems(1)).resolves.toBe(response)
    expect(axiosMock.get).toHaveBeenCalledWith('/orders/seller/items', { params: { shipStatus: 1 } })
  })

  it('ships seller order item', async () => {
    const response = { code: 200 }
    axiosMock.put.mockResolvedValue(response)

    await expect(orderApi.shipSellerOrderItem(11)).resolves.toBe(response)
    expect(axiosMock.put).toHaveBeenCalledWith('/orders/seller/items/11/ship')
  })

  it('gets order by id', async () => {
    const response = { code: 200, data: { id: 12 } }
    axiosMock.get.mockResolvedValue(response)

    await expect(orderApi.getOrderById(12)).resolves.toBe(response)
    expect(axiosMock.get).toHaveBeenCalledWith('/orders/12')
  })

  it('cancels order', async () => {
    const response = { code: 200 }
    axiosMock.put.mockResolvedValue(response)

    await expect(orderApi.cancelOrder(15)).resolves.toBe(response)
    expect(axiosMock.put).toHaveBeenCalledWith('/orders/15/cancel')
  })

  it('requests order cancellation', async () => {
    const response = { code: 200 }
    axiosMock.put.mockResolvedValue(response)

    await expect(orderApi.requestCancelOrder(16)).resolves.toBe(response)
    expect(axiosMock.put).toHaveBeenCalledWith('/orders/16/request-cancel')
  })

  it('pays order', async () => {
    const response = { code: 200, data: { id: 18 } }
    axiosMock.put.mockResolvedValue(response)

    await expect(orderApi.payOrder(18, 2)).resolves.toBe(response)
    expect(axiosMock.put).toHaveBeenCalledWith('/orders/18/pay', { paymentMethod: 2 })
  })

  it('confirms receipt', async () => {
    const response = { code: 200 }
    axiosMock.put.mockResolvedValue(response)

    await expect(orderApi.confirmReceive(19)).resolves.toBe(response)
    expect(axiosMock.put).toHaveBeenCalledWith('/orders/19/confirm')
  })
})
