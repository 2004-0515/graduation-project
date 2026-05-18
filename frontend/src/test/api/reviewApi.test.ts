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

import reviewApi from '@/api/reviewApi'

describe('reviewApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates review', async () => {
    const response = { code: 200, data: { id: 1 } }
    const payload = { productId: 1, orderId: 2, rating: 5, content: 'good' }
    axiosMock.post.mockResolvedValue(response)

    await expect(reviewApi.createReview(payload as any)).resolves.toBe(response)
    expect(axiosMock.post).toHaveBeenCalledWith('/reviews', payload)
  })

  it('gets product reviews with default paging', async () => {
    const response = { code: 200, data: [] }
    axiosMock.get.mockResolvedValue(response)

    await expect(reviewApi.getProductReviews(3)).resolves.toBe(response)
    expect(axiosMock.get).toHaveBeenCalledWith('/reviews/product/3', { params: { page: 0, size: 10 } })
  })

  it('gets product reviews with custom paging', async () => {
    const response = { code: 200, data: [] }
    axiosMock.get.mockResolvedValue(response)

    await expect(reviewApi.getProductReviews(3, 2, 20)).resolves.toBe(response)
    expect(axiosMock.get).toHaveBeenCalledWith('/reviews/product/3', { params: { page: 2, size: 20 } })
  })

  it('gets all product reviews', async () => {
    const response = { code: 200, data: [] }
    axiosMock.get.mockResolvedValue(response)

    await expect(reviewApi.getAllProductReviews(4)).resolves.toBe(response)
    expect(axiosMock.get).toHaveBeenCalledWith('/reviews/product/4/all')
  })

  it('gets product review stats', async () => {
    const response = { code: 200, data: {} }
    axiosMock.get.mockResolvedValue(response)

    await expect(reviewApi.getProductReviewStats(4)).resolves.toBe(response)
    expect(axiosMock.get).toHaveBeenCalledWith('/reviews/product/4/stats')
  })

  it('gets my reviews', async () => {
    const response = { code: 200, data: [] }
    axiosMock.get.mockResolvedValue(response)

    await expect(reviewApi.getMyReviews()).resolves.toBe(response)
    expect(axiosMock.get).toHaveBeenCalledWith('/reviews/my')
  })

  it('checks review status by order and product', async () => {
    const response = { code: 200, data: true }
    axiosMock.get.mockResolvedValue(response)

    await expect(reviewApi.checkReviewed(8, 9)).resolves.toBe(response)
    expect(axiosMock.get).toHaveBeenCalledWith('/reviews/check', { params: { orderId: 8, productId: 9 } })
  })

  it('deletes review', async () => {
    const response = { code: 200 }
    axiosMock.delete.mockResolvedValue(response)

    await expect(reviewApi.deleteReview(6)).resolves.toBe(response)
    expect(axiosMock.delete).toHaveBeenCalledWith('/reviews/6')
  })
})
