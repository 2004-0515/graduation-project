import { computed } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockPush, messages, userStore, cartStore, orderApi, axiosMock, fileApi, debugError } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  messages: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn()
  },
  userStore: {
    userInfo: {
      id: 1,
      username: 'zhangsan',
      nickname: '张三',
      email: 'zhangsan@qq.com',
      phone: '13812345678',
      bio: '简介'
    },
    fetchCurrentUser: vi.fn(),
    updateUserInfo: vi.fn()
  },
  cartStore: {
    items: [],
    fetchCart: vi.fn()
  },
  orderApi: {
    getOrders: vi.fn(),
    getUserOrders: vi.fn()
  },
  axiosMock: {
    get: vi.fn()
  },
  fileApi: {
    getImageUrl: vi.fn((path: string) => path),
    uploadAvatar: vi.fn()
  },
  debugError: vi.fn()
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush })
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

vi.mock('@/api/orderApi', () => ({
  default: orderApi
}))

vi.mock('@/utils/axios', () => ({
  default: axiosMock
}))

vi.mock('@/api/fileApi', () => ({
  default: fileApi
}))

vi.mock('@/utils/debug', () => ({
  debugError
}))

import ProfileView from '@/views/ProfileView.vue'

const deferred = <T>() => {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

const mountView = () =>
  mount(ProfileView, {
    global: {
      stubs: {
        Navbar: true,
        Footer: true,
        RouterLink: true,
        ElForm: { template: '<form><slot /></form>' },
        ElFormItem: { template: '<div><slot /></div>' },
        ElInput: {
          props: ['modelValue'],
          emits: ['update:modelValue'],
          template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />'
        }
      }
    }
  })

describe('ProfileView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    orderApi.getOrders.mockReset()
    axiosMock.get.mockReset()
    cartStore.fetchCart.mockReset()
    userStore.fetchCurrentUser.mockReset()
    userStore.updateUserInfo.mockReset()
    fileApi.uploadAvatar.mockReset()
    orderApi.getOrders.mockResolvedValue({ code: 200, data: [] })
    axiosMock.get
      .mockResolvedValueOnce({ code: 200, data: [] })
      .mockResolvedValueOnce({ code: 200, data: 0 })
    cartStore.items = []
    cartStore.fetchCart.mockResolvedValue(undefined)
  })

  it('routes security actions to settings security section', async () => {
    const wrapper = mountView()
    await flushPromises()

    const buttons = wrapper.findAll('button').filter((button) => button.text() === '前往设置')
    await buttons[0].trigger('click')

    expect(mockPush).toHaveBeenCalledWith('/settings?section=security')
  })

  it('shows backend chinese message when saving profile fails', async () => {
    userStore.updateUserInfo.mockRejectedValue({
      response: { data: { message: '昵称已存在' } }
    })

    const wrapper = mountView()
    await flushPromises()

    const saveButton = wrapper.findAll('button').find((button) => button.text() === '保存资料')
    await saveButton!.trigger('click')
    await flushPromises()

    expect(userStore.updateUserInfo).toHaveBeenCalledWith({
      nickname: '张三',
      bio: '简介'
    })
    expect(messages.error).toHaveBeenCalledWith('昵称已存在')
    expect(debugError).toHaveBeenCalledWith('保存个人资料失败:', expect.any(Object))
  })

  it('syncs local profile form and display after saving profile succeeds', async () => {
    userStore.updateUserInfo.mockImplementation(async (payload: { nickname: string; bio: string }) => {
      userStore.userInfo.nickname = payload.nickname
      userStore.userInfo.bio = payload.bio
    })

    const wrapper = mountView()
    await flushPromises()

    ;(wrapper.vm as any).profileForm.nickname = '新昵称'
    ;(wrapper.vm as any).profileForm.bio = '新简介'

    const saveButton = wrapper.findAll('button').find((button) => button.text() === '保存资料')
    await saveButton!.trigger('click')
    await flushPromises()

    expect(messages.success).toHaveBeenCalledWith('个人资料已保存')
    expect((wrapper.vm as any).profileForm.nickname).toBe('新昵称')
    expect((wrapper.vm as any).profileForm.bio).toBe('新简介')
    expect(userStore.userInfo.nickname).toBe('新昵称')
    expect(userStore.userInfo.bio).toBe('新简介')
  })

  it('keeps email and phone maintenance in settings instead of profile form', async () => {
    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.text()).toContain('邮箱和手机号已收口到账户设置统一维护。')
    expect(wrapper.text()).not.toContain('用于接收通知')
    expect(wrapper.text()).not.toContain('用于联系沟通')
  })

  it('loads order statistics from an explicit large page size', async () => {
    orderApi.getOrders.mockResolvedValue({
      code: 200,
      data: [
        { id: 1, orderStatus: 0, items: [] },
        { id: 2, orderStatus: 1, items: [] },
        { id: 3, orderStatus: 2, items: [] },
        { id: 4, orderStatus: 2, items: [] }
      ]
    })

    const wrapper = mountView()
    await flushPromises()

    expect(orderApi.getOrders).toHaveBeenCalledWith(1, 1000)
    expect(wrapper.text()).toContain('4')
    expect(wrapper.text()).toContain('2')
  })

  it('shows alert and seller badges only when corresponding stats are available', async () => {
    axiosMock.get.mockReset()
    axiosMock.get
      .mockResolvedValueOnce({ code: 200, data: [{ status: 0 }, { status: 0 }] })
      .mockResolvedValueOnce({ code: 200, data: 3 })

    const wrapper = mountView()
    await flushPromises()

    const vm = wrapper.vm as unknown as {
      showSellerPendingBadge: boolean
      showPriceAlertBadge: boolean
      sellerPendingCount: number
      priceAlertCount: number
    }
    expect(vm.showSellerPendingBadge).toBe(true)
    expect(vm.showPriceAlertBadge).toBe(true)
    expect(vm.sellerPendingCount).toBe(3)
    expect(vm.priceAlertCount).toBe(2)
  })

  it('shows unavailable hint instead of fake zero when stats loading fails', async () => {
    orderApi.getOrders.mockRejectedValue(new Error('orders failed'))
    axiosMock.get
      .mockRejectedValueOnce(new Error('alerts failed'))
      .mockRejectedValueOnce(new Error('seller failed'))
    cartStore.fetchCart.mockRejectedValue(new Error('cart failed'))

    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.text()).toContain('部分统计暂未同步，请稍后刷新重试。')
    expect(wrapper.text()).toContain('--')
    expect(debugError).toHaveBeenCalled()
  })

  it('shows unavailable hint when stats API returns non-200 payloads', async () => {
    orderApi.getOrders.mockReset()
    axiosMock.get.mockReset()
    orderApi.getOrders.mockResolvedValue({ code: 500, message: 'boom' })
    axiosMock.get
      .mockResolvedValueOnce({ code: 500, message: 'alerts failed' })
      .mockResolvedValueOnce({ code: 500, message: 'seller failed' })

    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.text()).toContain('部分统计暂未同步，请稍后刷新重试。')
    expect(wrapper.text()).toContain('--')
    expect(debugError).toHaveBeenCalledWith('获取订单统计失败:', 'boom')
    expect(debugError).toHaveBeenCalledWith('获取降价提醒失败:', expect.anything())
    expect(debugError).toHaveBeenCalledWith('获取卖家待处理数量失败:', expect.anything())
  })

  it('hides alert and seller badges after stats refresh falls back to unavailable', async () => {
    axiosMock.get.mockReset()
    axiosMock.get
      .mockResolvedValueOnce({ code: 200, data: [{ status: 0 }, { status: 0 }] })
      .mockResolvedValueOnce({ code: 200, data: 3 })

    const wrapper = mountView()
    await flushPromises()

    axiosMock.get
      .mockResolvedValueOnce({ code: 500, message: 'alerts failed again' })
      .mockResolvedValueOnce({ code: 500, message: 'seller failed again' })

    const vm = wrapper.vm as unknown as {
      loadPriceAlertCount: () => Promise<void>
      loadSellerPendingCount: () => Promise<void>
    }
    await vm.loadPriceAlertCount()
    await vm.loadSellerPendingCount()
    await flushPromises()

    expect(wrapper.findAll('.nav-badge')).toHaveLength(0)
    expect(wrapper.text()).toContain('部分统计暂未同步，请稍后刷新重试。')
  })

  it('uses cached cart items without forcing cart stats unavailable', async () => {
    cartStore.items = [{ id: 1 }, { id: 2 }]

    const wrapper = mountView()
    await flushPromises()

    expect(cartStore.fetchCart).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('2')
    expect(wrapper.text()).not.toContain('部分统计暂未同步，请稍后刷新重试。')
  })

  it('logs backend message when avatar upload returns non-200 payload', async () => {
    fileApi.uploadAvatar.mockResolvedValue({ code: 500, message: '头像审核未通过' })

    const wrapper = mountView()
    await flushPromises()

    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' })
    const input = wrapper.find('input[type="file"]')
    Object.defineProperty(input.element, 'files', {
      value: [file],
      configurable: true
    })

    await input.trigger('change')
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('头像审核未通过')
    expect(debugError).toHaveBeenCalledWith('头像上传失败:', '头像审核未通过')
  })

  it('keeps upload success when refreshing current user after avatar upload fails', async () => {
    fileApi.uploadAvatar.mockResolvedValue({ code: 200, message: '头像更新成功', data: '/uploads/avatars/new.png' })
    userStore.fetchCurrentUser.mockRejectedValue(new Error('刷新用户失败'))

    const wrapper = mountView()
    await flushPromises()

    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' })
    const input = wrapper.find('input[type="file"]')
    Object.defineProperty(input.element, 'files', {
      value: [file],
      configurable: true
    })

    await input.trigger('change')
    await flushPromises()

    expect(messages.success).toHaveBeenCalledWith('头像更新成功')
    expect(userStore.userInfo.avatar).toBe('/uploads/avatars/new.png')
    expect(debugError).toHaveBeenCalledWith('刷新当前用户头像失败:', expect.any(Error))
    expect(messages.error).not.toHaveBeenCalled()
  })

  it('keeps newer order stats when older request resolves later', async () => {
    const first = deferred<any>()
    const second = deferred<any>()
    orderApi.getOrders
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)
    axiosMock.get.mockReset()
    axiosMock.get
      .mockResolvedValueOnce({ code: 200, data: [] })
      .mockResolvedValueOnce({ code: 200, data: 0 })

    const wrapper = mountView()
    await flushPromises()

    const vm = wrapper.vm as any
    const secondLoad = vm.loadOrderStats()
    await flushPromises()

    second.resolve({
      code: 200,
      data: [
        { id: 1, orderStatus: 0, items: [] },
        { id: 2, orderStatus: 2, items: [] }
      ]
    })
    await secondLoad
    await flushPromises()

    expect(vm.orderCount).toBe(2)
    expect(vm.pendingReceive).toBe(1)

    first.resolve({
      code: 200,
      data: [{ id: 1, orderStatus: 1, items: [] }]
    })
    await flushPromises()

    expect(vm.orderCount).toBe(2)
    expect(vm.pendingReceive).toBe(1)
  })
})
