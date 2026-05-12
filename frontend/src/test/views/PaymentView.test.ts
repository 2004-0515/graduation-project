import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Order } from '@/types'

const { mockPush, mockBack, mockRoute, orderApi, messages } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockBack: vi.fn(),
  mockRoute: { params: { id: '1' } },
  orderApi: {
    getOrderById: vi.fn(),
    payOrder: vi.fn()
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

import PaymentView from '@/views/PaymentView.vue'

const deferred = <T>() => {
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

describe('PaymentView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  it('redirects non-pending orders back to detail page', async () => {
    orderApi.getOrderById.mockResolvedValue({
      code: 200,
      data: buildOrder({
        orderStatus: 1,
        orderStatusName: '待发货',
        paymentStatus: 1,
        paymentStatusName: '已支付'
      })
    })

    mount(PaymentView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true,
          RouterLink: true
        }
      }
    })

    await flushPromises()

    expect(messages.warning).toHaveBeenCalledWith('该订单当前不是待支付状态')
    expect(mockPush).toHaveBeenCalledWith('/order/1')
  })

  it('refreshes order from backend after simulated payment succeeds', async () => {
    orderApi.getOrderById
      .mockResolvedValueOnce({
        code: 200,
        data: buildOrder()
      })
      .mockResolvedValueOnce({
        code: 200,
        data: buildOrder({
          orderStatus: 1,
          orderStatusName: '待发货',
          paymentStatus: 1,
          paymentStatusName: '已支付',
          paymentTime: '2026-05-07T10:05:00',
          payAmount: 88
        })
      })
    orderApi.payOrder.mockResolvedValue({
      code: 200,
      data: { id: 1 }
    })

    const wrapper = mount(PaymentView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true,
          RouterLink: true
        }
      }
    })

    await flushPromises()
    await wrapper.findAll('button').find((button) => button.text() === '确认支付')!.trigger('click')
    await wrapper.findAll('button').find((button) => button.text() === '模拟支付')!.trigger('click')
    await vi.advanceTimersByTimeAsync(2000)
    await flushPromises()

    expect(orderApi.payOrder).toHaveBeenCalledWith(1, 1)
    expect(orderApi.getOrderById).toHaveBeenCalledTimes(2)
    expect(wrapper.text()).toContain('支付成功')
    expect(wrapper.text()).toContain('查看订单')
  })

  it('returns to scan state when payment fails', async () => {
    orderApi.getOrderById.mockResolvedValue({
      code: 200,
      data: buildOrder()
    })
    orderApi.payOrder.mockRejectedValue({
      response: { data: { message: '库存不足' } }
    })

    const wrapper = mount(PaymentView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true,
          RouterLink: true
        }
      }
    })

    await flushPromises()
    await wrapper.findAll('button').find((button) => button.text() === '确认支付')!.trigger('click')
    await wrapper.findAll('button').find((button) => button.text() === '模拟支付')!.trigger('click')
    await vi.advanceTimersByTimeAsync(2000)
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('库存不足')
    expect(wrapper.text()).toContain('模拟支付')
  })

  it('shows backend message when loading order returns non-200 payload', async () => {
    orderApi.getOrderById.mockResolvedValue({
      code: 500,
      message: '订单详情加载失败'
    })

    mount(PaymentView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true,
          RouterLink: true
        }
      }
    })

    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('订单详情加载失败')
    expect(debugError).toHaveBeenCalledWith('获取待支付订单详情失败:', '订单详情加载失败')
  })

  it('returns to scan state when payment returns non-200 payload', async () => {
    orderApi.getOrderById.mockResolvedValue({
      code: 200,
      data: buildOrder()
    })
    orderApi.payOrder.mockResolvedValue({
      code: 500,
      message: '支付处理失败'
    })

    const wrapper = mount(PaymentView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true,
          RouterLink: true
        }
      }
    })

    await flushPromises()
    await wrapper.findAll('button').find((button) => button.text() === '确认支付')!.trigger('click')
    await wrapper.findAll('button').find((button) => button.text() === '模拟支付')!.trigger('click')
    await vi.advanceTimersByTimeAsync(2000)
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('支付处理失败')
    expect(debugError).toHaveBeenCalledWith('订单支付失败:', '支付处理失败')
    expect(wrapper.text()).toContain('模拟支付')
  })

  it('logs and shows backend message when loading order throws', async () => {
    orderApi.getOrderById.mockRejectedValue({
      response: { data: { message: '订单接口不可用' } }
    })

    mount(PaymentView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true,
          RouterLink: true
        }
      }
    })

    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('订单接口不可用')
    expect(debugError).toHaveBeenCalledWith(
      '获取待支付订单详情失败:',
      expect.objectContaining({ response: { data: { message: '订单接口不可用' } } })
    )
  })

  it('keeps newer order detail when older request resolves later', async () => {
    const first = deferred<any>()
    const second = deferred<any>()
    orderApi.getOrderById
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)

    const wrapper = mount(PaymentView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true,
          RouterLink: true
        }
      }
    })

    await flushPromises()

    const vm = wrapper.vm as unknown as { fetchOrder: (options?: { redirectOnNonPending?: boolean }) => Promise<void> }
    const secondFetch = vm.fetchOrder({ redirectOnNonPending: false })
    await flushPromises()

    second.resolve({
      code: 200,
      data: buildOrder({ orderNo: 'ORD-NEW' })
    })
    await secondFetch
    await flushPromises()

    expect((wrapper.vm as any).order.orderNo).toBe('ORD-NEW')

    first.resolve({
      code: 200,
      data: buildOrder({ orderNo: 'ORD-OLD' })
    })
    await flushPromises()

    expect((wrapper.vm as any).order.orderNo).toBe('ORD-NEW')
  })

  it('reloads payment order when route order id changes', async () => {
    orderApi.getOrderById
      .mockResolvedValueOnce({
        code: 200,
        data: buildOrder({ id: 1, orderNo: 'ORD-1' })
      })
      .mockResolvedValueOnce({
        code: 200,
        data: buildOrder({ id: 2, orderNo: 'ORD-2' })
      })

    const wrapper = mount(PaymentView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true,
          RouterLink: true
        }
      }
    })

    await flushPromises()
    mockRoute.params.id = '2'

    await (wrapper.vm as any).reloadPaymentOrderFromRoute()
    await flushPromises()

    expect(orderApi.getOrderById).toHaveBeenNthCalledWith(1, 1)
    expect(orderApi.getOrderById).toHaveBeenNthCalledWith(2, 2)
    expect((wrapper.vm as any).order.orderNo).toBe('ORD-2')
  })

  it('keeps payment success modal when order refresh fails after pay succeeds', async () => {
    orderApi.getOrderById
      .mockResolvedValueOnce({
        code: 200,
        data: buildOrder()
      })
      .mockRejectedValueOnce(new Error('refresh failed'))
    orderApi.payOrder.mockResolvedValue({
      code: 200,
      data: { id: 1 }
    })

    const wrapper = mount(PaymentView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true,
          RouterLink: true
        }
      }
    })

    await flushPromises()
    await wrapper.findAll('button').find((button) => button.text() === '确认支付')!.trigger('click')
    await wrapper.findAll('button').find((button) => button.text() === '模拟支付')!.trigger('click')
    await vi.advanceTimersByTimeAsync(2000)
    await flushPromises()

    expect(messages.error).not.toHaveBeenCalledWith('refresh failed')
    expect((wrapper.vm as any).payStep).toBe('success')
    expect((wrapper.vm as any).isPaid).toBe(true)
    expect(debugError).toHaveBeenCalledWith('获取待支付订单详情失败:', expect.any(Error))
  })
})
