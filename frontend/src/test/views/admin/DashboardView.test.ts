import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { adminApi, debugError } = vi.hoisted(() => ({
  adminApi: {
    getUsers: vi.fn(),
    getProducts: vi.fn(),
    getAllOrders: vi.fn()
  },
  debugError: vi.fn()
}))

vi.mock('@/api/adminApi', () => ({
  default: adminApi
}))

vi.mock('@/utils/debug', () => ({
  debugError
}))

vi.mock('echarts/core', () => ({
  use: vi.fn(),
  init: vi.fn(() => ({
    setOption: vi.fn(),
    resize: vi.fn(),
    dispose: vi.fn()
  })),
  graphic: {
    LinearGradient: vi.fn(() => ({}))
  }
}))

import DashboardView from '@/views/admin/DashboardView.vue'

const deferred = <T>() => {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('DashboardView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    adminApi.getUsers.mockResolvedValue({
      code: 200,
      data: { totalElements: 10 }
    })
    adminApi.getProducts.mockResolvedValue({
      code: 200,
      data: {
        totalElements: 2,
        content: [
          { id: 1, stock: 5, sales: 12, categoryName: '数码' },
          { id: 2, stock: 20, sales: 8, categoryName: '家居' }
        ]
      }
    })
    adminApi.getAllOrders.mockResolvedValue({
      code: 200,
      data: [
        { id: 1, orderNo: 'ORD-1', username: 'buyer', totalAmount: 100, orderStatus: 1, createdTime: '2026-05-09T10:00:00' },
        { id: 2, orderNo: 'ORD-2', username: 'buyer2', totalAmount: 50, orderStatus: 0, createdTime: '2026-05-08T10:00:00' }
      ]
    })
  })

  const mountView = () =>
    mount(DashboardView, {
      global: {
        stubs: {
          AdminLayout: { template: '<div><slot /></div>' },
          RouterLink: { template: '<a><slot /></a>' }
        }
      }
    })

  it('computes dashboard stats from loaded admin data', async () => {
    const wrapper = mountView()

    await flushPromises()

    expect((wrapper.vm as any).stats.totalUsers).toBe(10)
    expect((wrapper.vm as any).stats.totalProducts).toBe(2)
    expect((wrapper.vm as any).stats.totalOrders).toBe(2)
    expect((wrapper.vm as any).stats.totalRevenue).toBe(100)
    expect((wrapper.vm as any).stats.pendingOrders).toBe(2)
    expect((wrapper.vm as any).stats.lowStockProducts).toBe(1)
  })

  it('logs when users stats returns non-200 payload', async () => {
    adminApi.getUsers.mockResolvedValue({ code: 500, message: '用户统计失败' })

    mountView()
    await flushPromises()

    expect(debugError).toHaveBeenCalledWith('获取仪表盘用户统计失败:', '用户统计失败')
  })

  it('logs when orders stats returns non-200 payload', async () => {
    adminApi.getAllOrders.mockResolvedValue({ code: 500, message: '订单统计失败' })

    mountView()
    await flushPromises()

    expect(debugError).toHaveBeenCalledWith('获取仪表盘订单统计失败:', '订单统计失败')
  })

  it('logs when products stats returns non-200 payload', async () => {
    adminApi.getProducts.mockResolvedValue({ code: 500, message: '商品统计失败' })

    mountView()
    await flushPromises()

    expect(debugError).toHaveBeenCalledWith('获取仪表盘商品统计失败:', '商品统计失败')
  })

  it('logs top-level dashboard fetch failure when stats request throws', async () => {
    adminApi.getUsers.mockRejectedValue(new Error('后台统计服务不可用'))

    mountView()
    await flushPromises()

    expect(debugError).toHaveBeenCalledWith('获取仪表盘统计数据失败:', expect.any(Error))
  })

  it('keeps newer dashboard stats when older request resolves later', async () => {
    const firstUsers = deferred<any>()

    adminApi.getUsers
      .mockReturnValueOnce(firstUsers.promise)
      .mockResolvedValueOnce({ code: 200, data: { totalElements: 20 } })
    adminApi.getProducts.mockResolvedValue({
      code: 200,
      data: { totalElements: 1, content: [{ id: 3, stock: 4, sales: 9, categoryName: '图书' }] }
    })
    adminApi.getAllOrders.mockResolvedValue({
      code: 200,
      data: [{ id: 3, orderNo: 'ORD-NEW', username: 'buyer3', totalAmount: 88, orderStatus: 1, createdTime: '2026-05-10T10:00:00' }]
    })

    const wrapper = mountView()
    await flushPromises()

    const vm = wrapper.vm as any
    vm.fetchStats()
    await flushPromises()

    await flushPromises()

    expect(vm.stats.totalUsers).toBe(20)
    expect(vm.stats.totalProducts).toBe(1)
    expect(vm.stats.totalOrders).toBe(1)

    firstUsers.resolve({ code: 200, data: { totalElements: 10 } })
    await flushPromises()

    expect(vm.stats.totalUsers).toBe(20)
    expect(vm.stats.totalProducts).toBe(1)
    expect(vm.stats.totalOrders).toBe(1)
  })
})
