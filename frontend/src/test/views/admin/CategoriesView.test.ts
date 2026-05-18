import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import fileApi from '@/api/fileApi'

const { adminApi, messages, messageBox, debugError } = vi.hoisted(() => ({
  adminApi: {
    getCategories: vi.fn(),
    createCategory: vi.fn(),
    updateCategory: vi.fn(),
    deleteCategory: vi.fn()
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

vi.mock('@element-plus/icons-vue', () => ({
  Plus: { template: '<span />' }
}))

vi.mock('@/api/adminApi', () => ({
  default: adminApi
}))

vi.mock('@/utils/debug', () => ({
  debugError
}))

const uploadCategoryImageSpy = vi.spyOn(fileApi, 'uploadCategoryImage')
const getImageUrlSpy = vi.spyOn(fileApi, 'getImageUrl')

import CategoriesView from '@/views/admin/CategoriesView.vue'

function createDeferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('CategoriesView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    messageBox.confirm.mockResolvedValue(undefined)
    uploadCategoryImageSpy.mockResolvedValue({ code: 200, data: '/uploads/categories/2026/05/icon.png' } as any)
    getImageUrlSpy.mockImplementation((path) => path || '')
    adminApi.getCategories.mockResolvedValue({
      code: 200,
      data: [{ id: 1, name: '分类A', description: '', icon: '', sortOrder: 0, status: 1 }]
    })
  })

  const mountView = () =>
    mount(CategoriesView, {
      global: {
        directives: {
          loading: {}
        },
        stubs: {
          AdminLayout: { template: '<div><slot /></div>' },
          ElButton: { template: '<button v-bind="$attrs" @click="$emit(\'click\')"><slot /></button>' },
          ElTable: { props: ['data'], template: '<div><slot /></div>' },
          ElTableColumn: { template: '<div><slot :row="$attrs.row || {}" /></div>' },
          ElTag: true,
          ElDialog: { template: '<div><slot /><slot name="footer" /></div>' },
          ElForm: { template: '<form><slot /></form>' },
          ElFormItem: { template: '<div><slot /></div>' },
          ElInput: true,
          ElInputNumber: true,
          ElSwitch: true,
          ElUpload: { template: '<div v-bind="$attrs"><slot /></div>' },
          ElIcon: { template: '<span><slot /></span>' }
        }
      }
    })

  it('does not show an error when admin cancels category deletion', async () => {
    messageBox.confirm.mockRejectedValue('cancel')
    const wrapper = mountView()

    await flushPromises()
    await (wrapper.vm as unknown as { handleDelete: (row: { id: number; name: string }) => Promise<void> })
      .handleDelete({ id: 1, name: '分类A' })
    await flushPromises()

    expect(adminApi.deleteCategory).not.toHaveBeenCalled()
    expect(messages.error).not.toHaveBeenCalled()
  })

  it('shows an error when category deletion fails', async () => {
    adminApi.deleteCategory.mockRejectedValue({ response: { data: { message: '分类仍被商品使用' } } })
    const wrapper = mountView()

    await flushPromises()
    await (wrapper.vm as unknown as { handleDelete: (row: { id: number; name: string }) => Promise<void> })
      .handleDelete({ id: 1, name: '分类A' })
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('分类仍被商品使用')
    expect(debugError).toHaveBeenCalled()
  })

  it('shows backend message when saving category fails', async () => {
    adminApi.createCategory.mockRejectedValue({ response: { data: { message: '分类名称已存在' } } })
    const wrapper = mountView()

    await flushPromises()
    await (wrapper.vm as unknown as { openDialog: () => void }).openDialog()
    ;(wrapper.vm as any).form.name = '分类A'
    await (wrapper.vm as unknown as { saveCategory: () => Promise<void> }).saveCategory()
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('分类名称已存在')
    expect(debugError).toHaveBeenCalled()
  })

  it('populates category icon when upload succeeds', async () => {
    const wrapper = mountView()

    await flushPromises()
    await (wrapper.vm as any).handleCategoryIconUpload({
      file: new File(['icon'], 'icon.png', { type: 'image/png' })
    })

    expect((wrapper.vm as any).form.icon).toBe('/uploads/categories/2026/05/icon.png')
    expect(messages.success).toHaveBeenCalledWith('分类图标上传成功')
  })

  it('shows backend message when icon upload returns non-200 payload', async () => {
    uploadCategoryImageSpy.mockResolvedValue({ code: 500, message: '分类图标上传失败' } as any)
    const wrapper = mountView()

    await flushPromises()
    await (wrapper.vm as any).handleCategoryIconUpload({
      file: new File(['icon'], 'icon.png', { type: 'image/png' })
    })

    expect(messages.error).toHaveBeenCalledWith('分类图标上传失败')
  })

  it('shows backend message when icon upload throws', async () => {
    uploadCategoryImageSpy.mockRejectedValue({ response: { data: { message: '分类图标审核未通过' } } })
    const wrapper = mountView()

    await flushPromises()
    await (wrapper.vm as any).handleCategoryIconUpload({
      file: new File(['icon'], 'icon.png', { type: 'image/png' })
    })

    expect(messages.error).toHaveBeenCalledWith('分类图标审核未通过')
    expect(debugError).toHaveBeenCalledWith('上传分类图标失败', expect.anything())
  })

  it('renders existing icon preview when editing a category', async () => {
    const wrapper = mountView()

    await flushPromises()
    ;(wrapper.vm as any).openDialog({
      id: 1,
      name: '分类A',
      description: '',
      icon: '/uploads/categories/2026/05/demo.png',
      sortOrder: 0,
      status: 1
    })
    await flushPromises()

    const preview = wrapper.find('[data-testid="admin-category-icon-preview"]')
    expect(preview.exists()).toBe(true)
    expect(preview.attributes('src')).toBe('/uploads/categories/2026/05/demo.png')
  })

  it('clears category icon before saving create payload', async () => {
    adminApi.createCategory.mockResolvedValue({ code: 200, message: '分类添加成功' })
    const wrapper = mountView()

    await flushPromises()
    ;(wrapper.vm as any).openDialog()
    ;(wrapper.vm as any).form.name = '图标分类'
    ;(wrapper.vm as any).form.icon = '/uploads/categories/2026/05/icon.png'
    ;(wrapper.vm as any).clearCategoryIcon()
    await (wrapper.vm as any).saveCategory()
    await flushPromises()

    expect(adminApi.createCategory).toHaveBeenCalledWith(
      expect.objectContaining({
        icon: null
      })
    )
  })

  it('includes normalized icon in update payload', async () => {
    adminApi.updateCategory.mockResolvedValue({ code: 200, message: '分类更新成功' })
    const wrapper = mountView()

    await flushPromises()
    ;(wrapper.vm as any).isEdit = true
    ;(wrapper.vm as any).editId = 1
    ;(wrapper.vm as any).form.name = '分类A'
    ;(wrapper.vm as any).form.description = '描述'
    ;(wrapper.vm as any).form.icon = ' /uploads/categories/2026/05/icon.png '
    ;(wrapper.vm as any).form.sortOrder = 2
    ;(wrapper.vm as any).form.status = 1
    await (wrapper.vm as any).saveCategory()
    await flushPromises()

    expect(adminApi.updateCategory).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        icon: '/uploads/categories/2026/05/icon.png'
      })
    )
  })

  it('logs when category list returns non-200 payload', async () => {
    adminApi.getCategories.mockResolvedValue({ code: 500, message: '分类列表读取失败' })

    mountView()
    await flushPromises()

    expect(debugError).toHaveBeenCalledWith('获取分类管理列表失败:', '分类列表读取失败')
  })

  it('shows backend message when saving category returns non-200 payload', async () => {
    adminApi.createCategory.mockResolvedValue({ code: 500, message: '分类名称重复' })
    const wrapper = mountView()

    await flushPromises()
    await (wrapper.vm as unknown as { openDialog: () => void }).openDialog()
    ;(wrapper.vm as any).form.name = '分类A'
    await (wrapper.vm as unknown as { saveCategory: () => Promise<void> }).saveCategory()
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('分类名称重复')
    expect(debugError).toHaveBeenCalledWith('保存分类失败', '分类名称重复')
  })

  it('shows backend message when deleting category returns non-200 payload', async () => {
    adminApi.deleteCategory.mockResolvedValue({ code: 500, message: '分类删除失败' })
    const wrapper = mountView()

    await flushPromises()
    await (wrapper.vm as unknown as { handleDelete: (row: { id: number; name: string }) => Promise<void> })
      .handleDelete({ id: 1, name: '分类A' })
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('分类删除失败')
    expect(debugError).toHaveBeenCalledWith('删除分类失败', '分类删除失败')
  })

  it('refreshes category list after saving category successfully', async () => {
    adminApi.createCategory.mockResolvedValue({ code: 200, message: '分类添加成功' })
    const wrapper = mountView()

    await flushPromises()
    await (wrapper.vm as unknown as { openDialog: () => void }).openDialog()
    ;(wrapper.vm as any).form.name = '新分类'
    await (wrapper.vm as unknown as { saveCategory: () => Promise<void> }).saveCategory()
    await flushPromises()

    expect(adminApi.getCategories).toHaveBeenCalledTimes(2)
    expect(messages.success).toHaveBeenCalledWith('分类添加成功')
  })

  it('keeps category save successful when categories refresh fails afterward', async () => {
    adminApi.createCategory.mockResolvedValue({ code: 200, message: '分类添加成功' })
    adminApi.getCategories
      .mockResolvedValueOnce({
        code: 200,
        data: [{ id: 1, name: '分类A', description: '', sortOrder: 0, status: 1 }]
      })
      .mockRejectedValueOnce(new Error('refresh failed'))
    const wrapper = mountView()

    await flushPromises()
    await (wrapper.vm as unknown as { openDialog: () => void }).openDialog()
    ;(wrapper.vm as any).form.name = '新分类'
    await (wrapper.vm as unknown as { saveCategory: () => Promise<void> }).saveCategory()
    await flushPromises()

    expect(messages.success).toHaveBeenCalledWith('分类添加成功')
    expect(messages.error).not.toHaveBeenCalled()
    expect(debugError).toHaveBeenCalledWith('获取分类管理列表失败', expect.any(Error))
  })

  it('ignores stale category list responses when a newer refresh finishes first', async () => {
    const firstRequest = createDeferred<any>()
    const secondRequest = createDeferred<any>()

    adminApi.getCategories
      .mockImplementationOnce(() => firstRequest.promise)
      .mockImplementationOnce(() => secondRequest.promise)

    const wrapper = mountView()
    await flushPromises()

    const vm = wrapper.vm as unknown as { fetchCategories: () => Promise<void> }
    const refetchPromise = vm.fetchCategories()
    await flushPromises()

    secondRequest.resolve({
      code: 200,
      data: [{ id: 2, name: '新分类', description: '', icon: '', sortOrder: 0, status: 1 }]
    })
    await refetchPromise
    await flushPromises()

    expect((wrapper.vm as any).categories[0].name).toBe('新分类')

    firstRequest.resolve({
      code: 200,
      data: [{ id: 1, name: '旧分类', description: '', icon: '', sortOrder: 0, status: 1 }]
    })
    await flushPromises()

    expect((wrapper.vm as any).categories[0].name).toBe('新分类')
  })

  it('does not let an in-flight category request restore a deleted category', async () => {
    const firstRequest = createDeferred<any>()
    const secondRequest = createDeferred<any>()

    adminApi.getCategories
      .mockImplementationOnce(() => firstRequest.promise)
      .mockImplementationOnce(() => secondRequest.promise)
    adminApi.deleteCategory.mockResolvedValue({ code: 200, message: '删除成功' })

    const wrapper = mountView()
    await flushPromises()
    ;(wrapper.vm as any).categories = [{ id: 1, name: '分类A', description: '', sortOrder: 0, status: 1 }]

    const deletePromise = (wrapper.vm as any).handleDelete({ id: 1, name: '分类A' })
    await flushPromises()

    expect((wrapper.vm as any).categories).toEqual([])

    secondRequest.resolve({ code: 200, data: [] })
    await deletePromise
    await flushPromises()

    firstRequest.resolve({ code: 200, data: [{ id: 1, name: '分类A', description: '', icon: '', sortOrder: 0, status: 1 }] })
    await flushPromises()

    expect((wrapper.vm as any).categories).toEqual([])
  })

  it('does not let an in-flight category request overwrite edit success', async () => {
    const firstRequest = createDeferred<any>()
    const secondRequest = createDeferred<any>()

    adminApi.getCategories
      .mockImplementationOnce(() => firstRequest.promise)
      .mockImplementationOnce(() => secondRequest.promise)
    adminApi.updateCategory.mockResolvedValue({
      code: 200,
      message: '分类更新成功',
      data: { id: 1, name: '新分类名', description: '新描述', icon: '/uploads/categories/2026/05/icon.png', sortOrder: 2, status: 1 }
    })

    const wrapper = mountView()
    await flushPromises()
    ;(wrapper.vm as any).isEdit = true
    ;(wrapper.vm as any).editId = 1
    ;(wrapper.vm as any).form.name = '新分类名'
    ;(wrapper.vm as any).form.description = '新描述'
    ;(wrapper.vm as any).form.icon = '/uploads/categories/2026/05/icon.png'
    ;(wrapper.vm as any).form.sortOrder = 2
    ;(wrapper.vm as any).form.status = 1
    ;(wrapper.vm as any).categories = [{ id: 1, name: '分类A', description: '', icon: '', sortOrder: 0, status: 1 }]

    const savePromise = (wrapper.vm as any).saveCategory()
    await flushPromises()

    expect((wrapper.vm as any).categories[0].name).toBe('新分类名')

    secondRequest.resolve({ code: 200, data: [{ id: 1, name: '新分类名', description: '新描述', icon: '/uploads/categories/2026/05/icon.png', sortOrder: 2, status: 1 }] })
    await savePromise
    await flushPromises()

    firstRequest.resolve({ code: 200, data: [{ id: 1, name: '分类A', description: '', icon: '', sortOrder: 0, status: 1 }] })
    await flushPromises()

    expect((wrapper.vm as any).categories[0].name).toBe('新分类名')
  })

  it('closes category dialog when refreshed list no longer contains the editing category', async () => {
    adminApi.getCategories
      .mockResolvedValueOnce({
        code: 200,
        data: [{ id: 1, name: '分类A', description: '', icon: '', sortOrder: 0, status: 1 }]
      })
      .mockResolvedValueOnce({
        code: 200,
        data: [{ id: 2, name: '分类B', description: '', icon: '', sortOrder: 1, status: 1 }]
      })

    const wrapper = mountView()
    await flushPromises()

    ;(wrapper.vm as any).openDialog({ id: 1, name: '分类A', description: '旧描述', icon: '/uploads/categories/2026/05/demo.png', sortOrder: 0, status: 1 })

    await (wrapper.vm as any).fetchCategories()
    await flushPromises()

    expect((wrapper.vm as any).dialogVisible).toBe(false)
    expect((wrapper.vm as any).isEdit).toBe(false)
    expect((wrapper.vm as any).editId).toBeNull()
    expect((wrapper.vm as any).form.name).toBe('')
    expect((wrapper.vm as any).form.icon).toBe('')
  })
})
