import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Order } from '@/types'

const { adminApi, adminStore, messages, messageBox, debugError } = vi.hoisted(() => ({
  adminApi: {
    getAllOrders: vi.fn(),
    reviewCancelRequest: vi.fn(),
    updateOrderStatus: vi.fn(),
    deleteOrder: vi.fn()
  },
  adminStore: {
    fetchPendingOrderCount: vi.fn(),
    decreasePendingOrderCount: vi.fn()
  },
  messages: {
    success: vi.fn(),
    error: vi.fn()
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

vi.mock('@/api/fileApi', () => ({
  default: {
    getImageUrl: vi.fn(() => '/img.png')
  }
}))

vi.mock('@/stores/adminStore', () => ({
  useAdminStore: () => adminStore
}))

vi.mock('@/utils/debug', () => ({
  debugError
}))

import OrdersManageView from '@/views/admin/OrdersManageView.vue'

function createDeferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

function buildOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 1,
    orderNo: 'ORD-ADMIN-1',
    userId: 1,
    username: 'buyer',
    totalAmount: 100,
    paymentMethod: 1,
    paymentMethodName: '微信支付',
    paymentStatus: 1,
    paymentStatusName: '已支付',
    orderStatus: 6,
    orderStatusName: '申请取消中',
    items: [
      {
        id: 10,
        orderId: 1,
        productId: 100,
        productName: '商品A',
        productImage: '/a.png',
        price: 100,
        quantity: 1
      }
    ],
    shippingAddress: {
      id: 1,
      userId: 1,
      name: '张三',
      receiver: '张三',
      phone: '13800138000',
      province: '广东',
      city: '深圳',
      district: '南山',
      detail: '科技园',
      isDefault: true
    },
    createdTime: '2026-05-07T10:00:00',
    updatedTime: '2026-05-07T10:00:00',
    ...overrides
  }
}

describe('OrdersManageView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    messageBox.confirm.mockResolvedValue(undefined)
  })

  it('loads cancel requested orders for admin review', async () => {
    adminApi.getAllOrders.mockResolvedValue({ code: 200, data: [buildOrder()] })

    const wrapper = mount(OrdersManageView, {
      global: {
        directives: {
          loading: {}
        },
        stubs: {
          AdminLayout: {
            template: '<div><slot /></div>'
          },
          ElInput: true,
          ElButton: true,
          ElSelect: true,
          ElOption: true,
          ElTable: {
            props: ['data'],
            template: '<div><slot /></div>'
          },
          ElTableColumn: {
            template: '<div><slot :row="$attrs.row || {}" /></div>'
          },
          ElTag: true,
          ElPagination: true,
          ElDialog: true,
          ElImage: true
        }
      }
    })

    await flushPromises()

    expect(adminApi.getAllOrders).toHaveBeenCalledWith({ page: 0, size: 1000 })
    expect((wrapper.vm as unknown as { orders: Order[] }).orders[0].orderStatus).toBe(6)
  })

  it('shows backend message when loading orders returns non-200 payload', async () => {
    adminApi.getAllOrders.mockResolvedValue({ code: 500, message: '订单列表加载失败' })

    mount(OrdersManageView, {
      global: {
        directives: { loading: {} },
        stubs: {
          AdminLayout: { template: '<div><slot /></div>' },
          ElInput: true,
          ElButton: true,
          ElSelect: true,
          ElOption: true,
          ElTable: { props: ['data'], template: '<div><slot /></div>' },
          ElTableColumn: { template: '<div><slot :row=\"$attrs.row || {}\" /></div>' },
          ElTag: true,
          ElPagination: true,
          ElDialog: true,
          ElImage: true
        }
      }
    })

    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('订单列表加载失败')
    expect(debugError).toHaveBeenCalledWith('获取订单列表失败:', '订单列表加载失败')
  })

  it('reviews cancel request and refreshes counts and list', async () => {
    adminApi.getAllOrders
      .mockResolvedValueOnce({ code: 200, data: [buildOrder()] })
      .mockResolvedValueOnce({
        code: 200,
        data: [buildOrder({ orderStatus: 4, orderStatusName: '已取消' })]
      })
    adminApi.reviewCancelRequest.mockResolvedValue({ code: 200 })

    const wrapper = mount(OrdersManageView, {
      global: {
        directives: {
          loading: {}
        },
        stubs: {
          AdminLayout: {
            template: '<div><slot /></div>'
          },
          ElInput: true,
          ElButton: {
            template: '<button @click="$emit(\'click\')"><slot /></button>'
          },
          ElSelect: true,
          ElOption: true,
          ElTable: {
            props: ['data'],
            template: '<div><slot /></div>'
          },
          ElTableColumn: {
            template: '<div><slot :row="$attrs.row || {}" /></div>'
          },
          ElTag: true,
          ElPagination: true,
          ElDialog: true,
          ElImage: true
        }
      }
    })

    await flushPromises()

    await (wrapper.vm as unknown as { reviewCancel: (order: Order, approved: boolean) => Promise<void> })
      .reviewCancel(buildOrder(), true)
    await flushPromises()

    expect(adminApi.reviewCancelRequest).toHaveBeenCalledWith(1, true)
    expect(adminStore.fetchPendingOrderCount).toHaveBeenCalled()
    expect(adminStore.decreasePendingOrderCount).toHaveBeenCalled()
    expect(adminApi.getAllOrders).toHaveBeenCalledTimes(2)
    expect(messages.success).toHaveBeenCalledWith('已同意取消')
  })

  it('keeps cancel success when refreshing orders fails afterward', async () => {
    adminApi.getAllOrders
      .mockResolvedValueOnce({ code: 200, data: [buildOrder({ orderStatus: 0, orderStatusName: '待付款' })] })
      .mockRejectedValueOnce(new Error('刷新失败'))
    adminApi.updateOrderStatus.mockResolvedValue({ code: 200 })

    const wrapper = mount(OrdersManageView, {
      global: {
        directives: { loading: {} },
        stubs: {
          AdminLayout: { template: '<div><slot /></div>' },
          ElInput: true,
          ElButton: true,
          ElSelect: true,
          ElOption: true,
          ElTable: { props: ['data'], template: '<div><slot /></div>' },
          ElTableColumn: { template: '<div><slot :row=\"$attrs.row || {}\" /></div>' },
          ElTag: true,
          ElPagination: true,
          ElDialog: true,
          ElImage: true
        }
      }
    })

    await flushPromises()
    await (wrapper.vm as unknown as { cancelOrder: (order: Order) => Promise<void> })
      .cancelOrder(buildOrder({ orderStatus: 0, orderStatusName: '待付款' }))
    await flushPromises()

    expect(messages.success).toHaveBeenCalledWith('订单已取消')
    expect(messages.error).not.toHaveBeenCalledWith('刷新失败')
    expect(debugError).toHaveBeenCalledWith('获取订单列表失败:', expect.any(Error))
  })

  it('keeps cancel-review success when refreshing orders fails afterward', async () => {
    adminApi.getAllOrders
      .mockResolvedValueOnce({ code: 200, data: [buildOrder()] })
      .mockRejectedValueOnce(new Error('刷新失败'))
    adminApi.reviewCancelRequest.mockResolvedValue({ code: 200 })

    const wrapper = mount(OrdersManageView, {
      global: {
        directives: { loading: {} },
        stubs: {
          AdminLayout: { template: '<div><slot /></div>' },
          ElInput: true,
          ElButton: true,
          ElSelect: true,
          ElOption: true,
          ElTable: { props: ['data'], template: '<div><slot /></div>' },
          ElTableColumn: { template: '<div><slot :row=\"$attrs.row || {}\" /></div>' },
          ElTag: true,
          ElPagination: true,
          ElDialog: true,
          ElImage: true
        }
      }
    })

    await flushPromises()
    await (wrapper.vm as unknown as { reviewCancel: (order: Order, approved: boolean) => Promise<void> })
      .reviewCancel(buildOrder(), true)
    await flushPromises()

    expect(messages.success).toHaveBeenCalledWith('已同意取消')
    expect(messages.error).not.toHaveBeenCalledWith('刷新失败')
    expect(debugError).toHaveBeenCalledWith('获取订单列表失败:', expect.any(Error))
  })

  it('keeps delete success when refreshing orders fails afterward', async () => {
    adminApi.getAllOrders
      .mockResolvedValueOnce({ code: 200, data: [buildOrder({ orderStatus: 4, orderStatusName: '已取消' })] })
      .mockRejectedValueOnce(new Error('刷新失败'))
    adminApi.deleteOrder.mockResolvedValue({ code: 200 })

    const wrapper = mount(OrdersManageView, {
      global: {
        directives: { loading: {} },
        stubs: {
          AdminLayout: { template: '<div><slot /></div>' },
          ElInput: true,
          ElButton: true,
          ElSelect: true,
          ElOption: true,
          ElTable: { props: ['data'], template: '<div><slot /></div>' },
          ElTableColumn: { template: '<div><slot :row=\"$attrs.row || {}\" /></div>' },
          ElTag: true,
          ElPagination: true,
          ElDialog: true,
          ElImage: true
        }
      }
    })

    await flushPromises()
    await (wrapper.vm as unknown as { deleteOrder: (order: Order) => Promise<void> })
      .deleteOrder(buildOrder({ orderStatus: 4, orderStatusName: '已取消' }))
    await flushPromises()

    expect(messages.success).toHaveBeenCalledWith('订单已删除')
    expect(messages.error).not.toHaveBeenCalledWith('刷新失败')
    expect(debugError).toHaveBeenCalledWith('获取订单列表失败:', expect.any(Error))
  })

  it('does not show an error when admin cancels cancel-review confirmation', async () => {
    adminApi.getAllOrders.mockResolvedValue({ code: 200, data: [buildOrder()] })
    messageBox.confirm.mockRejectedValue('cancel')

    const wrapper = mount(OrdersManageView, {
      global: {
        directives: {
          loading: {}
        },
        stubs: {
          AdminLayout: { template: '<div><slot /></div>' },
          ElInput: true,
          ElButton: true,
          ElSelect: true,
          ElOption: true,
          ElTable: { props: ['data'], template: '<div><slot /></div>' },
          ElTableColumn: { template: '<div><slot :row="$attrs.row || {}" /></div>' },
          ElTag: true,
          ElPagination: true,
          ElDialog: true,
          ElImage: true
        }
      }
    })

    await flushPromises()
    await (wrapper.vm as unknown as { reviewCancel: (order: Order, approved: boolean) => Promise<void> })
      .reviewCancel(buildOrder(), true)
    await flushPromises()

    expect(adminApi.reviewCancelRequest).not.toHaveBeenCalled()
    expect(messages.error).not.toHaveBeenCalled()
  })

  it('shows backend message when cancel review returns non-200 payload', async () => {
    adminApi.getAllOrders.mockResolvedValue({ code: 200, data: [buildOrder()] })
    adminApi.reviewCancelRequest.mockResolvedValue({ code: 500, message: '审核失败，请稍后重试' })

    const wrapper = mount(OrdersManageView, {
      global: {
        directives: { loading: {} },
        stubs: {
          AdminLayout: { template: '<div><slot /></div>' },
          ElInput: true,
          ElButton: true,
          ElSelect: true,
          ElOption: true,
          ElTable: { props: ['data'], template: '<div><slot /></div>' },
          ElTableColumn: { template: '<div><slot :row=\"$attrs.row || {}\" /></div>' },
          ElTag: true,
          ElPagination: true,
          ElDialog: true,
          ElImage: true
        }
      }
    })

    await flushPromises()
    await (wrapper.vm as unknown as { reviewCancel: (order: Order, approved: boolean) => Promise<void> })
      .reviewCancel(buildOrder(), true)
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('审核失败，请稍后重试')
    expect(debugError).toHaveBeenCalledWith('审核取消申请失败:', '审核失败，请稍后重试')
  })

  it('shows backend message when deleting an order returns non-200 payload', async () => {
    adminApi.getAllOrders.mockResolvedValue({ code: 200, data: [buildOrder({ orderStatus: 4 })] })
    adminApi.deleteOrder.mockResolvedValue({ code: 500, message: '订单删除失败' })

    const wrapper = mount(OrdersManageView, {
      global: {
        directives: { loading: {} },
        stubs: {
          AdminLayout: { template: '<div><slot /></div>' },
          ElInput: true,
          ElButton: true,
          ElSelect: true,
          ElOption: true,
          ElTable: { props: ['data'], template: '<div><slot /></div>' },
          ElTableColumn: { template: '<div><slot :row=\"$attrs.row || {}\" /></div>' },
          ElTag: true,
          ElPagination: true,
          ElDialog: true,
          ElImage: true
        }
      }
    })

    await flushPromises()
    await (wrapper.vm as unknown as { deleteOrder: (order: Order) => Promise<void> })
      .deleteOrder(buildOrder({ orderStatus: 4 }))
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('订单删除失败')
    expect(debugError).toHaveBeenCalledWith('删除订单失败:', '订单删除失败')
  })

  it('shows an error when deleting an order fails', async () => {
    adminApi.getAllOrders.mockResolvedValue({ code: 200, data: [buildOrder({ orderStatus: 4 })] })
    adminApi.deleteOrder.mockRejectedValue(new Error('boom'))

    const wrapper = mount(OrdersManageView, {
      global: {
        directives: {
          loading: {}
        },
        stubs: {
          AdminLayout: { template: '<div><slot /></div>' },
          ElInput: true,
          ElButton: true,
          ElSelect: true,
          ElOption: true,
          ElTable: { props: ['data'], template: '<div><slot /></div>' },
          ElTableColumn: { template: '<div><slot :row="$attrs.row || {}" /></div>' },
          ElTag: true,
          ElPagination: true,
          ElDialog: true,
          ElImage: true
        }
      }
    })

    await flushPromises()
    await (wrapper.vm as unknown as { deleteOrder: (order: Order) => Promise<void> })
      .deleteOrder(buildOrder({ orderStatus: 4 }))
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('boom')
    expect(debugError).toHaveBeenCalledWith('删除订单失败:', expect.any(Error))
  })

  it('ignores stale order list responses when a newer refresh finishes first', async () => {
    const firstRequest = createDeferred<any>()
    const secondRequest = createDeferred<any>()

    adminApi.getAllOrders
      .mockImplementationOnce(() => firstRequest.promise)
      .mockImplementationOnce(() => secondRequest.promise)

    const wrapper = mount(OrdersManageView, {
      global: {
        directives: { loading: {} },
        stubs: {
          AdminLayout: { template: '<div><slot /></div>' },
          ElInput: true,
          ElButton: true,
          ElSelect: true,
          ElOption: true,
          ElTable: { props: ['data'], template: '<div><slot /></div>' },
          ElTableColumn: { template: '<div><slot :row="$attrs.row || {}" /></div>' },
          ElTag: true,
          ElPagination: true,
          ElDialog: true,
          ElImage: true
        }
      }
    })

    await flushPromises()

    const vm = wrapper.vm as unknown as { fetchOrders: () => Promise<void> }
    const refetchPromise = vm.fetchOrders()
    await flushPromises()

    secondRequest.resolve({
      code: 200,
      data: [buildOrder({ id: 2, orderNo: 'ORD-ADMIN-NEW' })]
    })
    await refetchPromise
    await flushPromises()

    expect((wrapper.vm as any).orders[0].orderNo).toBe('ORD-ADMIN-NEW')

    firstRequest.resolve({
      code: 200,
      data: [buildOrder({ id: 1, orderNo: 'ORD-ADMIN-OLD' })]
    })
    await flushPromises()

    expect((wrapper.vm as any).orders[0].orderNo).toBe('ORD-ADMIN-NEW')
  })

  it('logs and falls back to raw address text when shipping address json is invalid', async () => {
    adminApi.getAllOrders.mockResolvedValue({
      code: 200,
      data: [buildOrder({ shippingAddress: '{"receiver":"张三"' })]
    })

    const wrapper = mount(OrdersManageView, {
      global: {
        directives: { loading: {} },
        stubs: {
          AdminLayout: { template: '<div><slot /></div>' },
          ElInput: true,
          ElButton: true,
          ElSelect: true,
          ElOption: true,
          ElTable: { props: ['data'], template: '<div><slot /></div>' },
          ElTableColumn: { template: '<div><slot :row="$attrs.row || {}" /></div>' },
          ElTag: true,
          ElPagination: true,
          ElDialog: { template: '<div><slot /></div>' },
          ElImage: true
        }
      }
    })

    await flushPromises()

    ;(wrapper.vm as unknown as { viewDetail: (order: Order) => void })
      .viewDetail(buildOrder({ shippingAddress: '{"receiver":"张三"' }))
    await flushPromises()

    expect(wrapper.text()).toContain('{"receiver":"张三"')
    expect(debugError).toHaveBeenCalledWith('解析订单收货地址失败:', expect.any(SyntaxError))
  })

  it('does not let an in-flight order request overwrite cancel success', async () => {
    const firstRequest = createDeferred<any>()
    const secondRequest = createDeferred<any>()

    adminApi.getAllOrders
      .mockImplementationOnce(() => firstRequest.promise)
      .mockImplementationOnce(() => secondRequest.promise)
    adminApi.updateOrderStatus.mockResolvedValue({ code: 200 })

    const wrapper = mount(OrdersManageView, {
      global: {
        directives: { loading: {} },
        stubs: {
          AdminLayout: { template: '<div><slot /></div>' },
          ElInput: true,
          ElButton: true,
          ElSelect: true,
          ElOption: true,
          ElTable: { props: ['data'], template: '<div><slot /></div>' },
          ElTableColumn: { template: '<div><slot :row="$attrs.row || {}" /></div>' },
          ElTag: true,
          ElPagination: true,
          ElDialog: true,
          ElImage: true
        }
      }
    })

    await flushPromises()
    ;(wrapper.vm as any).allOrders = [buildOrder({ orderStatus: 0, orderStatusName: '待付款' })]
    ;(wrapper.vm as any).orders = [buildOrder({ orderStatus: 0, orderStatusName: '待付款' })]
    ;(wrapper.vm as any).total = 1

    const cancelPromise = (wrapper.vm as any).cancelOrder(buildOrder({ orderStatus: 0, orderStatusName: '待付款' }))
    await flushPromises()

    expect((wrapper.vm as any).orders[0].orderStatus).toBe(4)

    secondRequest.resolve({ code: 200, data: [buildOrder({ orderStatus: 4, orderStatusName: '已取消' })] })
    await cancelPromise
    await flushPromises()

    firstRequest.resolve({ code: 200, data: [buildOrder({ orderStatus: 0, orderStatusName: '待付款' })] })
    await flushPromises()

    expect((wrapper.vm as any).orders[0].orderStatus).toBe(4)
  })

  it('does not let an in-flight order request restore a deleted order', async () => {
    const firstRequest = createDeferred<any>()
    const secondRequest = createDeferred<any>()

    adminApi.getAllOrders
      .mockImplementationOnce(() => firstRequest.promise)
      .mockImplementationOnce(() => secondRequest.promise)
    adminApi.deleteOrder.mockResolvedValue({ code: 200 })

    const wrapper = mount(OrdersManageView, {
      global: {
        directives: { loading: {} },
        stubs: {
          AdminLayout: { template: '<div><slot /></div>' },
          ElInput: true,
          ElButton: true,
          ElSelect: true,
          ElOption: true,
          ElTable: { props: ['data'], template: '<div><slot /></div>' },
          ElTableColumn: { template: '<div><slot :row="$attrs.row || {}" /></div>' },
          ElTag: true,
          ElPagination: true,
          ElDialog: true,
          ElImage: true
        }
      }
    })

    await flushPromises()
    ;(wrapper.vm as any).allOrders = [buildOrder({ orderStatus: 4, orderStatusName: '已取消' })]
    ;(wrapper.vm as any).orders = [buildOrder({ orderStatus: 4, orderStatusName: '已取消' })]
    ;(wrapper.vm as any).total = 1

    const deletePromise = (wrapper.vm as any).deleteOrder(buildOrder({ orderStatus: 4, orderStatusName: '已取消' }))
    await flushPromises()

    expect((wrapper.vm as any).orders).toEqual([])

    secondRequest.resolve({ code: 200, data: [] })
    await deletePromise
    await flushPromises()

    firstRequest.resolve({ code: 200, data: [buildOrder({ orderStatus: 4, orderStatusName: '已取消' })] })
    await flushPromises()

    expect((wrapper.vm as any).orders).toEqual([])
  })

  it('does not let an in-flight order request overwrite approve-cancel success', async () => {
    const firstRequest = createDeferred<any>()
    const secondRequest = createDeferred<any>()

    adminApi.getAllOrders
      .mockImplementationOnce(() => firstRequest.promise)
      .mockImplementationOnce(() => secondRequest.promise)
    adminApi.reviewCancelRequest.mockResolvedValue({ code: 200 })

    const wrapper = mount(OrdersManageView, {
      global: {
        directives: { loading: {} },
        stubs: {
          AdminLayout: { template: '<div><slot /></div>' },
          ElInput: true,
          ElButton: true,
          ElSelect: true,
          ElOption: true,
          ElTable: { props: ['data'], template: '<div><slot /></div>' },
          ElTableColumn: { template: '<div><slot :row="$attrs.row || {}" /></div>' },
          ElTag: true,
          ElPagination: true,
          ElDialog: true,
          ElImage: true
        }
      }
    })

    await flushPromises()
    ;(wrapper.vm as any).allOrders = [buildOrder()]
    ;(wrapper.vm as any).orders = [buildOrder()]
    ;(wrapper.vm as any).total = 1

    const reviewPromise = (wrapper.vm as any).reviewCancel(buildOrder(), true)
    await flushPromises()

    expect((wrapper.vm as any).orders[0].orderStatus).toBe(4)

    secondRequest.resolve({ code: 200, data: [buildOrder({ orderStatus: 4, orderStatusName: '已取消' })] })
    await reviewPromise
    await flushPromises()

    firstRequest.resolve({ code: 200, data: [buildOrder()] })
    await flushPromises()

    expect((wrapper.vm as any).orders[0].orderStatus).toBe(4)
  })
})
