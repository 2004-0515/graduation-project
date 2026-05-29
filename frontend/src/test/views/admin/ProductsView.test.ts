import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ElMessage, ElMessageBox } from 'element-plus'
import { createPinia, setActivePinia } from 'pinia'
import adminApi from '@/api/adminApi'
import fileApi from '@/api/fileApi'
import { useAdminStore } from '@/stores/adminStore'
import { buildCategory, buildProduct, buildUser, okPageResponse, okResponse } from '@/test/helpers/factories'
import * as debugModule from '@/utils/debug'

const messages = {
  success: vi.spyOn(ElMessage, 'success').mockImplementation(() => '' as any),
  error: vi.spyOn(ElMessage, 'error').mockImplementation(() => '' as any),
  warning: vi.spyOn(ElMessage, 'warning').mockImplementation(() => '' as any)
}

const messageBox = {
  confirm: vi.spyOn(ElMessageBox, 'confirm')
}

const mockedAdminApi = vi.mocked(adminApi) as any
const mockedFileApi = vi.mocked(fileApi) as any

const getProductsSpy = vi.spyOn(adminApi, 'getProducts')
const getPendingProductsSpy = vi.spyOn(adminApi, 'getPendingProducts')
const getPendingProductCountSpy = vi.spyOn(adminApi, 'getPendingProductCount')
const getCategoriesSpy = vi.spyOn(adminApi, 'getCategories')
const updateProductSpy = vi.spyOn(adminApi, 'updateProduct')
const batchUpdateAllProductStatusSpy = vi.spyOn(adminApi, 'batchUpdateAllProductStatus')
const reviewProductSpy = vi.spyOn(adminApi, 'reviewProduct')
const deleteProductSpy = vi.spyOn(adminApi, 'deleteProduct')
const createProductSpy = vi.spyOn(adminApi, 'createProduct')
const getUsersSpy = vi.spyOn(adminApi, 'getUsers')
const getImageUrlSpy = vi.spyOn(fileApi, 'getImageUrl')
const uploadProductImageSpy = vi.spyOn(fileApi, 'uploadProductImage')
const uploadAdVideoSpy = vi.spyOn(fileApi, 'uploadAdVideo')
const debugError = vi.spyOn(debugModule, 'debugError').mockImplementation(() => {})

import ProductsView from '@/views/admin/ProductsView.vue'

function createDeferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('ProductsView', () => {
  let pinia: ReturnType<typeof createPinia>
  let adminStore: ReturnType<typeof useAdminStore>

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    adminStore = useAdminStore()
    vi.clearAllMocks()
    messageBox.confirm.mockResolvedValue(undefined as any)
    vi.spyOn(adminStore, 'fetchPendingProductCount').mockResolvedValue(undefined)
    vi.spyOn(adminStore, 'decreasePendingProductCount').mockImplementation(() => {})
    mockedAdminApi.getCategories.mockResolvedValue(okResponse([buildCategory()]))
    mockedAdminApi.getUsers.mockResolvedValue(
      okPageResponse([buildUser({ id: 2, username: 'lisi', nickname: '李四', role: 'SELLER' })])
    )
    mockedAdminApi.getProducts.mockResolvedValue(
      okPageResponse([buildProduct({ id: 1, name: '商品A', status: 0, auditStatus: 0, stock: 10, price: 99 })])
    )
    mockedAdminApi.getPendingProductCount.mockResolvedValue(okResponse(0))
    mockedAdminApi.getPendingProducts.mockResolvedValue(okResponse([]))
    updateProductSpy.mockResolvedValue({ code: 200 } as any)
    batchUpdateAllProductStatusSpy.mockResolvedValue({ code: 200 } as any)
    reviewProductSpy.mockResolvedValue({ code: 200 } as any)
    deleteProductSpy.mockResolvedValue({ code: 200 } as any)
    createProductSpy.mockResolvedValue({ code: 200 } as any)
    getImageUrlSpy.mockReturnValue('/img.png')
    uploadProductImageSpy.mockResolvedValue({ code: 200, data: '/img.png' } as any)
    uploadAdVideoSpy.mockResolvedValue({ code: 200, data: '/video.mp4' } as any)
    debugError.mockImplementation(() => {})
  })

  const mountView = () =>
    mount(ProductsView, {
      global: {
        plugins: [pinia],
        directives: {
          loading: {}
        },
        stubs: {
          AdminLayout: { template: '<div><slot /></div>' },
          ElTabs: { template: '<div><slot /></div>' },
          ElTabPane: { template: '<div><slot /><slot name="label" /></div>' },
          ElBadge: true,
          ElInput: true,
          ElSelect: true,
          ElOption: true,
          ElInputNumber: true,
          ElButtonGroup: { template: '<div><slot /></div>' },
          ElButton: { template: '<button @click="$emit(\'click\')"><slot /></button>' },
          ElTable: { props: ['data'], template: '<div><slot /></div>' },
          ElTableColumn: { template: '<div><slot :row="$attrs.row || {}" /></div>' },
          ElImage: true,
          ElSwitch: true,
          ElTag: true,
          ElPagination: true,
          ElDialog: { template: '<div><slot /><slot name="footer" /></div>' },
          ElForm: { template: '<form><slot /></form>' },
          ElFormItem: { template: '<div><slot /></div>' },
          ElUpload: { template: '<div><slot /></div>' },
          ElDivider: true,
          ElIcon: true
        }
      }
    })

  it('opens a large product image review dialog for admin photo checks', async () => {
    const wrapper = mountView()

    await flushPromises()
    const product = buildProduct({
      name: '海盐轴 75 键机械键盘',
      categoryName: '桌搭数码',
      sellerName: 'lisi',
      mainImage: '/uploads/products/桌搭数码/2026/05/desk-keyboard-75.jpg',
      images: JSON.stringify([
        '/uploads/products/桌搭数码/2026/05/desk-keyboard-75.jpg',
        '/uploads/products/桌搭数码/2026/05/desk-keycaps-soda.jpg'
      ])
    } as any)

    ;(wrapper.vm as any).openImageReview(product)

    expect((wrapper.vm as any).imageReviewDialogVisible).toBe(true)
    expect((wrapper.vm as any).imageReviewMain).toBe('/uploads/products/桌搭数码/2026/05/desk-keyboard-75.jpg')
    expect((wrapper.vm as any).imageReviewImagePaths).toEqual([
      '/uploads/products/桌搭数码/2026/05/desk-keyboard-75.jpg',
      '/uploads/products/桌搭数码/2026/05/desk-keycaps-soda.jpg'
    ])
  })

  it('does not show an error when admin cancels deleting a product', async () => {
    messageBox.confirm.mockRejectedValue('cancel')
    const wrapper = mountView()

    await flushPromises()
    await (wrapper.vm as unknown as { handleDelete: (product: { id: number; name: string }) => Promise<void> })
      .handleDelete({ id: 1, name: '商品A' })
    await flushPromises()

    expect(mockedAdminApi.deleteProduct).not.toHaveBeenCalled()
    expect(messages.error).not.toHaveBeenCalled()
  })

  it('shows an error when deleting a product fails', async () => {
    mockedAdminApi.deleteProduct.mockRejectedValue({ response: { data: { message: '商品删除失败' } } })
    const wrapper = mountView()

    await flushPromises()
    await (wrapper.vm as unknown as { handleDelete: (product: { id: number; name: string }) => Promise<void> })
      .handleDelete({ id: 1, name: '商品A' })
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('商品删除失败')
    expect(debugError).toHaveBeenCalledWith('删除商品失败:', expect.any(Object))
  })

  it('shows a partial success summary when batch status update has failures', async () => {
    mockedAdminApi.updateProduct
      .mockResolvedValueOnce({ code: 200 })
      .mockRejectedValueOnce(new Error('boom'))
    const wrapper = mountView()

    await flushPromises()
    ;(wrapper.vm as unknown as { selectedProducts: Array<{ id: number; status: number }> }).selectedProducts = [
      { id: 1, status: 0 },
      { id: 2, status: 0 }
    ]

    await (wrapper.vm as unknown as { batchUpdateStatus: (status: number) => Promise<void> }).batchUpdateStatus(1)
    await flushPromises()

    expect(mockedAdminApi.updateProduct).toHaveBeenCalledTimes(2)
    expect(messages.warning).toHaveBeenCalledWith('批量上架完成：成功 1 个，失败 1 个')
    expect(debugError).toHaveBeenCalled()
  })

  it('shows an error when approving a product without ad video fails', async () => {
    mockedAdminApi.reviewProduct.mockRejectedValue({ response: { data: { message: '审核服务暂不可用' } } })
    const wrapper = mountView()

    await flushPromises()
    await (wrapper.vm as unknown as { handleAudit: (product: { id: number; name: string; adVideo?: string }, auditStatus: number) => Promise<void> })
      .handleAudit({ id: 1, name: '商品A', adVideo: '' }, 1)
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('审核服务暂不可用')
    expect(debugError).toHaveBeenCalledWith('审核商品失败:', expect.any(Object))
  })

  it('shows backend message when deleting a product returns non-200 payload', async () => {
    mockedAdminApi.deleteProduct.mockResolvedValue({ code: 500, message: '商品删除失败' })
    const wrapper = mountView()

    await flushPromises()
    await (wrapper.vm as unknown as { handleDelete: (product: { id: number; name: string }) => Promise<void> })
      .handleDelete({ id: 1, name: '商品A' })
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('商品删除失败')
    expect(debugError).toHaveBeenCalledWith('删除商品失败:', '商品删除失败')
  })

  it('shows backend message when approving a product without ad video returns non-200 payload', async () => {
    mockedAdminApi.reviewProduct.mockResolvedValue({ code: 500, message: '审核未通过，请重试' })
    const wrapper = mountView()

    await flushPromises()
    await (wrapper.vm as unknown as { handleAudit: (product: { id: number; name: string; adVideo?: string }, auditStatus: number) => Promise<void> })
      .handleAudit({ id: 1, name: '商品A', adVideo: '' }, 1)
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('审核未通过，请重试')
    expect(debugError).toHaveBeenCalledWith('审核商品失败:', '审核未通过，请重试')
  })

  it('falls back to default ad settings when localStorage is unreadable', async () => {
    const originalLocalStorage = window.localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(() => {
          throw new Error('unreadable')
        }),
        setItem: vi.fn()
      },
      configurable: true
    })
    const wrapper = mountView()

    await flushPromises()
    await (wrapper.vm as unknown as { handleAudit: (product: { id: number; name: string; adVideo: string }, auditStatus: number) => Promise<void> })
      .handleAudit({ id: 1, name: '商品A', adVideo: '/video.mp4' }, 1)
    await flushPromises()

    expect((wrapper.vm as unknown as { approveDialogVisible: boolean }).approveDialogVisible).toBe(true)
    expect((wrapper.vm as unknown as { approveAdEnabled: number }).approveAdEnabled).toBe(1)
    expect((wrapper.vm as unknown as { approveAdDuration: number }).approveAdDuration).toBe(5)
    expect(debugError).toHaveBeenCalled()

    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
      configurable: true
    })
  })

  it('falls back to default ad settings when localStorage payload shape is invalid', async () => {
    const originalLocalStorage = window.localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(() => JSON.stringify({ enabled: 'yes', duration: 0 })),
        setItem: vi.fn()
      },
      configurable: true
    })
    const wrapper = mountView()

    await flushPromises()
    await (wrapper.vm as unknown as { handleAudit: (product: { id: number; name: string; adVideo: string }, auditStatus: number) => Promise<void> })
      .handleAudit({ id: 1, name: '商品A', adVideo: '/video.mp4' }, 1)
    await flushPromises()

    expect((wrapper.vm as unknown as { approveDialogVisible: boolean }).approveDialogVisible).toBe(true)
    expect((wrapper.vm as unknown as { approveAdEnabled: number }).approveAdEnabled).toBe(1)
    expect((wrapper.vm as unknown as { approveAdDuration: number }).approveAdDuration).toBe(5)
    expect(debugError).toHaveBeenCalledWith('读取广告设置失败，已回退默认值:', expect.stringContaining('invalid ad settings'))

    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
      configurable: true
    })
  })

  it('logs backend message when toggling product status returns non-200 payload', async () => {
    mockedAdminApi.updateProduct.mockResolvedValue({ code: 500, message: '商品状态切换失败' })
    const wrapper = mountView()

    await flushPromises()
    const product = { id: 1, status: 1 }
    await (wrapper.vm as unknown as { toggleStatus: (product: { id: number; status: number }) => Promise<void> }).toggleStatus(product)
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('商品状态切换失败')
    expect(debugError).toHaveBeenCalledWith('切换商品上下架状态失败:', '商品状态切换失败')
  })

  it('refreshes products after toggling product status successfully', async () => {
    mockedAdminApi.updateProduct.mockResolvedValue({ code: 200 })
    mockedAdminApi.getProducts
      .mockResolvedValueOnce({
        code: 200,
        data: {
          content: [
            { id: 1, name: '商品A', status: 0, auditStatus: 0, stock: 10, price: 99 }
          ],
          totalElements: 1
        }
      })
      .mockResolvedValueOnce({
        code: 200,
        data: {
          content: [
            { id: 1, name: '商品A', status: 1, auditStatus: 0, stock: 10, price: 99 }
          ],
          totalElements: 1
        }
      })
    const wrapper = mountView()

    await flushPromises()
    const product = { id: 1, status: 1 }
    await (wrapper.vm as unknown as { toggleStatus: (product: { id: number; status: number }) => Promise<void> }).toggleStatus(product)
    await flushPromises()

    expect(mockedAdminApi.getProducts).toHaveBeenCalledTimes(2)
    expect(messages.success).toHaveBeenCalledWith('已上架')
  })

  it('logs backend message when confirming approve returns non-200 payload', async () => {
    mockedAdminApi.reviewProduct.mockResolvedValue({ code: 500, message: '审核确认失败' })
    const wrapper = mountView()

    await flushPromises()
    ;(wrapper.vm as any).approveProduct = { id: 1, adVideo: '/video.mp4' }
    await (wrapper.vm as any).confirmApprove()
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('审核确认失败')
    expect(debugError).toHaveBeenCalledWith('确认通过商品审核失败:', '审核确认失败')
  })

  it('keeps approve flow successful when saving ad settings to localStorage throws', async () => {
    const originalLocalStorage = window.localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(() => null),
        setItem: vi.fn(() => {
          throw new Error('settings unwritable')
        })
      },
      configurable: true
    })
    mockedAdminApi.reviewProduct.mockResolvedValue({ code: 200 })
    mockedAdminApi.getProducts
      .mockResolvedValueOnce({
        code: 200,
        data: {
          content: [{ id: 1, name: '商品A', status: 0, auditStatus: 0, stock: 10, price: 99, adVideo: '/video.mp4' }],
          totalElements: 1
        }
      })
      .mockResolvedValueOnce({
        code: 200,
        data: {
          content: [{ id: 1, name: '商品A', status: 0, auditStatus: 1, stock: 10, price: 99, adVideo: '/video.mp4' }],
          totalElements: 1
        }
      })
    const wrapper = mountView()

    await flushPromises()
    ;(wrapper.vm as any).approveProduct = { id: 1, name: '商品A', adVideo: '/video.mp4' }
    ;(wrapper.vm as any).approveAdEnabled = 1
    ;(wrapper.vm as any).approveAdDuration = 5
    await (wrapper.vm as any).confirmApprove()
    await flushPromises()

    expect(messages.success).toHaveBeenCalledWith('审核通过，广告已启用')
    expect(mockedAdminApi.reviewProduct).toHaveBeenCalledWith(1, {
      auditStatus: 1,
      adVideoEnabled: 1,
      adVideoDuration: 5
    })
    expect(debugError).toHaveBeenCalledWith('保存广告设置失败:', expect.any(Error))

    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
      configurable: true
    })
  })

  it('logs backend message when confirming reject returns non-200 payload', async () => {
    mockedAdminApi.reviewProduct.mockResolvedValue({ code: 500, message: '拒绝审核失败' })
    const wrapper = mountView()

    await flushPromises()
    ;(wrapper.vm as any).rejectProductId = 1
    ;(wrapper.vm as any).rejectRemark = '不合规'
    await (wrapper.vm as any).confirmReject()
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('拒绝审核失败')
    expect(debugError).toHaveBeenCalledWith('拒绝商品审核失败:', '拒绝审核失败')
  })

  it('keeps approve success when pending badge refresh rejects afterward', async () => {
    mockedAdminApi.reviewProduct.mockResolvedValue({ code: 200 })
    ;(adminStore.fetchPendingProductCount as any).mockRejectedValueOnce(new Error('badge refresh failed'))
    const wrapper = mountView()

    await flushPromises()
    ;(wrapper.vm as any).approveProduct = { id: 1, name: '商品A', adVideo: '/video.mp4' }
    ;(wrapper.vm as any).approveAdEnabled = 0
    await (wrapper.vm as any).confirmApprove()
    await flushPromises()

    expect(messages.success).toHaveBeenCalledWith('审核通过')
    expect(adminStore.decreasePendingProductCount).toHaveBeenCalled()
    expect(messages.error).not.toHaveBeenCalled()
    expect(debugError).toHaveBeenCalledWith('确认通过商品审核成功后刷新后台待审核徽标失败:', expect.any(Error))
  })

  it('clears audit dialog state after approve and reject succeed', async () => {
    mockedAdminApi.reviewProduct.mockResolvedValue({ code: 200 })
    const wrapper = mountView()

    await flushPromises()

    ;(wrapper.vm as any).approveProduct = { id: 1, name: '商品A', adVideo: '/video.mp4' }
    ;(wrapper.vm as any).approveDialogVisible = true
    ;(wrapper.vm as any).approveAdEnabled = 0
    await (wrapper.vm as any).confirmApprove()
    await flushPromises()

    expect((wrapper.vm as any).approveDialogVisible).toBe(false)
    expect((wrapper.vm as any).approveProduct).toBeNull()

    ;(wrapper.vm as any).rejectProductId = 2
    ;(wrapper.vm as any).rejectRemark = '不合规'
    ;(wrapper.vm as any).rejectDialogVisible = true
    await (wrapper.vm as any).confirmReject()
    await flushPromises()

    expect((wrapper.vm as any).rejectDialogVisible).toBe(false)
    expect((wrapper.vm as any).rejectProductId).toBeNull()
    expect((wrapper.vm as any).rejectRemark).toBe('')
  })

  it('logs when product categories return non-200 payload', async () => {
    mockedAdminApi.getCategories.mockResolvedValue({ code: 500, message: '分类读取失败' })

    mountView()
    await flushPromises()

    expect(debugError).toHaveBeenCalledWith('获取商品分类失败:', '分类读取失败')
  })

  it('logs when pending count returns non-200 payload', async () => {
    mockedAdminApi.getPendingProductCount.mockResolvedValue({ code: 500, message: '待审核数读取失败' })
    mockedAdminApi.getPendingProducts.mockResolvedValue({ code: 200, data: [] })

    mountView()
    await flushPromises()

    expect(debugError).toHaveBeenCalledWith('获取待审核商品数量失败:', '待审核数读取失败')
  })

  it('logs when pending products list returns non-200 payload', async () => {
    mockedAdminApi.getPendingProductCount.mockResolvedValue({ code: 200, data: 0 })
    mockedAdminApi.getPendingProducts.mockResolvedValue({ code: 500, message: '待审核列表读取失败' })
    const wrapper = mountView()

    await flushPromises()
    ;(wrapper.vm as any).activeTab = 'pending'
    await (wrapper.vm as any).fetchProducts()
    await flushPromises()

    expect(debugError).toHaveBeenCalledWith('获取商品管理列表失败:', '待审核列表读取失败')
  })

  it('refreshes products after saving a product successfully', async () => {
    mockedAdminApi.createProduct.mockResolvedValue({ code: 200 })
    mockedAdminApi.getProducts
      .mockResolvedValueOnce({
        code: 200,
        data: {
          content: [
            { id: 1, name: '商品A', status: 0, auditStatus: 0, stock: 10, price: 99 }
          ],
          totalElements: 1
        }
      })
      .mockResolvedValueOnce({
        code: 200,
        data: {
          content: [
            { id: 1, name: '商品A', status: 0, auditStatus: 0, stock: 10, price: 99 },
            { id: 2, name: '商品B', status: 0, auditStatus: 0, stock: 5, price: 199 }
          ],
          totalElements: 2
        }
      })
    const wrapper = mountView()

    await flushPromises()
    ;(wrapper.vm as any).form.name = '商品B'
    ;(wrapper.vm as any).form.description = '描述'
    ;(wrapper.vm as any).form.categoryId = 1
    ;(wrapper.vm as any).form.sellerId = 2
    ;(wrapper.vm as any).form.price = 199
    ;(wrapper.vm as any).form.stock = 5
    ;(wrapper.vm as any).form.status = 1
    ;(wrapper.vm as any).form.mainImage = '/b.png'

    await (wrapper.vm as any).saveProduct()
    await flushPromises()

    expect(mockedAdminApi.getProducts).toHaveBeenCalledTimes(2)
    expect(messages.success).toHaveBeenCalledWith('商品添加成功')
  })

  it('blocks admin product save when no product image has been uploaded', async () => {
    const wrapper = mountView()

    await flushPromises()
    ;(wrapper.vm as any).form.name = '商品B'
    ;(wrapper.vm as any).form.description = '描述'
    ;(wrapper.vm as any).form.categoryId = 1
    ;(wrapper.vm as any).form.sellerId = 2
    ;(wrapper.vm as any).form.price = 199
    ;(wrapper.vm as any).form.stock = 5
    ;(wrapper.vm as any).form.status = 1
    ;(wrapper.vm as any).form.images = []
    ;(wrapper.vm as any).form.mainImage = ''

    await (wrapper.vm as any).saveProduct()
    await flushPromises()

    expect(mockedAdminApi.createProduct).not.toHaveBeenCalled()
    expect(mockedAdminApi.updateProduct).not.toHaveBeenCalled()
    expect((wrapper.vm as any).saving).toBe(false)
  })

  it('keeps product create successful with local append when refresh fails afterward', async () => {
    mockedAdminApi.createProduct.mockResolvedValue({
      code: 200,
      data: { id: 2, name: '商品B', status: 1, auditStatus: 0, stock: 5, price: 199, categoryId: 1, mainImage: '/b.png', description: '描述' }
    })
    mockedAdminApi.getProducts
      .mockResolvedValueOnce({
        code: 200,
        data: {
          content: [
            { id: 1, name: '商品A', status: 0, auditStatus: 0, stock: 10, price: 99 }
          ],
          totalElements: 1
        }
      })
      .mockRejectedValueOnce(new Error('refresh failed'))

    const wrapper = mountView()

    await flushPromises()
    ;(wrapper.vm as any).form.name = '商品B'
    ;(wrapper.vm as any).form.description = '描述'
    ;(wrapper.vm as any).form.categoryId = 1
    ;(wrapper.vm as any).form.sellerId = 2
    ;(wrapper.vm as any).form.price = 199
    ;(wrapper.vm as any).form.stock = 5
    ;(wrapper.vm as any).form.status = 1
    ;(wrapper.vm as any).form.mainImage = '/b.png'

    await (wrapper.vm as any).saveProduct()
    await flushPromises()

    expect(messages.success).toHaveBeenCalledWith('商品添加成功')
    expect(messages.error).not.toHaveBeenCalled()
    expect((wrapper.vm as any).products[0]).toEqual(expect.objectContaining({ id: 2, name: '商品B', price: 199, stock: 5 }))
    expect((wrapper.vm as any).total).toBe(2)
    expect(debugError).toHaveBeenCalledWith('获取商品管理列表失败', expect.any(Error))
  })

  it('keeps product edit successful with local update when refresh fails afterward', async () => {
    mockedAdminApi.updateProduct.mockResolvedValue({
      code: 200,
      data: { id: 1, name: '商品A-新版', status: 1, auditStatus: 0, stock: 8, price: 129, categoryId: 1, mainImage: '/a-new.png', description: '新版描述' }
    })
    mockedAdminApi.getProducts
      .mockResolvedValueOnce({
        code: 200,
        data: {
          content: [
            { id: 1, name: '商品A', status: 0, auditStatus: 0, stock: 10, price: 99, categoryId: 1, mainImage: '/a.png', description: '旧描述' }
          ],
          totalElements: 1
        }
      })
      .mockRejectedValueOnce(new Error('refresh failed'))

    const wrapper = mountView()

    await flushPromises()
    ;(wrapper.vm as any).isEdit = true
    ;(wrapper.vm as any).editId = 1
    ;(wrapper.vm as any).form.name = '商品A-新版'
    ;(wrapper.vm as any).form.description = '新版描述'
    ;(wrapper.vm as any).form.categoryId = 1
    ;(wrapper.vm as any).form.sellerId = 2
    ;(wrapper.vm as any).form.price = 129
    ;(wrapper.vm as any).form.stock = 8
    ;(wrapper.vm as any).form.status = 1
    ;(wrapper.vm as any).form.mainImage = '/a-new.png'

    await (wrapper.vm as any).saveProduct()
    await flushPromises()

    expect(messages.success).toHaveBeenCalledWith('商品更新成功')
    expect((wrapper.vm as any).products[0]).toEqual(expect.objectContaining({ id: 1, name: '商品A-新版', price: 129, stock: 8, status: 1 }))
    expect(debugError).toHaveBeenCalledWith('获取商品管理列表失败', expect.any(Error))
  })

  it('ignores stale product list responses when a newer refresh finishes first', async () => {
    const firstRequest = createDeferred<any>()
    const secondRequest = createDeferred<any>()

    mockedAdminApi.getProducts
      .mockImplementationOnce(() => firstRequest.promise)
      .mockImplementationOnce(() => secondRequest.promise)

    const wrapper = mountView()
    await flushPromises()

    const vm = wrapper.vm as unknown as { fetchProducts: () => Promise<void> }
    const refetchPromise = vm.fetchProducts()
    await flushPromises()

    secondRequest.resolve({
      code: 200,
      data: {
        content: [
          { id: 2, name: '商品B', status: 1, auditStatus: 0, stock: 5, price: 199 }
        ],
        totalElements: 1
      }
    })
    await refetchPromise
    await flushPromises()

    expect((wrapper.vm as any).products[0].name).toBe('商品B')

    firstRequest.resolve({
      code: 200,
      data: {
        content: [
          { id: 1, name: '商品A', status: 0, auditStatus: 0, stock: 10, price: 99 }
        ],
        totalElements: 1
      }
    })
    await flushPromises()

    expect((wrapper.vm as any).products[0].name).toBe('商品B')
  })

  it('does not let an in-flight product request overwrite local edit success', async () => {
    const firstRequest = createDeferred<any>()
    const secondRequest = createDeferred<any>()

    mockedAdminApi.getProducts
      .mockImplementationOnce(() => firstRequest.promise)
      .mockImplementationOnce(() => secondRequest.promise)
    mockedAdminApi.updateProduct.mockResolvedValue({
      code: 200,
      data: { id: 1, name: '商品A-新版', status: 1, auditStatus: 0, stock: 8, price: 129, categoryId: 1, mainImage: '/a-new.png', description: '新版描述' }
    })

    const wrapper = mountView()
    await flushPromises()
    ;(wrapper.vm as any).products = [{ id: 1, name: '商品A', status: 0, auditStatus: 0, stock: 10, price: 99, categoryId: 1, mainImage: '/a.png', description: '旧描述' }]
    ;(wrapper.vm as any).isEdit = true
    ;(wrapper.vm as any).editId = 1
    ;(wrapper.vm as any).form.name = '商品A-新版'
    ;(wrapper.vm as any).form.description = '新版描述'
    ;(wrapper.vm as any).form.categoryId = 1
    ;(wrapper.vm as any).form.sellerId = 2
    ;(wrapper.vm as any).form.price = 129
    ;(wrapper.vm as any).form.stock = 8
    ;(wrapper.vm as any).form.status = 1
    ;(wrapper.vm as any).form.mainImage = '/a-new.png'

    const savePromise = (wrapper.vm as any).saveProduct()
    await flushPromises()

    expect((wrapper.vm as any).products[0]).toEqual(expect.objectContaining({ id: 1, name: '商品A-新版', price: 129, stock: 8, status: 1 }))

    secondRequest.resolve({
      code: 200,
      data: {
        content: [
          { id: 1, name: '商品A-新版', status: 1, auditStatus: 0, stock: 8, price: 129, categoryId: 1, mainImage: '/a-new.png', description: '新版描述' }
        ],
        totalElements: 1
      }
    })
    await savePromise
    await flushPromises()

    firstRequest.resolve({
      code: 200,
      data: {
        content: [
          { id: 1, name: '商品A', status: 0, auditStatus: 0, stock: 10, price: 99, categoryId: 1, mainImage: '/a.png', description: '旧描述' }
        ],
        totalElements: 1
      }
    })
    await flushPromises()

    expect((wrapper.vm as any).products[0]).toEqual(expect.objectContaining({ id: 1, name: '商品A-新版', price: 129, stock: 8, status: 1 }))
  })

  it('ignores stale pending count responses when a newer refresh finishes first', async () => {
    const firstCountRequest = createDeferred<any>()
    const secondCountRequest = createDeferred<any>()
    let countCall = 0

    mockedAdminApi.getPendingProducts.mockResolvedValue({ code: 200, data: [] })
    mockedAdminApi.getPendingProductCount.mockImplementation(() => {
      countCall += 1
      return countCall === 1 ? firstCountRequest.promise : secondCountRequest.promise
    })

    const wrapper = mountView()
    await flushPromises()

    const vm = wrapper.vm as unknown as { fetchPendingCount: () => Promise<void> }
    const firstLoad = vm.fetchPendingCount()
    await flushPromises()
    const secondLoad = vm.fetchPendingCount()
    await flushPromises()

    secondCountRequest.resolve({ code: 200, data: 6 })
    await secondLoad
    await flushPromises()

    expect((wrapper.vm as any).pendingCount).toBe(6)

    firstCountRequest.resolve({ code: 200, data: 2 })
    await firstLoad
    await flushPromises()

    expect((wrapper.vm as any).pendingCount).toBe(6)
  })

  it('does not let an in-flight product request overwrite local delete success', async () => {
    const firstRequest = createDeferred<any>()
    const secondRequest = createDeferred<any>()

    mockedAdminApi.getProducts
      .mockImplementationOnce(() => firstRequest.promise)
      .mockImplementationOnce(() => secondRequest.promise)
    mockedAdminApi.deleteProduct.mockResolvedValue({ code: 200 })

    const wrapper = mountView()
    await flushPromises()
    ;(wrapper.vm as any).products = [{ id: 1, name: '商品A', status: 0, auditStatus: 0, stock: 10, price: 99 }]
    ;(wrapper.vm as any).total = 1

    const deletePromise = (wrapper.vm as any).handleDelete((wrapper.vm as any).products[0])
    await flushPromises()

    expect((wrapper.vm as any).products).toEqual([])

    secondRequest.resolve({ code: 200, data: { content: [], totalElements: 0 } })
    await deletePromise
    await flushPromises()

    firstRequest.resolve({
      code: 200,
      data: {
        content: [{ id: 1, name: '商品A', status: 0, auditStatus: 0, stock: 10, price: 99 }],
        totalElements: 1
      }
    })
    await flushPromises()

    expect((wrapper.vm as any).products).toEqual([])
  })

  it('does not let an in-flight pending request overwrite local approve success', async () => {
    const firstPendingRequest = createDeferred<any>()
    const secondPendingRequest = createDeferred<any>()
    let pendingCall = 0
    let pendingCountCall = 0

    mockedAdminApi.getPendingProductCount.mockImplementation(() => {
      pendingCountCall += 1
      return Promise.resolve({ code: 200, data: pendingCountCall >= 2 ? 0 : 1 })
    })
    mockedAdminApi.getPendingProducts.mockImplementation(() => {
      pendingCall += 1
      return pendingCall === 1 ? firstPendingRequest.promise : secondPendingRequest.promise
    })
    mockedAdminApi.reviewProduct.mockResolvedValue({ code: 200 })

    const wrapper = mountView()
    await flushPromises()
    ;(wrapper.vm as any).activeTab = 'pending'
    ;(wrapper.vm as any).products = [{ id: 1, name: '商品A', status: 0, auditStatus: 0, stock: 10, price: 99 }]
    ;(wrapper.vm as any).pendingCount = 1

    const stalePromise = (wrapper.vm as any).fetchProducts()
    await flushPromises()

    const approvePromise = (wrapper.vm as any).handleAudit({ id: 1, name: '商品A', adVideo: '' }, 1)
    await flushPromises()

    expect((wrapper.vm as any).products).toEqual([])
    expect((wrapper.vm as any).pendingCount).toBe(0)

    secondPendingRequest.resolve({ code: 200, data: [] })
    await approvePromise
    await flushPromises()

    firstPendingRequest.resolve({ code: 200, data: [{ id: 1, name: '商品A', status: 0, auditStatus: 0, stock: 10, price: 99 }] })
    await stalePromise
    await flushPromises()

    expect((wrapper.vm as any).products).toEqual([])
    expect((wrapper.vm as any).pendingCount).toBe(0)
  })
})
