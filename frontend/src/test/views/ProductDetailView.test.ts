import { createPinia, setActivePinia } from 'pinia'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useCartStore } from '@/stores/cartStore'
import { useUserStore } from '@/stores/userStore'
import productApi from '@/api/productApi'
import reviewApi from '@/api/reviewApi'
import priceApi from '@/api/priceApi'
import rationalApi from '@/api/rationalApi'
import fileApi from '@/api/fileApi'
import { buildUser } from '@/test/helpers/factories'
import * as debugModule from '@/utils/debug'

const windowEvents = vi.hoisted(() => ({
  add: vi.fn(),
  remove: vi.fn()
}))

const messages = {
  warning: vi.spyOn(ElMessage, 'warning').mockImplementation(() => '' as any),
  error: vi.spyOn(ElMessage, 'error').mockImplementation(() => '' as any),
  success: vi.spyOn(ElMessage, 'success').mockImplementation(() => '' as any)
}

const messageBox = {
  confirm: vi.spyOn(ElMessageBox, 'confirm')
}

const mockedProductApi = vi.mocked(productApi) as any
const mockedReviewApi = vi.mocked(reviewApi) as any
const mockedPriceApi = vi.mocked(priceApi) as any
const mockedRationalApi = vi.mocked(rationalApi) as any
const mockedFileApi = vi.mocked(fileApi) as any

const getProductByIdSpy = vi.spyOn(productApi, 'getProductById')
const getAllProductReviewsSpy = vi.spyOn(reviewApi, 'getAllProductReviews')
const getProductReviewStatsSpy = vi.spyOn(reviewApi, 'getProductReviewStats')
const deleteReviewSpy = vi.spyOn(reviewApi, 'deleteReview')
const getPriceHistorySpy = vi.spyOn(priceApi, 'getPriceHistory')
const getPriceStatsSpy = vi.spyOn(priceApi, 'getPriceStats')
const getUserProductAlertSpy = vi.spyOn(priceApi, 'getUserProductAlert')
const createAlertSpy = vi.spyOn(priceApi, 'createAlert')
const cancelAlertSpy = vi.spyOn(priceApi, 'cancelAlert')
const checkDuplicateSpy = vi.spyOn(rationalApi, 'checkDuplicate')
const checkInWishlistSpy = vi.spyOn(rationalApi, 'checkInWishlist')
const addToWishlistSpy = vi.spyOn(rationalApi, 'addToWishlist')
const getImageUrlSpy = vi.spyOn(fileApi, 'getImageUrl')
const debugError = vi.spyOn(debugModule, 'debugError').mockImplementation(() => {})
const debugLog = vi.spyOn(debugModule, 'debugLog').mockImplementation(() => {})

vi.mock('echarts/core', () => ({
  use: vi.fn(),
  init: vi.fn(() => ({
    setOption: vi.fn(),
    resize: vi.fn(),
    dispose: vi.fn()
  })),
  graphic: {
    LinearGradient: vi.fn()
  }
}))

vi.mock('echarts/renderers', () => ({
  CanvasRenderer: {}
}))

vi.mock('echarts/charts', () => ({
  LineChart: {}
}))

vi.mock('echarts/components', () => ({
  GridComponent: {},
  LegendComponent: {},
  TooltipComponent: {}
}))

import ProductDetailView from '@/views/ProductDetailView.vue'

const deferred = <T>() => {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

function buildProduct(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    name: '测试商品',
    description: '描述',
    price: 99,
    originalPrice: 129,
    stock: 5,
    sales: 3,
    mainImage: '/a.png',
    images: '',
    sellerId: 2,
    adVideoEnabled: 0,
    ...overrides
  }
}

