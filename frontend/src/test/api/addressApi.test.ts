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

import addressApi from '@/api/addressApi'

describe('addressApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('gets user addresses', async () => {
    const response = { code: 200, data: [] }
    axiosMock.get.mockResolvedValue(response)

    await expect(addressApi.getUserAddresses()).resolves.toBe(response)
    expect(axiosMock.get).toHaveBeenCalledWith('/addresses')
  })

  it('gets default address', async () => {
    const response = { code: 200, data: { id: 1 } }
    axiosMock.get.mockResolvedValue(response)

    await expect(addressApi.getDefaultAddress()).resolves.toBe(response)
    expect(axiosMock.get).toHaveBeenCalledWith('/addresses/default')
  })

  it('adds address', async () => {
    const response = { code: 200, data: { id: 2 } }
    const payload = { name: 'Alice', phone: '13800000000' }
    axiosMock.post.mockResolvedValue(response)

    await expect(addressApi.addAddress(payload as any)).resolves.toBe(response)
    expect(axiosMock.post).toHaveBeenCalledWith('/addresses', payload)
  })

  it('updates address', async () => {
    const response = { code: 200, data: { id: 2 } }
    const payload = { detail: 'Road 1' }
    axiosMock.put.mockResolvedValue(response)

    await expect(addressApi.updateAddress(2, payload as any)).resolves.toBe(response)
    expect(axiosMock.put).toHaveBeenCalledWith('/addresses/2', payload)
  })

  it('deletes address', async () => {
    const response = { code: 200 }
    axiosMock.delete.mockResolvedValue(response)

    await expect(addressApi.deleteAddress(3)).resolves.toBe(response)
    expect(axiosMock.delete).toHaveBeenCalledWith('/addresses/3')
  })

  it('sets default address', async () => {
    const response = { code: 200 }
    axiosMock.put.mockResolvedValue(response)

    await expect(addressApi.setDefaultAddress(4)).resolves.toBe(response)
    expect(axiosMock.put).toHaveBeenCalledWith('/addresses/4/default')
  })
})
