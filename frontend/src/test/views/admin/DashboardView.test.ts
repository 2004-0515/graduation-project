import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { adminApi, debugError } = vi.hoisted(() => ({
  adminApi: {
    getDashboardStats: vi.fn()
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
    adminApi.getDashboardStats.mockResolvedValue({
      code: 200,
      data: {
        totalUsers: 10,
        totalProducts: 2,
        totalOrders: 2,
        totalRevenue: 100,
        todayOrders: 1,
        todayRevenue: 100,
        pendingOrders: 2,
        lowStockProducts: 1,
        salesTrend: [{ date: '2026-05-09', revenue: 100, orderCount: 1 }],
        orderStatusDistribution: [{ status: 1, count: 1 }, { status: 0, count: 1 }],
        topCategories: [{ categoryName: '数码', sales: 12 }, { categoryName: '家居', sales: 8 }],
        recentOrders: [{ id: 1, orderNo: 'ORD-1', username: 'buyer', totalAmount: 100, orderStatus: 1, createdTime: '2026-05-09T10:00:00' }]
      }
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

  it('logs when dashboard stats returns non-200 payload', async () => {
    adminApi.getDashboardStats.mockResolvedValue({ code: 500, message: '仪表盘统计失败' })

    mountView()
    await flushPromises()

    expect(debugError).toHaveBeenCalledWith('获取仪表盘统计失败:', '仪表盘统计失败')
  })

  it('logs top-level dashboard fetch failure when stats request throws', async () => {
    adminApi.getDashboardStats.mockRejectedValue(new Error('后台统计服务不可用'))

    mountView()
    await flushPromises()

    expect(debugError).toHaveBeenCalledWith('获取仪表盘统计数据失败:', expect.any(Error))
  })

  it('keeps newer dashboard stats when older request resolves later', async () => {
    const firstStats = deferred<any>()

    adminApi.getDashboardStats
      .mockReturnValueOnce(firstStats.promise)
      .mockResolvedValueOnce({
      code: 200,
      data: {
        totalUsers: 20,
        totalProducts: 1,
        totalOrders: 1,
        totalRevenue: 88,
        todayOrders: 1,
        todayRevenue: 88,
        pendingOrders: 1,
        lowStockProducts: 1,
        salesTrend: [{ date: '2026-05-10', revenue: 88, orderCount: 1 }],
        orderStatusDistribution: [{ status: 1, count: 1 }],
        topCategories: [{ categoryName: '图书', sales: 9 }],
        recentOrders: [{ id: 3, orderNo: 'ORD-NEW', username: 'buyer3', totalAmount: 88, orderStatus: 1, createdTime: '2026-05-10T10:00:00' }]
      }
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

    firstStats.resolve({
      code: 200,
      data: {
        totalUsers: 10,
        totalProducts: 2,
        totalOrders: 2,
        totalRevenue: 100,
        todayOrders: 1,
        todayRevenue: 100,
        pendingOrders: 2,
        lowStockProducts: 1,
        salesTrend: [{ date: '2026-05-09', revenue: 100, orderCount: 1 }],
        orderStatusDistribution: [{ status: 1, count: 1 }, { status: 0, count: 1 }],
        topCategories: [{ categoryName: '数码', sales: 12 }, { categoryName: '家居', sales: 8 }],
        recentOrders: [{ id: 1, orderNo: 'ORD-1', username: 'buyer', totalAmount: 100, orderStatus: 1, createdTime: '2026-05-09T10:00:00' }]
      }
    })
    await flushPromises()

    expect(vm.stats.totalUsers).toBe(20)
    expect(vm.stats.totalProducts).toBe(1)
    expect(vm.stats.totalOrders).toBe(1)
  })
})
