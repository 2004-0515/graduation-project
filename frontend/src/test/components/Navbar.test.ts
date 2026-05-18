import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'

const {
  routerPush,
  currentRoute,
  messages,
  userStore,
  cartStore,
  notificationStore,
  searchApi,
  debugError
} = vi.hoisted(() => ({
  routerPush: vi.fn(),
  currentRoute: {
    value: {
      path: '/'
    }
  },
  messages: {
    success: vi.fn(),
    error: vi.fn()
  },
  userStore: {
    isLoggedIn: true,
    userInfo: { username: 'buyer', nickname: '买家', email: 'buyer@example.com', avatar: '' } as {
      username: string
      nickname: string
      email: string
      avatar: string
    } | null,
    logout: vi.fn()
  },
  cartStore: {
    totalItems: 2,
    items: [{ id: 1 }],
    fetchCart: vi.fn()
  },
  notificationStore: {
    unreadCount: 3,
    fetchUnreadCount: vi.fn(),
    clearCount: vi.fn()
  },
  searchApi: {
    recordSearch: vi.fn()
  },
  debugError: vi.fn()
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: routerPush,
    currentRoute
  })
}))

vi.mock('element-plus', () => ({
  ElMessage: messages
}))

vi.mock('@/stores/userStore', () => ({
  useUserStore: () => userStore
}))

vi.mock('@/stores/cartStore', () => ({
  useCartStore: () => cartStore
}))

vi.mock('@/stores/notificationStore', () => ({
  useNotificationStore: () => notificationStore
}))

vi.mock('@/api/fileApi', () => ({
  default: {
    getImageUrl: vi.fn(() => '/avatar.png')
  }
}))

vi.mock('@/api/searchApi', () => ({
  default: searchApi
}))

vi.mock('@/utils/debug', () => ({
  debugError
}))

const SearchDropdownStub = defineComponent({
  name: 'SearchDropdown',
  props: {
    visible: Boolean,
    keyword: String
  },
  setup(_, { expose }) {
    expose({
      saveSearchHistory: vi.fn()
    })
    return () => h('div')
  }
})

import Navbar from '@/components/Navbar.vue'

describe('Navbar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    currentRoute.value.path = '/'
    userStore.isLoggedIn = true
    userStore.userInfo = { username: 'buyer', nickname: '买家', email: 'buyer@example.com', avatar: '' }
    userStore.logout.mockResolvedValue(undefined)
    cartStore.items = [{ id: 1 }]
    cartStore.totalItems = 2
    notificationStore.unreadCount = 3
    searchApi.recordSearch.mockResolvedValue(undefined)
  })

  const mountView = () =>
    mount(Navbar, {
      global: {
        stubs: {
          RouterLink: { template: '<a><slot /></a>' },
          SearchDropdown: SearchDropdownStub
        },
        mocks: {
          $route: currentRoute.value,
          $router: { push: routerPush }
        }
      }
    })

  it('routes to category search and records keyword when searching with input', async () => {
    const wrapper = mountView()

    ;(wrapper.vm as any).query = '耳机'
    ;(wrapper.vm as any).search()
    await flushPromises()

    expect(searchApi.recordSearch).toHaveBeenCalledWith('耳机')
    expect(routerPush).toHaveBeenCalledWith('/category?q=%E8%80%B3%E6%9C%BA')
  })

  it('logs when recording search keyword fails but still routes', async () => {
    searchApi.recordSearch.mockRejectedValue(new Error('search down'))
    const wrapper = mountView()

    ;(wrapper.vm as any).query = '键盘'
    ;(wrapper.vm as any).search()
    await flushPromises()

    expect(routerPush).toHaveBeenCalledWith('/category?q=%E9%94%AE%E7%9B%98')
    expect(debugError).toHaveBeenCalledWith('记录搜索关键词失败', expect.any(Error))
  })

  it('routes to category root when searching with empty input', async () => {
    const wrapper = mountView()

    ;(wrapper.vm as any).query = '   '
    ;(wrapper.vm as any).search()
    await flushPromises()

    expect(searchApi.recordSearch).not.toHaveBeenCalled()
    expect(routerPush).toHaveBeenCalledWith('/category')
  })

  it('refreshes cart and unread counts on mount for logged-in users', async () => {
    mountView()
    await flushPromises()

    expect(cartStore.fetchCart).toHaveBeenCalled()
    expect(notificationStore.fetchUnreadCount).toHaveBeenCalled()
  })

  it('keeps navbar mount usable when authenticated refresh rejects', async () => {
    cartStore.fetchCart.mockRejectedValue(new Error('cart refresh failed'))
    notificationStore.fetchUnreadCount.mockRejectedValue(new Error('unread refresh failed'))

    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.find('.navbar').exists()).toBe(true)
    expect(debugError).toHaveBeenCalledWith('刷新导航栏购物车状态失败', expect.any(Error))
    expect(debugError).toHaveBeenCalledWith('刷新导航栏通知未读数失败', expect.any(Error))
  })

  it('does not refresh authenticated state on mount for guest users', async () => {
    userStore.isLoggedIn = false
    userStore.userInfo = null

    mountView()
    await flushPromises()

    expect(cartStore.fetchCart).not.toHaveBeenCalled()
    expect(notificationStore.fetchUnreadCount).not.toHaveBeenCalled()
  })

  it('logout clears store state and returns to home', async () => {
    const wrapper = mountView()

    await (wrapper.vm as any).handleLogout()
    await flushPromises()

    expect(userStore.logout).toHaveBeenCalled()
    expect(cartStore.items).toEqual([])
    expect(notificationStore.clearCount).toHaveBeenCalled()
    expect(messages.success).toHaveBeenCalledWith('已退出登录')
    expect(routerPush).toHaveBeenCalledWith('/')
  })

  it('shows chinese error when logout fails', async () => {
    userStore.logout.mockRejectedValue(new Error('logout failed'))
    const wrapper = mountView()

    await (wrapper.vm as any).handleLogout()
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('退出登录失败')
    expect(debugError).toHaveBeenCalledWith('退出登录失败', expect.any(Error))
    expect(routerPush).not.toHaveBeenCalled()
  })

  it('shows login button for guest user', async () => {
    userStore.isLoggedIn = false
    userStore.userInfo = null
    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.text()).toContain('登录')
  })
})
