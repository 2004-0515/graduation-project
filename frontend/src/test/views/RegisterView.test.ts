import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'

const { routerPush, messages, userStore, debugError } = vi.hoisted(() => ({
  routerPush: vi.fn(),
  messages: {
    success: vi.fn(),
    error: vi.fn()
  },
  userStore: {
    register: vi.fn(),
    error: null as string | null
  },
  debugError: vi.fn()
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: routerPush })
}))

vi.mock('element-plus', () => ({
  ElMessage: messages
}))

vi.mock('@/stores/userStore', () => ({
  useUserStore: () => userStore
}))

vi.mock('@/utils/debug', () => ({
  debugError
}))

const ElFormStub = defineComponent({
  setup(_, { slots, expose }) {
    expose({
      validate: (callback: (valid: boolean) => void) => callback(true)
    })
    return () => h('form', slots.default?.())
  }
})

import RegisterView from '@/views/RegisterView.vue'

describe('RegisterView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    userStore.error = null
  })

  const mountView = () =>
    mount(RegisterView, {
      global: {
        stubs: {
          RouterLink: { template: '<a><slot /></a>' },
          ElForm: ElFormStub,
          ElFormItem: { template: '<div><slot /></div>' },
          ElInput: true
        }
      }
    })

  it('shows success message and redirects to login after register succeeds', async () => {
    userStore.register.mockResolvedValue({ id: 1, username: 'newUser' })
    const wrapper = mountView()

    Object.assign((wrapper.vm as any).registerForm, {
      username: 'newUser',
      email: 'new@example.com',
      password: 'secret123',
      confirmPassword: 'secret123'
    })

    await (wrapper.vm as any).handleRegister()
    await flushPromises()

    expect(userStore.register).toHaveBeenCalledWith({
      username: 'newUser',
      email: 'new@example.com',
      password: 'secret123'
    })
    expect(messages.success).toHaveBeenCalledWith('注册成功，请登录')
    expect(routerPush).toHaveBeenCalledWith('/login')
  })

  it('shows backend chinese error when register fails', async () => {
    userStore.error = '用户名已存在'
    userStore.register.mockRejectedValue(new Error('boom'))
    const wrapper = mountView()

    Object.assign((wrapper.vm as any).registerForm, {
      username: 'existingUser',
      email: 'old@example.com',
      password: 'secret123',
      confirmPassword: 'secret123'
    })

    await (wrapper.vm as any).handleRegister()
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('用户名已存在')
    expect(debugError).toHaveBeenCalledWith('注册失败:', '用户名已存在')
    expect(routerPush).not.toHaveBeenCalled()
  })
})
