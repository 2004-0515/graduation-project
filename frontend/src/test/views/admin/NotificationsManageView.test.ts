import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { adminApi, couponApi, messages, debugError } = vi.hoisted(() => ({
  adminApi: {
    getUsers: vi.fn(),
    broadcastNotification: vi.fn()
  },
  couponApi: {
    getAllCoupons: vi.fn()
  },
  messages: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn()
  },
  debugError: vi.fn()
}))

vi.mock('element-plus', () => ({
  ElMessage: messages
}))

vi.mock('@/api/adminApi', () => ({
  default: adminApi
}))

vi.mock('@/api/couponApi', () => ({
  default: couponApi
}))

vi.mock('@/utils/debug', () => ({
  debugError
}))

import NotificationsManageView from '@/views/admin/NotificationsManageView.vue'

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
  mount(NotificationsManageView, {
    global: {
      stubs: {
        AdminLayout: { template: '<div><slot /></div>' },
        ElForm: { template: '<form><slot /></form>' },
        ElFormItem: { template: '<div><slot /></div>' },
        ElRadioGroup: { template: '<div><slot /></div>' },
        ElRadio: { template: '<label><slot /></label>' },
        ElSelect: { template: '<div><slot /></div>' },
        ElOption: true,
        ElInput: true,
        ElButton: { template: '<button @click="$emit(\'click\')"><slot /></button>' },
        ElIcon: { template: '<i><slot /></i>' },
        Promotion: true
      }
    }
  })

describe('NotificationsManageView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    adminApi.getUsers.mockResolvedValue({ code: 200, data: [{ id: 1, username: 'user1', email: 'a@test.com' }] })
    couponApi.getAllCoupons.mockResolvedValue({ code: 200, data: [] })
  })

  it('shows backend message when broadcasting notification returns non-200 payload', async () => {
    adminApi.broadcastNotification.mockResolvedValue({ code: 500, message: '消息发送失败' })

    const wrapper = mountView()
    await flushPromises()

    ;(wrapper.vm as any).form.title = '测试标题'
    ;(wrapper.vm as any).form.message = '测试内容'
    await (wrapper.vm as any).sendMessage()
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('消息发送失败')
    expect(debugError).toHaveBeenCalledWith('发送消息失败', '消息发送失败')
  })

  it('shows backend message when broadcasting notification throws', async () => {
    adminApi.broadcastNotification.mockRejectedValue({ response: { data: { message: '通知服务异常' } } })

    const wrapper = mountView()
    await flushPromises()

    ;(wrapper.vm as any).form.title = '测试标题'
    ;(wrapper.vm as any).form.message = '测试内容'
    await (wrapper.vm as any).sendMessage()
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('通知服务异常')
    expect(debugError).toHaveBeenCalled()
  })

  it('logs non-200 payload when loading users fails', async () => {
    adminApi.getUsers.mockResolvedValue({ code: 500, message: '用户列表异常' })

    mountView()
    await flushPromises()

    expect(debugError).toHaveBeenCalledWith('获取通知发送用户列表失败', '用户列表异常')
  })

  it('keeps newer users list when older request resolves later', async () => {
    const first = deferred<any>()
    const second = deferred<any>()
    adminApi.getUsers
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)
    couponApi.getAllCoupons.mockResolvedValue({ code: 200, data: [] })

    const wrapper = mountView()
    await flushPromises()

    const vm = wrapper.vm as any
    const secondFetch = vm.fetchUsers()
    await flushPromises()

    second.resolve({ code: 200, data: [{ id: 2, username: 'new-user', email: 'new@test.com' }] })
    await secondFetch
    await flushPromises()

    expect(vm.users).toEqual([{ id: 2, username: 'new-user', email: 'new@test.com' }])

    first.resolve({ code: 200, data: [{ id: 1, username: 'old-user', email: 'old@test.com' }] })
    await flushPromises()

    expect(vm.users).toEqual([{ id: 2, username: 'new-user', email: 'new@test.com' }])
  })

  it('clears selected users that disappear after users list refresh', async () => {
    adminApi.getUsers
      .mockResolvedValueOnce({ code: 200, data: [{ id: 1, username: 'user1', email: 'a@test.com' }, { id: 2, username: 'user2', email: 'b@test.com' }] })
      .mockResolvedValueOnce({ code: 200, data: [{ id: 2, username: 'user2', email: 'b@test.com' }] })

    const wrapper = mountView()
    await flushPromises()

    ;(wrapper.vm as any).form.target = 'selected'
    ;(wrapper.vm as any).form.selectedUsers = [1, 2]

    await (wrapper.vm as any).fetchUsers()
    await flushPromises()

    expect((wrapper.vm as any).users).toEqual([{ id: 2, username: 'user2', email: 'b@test.com' }])
    expect((wrapper.vm as any).form.selectedUsers).toEqual([2])
  })

  it('clears related coupon when refreshed coupon list no longer contains it', async () => {
    couponApi.getAllCoupons
      .mockResolvedValueOnce({ code: 200, data: [{ id: 8, name: '老券' }] })
      .mockResolvedValueOnce({ code: 200, data: [] })

    const wrapper = mountView()
    await flushPromises()

    ;(wrapper.vm as any).form.type = 'promotion'
    ;(wrapper.vm as any).form.relatedId = 8

    await (wrapper.vm as any).fetchCoupons()
    await flushPromises()

    expect((wrapper.vm as any).coupons).toEqual([])
    expect((wrapper.vm as any).form.relatedId).toBeNull()
  })
})
