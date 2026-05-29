import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ElMessage, ElMessageBox } from 'element-plus'
import categoryApi from '@/api/categoryApi'
import productApi from '@/api/productApi'
import fileApi from '@/api/fileApi'
import { buildProduct, okResponse } from '@/test/helpers/factories'
import * as debugModule from '@/utils/debug'

const messages = {
  success: vi.spyOn(ElMessage, 'success').mockImplementation(() => '' as any),
  error: vi.spyOn(ElMessage, 'error').mockImplementation(() => '' as any),
  warning: vi.spyOn(ElMessage, 'warning').mockImplementation(() => '' as any)
}

const messageBox = {
  confirm: vi.spyOn(ElMessageBox, 'confirm')
}

const mockedCategoryApi = vi.mocked(categoryApi) as any
const mockedProductApi = vi.mocked(productApi) as any
const mockedFileApi = vi.mocked(fileApi) as any

const getMyProductsSpy = vi.spyOn(productApi, 'getMyProducts')
const deleteProductSpy = vi.spyOn(productApi, 'deleteProduct')
const submitProductSpy = vi.spyOn(productApi, 'submitProduct')
const updateProductSpy = vi.spyOn(productApi, 'updateProduct')
const getCategoriesSpy = vi.spyOn(categoryApi, 'getCategories')
const getImageUrlSpy = vi.spyOn(fileApi, 'getImageUrl')
const uploadProductImageSpy = vi.spyOn(fileApi, 'uploadProductImage')
const uploadAdVideoSpy = vi.spyOn(fileApi, 'uploadAdVideo')
const debugError = vi.spyOn(debugModule, 'debugError').mockImplementation(() => {})

