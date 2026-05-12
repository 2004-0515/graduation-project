import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { routerPush, routeMock, messages, userStore, adminStore, debugError } = vi.hoisted(() => ({
  routerPush: vi.fn(),
  routeMock: {
    path: '/admin'
  },
  messages: {
    success: vi.fn(),
    error: vi.fn()
  },
  userStore: {
    userInfo: { username: 'admin' },
    logout: vi.fn()
  },
  adminStore: {
    pendingFileCount: 2,
    pendingProductCount: 3,
    pendingOrderCount: 4,
    refreshAllCounts: vi.fn()
  },
  debugError: vi.fn()
}))

vi.mock('vue-router', () => ({
  useRoute: () => routeMock,
  useRouter: () => ({
    push: routerPush
  })
}))

vi.mock('element-plus', () => ({
  ElMessage: messages
}))

vi.mock('@/stores/userStore', () => ({
  useUserStore: () => userStore
}))

vi.mock('@/stores/adminStore', () => ({
  useAdminStore: () => adminStore
}))

vi.mock('@/utils/debug', () => ({
  debugError
}))

import AdminLayout from '@/components/AdminLayout.vue'

describe('AdminLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    routeMock.path = '/admin'
    userStore.userInfo = { username: 'admin' }
    userStore.logout.mockResolvedValue(undefined)
  })

  const mountView = () =>
    mount(AdminLayout, {
      global: {
        mocks: {
          $route: routeMock
        },
        stubs: {
          RouterLink: {
            props: ['to'],
            template: '<a><slot /></a>'
          }
        }
      },
      slots: {
        default: '<div>content</div>'
      }
    })

  it('refreshes counts on mount', async () => {
    mountView()
    await flushPromises()

    expect(adminStore.refreshAllCounts).toHaveBeenCalled()
  })

  it('logs out and routes to login on success', async () => {
    const wrapper = mountView()
    await flushPromises()

    const logoutButton = wrapper.findAll('button').find((button) => button.text() === '退出登录')
    await logoutButton!.trigger('click')
    await flushPromises()

    expect(userStore.logout).toHaveBeenCalled()
    expect(messages.success).toHaveBeenCalledWith('已退出登录')
    expect(routerPush).toHaveBeenCalledWith('/login')
  })

  it('shows chinese error when logout fails', async () => {
    userStore.logout.mockRejectedValue(new Error('logout failed'))

    const wrapper = mountView()
    await flushPromises()

    const logoutButton = wrapper.findAll('button').find((button) => button.text() === '退出登录')
    await logoutButton!.trigger('click')
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('退出登录失败')
    expect(debugError).toHaveBeenCalledWith('后台退出登录失败:', expect.any(Error))
    expect(routerPush).not.toHaveBeenCalled()
  })
})
