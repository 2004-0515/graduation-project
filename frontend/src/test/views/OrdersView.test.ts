import { createPinia, setActivePinia } from 'pinia'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Order } from '@/types'

const { mockPush, mockRoute, orderApi, reviewApi, messages, debugError } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockRoute: {
    query: {
      status: '1',
      search: ''
    }
  },
  orderApi: {
    getUserOrders: vi.fn(),
    cancelOrder: vi.fn(),
    requestCancelOrder: vi.fn(),
    confirmReceive: vi.fn()
  },
  reviewApi: {
    createReview: vi.fn()
  },
  debugError: vi.fn(),
  messages: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn()
  }
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
  useRoute: () => mockRoute
}))

vi.mock('element-plus', () => ({
  ElMessage: messages
}))

vi.mock('@/api/orderApi', () => ({
  default: orderApi
}))

vi.mock('@/api/reviewApi', () => ({
  default: reviewApi
}))

vi.mock('@/api/fileApi', () => ({
  default: {
    getImageUrl: vi.fn(() => '/img.png')
  }
}))

vi.mock('@/utils/debug', () => ({
  debugError
}))

import OrdersView from '@/views/OrdersView.vue'

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
    orderNo: 'ORD-1',
    userId: 1,
    username: 'buyer',
    totalAmount: 100,
    paymentMethod: 1,
    paymentMethodName: '微信支付',
    paymentStatus: 0,
    paymentStatusName: '未支付',
    orderStatus: 0,
    orderStatusName: '待支付',
    items: [
      {
        id: 10,
        orderId: 1,
        productId: 100,
        productName: '商品A',
        productImage: '/a.png',
        price: 100,
        quantity: 1,
        reviewed: false
      }
    ],
    createdTime: '2026-05-07T10:00:00',
    updatedTime: '2026-05-07T10:00:00',
    ...overrides
  }
}

