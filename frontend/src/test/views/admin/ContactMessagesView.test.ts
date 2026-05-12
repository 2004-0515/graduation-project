import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { adminApi, messages, messageBox, debugError } = vi.hoisted(() => ({
  adminApi: {
    getContactMessages: vi.fn(),
    updateContactMessageStatus: vi.fn(),
    deleteContactMessage: vi.fn()
  },
  messages: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn()
  },
  messageBox: {
    confirm: vi.fn()
  },
  debugError: vi.fn()
}))

vi.mock('element-plus', () => ({
  ElMessage: messages,
  ElMessageBox: messageBox
}))

vi.mock('@/api/adminApi', () => ({
  default: adminApi
}))

vi.mock('@/utils/debug', () => ({
  debugError
}))

import ContactMessagesView from '@/views/admin/ContactMessagesView.vue'

function createDeferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

const mountView = () =>
  mount(ContactMessagesView, {
    global: {
      directives: {
        loading: {}
      },
      stubs: {
        AdminLayout: { template: '<div><slot /></div>' },
        ElTable: { props: ['data'], template: '<div><slot /></div>' },
        ElTableColumn: { template: '<div><slot :row="$attrs.row || {}" /></div>' },
        ElTag: true,
        ElButton: { template: '<button @click="$emit(\'click\')"><slot /></button>' },
        ElSelect: true,
        ElOption: true
      }
    }
  })

