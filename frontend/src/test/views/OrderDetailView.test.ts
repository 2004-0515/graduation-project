import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Order } from '@/types'

const { mockPush, mockBack, mockRoute, orderApi, messages } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockBack: vi.fn(),
  mockRoute: { params: { id: '1' } },
  orderApi: {
    getOrderById: vi.fn(),
    cancelOrder: vi.fn(),
    requestCancelOrder: vi.fn(),
    confirmReceive: vi.fn()
  },
  messages: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn()
  }
}))
const debugError = vi.hoisted(() => vi.fn())

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush, back: mockBack }),
  useRoute: () => mockRoute
}))

vi.mock('element-plus', () => ({
  ElMessage: messages
}))

vi.mock('@/api/orderApi', () => ({
  default: orderApi
}))

vi.mock('@/utils/debug', () => ({
  debugError
}))

vi.mock('@/api/fileApi', () => ({
  default: {
    getImageUrl: vi.fn(() => '/img.png')
  }
}))

import OrderDetailView from '@/views/OrderDetailView.vue'

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
    username: 'testuser',
    totalAmount: 100,
    paymentMethod: 1,
    paymentMethodName: '微信支付',
    paymentStatus: 0,
    paymentStatusName: '未支付',
    orderStatus: 0,
    orderStatusName: '待付款',
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
    createdTime: '2026-05-07T10:00:00',
    updatedTime: '2026-05-07T10:00:00',
    ...overrides
  }
}