describe('OrdersView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
    setActivePinia(createPinia())
  })

  it('applies route status filter on load', async () => {
    orderApi.getUserOrders.mockResolvedValue({
      code: 200,
      data: [
        buildOrder({ id: 1, orderNo: 'ORD-1', orderStatus: 1, orderStatusName: '待发货' }),
        buildOrder({ id: 2, orderNo: 'ORD-2', orderStatus: 0, orderStatusName: '待支付' })
      ]
    })

    const wrapper = mount(OrdersView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true,
          RouterLink: true,
          ElPagination: true,
          ElDialog: true,
          ElInput: true,
          ElCheckbox: true,
          ElButton: true
        }
      }
    })

    await flushPromises()

    expect(wrapper.text()).toContain('ORD-1')
    expect(wrapper.text()).not.toContain('ORD-2')
  })

  it('refreshes orders after requesting cancel', async () => {
    mockRoute.query.status = undefined
    orderApi.getUserOrders
      .mockResolvedValueOnce({
        code: 200,
        data: [buildOrder({ id: 1, orderStatus: 1, orderStatusName: '待发货', paymentStatus: 1 })]
      })
      .mockResolvedValueOnce({
        code: 200,
        data: [buildOrder({ id: 1, orderStatus: 6, orderStatusName: '申请取消中', paymentStatus: 1 })]
      })
    orderApi.requestCancelOrder.mockResolvedValue({ code: 200 })

    const wrapper = mount(OrdersView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true,
          RouterLink: true,
          ElPagination: true,
          ElDialog: true,
          ElInput: true,
          ElCheckbox: true,
          ElButton: true
        }
      }
    })

    await flushPromises()

    await wrapper.findAll('button').find((button) => button.text() === '申请取消')!.trigger('click')
    await flushPromises()

    expect(orderApi.requestCancelOrder).toHaveBeenCalledWith(1)
    expect(orderApi.getUserOrders).toHaveBeenCalledTimes(2)
    expect(wrapper.text()).toContain('等待管理员审核')
  })

  it('refreshes orders after review submission succeeds', async () => {
    mockRoute.query.status = '3'
    const reviewedOrder = buildOrder({
      id: 1,
      orderStatus: 3,
      orderStatusName: '已完成',
      items: [
        {
          id: 10,
          orderId: 1,
          productId: 100,
          productName: '商品A',
          productImage: '/a.png',
          price: 100,
          quantity: 1,
          reviewed: true
        }
      ]
    })
    orderApi.getUserOrders
      .mockResolvedValueOnce({
        code: 200,
        data: [buildOrder({ id: 1, orderStatus: 3, orderStatusName: '已完成' })]
      })
      .mockResolvedValueOnce({
        code: 200,
        data: [reviewedOrder]
      })
      .mockResolvedValue({
        code: 200,
        data: [reviewedOrder]
      })
    reviewApi.createReview.mockResolvedValue({ code: 200 })

    const wrapper = mount(OrdersView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true,
          RouterLink: true,
          ElPagination: true,
          ElDialog: {
            template: '<div><slot /><slot name="footer" /></div>'
          },
          ElInput: true,
          ElCheckbox: true,
          ElButton: {
            template: '<button @click="$emit(\'click\')"><slot /></button>'
          }
        }
      }
    })

    await flushPromises()

    await wrapper.findAll('button').find((button) => button.text() === '去评价')!.trigger('click')
    await flushPromises()

    await wrapper.findAll('.star')[4].trigger('click')
    await wrapper.findAll('button').find((button) => button.text() === '提交评价')!.trigger('click')
    await flushPromises()

    expect(reviewApi.createReview).toHaveBeenCalled()
    expect(orderApi.getUserOrders.mock.calls.length).toBeGreaterThanOrEqual(2)
    expect(messages.success).toHaveBeenCalledWith('评价提交成功')
    expect(wrapper.text()).toContain('已评价')
  })

  it('shows backend message when loading orders returns non-200', async () => {
    mockRoute.query.status = undefined
    vi.useFakeTimers()
    orderApi.getUserOrders.mockResolvedValue({
      code: 500,
      message: '订单服务暂不可用'
    })

    const wrapper = mount(OrdersView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true,
          RouterLink: true,
          ElPagination: true,
          ElDialog: true,
          ElInput: true,
          ElCheckbox: true,
          ElButton: true
        }
      }
    })

    await flushPromises()
    await vi.advanceTimersByTimeAsync(600)
    await flushPromises()

    expect(wrapper.text()).toContain('订单服务暂不可用')
    expect(debugError).toHaveBeenCalledWith('获取订单列表失败，准备重试:', '订单服务暂不可用')
    expect(debugError).toHaveBeenCalledWith('获取订单列表失败:', '订单服务暂不可用')
  })

  it('shows backend message when confirm receive throws', async () => {
    mockRoute.query.status = undefined
    orderApi.getUserOrders.mockResolvedValue({
      code: 200,
      data: [buildOrder({ id: 3, orderStatus: 2, orderStatusName: '待收货', paymentStatus: 1 })]
    })
    orderApi.confirmReceive.mockRejectedValue({ response: { data: { message: '订单状态已变更' } } })

    const wrapper = mount(OrdersView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true,
          RouterLink: true,
          ElPagination: true,
          ElDialog: true,
          ElInput: true,
          ElCheckbox: true,
          ElButton: true
        }
      }
    })

    await flushPromises()

    await wrapper.findAll('button').find((button) => button.text() === '确认收货')!.trigger('click')
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('订单状态已变更')
    expect(debugError).toHaveBeenCalledWith('确认收货失败:', expect.any(Object))
  })

  it('shows backend message when review submit returns non-200', async () => {
    mockRoute.query.status = '3'
    orderApi.getUserOrders.mockResolvedValue({
      code: 200,
      data: [buildOrder({ id: 1, orderStatus: 3, orderStatusName: '已完成' })]
    })
    reviewApi.createReview.mockResolvedValue({ code: 422, message: '评价内容不能为空' })

    const wrapper = mount(OrdersView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true,
          RouterLink: true,
          ElPagination: true,
          ElDialog: {
            template: '<div><slot /><slot name="footer" /></div>'
          },
          ElInput: true,
          ElCheckbox: true,
          ElButton: {
            template: '<button @click="$emit(\'click\')"><slot /></button>'
          }
        }
      }
    })

    await flushPromises()

    await wrapper.findAll('button').find((button) => button.text() === '去评价')!.trigger('click')
    await flushPromises()
    await wrapper.findAll('button').find((button) => button.text() === '提交评价')!.trigger('click')
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('评价内容不能为空')
    expect(debugError).toHaveBeenCalledWith('提交评价失败:', '评价内容不能为空')
  })

  it('logs backend message when cancel order returns non-200', async () => {
    mockRoute.query.status = undefined
    orderApi.getUserOrders.mockResolvedValue({
      code: 200,
      data: [buildOrder({ id: 1, orderStatus: 0, orderStatusName: '待支付' })]
    })
    orderApi.cancelOrder.mockResolvedValue({ code: 500, message: '订单无法取消' })

    const wrapper = mount(OrdersView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true,
          RouterLink: true,
          ElPagination: true,
          ElDialog: true,
          ElInput: true,
          ElCheckbox: true,
          ElButton: true
        }
      }
    })

    await flushPromises()
    await wrapper.findAll('button').find((button) => button.text() === '取消订单')!.trigger('click')
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('订单无法取消')
    expect(debugError).toHaveBeenCalledWith('取消订单失败:', '订单无法取消')
  })

  it('logs backend message when request cancel returns non-200', async () => {
    mockRoute.query.status = undefined
    orderApi.getUserOrders.mockResolvedValue({
      code: 200,
      data: [buildOrder({ id: 1, orderStatus: 1, orderStatusName: '待发货', paymentStatus: 1 })]
    })
    orderApi.requestCancelOrder.mockResolvedValue({ code: 500, message: '当前订单不可申请取消' })

    const wrapper = mount(OrdersView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true,
          RouterLink: true,
          ElPagination: true,
          ElDialog: true,
          ElInput: true,
          ElCheckbox: true,
          ElButton: true
        }
      }
    })

    await flushPromises()
    await wrapper.findAll('button').find((button) => button.text() === '申请取消')!.trigger('click')
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('当前订单不可申请取消')
    expect(debugError).toHaveBeenCalledWith('提交取消申请失败:', '当前订单不可申请取消')
  })

  it('logs backend message when confirm receive returns non-200', async () => {
    mockRoute.query.status = undefined
    orderApi.getUserOrders.mockResolvedValue({
      code: 200,
      data: [buildOrder({ id: 3, orderStatus: 2, orderStatusName: '待收货', paymentStatus: 1 })]
    })
    orderApi.confirmReceive.mockResolvedValue({ code: 500, message: '订单尚未发货完成' })

    const wrapper = mount(OrdersView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true,
          RouterLink: true,
          ElPagination: true,
          ElDialog: true,
          ElInput: true,
          ElCheckbox: true,
          ElButton: true
        }
      }
    })

    await flushPromises()
    await wrapper.findAll('button').find((button) => button.text() === '确认收货')!.trigger('click')
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('订单尚未发货完成')
    expect(debugError).toHaveBeenCalledWith('确认收货失败:', '订单尚未发货完成')
  })

  it('keeps cancel success when refreshing orders fails afterward', async () => {
    mockRoute.query.status = undefined
    orderApi.getUserOrders
      .mockResolvedValueOnce({
        code: 200,
        data: [buildOrder({ id: 1, orderStatus: 0, orderStatusName: '待支付' })]
      })
      .mockRejectedValueOnce(new Error('刷新失败'))
    orderApi.cancelOrder.mockResolvedValue({ code: 200 })

    const wrapper = mount(OrdersView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true,
          RouterLink: true,
          ElPagination: true,
          ElDialog: true,
          ElInput: true,
          ElCheckbox: true,
          ElButton: true
        }
      }
    })

    await flushPromises()
    await wrapper.findAll('button').find((button) => button.text() === '取消订单')!.trigger('click')
    await flushPromises()

    expect(messages.success).toHaveBeenCalledWith('订单已取消')
    expect(messages.error).not.toHaveBeenCalledWith('刷新失败')
    expect(debugError).toHaveBeenCalledWith('获取订单列表失败:', expect.any(Error))
  })

  it('keeps request-cancel success when refreshing orders fails afterward', async () => {
    mockRoute.query.status = undefined
    orderApi.getUserOrders
      .mockResolvedValueOnce({
        code: 200,
        data: [buildOrder({ id: 1, orderStatus: 1, orderStatusName: '待发货', paymentStatus: 1 })]
      })
      .mockRejectedValueOnce(new Error('刷新失败'))
    orderApi.requestCancelOrder.mockResolvedValue({ code: 200 })

    const wrapper = mount(OrdersView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true,
          RouterLink: true,
          ElPagination: true,
          ElDialog: true,
          ElInput: true,
          ElCheckbox: true,
          ElButton: true
        }
      }
    })

    await flushPromises()
    await wrapper.findAll('button').find((button) => button.text() === '申请取消')!.trigger('click')
    await flushPromises()

    expect(messages.success).toHaveBeenCalledWith('取消申请已提交')
    expect(messages.error).not.toHaveBeenCalledWith('刷新失败')
    expect(debugError).toHaveBeenCalledWith('获取订单列表失败:', expect.any(Error))
  })

  it('keeps confirm-receive success when refreshing orders fails afterward', async () => {
    mockRoute.query.status = undefined
    orderApi.getUserOrders
      .mockResolvedValueOnce({
        code: 200,
        data: [buildOrder({ id: 3, orderStatus: 2, orderStatusName: '待收货', paymentStatus: 1 })]
      })
      .mockRejectedValueOnce(new Error('刷新失败'))
    orderApi.confirmReceive.mockResolvedValue({ code: 200 })

    const wrapper = mount(OrdersView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true,
          RouterLink: true,
          ElPagination: true,
          ElDialog: true,
          ElInput: true,
          ElCheckbox: true,
          ElButton: true
        }
      }
    })

    await flushPromises()
    await wrapper.findAll('button').find((button) => button.text() === '确认收货')!.trigger('click')
    await flushPromises()

    expect(messages.success).toHaveBeenCalledWith('已确认收货')
    expect(messages.error).not.toHaveBeenCalledWith('刷新失败')
    expect(debugError).toHaveBeenCalledWith('获取订单列表失败:', expect.any(Error))
  })

  it('keeps review success when refreshing orders fails afterward', async () => {
    mockRoute.query.status = '3'
    orderApi.getUserOrders
      .mockResolvedValueOnce({
        code: 200,
        data: [buildOrder({ id: 1, orderStatus: 3, orderStatusName: '已完成' })]
      })
      .mockRejectedValue(new Error('刷新失败'))
    reviewApi.createReview.mockResolvedValue({ code: 200 })

    const wrapper = mount(OrdersView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true,
          RouterLink: true,
          ElPagination: true,
          ElDialog: {
            template: '<div><slot /><slot name="footer" /></div>'
          },
          ElInput: true,
          ElCheckbox: true,
          ElButton: {
            template: `<button @click="$emit('click')"><slot /></button>`
          }
        }
      }
    })

    await flushPromises()
    await wrapper.findAll('button').find((button) => button.text() === '去评价')!.trigger('click')
    await flushPromises()
    await wrapper.findAll('button').find((button) => button.text() === '提交评价')!.trigger('click')
    await flushPromises()

    expect(messages.success).toHaveBeenCalledWith('评价提交成功')
    expect(messages.error).not.toHaveBeenCalledWith('刷新失败')
    expect(orderApi.getUserOrders.mock.calls.length).toBeGreaterThanOrEqual(2)
    expect(debugError).toHaveBeenCalledWith('获取订单列表失败:', expect.any(Error))
  })

  it('ignores stale order responses when newer fetch finishes later', async () => {
    mockRoute.query.status = undefined
    const firstRequest = createDeferred<{ code: number; data: Order[] }>()
    const secondRequest = createDeferred<{ code: number; data: Order[] }>()

    orderApi.getUserOrders
      .mockImplementationOnce(() => firstRequest.promise)
      .mockImplementationOnce(() => secondRequest.promise)

    const wrapper = mount(OrdersView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true,
          RouterLink: true,
          ElPagination: true,
          ElDialog: true,
          ElInput: true,
          ElCheckbox: true,
          ElButton: true
        }
      }
    })

    await flushPromises()

    const vm = wrapper.vm as unknown as { fetchOrders: () => Promise<void> }
    const refetchPromise = vm.fetchOrders()
    await flushPromises()

    secondRequest.resolve({
      code: 200,
      data: [buildOrder({ id: 2, orderNo: 'ORD-NEW' })]
    })
    await refetchPromise
    await flushPromises()

    expect(wrapper.text()).toContain('ORD-NEW')

    firstRequest.resolve({
      code: 200,
      data: [buildOrder({ id: 1, orderNo: 'ORD-OLD' })]
    })
    await flushPromises()

    expect(wrapper.text()).toContain('ORD-NEW')
    expect(wrapper.text()).not.toContain('ORD-OLD')
  })

  it('retries once when loading orders hits a transient failure', async () => {
    mockRoute.query.status = undefined
    vi.useFakeTimers()
    orderApi.getUserOrders
      .mockRejectedValueOnce({ code: 429, response: { data: { code: 429, message: '请求过于频繁，请稍后重试' } } })
      .mockResolvedValueOnce({
        code: 200,
        data: [buildOrder({ id: 5, orderNo: 'ORD-RETRY', orderStatus: 1, orderStatusName: '待发货' })]
      })

    const wrapper = mount(OrdersView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true,
          RouterLink: true,
          ElPagination: true,
          ElDialog: true,
          ElInput: true,
          ElCheckbox: true,
          ElButton: true
        }
      }
    })

    await flushPromises()
    await vi.advanceTimersByTimeAsync(600)
    await flushPromises()

    expect(orderApi.getUserOrders).toHaveBeenCalledTimes(2)
    expect(wrapper.text()).toContain('ORD-RETRY')
    expect(wrapper.text()).not.toContain('加载失败')
    expect(debugError).toHaveBeenCalledWith('获取订单列表失败，准备重试:', expect.any(Object))
  })

  it('does not let an in-flight order request overwrite local cancel success', async () => {
    mockRoute.query.status = undefined
    const firstRequest = createDeferred<{ code: number; data: Order[] }>()
    const secondRequest = createDeferred<{ code: number; data: Order[] }>()
    orderApi.getUserOrders
      .mockImplementationOnce(() => firstRequest.promise)
      .mockImplementationOnce(() => secondRequest.promise)
    orderApi.cancelOrder.mockResolvedValue({ code: 200 })

    const wrapper = mount(OrdersView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true,
          RouterLink: true,
          ElPagination: true,
          ElDialog: true,
          ElInput: true,
          ElCheckbox: true,
          ElButton: true
        }
      }
    })

    await flushPromises()
    ;(wrapper.vm as any).orders = [buildOrder({ id: 1, orderStatus: 0, orderStatusName: '待支付' })]

    const cancelPromise = (wrapper.vm as any).cancelOrder((wrapper.vm as any).orders[0])
    await flushPromises()

    expect((wrapper.vm as any).orders[0]).toMatchObject({ orderStatus: 4, orderStatusName: '已取消' })

    secondRequest.resolve({
      code: 200,
      data: [buildOrder({ id: 1, orderStatus: 4, orderStatusName: '已取消' })]
    })
    await cancelPromise
    await flushPromises()

    firstRequest.resolve({
      code: 200,
      data: [buildOrder({ id: 1, orderStatus: 0, orderStatusName: '待支付' })]
    })
    await flushPromises()

    expect((wrapper.vm as any).orders[0]).toMatchObject({ orderStatus: 4, orderStatusName: '已取消' })
  })

  it('does not let an in-flight order request overwrite local review success', async () => {
    mockRoute.query.status = '3'
    const firstRequest = createDeferred<{ code: number; data: Order[] }>()
    const secondRequest = createDeferred<{ code: number; data: Order[] }>()
    orderApi.getUserOrders
      .mockImplementationOnce(() => firstRequest.promise)
      .mockImplementationOnce(() => secondRequest.promise)
    reviewApi.createReview.mockResolvedValue({ code: 200 })

    const wrapper = mount(OrdersView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true,
          RouterLink: true,
          ElPagination: true,
          ElDialog: {
            template: '<div><slot /><slot name="footer" /></div>'
          },
          ElInput: true,
          ElCheckbox: true,
          ElButton: {
            template: `<button @click="$emit('click')"><slot /></button>`
          }
        }
      }
    })

    await flushPromises()
    ;(wrapper.vm as any).orders = [buildOrder({ id: 1, orderStatus: 3, orderStatusName: '已完成' })]
    ;(wrapper.vm as any).currentReviewOrder = (wrapper.vm as any).orders[0]
    ;(wrapper.vm as any).currentReviewItem = (wrapper.vm as any).orders[0].items[0]

    const reviewPromise = (wrapper.vm as any).submitReview()
    await flushPromises()

    expect((wrapper.vm as any).orders[0].items[0].reviewed).toBe(true)

    secondRequest.resolve({
      code: 200,
      data: [buildOrder({
        id: 1,
        orderStatus: 3,
        orderStatusName: '已完成',
        items: [{ ...buildOrder().items[0], reviewed: true }]
      })]
    })
    await reviewPromise
    await flushPromises()

    firstRequest.resolve({
      code: 200,
      data: [buildOrder({ id: 1, orderStatus: 3, orderStatusName: '已完成' })]
    })
    await flushPromises()

    expect((wrapper.vm as any).orders[0].items[0].reviewed).toBe(true)
  })

  it('clears review dialog state after review submits successfully', async () => {
    mockRoute.query.status = '3'
    reviewApi.createReview.mockResolvedValue({ code: 200 })

    const wrapper = mount(OrdersView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true,
          RouterLink: true,
          ElPagination: true,
          ElDialog: {
            template: '<div><slot /><slot name="footer" /></div>'
          },
          ElInput: true,
          ElCheckbox: true,
          ElButton: {
            template: `<button @click="$emit('click')"><slot /></button>`
          }
        }
      }
    })

    await flushPromises()
    ;(wrapper.vm as any).orders = [buildOrder({ id: 1, orderStatus: 3, orderStatusName: '已完成' })]
    ;(wrapper.vm as any).currentReviewOrder = (wrapper.vm as any).orders[0]
    ;(wrapper.vm as any).currentReviewItem = (wrapper.vm as any).orders[0].items[0]
    ;(wrapper.vm as any).reviewDialogVisible = true
    ;(wrapper.vm as any).reviewForm.content = '很好'
    ;(wrapper.vm as any).reviewForm.anonymous = true

    await (wrapper.vm as any).submitReview()
    await flushPromises()

    expect((wrapper.vm as any).reviewDialogVisible).toBe(false)
    expect((wrapper.vm as any).currentReviewOrder).toBeNull()
    expect((wrapper.vm as any).currentReviewItem).toBeNull()
    expect((wrapper.vm as any).reviewForm.content).toBe('')
    expect((wrapper.vm as any).reviewForm.anonymous).toBe(false)
    expect((wrapper.vm as any).reviewForm.rating).toBe(5)
  })
})
