import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAdminStore } from '@/stores/adminStore'
import axios from '@/utils/axios'
import { debugError } from '@/utils/debug'

vi.mock('@/utils/axios', () => ({
  default: {
    get: vi.fn()
  }
}))

vi.mock('@/utils/debug', () => ({
  debugError: vi.fn()
}))

describe('useAdminStore', () => {
  const mockedAxios = vi.mocked(axios)
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

  it('updates pending file count on success', async () => {
    mockedAxios.get.mockResolvedValue({ code: 200, data: 5 } as any)
    const store = useAdminStore()

    await store.fetchPendingFileCount()

    expect(store.pendingFileCount).toBe(5)
  })

  it('keeps pending file count and logs on non-200 payload', async () => {
    mockedAxios.get.mockResolvedValue({ code: 500, message: '文件数读取失败' } as any)
    const store = useAdminStore()
    store.pendingFileCount = 4

    await store.fetchPendingFileCount()

    expect(store.pendingFileCount).toBe(4)
    expect(mockedDebugError).toHaveBeenCalledWith('获取待审核文件数量失败:', '文件数读取失败')
  })

  it('keeps pending product count and logs on non-200 payload', async () => {
    mockedAxios.get.mockResolvedValue({ code: 500, message: '读取失败' } as any)
    const store = useAdminStore()
    store.pendingProductCount = 2

    await store.fetchPendingProductCount()

    expect(store.pendingProductCount).toBe(2)
    expect(mockedDebugError).toHaveBeenCalledWith('获取待审核商品数量失败:', '读取失败')
  })

  it('keeps pending order count and logs on thrown error', async () => {
    mockedAxios.get.mockRejectedValue(new Error('网络异常'))
    const store = useAdminStore()
    store.pendingOrderCount = 3

    await store.fetchPendingOrderCount()

    expect(store.pendingOrderCount).toBe(3)
    expect(mockedDebugError).toHaveBeenCalledWith('获取待审核取消申请数量失败', expect.any(Error))
  })

  it('keeps pending order count and logs on non-200 payload', async () => {
    mockedAxios.get.mockResolvedValue({ code: 500, message: '取消申请数量读取失败' } as any)
    const store = useAdminStore()
    store.pendingOrderCount = 3

    await store.fetchPendingOrderCount()

    expect(store.pendingOrderCount).toBe(3)
    expect(mockedDebugError).toHaveBeenCalledWith('获取待审核取消申请数量失败:', '取消申请数量读取失败')
  })

  it('refreshAllCounts triggers all count requests', async () => {
    mockedAxios.get.mockResolvedValue({ code: 200, data: 0 } as any)
    const store = useAdminStore()

    store.refreshAllCounts()

    await Promise.resolve()

    expect(mockedAxios.get).toHaveBeenCalledWith('/files/pending/count')
    expect(mockedAxios.get).toHaveBeenCalledWith('/products/pending/count')
    expect(mockedAxios.get).toHaveBeenCalledWith('/orders/cancel-requests/count')
  })

  it('ignores stale pending file count responses when a newer refresh finishes first', async () => {
    const firstRequest = createDeferred<any>()
    const secondRequest = createDeferred<any>()
    mockedAxios.get
      .mockImplementationOnce(() => firstRequest.promise)
      .mockImplementationOnce(() => secondRequest.promise)
    const store = useAdminStore()

    const firstLoad = store.fetchPendingFileCount()
    const secondLoad = store.fetchPendingFileCount()

    secondRequest.resolve({ code: 200, data: 7 })
    await secondLoad
    expect(store.pendingFileCount).toBe(7)

    firstRequest.resolve({ code: 200, data: 2 })
    await firstLoad
    expect(store.pendingFileCount).toBe(7)
  })

  it('ignores stale pending product count responses when a newer refresh finishes first', async () => {
    const firstRequest = createDeferred<any>()
    const secondRequest = createDeferred<any>()
    mockedAxios.get
      .mockImplementationOnce(() => firstRequest.promise)
      .mockImplementationOnce(() => secondRequest.promise)
    const store = useAdminStore()

    const firstLoad = store.fetchPendingProductCount()
    const secondLoad = store.fetchPendingProductCount()

    secondRequest.resolve({ code: 200, data: 6 })
    await secondLoad
    expect(store.pendingProductCount).toBe(6)

    firstRequest.resolve({ code: 200, data: 1 })
    await firstLoad
    expect(store.pendingProductCount).toBe(6)
  })

  it('ignores stale pending order count responses when a newer refresh finishes first', async () => {
    const firstRequest = createDeferred<any>()
    const secondRequest = createDeferred<any>()
    mockedAxios.get
      .mockImplementationOnce(() => firstRequest.promise)
      .mockImplementationOnce(() => secondRequest.promise)
    const store = useAdminStore()

    const firstLoad = store.fetchPendingOrderCount()
    const secondLoad = store.fetchPendingOrderCount()

    secondRequest.resolve({ code: 200, data: 9 })
    await secondLoad
    expect(store.pendingOrderCount).toBe(9)

    firstRequest.resolve({ code: 200, data: 3 })
    await firstLoad
    expect(store.pendingOrderCount).toBe(9)
  })

  it('does not let an in-flight pending file count request overwrite local decrease', async () => {
    const pendingRequest = createDeferred<any>()
    mockedAxios.get.mockImplementationOnce(() => pendingRequest.promise)
    const store = useAdminStore()
    store.setPendingFileCount(5)

    const loadPromise = store.fetchPendingFileCount()
    store.decreasePendingFileCount()

    pendingRequest.resolve({ code: 200, data: 9 })
    await loadPromise

    expect(store.pendingFileCount).toBe(4)
  })

  it('does not let an in-flight pending product count request overwrite local set', async () => {
    const pendingRequest = createDeferred<any>()
    mockedAxios.get.mockImplementationOnce(() => pendingRequest.promise)
    const store = useAdminStore()
    store.setPendingProductCount(2)

    const loadPromise = store.fetchPendingProductCount()
    store.setPendingProductCount(7)

    pendingRequest.resolve({ code: 200, data: 1 })
    await loadPromise

    expect(store.pendingProductCount).toBe(7)
  })

  it('does not let an in-flight pending order count request overwrite local decrease', async () => {
    const pendingRequest = createDeferred<any>()
    mockedAxios.get.mockImplementationOnce(() => pendingRequest.promise)
    const store = useAdminStore()
    store.setPendingOrderCount(3)

    const loadPromise = store.fetchPendingOrderCount()
    store.decreasePendingOrderCount()

    pendingRequest.resolve({ code: 200, data: 8 })
    await loadPromise

    expect(store.pendingOrderCount).toBe(2)
  })
})
