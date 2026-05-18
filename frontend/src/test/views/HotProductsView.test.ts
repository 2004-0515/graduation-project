import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ElMessage } from 'element-plus'
import { createPinia, setActivePinia } from 'pinia'
import productApi from '@/api/productApi'
import fileApi from '@/api/fileApi'
import { useCartStore } from '@/stores/cartStore'
import { useUserStore } from '@/stores/userStore'
import * as debugModule from '@/utils/debug'
import HotProductsView from '@/views/HotProductsView.vue'

const messages = {
  warning: vi.spyOn(ElMessage, 'warning').mockImplementation(() => '' as any),
  error: vi.spyOn(ElMessage, 'error').mockImplementation(() => '' as any)
}

const getProductsSpy = vi.spyOn(productApi, 'getProducts')
const getImageUrlSpy = vi.spyOn(fileApi, 'getImageUrl')
const debugError = vi.spyOn(debugModule, 'debugError').mockImplementation(() => {})

describe('HotProductsView', () => {
  let pinia: ReturnType<typeof createPinia>
  let cartStore: ReturnType<typeof useCartStore>
  let userStore: ReturnType<typeof useUserStore>
  let routerPush: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    pinia = createPinia()
    setActivePinia(pinia)
    cartStore = useCartStore()
    userStore = useUserStore()
    routerPush = vi.fn()

    userStore.token = 'token'
    userStore.userInfo = { id: 1, username: 'buyer' } as any

    vi.spyOn(cartStore, 'addToCart').mockResolvedValue({} as any)
    getProductsSpy.mockResolvedValue({
      code: 200,
      data: {
        content: [
          { id: 1, name: '商品A', sales: 20, price: 80, mainImage: '/a.png' },
          { id: 2, name: '商品B', sales: 100, price: 50, mainImage: '/b.png' },
          { id: 3, name: '商品C', sales: 60, price: 70, mainImage: '/c.png' }
        ]
      }
    } as any)
    getImageUrlSpy.mockReturnValue('/img.png')
    debugError.mockImplementation(() => {})
  })

  const mountView = () =>
    mount(HotProductsView, {
      global: {
        plugins: [pinia],
        mocks: {
          $router: { push: routerPush }
        },
        stubs: {
          Navbar: true,
          Footer: true
        }
      }
    })

  it('logs when ranking api returns non-200 payload', async () => {
    getProductsSpy.mockResolvedValue({ code: 500, message: '榜单读取失败' } as any)

    mountView()
    await flushPromises()

    expect(debugError).toHaveBeenCalledWith('获取热销排行榜失败:', '榜单读取失败')
  })

  it('requests the first sales page and renders ranking classes for top three items', async () => {
    const wrapper = mountView()

    await flushPromises()

    expect(getProductsSpy).toHaveBeenCalledWith({ pageNo: 0, pageSize: 20, sort: 'sales' })
    expect(wrapper.find('.rank-num-1').text()).toBe('1')
    expect(wrapper.find('.rank-num-2').text()).toBe('2')
    expect(wrapper.find('.rank-num-3').text()).toBe('3')
    expect(wrapper.find('[data-testid="hot-rank-list"]').exists()).toBe(true)
  })

  it('warns guest user to login before adding hot product to cart', async () => {
    userStore.token = null
    userStore.userInfo = null
    const wrapper = mountView()

    await flushPromises()
    await (wrapper.vm as unknown as { addToCart: (product: any) => Promise<void> }).addToCart({ id: 2 })

    expect(messages.warning).toHaveBeenCalledWith('请先登录')
    expect(cartStore.addToCart).not.toHaveBeenCalled()
  })

  it('shows backend message when adding hot product to cart fails', async () => {
    vi.spyOn(cartStore, 'addToCart').mockRejectedValue({
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