describe('ProductDetailView', () => {
  let pinia: ReturnType<typeof createPinia>
  let router: Router
  let routerPushSpy: any

  beforeEach(async () => {
    vi.clearAllMocks()
    pinia = createPinia()
    setActivePinia(pinia)
    messageBox.confirm.mockResolvedValue('confirm' as any)
    Object.defineProperty(window, 'addEventListener', { value: windowEvents.add, configurable: true })
    Object.defineProperty(window, 'removeEventListener', { value: windowEvents.remove, configurable: true })

    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/product/:id', component: { template: '<div />' } },
        { path: '/checkout', component: { template: '<div />' } },
        { path: '/login', component: { template: '<div />' } },
        { path: '/rational-consumption', component: { template: '<div />' } }
      ]
    })
    await router.push('/product/1')
    await router.isReady()
    routerPushSpy = vi.spyOn(router, 'push')

    const userStore = useUserStore()
    userStore.token = 'token'
    userStore.userInfo = buildUser({ id: 1, username: 'buyer', role: 'BUYER' })

    const cartStore = useCartStore()
    cartStore.addToCart = vi.fn().mockResolvedValue({})

    getProductByIdSpy.mockResolvedValue({ code: 200, data: buildProduct() } as any)
    getAllProductReviewsSpy.mockResolvedValue({ code: 200, data: [] } as any)
    getProductReviewStatsSpy.mockResolvedValue({
      code: 200,
      data: { total: 0, avgRating: 0, goodRate: 100 }
    } as any)
    getPriceHistorySpy.mockResolvedValue({ code: 200, data: [] } as any)
    getPriceStatsSpy.mockResolvedValue({
      code: 200,
      data: {
        currentPrice: 99,
        lowestPrice: 88,
        highestPrice: 129,
        avgPrice: 103,
        recordCount: 1,
        pricePosition: 30,
        isLowestPrice: false
      }
    } as any)
    getUserProductAlertSpy.mockResolvedValue({ code: 200, data: null } as any)
    checkDuplicateSpy.mockResolvedValue({ code: 200, data: [] } as any)
    checkInWishlistSpy.mockResolvedValue({ code: 200, data: { inWishlist: false } } as any)
    getImageUrlSpy.mockImplementation((path: string | null | undefined) => path || '/placeholder.png')
    debugError.mockImplementation(() => {})
    debugLog.mockImplementation(() => {})
  })

  const mountView = () =>
    mount(ProductDetailView, {
      global: {
        plugins: [pinia, router],
        stubs: {
          Navbar: true,
          Footer: true,
          RouterLink: true,
          ElInput: true,
          ElCheckbox: true
        }
      }
    })

  it('disables quantity and purchase actions when stock is zero', async () => {
    mockedProductApi.getProductById.mockResolvedValue({ code: 200, data: buildProduct({ stock: 0 }) })

    const wrapper = mountView()

    await flushPromises()

    expect(wrapper.get('[data-testid="product-add-to-cart"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('[data-testid="product-buy-now"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('input[type="number"]').attributes('disabled')).toBeDefined()
  })

  it('keeps product detail assistance copy within implemented scope', async () => {
    mockedProductApi.getProductById.mockResolvedValue({
      code: 200,
      data: buildProduct({ description: '' })
    })

    const wrapper = mountView()

    await flushPromises()

    expect(wrapper.text()).toContain('价格走势')
    expect(wrapper.text()).toContain('降价提醒')
    expect(wrapper.text()).toContain('想要清单')
    expect(wrapper.text()).toContain('先记录再决定是否购买')
    expect(wrapper.text()).not.toContain('7天无理由')
    expect(wrapper.text()).not.toContain('正品保障')
    expect(wrapper.text()).not.toContain('极速发货')
  })

  it('normalizes decimal quantity and caps it at stock on blur', async () => {
    mockedProductApi.getProductById.mockResolvedValue({ code: 200, data: buildProduct({ stock: 3 }) })

    const wrapper = mountView()

    await flushPromises()

    const quantityInput = wrapper.get('input[type="number"]')
    await quantityInput.setValue('5.7')
    await quantityInput.trigger('blur')

    expect((quantityInput.element as HTMLInputElement).value).toBe('3')
    expect(messages.warning).toHaveBeenCalledWith('数量已调整为最大库存 3 件')
  })

  it('navigates to checkout with normalized quantity when buying now', async () => {
    const wrapper = mountView()

    await flushPromises()

    const quantityInput = wrapper.get('input[type="number"]')
    await quantityInput.setValue('2')
    await wrapper.get('[data-testid="product-buy-now"]').trigger('click')

    expect(routerPushSpy).toHaveBeenCalledWith('/checkout?productId=1&quantity=2')
  })

  it('does not show an error when cancelling review deletion', async () => {
    messageBox.confirm.mockRejectedValueOnce('cancel')

    const wrapper = mountView()

    await flushPromises()
    await (wrapper.vm as any).deleteReview({ id: 9, userId: 1 })

    expect(mockedReviewApi.deleteReview).not.toHaveBeenCalled()
    expect(messages.error).not.toHaveBeenCalled()
  })

  it('shows backend chinese message when creating alert fails', async () => {
    mockedPriceApi.createAlert.mockRejectedValueOnce({
      response: { data: { message: '已存在提醒' } }
    })

    const wrapper = mountView()

    await flushPromises()
    ;(wrapper.vm as any).targetPrice = 80
    await (wrapper.vm as any).setAlert()

    expect(messages.error).toHaveBeenCalledWith('已存在提醒')
    expect(debugError).toHaveBeenCalled()
  })

  it('refreshes real alert state after cancelling a price alert', async () => {
    mockedPriceApi.getUserProductAlert
      .mockResolvedValueOnce({ code: 200, data: { id: 1, productId: 1, targetPrice: 80, currentPrice: 99, status: 0 } })
      .mockResolvedValueOnce({ code: 200, data: null })
    mockedPriceApi.cancelAlert.mockResolvedValueOnce({ code: 200 })

    const wrapper = mountView()

    await flushPromises()
    await (wrapper.vm as any).cancelAlert()
    await flushPromises()

    expect(mockedPriceApi.cancelAlert).toHaveBeenCalledWith(1)
    expect(mockedPriceApi.getUserProductAlert).toHaveBeenCalledTimes(2)
    expect(messages.success).toHaveBeenCalledWith('已取消降价提醒')
  })

  it('keeps alert creation successful when alert refresh fails afterward', async () => {
    mockedPriceApi.createAlert.mockResolvedValueOnce({ code: 200 })
    mockedPriceApi.getUserProductAlert
      .mockResolvedValueOnce({ code: 200, data: null })
      .mockRejectedValueOnce(new Error('refresh failed'))

    const wrapper = mountView()

    await flushPromises()
    ;(wrapper.vm as any).targetPrice = 80
    await (wrapper.vm as any).setAlert()
    await flushPromises()

    expect(messages.success).toHaveBeenCalledWith('降价提醒设置成功')
    expect(messages.error).not.toHaveBeenCalled()
    expect(debugError).toHaveBeenCalledWith('获取降价提醒失败', expect.any(Error))
  })

  it('shows backend chinese message when adding to wishlist fails', async () => {
    mockedRationalApi.addToWishlist.mockRejectedValueOnce({
      response: { data: { message: '商品已在清单中' } }
    })

    const wrapper = mountView()

    await flushPromises()
    await (wrapper.vm as any).addToWishlist()

    expect(messages.error).toHaveBeenCalledWith('商品已在清单中')
    expect(debugError).toHaveBeenCalled()
  })

  it('refreshes real wishlist state after adding successfully', async () => {
    mockedRationalApi.checkInWishlist
      .mockResolvedValueOnce({ code: 200, data: { inWishlist: false } })
      .mockResolvedValueOnce({ code: 200, data: { inWishlist: true } })
    mockedRationalApi.addToWishlist.mockResolvedValueOnce({ code: 200 })

    const wrapper = mountView()

    await flushPromises()
    await (wrapper.vm as any).addToWishlist()
    await flushPromises()

    expect(mockedRationalApi.addToWishlist).toHaveBeenCalled()
    expect(mockedRationalApi.checkInWishlist).toHaveBeenCalledTimes(2)
    expect(messages.success).toHaveBeenCalledWith('已加入想要清单，冷静期3天')
  })

  it('keeps wishlist add successful when wishlist status refresh fails afterward', async () => {
    mockedRationalApi.checkInWishlist
      .mockResolvedValueOnce({ code: 200, data: { inWishlist: false } })
      .mockRejectedValueOnce(new Error('refresh failed'))
    mockedRationalApi.addToWishlist.mockResolvedValueOnce({ code: 200 })

    const wrapper = mountView()

    await flushPromises()
    await (wrapper.vm as any).addToWishlist()
    await flushPromises()

    expect(messages.success).toHaveBeenCalledWith('已加入想要清单，冷静期3天')
    expect(messages.error).not.toHaveBeenCalled()
    expect(debugError).toHaveBeenCalledWith('检查想要清单状态失败', expect.any(Error))
  })

  it('logs backend message when deleting review returns non-200', async () => {
    mockedReviewApi.getAllProductReviews.mockResolvedValue({
      code: 200,
      data: [{ id: 9, userId: 1, username: 'buyer', rating: 5, content: '好评' }]
    })
    mockedReviewApi.deleteReview.mockResolvedValueOnce({ code: 500, message: '评价删除失败' })

    const wrapper = mountView()

    await flushPromises()
    await (wrapper.vm as any).deleteReview({ id: 9, userId: 1 })
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('评价删除失败')
    expect(debugError).toHaveBeenCalledWith('删除评价失败', '评价删除失败')
  })

  it('removes review locally and keeps deletion success when review refresh fails afterward', async () => {
    mockedReviewApi.getAllProductReviews.mockResolvedValueOnce({
      code: 200,
      data: [
        { id: 9, userId: 1, username: 'buyer', rating: 5, content: '好评' },
        { id: 10, userId: 2, username: 'other', rating: 3, content: '一般' }
      ]
    })
    mockedReviewApi.getProductReviewStats.mockResolvedValueOnce({
      code: 200,
      data: { total: 2, avgRating: 4, goodRate: 50, ratingCounts: { 5: 1, 3: 1 } }
    })
    mockedReviewApi.deleteReview.mockResolvedValueOnce({ code: 200 })
    mockedReviewApi.getAllProductReviews.mockRejectedValueOnce(new Error('refresh failed'))
    mockedReviewApi.getProductReviewStats.mockRejectedValueOnce(new Error('refresh failed'))

    const wrapper = mountView()

    await flushPromises()
    await (wrapper.vm as any).deleteReview({ id: 9, userId: 1, rating: 5, content: '好评' })
    await flushPromises()

    expect(messages.success).toHaveBeenCalledWith('评价已删除')
    expect(messages.error).not.toHaveBeenCalled()
    expect((wrapper.vm as any).reviews).toEqual([
      expect.objectContaining({ id: 10, content: '一般' })
    ])
    expect((wrapper.vm as any).reviewStats).toMatchObject({
      total: 1,
      avgRating: 3,
      goodRate: 0,
      ratingCounts: { 3: 1 }
    })
    expect(debugError).toHaveBeenCalledWith('获取评价失败', expect.any(Error))
  })

  it('logs backend message when creating alert returns non-200', async () => {
    mockedPriceApi.createAlert.mockResolvedValueOnce({ code: 500, message: '降价提醒已存在' })

    const wrapper = mountView()

    await flushPromises()
    ;(wrapper.vm as any).targetPrice = 80
    await (wrapper.vm as any).setAlert()

    expect(messages.error).toHaveBeenCalledWith('降价提醒已存在')
    expect(debugError).toHaveBeenCalledWith('设置降价提醒失败', '降价提醒已存在')
  })

  it('logs backend message when cancelling alert returns non-200', async () => {
    mockedPriceApi.getUserProductAlert
      .mockResolvedValueOnce({ code: 200, data: { id: 1, productId: 1, targetPrice: 80, currentPrice: 99, status: 0 } })
      .mockResolvedValueOnce({ code: 200, data: { id: 1, productId: 1, targetPrice: 80, currentPrice: 99, status: 0 } })
    mockedPriceApi.cancelAlert.mockResolvedValueOnce({ code: 500, message: '当前提醒无法取消' })

    const wrapper = mountView()

    await flushPromises()
    await (wrapper.vm as any).cancelAlert()
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('当前提醒无法取消')
    expect(debugError).toHaveBeenCalledWith('取消降价提醒失败', '当前提醒无法取消')
  })

  it('logs backend message when adding to wishlist returns non-200', async () => {
    mockedRationalApi.addToWishlist.mockResolvedValueOnce({ code: 500, message: '想要清单已存在该商品' })

    const wrapper = mountView()

    await flushPromises()
    await (wrapper.vm as any).addToWishlist()

    expect(messages.error).toHaveBeenCalledWith('想要清单已存在该商品')
    expect(debugError).toHaveBeenCalledWith('添加想要清单失败', '想要清单已存在该商品')
  })

  it('logs when adding to cart fails', async () => {
    const cartStore = useCartStore()
    cartStore.addToCart = vi.fn().mockRejectedValue(new Error('加入购物车失败'))

    const wrapper = mountView()

    await flushPromises()
    await (wrapper.vm as any).addToCart()

    expect(messages.error).toHaveBeenCalledWith('加入购物车失败')
    expect(debugError).toHaveBeenCalledWith('加入购物车失败', expect.any(Error))
  })

  it('logs backend message when price history payload returns non-200', async () => {
    mockedPriceApi.getPriceHistory.mockResolvedValueOnce({ code: 500, message: '价格历史读取失败' })
    mockedPriceApi.getPriceStats.mockResolvedValueOnce({ code: 500, message: '价格统计读取失败' })

    mountView()

    await flushPromises()

    expect(debugError).toHaveBeenCalledWith('获取价格历史失败', '价格历史读取失败')
    expect(debugError).toHaveBeenCalledWith('获取价格历史失败', '价格统计读取失败')
  })

  it('logs backend message when price alert payload returns non-200', async () => {
    mockedPriceApi.getUserProductAlert.mockResolvedValueOnce({ code: 500, message: '提醒状态读取失败' })

    mountView()

    await flushPromises()

    expect(debugError).toHaveBeenCalledWith('获取降价提醒失败', '提醒状态读取失败')
  })

  it('logs backend message when wishlist and duplicate checks return non-200', async () => {
    mockedRationalApi.checkDuplicate.mockResolvedValueOnce({ code: 500, message: '重复购买检测失败' })
    mockedRationalApi.checkInWishlist.mockResolvedValueOnce({ code: 500, message: '想要清单状态读取失败' })

    mountView()

    await flushPromises()

    expect(debugError).toHaveBeenCalledWith('检测重复购买失败', '重复购买检测失败')
    expect(debugError).toHaveBeenCalledWith('检查想要清单状态失败', '想要清单状态读取失败')
  })

  it('falls back to comma-separated review images and logs when review image json is broken', async () => {
    mockedReviewApi.getAllProductReviews.mockResolvedValue({
      code: 200,
      data: [{
        id: 41,
        userId: 2,
        username: 'buyer-2',
        rating: 5,
        content: '带图片评价',
        images: 'broken-json,/img-a.png,/img-b.png'
      }]
    })

    const wrapper = mountView()

    await flushPromises()
    await wrapper.findAll('button').find((button) => button.text() === '用户评价')?.trigger('click')
    await flushPromises()

    expect(wrapper.findAll('.review-images img')).toHaveLength(3)
    expect(debugError).toHaveBeenCalledWith('解析评价图片失败', expect.any(Error))
  })

  it('falls back when parsed review images payload is not an array', async () => {
    mockedReviewApi.getAllProductReviews.mockResolvedValue({
      code: 200,
      data: [{
        id: 42,
        userId: 2,
        username: 'buyer-2',
        rating: 4,
        content: '对象格式图片',
        images: '{"a":"/img-a.png","b":"/img-b.png"}'
      }]
    })

    const wrapper = mountView()

    await flushPromises()
    await wrapper.findAll('button').find((button) => button.text() === '用户评价')?.trigger('click')
    await flushPromises()

    expect(wrapper.findAll('.review-images img')).toHaveLength(2)
    expect(debugError).not.toHaveBeenCalledWith('解析评价图片失败', expect.anything())
  })

  it('shows unavailable hint instead of empty history when price history data fails', async () => {
    mockedPriceApi.getPriceHistory.mockResolvedValueOnce({ code: 500, message: 'history failed' })
    mockedPriceApi.getPriceStats.mockResolvedValueOnce({ code: 500, message: 'stats failed' })

    const wrapper = mountView()

    await flushPromises()
    expect(wrapper.text()).toContain('价格历史数据暂未同步，请稍后刷新重试。')

    await wrapper.get('.price-chart-btn').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('价格走势暂未同步')
    expect(wrapper.text()).not.toContain('暂无价格历史记录')
  })

  it('shows backend chinese message when fetching product fails', async () => {
    mockedProductApi.getProductById.mockRejectedValueOnce({
      response: { data: { message: '商品不存在' } }
    })

    mountView()

    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('商品不存在')
    expect(debugError).toHaveBeenCalled()
  })

  it('keeps newer product detail when older request resolves later', async () => {
    const first = deferred<any>()
    const second = deferred<any>()
    mockedProductApi.getProductById
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)

    const wrapper = mountView()

    await flushPromises()

    const vm = wrapper.vm as any
    const secondFetch = vm.fetchProduct()
    await flushPromises()

    second.resolve({ code: 200, data: buildProduct({ name: '新商品', mainImage: '/new.png' }) })
    await secondFetch
    await flushPromises()

    expect(vm.product.name).toBe('新商品')

    first.resolve({ code: 200, data: buildProduct({ name: '旧商品', mainImage: '/old.png' }) })
    await flushPromises()

    expect(vm.product.name).toBe('新商品')
  })

  it('keeps newer price alert state when older request resolves later', async () => {
    const first = deferred<any>()
    const second = deferred<any>()
    mockedPriceApi.getUserProductAlert
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)

    const wrapper = mountView()

    await flushPromises()

    const vm = wrapper.vm as any
    const secondFetch = vm.fetchPriceAlert()
    await flushPromises()

    second.resolve({ code: 200, data: { id: 2, productId: 1, targetPrice: 70, currentPrice: 99, status: 0 } })
    await secondFetch
    await flushPromises()

    expect(vm.priceAlert).toEqual({ id: 2, productId: 1, targetPrice: 70, currentPrice: 99, status: 0 })

    first.resolve({ code: 200, data: { id: 1, productId: 1, targetPrice: 80, currentPrice: 99, status: 0 } })
    await flushPromises()

    expect(vm.priceAlert).toEqual({ id: 2, productId: 1, targetPrice: 70, currentPrice: 99, status: 0 })
  })

  it('does not let an in-flight alert request overwrite alert creation success', async () => {
    const first = deferred<any>()
    const second = deferred<any>()
    mockedPriceApi.getUserProductAlert
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)
    mockedPriceApi.createAlert.mockResolvedValueOnce({ code: 200 })

    const wrapper = mountView()

    await flushPromises()
    ;(wrapper.vm as any).targetPrice = 80
    const setPromise = (wrapper.vm as any).setAlert()
    await flushPromises()

    expect((wrapper.vm as any).priceAlert).toMatchObject({ targetPrice: 80, currentPrice: 99, status: 0 })

    second.resolve({ code: 200, data: { id: 2, productId: 1, targetPrice: 80, currentPrice: 99, status: 0 } })
    await setPromise
    await flushPromises()

    first.resolve({ code: 200, data: { id: 1, productId: 1, targetPrice: 70, currentPrice: 99, status: 0 } })
    await flushPromises()

    expect((wrapper.vm as any).priceAlert).toEqual({ id: 2, productId: 1, targetPrice: 80, currentPrice: 99, status: 0 })
  })

  it('does not let an in-flight alert request restore cancelled alert state', async () => {
    const first = deferred<any>()
    const second = deferred<any>()
    mockedPriceApi.getUserProductAlert
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)
    mockedPriceApi.cancelAlert.mockResolvedValueOnce({ code: 200 })

    const wrapper = mountView()

    await flushPromises()
    const cancelPromise = (wrapper.vm as any).cancelAlert()
    await flushPromises()

    expect((wrapper.vm as any).priceAlert).toBeNull()

    second.resolve({ code: 200, data: null })
    await cancelPromise
    await flushPromises()

    first.resolve({ code: 200, data: { id: 1, productId: 1, targetPrice: 80, currentPrice: 99, status: 0 } })
    await flushPromises()

    expect((wrapper.vm as any).priceAlert).toBeNull()
  })

  it('does not let an in-flight wishlist request overwrite wishlist add success', async () => {
    const first = deferred<any>()
    const second = deferred<any>()
    mockedRationalApi.checkInWishlist
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)
    mockedRationalApi.addToWishlist.mockResolvedValueOnce({ code: 200 })

    const wrapper = mountView()

    await flushPromises()
    const addPromise = (wrapper.vm as any).addToWishlist()
    await flushPromises()

    expect((wrapper.vm as any).isInWishlist).toBe(true)

    second.resolve({ code: 200, data: { inWishlist: true } })
    await addPromise
    await flushPromises()

    first.resolve({ code: 200, data: { inWishlist: false } })
    await flushPromises()

    expect((wrapper.vm as any).isInWishlist).toBe(true)
  })

  it('does not let an in-flight review request overwrite review deletion success', async () => {
    const firstReviews = deferred<any>()
    const firstStats = deferred<any>()
    const secondReviews = deferred<any>()
    const secondStats = deferred<any>()

    mockedReviewApi.getAllProductReviews
      .mockImplementationOnce(() => firstReviews.promise)
      .mockImplementationOnce(() => secondReviews.promise)
    mockedReviewApi.getProductReviewStats
      .mockImplementationOnce(() => firstStats.promise)
      .mockImplementationOnce(() => secondStats.promise)
    mockedReviewApi.deleteReview.mockResolvedValueOnce({ code: 200 })

    const wrapper = mountView()

    await flushPromises()
    ;(wrapper.vm as any).reviews = [
      { id: 9, userId: 1, username: 'buyer', rating: 5, content: '旧评价' },
      { id: 10, userId: 2, username: 'other', rating: 4, content: '保留评价' }
    ]
    ;(wrapper.vm as any).reviewStats = {
      total: 2,
      avgRating: 4.5,
      goodRate: 100,
      ratingCounts: { 5: 1, 4: 1 }
    }

    const deletePromise = (wrapper.vm as any).deleteReview({ id: 9, userId: 1, rating: 5, content: '旧评价' })
    await flushPromises()

    expect((wrapper.vm as any).reviews).toEqual([
      expect.objectContaining({ id: 10, content: '保留评价' })
    ])
    expect((wrapper.vm as any).reviewStats).toMatchObject({
      total: 1,
      avgRating: 4,
      goodRate: 100,
      ratingCounts: { 4: 1 }
    })

    secondReviews.resolve({
      code: 200,
      data: [{ id: 10, userId: 2, username: 'other', rating: 4, content: '保留评价' }]
    })
    secondStats.resolve({
      code: 200,
      data: { total: 1, avgRating: 4, goodRate: 100, ratingCounts: { 4: 1 } }
    })
    await deletePromise
    await flushPromises()

    firstReviews.resolve({
      code: 200,
      data: [
        { id: 9, userId: 1, username: 'buyer', rating: 5, content: '旧评价' },
        { id: 10, userId: 2, username: 'other', rating: 4, content: '保留评价' }
      ]
    })
    firstStats.resolve({
      code: 200,
      data: { total: 2, avgRating: 4.5, goodRate: 100, ratingCounts: { 5: 1, 4: 1 } }
    })
    await flushPromises()

    expect((wrapper.vm as any).reviews).toEqual([
      expect.objectContaining({ id: 10, content: '保留评价' })
    ])
    expect((wrapper.vm as any).reviewStats).toMatchObject({
      total: 1,
      avgRating: 4,
      goodRate: 100,
      ratingCounts: { 4: 1 }
    })
  })

  it('reloads product detail and clears page-local state when route product id changes', async () => {
    mockedProductApi.getProductById
      .mockResolvedValueOnce({
        code: 200,
        data: buildProduct({ id: 1, name: '商品一', mainImage: '/a.png', images: '' })
      })
      .mockResolvedValueOnce({
        code: 200,
        data: buildProduct({ id: 2, name: '商品二', mainImage: '/b.png', images: '' })
      })
    mockedReviewApi.getAllProductReviews
      .mockResolvedValueOnce({ code: 200, data: [{ id: 1, userId: 2, username: 'u1', rating: 5, content: '旧评价' }] })
      .mockResolvedValueOnce({ code: 200, data: [] })
    mockedReviewApi.getProductReviewStats
      .mockResolvedValueOnce({ code: 200, data: { total: 1, avgRating: 5, goodRate: 100 } })
      .mockResolvedValueOnce({ code: 200, data: { total: 0, avgRating: 0, goodRate: 100 } })
    mockedPriceApi.getPriceHistory
      .mockResolvedValueOnce({ code: 200, data: [{ price: 99, recordedTime: '2026-05-01T10:00:00' }] })
      .mockResolvedValueOnce({ code: 200, data: [] })
    mockedPriceApi.getPriceStats
      .mockResolvedValueOnce({
        code: 200,
        data: {
          currentPrice: 99,
          lowestPrice: 88,
          highestPrice: 129,
          avgPrice: 103,
          recordCount: 1,
          pricePosition: 30,
          isLowestPrice: false
        }
      })
      .mockResolvedValueOnce({
        code: 200,
        data: {
          currentPrice: 199,
          lowestPrice: 180,
          highestPrice: 229,
          avgPrice: 200,
          recordCount: 1,
          pricePosition: 20,
          isLowestPrice: false
        }
      })
    mockedPriceApi.getUserProductAlert
      .mockResolvedValueOnce({ code: 200, data: { id: 1, productId: 1, targetPrice: 80, currentPrice: 99, status: 0 } })
      .mockResolvedValueOnce({ code: 200, data: null })
    mockedRationalApi.checkDuplicate
      .mockResolvedValueOnce({ code: 200, data: [{ type: 'same', message: '旧提醒' }] })
      .mockResolvedValueOnce({ code: 200, data: [] })
    mockedRationalApi.checkInWishlist
      .mockResolvedValueOnce({ code: 200, data: { inWishlist: true } })
      .mockResolvedValueOnce({ code: 200, data: { inWishlist: false } })

    const wrapper = mountView()

    await flushPromises()

    const vm = wrapper.vm as any
    vm.quantity = 4
    vm.tab = 'review'
    vm.showPriceChart = true
    vm.showAlertDialog = true
    vm.showWishlistDialog = true
    vm.targetPrice = 66
    vm.currentImage = '/custom-old.png'

    await router.push('/product/2')
    await flushPromises()

    expect(mockedProductApi.getProductById).toHaveBeenNthCalledWith(1, 1)
    expect(mockedProductApi.getProductById).toHaveBeenNthCalledWith(2, 2)
    expect(vm.product.id).toBe(2)
    expect(vm.product.name).toBe('商品二')
    expect(vm.quantity).toBe(1)
    expect(vm.tab).toBe('detail')
    expect(vm.showPriceChart).toBe(false)
    expect(vm.showAlertDialog).toBe(false)
    expect(vm.showWishlistDialog).toBe(false)
    expect(vm.targetPrice).toBe(0)
    expect(vm.priceAlert).toBeNull()
    expect(vm.isInWishlist).toBe(false)
    expect(vm.duplicateWarnings).toEqual([])
    expect(vm.currentImage).toBe('/b.png')
  })
})