describe('ContactMessagesView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    messageBox.confirm.mockResolvedValue(undefined)
    adminApi.getContactMessages.mockResolvedValue({
      code: 200,
      data: [
        {
          id: 1,
          name: '张三',
          contact: '13800138000',
          type: 'order',
          content: '订单问题',
          status: 'pending',
          createdTime: '2026-05-09T19:00:00'
        }
      ]
    })
  })

  it('logs non-200 payload when loading messages fails', async () => {
    adminApi.getContactMessages.mockResolvedValue({ code: 500, message: '留言列表读取失败' })

    mountView()
    await flushPromises()

    expect(debugError).toHaveBeenCalledWith('获取留言列表失败', '留言列表读取失败')
  })

  it('shows backend message when marking handled returns non-200 payload', async () => {
    adminApi.updateContactMessageStatus.mockResolvedValue({ code: 500, message: '状态更新失败' })
    const wrapper = mountView()
    await flushPromises()

    const row = (wrapper.vm as any).messages[0]
    await (wrapper.vm as any).markHandled(row)
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('状态更新失败')
    expect(debugError).toHaveBeenCalledWith('更新留言状态失败', '状态更新失败')
    expect(row.status).toBe('pending')
  })

  it('refreshes messages after marking handled successfully', async () => {
    adminApi.updateContactMessageStatus.mockResolvedValue({ code: 200, message: '留言状态更新成功' })
    adminApi.getContactMessages
      .mockResolvedValueOnce({
        code: 200,
        data: [
          {
            id: 1,
            name: '张三',
            contact: '13800138000',
            type: 'order',
            content: '订单问题',
            status: 'pending',
            createdTime: '2026-05-09T19:00:00'
          }
        ]
      })
      .mockResolvedValueOnce({
        code: 200,
        data: [
          {
            id: 1,
            name: '张三',
            contact: '13800138000',
            type: 'order',
            content: '订单问题',
            status: 'handled',
            createdTime: '2026-05-09T19:00:00'
          }
        ]
      })
    const wrapper = mountView()
    await flushPromises()

    const row = (wrapper.vm as any).messages[0]
    await (wrapper.vm as any).markHandled(row)
    await flushPromises()

    expect((wrapper.vm as any).messages[0].status).toBe('handled')
    expect(adminApi.getContactMessages).toHaveBeenCalledTimes(2)
    expect(messages.success).toHaveBeenCalledWith('留言状态更新成功')
  })

  it('refreshes messages after deleting successfully', async () => {
    adminApi.deleteContactMessage.mockResolvedValue({ code: 200, message: '删除成功' })
    adminApi.getContactMessages
      .mockResolvedValueOnce({
        code: 200,
        data: [
          {
            id: 1,
            name: '张三',
            contact: '13800138000',
            type: 'order',
            content: '订单问题',
            status: 'pending',
            createdTime: '2026-05-09T19:00:00'
          }
        ]
      })
      .mockResolvedValueOnce({ code: 200, data: [] })

    const wrapper = mountView()
    await flushPromises()

    const row = (wrapper.vm as any).messages[0]
    await (wrapper.vm as any).handleDelete(row)
    await flushPromises()

    expect(adminApi.getContactMessages).toHaveBeenCalledTimes(2)
    expect((wrapper.vm as any).messages).toHaveLength(0)
    expect(messages.success).toHaveBeenCalledWith('删除成功')
  })

  it('keeps mark-handled success when refreshing messages fails afterward', async () => {
    adminApi.updateContactMessageStatus.mockResolvedValue({ code: 200, message: '留言状态更新成功' })
    adminApi.getContactMessages
      .mockResolvedValueOnce({
        code: 200,
        data: [
          {
            id: 1,
            name: '张三',
            contact: '13800138000',
            type: 'order',
            content: '订单问题',
            status: 'pending',
            createdTime: '2026-05-09T19:00:00'
          }
        ]
      })
      .mockRejectedValue(new Error('刷新失败'))

    const wrapper = mountView()
    await flushPromises()

    const row = (wrapper.vm as any).messages[0]
    await (wrapper.vm as any).markHandled(row)
    await flushPromises()

    expect(messages.success).toHaveBeenCalledWith('留言状态更新成功')
    expect(messages.error).not.toHaveBeenCalledWith('刷新失败')
    expect(debugError).toHaveBeenCalledWith('获取留言列表失败', expect.any(Error))
  })

  it('keeps delete-message success when refreshing messages fails afterward', async () => {
    adminApi.deleteContactMessage.mockResolvedValue({ code: 200, message: '删除成功' })
    adminApi.getContactMessages
      .mockResolvedValueOnce({
        code: 200,
        data: [
          {
            id: 1,
            name: '张三',
            contact: '13800138000',
            type: 'order',
            content: '订单问题',
            status: 'pending',
            createdTime: '2026-05-09T19:00:00'
          }
        ]
      })
      .mockRejectedValue(new Error('刷新失败'))

    const wrapper = mountView()
    await flushPromises()

    const row = (wrapper.vm as any).messages[0]
    await (wrapper.vm as any).handleDelete(row)
    await flushPromises()

    expect(messages.success).toHaveBeenCalledWith('删除成功')
    expect(messages.error).not.toHaveBeenCalledWith('刷新失败')
    expect(debugError).toHaveBeenCalledWith('获取留言列表失败', expect.any(Error))
  })

  it('does not show error when admin cancels deletion', async () => {
    messageBox.confirm.mockRejectedValue('cancel')
    const wrapper = mountView()
    await flushPromises()

    const row = (wrapper.vm as any).messages[0]
    await (wrapper.vm as any).handleDelete(row)
    await flushPromises()

    expect(adminApi.deleteContactMessage).not.toHaveBeenCalled()
    expect(messages.error).not.toHaveBeenCalled()
  })

  it('shows backend message when deleting message returns non-200 payload', async () => {
    adminApi.deleteContactMessage.mockResolvedValue({ code: 500, message: '留言删除失败' })
    const wrapper = mountView()
    await flushPromises()

    const row = (wrapper.vm as any).messages[0]
    await (wrapper.vm as any).handleDelete(row)
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('留言删除失败')
    expect(debugError).toHaveBeenCalledWith('删除留言失败', '留言删除失败')
  })

  it('ignores stale message list responses when a newer refresh finishes first', async () => {
    const firstRequest = createDeferred<any>()
    const secondRequest = createDeferred<any>()

    adminApi.getContactMessages
      .mockImplementationOnce(() => firstRequest.promise)
      .mockImplementationOnce(() => secondRequest.promise)

    const wrapper = mountView()
    await flushPromises()

    const vm = wrapper.vm as unknown as { fetchMessages: () => Promise<void> }
    const refetchPromise = vm.fetchMessages()
    await flushPromises()

    secondRequest.resolve({
      code: 200,
      data: [
        {
          id: 2,
          name: '李四',
          contact: 'buyer@example.com',
          type: 'payment',
          content: '新的留言',
          status: 'handled',
          createdTime: '2026-05-09T20:00:00'
        }
      ]
    })
    await refetchPromise
    await flushPromises()

    expect((wrapper.vm as any).messages[0].name).toBe('李四')

    firstRequest.resolve({
      code: 200,
      data: [
        {
          id: 1,
          name: '张三',
          contact: '13800138000',
          type: 'order',
          content: '旧留言',
          status: 'pending',
          createdTime: '2026-05-09T19:00:00'
        }
      ]
    })
    await flushPromises()

    expect((wrapper.vm as any).messages[0].name).toBe('李四')
  })

  it('does not let an in-flight message request overwrite local handled success', async () => {
    const firstRequest = createDeferred<any>()
    const secondRequest = createDeferred<any>()

    adminApi.getContactMessages
      .mockImplementationOnce(() => firstRequest.promise)
      .mockImplementationOnce(() => secondRequest.promise)
    adminApi.updateContactMessageStatus.mockResolvedValue({ code: 200, message: '留言状态更新成功' })

    const wrapper = mountView()
    await flushPromises()
    ;(wrapper.vm as any).messages = [{
      id: 1,
      name: '张三',
      contact: '13800138000',
      type: 'order',
      content: '订单问题',
      status: 'pending',
      createdTime: '2026-05-09T19:00:00'
    }]

    const handlePromise = (wrapper.vm as any).markHandled((wrapper.vm as any).messages[0])
    await flushPromises()

    expect((wrapper.vm as any).messages[0].status).toBe('handled')

    secondRequest.resolve({
      code: 200,
      data: [{
        id: 1,
        name: '张三',
        contact: '13800138000',
        type: 'order',
        content: '订单问题',
        status: 'handled',
        createdTime: '2026-05-09T19:00:00'
      }]
    })
    await handlePromise
    await flushPromises()

    firstRequest.resolve({
      code: 200,
      data: [{
        id: 1,
        name: '张三',
        contact: '13800138000',
        type: 'order',
        content: '订单问题',
        status: 'pending',
        createdTime: '2026-05-09T19:00:00'
      }]
    })
    await flushPromises()

    expect((wrapper.vm as any).messages[0].status).toBe('handled')
  })

  it('does not let an in-flight message request restore deleted messages', async () => {
    const firstRequest = createDeferred<any>()
    const secondRequest = createDeferred<any>()

    adminApi.getContactMessages
      .mockImplementationOnce(() => firstRequest.promise)
      .mockImplementationOnce(() => secondRequest.promise)
    adminApi.deleteContactMessage.mockResolvedValue({ code: 200, message: '删除成功' })

    const wrapper = mountView()
    await flushPromises()
    ;(wrapper.vm as any).messages = [{
      id: 1,
      name: '张三',
      contact: '13800138000',
      type: 'order',
      content: '订单问题',
      status: 'pending',
      createdTime: '2026-05-09T19:00:00'
    }]

    const deletePromise = (wrapper.vm as any).handleDelete((wrapper.vm as any).messages[0])
    await flushPromises()

    expect((wrapper.vm as any).messages).toEqual([])

    secondRequest.resolve({ code: 200, data: [] })
    await deletePromise
    await flushPromises()

    firstRequest.resolve({
      code: 200,
      data: [{
        id: 1,
        name: '张三',
        contact: '13800138000',
        type: 'order',
        content: '订单问题',
        status: 'pending',
        createdTime: '2026-05-09T19:00:00'
      }]
    })
    await flushPromises()

    expect((wrapper.vm as any).messages).toEqual([])
  })
})