vi.mock('@element-plus/icons-vue', () => ({
  Plus: { template: '<span />' }
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
    messageBox.confirm.mockResolvedValue(undefined as any)
    mockedCategoryApi.getCategories.mockResolvedValue(okResponse([]))
    mockedProductApi.getMyProducts.mockResolvedValue(
      okResponse([buildProduct({ id: 5, name: '商品A', price: 99, stock: 5, sales: 1, auditStatus: 1, mainImage: '/a.png' })])
    )
    deleteProductSpy.mockResolvedValue({ code: 200, message: '删除成功' } as any)
    submitProductSpy.mockResolvedValue({ code: 200, data: { id: 8, auditStatus: 0, sales: 0 } } as any)
    updateProductSpy.mockResolvedValue({ code: 200, data: { id: 5, auditStatus: 0 } } as any)
    getImageUrlSpy.mockReturnValue('/img.png')
    uploadProductImageSpy.mockResolvedValue({ code: 200, data: '/img.png' } as any)
    uploadAdVideoSpy.mockResolvedValue({ code: 200, data: '/video.mp4' } as any)
    debugError.mockImplementation(() => {})
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

    expect(mockedProductApi.deleteProduct).not.toHaveBeenCalled()
    expect(messages.error).not.toHaveBeenCalled()
  })

  it('shows an error when product deletion fails', async () => {
    mockedProductApi.deleteProduct.mockRejectedValue(new Error('boom'))
    const wrapper = mountView()

    await flushPromises()
    await (wrapper.vm as unknown as { handleDelete: (product: { id: number; name: string }) => Promise<void> })
      .handleDelete({ id: 5, name: '商品A' })
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('boom')
    expect(debugError).toHaveBeenCalled()
  })

  it('shows backend message when deleting product returns non-200 payload', async () => {
    mockedProductApi.deleteProduct.mockResolvedValue({ code: 500, message: '删除被拒绝' })
    const wrapper = mountView()

    await flushPromises()
    await (wrapper.vm as unknown as { handleDelete: (product: { id: number; name: string }) => Promise<void> })
      .handleDelete({ id: 5, name: '商品A' })
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('删除被拒绝')
    expect(debugError).toHaveBeenCalledWith('删除我的商品失败', '删除被拒绝')
  })

  it('logs when my products list returns non-200 payload', async () => {
    mockedProductApi.getMyProducts.mockResolvedValue({ code: 500, message: '读取失败' })

    mountView()
    await flushPromises()

    expect(debugError).toHaveBeenCalledWith('获取我的商品列表失败:', '读取失败')
  })

  it('logs backend message when submitting product returns non-200 payload', async () => {
    mockedProductApi.submitProduct.mockResolvedValue({ code: 500, message: '商品提交失败' })
    const wrapper = mountView()

    await flushPromises()
    ;(wrapper.vm as any).form.name = '商品A'
    ;(wrapper.vm as any).form.categoryId = 1
    ;(wrapper.vm as any).form.price = 99
    ;(wrapper.vm as any).form.stock = 5
    ;(wrapper.vm as any).form.mainImage = '/a.png'
    ;(wrapper.vm as any).form.adVideo = ''

    await (wrapper.vm as any).submitProduct()
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('商品提交失败')
    expect(debugError).toHaveBeenCalledWith('提交我的商品失败', '商品提交失败')
  })

  it('blocks product submit when no product image has been uploaded', async () => {
    const wrapper = mountView()

    await flushPromises()
    ;(wrapper.vm as any).form.name = '商品A'
    ;(wrapper.vm as any).form.categoryId = 1
    ;(wrapper.vm as any).form.price = 99
    ;(wrapper.vm as any).form.stock = 5
    ;(wrapper.vm as any).form.images = []
    ;(wrapper.vm as any).form.mainImage = ''
    ;(wrapper.vm as any).form.adVideo = ''

    await (wrapper.vm as any).submitProduct()
    await flushPromises()

    expect(mockedProductApi.submitProduct).not.toHaveBeenCalled()
    expect(mockedProductApi.updateProduct).not.toHaveBeenCalled()
    expect((wrapper.vm as any).saving).toBe(false)
  })

  it('blocks duplicate product submits while the first save is still in flight', async () => {
    const submit = deferred<any>()
    mockedProductApi.submitProduct.mockReturnValue(submit.promise)
    const wrapper = mountView()

    await flushPromises()
    ;(wrapper.vm as any).form.name = '商品A'
    ;(wrapper.vm as any).form.categoryId = 1
    ;(wrapper.vm as any).form.price = 99
    ;(wrapper.vm as any).form.stock = 5
    ;(wrapper.vm as any).form.images = ['/a.png']
    ;(wrapper.vm as any).form.mainImage = '/a.png'
    ;(wrapper.vm as any).form.adVideo = ''

    const firstSubmit = (wrapper.vm as any).submitProduct()
    await flushPromises()
    await (wrapper.vm as any).submitProduct()

    expect(mockedProductApi.submitProduct).toHaveBeenCalledTimes(1)

    submit.resolve({
      code: 200,
      message: '商品提交成功，等待管理员审核',
      data: { id: 8, auditStatus: 0, sales: 0 }
    })
    await firstSubmit
    await flushPromises()
  })

  it('ignores image upload results after the product dialog is cancelled', async () => {
    const upload = deferred<any>()
    mockedFileApi.uploadProductImage.mockReturnValue(upload.promise)
    const wrapper = mountView()

    await flushPromises()
    ;(wrapper.vm as any).openDialog()
    const uploadPromise = (wrapper.vm as any).handleImageUpload({ file: new File(['x'], 'demo.png', { type: 'image/png' }) })
    await flushPromises()
    ;(wrapper.vm as any).closeDialog()

    upload.resolve({ code: 200, data: '/uploads/products/demo.png' })
    await uploadPromise
    await flushPromises()

    expect((wrapper.vm as any).form.images).toEqual([])
    expect((wrapper.vm as any).form.mainImage).toBe('')
    expect(messages.success).not.toHaveBeenCalledWith('图片上传成功')
  })

  it('does not treat success flag without 200 code as a real submit success', async () => {
    mockedProductApi.submitProduct.mockResolvedValue({ code: 500, success: true, message: '商品提交失败' })
    const wrapper = mountView()

    await flushPromises()
    ;(wrapper.vm as any).form.name = '商品A'
    ;(wrapper.vm as any).form.categoryId = 1
    ;(wrapper.vm as any).form.price = 99
    ;(wrapper.vm as any).form.stock = 5
    ;(wrapper.vm as any).form.mainImage = '/a.png'
    ;(wrapper.vm as any).form.adVideo = ''

    await (wrapper.vm as any).submitProduct()
    await flushPromises()

    expect(messages.success).not.toHaveBeenCalledWith('商品提交成功，等待管理员审核')
    expect(messages.error).toHaveBeenCalledWith('商品提交失败')
  })

  it('does not treat success flag without 200 code as a real delete success', async () => {
    mockedProductApi.deleteProduct.mockResolvedValue({ code: 500, success: true, message: '删除失败' })
    const wrapper = mountView()

    await flushPromises()
    await (wrapper.vm as unknown as { handleDelete: (product: { id: number; name: string }) => Promise<void> })
      .handleDelete({ id: 5, name: '商品A' })
    await flushPromises()

    expect(messages.success).not.toHaveBeenCalledWith('删除成功')
    expect(messages.error).toHaveBeenCalledWith('删除失败')
  })

  it('keeps submit success when refreshing my products fails afterward', async () => {
    mockedProductApi.getMyProducts
      .mockResolvedValueOnce({ code: 200, data: [] })
      .mockRejectedValue(new Error('刷新失败'))
    mockedProductApi.submitProduct.mockResolvedValue({
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
    ;(wrapper.vm as any).form.mainImage = '/a.png'
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
    mockedProductApi.getMyProducts
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
    mockedProductApi.updateProduct.mockResolvedValue({
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
    mockedProductApi.getMyProducts
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
    mockedProductApi.deleteProduct.mockResolvedValue({ code: 200, message: '删除成功' })

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
    const first = deferred<any>()
    const second = deferred<any>()
    mockedProductApi.getMyProducts
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
    const first = deferred<any>()
    const second = deferred<any>()
    mockedProductApi.getMyProducts
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)
    mockedProductApi.deleteProduct.mockResolvedValue({ code: 200, message: '删除成功' })

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
    const first = deferred<any>()
    const second = deferred<any>()
    mockedProductApi.getMyProducts
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)
    mockedProductApi.submitProduct.mockResolvedValue({
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
    mockedProductApi.getMyProducts
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
