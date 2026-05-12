import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { axiosMock, adminStore, messages, messageBox, debugError } = vi.hoisted(() => ({
  axiosMock: {
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  },
  adminStore: {
    fetchPendingFileCount: vi.fn(),
    decreasePendingFileCount: vi.fn()
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

vi.mock('@/utils/axios', () => ({
  default: axiosMock
}))

vi.mock('@/api/fileApi', () => ({
  default: {
    getImageUrl: vi.fn(() => '/img.png')
  }
}))

vi.mock('@/stores/adminStore', () => ({
  useAdminStore: () => adminStore
}))

vi.mock('@/utils/debug', () => ({
  debugError
}))

import FileReviewView from '@/views/admin/FileReviewView.vue'

function createDeferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

const pendingFile = {
  id: 1,
  filePath: '/file.png',
  originalName: '头像.png',
  fileType: 'AVATAR',
  username: 'buyer',
  status: 0,
  createdTime: '2026-05-09T10:00:00'
}

const mountView = () =>
  mount(FileReviewView, {
    global: {
      stubs: {
        AdminLayout: { template: '<div><slot /></div>' },
        ElSelect: { template: '<div><slot /></div>' },
        ElOption: true,
        ElButton: { template: '<button @click="$emit(\'click\')"><slot /></button>' },
        ElPagination: true,
        ElDialog: { template: '<div><slot /><slot name="footer" /></div>' },
        ElInput: true
      }
    }
  })

describe('FileReviewView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    messageBox.confirm.mockResolvedValue(undefined)
    axiosMock.get.mockResolvedValue({ code: 200, data: { content: [pendingFile], totalElements: 1 } })
  })

  it('shows backend message when approve review throws', async () => {
    axiosMock.put.mockRejectedValue({ response: { data: { message: '审核失败' } } })
    const wrapper = mountView()
    await flushPromises()

    await (wrapper.vm as any).handleReview(pendingFile, 1)
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('审核失败')
    expect(debugError).toHaveBeenCalled()
  })

  it('shows backend message when approve review returns non-200 payload', async () => {
    axiosMock.put.mockResolvedValue({ code: 500, message: '审核状态非法' })
    const wrapper = mountView()
    await flushPromises()

    await (wrapper.vm as any).handleReview(pendingFile, 1)
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('审核状态非法')
    expect(debugError).toHaveBeenCalledWith('文件审核通过失败', '审核状态非法')
  })

  it('shows backend message when reject review returns non-200 payload', async () => {
    axiosMock.put.mockResolvedValue({ code: 500, message: '拒绝原因校验失败' })
    const wrapper = mountView()
    await flushPromises()

    ;(wrapper.vm as any).currentFile = pendingFile
    ;(wrapper.vm as any).rejectRemark = '不合规'
    await (wrapper.vm as any).confirmReject()
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('拒绝原因校验失败')
    expect(debugError).toHaveBeenCalledWith('文件审核拒绝失败', '拒绝原因校验失败')
  })

  it('does not show an error when deleting file record is cancelled', async () => {
    messageBox.confirm.mockRejectedValue('cancel')
    const wrapper = mountView()
    await flushPromises()

    await (wrapper.vm as any).handleDelete(pendingFile)
    await flushPromises()

    expect(axiosMock.delete).not.toHaveBeenCalled()
    expect(messages.error).not.toHaveBeenCalled()
  })

  it('shows backend message when deleting file record throws', async () => {
    axiosMock.delete.mockRejectedValue({ response: { data: { message: '删除记录失败' } } })
    const wrapper = mountView()
    await flushPromises()

    await (wrapper.vm as any).handleDelete(pendingFile)
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('删除记录失败')
    expect(debugError).toHaveBeenCalled()
  })

  it('shows backend message when deleting file record returns non-200 payload', async () => {
    axiosMock.delete.mockResolvedValue({ code: 500, message: '文件记录已锁定' })
    const wrapper = mountView()
    await flushPromises()

    await (wrapper.vm as any).handleDelete(pendingFile)
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('文件记录已锁定')
    expect(debugError).toHaveBeenCalledWith('删除文件审核记录失败', '文件记录已锁定')
  })

  it('refreshes files after approving review successfully', async () => {
    axiosMock.put.mockResolvedValue({ code: 200 })
    const wrapper = mountView()
    await flushPromises()

    await (wrapper.vm as any).handleReview(pendingFile, 1)
    await flushPromises()

    expect(axiosMock.get).toHaveBeenCalledTimes(2)
    expect(adminStore.fetchPendingFileCount).toHaveBeenCalled()
    expect(adminStore.decreasePendingFileCount).toHaveBeenCalled()
    expect(messages.success).toHaveBeenCalledWith('审核通过')
  })

  it('keeps approve success when refreshing files fails afterward', async () => {
    axiosMock.put.mockResolvedValue({ code: 200 })
    axiosMock.get
      .mockResolvedValueOnce({ code: 200, data: { content: [pendingFile], totalElements: 1 } })
      .mockRejectedValue(new Error('刷新失败'))

    const wrapper = mountView()
    await flushPromises()

    await (wrapper.vm as any).handleReview(pendingFile, 1)
    await flushPromises()

    expect(messages.success).toHaveBeenCalledWith('审核通过')
    expect(messages.error).not.toHaveBeenCalledWith('刷新失败')
    expect(debugError).toHaveBeenCalledWith('获取文件审核列表失败', expect.any(Error))
  })

  it('keeps delete success when refreshing files fails afterward', async () => {
    axiosMock.delete.mockResolvedValue({ code: 200 })
    axiosMock.get
      .mockResolvedValueOnce({ code: 200, data: { content: [pendingFile], totalElements: 1 } })
      .mockRejectedValue(new Error('刷新失败'))

    const wrapper = mountView()
    await flushPromises()

    await (wrapper.vm as any).handleDelete(pendingFile)
    await flushPromises()

    expect(messages.success).toHaveBeenCalledWith('删除成功')
    expect(adminStore.decreasePendingFileCount).toHaveBeenCalled()
    expect(messages.error).not.toHaveBeenCalledWith('刷新失败')
    expect(debugError).toHaveBeenCalledWith('获取文件审核列表失败', expect.any(Error))
  })

  it('ignores stale file list responses when a newer refresh finishes first', async () => {
    const firstRequest = createDeferred<any>()
    const secondRequest = createDeferred<any>()

    axiosMock.get
      .mockImplementationOnce(() => firstRequest.promise)
      .mockImplementationOnce(() => secondRequest.promise)

    const wrapper = mountView()
    await flushPromises()

    const vm = wrapper.vm as any
    const refetchPromise = vm.fetchFiles()
    await flushPromises()

    secondRequest.resolve({
      code: 200,
      data: {
        content: [{ ...pendingFile, id: 2, originalName: '新头像.png' }],
        totalElements: 1
      }
    })
    await refetchPromise
    await flushPromises()

    expect(vm.files[0].originalName).toBe('新头像.png')

    firstRequest.resolve({
      code: 200,
      data: {
        content: [{ ...pendingFile, id: 1, originalName: '旧头像.png' }],
        totalElements: 1
      }
    })
    await flushPromises()

    expect(vm.files[0].originalName).toBe('新头像.png')
  })

  it('does not let an in-flight file request overwrite local approve success', async () => {
    const firstRequest = createDeferred<any>()
    const secondRequest = createDeferred<any>()

    axiosMock.get
      .mockImplementationOnce(() => firstRequest.promise)
      .mockImplementationOnce(() => secondRequest.promise)
    axiosMock.put.mockResolvedValue({ code: 200 })

    const wrapper = mountView()
    await flushPromises()
    ;(wrapper.vm as any).files = [pendingFile]
    ;(wrapper.vm as any).total = 1

    const approvePromise = (wrapper.vm as any).handleReview(pendingFile, 1)
    await flushPromises()

    expect((wrapper.vm as any).files).toEqual([])

    secondRequest.resolve({ code: 200, data: { content: [], totalElements: 0 } })
    await approvePromise
    await flushPromises()

    firstRequest.resolve({ code: 200, data: { content: [pendingFile], totalElements: 1 } })
    await flushPromises()

    expect((wrapper.vm as any).files).toEqual([])
  })

  it('does not let an in-flight file request overwrite local delete success', async () => {
    const firstRequest = createDeferred<any>()
    const secondRequest = createDeferred<any>()

    axiosMock.get
      .mockImplementationOnce(() => firstRequest.promise)
      .mockImplementationOnce(() => secondRequest.promise)
    axiosMock.delete.mockResolvedValue({ code: 200 })

    const wrapper = mountView()
    await flushPromises()
    ;(wrapper.vm as any).files = [pendingFile]
    ;(wrapper.vm as any).total = 1

    const deletePromise = (wrapper.vm as any).handleDelete(pendingFile)
    await flushPromises()

    expect((wrapper.vm as any).files).toEqual([])

    secondRequest.resolve({ code: 200, data: { content: [], totalElements: 0 } })
    await deletePromise
    await flushPromises()

    firstRequest.resolve({ code: 200, data: { content: [pendingFile], totalElements: 1 } })
    await flushPromises()

    expect((wrapper.vm as any).files).toEqual([])
  })

  it('clears reject dialog state after rejecting a file successfully', async () => {
    axiosMock.put.mockResolvedValue({ code: 200 })
    const wrapper = mountView()
    await flushPromises()

    ;(wrapper.vm as any).currentFile = pendingFile
    ;(wrapper.vm as any).rejectRemark = '不合规'
    ;(wrapper.vm as any).rejectVisible = true

    await (wrapper.vm as any).confirmReject()
    await flushPromises()

    expect((wrapper.vm as any).rejectVisible).toBe(false)
    expect((wrapper.vm as any).rejectRemark).toBe('')
    expect((wrapper.vm as any).currentFile).toBeNull()
  })
})
