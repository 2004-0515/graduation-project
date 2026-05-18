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

import searchApi from '@/api/searchApi'

describe('searchApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('gets search suggestions', async () => {
    const response = { code: 200, data: [] }
    axiosMock.get.mockResolvedValue(response)

    await expect(searchApi.getSuggestions('iph')).resolves.toBe(response)
    expect(axiosMock.get).toHaveBeenCalledWith('/search/suggestions', { params: { keyword: 'iph' } })
  })

  it('gets hot keywords', async () => {
    const response = { code: 200, data: [] }
    axiosMock.get.mockResolvedValue(response)

    await expect(searchApi.getHotKeywords()).resolves.toBe(response)
    expect(axiosMock.get).toHaveBeenCalledWith('/search/hot-keywords')
  })

  it('gets search history', async () => {
    const response = { code: 200, data: [] }
    axiosMock.get.mockResolvedValue(response)

    await expect(searchApi.getSearchHistory()).resolves.toBe(response)
    expect(axiosMock.get).toHaveBeenCalledWith('/search/history')
  })

  it('adds search history', async () => {
    const response = { code: 200 }
    axiosMock.post.mockResolvedValue(response)

    await expect(searchApi.addSearchHistory('laptop')).resolves.toBe(response)
    expect(axiosMock.post).toHaveBeenCalledWith('/search/history', { keyword: 'laptop' })
  })

  it('deletes one search history item', async () => {
    const response = { code: 200 }
    axiosMock.delete.mockResolvedValue(response)

    await expect(searchApi.deleteSearchHistory(4)).resolves.toBe(response)
    expect(axiosMock.delete).toHaveBeenCalledWith('/search/history/4')
  })

  it('clears search history', async () => {
    const response = { code: 200 }
    axiosMock.delete.mockResolvedValue(response)

    await expect(searchApi.clearSearchHistory()).resolves.toBe(response)
    expect(axiosMock.delete).toHaveBeenCalledWith('/search/history')
  })

  it('records search keyword', async () => {
    const response = { code: 200 }
    axiosMock.post.mockResolvedValue(response)

    await expect(searchApi.recordSearch('phone')).resolves.toBe(response)
    expect(axiosMock.post).toHaveBeenCalledWith('/search/stats', { keyword: 'phone' })
  })
})
