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

import notificationApi from '@/api/notificationApi'

describe('notificationApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('gets notifications without filter', async () => {
    const response = { code: 200, data: [] }
    axiosMock.get.mockResolvedValue(response)

    await expect(notificationApi.getNotifications()).resolves.toBe(response)
    expect(axiosMock.get).toHaveBeenCalledWith('/notifications', { params: {} })
  })

  it('treats all filter as no-op', async () => {
    const response = { code: 200, data: [] }
    axiosMock.get.mockResolvedValue(response)

    await expect(notificationApi.getNotifications('all')).resolves.toBe(response)
    expect(axiosMock.get).toHaveBeenCalledWith('/notifications', { params: {} })
  })

  it('gets notifications with type filter', async () => {
    const response = { code: 200, data: [] }
    axiosMock.get.mockResolvedValue(response)

    await expect(notificationApi.getNotifications('order')).resolves.toBe(response)
    expect(axiosMock.get).toHaveBeenCalledWith('/notifications', { params: { type: 'order' } })
  })

  it('gets unread count', async () => {
    const response = { code: 200, data: 2 }
    axiosMock.get.mockResolvedValue(response)

    await expect(notificationApi.getUnreadCount()).resolves.toBe(response)
    expect(axiosMock.get).toHaveBeenCalledWith('/notifications/unread-count')
  })

  it('marks notification as read', async () => {
    const response = { code: 200 }
    axiosMock.put.mockResolvedValue(response)

    await expect(notificationApi.markAsRead(5)).resolves.toBe(response)
    expect(axiosMock.put).toHaveBeenCalledWith('/notifications/5/read')
  })

  it('marks all notifications as read', async () => {
    const response = { code: 200 }
    axiosMock.put.mockResolvedValue(response)

    await expect(notificationApi.markAllAsRead()).resolves.toBe(response)
    expect(axiosMock.put).toHaveBeenCalledWith('/notifications/read-all')
  })

  it('deletes notification', async () => {
    const response = { code: 200 }
    axiosMock.delete.mockResolvedValue(response)

    await expect(notificationApi.deleteNotification(7)).resolves.toBe(response)
    expect(axiosMock.delete).toHaveBeenCalledWith('/notifications/7')
  })

  it('clears all notifications', async () => {
    const response = { code: 200 }
    axiosMock.delete.mockResolvedValue(response)

    await expect(notificationApi.clearAll()).resolves.toBe(response)
    expect(axiosMock.delete).toHaveBeenCalledWith('/notifications/clear')
  })
})
