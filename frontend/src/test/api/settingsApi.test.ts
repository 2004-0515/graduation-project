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

import settingsApi from '@/api/settingsApi'

describe('settingsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('gets notification settings', async () => {
    const response = { code: 200, data: {} }
    axiosMock.get.mockResolvedValue(response)

    await expect(settingsApi.getNotificationSettings()).resolves.toBe(response)
    expect(axiosMock.get).toHaveBeenCalledWith('/notification-settings/me')
  })

  it('updates notification settings', async () => {
    const response = { code: 200, data: {} }
    const payload = { systemEnabled: true, notificationFrequency: 'daily' }
    axiosMock.put.mockResolvedValue(response)

    await expect(settingsApi.updateNotificationSettings(payload as any)).resolves.toBe(response)
    expect(axiosMock.put).toHaveBeenCalledWith('/notification-settings/me', payload)
  })

  it('gets privacy settings', async () => {
    const response = { code: 200, data: {} }
    axiosMock.get.mockResolvedValue(response)

    await expect(settingsApi.getPrivacySettings()).resolves.toBe(response)
    expect(axiosMock.get).toHaveBeenCalledWith('/privacy-settings/me')
  })

  it('updates privacy settings', async () => {
    const response = { code: 200, data: {} }
    const payload = { profileVisibility: 'friends' }
    axiosMock.put.mockResolvedValue(response)

    await expect(settingsApi.updatePrivacySettings(payload as any)).resolves.toBe(response)
    expect(axiosMock.put).toHaveBeenCalledWith('/privacy-settings/me', payload)
  })

  it('gets security settings', async () => {
    const response = { code: 200, data: {} }
    axiosMock.get.mockResolvedValue(response)

    await expect(settingsApi.getSecuritySettings()).resolves.toBe(response)
    expect(axiosMock.get).toHaveBeenCalledWith('/security-settings/me')
  })
})
