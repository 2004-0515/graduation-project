import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { productApi, cartStore, userStore, messages, debugError, routerPush } = vi.hoisted(() => ({
  productApi: {
    getProducts: vi.fn()
  },
  cartStore: {
    addToCart: vi.fn()
  },
  userStore: {
    isLoggedIn: true,
    userInfo: { id: 1, username: 'buyer' }
  },
  messages: {
    warning: vi.fn(),
    error: vi.fn()
  },
  debugError: vi.fn(),
  routerPush: vi.fn()
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: routerPush })
}))

vi.mock('element-plus', () => ({
  ElMessage: messages
}))

vi.mock('@/api/productApi', () => ({
  default: productApi
}))

vi.mock('@/api/fileApi', () => ({
  default: {
    getImageUrl: vi.fn(() => '/img.png')
  }
}))

vi.mock('@/stores/cartStore', () => ({
  useCartStore: () => cartStore
}))

vi.mock('@/stores/userStore', () => ({
  useUserStore: () => userStore
}))

vi.mock('@/utils/debug', () => ({
  debugError
}))

import HotProductsView from '@/views/HotProductsView.vue'

describe('HotProductsView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    userStore.isLoggedIn = true
    productApi.getProducts.mockResolvedValue({
      code: 200,
      data: {
        content: [
          { id: 1, name: '商品A', sales: 20, price: 80, mainImage: '/a.png' },
          { id: 2, name: '商品B', sales: 100, price: 50, mainImage: '/b.png' },
          { id: 3, name: '商品C', sales: 60, price: 70, mainImage: '/c.png' }
        ]
      }
    })
  })

  const mountView = () =>
    mount(HotProductsView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true
        }
      }
    })

  it('logs when ranking api returns non-200 payload', async () => {
    productApi.getProducts.mockResolvedValue({ code: 500, message: '榜单读取失败' })

    mountView()
    await flushPromises()

    expect(debugError).toHaveBeenCalledWith('获取热销排行榜失败:', '榜单读取失败')
  })

  it('requests the first sales page and renders ranking classes for top three items', async () => {
    const wrapper = mountView()

    await flushPromises()

    expect(productApi.getProducts).toHaveBeenCalledWith({ pageNo: 0, pageSize: 20, sort: 'sales' })
    expect(wrapper.find('.rank-num-1').text()).toBe('1')
    expect(wrapper.find('.rank-num-2').text()).toBe('2')
    expect(wrapper.find('.rank-num-3').text()).toBe('3')
    expect(wrapper.find('[data-testid="hot-rank-list"]').exists()).toBe(true)
  })

  it('warns guest user to login before adding hot product to cart', async () => {
    userStore.isLoggedIn = false
    const wrapper = mountView()

    await flushPromises()
    await (wrapper.vm as unknown as { addToCart: (product: any) => Promise<void> }).addToCart({ id: 2 })

    expect(messages.warning).toHaveBeenCalledWith('请先登录')
    expect(cartStore.addToCart).not.toHaveBeenCalled()
  })

  it('shows backend message when adding hot product to cart fails', async () => {
    cartStore.addToCart.mockRejectedValue({
      response: {
        data: {
          message: '库存不足'
        }
      }
    })
    const wrapper = mountView()

    await flushPromises()
    await (wrapper.vm as unknown as { addToCart: (product: any) => Promise<void> }).addToCart({ id: 2 })

    expect(messages.error).toHaveBeenCalledWith('库存不足')
    expect(debugError).toHaveBeenCalled()
  })
})
