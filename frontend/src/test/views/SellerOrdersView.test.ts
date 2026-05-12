import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ApiResponse, SellerOrderItem } from '@/types'

const { axiosMock, messages, messageBox, debugError } = vi.hoisted(() => ({
  axiosMock: {
    get: vi.fn(),
    put: vi.fn()
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

vi.mock('@/utils/axios', () => ({
  default: axiosMock
}))

vi.mock('@/utils/debug', () => ({
  debugError
}))

vi.mock('@/api/fileApi', () => ({
  default: {
    getImageUrl: vi.fn(() => '/img.png')
  }
}))

import SellerOrdersView from '@/views/SellerOrdersView.vue'

function createDeferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

function buildSellerItem(overrides: Partial<SellerOrderItem> = {}): SellerOrderItem {
  return {
    id: 11,
    orderId: 1,
    productId: 100,
    productName: '商品A',
    productImage: '/a.png',
    price: 99,
    quantity: 1,
    shipStatus: 0,
    orderNo: 'ORD-1',
    orderStatus: 1,
    buyerName: 'buyer',
    createdTime: '2026-05-07T10:00:00',
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
    ...overrides
  }
}

describe('SellerOrdersView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    messageBox.confirm.mockResolvedValue(undefined)
  })

  it('loads seller items and pending count on mount', async () => {
    axiosMock.get
      .mockResolvedValueOnce({ code: 200, data: [buildSellerItem()] } satisfies ApiResponse<SellerOrderItem[]>)
      .mockResolvedValueOnce({ code: 200, data: 3 } satisfies ApiResponse<number>)

    const wrapper = mount(SellerOrdersView, {
      global: {
        directives: {
          loading: {}
        },
        stubs: {
          Navbar: true,
          Footer: true,
          ElEmpty: true,
          ElImage: true,
          ElButton: true,
          ElRadioGroup: true,
          ElRadioButton: true
        }
      }
    })

    await flushPromises()

    expect(axiosMock.get).toHaveBeenNthCalledWith(1, '/orders/seller/items', { params: {} })
    expect(axiosMock.get).toHaveBeenNthCalledWith(2, '/orders/seller/pending/count')
    expect(wrapper.text()).toContain('订单号: ORD-1')
  })

  it('passes shipStatus filter to seller items query', async () => {
    axiosMock.get
      .mockResolvedValueOnce({ code: 200, data: [] } satisfies ApiResponse<SellerOrderItem[]>)
      .mockResolvedValueOnce({ code: 200, data: 0 } satisfies ApiResponse<number>)
      .mockResolvedValueOnce({ code: 200, data: [] } satisfies ApiResponse<SellerOrderItem[]>)

    const wrapper = mount(SellerOrdersView, {
      global: {
        directives: {
          loading: {}
        },
        stubs: {
          Navbar: true,
          Footer: true,
          ElEmpty: true,
          ElImage: true,
          ElButton: true,
          ElRadioGroup: true,
          ElRadioButton: true
        }
      }
    })

    await flushPromises()

    ;(wrapper.vm as unknown as { filterStatus: number | null }).filterStatus = 0
    await (wrapper.vm as unknown as { handleFilterChange: () => void }).handleFilterChange()
    await flushPromises()

    expect(axiosMock.get).toHaveBeenLastCalledWith('/orders/seller/items', { params: { shipStatus: 0 } })
  })

  it('ships item and refreshes list and count', async () => {
    axiosMock.get
      .mockResolvedValueOnce({ code: 200, data: [buildSellerItem()] } satisfies ApiResponse<SellerOrderItem[]>)
      .mockResolvedValueOnce({ code: 200, data: 1 } satisfies ApiResponse<number>)
      .mockResolvedValueOnce({ code: 200, data: [buildSellerItem({ shipStatus: 1 })] } satisfies ApiResponse<SellerOrderItem[]>)
      .mockResolvedValueOnce({ code: 200, data: 0 } satisfies ApiResponse<number>)
    axiosMock.put.mockResolvedValue({ code: 200 })

    const wrapper = mount(SellerOrdersView, {
      global: {
        directives: {
          loading: {}
        },
        stubs: {
          Navbar: true,
          Footer: true,
          ElEmpty: true,
          ElImage: true,
          ElButton: true,
          ElRadioGroup: true,
          ElRadioButton: true
        }
      }
    })

    await flushPromises()
    await (wrapper.vm as unknown as { handleShip: (item: SellerOrderItem) => Promise<void> }).handleShip(buildSellerItem())
    await flushPromises()

    expect(axiosMock.put).toHaveBeenCalledWith('/orders/seller/items/11/ship')
    expect(messages.success).toHaveBeenCalledWith('发货成功')
    expect(axiosMock.get).toHaveBeenLastCalledWith('/orders/seller/pending/count')
  })

  it('keeps shipping success when refreshing seller data fails afterward', async () => {
    axiosMock.get
      .mockResolvedValueOnce({ code: 200, data: [buildSellerItem()] } satisfies ApiResponse<SellerOrderItem[]>)
      .mockResolvedValueOnce({ code: 200, data: 1 } satisfies ApiResponse<number>)
      .mockRejectedValue(new Error('刷新失败'))
    axiosMock.put.mockResolvedValue({ code: 200 })

    const wrapper = mount(SellerOrdersView, {
      global: {
        directives: {
          loading: {}
        },
        stubs: {
          Navbar: true,
          Footer: true,
          ElEmpty: true,
          ElImage: true,
          ElButton: true,
          ElRadioGroup: true,
          ElRadioButton: true
        }
      }
    })

    await flushPromises()
    await (wrapper.vm as unknown as { handleShip: (item: SellerOrderItem) => Promise<void> }).handleShip(buildSellerItem())
    await flushPromises()

    expect(messages.success).toHaveBeenCalledWith('发货成功')
    expect(messages.error).not.toHaveBeenCalledWith('刷新失败')
    expect(debugError).toHaveBeenCalledWith('获取卖家订单项失败:', expect.any(Error))
  })

  it('removes shipped item from pending filter locally when refresh fails afterward', async () => {
    axiosMock.get
      .mockResolvedValueOnce({ code: 200, data: [buildSellerItem()] } satisfies ApiResponse<SellerOrderItem[]>)
      .mockResolvedValueOnce({ code: 200, data: 1 } satisfies ApiResponse<number>)
      .mockRejectedValue(new Error('刷新失败'))
    axiosMock.put.mockResolvedValue({ code: 200 })

    const wrapper = mount(SellerOrdersView, {
      global: {
        directives: {
          loading: {}
        },
        stubs: {
          Navbar: true,
          Footer: true,
          ElEmpty: true,
          ElImage: true,
          ElButton: true,
          ElRadioGroup: true,
          ElRadioButton: true
        }
      }
    })

    await flushPromises()
    ;(wrapper.vm as any).filterStatus = 0
    ;(wrapper.vm as any).orderItems = [buildSellerItem()]

    await (wrapper.vm as unknown as { handleShip: (item: SellerOrderItem) => Promise<void> }).handleShip(buildSellerItem())
    await flushPromises()

    expect(messages.success).toHaveBeenCalledWith('发货成功')
    expect((wrapper.vm as any).orderItems).toEqual([])
  })

  it('does not show an error when seller cancels shipping confirmation', async () => {
    axiosMock.get
      .mockResolvedValueOnce({ code: 200, data: [buildSellerItem()] } satisfies ApiResponse<SellerOrderItem[]>)
      .mockResolvedValueOnce({ code: 200, data: 1 } satisfies ApiResponse<number>)
    messageBox.confirm.mockRejectedValue('cancel')

    const wrapper = mount(SellerOrdersView, {
      global: {
        directives: {
          loading: {}
        },
        stubs: {
          Navbar: true,
          Footer: true,
          ElEmpty: true,
          ElImage: true,
          ElButton: true,
          ElRadioGroup: true,
          ElRadioButton: true
        }
      }
    })

    await flushPromises()
    await (wrapper.vm as unknown as { handleShip: (item: SellerOrderItem) => Promise<void> }).handleShip(buildSellerItem())
    await flushPromises()

    expect(axiosMock.put).not.toHaveBeenCalled()
    expect(messages.error).not.toHaveBeenCalled()
  })

  it('shows an error when shipping request fails', async () => {
    axiosMock.get
      .mockResolvedValueOnce({ code: 200, data: [buildSellerItem()] } satisfies ApiResponse<SellerOrderItem[]>)
      .mockResolvedValueOnce({ code: 200, data: 1 } satisfies ApiResponse<number>)
    axiosMock.put.mockRejectedValue({
      response: { data: { message: '当前订单状态不允许发货' } }
    })

    const wrapper = mount(SellerOrdersView, {
      global: {
        directives: {
          loading: {}
        },
        stubs: {
          Navbar: true,
          Footer: true,
          ElEmpty: true,
          ElImage: true,
          ElButton: true,
          ElRadioGroup: true,
          ElRadioButton: true
        }
      }
    })

    await flushPromises()
    await (wrapper.vm as unknown as { handleShip: (item: SellerOrderItem) => Promise<void> }).handleShip(buildSellerItem())
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('当前订单状态不允许发货')
    expect(debugError).toHaveBeenCalled()
  })

  it('shows an error when loading seller items fails', async () => {
    axiosMock.get
      .mockRejectedValueOnce({ response: { data: { message: '请先登录' } } })
      .mockResolvedValueOnce({ code: 200, data: 0 } satisfies ApiResponse<number>)

    mount(SellerOrdersView, {
      global: {
        directives: {
          loading: {}
        },
        stubs: {
          Navbar: true,
          Footer: true,
          ElEmpty: true,
          ElImage: true,
          ElButton: true,
          ElRadioGroup: true,
          ElRadioButton: true
        }
      }
    })

    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('请先登录')
    expect(debugError).toHaveBeenCalled()
  })

  it('shows backend message when loading seller items returns non-200 payload', async () => {
    axiosMock.get
      .mockResolvedValueOnce({ code: 500, message: '卖家订单列表加载失败' })
      .mockResolvedValueOnce({ code: 200, data: 0 } satisfies ApiResponse<number>)

    mount(SellerOrdersView, {
      global: {
        directives: { loading: {} },
        stubs: {
          Navbar: true,
          Footer: true,
          ElEmpty: true,
          ElImage: true,
          ElButton: true,
          ElRadioGroup: true,
          ElRadioButton: true
        }
      }
    })

    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('卖家订单列表加载失败')
    expect(debugError).toHaveBeenCalledWith('获取卖家订单项失败:', '卖家订单列表加载失败')
  })

  it('shows backend message when shipping returns non-200 payload', async () => {
    axiosMock.get
      .mockResolvedValueOnce({ code: 200, data: [buildSellerItem()] } satisfies ApiResponse<SellerOrderItem[]>)
      .mockResolvedValueOnce({ code: 200, data: 1 } satisfies ApiResponse<number>)
    axiosMock.put.mockResolvedValue({ code: 500, message: '订单项发货失败' })

    const wrapper = mount(SellerOrdersView, {
      global: {
        directives: { loading: {} },
        stubs: {
          Navbar: true,
          Footer: true,
          ElEmpty: true,
          ElImage: true,
          ElButton: true,
          ElRadioGroup: true,
          ElRadioButton: true
        }
      }
    })

    await flushPromises()
    await (wrapper.vm as unknown as { handleShip: (item: SellerOrderItem) => Promise<void> }).handleShip(buildSellerItem())
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('订单项发货失败')
    expect(debugError).toHaveBeenCalledWith('卖家发货失败:', '订单项发货失败')
  })

  it('ignores stale seller item responses when filter changes quickly', async () => {
    const firstItemsRequest = createDeferred<ApiResponse<SellerOrderItem[]>>()
    const secondItemsRequest = createDeferred<ApiResponse<SellerOrderItem[]>>()

    axiosMock.get
      .mockImplementationOnce(() => firstItemsRequest.promise)
      .mockResolvedValueOnce({ code: 200, data: 0 } satisfies ApiResponse<number>)
      .mockImplementationOnce(() => secondItemsRequest.promise)

    const wrapper = mount(SellerOrdersView, {
      global: {
        directives: { loading: {} },
        stubs: {
          Navbar: true,
          Footer: true,
          ElEmpty: true,
          ElImage: true,
          ElButton: true,
          ElRadioGroup: true,
          ElRadioButton: true
        }
      }
    })

    await flushPromises()

    ;(wrapper.vm as unknown as { filterStatus: number | null }).filterStatus = 0
    const refetchPromise = (wrapper.vm as unknown as { handleFilterChange: () => void }).handleFilterChange()
    await flushPromises()

    secondItemsRequest.resolve({ code: 200, data: [buildSellerItem({ id: 22, orderNo: 'ORD-NEW' })] })
    await refetchPromise
    await flushPromises()

    expect(wrapper.text()).toContain('订单号: ORD-NEW')

    firstItemsRequest.resolve({ code: 200, data: [buildSellerItem({ id: 11, orderNo: 'ORD-OLD' })] })
    await flushPromises()

    expect(wrapper.text()).toContain('订单号: ORD-NEW')
    expect(wrapper.text()).not.toContain('订单号: ORD-OLD')
  })

  it('does not let in-flight seller requests overwrite local ship success', async () => {
    const firstItemsRequest = createDeferred<ApiResponse<SellerOrderItem[]>>()
    const secondItemsRequest = createDeferred<ApiResponse<SellerOrderItem[]>>()

    axiosMock.get
      .mockImplementationOnce(() => firstItemsRequest.promise)
      .mockResolvedValueOnce({ code: 200, data: 1 } satisfies ApiResponse<number>)
      .mockImplementationOnce(() => secondItemsRequest.promise)
      .mockResolvedValueOnce({ code: 200, data: 0 } satisfies ApiResponse<number>)
    axiosMock.put.mockResolvedValue({ code: 200 })

    const wrapper = mount(SellerOrdersView, {
      global: {
        directives: { loading: {} },
        stubs: {
          Navbar: true,
          Footer: true,
          ElEmpty: true,
          ElImage: true,
          ElButton: true,
          ElRadioGroup: true,
          ElRadioButton: true
        }
      }
    })

    await flushPromises()
    ;(wrapper.vm as any).orderItems = [buildSellerItem({ id: 11, shipStatus: 0 })]
    ;(wrapper.vm as any).pendingCount = 1

    const shipPromise = (wrapper.vm as any).handleShip(buildSellerItem({ id: 11, shipStatus: 0 }))
    await flushPromises()

    expect((wrapper.vm as any).orderItems[0].shipStatus).toBe(1)
    expect((wrapper.vm as any).pendingCount).toBe(0)

    secondItemsRequest.resolve({ code: 200, data: [buildSellerItem({ id: 11, shipStatus: 1 })] })
    await shipPromise
    await flushPromises()

    firstItemsRequest.resolve({ code: 200, data: [buildSellerItem({ id: 11, shipStatus: 0 })] })
    await flushPromises()

    expect((wrapper.vm as any).orderItems[0].shipStatus).toBe(1)
    expect((wrapper.vm as any).pendingCount).toBe(0)
  })
})
