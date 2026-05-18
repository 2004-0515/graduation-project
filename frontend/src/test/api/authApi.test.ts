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

import authApi from '@/api/authApi'

describe('authApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('logs in with credentials', async () => {
    const response = { code: 200, data: { token: 't' } }
    const payload = { username: 'alice', password: 'secret' }
    axiosMock.post.mockResolvedValue(response)

    await expect(authApi.login(payload as any)).resolves.toBe(response)
    expect(axiosMock.post).toHaveBeenCalledWith('/auth/login', payload)
  })

  it('registers a user', async () => {
    const response = { code: 200, data: { id: 1 } }
    const payload = { username: 'alice', password: 'secret', nickname: 'Alice' }
    axiosMock.post.mockResolvedValue(response)

    await expect(authApi.register(payload as any)).resolves.toBe(response)
    expect(axiosMock.post).toHaveBeenCalledWith('/auth/register', payload)
  })

  it('logs out current user', async () => {
    const response = { code: 200 }
    axiosMock.post.mockResolvedValue(response)

    await expect(authApi.logout()).resolves.toBe(response)
    expect(axiosMock.post).toHaveBeenCalledWith('/auth/logout')
  })

  it('gets current user profile', async () => {
    const response = { code: 200, data: { id: 1 } }
    axiosMock.get.mockResolvedValue(response)

    await expect(authApi.getCurrentUser()).resolves.toBe(response)
    expect(axiosMock.get).toHaveBeenCalledWith('/auth/me')
  })

  it('deletes current user', async () => {
    const response = { code: 200 }
    axiosMock.delete.mockResolvedValue(response)

    await expect(authApi.deleteCurrentUser()).resolves.toBe(response)
    expect(axiosMock.delete).toHaveBeenCalledWith('/users/me')
  })

  it('updates current user info', async () => {
    const response = { code: 200, data: { id: 1 } }
    const payload = { nickname: 'Alice 2', avatar: '/a.png' }
    axiosMock.put.mockResolvedValue(response)

    await expect(authApi.updateUserInfo(payload as any)).resolves.toBe(response)
    expect(axiosMock.put).toHaveBeenCalledWith('/auth/me', payload)
  })

  it('changes user password', async () => {
    const response = { code: 200, data: 'ok' }
    const payload = { oldPassword: 'old', newPassword: 'new' }
    axiosMock.post.mockResolvedValue(response)

    await expect(authApi.changePassword(payload as any)).resolves.toBe(response)
    expect(axiosMock.post).toHaveBeenCalledWith('/auth/change-password', payload)
  })
})
