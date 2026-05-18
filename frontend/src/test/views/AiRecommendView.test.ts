import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { useUserStore } from '@/stores/userStore'
import productApi from '@/api/productApi'
import adminApi from '@/api/adminApi'
import couponApi from '@/api/couponApi'
import fileApi from '@/api/fileApi'
import * as aiChatModule from '@/utils/aiChat'
import * as debugModule from '@/utils/debug'
import AiRecommendView from '@/views/AiRecommendView.vue'

const getProductsSpy = vi.spyOn(productApi, 'getProducts')
const getCategoriesSpy = vi.spyOn(adminApi, 'getCategories')
const getAvailableCouponsSpy = vi.spyOn(couponApi, 'getAvailableCoupons')
const getImageUrlSpy = vi.spyOn(fileApi, 'getImageUrl')
const getAiResponseSpy = vi.spyOn(aiChatModule, 'getAiResponse')
const setApiKeySpy = vi.spyOn(aiChatModule, 'setApiKey')
const getStoredApiKeySpy = vi.spyOn(aiChatModule, 'getStoredApiKey')
const setExtraDataSpy = vi.spyOn(aiChatModule, 'setExtraData')
const debugError = vi.spyOn(debugModule, 'debugError').mockImplementation(() => {})

describe('AiRecommendView', () => {
  let pinia: ReturnType<typeof createPinia>
  let userStore: ReturnType<typeof useUserStore>

  beforeEach(() => {
    vi.clearAllMocks()
    pinia = createPinia()
    setActivePinia(pinia)
    userStore = useUserStore()
    userStore.token = 'token'
    userStore.userInfo = { id: 1, username: 'buyer', nickname: '小白' } as any

    getProductsSpy.mockResolvedValue({
      code: 200,
      data: {
        content: [
          { id: 1, name: '商品A', sales: 10, price: 50, mainImage: '/a.png' },
          { id: 2, name: '商品B', sales: 99, price: 80, mainImage: '/b.png' }
        ]
      }
    } as any)
    getCategoriesSpy.mockResolvedValue({ data: [] } as any)
    getAvailableCouponsSpy.mockResolvedValue({ data: [] } as any)
    getImageUrlSpy.mockReturnValue('/img.png')
    getAiResponseSpy.mockResolvedValue('推荐商品A')
    getStoredApiKeySpy.mockReturnValue('')
    setExtraDataSpy.mockImplementation(() => {})
    debugError.mockImplementation(() => {})
  })

  const mountView = async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: { template: '<div />' } },
        { path: '/category', component: { template: '<div />' } },
        { path: '/product/:id', component: { template: '<div />' } }
      ]
    })

    await router.push('/')
    await router.isReady()

    const wrapper = mount(AiRecommendView, {
      global: {
        plugins: [pinia, router],
        stubs: {
          Navbar: true,
          Footer: true
        }
      }
    })

    return { wrapper, router }
  }

  it('shows bounded capability copy instead of claiming personalized recommendation', async () => {
    const { wrapper } = await mountView()

    await flushPromises()

    expect(wrapper.text()).toContain('基于当前商品数据提供问答和选购参考')
    expect(wrapper.text()).toContain('聊天能力需要自行配置 AI 密钥')
    expect(wrapper.text()).toContain('不代表个性化建模推荐')
    expect(wrapper.text()).not.toContain('为您提供个性化推荐')
  })

  it('requests first page with 0-based pagination and renders discovered products from a single page payload', async () => {
    const { wrapper } = await mountView()

    await flushPromises()

    expect(getProductsSpy).toHaveBeenCalledWith({ pageNo: 0, pageSize: 24, sort: 'sales' })
    expect(wrapper.findAll('.product-card')).toHaveLength(2)
    expect(wrapper.text()).toContain('商品B')
  })

  it('does not claim success when api key is empty', async () => {
    const { wrapper } = await mountView()

    await flushPromises()

    await wrapper.find('.settings-btn').trigger('click')
    await flushPromises()
    await wrapper.find('.btn-save').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('未填写 API 密钥，AI 对话仍不可用')
    expect(setApiKeySpy).not.toHaveBeenCalled()
  })

  it('logs when ai product data returns non-200 payload', async () => {
    getProductsSpy.mockResolvedValue({ code: 500, message: '商品读取失败' } as any)

    await mountView()
    await flushPromises()

    expect(debugError).toHaveBeenCalledWith('获取 AI 商品数据失败:', '商品读取失败')
  })

  it('logs and falls back when ai product request throws', async () => {
    getProductsSpy.mockRejectedValue(new Error('商品服务失败'))

    const { wrapper } = await mountView()
    await flushPromises()

    expect(debugError).toHaveBeenCalledWith('获取 AI 商品数据失败:', expect.any(Error))
    expect(setExtraDataSpy).toHaveBeenCalledWith({
      categories: [],
      coupons: []
    })
    expect(wrapper.text()).toContain('基于当前商品数据提供问答和选购参考')
  })

  it('shows an explicit empty state when no products are available', async () => {
    getProductsSpy.mockResolvedValue({
      code: 200,
      data: {
        content: []
      }
    } as any)

    const { wrapper } = await mountView()
    await flushPromises()

    expect(wrapper.text()).toContain('当前暂无可展示商品')
    expect(wrapper.findAll('.product-card')).toHaveLength(0)
  })

  it('logs and falls back when ai chat request fails', async () => {
    getAiResponseSpy.mockRejectedValue(new Error('ai unavailable'))

    const { wrapper } = await mountView()
    await flushPromises()

    await wrapper.find('input').setValue('推荐一款耳机')
    await wrapper.find('.send-btn').trigger('click')
    await flushPromises()

    expect(debugError).toHaveBeenCalledWith('AI 对话失败:', expect.any(Error))
    expect(wrapper.text()).toContain('抱歉，AI 服务暂时不可用，请稍后再试。')
  })

  it('logs category and coupon fetch errors when fallback data is used', async () => {
    getCategoriesSpy.mockRejectedValue(new Error('分类服务失败'))
    getAvailableCouponsSpy.mockRejectedValue(new Error('优惠券服务失败'))

    await mountView()
    await flushPromises()

    expect(debugError).toHaveBeenCalledWith('获取 AI 分类数据失败:', expect.any(Error))
    expect(debugError).toHaveBeenCalledWith('获取 AI 优惠券数据失败:', expect.any(Error))
    expect(setExtraDataSpy).toHaveBeenCalledWith({
      categories: [],
      coupons: []
    })
  })
})
