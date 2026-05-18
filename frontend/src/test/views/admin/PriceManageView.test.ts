import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { adminApi, priceApi, messages, messageBox, debugError } = vi.hoisted(() => ({
  adminApi: {
    getProducts: vi.fn()
  },
  priceApi: {
    getPriceHistory: vi.fn(),
    getPriceStats: vi.fn(),
    getAdminAlerts: vi.fn(),
    getAdminActiveAlertCount: vi.fn(),
    recordAdminPrice: vi.fn(),
    deleteAdminPriceHistory: vi.fn(),
    triggerAdminAlert: vi.fn(),
    resetAdminAlert: vi.fn(),
    deleteAdminAlert: vi.fn()
  },
  messages: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn()
  },
  messageBox: {
    confirm: vi.fn()
  },
  debugError: vi.fn()
}))

vi.mock('element-plus', () => ({
  ElMessage: messages,
  ElMessageBox: messageBox
}))

vi.mock('@/api/adminApi', () => ({
  default: adminApi
}))

vi.mock('@/api/priceApi', () => ({
  default: priceApi
}))

vi.mock('@/utils/debug', () => ({
  debugError
}))

import PriceManageView from '@/views/admin/PriceManageView.vue'

function createDeferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('PriceManageView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    messageBox.confirm.mockResolvedValue(undefined)
    adminApi.getProducts.mockResolvedValue({
      code: 200,
      data: {
        content: [{ id: 1, name: '商品A', price: 99 }],
        totalElements: 1
      }
    })
    priceApi.getPriceHistory.mockResolvedValue({ code: 200, data: [] })
    priceApi.getPriceStats.mockResolvedValue({ code: 200, data: null })
    priceApi.getAdminActiveAlertCount.mockResolvedValue({ code: 200, data: 3 })
    priceApi.getAdminAlerts.mockResolvedValue({ code: 200, data: [] })
  })

  const mountView = () =>
    mount(PriceManageView, {
      global: {
        directives: {
          loading: {}
        },
        stubs: {
          AdminLayout: { template: '<div><slot /></div>' },
          ElTabs: { template: '<div><slot /></div>' },
          ElTabPane: { template: '<div><slot /><slot name="label" /></div>' },
          ElBadge: true,
          ElSelect: true,
          ElOption: true,
          ElInput: true,
          ElButton: { template: '<button @click="$emit(\'click\')"><slot /></button>' },
          ElTable: { props: ['data'], template: '<div><slot /></div>' },
          ElTableColumn: { template: '<div><slot :row="$attrs.row || {}" /></div>' },
          ElTag: true,
          ElDialog: { template: '<div><slot /><slot name="footer" /></div>' },
          ElForm: { template: '<form><slot /></form>' },
          ElFormItem: { template: '<div><slot /></div>' },
          ElInputNumber: true
        }
      }
    })

  it('does not show an error when admin cancels deleting price history', async () => {
    messageBox.confirm.mockRejectedValue('cancel')
    const wrapper = mountView()

    await flushPromises()
    await (wrapper.vm as unknown as { handleDeleteHistory: (row: { id: number }) => Promise<void> })
      .handleDeleteHistory({ id: 10 })
    await flushPromises()

    expect(priceApi.deleteAdminPriceHistory).not.toHaveBeenCalled()
    expect(messages.error).not.toHaveBeenCalled()
  })

  it('shows an error when deleting price history fails', async () => {
    priceApi.deleteAdminPriceHistory.mockRejectedValue({ response: { data: { message: '价格记录删除失败' } } })
    const wrapper = mountView()

    await flushPromises()
    await (wrapper.vm as unknown as { handleDeleteHistory: (row: { id: number }) => Promise<void> })
      .handleDeleteHistory({ id: 10 })
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('价格记录删除失败')
    expect(debugError).toHaveBeenCalledWith('删除价格记录失败:', expect.any(Object))
  })

  it('refreshes alert list and count after triggering an alert', async () => {
    priceApi.triggerAdminAlert.mockResolvedValue({ code: 200 })
    const wrapper = mountView()

    await flushPromises()
    priceApi.getAdminAlerts.mockClear()
    priceApi.getAdminActiveAlertCount.mockClear()

    await (wrapper.vm as unknown as { handleTriggerAlert: (row: { id: number }) => Promise<void> })
      .handleTriggerAlert({ id: 11 })
    await flushPromises()

    expect(priceApi.triggerAdminAlert).toHaveBeenCalledWith(11)
    expect(priceApi.getAdminAlerts).toHaveBeenCalledWith({})
    expect(priceApi.getAdminActiveAlertCount).toHaveBeenCalled()
    expect(messages.success).toHaveBeenCalledWith('已触发并发送通知')
  })

  it('keeps record success when refreshing history fails afterward', async () => {
    const wrapper = mountView()
    await flushPromises()

    ;(wrapper.vm as any).selectedProductId = 1
    ;(wrapper.vm as any).products = [{ id: 1, name: '商品A', price: 99, originalPrice: 120 }]
    ;(wrapper.vm as any).priceHistory = []
    ;(wrapper.vm as any).recordForm.price = 88
    ;(wrapper.vm as any).recordForm.originalPrice = 99
    priceApi.recordAdminPrice.mockResolvedValue({ code: 200, data: { id: 21, recordedTime: '2026-05-12T10:00:00' } })
    priceApi.getPriceHistory.mockRejectedValue(new Error('刷新失败'))
    priceApi.getPriceStats.mockRejectedValue(new Error('刷新失败'))

    await (wrapper.vm as any).saveRecord()
    await flushPromises()

    expect(messages.success).toHaveBeenCalledWith('价格记录成功')
    expect(messages.error).not.toHaveBeenCalledWith('刷新失败')
    expect((wrapper.vm as any).priceHistory[0]).toEqual(expect.objectContaining({
      id: 21,
      productId: 1,
      price: 88,
      originalPrice: 99,
      changeType: 'DECREASE'
    }))
    expect((wrapper.vm as any).priceStats).toEqual(expect.objectContaining({
      currentPrice: 88,
      lowestPrice: 88,
      highestPrice: 88,
      recordCount: 1
    }))
    expect(debugError).toHaveBeenCalled()
  })

  it('logs backend message when deleting price history returns non-200 payload', async () => {
    priceApi.deleteAdminPriceHistory.mockResolvedValue({ code: 500, message: '价格记录已被引用' })
    const wrapper = mountView()

    await flushPromises()
    await (wrapper.vm as unknown as { handleDeleteHistory: (row: { id: number }) => Promise<void> })
      .handleDeleteHistory({ id: 10 })
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('价格记录已被引用')
    expect(debugError).toHaveBeenCalledWith('删除价格记录失败:', '价格记录已被引用')
  })

  it('shows an error when resetting an alert fails', async () => {
    priceApi.resetAdminAlert.mockRejectedValue({ response: { data: { message: '回退提醒失败' } } })
    const wrapper = mountView()

    await flushPromises()
    await (wrapper.vm as unknown as { handleResetAlert: (row: { id: number }) => Promise<void> })
      .handleResetAlert({ id: 12 })
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('回退提醒失败')
    expect(debugError).toHaveBeenCalledWith('回退降价提醒失败:', expect.any(Object))
  })

  it('logs backend message when triggering an alert returns non-200 payload', async () => {
    priceApi.triggerAdminAlert.mockResolvedValue({ code: 500, message: '提醒发送失败' })
    const wrapper = mountView()

    await flushPromises()
    await (wrapper.vm as unknown as { handleTriggerAlert: (row: { id: number }) => Promise<void> })
      .handleTriggerAlert({ id: 11 })
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('提醒发送失败')
    expect(debugError).toHaveBeenCalledWith('手动触发降价提醒失败:', '提醒发送失败')
  })

  it('logs backend message when resetting an alert returns non-200 payload', async () => {
    priceApi.resetAdminAlert.mockResolvedValue({ code: 500, message: '提醒回退失败' })
    const wrapper = mountView()

    await flushPromises()
    await (wrapper.vm as unknown as { handleResetAlert: (row: { id: number }) => Promise<void> })
      .handleResetAlert({ id: 12 })
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('提醒回退失败')
    expect(debugError).toHaveBeenCalledWith('回退降价提醒失败:', '提醒回退失败')
  })

  it('refreshes alert list and count after deleting an alert', async () => {
    priceApi.deleteAdminAlert.mockResolvedValue({ code: 200 })
    const wrapper = mountView()

    await flushPromises()
    priceApi.getAdminAlerts.mockClear()
    priceApi.getAdminActiveAlertCount.mockClear()

    await (wrapper.vm as unknown as { handleDeleteAlert: (row: { id: number }) => Promise<void> })
      .handleDeleteAlert({ id: 13 })
    await flushPromises()

    expect(priceApi.deleteAdminAlert).toHaveBeenCalledWith(13)
    expect(priceApi.getAdminAlerts).toHaveBeenCalledWith({})
    expect(priceApi.getAdminActiveAlertCount).toHaveBeenCalled()
    expect(messages.success).toHaveBeenCalledWith('删除成功')
  })

  it('keeps trigger success when refreshing alerts fails afterward', async () => {
    priceApi.triggerAdminAlert.mockResolvedValue({ code: 200 })
    const wrapper = mountView()

    await flushPromises()
    priceApi.getAdminAlerts.mockClear()
    priceApi.getAdminActiveAlertCount.mockClear()
    priceApi.getAdminAlerts.mockRejectedValue(new Error('刷新失败'))
    priceApi.getAdminActiveAlertCount.mockRejectedValue(new Error('刷新失败'))

    await (wrapper.vm as unknown as { handleTriggerAlert: (row: { id: number }) => Promise<void> })
      .handleTriggerAlert({ id: 11 })
    await flushPromises()

    expect(messages.success).toHaveBeenCalledWith('已触发并发送通知')
    expect(messages.error).not.toHaveBeenCalledWith('刷新失败')
    expect(debugError).toHaveBeenCalled()
  })

  it('keeps delete-alert success when refreshing alerts fails afterward', async () => {
    priceApi.deleteAdminAlert.mockResolvedValue({ code: 200 })
    const wrapper = mountView()

    await flushPromises()
    priceApi.getAdminAlerts.mockClear()
    priceApi.getAdminActiveAlertCount.mockClear()
    priceApi.getAdminAlerts.mockRejectedValue(new Error('刷新失败'))
    priceApi.getAdminActiveAlertCount.mockRejectedValue(new Error('刷新失败'))

    await (wrapper.vm as unknown as { handleDeleteAlert: (row: { id: number }) => Promise<void> })
      .handleDeleteAlert({ id: 13 })
    await flushPromises()

    expect(messages.success).toHaveBeenCalledWith('删除成功')
    expect(messages.error).not.toHaveBeenCalledWith('刷新失败')
    expect(debugError).toHaveBeenCalled()
  })

  it('logs backend message when deleting an alert returns non-200 payload', async () => {
    priceApi.deleteAdminAlert.mockResolvedValue({ code: 500, message: '提醒删除失败' })
    const wrapper = mountView()

    await flushPromises()
    await (wrapper.vm as unknown as { handleDeleteAlert: (row: { id: number }) => Promise<void> })
      .handleDeleteAlert({ id: 13 })
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('提醒删除失败')
    expect(debugError).toHaveBeenCalledWith('删除降价提醒失败:', '提醒删除失败')
  })

  it('logs when price manage products return non-200 payload', async () => {
    adminApi.getProducts.mockResolvedValue({ code: 500, message: '商品列表读取失败' })

    mountView()
    await flushPromises()

    expect(debugError).toHaveBeenCalledWith('获取价格管理商品列表失败:', '商品列表读取失败')
  })

  it('logs when alert count returns non-200 payload', async () => {
    priceApi.getAdminActiveAlertCount.mockResolvedValue({ code: 500, message: '提醒数量读取失败' })
    priceApi.getAdminAlerts.mockResolvedValue({ code: 200, data: [] })

    mountView()
    await flushPromises()

    expect(debugError).toHaveBeenCalledWith('获取激活降价提醒数量失败:', '提醒数量读取失败')
  })

  it('ignores stale alert list responses when a newer refresh finishes first', async () => {
    const firstRequest = createDeferred<any>()
    const secondRequest = createDeferred<any>()
    let alertsCall = 0

    priceApi.getAdminActiveAlertCount.mockResolvedValue({ code: 200, data: 3 })
    priceApi.getAdminAlerts.mockImplementation(() => {
      alertsCall += 1
      return alertsCall === 1 ? firstRequest.promise : secondRequest.promise
    })

    const wrapper = mountView()
    await flushPromises()

    const vm = wrapper.vm as unknown as { fetchAllAlerts: () => Promise<void> }
    const firstLoad = vm.fetchAllAlerts()
    await flushPromises()
    const secondLoad = vm.fetchAllAlerts()
    await flushPromises()

    secondRequest.resolve({
      code: 200,
      data: [{ id: 2, username: 'bob', productName: '新提醒商品', status: 1 }]
    })
    await secondLoad
    await flushPromises()

    expect((wrapper.vm as any).alerts[0].productName).toBe('新提醒商品')

    firstRequest.resolve({
      code: 200,
      data: [{ id: 1, username: 'alice', productName: '旧提醒商品', status: 0 }]
    })
    await firstLoad
    await flushPromises()

    expect((wrapper.vm as any).alerts[0].productName).toBe('新提醒商品')
  })

  it('does not let an in-flight history request overwrite local record success', async () => {
    const firstHistory = createDeferred<any>()
    const secondHistory = createDeferred<any>()
    const firstStats = createDeferred<any>()
    const secondStats = createDeferred<any>()

    priceApi.getPriceHistory
      .mockImplementationOnce(() => firstHistory.promise)
      .mockImplementationOnce(() => secondHistory.promise)
    priceApi.getPriceStats
      .mockImplementationOnce(() => firstStats.promise)
      .mockImplementationOnce(() => secondStats.promise)

    const wrapper = mountView()
    await flushPromises()
    ;(wrapper.vm as any).selectedProductId = 1
    ;(wrapper.vm as any).products = [{ id: 1, name: '商品A', price: 99, originalPrice: 120 }]
    ;(wrapper.vm as any).priceHistory = []
    ;(wrapper.vm as any).recordForm.price = 88
    ;(wrapper.vm as any).recordForm.originalPrice = 99
    priceApi.recordAdminPrice.mockResolvedValue({ code: 200, data: { id: 21, recordedTime: '2026-05-12T10:00:00' } })

    const firstLoad = (wrapper.vm as any).fetchPriceHistory()
    await flushPromises()

    const savePromise = (wrapper.vm as any).saveRecord()
    await flushPromises()

    expect((wrapper.vm as any).priceHistory[0]).toEqual(expect.objectContaining({
      id: 21,
      price: 88,
      changeType: 'DECREASE'
    }))

    secondHistory.resolve({
      code: 200,
      data: [{
        id: 21,
        productId: 1,
        price: 88,
        originalPrice: 99,
        recordedTime: '2026-05-12T10:00:00',
        changeType: 'DECREASE',
        changeAmount: -11,
        changeRate: -11.11
      }]
    })
    secondStats.resolve({
      code: 200,
      data: {
        currentPrice: 88,
        lowestPrice: 88,
        highestPrice: 88,
        avgPrice: 88,
        recordCount: 1,
        pricePosition: 0,
        isLowestPrice: true
      }
    })
    await savePromise
    await flushPromises()

    firstHistory.resolve({
      code: 200,
      data: [{
        id: 11,
        productId: 1,
        price: 99,
        originalPrice: 120,
        recordedTime: '2026-05-10T10:00:00',
        changeType: 'INITIAL',
        changeAmount: null,
        changeRate: null
      }]
    })
    firstStats.resolve({
      code: 200,
      data: {
        currentPrice: 99,
        lowestPrice: 99,
        highestPrice: 99,
        avgPrice: 99,
        recordCount: 1,
        pricePosition: 0,
        isLowestPrice: true
      }
    })
    await firstLoad
    await flushPromises()

    expect((wrapper.vm as any).priceHistory[0]).toEqual(expect.objectContaining({
      id: 21,
      price: 88
    }))
    expect((wrapper.vm as any).priceStats).toEqual(expect.objectContaining({
      currentPrice: 88,
      recordCount: 1
    }))
  })

  it('ignores stale active alert count responses when a newer refresh finishes first', async () => {
    const firstCountRequest = createDeferred<any>()
    const secondCountRequest = createDeferred<any>()
    let countCall = 0

    priceApi.getAdminAlerts.mockResolvedValue({ code: 200, data: [] })
    priceApi.getAdminActiveAlertCount.mockImplementation(() => {
      countCall += 1
      return countCall === 1 ? firstCountRequest.promise : secondCountRequest.promise
    })

    const wrapper = mountView()
    await flushPromises()

    const vm = wrapper.vm as unknown as { fetchActiveAlertCount: () => Promise<void> }
    const firstLoad = vm.fetchActiveAlertCount()
    await flushPromises()
    const secondLoad = vm.fetchActiveAlertCount()
    await flushPromises()

    secondCountRequest.resolve({ code: 200, data: 5 })
    await secondLoad
    await flushPromises()

    expect((wrapper.vm as any).activeAlertCount).toBe(5)

    firstCountRequest.resolve({ code: 200, data: 1 })
    await firstLoad
    await flushPromises()

    expect((wrapper.vm as any).activeAlertCount).toBe(5)
  })

  it('ignores stale price history responses when switching product quickly', async () => {
    const firstHistory = createDeferred<any>()
    const secondHistory = createDeferred<any>()
    const firstStats = createDeferred<any>()
    const secondStats = createDeferred<any>()

    let historyCall = 0
    let statsCall = 0
    priceApi.getPriceHistory.mockImplementation(() => {
      historyCall += 1
      return historyCall === 1 ? firstHistory.promise : secondHistory.promise
    })
    priceApi.getPriceStats.mockImplementation(() => {
      statsCall += 1
      return statsCall === 1 ? firstStats.promise : secondStats.promise
    })

    const wrapper = mountView()
    await flushPromises()

    ;(wrapper.vm as any).selectedProductId = 1
    const firstLoad = (wrapper.vm as any).fetchPriceHistory()
    await flushPromises()

    ;(wrapper.vm as any).selectedProductId = 2
    const secondLoad = (wrapper.vm as any).fetchPriceHistory()
    await flushPromises()

    secondHistory.resolve({ code: 200, data: [{ id: 2, price: 88 }] })
    secondStats.resolve({ code: 200, data: { latestPrice: 88 } })
    await secondLoad
    await flushPromises()

    expect((wrapper.vm as any).priceHistory[0].id).toBe(2)

    firstHistory.resolve({ code: 200, data: [{ id: 1, price: 99 }] })
    firstStats.resolve({ code: 200, data: { latestPrice: 99 } })
    await firstLoad
    await flushPromises()

    expect((wrapper.vm as any).priceHistory[0].id).toBe(2)
  })

  it('does not let an in-flight alert request overwrite local trigger success', async () => {
    const firstAlertsRequest = createDeferred<any>()
    const secondAlertsRequest = createDeferred<any>()
    let alertsCall = 0

    priceApi.getAdminActiveAlertCount.mockResolvedValue({ code: 200, data: 1 })
    priceApi.getAdminAlerts.mockImplementation(() => {
      alertsCall += 1
      return alertsCall === 1 ? firstAlertsRequest.promise : secondAlertsRequest.promise
    })
    priceApi.triggerAdminAlert.mockResolvedValue({ code: 200 })

    const wrapper = mountView()
    await flushPromises()
    ;(wrapper.vm as any).alerts = [{ id: 11, username: 'alice', productName: '商品A', status: 0, notified: false, currentPrice: 88 }]
    ;(wrapper.vm as any).activeAlertCount = 1

    const stalePromise = (wrapper.vm as any).fetchAllAlerts()
    await flushPromises()

    const triggerPromise = (wrapper.vm as any).handleTriggerAlert((wrapper.vm as any).alerts[0])
    await flushPromises()

    expect((wrapper.vm as any).alerts[0]).toMatchObject({ status: 1, notified: true, triggeredPrice: 88 })
    expect((wrapper.vm as any).activeAlertCount).toBe(0)

    secondAlertsRequest.resolve({ code: 200, data: [{ id: 11, username: 'alice', productName: '商品A', status: 1, notified: true, triggeredPrice: 88 }] })
    await triggerPromise
    await flushPromises()

    firstAlertsRequest.resolve({ code: 200, data: [{ id: 11, username: 'alice', productName: '商品A', status: 0, notified: false }] })
    await stalePromise
    await flushPromises()

    expect((wrapper.vm as any).alerts[0]).toMatchObject({ status: 1, notified: true })
  })

  it('does not let an in-flight price history request overwrite local history delete success', async () => {
    const firstHistory = createDeferred<any>()
    const secondHistory = createDeferred<any>()
    let historyCall = 0

    priceApi.getPriceHistory.mockImplementation(() => {
      historyCall += 1
      return historyCall === 1 ? firstHistory.promise : secondHistory.promise
    })
    priceApi.getPriceStats.mockResolvedValue({ code: 200, data: null })
    priceApi.deleteAdminPriceHistory.mockResolvedValue({ code: 200 })

    const wrapper = mountView()
    await flushPromises()
    ;(wrapper.vm as any).selectedProductId = 1
    ;(wrapper.vm as any).priceHistory = [{ id: 10, price: 99 }]

    const stalePromise = (wrapper.vm as any).fetchPriceHistory()
    await flushPromises()

    const deletePromise = (wrapper.vm as any).handleDeleteHistory({ id: 10 })
    await flushPromises()

    expect((wrapper.vm as any).priceHistory).toEqual([])

    secondHistory.resolve({ code: 200, data: [] })
    await deletePromise
    await flushPromises()

    firstHistory.resolve({ code: 200, data: [{ id: 10, price: 99 }] })
    await stalePromise
    await flushPromises()

    expect((wrapper.vm as any).priceHistory).toEqual([])
  })

  it('clears selected product state when refreshed product list no longer contains it', async () => {
    adminApi.getProducts
      .mockResolvedValueOnce({
        code: 200,
        data: {
          content: [{ id: 1, name: '商品A', price: 99 }],
          totalElements: 1
        }
      })
      .mockResolvedValueOnce({
        code: 200,
        data: {
          content: [{ id: 2, name: '商品B', price: 88 }],
          totalElements: 1
        }
      })

    const wrapper = mountView()
    await flushPromises()

    ;(wrapper.vm as any).selectedProductId = 1
    ;(wrapper.vm as any).priceHistory = [{ id: 10, productId: 1, price: 99 }]
    ;(wrapper.vm as any).priceStats = { currentPrice: 99, recordCount: 1 }
    ;(wrapper.vm as any).recordDialogVisible = true

    await (wrapper.vm as any).fetchProducts()
    await flushPromises()

    expect((wrapper.vm as any).products).toEqual([{ id: 2, name: '商品B', price: 88 }])
    expect((wrapper.vm as any).selectedProductId).toBeNull()
    expect((wrapper.vm as any).priceHistory).toEqual([])
    expect((wrapper.vm as any).priceStats).toBeNull()
    expect((wrapper.vm as any).recordDialogVisible).toBe(false)
  })
})