describe('OrderDetailView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows pending payment actions and routes to payment page', async () => {
    orderApi.getOrderById.mockResolvedValue({ code: 200, data: buildOrder() })

    const wrapper = mount(OrderDetailView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true
        }
      }
    })

    await flushPromises()

    expect(wrapper.text()).toContain('立即支付')
    expect(wrapper.text()).toContain('取消订单')

    await wrapper.findAll('button').find((button) => button.text() === '立即支付')!.trigger('click')
    expect(mockPush).toHaveBeenCalledWith('/payment/1')
  })

  it('refreshes order state after requesting cancel', async () => {
    orderApi.getOrderById
      .mockResolvedValueOnce({
        code: 200,
        data: buildOrder({
          orderStatus: 1,
          orderStatusName: '待发货',
          paymentStatus: 1,
          paymentStatusName: '已支付'
        })
      })
      .mockResolvedValueOnce({
        code: 200,
        data: buildOrder({
          orderStatus: 6,
          orderStatusName: '申请取消中',
          paymentStatus: 1,
          paymentStatusName: '已支付'
        })
      })
    orderApi.requestCancelOrder.mockResolvedValue({ code: 200 })

    const wrapper = mount(OrderDetailView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true
        }
      }
    })

    await flushPromises()
    await wrapper.findAll('button').find((button) => button.text() === '申请取消')!.trigger('click')
    await flushPromises()

    expect(orderApi.requestCancelOrder).toHaveBeenCalledWith(1)
    expect(orderApi.getOrderById).toHaveBeenCalledTimes(2)
    expect(wrapper.text()).toContain('申请取消中')
  })

  it('shows backend chinese message when confirm receive fails', async () => {
    orderApi.getOrderById.mockResolvedValue({
      code: 200,
      data: buildOrder({
        orderStatus: 2,
        orderStatusName: '待收货',
        paymentStatus: 1,
        paymentStatusName: '已支付'
      })
    })
    orderApi.confirmReceive.mockRejectedValue({
      response: { data: { message: '当前订单状态不允许确认收货' } }
    })

    const wrapper = mount(OrderDetailView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true
        }
      }
    })

    await flushPromises()
    await wrapper.findAll('button').find((button) => button.text() === '确认收货')!.trigger('click')
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('当前订单状态不允许确认收货')
    expect(debugError).toHaveBeenCalledWith(
      '确认收货失败:',
      expect.objectContaining({ response: { data: { message: '当前订单状态不允许确认收货' } } })
    )
  })

  it('shows backend message when cancel order returns non-200 payload', async () => {
    orderApi.getOrderById.mockResolvedValue({ code: 200, data: buildOrder() })
    orderApi.cancelOrder.mockResolvedValue({ code: 500, message: '订单取消失败' })

    const wrapper = mount(OrderDetailView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true
        }
      }
    })

    await flushPromises()
    await wrapper.findAll('button').find((button) => button.text() === '取消订单')!.trigger('click')
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('订单取消失败')
    expect(debugError).toHaveBeenCalledWith('取消订单失败:', '订单取消失败')
  })

  it('shows backend message when request cancel returns non-200 payload', async () => {
    orderApi.getOrderById.mockResolvedValue({
      code: 200,
      data: buildOrder({
        orderStatus: 1,
        orderStatusName: '待发货',
        paymentStatus: 1,
        paymentStatusName: '已支付'
      })
    })
    orderApi.requestCancelOrder.mockResolvedValue({ code: 500, message: '申请取消失败' })

    const wrapper = mount(OrderDetailView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true
        }
      }
    })

    await flushPromises()
    await wrapper.findAll('button').find((button) => button.text() === '申请取消')!.trigger('click')
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('申请取消失败')
    expect(debugError).toHaveBeenCalledWith('申请取消订单失败:', '申请取消失败')
  })

  it('logs and navigates back when initial load fails', async () => {
    orderApi.getOrderById.mockRejectedValue({
      response: { data: { message: '订单不存在' } }
    })

    mount(OrderDetailView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true
        }
      }
    })

    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('订单不存在')
    expect(debugError).toHaveBeenCalledWith(
      '初始化订单详情失败:',
      expect.objectContaining({ response: { data: { message: '订单不存在' } } })
    )
    expect(mockBack).toHaveBeenCalled()
  })

  it('logs backend message when confirm receive returns non-200 payload', async () => {
    orderApi.getOrderById.mockResolvedValue({
      code: 200,
      data: buildOrder({
        orderStatus: 2,
        orderStatusName: '待收货',
        paymentStatus: 1,
        paymentStatusName: '已支付'
      })
    })
    orderApi.confirmReceive.mockResolvedValue({ code: 500, message: '确认收货失败' })

    const wrapper = mount(OrderDetailView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true
        }
      }
    })

    await flushPromises()
    await wrapper.findAll('button').find((button) => button.text() === '确认收货')!.trigger('click')
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('确认收货失败')
    expect(debugError).toHaveBeenCalledWith('确认收货失败:', '确认收货失败')
  })

  it('keeps cancel success when refreshing order detail fails afterward', async () => {
    orderApi.getOrderById
      .mockResolvedValueOnce({ code: 200, data: buildOrder() })
      .mockRejectedValueOnce(new Error('刷新失败'))
    orderApi.cancelOrder.mockResolvedValue({ code: 200 })

    const wrapper = mount(OrderDetailView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true
        }
      }
    })

    await flushPromises()
    await wrapper.findAll('button').find((button) => button.text() === '取消订单')!.trigger('click')
    await flushPromises()

    expect(messages.success).toHaveBeenCalledWith('订单已取消')
    expect(messages.error).not.toHaveBeenCalledWith('刷新失败')
    expect(debugError).toHaveBeenCalledWith('取消订单后刷新订单详情失败:', expect.any(Error))
  })

  it('keeps request-cancel success when refreshing order detail fails afterward', async () => {
    orderApi.getOrderById
      .mockResolvedValueOnce({
        code: 200,
        data: buildOrder({
          orderStatus: 1,
          orderStatusName: '待发货',
          paymentStatus: 1,
          paymentStatusName: '已支付'
        })
      })
      .mockRejectedValueOnce(new Error('刷新失败'))
    orderApi.requestCancelOrder.mockResolvedValue({ code: 200 })

    const wrapper = mount(OrderDetailView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true
        }
      }
    })

    await flushPromises()
    await wrapper.findAll('button').find((button) => button.text() === '申请取消')!.trigger('click')
    await flushPromises()

    expect(messages.success).toHaveBeenCalledWith('取消申请已提交')
    expect(messages.error).not.toHaveBeenCalledWith('刷新失败')
    expect(debugError).toHaveBeenCalledWith('提交取消申请后刷新订单详情失败:', expect.any(Error))
  })

  it('keeps confirm-receive success when refreshing order detail fails afterward', async () => {
    orderApi.getOrderById
      .mockResolvedValueOnce({
        code: 200,
        data: buildOrder({
          orderStatus: 2,
          orderStatusName: '待收货',
          paymentStatus: 1,
          paymentStatusName: '已支付'
        })
      })
      .mockRejectedValueOnce(new Error('刷新失败'))
    orderApi.confirmReceive.mockResolvedValue({ code: 200 })

    const wrapper = mount(OrderDetailView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true
        }
      }
    })

    await flushPromises()
    await wrapper.findAll('button').find((button) => button.text() === '确认收货')!.trigger('click')
    await flushPromises()

    expect(messages.success).toHaveBeenCalledWith('已确认收货')
    expect(messages.error).not.toHaveBeenCalledWith('刷新失败')
    expect(debugError).toHaveBeenCalledWith('确认收货后刷新订单详情失败:', expect.any(Error))
  })

  it('ignores stale order detail responses when a newer refresh finishes first', async () => {
    const firstRequest = createDeferred<any>()
    const secondRequest = createDeferred<any>()

    orderApi.getOrderById
      .mockImplementationOnce(() => firstRequest.promise)
      .mockImplementationOnce(() => secondRequest.promise)

    const wrapper = mount(OrderDetailView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true
        }
      }
    })

    await flushPromises()

    const vm = wrapper.vm as unknown as { fetchOrder: () => Promise<void> }
    const refetchPromise = vm.fetchOrder()
    await flushPromises()

    secondRequest.resolve({
      code: 200,
      data: buildOrder({
        orderNo: 'ORD-NEW',
        orderStatus: 6,
        orderStatusName: '申请取消中',
        paymentStatus: 1,
        paymentStatusName: '已支付'
      })
    })
    await refetchPromise
    await flushPromises()

    expect(wrapper.text()).toContain('ORD-NEW')
    expect(wrapper.text()).toContain('申请取消中')

    firstRequest.resolve({
      code: 200,
      data: buildOrder({
        orderNo: 'ORD-OLD',
        orderStatus: 1,
        orderStatusName: '待发货',
        paymentStatus: 1,
        paymentStatusName: '已支付'
      })
    })
    await flushPromises()

    expect(wrapper.text()).toContain('ORD-NEW')
    expect(wrapper.text()).not.toContain('ORD-OLD')
  })

  it('reloads order detail when route order id changes', async () => {
    orderApi.getOrderById
      .mockResolvedValueOnce({ code: 200, data: buildOrder({ id: 1, orderNo: 'ORD-1' }) })
      .mockResolvedValueOnce({
        code: 200,
        data: buildOrder({
          id: 2,
          orderNo: 'ORD-2',
          orderStatus: 2,
          orderStatusName: '待收货',
          paymentStatus: 1,
          paymentStatusName: '已支付'
        })
      })

    const wrapper = mount(OrderDetailView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true
        }
      }
    })

    await flushPromises()
    mockRoute.params.id = '2'

    await (wrapper.vm as any).reloadOrderDetailFromRoute()
    await flushPromises()

    expect(orderApi.getOrderById).toHaveBeenNthCalledWith(1, 1)
    expect(orderApi.getOrderById).toHaveBeenNthCalledWith(2, 2)
    expect(wrapper.text()).toContain('ORD-2')
    expect(wrapper.text()).toContain('待收货')
  })

  it('does not let an in-flight order detail request overwrite local cancel success', async () => {
    const firstRequest = createDeferred<any>()
    const secondRequest = createDeferred<any>()

    orderApi.getOrderById
      .mockImplementationOnce(() => firstRequest.promise)
      .mockImplementationOnce(() => secondRequest.promise)
    orderApi.cancelOrder.mockResolvedValue({ code: 200 })

    const wrapper = mount(OrderDetailView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true
        }
      }
    })

    await flushPromises()
    ;(wrapper.vm as any).order = buildOrder()

    const cancelPromise = (wrapper.vm as any).cancelOrder()
    await flushPromises()

    expect((wrapper.vm as any).order).toMatchObject({ orderStatus: 4, orderStatusName: '已取消' })

    secondRequest.resolve({ code: 200, data: buildOrder({ orderStatus: 4, orderStatusName: '已取消' }) })
    await cancelPromise
    await flushPromises()

    firstRequest.resolve({ code: 200, data: buildOrder({ orderStatus: 0, orderStatusName: '待付款' }) })
    await flushPromises()

    expect((wrapper.vm as any).order).toMatchObject({ orderStatus: 4, orderStatusName: '已取消' })
  })

  it('does not let an in-flight order detail request overwrite local confirm-receive success', async () => {
    const firstRequest = createDeferred<any>()
    const secondRequest = createDeferred<any>()

    orderApi.getOrderById
      .mockImplementationOnce(() => firstRequest.promise)
      .mockImplementationOnce(() => secondRequest.promise)
    orderApi.confirmReceive.mockResolvedValue({ code: 200 })

    const wrapper = mount(OrderDetailView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true
        }
      }
    })

    await flushPromises()
    ;(wrapper.vm as any).order = buildOrder({
      orderStatus: 2,
      orderStatusName: '待收货',
      paymentStatus: 1,
      paymentStatusName: '已支付'
    })

    const confirmPromise = (wrapper.vm as any).confirmReceive()
    await flushPromises()

    expect((wrapper.vm as any).order).toMatchObject({ orderStatus: 3, orderStatusName: '已完成' })

    secondRequest.resolve({
      code: 200,
      data: buildOrder({
        orderStatus: 3,
        orderStatusName: '已完成',
        paymentStatus: 1,
        paymentStatusName: '已支付'
      })
    })
    await confirmPromise
    await flushPromises()

    firstRequest.resolve({
      code: 200,
      data: buildOrder({
        orderStatus: 2,
        orderStatusName: '待收货',
        paymentStatus: 1,
        paymentStatusName: '已支付'
      })
    })
    await flushPromises()

    expect((wrapper.vm as any).order).toMatchObject({ orderStatus: 3, orderStatusName: '已完成' })
  })
})
