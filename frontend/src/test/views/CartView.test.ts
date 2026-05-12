import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockPush, mockCartStore, mockUserStore, rationalApi, debugError } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockCartStore: {
    items: [] as any[],
    fetchCart: vi.fn(),
    updateCartItem: vi.fn(),
    removeFromCart: vi.fn(),
    batchDelete: vi.fn()
  },
  mockUserStore: {
    isLoggedIn: true,
    userInfo: { id: 10, username: 'buyer' }
  },
  rationalApi: {
    getBudgetStatus: vi.fn()
  },
  debugError: vi.fn()
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush })
}))

vi.mock('element-plus', () => ({
  ElMessage: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn()
  },
  ElMessageBox: {
    confirm: vi.fn()
  }
}))

vi.mock('@/stores/cartStore', () => ({
  useCartStore: () => mockCartStore
}))

vi.mock('@/stores/userStore', () => ({
  useUserStore: () => mockUserStore
}))

vi.mock('@/api/fileApi', () => ({
  default: {
    getImageUrl: vi.fn(() => '/img.png')
  }
}))

vi.mock('@/api/rationalApi', () => ({
  default: rationalApi
}))

vi.mock('@/utils/debug', () => ({
  debugError
}))

import { ElMessage } from 'element-plus'
import CartView from '@/views/CartView.vue'

describe('CartView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUserStore.isLoggedIn = true
    mockUserStore.userInfo = { id: 10, username: 'buyer' }
    mockCartStore.fetchCart.mockResolvedValue([])
    mockCartStore.updateCartItem.mockResolvedValue(undefined)
    mockCartStore.removeFromCart.mockResolvedValue(true)
    mockCartStore.batchDelete.mockResolvedValue(true)
    rationalApi.getBudgetStatus.mockResolvedValue({ code: 200, data: {} })
  })

  it('blocks checkout when all selected items are not checkout-eligible', async () => {
    mockCartStore.items = [
      {
        id: 1,
        productId: 101,
        productName: '库存不足商品',
        productImage: '/a.png',
        price: 20,
        quantity: 2,
        stock: 1,
        sellerId: 30,
        productStatus: 1,
        selected: true
      }
    ]

    const wrapper = mount(CartView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true,
          RouterLink: true
        }
      }
    })

    await flushPromises()
    await wrapper.get('.btn.btn-primary').trigger('click')

    expect(ElMessage.warning).toHaveBeenCalledWith('当前选中商品不可结算，请检查库存、上下架状态或移除自己的商品')
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('warns and proceeds with valid items when part of the selection is invalid', async () => {
    mockCartStore.items = [
      {
        id: 1,
        productId: 101,
        productName: '库存不足商品',
        productImage: '/a.png',
        price: 20,
        quantity: 2,
        stock: 1,
        sellerId: 30,
        productStatus: 1,
        selected: true
      },
      {
        id: 2,
        productId: 202,
        productName: '正常商品',
        productImage: '/b.png',
        price: 35,
        quantity: 1,
        stock: 10,
        sellerId: 31,
        productStatus: 1,
        selected: true
      }
    ]

    const wrapper = mount(CartView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true,
          RouterLink: true
        }
      }
    })

    await flushPromises()
    await wrapper.get('.btn.btn-primary').trigger('click')

    expect(ElMessage.warning).toHaveBeenCalledWith('部分已选商品不可结算，系统将只结算有效商品')
    expect(mockPush).toHaveBeenCalledWith('/checkout')
  })

  it('warns about budget overrun but still allows checkout', async () => {
    mockCartStore.items = [
      {
        id: 2,
        productId: 202,
        productName: '正常商品',
        productImage: '/b.png',
        price: 35,
        quantity: 1,
        stock: 10,
        sellerId: 31,
        productStatus: 1,
        selected: true
      }
    ]
    rationalApi.getBudgetStatus.mockResolvedValue({
      code: 200,
      data: {
        budget: 50,
        spent: 30
      }
    })

    const wrapper = mount(CartView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true,
          RouterLink: true
        }
      }
    })

    await flushPromises()
    await wrapper.get('.btn.btn-primary').trigger('click')

    expect(ElMessage.warning).toHaveBeenCalledWith('购买后将超出本月预算，请理性消费')
    expect(mockPush).toHaveBeenCalledWith('/checkout')
  })

  it('shows backend message when removing an item fails', async () => {
    const { ElMessageBox } = await import('element-plus')
    ;(ElMessageBox.confirm as any).mockResolvedValue(undefined)
    mockCartStore.items = [
      {
        id: 2,
        productId: 202,
        productName: '正常商品',
        productImage: '/b.png',
        price: 35,
        quantity: 1,
        stock: 10,
        sellerId: 31,
        productStatus: 1,
        selected: true
      }
    ]
    mockCartStore.removeFromCart.mockRejectedValue({ response: { data: { message: '购物车商品删除失败' } } })

    const wrapper = mount(CartView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true,
          RouterLink: true
        }
      }
    })

    await flushPromises()
    await wrapper.get('.delete-btn').trigger('click')
    await flushPromises()

    expect(ElMessage.error).toHaveBeenCalledWith('购物车商品删除失败')
    expect(debugError).toHaveBeenCalled()
  })

  it('logs and keeps cart page mounted when initial cart loading throws', async () => {
    mockCartStore.fetchCart.mockRejectedValue(new Error('cart load failed'))

    const wrapper = mount(CartView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true,
          RouterLink: true
        }
      }
    })

    await flushPromises()

    expect(debugError).toHaveBeenCalledWith('加载购物车失败', expect.any(Error))
    expect(wrapper.text()).toContain('购物车')
  })

  it('logs non-200 payload when budget status returns business failure', async () => {
    rationalApi.getBudgetStatus.mockResolvedValue({ code: 500, message: '预算服务异常' })
    mockCartStore.items = [
      {
        id: 2,
        productId: 202,
        productName: '正常商品',
        productImage: '/b.png',
        price: 35,
        quantity: 1,
        stock: 10,
        sellerId: 31,
        productStatus: 1,
        selected: true
      }
    ]

    mount(CartView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true,
          RouterLink: true
        }
      }
    })

    await flushPromises()

    expect(debugError).toHaveBeenCalledWith('获取购物车预算状态失败', '预算服务异常')
  })

  it('uses batch delete for clearing selected items to avoid repeated success noise', async () => {
    const { ElMessageBox } = await import('element-plus')
    ;(ElMessageBox.confirm as any).mockResolvedValue(undefined)
    mockCartStore.items = [
      {
        id: 1,
        productId: 101,
        productName: '商品A',
        productImage: '/a.png',
        price: 20,
        quantity: 1,
        stock: 5,
        sellerId: 30,
        productStatus: 1,
        selected: true
      },
      {
        id: 2,
        productId: 102,
        productName: '商品B',
        productImage: '/b.png',
        price: 30,
        quantity: 1,
        stock: 5,
        sellerId: 31,
        productStatus: 1,
        selected: true
      }
    ]

    const wrapper = mount(CartView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true,
          RouterLink: true
        }
      }
    })

    await flushPromises()
    await wrapper.get('.clear-btn').trigger('click')
    await flushPromises()

    expect(mockCartStore.batchDelete).toHaveBeenCalledWith([1, 2])
    expect(mockCartStore.removeFromCart).not.toHaveBeenCalled()
  })
})
