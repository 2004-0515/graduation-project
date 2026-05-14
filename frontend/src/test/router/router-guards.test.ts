import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'

const { mockUserStore } = vi.hoisted(() => ({
  mockUserStore: {
    token: null as string | null,
    userInfo: null as { username?: string } | null,
    fetchCurrentUser: vi.fn()
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
vi.mock('@/views/admin/DashboardView.vue', () => ({ default: routeStub('AdminDashboardView') }))

import router from '@/router'

describe('router guards', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    window.scrollTo = vi.fn()
    mockUserStore.token = null
    mockUserStore.userInfo = null
    mockUserStore.fetchCurrentUser.mockReset()

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
      mockUserStore.userInfo = { username: 'buyer' }
    })

    await router.push('/profile')

    expect(mockUserStore.fetchCurrentUser).toHaveBeenCalled()
    expect(router.currentRoute.value.name).toBe('profile')
  })

  it('redirects non-admin user away from admin route', async () => {
    mockUserStore.token = 'token'
    mockUserStore.userInfo = { username: 'buyer' }

    await router.push('/admin')

    expect(router.currentRoute.value.name).toBe('home')
  })

  it('allows admin user to visit admin route', async () => {
    mockUserStore.token = 'token'
    mockUserStore.userInfo = { username: 'admin' }

    await router.push('/admin')

    expect(router.currentRoute.value.name).toBe('adminDashboard')
  })
})
