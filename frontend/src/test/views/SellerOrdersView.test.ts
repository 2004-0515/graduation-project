import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ElMessage, ElMessageBox } from 'element-plus'
import orderApi from '@/api/orderApi'
import fileApi from '@/api/fileApi'
import type { ApiResponse, SellerOrderItem } from '@/types'
import * as debugModule from '@/utils/debug'
import SellerOrdersView from '@/views/SellerOrdersView.vue'

const messages = {
  success: vi.spyOn(ElMessage, 'success').mockImplementation(() => '' as any),
  error: vi.spyOn(ElMessage, 'error').mockImplementation(() => '' as any),
  warning: vi.spyOn(ElMessage, 'warning').mockImplementation(() => '' as any)
}

const messageBox = {
  confirm: vi.spyOn(ElMessageBox, 'confirm')
}

vi.spyOn(orderApi, 'getSellerOrderItems')
vi.spyOn(orderApi, 'getSellerPendingCount')
vi.spyOn(orderApi, 'shipSellerOrderItem')
vi.spyOn(fileApi, 'getImageUrl')
const debugError = vi.spyOn(debugModule, 'debugError').mockImplementation(() => {})

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
    messageBox.confirm.mockResolvedValue('confirm' as any)
    orderApi.getSellerOrderItems.mockResolvedValue({ code: 200, data: [] } as ApiResponse<SellerOrderItem[]>)
    orderApi.getSellerPendingCount.mockResolvedValue({ code: 200, data: 0 } as ApiResponse<number>)
    orderApi.shipSellerOrderItem.mockResolvedValue({ code: 200 } as any)
    fileApi.getImageUrl.mockReturnValue('/img.png')
    debugError.mockImplementation(() => {})
  })

  it('loads seller items and pending count on mount', async () => {
    orderApi.getSellerOrderItems.mockResolvedValue({ code: 200, data: [buildSellerItem()] } as ApiResponse<SellerOrderItem[]>)
    orderApi.getSellerPendingCount.mockResolvedValue({ code: 200, data: 3 } as ApiResponse<number>)

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

    expect(orderApi.getSellerOrderItems).toHaveBeenCalledWith(undefined)
    expect(orderApi.getSellerPendingCount).toHaveBeenCalled()
    expect(wrapper.text()).toContain('订单号: ORD-1')
  })

  it('passes shipStatus filter to seller items query', async () => {
    orderApi.getSellerOrderItems
      .mockResolvedValueOnce({ code: 200, message: 'success', success: true, data: [] as SellerOrderItem[] } as ApiResponse<SellerOrderItem[]>)
      .mockResolvedValueOnce({ code: 200, message: 'success', success: true, data: [] as SellerOrderItem[] } as ApiResponse<SellerOrderItem[]>)
    orderApi.getSellerPendingCount.mockResolvedValue({ code: 200, data: 0 } as ApiResponse<number>)

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

    ;(wrapper.vm as unknown as { filterStatus: number | '' }).filterStatus = 0
    await (wrapper.vm as unknown as { handleFilterChange: () => void }).handleFilterChange()
    await flushPromises()

    expect(orderApi.getSellerOrderItems).toHaveBeenLastCalledWith(0)
  })

  it('ships item and refreshes list and count', async () => {
    orderApi.getSellerOrderItems
      .mockResolvedValueOnce({ code: 200, data: [buildSellerItem()] } as ApiResponse<SellerOrderItem[]>)
      .mockResolvedValueOnce({ code: 200, data: [buildSellerItem({ shipStatus: 1 })] } as ApiResponse<SellerOrderItem[]>)
    orderApi.getSellerPendingCount
      .mockResolvedValueOnce({ code: 200, data: 1 } as ApiResponse<number>)
      .mockResolvedValueOnce({ code: 200, data: 0 } as ApiResponse<number>)
    orderApi.shipSellerOrderItem.mockResolvedValue({ code: 200 })

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

    expect(orderApi.shipSellerOrderItem).toHaveBeenCalledWith(11)
    expect(messages.success).toHaveBeenCalledWith('发货成功')
    expect(orderApi.getSellerPendingCount).toHaveBeenCalledTimes(2)
  })

  it('keeps shipping success when refreshing seller data fails afterward', async () => {
    orderApi.getSellerOrderItems
      .mockResolvedValueOnce({ code: 200, data: [buildSellerItem()] } as ApiResponse<SellerOrderItem[]>)
      .mockRejectedValue(new Error('刷新失败'))
    orderApi.getSellerPendingCount.mockResolvedValue({ code: 200, data: 1 } as ApiResponse<number>)
    orderApi.shipSellerOrderItem.mockResolvedValue({ code: 200 })

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
    orderApi.getSellerOrderItems
      .mockResolvedValueOnce({ code: 200, data: [buildSellerItem()] } as ApiResponse<SellerOrderItem[]>)
      .mockRejectedValue(new Error('刷新失败'))
    orderApi.getSellerPendingCount.mockResolvedValue({ code: 200, data: 1 } as ApiResponse<number>)
    orderApi.shipSellerOrderItem.mockResolvedValue({ code: 200 })

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
    orderApi.getSellerOrderItems.mockResolvedValue({ code: 200, data: [buildSellerItem()] } as ApiResponse<SellerOrderItem[]>)
    orderApi.getSellerPendingCount.mockResolvedValue({ code: 200, data: 1 } as ApiResponse<number>)
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

    expect(orderApi.shipSellerOrderItem).not.toHaveBeenCalled()
    expect(messages.error).not.toHaveBeenCalled()
  })

  it('shows an error when shipping request fails', async () => {
    orderApi.getSellerOrderItems.mockResolvedValue({ code: 200, data: [buildSellerItem()] } as ApiResponse<SellerOrderItem[]>)
    orderApi.getSellerPendingCount.mockResolvedValue({ code: 200, data: 1 } as ApiResponse<number>)
    orderApi.shipSellerOrderItem.mockRejectedValue({
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
    orderApi.getSellerOrderItems.mockRejectedValue({ response: { data: { message: '请先登录' } } })
    orderApi.getSellerPendingCount.mockResolvedValue({ code: 200, data: 0 } as ApiResponse<number>)

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
    orderApi.getSellerOrderItems.mockResolvedValue({ code: 500, message: '卖家订单列表加载失败' })
    orderApi.getSellerPendingCount.mockResolvedValue({ code: 200, data: 0 } as ApiResponse<number>)

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
    orderApi.getSellerOrderItems.mockResolvedValue({ code: 200, data: [buildSellerItem()] } as ApiResponse<SellerOrderItem[]>)
    orderApi.getSellerPendingCount.mockResolvedValue({ code: 200, data: 1 } as ApiResponse<number>)
    orderApi.shipSellerOrderItem.mockResolvedValue({ code: 500, message: '订单项发货失败' })

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

    orderApi.getSellerOrderItems
      .mockImplementationOnce(() => firstItemsRequest.promise)
      .mockImplementationOnce(() => secondItemsRequest.promise)
    orderApi.getSellerPendingCount.mockResolvedValue({ code: 200, data: 0 } as ApiResponse<number>)

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

    ;(wrapper.vm as unknown as { filterStatus: number | '' }).filterStatus = 0
    const refetchPromise = (wrapper.vm as unknown as { handleFilterChange: () => void }).handleFilterChange()
    await flushPromises()

    secondItemsRequest.resolve({ code: 200, data: [buildSellerItem({ id: 22, orderNo: 'ORD-NEW' })] } as ApiResponse<SellerOrderItem[]>)
    await refetchPromise
    await flushPromises()

    expect(wrapper.text()).toContain('订单号: ORD-NEW')

    firstItemsRequest.resolve({ code: 200, data: [buildSellerItem({ id: 11, orderNo: 'ORD-OLD' })] } as ApiResponse<SellerOrderItem[]>)
    await flushPromises()

    expect(wrapper.text()).toContain('订单号: ORD-NEW')
    expect(wrapper.text()).not.toContain('订单号: ORD-OLD')
  })

  it('does not let in-flight seller requests overwrite local ship success', async () => {
    const firstItemsRequest = createDeferred<ApiResponse<SellerOrderItem[]>>()
    const secondItemsRequest = createDeferred<ApiResponse<SellerOrderItem[]>>()

    orderApi.getSellerOrderItems
      .mockImplementationOnce(() => firstItemsRequest.promise)
      .mockImplementationOnce(() => secondItemsRequest.promise)
    orderApi.getSellerPendingCount
      .mockResolvedValueOnce({ code: 200, data: 1 } as ApiResponse<number>)
      .mockResolvedValueOnce({ code: 200, data: 0 } as ApiResponse<number>)
    orderApi.shipSellerOrderItem.mockResolvedValue({ code: 200 })

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

    secondItemsRequest.resolve({ code: 200, data: [buildSellerItem({ id: 11, shipStatus: 1 })] } as ApiResponse<SellerOrderItem[]>)
    await shipPromise
    await flushPromises()

    firstItemsRequest.resolve({ code: 200, data: [buildSellerItem({ id: 11, shipStatus: 0 })] } as ApiResponse<SellerOrderItem[]>)
    await flushPromises()

    expect((wrapper.vm as any).orderItems[0].shipStatus).toBe(1)
    expect((wrapper.vm as any).pendingCount).toBe(0)
  })
})
