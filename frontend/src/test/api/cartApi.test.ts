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

import cartApi from '@/api/cartApi'

describe('cartApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('gets cart items', async () => {
    const response = { code: 200, data: [] }
    axiosMock.get.mockResolvedValue(response)

    await expect(cartApi.getCart()).resolves.toBe(response)
    expect(axiosMock.get).toHaveBeenCalledWith('/cart')
  })

  it('adds item to cart', async () => {
    const response = { code: 200, data: { id: 1 } }
    const payload = { productId: 12, quantity: 2 }
    axiosMock.post.mockResolvedValue(response)

    await expect(cartApi.addToCart(payload as any)).resolves.toBe(response)
    expect(axiosMock.post).toHaveBeenCalledWith('/cart', payload)
  })

  it('updates cart item', async () => {
    const response = { code: 200, data: { id: 4 } }
    const payload = { quantity: 5 }
    axiosMock.put.mockResolvedValue(response)

    await expect(cartApi.updateCartItem(4, payload as any)).resolves.toBe(response)
    expect(axiosMock.put).toHaveBeenCalledWith('/cart/4', payload)
  })

  it('selects cart item', async () => {
    const response = { code: 200 }
    axiosMock.put.mockResolvedValue(response)

    await expect(cartApi.selectCartItem(8, true)).resolves.toBe(response)
    expect(axiosMock.put).toHaveBeenCalledWith('/cart/8/select?selected=true')
  })

  it('selects all cart items', async () => {
    const response = { code: 200 }
    axiosMock.put.mockResolvedValue(response)

    await expect(cartApi.selectAll(false)).resolves.toBe(response)
    expect(axiosMock.put).toHaveBeenCalledWith('/cart/select-all?selected=false')
  })

  it('deletes cart item', async () => {
    const response = { code: 200 }
    axiosMock.delete.mockResolvedValue(response)

    await expect(cartApi.deleteCartItem(6)).resolves.toBe(response)
    expect(axiosMock.delete).toHaveBeenCalledWith('/cart/6')
  })

  it('batch deletes cart items', async () => {
    const response = { code: 200 }
    axiosMock.delete.mockResolvedValue(response)

    await expect(cartApi.batchDeleteCartItems([1, 2, 3])).resolves.toBe(response)
    expect(axiosMock.delete).toHaveBeenCalledWith('/cart/batch', { data: { ids: [1, 2, 3] } })
  })

  it('clears cart', async () => {
    const response = { code: 200 }
    axiosMock.delete.mockResolvedValue(response)

    await expect(cartApi.clearCart()).resolves.toBe(response)
    expect(axiosMock.delete).toHaveBeenCalledWith('/cart/clear')
  })

  it('gets cart item count', async () => {
    const response = { code: 200, data: 9 }
    axiosMock.get.mockResolvedValue(response)

    await expect(cartApi.getCartItemCount()).resolves.toBe(response)
    expect(axiosMock.get).toHaveBeenCalledWith('/cart/count')
  })
})
