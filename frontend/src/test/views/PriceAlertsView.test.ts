import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockPush, mockBack, priceApi, messageBox, messages, debugError } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockBack: vi.fn(),
  priceApi: {
    getUserAlertDetails: vi.fn(),
    cancelAlert: vi.fn(),
    deleteAlertRecord: vi.fn(),
    createAlert: vi.fn()
  },
  messageBox: {
    confirm: vi.fn()
  },
  messages: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn()
  },
  debugError: vi.fn()
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush, back: mockBack })
}))

vi.mock('element-plus', () => ({
  ElMessage: messages,
  ElMessageBox: messageBox
}))

vi.mock('@/api/priceApi', () => ({
  default: priceApi
}))

vi.mock('@/api/fileApi', () => ({
  default: {
    getImageUrl: vi.fn(() => '/img.png')
  }
}))

vi.mock('@/utils/debug', () => ({
  debugError
}))

import PriceAlertsView from '@/views/PriceAlertsView.vue'

function createDeferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('PriceAlertsView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    messageBox.confirm.mockResolvedValue(true)
  })

  it('uses delete record action for non-monitoring alerts', async () => {
    priceApi.getUserAlertDetails.mockResolvedValue({
      code: 200,
      data: [
        {
          id: 1,
          productId: 100,
          productName: '触发商品',
          productImage: '/a.png',
          productPrice: 99,
          currentPrice: 99,
          targetPrice: 88,
          status: 1,
          createdTime: '2026-05-07T10:00:00'
        }
      ]
    })
    priceApi.deleteAlertRecord.mockResolvedValue({ code: 200 })

    const wrapper = mount(PriceAlertsView, {
      global: {
        directives: { loading: {} },
        stubs: {
          Navbar: true,
          Footer: true,
          ElDialog: { template: '<div><slot /><slot name="footer" /></div>' },
          ElButton: { template: '<button @click="$emit(\'click\')"><slot /></button>' }
        }
      }
    })

    await flushPromises()

    const buttons = wrapper.findAll('button')
    const deleteButton = buttons.find((button) => button.text() === '删除记录')
    expect(deleteButton).toBeTruthy()

    await deleteButton!.trigger('click')
    await flushPromises()

    expect(priceApi.deleteAlertRecord).toHaveBeenCalledWith(100)
    expect(priceApi.cancelAlert).not.toHaveBeenCalled()
  })

  it('does not show an error when user cancels deleting an alert record', async () => {
    priceApi.getUserAlertDetails.mockResolvedValue({
      code: 200,
      data: [
        {
          id: 1,
          productId: 100,
          productName: '触发商品',
          productImage: '/a.png',
          productPrice: 99,
          currentPrice: 99,
          targetPrice: 88,
          status: 1,
          createdTime: '2026-05-07T10:00:00'
        }
      ]
    })
    messageBox.confirm.mockRejectedValue('cancel')

    const wrapper = mount(PriceAlertsView, {
      global: {
        directives: { loading: {} },
        stubs: {
          Navbar: true,
          Footer: true,
          ElDialog: { template: '<div><slot /><slot name="footer" /></div>' },
          ElButton: { template: '<button @click="$emit(\'click\')"><slot /></button>' }
        }
      }
    })

    await flushPromises()

    const deleteButton = wrapper.findAll('button').find((button) => button.text() === '删除记录')
    await deleteButton!.trigger('click')
    await flushPromises()

    expect(priceApi.deleteAlertRecord).not.toHaveBeenCalled()
    expect(messages.error).not.toHaveBeenCalled()
  })

  it('shows an error when deleting an alert record fails', async () => {
    priceApi.getUserAlertDetails.mockResolvedValue({
      code: 200,
      data: [
        {
          id: 1,
          productId: 100,
          productName: '触发商品',
          productImage: '/a.png',
          productPrice: 99,
          currentPrice: 99,
          targetPrice: 88,
          status: 1,
          createdTime: '2026-05-07T10:00:00'
        }
      ]
    })
    priceApi.deleteAlertRecord.mockRejectedValue(new Error('boom'))

    const wrapper = mount(PriceAlertsView, {
      global: {
        directives: { loading: {} },
        stubs: {
          Navbar: true,
          Footer: true,
          ElDialog: { template: '<div><slot /><slot name="footer" /></div>' },
          ElButton: { template: '<button @click="$emit(\'click\')"><slot /></button>' }
        }
      }
    })

    await flushPromises()

    const deleteButton = wrapper.findAll('button').find((button) => button.text() === '删除记录')
    await deleteButton!.trigger('click')
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('boom')
    expect(debugError).toHaveBeenCalled()
  })

  it('shows backend chinese message when updating target price fails', async () => {
    priceApi.getUserAlertDetails.mockResolvedValue({
      code: 200,
      data: [
        {
          id: 1,
          productId: 100,
          productName: '监控商品',
          productImage: '/a.png',
          productPrice: 99,
          currentPrice: 99,
          targetPrice: 88,
          status: 0,
          createdTime: '2026-05-07T10:00:00'
        }
      ]
    })
    priceApi.createAlert.mockRejectedValue({
      response: { data: { message: '目标价格已存在' } }
    })

    const wrapper = mount(PriceAlertsView, {
      global: {
        directives: { loading: {} },
        stubs: {
          Navbar: true,
          Footer: true,
          ElDialog: { template: '<div><slot /><slot name="footer" /></div>' },
          ElButton: { template: '<button @click="$emit(\'click\')"><slot /></button>' }
        }
      }
    })

    await flushPromises()

    const editButton = wrapper.findAll('button').find((button) => button.text() === '修改')
    await editButton!.trigger('click')
    await flushPromises()

    const vm = wrapper.vm as any
    vm.newTargetPrice = 77
    await vm.saveEdit()
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('目标价格已存在')
    expect(debugError).toHaveBeenCalled()
  })

  it('refreshes the list after updating target price successfully', async () => {
    priceApi.getUserAlertDetails
      .mockResolvedValueOnce({
        code: 200,
        data: [
          {
            id: 1,
            productId: 100,
            productName: '监控商品',
            productImage: '/a.png',
            productPrice: 99,
            currentPrice: 99,
            targetPrice: 88,
            status: 0,
            createdTime: '2026-05-07T10:00:00'
          }
        ]
      })
      .mockResolvedValueOnce({
        code: 200,
        data: [
          {
            id: 1,
            productId: 100,
            productName: '监控商品',
            productImage: '/a.png',
            productPrice: 99,
            currentPrice: 99,
            targetPrice: 77,
            status: 0,
            createdTime: '2026-05-07T10:00:00'
          }
        ]
      })
    priceApi.createAlert.mockResolvedValue({ code: 200 })

    const wrapper = mount(PriceAlertsView, {
      global: {
        directives: { loading: {} },
        stubs: {
          Navbar: true,
          Footer: true,
          ElDialog: { template: '<div><slot /><slot name="footer" /></div>' },
          ElButton: { template: '<button @click="$emit(\'click\')"><slot /></button>' }
        }
      }
    })

    await flushPromises()

    const editButton = wrapper.findAll('button').find((button) => button.text() === '修改')
    await editButton!.trigger('click')
    await flushPromises()

    const vm = wrapper.vm as any
    vm.newTargetPrice = 77
    await vm.saveEdit()
    await flushPromises()

    expect(priceApi.createAlert).toHaveBeenCalledWith(100, 77)
    expect(priceApi.getUserAlertDetails).toHaveBeenCalledTimes(2)
    expect(messages.success).toHaveBeenCalledWith('目标价格已更新')
  })

  it('logs backend message when loading alerts returns non-200 payload', async () => {
    priceApi.getUserAlertDetails.mockResolvedValue({ code: 500, message: '降价提醒列表加载失败' })

    mount(PriceAlertsView, {
      global: {
        directives: { loading: {} },
        stubs: {
          Navbar: true,
          Footer: true,
          ElDialog: { template: '<div><slot /><slot name="footer" /></div>' },
          ElButton: { template: `<button @click="$emit('click')"><slot /></button>` }
        }
      }
    })

    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('降价提醒列表加载失败')
    expect(debugError).toHaveBeenCalledWith('获取降价提醒失败:', '降价提醒列表加载失败')
  })

  it('logs backend message when updating target price returns non-200 payload', async () => {
    priceApi.getUserAlertDetails.mockResolvedValue({
      code: 200,
      data: [
        {
          id: 1,
          productId: 100,
          productName: '监控商品',
          productImage: '/a.png',
          productPrice: 99,
          currentPrice: 99,
          targetPrice: 88,
          status: 0,
          createdTime: '2026-05-07T10:00:00'
        }
      ]
    })
    priceApi.createAlert.mockResolvedValue({ code: 500, message: '目标价格更新失败' })

    const wrapper = mount(PriceAlertsView, {
      global: {
        directives: { loading: {} },
        stubs: {
          Navbar: true,
          Footer: true,
          ElDialog: { template: '<div><slot /><slot name="footer" /></div>' },
          ElButton: { template: `<button @click="$emit('click')"><slot /></button>` }
        }
      }
    })

    await flushPromises()
    const editButton = wrapper.findAll('button').find((button) => button.text() === '修改')
    await editButton!.trigger('click')
    await flushPromises()

    const vm = wrapper.vm as any
    vm.newTargetPrice = 77
    await vm.saveEdit()
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('目标价格更新失败')
    expect(debugError).toHaveBeenCalledWith('更新目标价格失败:', '目标价格更新失败')
  })

  it('logs backend message when cancel action returns non-200 payload', async () => {
    priceApi.getUserAlertDetails.mockResolvedValue({
      code: 200,
      data: [
        {
          id: 1,
          productId: 100,
          productName: '监控商品',
          productImage: '/a.png',
          productPrice: 99,
          currentPrice: 99,
          targetPrice: 88,
          status: 0,
          createdTime: '2026-05-07T10:00:00'
        }
      ]
    })
    priceApi.cancelAlert.mockResolvedValue({ code: 500, message: '取消监控失败' })

    const wrapper = mount(PriceAlertsView, {
      global: {
        directives: { loading: {} },
        stubs: {
          Navbar: true,
          Footer: true,
          ElDialog: { template: '<div><slot /><slot name="footer" /></div>' },
          ElButton: { template: `<button @click="$emit('click')"><slot /></button>` }
        }
      }
    })

    await flushPromises()
    const cancelButton = wrapper.findAll('button').find((button) => button.text() === '取消监控')
    await cancelButton!.trigger('click')
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('取消监控失败')
    expect(debugError).toHaveBeenCalledWith('取消监控降价提醒失败:', '取消监控失败')
  })

  it('keeps success feedback when refresh fails after updating target price', async () => {
    priceApi.getUserAlertDetails
      .mockResolvedValueOnce({
        code: 200,
        data: [
          {
            id: 1,
            productId: 100,
            productName: '监控商品',
            productImage: '/a.png',
            productPrice: 99,
            currentPrice: 99,
            targetPrice: 88,
            status: 0,
            createdTime: '2026-05-07T10:00:00'
          }
        ]
      })
      .mockRejectedValueOnce(new Error('refresh failed'))
    priceApi.createAlert.mockResolvedValue({ code: 200 })

    const wrapper = mount(PriceAlertsView, {
      global: {
        directives: { loading: {} },
        stubs: {
          Navbar: true,
          Footer: true,
          ElDialog: { template: '<div><slot /><slot name="footer" /></div>' },
          ElButton: { template: `<button @click="$emit('click')"><slot /></button>` }
        }
      }
    })

    await flushPromises()
    const editButton = wrapper.findAll('button').find((button) => button.text() === '修改')
    await editButton!.trigger('click')
    await flushPromises()

    const vm = wrapper.vm as any
    vm.newTargetPrice = 77
    await vm.saveEdit()
    await flushPromises()

    expect(messages.success).toHaveBeenCalledWith('目标价格已更新')
    expect(messages.error).not.toHaveBeenCalled()
    expect(debugError).toHaveBeenCalledWith('获取降价提醒失败:', expect.any(Error))
    expect(debugError).toHaveBeenCalledWith('更新目标价格后刷新降价提醒失败:', '获取降价提醒失败')
  })

  it('keeps success feedback when refresh fails after canceling alert', async () => {
    priceApi.getUserAlertDetails
      .mockResolvedValueOnce({
        code: 200,
        data: [
          {
            id: 1,
            productId: 100,
            productName: '监控商品',
            productImage: '/a.png',
            productPrice: 99,
            currentPrice: 99,
            targetPrice: 88,
            status: 0,
            createdTime: '2026-05-07T10:00:00'
          }
        ]
      })
      .mockRejectedValueOnce(new Error('refresh failed'))
    priceApi.cancelAlert.mockResolvedValue({ code: 200 })

    const wrapper = mount(PriceAlertsView, {
      global: {
        directives: { loading: {} },
        stubs: {
          Navbar: true,
          Footer: true,
          ElDialog: { template: '<div><slot /><slot name="footer" /></div>' },
          ElButton: { template: `<button @click="$emit('click')"><slot /></button>` }
        }
      }
    })

    await flushPromises()
    const cancelButton = wrapper.findAll('button').find((button) => button.text() === '取消监控')
    await cancelButton!.trigger('click')
    await flushPromises()

    expect(messages.success).toHaveBeenCalledWith('已取消监控')
    expect(messages.error).not.toHaveBeenCalled()
    expect(debugError).toHaveBeenCalledWith('获取降价提醒失败:', expect.any(Error))
    expect(debugError).toHaveBeenCalledWith('取消监控后刷新降价提醒失败:', '获取降价提醒失败')
  })

  it('ignores stale alert responses when a newer fetch finishes first', async () => {
    const firstRequest = createDeferred<{ code: number; data: Array<Record<string, unknown>> }>()
    const secondRequest = createDeferred<{ code: number; data: Array<Record<string, unknown>> }>()

    priceApi.getUserAlertDetails
      .mockImplementationOnce(() => firstRequest.promise)
      .mockImplementationOnce(() => secondRequest.promise)

    const wrapper = mount(PriceAlertsView, {
      global: {
        directives: { loading: {} },
        stubs: {
          Navbar: true,
          Footer: true,
          ElDialog: { template: '<div><slot /><slot name="footer" /></div>' },
          ElButton: { template: `<button @click="$emit('click')"><slot /></button>` }
        }
      }
    })

    await flushPromises()

    const vm = wrapper.vm as unknown as { fetchAlerts: () => Promise<void> }
    const refetchPromise = vm.fetchAlerts()
    await flushPromises()

    secondRequest.resolve({
      code: 200,
      data: [
        {
          id: 2,
          productId: 200,
          productName: '最新提醒',
          productImage: '/b.png',
          productPrice: 88,
          currentPrice: 88,
          targetPrice: 77,
          status: 0,
          createdTime: '2026-05-07T10:00:00'
        }
      ]
    })
    await refetchPromise
    await flushPromises()

    expect(wrapper.text()).toContain('最新提醒')

    firstRequest.resolve({
      code: 200,
      data: [
        {
          id: 1,
          productId: 100,
          productName: '旧提醒',
          productImage: '/a.png',
          productPrice: 99,
          currentPrice: 99,
          targetPrice: 88,
          status: 0,
          createdTime: '2026-05-07T10:00:00'
        }
      ]
    })
    await flushPromises()

    expect(wrapper.text()).toContain('最新提醒')
    expect(wrapper.text()).not.toContain('旧提醒')
  })

  it('does not let an in-flight alert request overwrite target price update success', async () => {
    const firstRequest = createDeferred<any>()
    const secondRequest = createDeferred<any>()

    priceApi.getUserAlertDetails
      .mockImplementationOnce(() => firstRequest.promise)
      .mockImplementationOnce(() => secondRequest.promise)
    priceApi.createAlert.mockResolvedValue({ code: 200 })

    const wrapper = mount(PriceAlertsView, {
      global: {
        directives: { loading: {} },
        stubs: {
          Navbar: true,
          Footer: true,
          ElDialog: { template: '<div><slot /><slot name="footer" /></div>' },
          ElButton: { template: `<button @click="$emit('click')"><slot /></button>` }
        }
      }
    })

    await flushPromises()
    ;(wrapper.vm as any).alerts = [{
      id: 1,
      productId: 100,
      productName: '监控商品',
      productPrice: 99,
      currentPrice: 99,
      targetPrice: 88,
      status: 0
    }]
    ;(wrapper.vm as any).editingAlert = (wrapper.vm as any).alerts[0]
    ;(wrapper.vm as any).newTargetPrice = 77

    const savePromise = (wrapper.vm as any).saveEdit()
    await flushPromises()

    expect((wrapper.vm as any).alerts[0].targetPrice).toBe(77)

    secondRequest.resolve({
      code: 200,
      data: [{
        id: 1,
        productId: 100,
        productName: '监控商品',
        productPrice: 99,
        currentPrice: 99,
        targetPrice: 77,
        status: 0
      }]
    })
    await savePromise
    await flushPromises()

    firstRequest.resolve({
      code: 200,
      data: [{
        id: 1,
        productId: 100,
        productName: '监控商品',
        productPrice: 99,
        currentPrice: 99,
        targetPrice: 88,
        status: 0
      }]
    })
    await flushPromises()

    expect((wrapper.vm as any).alerts[0].targetPrice).toBe(77)
  })

  it('does not let an in-flight alert request restore a cancelled monitoring alert', async () => {
    const firstRequest = createDeferred<any>()
    const secondRequest = createDeferred<any>()

    priceApi.getUserAlertDetails
      .mockImplementationOnce(() => firstRequest.promise)
      .mockImplementationOnce(() => secondRequest.promise)
    priceApi.cancelAlert.mockResolvedValue({ code: 200 })

    const wrapper = mount(PriceAlertsView, {
      global: {
        directives: { loading: {} },
        stubs: {
          Navbar: true,
          Footer: true,
          ElDialog: { template: '<div><slot /><slot name="footer" /></div>' },
          ElButton: { template: `<button @click="$emit('click')"><slot /></button>` }
        }
      }
    })

    await flushPromises()
    ;(wrapper.vm as any).alerts = [{
      id: 1,
      productId: 100,
      productName: '监控商品',
      productPrice: 99,
      currentPrice: 99,
      targetPrice: 88,
      status: 0
    }]

    const cancelPromise = (wrapper.vm as any).handleCancel((wrapper.vm as any).alerts[0])
    await flushPromises()

    expect((wrapper.vm as any).alerts[0].status).toBe(2)

    secondRequest.resolve({
      code: 200,
      data: [{
        id: 1,
        productId: 100,
        productName: '监控商品',
        productPrice: 99,
        currentPrice: 99,
        targetPrice: 88,
        status: 2
      }]
    })
    await cancelPromise
    await flushPromises()

    firstRequest.resolve({
      code: 200,
      data: [{
        id: 1,
        productId: 100,
        productName: '监控商品',
        productPrice: 99,
        currentPrice: 99,
        targetPrice: 88,
        status: 0
      }]
    })
    await flushPromises()

    expect((wrapper.vm as any).alerts[0].status).toBe(2)
  })

  it('does not let an in-flight alert request restore a deleted alert record', async () => {
    const firstRequest = createDeferred<any>()
    const secondRequest = createDeferred<any>()

    priceApi.getUserAlertDetails
      .mockImplementationOnce(() => firstRequest.promise)
      .mockImplementationOnce(() => secondRequest.promise)
    priceApi.deleteAlertRecord.mockResolvedValue({ code: 200 })

    const wrapper = mount(PriceAlertsView, {
      global: {
        directives: { loading: {} },
        stubs: {
          Navbar: true,
          Footer: true,
          ElDialog: { template: '<div><slot /><slot name="footer" /></div>' },
          ElButton: { template: `<button @click="$emit('click')"><slot /></button>` }
        }
      }
    })

    await flushPromises()
    ;(wrapper.vm as any).alerts = [{
      id: 1,
      productId: 100,
      productName: '触发商品',
      productPrice: 99,
      currentPrice: 99,
      targetPrice: 88,
      status: 1
    }]

    const deletePromise = (wrapper.vm as any).handleCancel((wrapper.vm as any).alerts[0])
    await flushPromises()

    expect((wrapper.vm as any).alerts).toEqual([])

    secondRequest.resolve({ code: 200, data: [] })
    await deletePromise
    await flushPromises()

    firstRequest.resolve({
      code: 200,
      data: [{
        id: 1,
        productId: 100,
        productName: '触发商品',
        productPrice: 99,
        currentPrice: 99,
        targetPrice: 88,
        status: 1
      }]
    })
    await flushPromises()

    expect((wrapper.vm as any).alerts).toEqual([])
  })

  it('clears edit dialog state after target price updates successfully', async () => {
    priceApi.getUserAlertDetails
      .mockResolvedValueOnce({
        code: 200,
        data: [
          {
            id: 1,
            productId: 100,
            productName: '监控商品',
            productImage: '/a.png',
            productPrice: 99,
            currentPrice: 99,
            targetPrice: 88,
            status: 0,
            createdTime: '2026-05-07T10:00:00'
          }
        ]
      })
      .mockResolvedValueOnce({
        code: 200,
        data: [
          {
            id: 1,
            productId: 100,
            productName: '监控商品',
            productImage: '/a.png',
            productPrice: 99,
            currentPrice: 99,
            targetPrice: 77,
            status: 0,
            createdTime: '2026-05-07T10:00:00'
          }
        ]
      })
    priceApi.createAlert.mockResolvedValue({ code: 200 })

    const wrapper = mount(PriceAlertsView, {
      global: {
        directives: { loading: {} },
        stubs: {
          Navbar: true,
          Footer: true,
          ElDialog: { template: '<div><slot /><slot name="footer" /></div>' },
          ElButton: { template: `<button @click="$emit('click')"><slot /></button>` }
        }
      }
    })

    await flushPromises()
    ;(wrapper.vm as any).editingAlert = {
      id: 1,
      productId: 100,
      productName: '监控商品',
      productPrice: 99,
      currentPrice: 99,
      targetPrice: 88,
      status: 0
    }
    ;(wrapper.vm as any).editDialogVisible = true
    ;(wrapper.vm as any).newTargetPrice = 77

    await (wrapper.vm as any).saveEdit()
    await flushPromises()

    expect((wrapper.vm as any).editDialogVisible).toBe(false)
    expect((wrapper.vm as any).editingAlert).toBeNull()
    expect((wrapper.vm as any).newTargetPrice).toBe(0)
  })

  it('closes edit dialog when refreshed alerts no longer contain the edited alert', async () => {
    priceApi.getUserAlertDetails
      .mockResolvedValueOnce({
        code: 200,
        data: [
          {
            id: 1,
            productId: 100,
            productName: '监控商品',
            productImage: '/a.png',
            productPrice: 99,
            currentPrice: 99,
            targetPrice: 88,
            status: 0,
            createdTime: '2026-05-07T10:00:00'
          }
        ]
      })
      .mockResolvedValueOnce({
        code: 200,
        data: []
      })

    const wrapper = mount(PriceAlertsView, {
      global: {
        directives: { loading: {} },
        stubs: {
          Navbar: true,
          Footer: true,
          ElDialog: { template: '<div><slot /><slot name="footer" /></div>' },
          ElButton: { template: `<button @click="$emit('click')"><slot /></button>` }
        }
      }
    })

    await flushPromises()
    ;(wrapper.vm as any).editingAlert = {
      id: 1,
      productId: 100,
      productName: '监控商品',
      productPrice: 99,
      currentPrice: 99,
      targetPrice: 88,
      status: 0
    }
    ;(wrapper.vm as any).editDialogVisible = true
    ;(wrapper.vm as any).newTargetPrice = 88

    await (wrapper.vm as any).fetchAlerts()
    await flushPromises()

    expect((wrapper.vm as any).alerts).toEqual([])
    expect((wrapper.vm as any).editDialogVisible).toBe(false)
    expect((wrapper.vm as any).editingAlert).toBeNull()
    expect((wrapper.vm as any).newTargetPrice).toBe(0)
  })
})
