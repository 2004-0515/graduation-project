import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'

const { routerReplace, messages, userStore, generateRandomCode, debugError, routeState } = vi.hoisted(() => ({
  routerReplace: vi.fn(),
  messages: {
    success: vi.fn(),
    error: vi.fn()
  },
  userStore: {
    login: vi.fn(),
    error: null as string | null
  },
  generateRandomCode: vi.fn(),
  debugError: vi.fn(),
  routeState: {
    query: {}
  }
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ replace: routerReplace }),
  useRoute: () => routeState
}))

vi.mock('element-plus', () => ({
  ElMessage: messages
}))

vi.mock('@/stores/userStore', () => ({
  useUserStore: () => userStore
}))

vi.mock('@/utils/captcha', () => ({
  generateRandomCode
}))

vi.mock('@/utils/debug', () => ({
  debugError
}))

vi.mock('@/utils/navigation', () => ({
  resolvePostLoginTarget: (route: { query?: Record<string, unknown> }, user?: { role?: string }) => {
    const redirect = route.query?.redirect
    if (route.query?.loggedOut === '1') {
      return user?.role === 'ADMIN' ? '/admin' : user?.role === 'SELLER' ? '/my-products' : '/'
    }
    return typeof redirect === 'string' ? redirect : user?.role === 'ADMIN' ? '/admin' : user?.role === 'SELLER' ? '/my-products' : '/'
  }
}))

const ElFormStub = defineComponent({
  setup(_, { slots, expose }) {
    expose({
      validate: (callback: (valid: boolean) => void) => callback(true)
    })
    return () => h('form', slots.default?.())
  }
})

import LoginView from '@/views/LoginView.vue'

describe('LoginView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    userStore.error = null
    routeState.query = {}
    generateRandomCode.mockReturnValue('ABC123')
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      value: vi.fn(() => ({
        fillStyle: '',
        strokeStyle: '',
        font: '',
        textAlign: '',
        textBaseline: '',
        fillRect: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        stroke: vi.fn(),
        fillText: vi.fn()
      })),
      configurable: true
    })
    Object.defineProperty(HTMLCanvasElement.prototype, 'toDataURL', {
      value: vi.fn(() => 'data:image/png;base64,test'),
      configurable: true
    })
  })

  const mountView = () =>
    mount(LoginView, {
      global: {
        stubs: {
          RouterLink: { template: '<a><slot /></a>' },
          ElForm: ElFormStub,
          ElFormItem: { template: '<div><slot /></div>' },
          ElInput: true
        }
      }
    })

  it('shows success message and redirects to original target after login succeeds', async () => {
    userStore.login.mockResolvedValue({
      token: 'token',
      user: { id: 1, username: 'buyer' }
    })
    routeState.query = { redirect: '/orders' }
    const wrapper = mountView()

    ;(wrapper.vm as any).loginForm.username = 'buyer'
    ;(wrapper.vm as any).loginForm.password = 'secret123'

    await (wrapper.vm as any).handleLogin()
    await flushPromises()

    expect(userStore.login).toHaveBeenCalledWith({ username: 'buyer', password: 'secret123' })
    expect(messages.success).toHaveBeenCalledWith('登录成功')
    expect(routerReplace).toHaveBeenCalledWith('/orders')
  })

  it('ignores stale redirect after explicit logout and uses role default target', async () => {
    userStore.login.mockResolvedValue({
      token: 'token',
      user: { id: 1, username: 'admin', role: 'ADMIN' }
    })
    routeState.query = { redirect: '/admin/music', loggedOut: '1' }
    const wrapper = mountView()

    ;(wrapper.vm as any).loginForm.username = 'admin'
    ;(wrapper.vm as any).loginForm.password = 'secret123'

    await (wrapper.vm as any).handleLogin()
    await flushPromises()

    expect(routerReplace).toHaveBeenCalledWith('/admin')
  })

  it('shows backend chinese error and refreshes captcha after login fails', async () => {
    userStore.error = '用户名或密码错误'
    userStore.login.mockRejectedValue(new Error('boom'))
    generateRandomCode
      .mockReturnValueOnce('ABC123')
      .mockReturnValueOnce('XYZ789')

    const wrapper = mountView()
    ;(wrapper.vm as any).loginForm.username = 'buyer'
    ;(wrapper.vm as any).loginForm.password = 'wrong'
    ;(wrapper.vm as any).loginForm.captcha = 'ABC123'

    await (wrapper.vm as any).handleLogin()
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('用户名或密码错误')
    expect(debugError).toHaveBeenCalledWith('登录失败:', '用户名或密码错误')
    expect((wrapper.vm as any).loginForm.captcha).toBe('')
    expect((wrapper.vm as any).captchaExposeCode).toBe('XYZ789')
  })
})
