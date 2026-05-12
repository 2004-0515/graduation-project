import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { axiosMock, fileApi, messages, messageBox, debugError } = vi.hoisted(() => ({
  axiosMock: {
    get: vi.fn(),
    delete: vi.fn(),
    post: vi.fn(),
    put: vi.fn()
  },
  fileApi: {
    getImageUrl: vi.fn(() => '/img.png'),
    uploadProductImage: vi.fn(),
    uploadAdVideo: vi.fn()
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

vi.mock('@/utils/axios', () => ({
  default: axiosMock
}))

vi.mock('@/api/fileApi', () => ({
  default: fileApi
}))

vi.mock('@/utils/debug', () => ({
  debugError
}))

import MyProductsView from '@/views/MyProductsView.vue'

const deferred = <T>() => {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('MyProductsView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    messageBox.confirm.mockResolvedValue(undefined)
    axiosMock.get
      .mockResolvedValueOnce({ code: 200, data: [] })
      .mockResolvedValueOnce({
        code: 200,
        data: [
          {
            id: 5,
            name: '商品A',
            price: 99,
            stock: 5,
            sales: 1,
            auditStatus: 1,
            mainImage: '/a.png'
          }
        ]
      })
  })

  const mountView = () =>
    mount(MyProductsView, {
      global: {
        directives: {
          loading: {}
        },
        stubs: {
          Navbar: true,
          Footer: true,
          ElButton: { template: '<button @click="$emit(\'click\')"><slot /></button>' },
          ElEmpty: true,
          ElImage: true,
          ElDialog: { template: '<div><slot /><slot name="footer" /></div>' },
          ElForm: { template: '<form><slot /></form>' },
          ElFormItem: { template: '<div><slot /></div>' },
          ElInput: true,
          ElSelect: true,
          ElOption: true,
          ElInputNumber: true,
          ElUpload: { template: '<div><slot /></div>' },
          ElIcon: { template: '<span><slot /></span>' }
        }
      }
    })

  it('does not show an error when user cancels product deletion', async () => {
    messageBox.confirm.mockRejectedValue('cancel')
    const wrapper = mountView()

    await flushPromises()
    await (wrapper.vm as unknown as { handleDelete: (product: { id: number; name: string }) => Promise<void> })
      .handleDelete({ id: 5, name: '商品A' })
    await flushPromises()

    expect(axiosMock.delete).not.toHaveBeenCalled()
    expect(messages.error).not.toHaveBeenCalled()
  })

  it('shows an error when product deletion fails', async () => {
    axiosMock.delete.mockRejectedValue(new Error('boom'))
    const wrapper = mountView()

    await flushPromises()
    await (wrapper.vm as unknown as { handleDelete: (product: { id: number; name: string }) => Promise<void> })
      .handleDelete({ id: 5, name: '商品A' })
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('boom')
    expect(debugError).toHaveBeenCalled()
  })

  it('shows backend message when deleting product returns non-200 payload', async () => {
    axiosMock.delete.mockResolvedValue({ code: 500, message: '删除被拒绝' })
    const wrapper = mountView()

    await flushPromises()
    await (wrapper.vm as unknown as { handleDelete: (product: { id: number; name: string }) => Promise<void> })
      .handleDelete({ id: 5, name: '商品A' })
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('删除被拒绝')
    expect(debugError).toHaveBeenCalledWith('删除我的商品失败', '删除被拒绝')
  })

  it('logs when my products list returns non-200 payload', async () => {
    axiosMock.get.mockReset()
    axiosMock.get.mockImplementation((url: string) => {
      if (url === '/categories') {
        return Promise.resolve({ code: 200, data: [] })
      }
      if (url === '/products/my') {
        return Promise.resolve({ code: 500, message: '读取失败' })
      }
      return Promise.resolve({ code: 200, data: [] })
    })

    mountView()
    await flushPromises()

    expect(debugError).toHaveBeenCalledWith('获取我的商品列表失败:', '读取失败')
  })

  it('logs backend message when submitting product returns non-200 payload', async () => {
    axiosMock.post.mockResolvedValue({ code: 500, message: '商品提交失败' })
    const wrapper = mountView()

    await flushPromises()
    ;(wrapper.vm as any).form.name = '商品A'
    ;(wrapper.vm as any).form.categoryId = 1
    ;(wrapper.vm as any).form.price = 99
    ;(wrapper.vm as any).form.stock = 5
    ;(wrapper.vm as any).form.adVideo = ''

    await (wrapper.vm as any).submitProduct()
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('商品提交失败')
    expect(debugError).toHaveBeenCalledWith('提交我的商品失败', '商品提交失败')
  })

  it('does not treat success flag without 200 code as a real submit success', async () => {
    axiosMock.post.mockResolvedValue({ code: 500, success: true, message: '商品提交失败' })
    const wrapper = mountView()

    await flushPromises()
    ;(wrapper.vm as any).form.name = '商品A'
    ;(wrapper.vm as any).form.categoryId = 1
    ;(wrapper.vm as any).form.price = 99
    ;(wrapper.vm as any).form.stock = 5
    ;(wrapper.vm as any).form.adVideo = ''

    await (wrapper.vm as any).submitProduct()
    await flushPromises()

    expect(messages.success).not.toHaveBeenCalledWith('商品提交成功，等待管理员审核')
    expect(messages.error).toHaveBeenCalledWith('商品提交失败')
  })

  it('does not treat success flag without 200 code as a real delete success', async () => {
    axiosMock.delete.mockResolvedValue({ code: 500, success: true, message: '删除失败' })
    const wrapper = mountView()

    await flushPromises()
    await (wrapper.vm as unknown as { handleDelete: (product: { id: number; name: string }) => Promise<void> })
      .handleDelete({ id: 5, name: '商品A' })
    await flushPromises()

    expect(messages.success).not.toHaveBeenCalledWith('删除成功')
    expect(messages.error).toHaveBeenCalledWith('删除失败')
  })

  it('keeps submit success when refreshing my products fails afterward', async () => {
    axiosMock.get.mockReset()
    axiosMock.get
      .mockResolvedValueOnce({ code: 200, data: [] })
      .mockResolvedValueOnce({ code: 200, data: [] })
      .mockRejectedValue(new Error('刷新失败'))
    axiosMock.post.mockResolvedValue({
      code: 200,
      message: '商品提交成功，等待管理员审核',
      data: { id: 8, auditStatus: 0, sales: 0 }
    })

    const wrapper = mountView()

    await flushPromises()
    ;(wrapper.vm as any).form.name = '商品A'
    ;(wrapper.vm as any).form.categoryId = 1
    ;(wrapper.vm as any).form.price = 99
    ;(wrapper.vm as any).form.stock = 5
    ;(wrapper.vm as any).form.adVideo = ''

    await (wrapper.vm as any).submitProduct()
    await flushPromises()

    expect(messages.success).toHaveBeenCalledWith('商品提交成功，等待管理员审核')
    expect(messages.error).not.toHaveBeenCalledWith('刷新失败')
    expect((wrapper.vm as any).products[0]).toEqual(expect.objectContaining({
      id: 8,
      name: '商品A',
      price: 99,
      stock: 5,
      auditStatus: 0
    }))
    expect(debugError).toHaveBeenCalledWith('获取我的商品列表失败', expect.any(Error))
  })

  it('keeps edit success with local update when refreshing my products fails afterward', async () => {
    axiosMock.get.mockReset()
    axiosMock.get
      .mockResolvedValueOnce({ code: 200, data: [] })
      .mockResolvedValueOnce({
        code: 200,
        data: [
          {
            id: 5,
            name: '商品A',
            price: 99,
            stock: 5,
            sales: 1,
            auditStatus: 1,
            mainImage: '/a.png'
          }
        ]
      })
      .mockRejectedValue(new Error('刷新失败'))
    axiosMock.put.mockResolvedValue({
      code: 200,
      message: '商品修改成功，等待管理员审核',
      data: { id: 5, auditStatus: 0 }
    })

    const wrapper = mountView()

    await flushPromises()
    ;(wrapper.vm as any).isEdit = true
    ;(wrapper.vm as any).editId = 5
    ;(wrapper.vm as any).form.name = '商品A-新版'
    ;(wrapper.vm as any).form.categoryId = 1
    ;(wrapper.vm as any).form.price = 129
    ;(wrapper.vm as any).form.stock = 8
    ;(wrapper.vm as any).form.mainImage = '/a-new.png'
    ;(wrapper.vm as any).form.description = '新版描述'
    ;(wrapper.vm as any).form.adVideo = ''

    await (wrapper.vm as any).submitProduct()
    await flushPromises()

    expect(messages.success).toHaveBeenCalledWith('商品修改成功，等待管理员审核')
    expect((wrapper.vm as any).products[0]).toEqual(expect.objectContaining({
      id: 5,
      name: '商品A-新版',
      price: 129,
      stock: 8,
      auditStatus: 0
    }))
    expect(debugError).toHaveBeenCalledWith('获取我的商品列表失败', expect.any(Error))
  })

  it('keeps delete success when refreshing my products fails afterward', async () => {
    axiosMock.get.mockReset()
    axiosMock.get
      .mockResolvedValueOnce({ code: 200, data: [] })
      .mockResolvedValueOnce({
        code: 200,
        data: [
          {
            id: 5,
            name: '商品A',
            price: 99,
            stock: 5,
            sales: 1,
            auditStatus: 1,
            mainImage: '/a.png'
          }
        ]
      })
      .mockRejectedValue(new Error('刷新失败'))
    axiosMock.delete.mockResolvedValue({ code: 200, message: '删除成功' })

    const wrapper = mountView()

    await flushPromises()
    await (wrapper.vm as unknown as { handleDelete: (product: { id: number; name: string }) => Promise<void> })
      .handleDelete({ id: 5, name: '商品A' })
    await flushPromises()

    expect(messages.success).toHaveBeenCalledWith('删除成功')
    expect(messages.error).not.toHaveBeenCalledWith('刷新失败')
    expect(debugError).toHaveBeenCalledWith('获取我的商品列表失败', expect.any(Error))
  })

  it('keeps newer product list when older request resolves later', async () => {
    const categoriesResponse = Promise.resolve({ code: 200, data: [] })
    const first = deferred<any>()
    const second = deferred<any>()
    axiosMock.get.mockReset()
    axiosMock.get
      .mockReturnValueOnce(categoriesResponse)
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)

    const wrapper = mountView()
    await flushPromises()

    const vm = wrapper.vm as unknown as { fetchProducts: () => Promise<void> }
    const secondFetch = vm.fetchProducts()
    await flushPromises()

    second.resolve({
      code: 200,
      data: [{ id: 9, name: '新商品', price: 123, stock: 8, sales: 2, auditStatus: 1, mainImage: '/new.png' }]
    })
    await secondFetch
    await flushPromises()

    expect((wrapper.vm as any).products).toEqual([
      { id: 9, name: '新商品', price: 123, stock: 8, sales: 2, auditStatus: 1, mainImage: '/new.png' }
    ])

    first.resolve({
      code: 200,
      data: [{ id: 5, name: '旧商品', price: 99, stock: 5, sales: 1, auditStatus: 1, mainImage: '/old.png' }]
    })
    await flushPromises()

    expect((wrapper.vm as any).products).toEqual([
      { id: 9, name: '新商品', price: 123, stock: 8, sales: 2, auditStatus: 1, mainImage: '/new.png' }
    ])
  })

  it('does not let an in-flight products request overwrite local delete success', async () => {
    const categoriesResponse = Promise.resolve({ code: 200, data: [] })
    const first = deferred<any>()
    const second = deferred<any>()
    axiosMock.get.mockReset()
    axiosMock.get
      .mockReturnValueOnce(categoriesResponse)
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)
    axiosMock.delete.mockResolvedValue({ code: 200, message: '删除成功' })

    const wrapper = mountView()
    await flushPromises()
    ;(wrapper.vm as any).products = [
      { id: 5, name: '商品A', price: 99, stock: 5, sales: 1, auditStatus: 1, mainImage: '/a.png' }
    ]

    const deletePromise = (wrapper.vm as any).handleDelete((wrapper.vm as any).products[0])
    await flushPromises()

    expect((wrapper.vm as any).products).toEqual([])

    second.resolve({ code: 200, data: [] })
    await deletePromise
    await flushPromises()

    first.resolve({
      code: 200,
      data: [{ id: 5, name: '商品A', price: 99, stock: 5, sales: 1, auditStatus: 1, mainImage: '/a.png' }]
    })
    await flushPromises()

    expect((wrapper.vm as any).products).toEqual([])
  })

  it('does not let an in-flight products request overwrite local submit success', async () => {
    const categoriesResponse = Promise.resolve({ code: 200, data: [] })
    const first = deferred<any>()
    const second = deferred<any>()
    axiosMock.get.mockReset()
    axiosMock.get
      .mockReturnValueOnce(categoriesResponse)
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)
    axiosMock.post.mockResolvedValue({
      code: 200,
      message: '商品提交成功，等待管理员审核',
      data: { id: 8, auditStatus: 0, sales: 0 }
    })

    const wrapper = mountView()
    await flushPromises()
    ;(wrapper.vm as any).products = [
      { id: 5, name: '旧商品', price: 99, stock: 5, sales: 1, auditStatus: 1, mainImage: '/old.png' }
    ]
    ;(wrapper.vm as any).form.name = '新商品'
    ;(wrapper.vm as any).form.categoryId = 1
    ;(wrapper.vm as any).form.price = 123
    ;(wrapper.vm as any).form.stock = 8
    ;(wrapper.vm as any).form.mainImage = '/new.png'
    ;(wrapper.vm as any).form.description = '描述'
    ;(wrapper.vm as any).form.adVideo = ''

    const submitPromise = (wrapper.vm as any).submitProduct()
    await flushPromises()

    expect((wrapper.vm as any).products[0]).toEqual(expect.objectContaining({
      id: 8,
      name: '新商品',
      price: 123,
      stock: 8,
      auditStatus: 0
    }))

    second.resolve({
      code: 200,
      data: [
        { id: 8, name: '新商品', price: 123, stock: 8, sales: 0, auditStatus: 0, mainImage: '/new.png' },
        { id: 5, name: '旧商品', price: 99, stock: 5, sales: 1, auditStatus: 1, mainImage: '/old.png' }
      ]
    })
    await submitPromise
    await flushPromises()

    first.resolve({
      code: 200,
      data: [{ id: 5, name: '旧商品', price: 99, stock: 5, sales: 1, auditStatus: 1, mainImage: '/old.png' }]
    })
    await flushPromises()

    expect((wrapper.vm as any).products[0]).toEqual(expect.objectContaining({
      id: 8,
      name: '新商品',
      price: 123,
      stock: 8,
      auditStatus: 0
    }))
  })

  it('closes product dialog when refreshed list no longer contains the editing product', async () => {
    const categoriesResponse = Promise.resolve({ code: 200, data: [] })
    axiosMock.get.mockReset()
    axiosMock.get
      .mockReturnValueOnce(categoriesResponse)
      .mockResolvedValueOnce({
        code: 200,
        data: [
          {
            id: 5,
            name: '商品A',
            categoryId: 1,
            price: 99,
            originalPrice: 120,
            stock: 5,
            sales: 1,
            auditStatus: 1,
            mainImage: '/a.png',
            description: '旧描述',
            adVideo: '/a.mp4'
          }
        ]
      })
      .mockResolvedValueOnce({
        code: 200,
        data: [
          {
            id: 9,
            name: '商品B',
            categoryId: 2,
            price: 123,
            stock: 8,
            sales: 2,
            auditStatus: 1,
            mainImage: '/b.png'
          }
        ]
      })

    const wrapper = mountView()
    await flushPromises()

    ;(wrapper.vm as any).openDialog({
      id: 5,
      name: '商品A',
      categoryId: 1,
      price: 99,
      originalPrice: 120,
      stock: 5,
      mainImage: '/a.png',
      description: '旧描述',
      adVideo: '/a.mp4'
    })

    await (wrapper.vm as any).fetchProducts()
    await flushPromises()

    expect((wrapper.vm as any).dialogVisible).toBe(false)
    expect((wrapper.vm as any).isEdit).toBe(false)
    expect((wrapper.vm as any).editId).toBeNull()
    expect((wrapper.vm as any).form.name).toBe('')
    expect((wrapper.vm as any).form.mainImage).toBe('')
  })
})
