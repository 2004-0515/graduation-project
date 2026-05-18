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

import categoryApi from '@/api/categoryApi'

describe('categoryApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('gets categories', async () => {
    const response = { code: 200, data: [] }
    axiosMock.get.mockResolvedValue(response)

    await expect(categoryApi.getCategories()).resolves.toBe(response)
    expect(axiosMock.get).toHaveBeenCalledWith('/categories')
  })

  it('gets category by id', async () => {
    const response = { code: 200, data: { id: 8 } }
    axiosMock.get.mockResolvedValue(response)

    await expect(categoryApi.getCategoryById(8)).resolves.toBe(response)
    expect(axiosMock.get).toHaveBeenCalledWith('/categories/8')
  })
})
