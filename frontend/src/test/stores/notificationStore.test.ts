import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useNotificationStore } from '@/stores/notificationStore'
import notificationApi from '@/api/notificationApi'
import { debugError } from '@/utils/debug'

vi.mock('@/api/notificationApi', () => ({
  default: {
    getUnreadCount: vi.fn()
  }
}))

vi.mock('@/utils/debug', () => ({
  debugError: vi.fn()
}))

describe('useNotificationStore', () => {
  const mockedNotificationApi = vi.mocked(notificationApi)
  const mockedDebugError = vi.mocked(debugError)

  const createDeferred = <T>() => {
    let resolve!: (value: T) => void
    let reject!: (reason?: unknown) => void
    const promise = new Promise<T>((res, rej) => {
      resolve = res
      reject = rej
    })
    return { promise, resolve, reject }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
  })

  it('updates unread count when api returns success payload', async () => {
    mockedNotificationApi.getUnreadCount.mockResolvedValue({ code: 200, data: 6 } as any)
    const store = useNotificationStore()

    await store.fetchUnreadCount()

    expect(store.unreadCount).toBe(6)
  })

  it('keeps current count and logs when api returns non-200 payload', async () => {
    mockedNotificationApi.getUnreadCount.mockResolvedValue({ code: 500, message: '读取失败' } as any)
    const store = useNotificationStore()
    store.setCount(4)

    await store.fetchUnreadCount()

    expect(store.unreadCount).toBe(4)
    expect(mockedDebugError).toHaveBeenCalledWith('获取未读通知数失败:', '读取失败')
  })

  it('keeps current count and logs when api throws', async () => {
    mockedNotificationApi.getUnreadCount.mockRejectedValue(new Error('网络异常'))
    const store = useNotificationStore()
    store.setCount(3)

    await store.fetchUnreadCount()

    expect(store.unreadCount).toBe(3)
    expect(mockedDebugError).toHaveBeenCalledWith('获取未读通知数失败:', expect.any(Error))
  })

  it('ignores stale unread count responses when a newer refresh finishes first', async () => {
    const firstRequest = createDeferred<any>()
    const secondRequest = createDeferred<any>()
    mockedNotificationApi.getUnreadCount
      .mockImplementationOnce(() => firstRequest.promise)
      .mockImplementationOnce(() => secondRequest.promise)
    const store = useNotificationStore()

    const firstLoad = store.fetchUnreadCount()
    const secondLoad = store.fetchUnreadCount()

    secondRequest.resolve({ code: 200, data: 8 } as any)
    await secondLoad
    expect(store.unreadCount).toBe(8)

    firstRequest.resolve({ code: 200, data: 2 } as any)
    await firstLoad
    expect(store.unreadCount).toBe(8)
  })

  it('does not let an in-flight unread request overwrite clearCount', async () => {
    const pendingRequest = createDeferred<any>()
    mockedNotificationApi.getUnreadCount.mockImplementationOnce(() => pendingRequest.promise)
    const store = useNotificationStore()
    store.setCount(5)

    const loadPromise = store.fetchUnreadCount()
    store.clearCount()

    pendingRequest.resolve({ code: 200, data: 9 } as any)
    await loadPromise

    expect(store.unreadCount).toBe(0)
  })

  it('does not let an in-flight unread request overwrite setCount', async () => {
    const pendingRequest = createDeferred<any>()
    mockedNotificationApi.getUnreadCount.mockImplementationOnce(() => pendingRequest.promise)
    const store = useNotificationStore()
    store.setCount(1)

    const loadPromise = store.fetchUnreadCount()
    store.setCount(7)

    pendingRequest.resolve({ code: 200, data: 3 } as any)
    await loadPromise

    expect(store.unreadCount).toBe(7)
  })
})
