import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'

const { mockUserStore } = vi.hoisted(() => ({
  mockUserStore: {
    token: null as string | null,
    userInfo: null as { username?: string; role?: 'BUYER' | 'SELLER' | 'ADMIN'; status?: number } | null,
    fetchCurrentUser: vi.fn(),
    logout: vi.fn()
  }
}))

vi.mock('@/stores/userStore', () => ({
  useUserStore: () => mockUserStore
}))

const routeStub = (name: string) => defineComponent({
  name,
  template: `<div>${name}</div>`
})

vi.mock('@/views/HomeView.vue', () => ({ default: routeStub('HomeView') }))
vi.mock('@/views/LoginView.vue', () => ({ default: routeStub('LoginView') }))
vi.mock('@/views/OrdersView.vue', () => ({ default: routeStub('OrdersView') }))
vi.mock('@/views/ProfileView.vue', () => ({ default: routeStub('ProfileView') }))
vi.mock('@/views/MyProductsView.vue', () => ({ default: routeStub('MyProductsView') }))
vi.mock('@/views/SellerOrdersView.vue', () => ({ default: routeStub('SellerOrdersView') }))
vi.mock('@/views/admin/DashboardView.vue', () => ({ default: routeStub('AdminDashboardView') }))

import router from '@/router'

describe('router guards', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    window.scrollTo = vi.fn() as unknown as Window['scrollTo']
    mockUserStore.token = null
    mockUserStore.userInfo = null
    mockUserStore.fetchCurrentUser.mockReset()
    mockUserStore.logout.mockReset()
    mockUserStore.logout.mockResolvedValue(undefined)

    await router.push('/')
    await router.isReady()
  })

  it('redirects anonymous user to login when visiting auth-required route', async () => {
    mockUserStore.token = null

    await router.push('/orders')

    expect(router.currentRoute.value.name).toBe('login')
    expect(router.currentRoute.value.query.redirect).toBe('/orders')
  })

  it('redirects to login when token exists but current user refresh fails', async () => {
    mockUserStore.token = 'token'
    mockUserStore.userInfo = null
    mockUserStore.fetchCurrentUser.mockRejectedValue(new Error('token expired'))

    await router.push('/profile')

    expect(mockUserStore.fetchCurrentUser).toHaveBeenCalled()
    expect(router.currentRoute.value.name).toBe('login')
    expect(router.currentRoute.value.query.redirect).toBe('/profile')
  })

  it('allows protected route when current user refresh succeeds', async () => {
    mockUserStore.token = 'token'
    mockUserStore.userInfo = null
    mockUserStore.fetchCurrentUser.mockImplementation(async () => {
      mockUserStore.userInfo = { username: 'buyer', role: 'BUYER' }
    })

    await router.push('/profile')

    expect(mockUserStore.fetchCurrentUser).toHaveBeenCalled()
    expect(router.currentRoute.value.name).toBe('profile')
  })

  it('refreshes current user from server even when cached user info exists', async () => {
    mockUserStore.token = 'token'
    mockUserStore.userInfo = { username: 'lisi', role: 'SELLER' }
    mockUserStore.fetchCurrentUser.mockImplementation(async () => {
      mockUserStore.userInfo = { username: 'lisi', role: 'BUYER' }
    })

    await router.push('/my-products')

    expect(mockUserStore.fetchCurrentUser).toHaveBeenCalled()
    expect(router.currentRoute.value.name).toBe('home')
  })

  it('logs out and redirects disabled user away from protected route', async () => {
    mockUserStore.token = 'token'
    mockUserStore.userInfo = { username: 'buyer', role: 'BUYER', status: 0 }

    await router.push('/profile')

    expect(mockUserStore.logout).toHaveBeenCalled()
    expect(router.currentRoute.value.name).toBe('login')
    expect(router.currentRoute.value.query.loggedOut).toBe('1')
    expect(router.currentRoute.value.query.redirect).toBeUndefined()
  })

  it('redirects non-admin user away from admin route', async () => {
    mockUserStore.token = 'token'
    mockUserStore.userInfo = { username: 'buyer', role: 'BUYER' }

    await router.push('/admin')

    expect(router.currentRoute.value.name).toBe('home')
  })

  it('allows admin user to visit admin route', async () => {
    mockUserStore.token = 'token'
    mockUserStore.userInfo = { username: 'admin', role: 'ADMIN' }

    await router.push('/admin')

    expect(router.currentRoute.value.name).toBe('adminDashboard')
  })

  it('redirects non-seller user away from seller routes', async () => {
    mockUserStore.token = 'token'
    mockUserStore.userInfo = { username: 'zhangsan', role: 'BUYER' }

    await router.push('/my-products')

    expect(router.currentRoute.value.name).toBe('home')

    await router.push('/seller-orders')

    expect(router.currentRoute.value.name).toBe('home')
  })

  it('allows seller user to visit seller routes', async () => {
    mockUserStore.token = 'token'
    mockUserStore.userInfo = { username: 'lisi', role: 'SELLER' }

    await router.push('/my-products')

    expect(router.currentRoute.value.name).toBe('myProducts')

    await router.push('/seller-orders')

    expect(router.currentRoute.value.name).toBe('sellerOrders')
  })
})
