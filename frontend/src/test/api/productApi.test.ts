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

import productApi from '@/api/productApi'

describe('productApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('gets products with default paging', async () => {
    const response = { code: 200, data: { content: [] } }
    axiosMock.get.mockResolvedValue(response)

    await expect(productApi.getProducts()).resolves.toBe(response)
    expect(axiosMock.get).toHaveBeenCalledWith('/products', { params: { pageNo: 1, pageSize: 10 } })
  })

  it('gets products with custom params', async () => {
    const response = { code: 200, data: { content: [] } }
    axiosMock.get.mockResolvedValue(response)

    await expect(productApi.getProducts({ page: 2, size: 20, keyword: 'phone', sort: 'sales' })).resolves.toBe(response)
    expect(axiosMock.get).toHaveBeenCalledWith('/products', {
      params: { pageNo: 2, pageSize: 20, page: 2, size: 20, keyword: 'phone', sort: 'sales' }
    })
  })

  it('gets product by id', async () => {
    const response = { code: 200, data: { id: 5 } }
    axiosMock.get.mockResolvedValue(response)

    await expect(productApi.getProductById(5)).resolves.toBe(response)
    expect(axiosMock.get).toHaveBeenCalledWith('/products/5')
  })

  it('gets products by category id', async () => {
    const response = { code: 200, data: [] }
    axiosMock.get.mockResolvedValue(response)

    await expect(productApi.getProductsByCategoryId(9)).resolves.toBe(response)
    expect(axiosMock.get).toHaveBeenCalledWith('/products/category/9')
  })

  it('searches products by name', async () => {
    const response = { code: 200, data: [] }
    axiosMock.get.mockResolvedValue(response)

    await expect(productApi.searchProductsByName('camera')).resolves.toBe(response)
    expect(axiosMock.get).toHaveBeenCalledWith('/products/search', { params: { name: 'camera' } })
  })

  it('gets current seller products', async () => {
    const response = { code: 200, data: [] }
    axiosMock.get.mockResolvedValue(response)

    await expect(productApi.getMyProducts()).resolves.toBe(response)
    expect(axiosMock.get).toHaveBeenCalledWith('/products/my')
  })

  it('submits product for review', async () => {
    const response = { code: 200, data: { id: 3 } }
    const payload = { name: 'Item', price: 10 }
    axiosMock.post.mockResolvedValue(response)

    await expect(productApi.submitProduct(payload)).resolves.toBe(response)
    expect(axiosMock.post).toHaveBeenCalledWith('/products/submit', payload)
  })

  it('updates product', async () => {
    const response = { code: 200, data: { id: 3 } }
    const payload = { price: 11 }
    axiosMock.put.mockResolvedValue(response)

    await expect(productApi.updateProduct(3, payload)).resolves.toBe(response)
    expect(axiosMock.put).toHaveBeenCalledWith('/products/3', payload)
  })

  it('deletes product', async () => {
    const response = { code: 200 }
    axiosMock.delete.mockResolvedValue(response)

    await expect(productApi.deleteProduct(3)).resolves.toBe(response)
    expect(axiosMock.delete).toHaveBeenCalledWith('/products/3')
  })
})
