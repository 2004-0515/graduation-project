import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockPush, userStore, productApi, adminApi, couponApi, aiChat, debugError } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  userStore: {
    isLoggedIn: true,
    userInfo: { id: 1, username: 'buyer', nickname: '小白' }
  },
  productApi: {
    getProducts: vi.fn()
  },
  adminApi: {
    getCategories: vi.fn()
  },
  couponApi: {
    getAvailableCoupons: vi.fn()
  },
  aiChat: {
    getAiResponse: vi.fn(),
    quickQuestions: ['有什么热销商品'],
    setApiKey: vi.fn(),
    getStoredApiKey: vi.fn(() => ''),
    setExtraData: vi.fn()
  },
  debugError: vi.fn()
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush })
}))

vi.mock('@/stores/userStore', () => ({
  useUserStore: () => userStore
}))

vi.mock('@/utils/aiChat', () => aiChat)

vi.mock('@/api/productApi', () => ({
  default: productApi
}))

vi.mock('@/api/adminApi', () => ({
  default: adminApi
}))

vi.mock('@/api/couponApi', () => ({
  default: couponApi
}))

vi.mock('@/api/fileApi', () => ({
  default: {
    getImageUrl: vi.fn(() => '/img.png')
  }
}))

vi.mock('@/utils/debug', () => ({
  debugError
}))

import AiRecommendView from '@/views/AiRecommendView.vue'

describe('AiRecommendView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    productApi.getProducts.mockResolvedValue({
      code: 200,
      data: {
        content: [
          { id: 1, name: '商品A', sales: 10, price: 50, mainImage: '/a.png' },
          { id: 2, name: '商品B', sales: 99, price: 80, mainImage: '/b.png' }
        ]
      }
    })
    adminApi.getCategories.mockResolvedValue({ data: [] })
    couponApi.getAvailableCoupons.mockResolvedValue({ data: [] })
  })

  it('shows bounded capability copy instead of claiming personalized recommendation', async () => {
    const wrapper = mount(AiRecommendView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true,
          RouterLink: {
            template: '<a><slot /></a>'
          }
        }
      }
    })

    await flushPromises()

    expect(wrapper.text()).toContain('基于当前商品数据提供问答和选购参考')
    expect(wrapper.text()).toContain('聊天能力需要自行配置 AI 密钥')
    expect(wrapper.text()).toContain('不代表个性化建模推荐')
    expect(wrapper.text()).not.toContain('为您提供个性化推荐')
  })

  it('requests first page with 0-based pagination and renders discovered products from a single page payload', async () => {
    const wrapper = mount(AiRecommendView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true,
          RouterLink: {
            template: '<a><slot /></a>'
          }
        }
      }
    })

    await flushPromises()

    expect(productApi.getProducts).toHaveBeenCalledWith({ pageNo: 0, pageSize: 100, sort: 'sales' })
    expect(wrapper.findAll('.product-card')).toHaveLength(2)
    expect(wrapper.text()).toContain('商品B')
  })

  it('does not claim success when api key is empty', async () => {
    const wrapper = mount(AiRecommendView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true,
          RouterLink: {
            template: '<a><slot /></a>'
          }
        }
      }
    })

    await flushPromises()

    await wrapper.find('.settings-btn').trigger('click')
    await flushPromises()
    await wrapper.find('.btn-save').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('未填写 API 密钥，AI 对话仍不可用')
    expect(aiChat.setApiKey).not.toHaveBeenCalled()
  })

  it('logs when ai product data returns non-200 payload', async () => {
    productApi.getProducts.mockResolvedValue({ code: 500, message: '商品读取失败' })

    mount(AiRecommendView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true,
          RouterLink: {
            template: '<a><slot /></a>'
          }
        }
      }
    })

    await flushPromises()

    expect(debugError).toHaveBeenCalledWith('获取 AI 商品数据失败:', '商品读取失败')
  })

  it('logs and falls back when ai product request throws', async () => {
    productApi.getProducts.mockRejectedValue(new Error('商品服务失败'))

    const wrapper = mount(AiRecommendView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true,
          RouterLink: {
            template: '<a><slot /></a>'
          }
        }
      }
    })

    await flushPromises()

    expect(debugError).toHaveBeenCalledWith('获取 AI 商品数据失败:', expect.any(Error))
    expect(aiChat.setExtraData).toHaveBeenCalledWith({
      categories: [],
      coupons: []
    })
    expect(wrapper.text()).toContain('基于当前商品数据提供问答和选购参考')
  })

  it('shows an explicit empty state when no products are available', async () => {
    productApi.getProducts.mockResolvedValue({
      code: 200,
      data: {
        content: []
      }
    })

    const wrapper = mount(AiRecommendView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true,
          RouterLink: {
            template: '<a><slot /></a>'
          }
        }
      }
    })

    await flushPromises()

    expect(wrapper.text()).toContain('当前暂无可展示商品')
    expect(wrapper.findAll('.product-card')).toHaveLength(0)
  })

  it('logs and falls back when ai chat request fails', async () => {
    aiChat.getAiResponse.mockRejectedValue(new Error('ai unavailable'))

    const wrapper = mount(AiRecommendView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true,
          RouterLink: {
            template: '<a><slot /></a>'
          }
        }
      }
    })

    await flushPromises()

    await wrapper.find('input').setValue('推荐一款耳机')
    await wrapper.find('.send-btn').trigger('click')
    await flushPromises()

    expect(debugError).toHaveBeenCalledWith('AI 对话失败:', expect.any(Error))
    expect(wrapper.text()).toContain('抱歉，AI 服务暂时不可用，请稍后再试。')
  })

  it('logs category and coupon fetch errors when fallback data is used', async () => {
    adminApi.getCategories.mockRejectedValue(new Error('分类服务失败'))
    couponApi.getAvailableCoupons.mockRejectedValue(new Error('优惠券服务失败'))

    mount(AiRecommendView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true,
          RouterLink: {
            template: '<a><slot /></a>'
          }
        }
      }
    })

    await flushPromises()

    expect(debugError).toHaveBeenCalledWith('获取 AI 分类数据失败:', expect.any(Error))
    expect(debugError).toHaveBeenCalledWith('获取 AI 优惠券数据失败:', expect.any(Error))
    expect(aiChat.setExtraData).toHaveBeenCalledWith({
      categories: [],
      coupons: []
    })
  })
})
