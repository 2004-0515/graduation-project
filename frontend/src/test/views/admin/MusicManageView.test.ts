import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { musicApi, messages, messageBox, debugError } = vi.hoisted(() => ({
  musicApi: {
    getAllMusic: vi.fn(),
    uploadMusic: vi.fn(),
    uploadCover: vi.fn(),
    addMusic: vi.fn(),
    updateMusic: vi.fn(),
    updateStatus: vi.fn(),
    deleteMusic: vi.fn()
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

vi.mock('@/api/musicApi', () => ({
  default: musicApi
}))

vi.mock('@/utils/debug', () => ({
  debugError
}))

import MusicManageView from '@/views/admin/MusicManageView.vue'

const deferred = <T>() => {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('MusicManageView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    messageBox.confirm.mockResolvedValue(undefined)
    musicApi.getAllMusic.mockResolvedValue({
      code: 200,
      data: [{ id: 1, title: '歌曲A', artist: '歌手A', url: '/a.mp3', status: 1 }]
    })
  })

  const mountView = () =>
    mount(MusicManageView, {
      global: {
        directives: {
          loading: {}
        },
        stubs: {
          AdminLayout: { template: '<div><slot /></div>' },
          ElInput: true,
          ElButton: { template: '<button @click="$emit(\'click\')"><slot /></button>' },
          ElTable: { props: ['data'], template: '<div><slot /></div>' },
          ElTableColumn: { template: '<div><slot :row="$attrs.row || {}" :$index="0" /></div>' },
          ElSwitch: true,
          ElDialog: { template: '<div><slot /><slot name="footer" /></div>' },
          ElForm: { template: '<form><slot /></form>' },
          ElFormItem: { template: '<div><slot /></div>' },
          ElUpload: { template: '<div><slot /></div>' },
          ElInputNumber: true
        }
      }
    })

  it('logs when music list returns non-200 payload', async () => {
    musicApi.getAllMusic.mockResolvedValue({ code: 500, message: '读取失败' })

    mountView()
    await flushPromises()

    expect(debugError).toHaveBeenCalledWith('加载音乐列表失败:', '读取失败')
  })

  it('does not show error when delete confirmation is cancelled', async () => {
    messageBox.confirm.mockRejectedValue('cancel')
    const wrapper = mountView()

    await flushPromises()
    await (wrapper.vm as unknown as { handleDelete: (id: number) => Promise<void> }).handleDelete(1)
    await flushPromises()

    expect(musicApi.deleteMusic).not.toHaveBeenCalled()
    expect(messages.error).not.toHaveBeenCalled()
  })

  it('shows backend message when deleting music fails', async () => {
    musicApi.deleteMusic.mockRejectedValue({
      response: {
        data: {
          message: '删除失败'
        }
      }
    })
    const wrapper = mountView()

    await flushPromises()
    await (wrapper.vm as unknown as { handleDelete: (id: number) => Promise<void> }).handleDelete(1)
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('删除失败')
    expect(debugError).toHaveBeenCalled()
  })

  it('shows backend message when status update returns non-200 payload', async () => {
    musicApi.updateStatus.mockResolvedValue({ code: 500, message: '状态更新失败' })
    const wrapper = mountView()

    await flushPromises()
    await (wrapper.vm as unknown as { handleStatusChange: (id: number, enabled: boolean) => Promise<void> }).handleStatusChange(1, false)
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('状态更新失败')
    expect(debugError).toHaveBeenCalledWith('更新音乐状态失败', '状态更新失败')
  })

  it('logs backend message when submitting new music returns non-200 payload', async () => {
    musicApi.addMusic.mockResolvedValue({ code: 500, message: '音乐保存失败' })
    const wrapper = mountView()

    await flushPromises()
    ;(wrapper.vm as any).form.title = '歌曲A'
    ;(wrapper.vm as any).form.artist = '歌手A'
    ;(wrapper.vm as any).form.url = '/a.mp3'
    ;(wrapper.vm as any).form.cover = ''
    ;(wrapper.vm as any).form.sortOrder = 1
    ;(wrapper.vm as any).form.statusBool = true

    await (wrapper.vm as any).handleSubmit()
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('音乐保存失败')
    expect(debugError).toHaveBeenCalledWith('提交音乐失败', '音乐保存失败')
  })

  it('keeps edit successful with local music update when refresh fails afterward', async () => {
    musicApi.updateMusic.mockResolvedValue({
      code: 200,
      message: '更新成功',
      data: { id: 1, title: '歌曲A-新版', artist: '歌手B', url: '/b.mp3', cover: '/b.png', sortOrder: 9, status: 0 }
    })
    musicApi.getAllMusic
      .mockResolvedValueOnce({
        code: 200,
        data: [{ id: 1, title: '歌曲A', artist: '歌手A', url: '/a.mp3', cover: '', sortOrder: 1, status: 1 }]
      })
      .mockRejectedValueOnce(new Error('refresh failed'))

    const wrapper = mountView()
    await flushPromises()

    ;(wrapper.vm as any).isEdit = true
    ;(wrapper.vm as any).editId = 1
    ;(wrapper.vm as any).form.title = '歌曲A-新版'
    ;(wrapper.vm as any).form.artist = '歌手B'
    ;(wrapper.vm as any).form.url = '/b.mp3'
    ;(wrapper.vm as any).form.cover = '/b.png'
    ;(wrapper.vm as any).form.sortOrder = 9
    ;(wrapper.vm as any).form.statusBool = false

    await (wrapper.vm as any).handleSubmit()
    await flushPromises()

    expect(messages.success).toHaveBeenCalledWith('更新成功')
    expect(messages.error).not.toHaveBeenCalled()
    expect((wrapper.vm as any).musicList).toEqual([
      expect.objectContaining({
        id: 1,
        title: '歌曲A-新版',
        artist: '歌手B',
        url: '/b.mp3',
        cover: '/b.png',
        sortOrder: 9,
        status: 0
      })
    ])
    expect(debugError).toHaveBeenCalledWith('加载音乐列表失败', expect.any(Error))
  })

  it('keeps add successful with local music append when refresh fails afterward', async () => {
    musicApi.addMusic.mockResolvedValue({
      code: 200,
      message: '添加成功',
      data: { id: 2, title: '歌曲B', artist: '歌手B', url: '/b.mp3', cover: '/b.png', sortOrder: 2, status: 1 }
    })
    musicApi.getAllMusic
      .mockResolvedValueOnce({
        code: 200,
        data: [{ id: 1, title: '歌曲A', artist: '歌手A', url: '/a.mp3', cover: '', sortOrder: 1, status: 1 }]
      })
      .mockRejectedValueOnce(new Error('refresh failed'))

    const wrapper = mountView()
    await flushPromises()

    ;(wrapper.vm as any).form.title = '歌曲B'
    ;(wrapper.vm as any).form.artist = '歌手B'
    ;(wrapper.vm as any).form.url = '/b.mp3'
    ;(wrapper.vm as any).form.cover = '/b.png'
    ;(wrapper.vm as any).form.sortOrder = 2
    ;(wrapper.vm as any).form.statusBool = true

    await (wrapper.vm as any).handleSubmit()
    await flushPromises()

    expect(messages.success).toHaveBeenCalledWith('添加成功')
    expect((wrapper.vm as any).musicList).toEqual([
      expect.objectContaining({ id: 2, title: '歌曲B', artist: '歌手B' }),
      expect.objectContaining({ id: 1, title: '歌曲A', artist: '歌手A' })
    ])
    expect(debugError).toHaveBeenCalledWith('加载音乐列表失败', expect.any(Error))
  })

  it('refreshes music list after status update succeeds', async () => {
    musicApi.updateStatus.mockResolvedValue({ code: 200, message: '状态更新成功' })
    const wrapper = mountView()

    await flushPromises()
    await (wrapper.vm as unknown as { handleStatusChange: (id: number, enabled: boolean) => Promise<void> }).handleStatusChange(1, false)
    await flushPromises()

    expect(musicApi.getAllMusic).toHaveBeenCalledTimes(2)
    expect(messages.success).toHaveBeenCalledWith('状态更新成功')
  })

  it('keeps status update successful when music refresh fails afterward', async () => {
    musicApi.updateStatus.mockResolvedValue({ code: 200, message: '状态更新成功' })
    musicApi.getAllMusic
      .mockResolvedValueOnce({
        code: 200,
        data: [{ id: 1, title: '歌曲A', artist: '歌手A', url: '/a.mp3', status: 1 }]
      })
      .mockRejectedValueOnce(new Error('refresh failed'))
    const wrapper = mountView()

    await flushPromises()
    await (wrapper.vm as unknown as { handleStatusChange: (id: number, enabled: boolean) => Promise<void> }).handleStatusChange(1, false)
    await flushPromises()

    expect(messages.success).toHaveBeenCalledWith('状态更新成功')
    expect(messages.error).not.toHaveBeenCalled()
    expect(debugError).toHaveBeenCalledWith('加载音乐列表失败', expect.any(Error))
  })

  it('refreshes music list after deleting music successfully', async () => {
    musicApi.deleteMusic.mockResolvedValue({ code: 200, message: '删除成功' })
    const wrapper = mountView()

    await flushPromises()
    await (wrapper.vm as unknown as { handleDelete: (id: number) => Promise<void> }).handleDelete(1)
    await flushPromises()

    expect(musicApi.getAllMusic).toHaveBeenCalledTimes(2)
    expect(messages.success).toHaveBeenCalledWith('删除成功')
  })

  it('keeps newer music list when older request resolves later', async () => {
    const first = deferred<any>()
    const second = deferred<any>()
    musicApi.getAllMusic
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)

    const wrapper = mountView()
    await flushPromises()

    const vm = wrapper.vm as unknown as { loadMusic: () => Promise<void> }
    const secondLoad = vm.loadMusic()
    await flushPromises()

    second.resolve({
      code: 200,
      data: [{ id: 2, title: '新歌曲', artist: '新歌手', url: '/new.mp3', status: 1 }]
    })
    await secondLoad
    await flushPromises()

    expect((wrapper.vm as any).musicList).toEqual([
      { id: 2, title: '新歌曲', artist: '新歌手', url: '/new.mp3', status: 1 }
    ])

    first.resolve({
      code: 200,
      data: [{ id: 1, title: '旧歌曲', artist: '旧歌手', url: '/old.mp3', status: 1 }]
    })
    await flushPromises()

    expect((wrapper.vm as any).musicList).toEqual([
      { id: 2, title: '新歌曲', artist: '新歌手', url: '/new.mp3', status: 1 }
    ])
  })

  it('does not let an in-flight music request overwrite local status update success', async () => {
    const first = deferred<any>()
    const second = deferred<any>()
    musicApi.getAllMusic
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)
    musicApi.updateStatus.mockResolvedValue({ code: 200, message: '状态更新成功' })

    const wrapper = mountView()
    await flushPromises()
    ;(wrapper.vm as any).musicList = [{ id: 1, title: '歌曲A', artist: '歌手A', url: '/a.mp3', status: 1 }]

    const statusPromise = (wrapper.vm as any).handleStatusChange(1, false)
    await flushPromises()

    expect((wrapper.vm as any).musicList[0].status).toBe(0)

    second.resolve({
      code: 200,
      data: [{ id: 1, title: '歌曲A', artist: '歌手A', url: '/a.mp3', status: 0 }]
    })
    await statusPromise
    await flushPromises()

    first.resolve({
      code: 200,
      data: [{ id: 1, title: '歌曲A', artist: '歌手A', url: '/a.mp3', status: 1 }]
    })
    await flushPromises()

    expect((wrapper.vm as any).musicList[0].status).toBe(0)
  })

  it('does not let an in-flight music request restore deleted music', async () => {
    const first = deferred<any>()
    const second = deferred<any>()
    musicApi.getAllMusic
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)
    musicApi.deleteMusic.mockResolvedValue({ code: 200, message: '删除成功' })

    const wrapper = mountView()
    await flushPromises()
    ;(wrapper.vm as any).musicList = [{ id: 1, title: '歌曲A', artist: '歌手A', url: '/a.mp3', status: 1 }]

    const deletePromise = (wrapper.vm as any).handleDelete(1)
    await flushPromises()

    expect((wrapper.vm as any).musicList).toEqual([])

    second.resolve({ code: 200, data: [] })
    await deletePromise
    await flushPromises()

    first.resolve({
      code: 200,
      data: [{ id: 1, title: '歌曲A', artist: '歌手A', url: '/a.mp3', status: 1 }]
    })
    await flushPromises()

    expect((wrapper.vm as any).musicList).toEqual([])
  })

  it('does not let an in-flight music request overwrite local edit success', async () => {
    const first = deferred<any>()
    const second = deferred<any>()
    musicApi.getAllMusic
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)
    musicApi.updateMusic.mockResolvedValue({
      code: 200,
      message: '更新成功',
      data: { id: 1, title: '歌曲A-新版', artist: '歌手B', url: '/b.mp3', cover: '/b.png', sortOrder: 9, status: 0 }
    })

    const wrapper = mountView()
    await flushPromises()
    ;(wrapper.vm as any).musicList = [{ id: 1, title: '歌曲A', artist: '歌手A', url: '/a.mp3', cover: '', sortOrder: 1, status: 1 }]
    ;(wrapper.vm as any).isEdit = true
    ;(wrapper.vm as any).editId = 1
    ;(wrapper.vm as any).form.title = '歌曲A-新版'
    ;(wrapper.vm as any).form.artist = '歌手B'
    ;(wrapper.vm as any).form.url = '/b.mp3'
    ;(wrapper.vm as any).form.cover = '/b.png'
    ;(wrapper.vm as any).form.sortOrder = 9
    ;(wrapper.vm as any).form.statusBool = false

    const submitPromise = (wrapper.vm as any).handleSubmit()
    await flushPromises()

    expect((wrapper.vm as any).musicList).toEqual([
      expect.objectContaining({ id: 1, title: '歌曲A-新版', status: 0 })
    ])

    second.resolve({
      code: 200,
      data: [{ id: 1, title: '歌曲A-新版', artist: '歌手B', url: '/b.mp3', cover: '/b.png', sortOrder: 9, status: 0 }]
    })
    await submitPromise
    await flushPromises()

    first.resolve({
      code: 200,
      data: [{ id: 1, title: '歌曲A', artist: '歌手A', url: '/a.mp3', cover: '', sortOrder: 1, status: 1 }]
    })
    await flushPromises()

    expect((wrapper.vm as any).musicList).toEqual([
      expect.objectContaining({
        id: 1,
        title: '歌曲A-新版',
        artist: '歌手B',
        url: '/b.mp3',
        cover: '/b.png',
        sortOrder: 9,
        status: 0
      })
    ])
  })

  it('closes music dialog when refreshed list no longer contains the editing item', async () => {
    musicApi.getAllMusic
      .mockResolvedValueOnce({
        code: 200,
        data: [{ id: 1, title: '歌曲A', artist: '歌手A', url: '/a.mp3', cover: '', sortOrder: 1, status: 1 }]
      })
      .mockResolvedValueOnce({
        code: 200,
        data: [{ id: 2, title: '歌曲B', artist: '歌手B', url: '/b.mp3', cover: '/b.png', sortOrder: 2, status: 1 }]
      })

    const wrapper = mountView()
    await flushPromises()

    ;(wrapper.vm as any).openEditDialog({ id: 1, title: '歌曲A', artist: '歌手A', url: '/a.mp3', cover: '', sortOrder: 1, status: 1 })

    await (wrapper.vm as any).loadMusic()
    await flushPromises()

    expect((wrapper.vm as any).dialogVisible).toBe(false)
    expect((wrapper.vm as any).isEdit).toBe(false)
    expect((wrapper.vm as any).editId).toBeNull()
    expect((wrapper.vm as any).form.title).toBe('')
    expect((wrapper.vm as any).form.url).toBe('')
  })
})
