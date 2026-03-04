import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCartStore } from '@/stores/cartStore'
import cartApi from '@/api/cartApi'
import type { CartItem, ApiResponse } from '@/types'

// Mock cartApi
vi.mock('@/api/cartApi', () => ({
  default: {
    getCart: vi.fn(),
    addToCart: vi.fn(),
    updateCartItem: vi.fn(),
    selectCartItem: vi.fn(),
    selectAll: vi.fn(),
    deleteCartItem: vi.fn(),
    batchDeleteCartItems: vi.fn(),
    clearCart: vi.fn(),
    getCartItemCount: vi.fn()
  }
}))

// Mock element-plus
vi.mock('element-plus', () => ({
  ElMessage: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

describe('CartStore', () => {
  let store: ReturnType<typeof useCartStore>

  const mockCartItem: CartItem = {
    id: 1,
    userId: 1,
    productId: 1,
    productName: '测试商品',
    productImage: 'http://example.com/image.jpg',
    price: 99,
    quantity: 2,
    selected: true,
    stock: 100
  }

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useCartStore()
    vi.clearAllMocks()
  })

  describe('初始状态', () => {
    it('应该有正确的初始状态', () => {
      expect(store.items).toEqual([])
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
    })
  })

  describe('getters', () => {
    beforeEach(() => {
      store.items = [
        { ...mockCartItem, id: 1, quantity: 2, selected: true, price: 100 },
        { ...mockCartItem, id: 2, quantity: 3, selected: false, price: 50 }
      ]
    })

    it('totalItems 应该返回商品种类数', () => {
      expect(store.totalItems).toBe(2) // 2种商品
    })

    it('totalQuantity 应该返回所有商品数量总和', () => {
      expect(store.totalQuantity).toBe(5) // 2 + 3
    })

    it('totalAmount 应该只计算选中商品的总金额', () => {
      expect(store.totalAmount).toBe(200) // 2 * 100
    })

    it('selectedItems 应该返回选中的商品', () => {
      expect(store.selectedItems).toHaveLength(1)
      expect(store.selectedItems[0].id).toBe(1)
    })

    it('isProductInCart 应该正确检查商品是否在购物车中', () => {
      expect(store.isProductInCart(1)).toBe(true)
      expect(store.isProductInCart(999)).toBe(false)
    })

    it('selectedCount 应该返回选中商品的数量总和', () => {
      expect(store.selectedCount).toBe(2)
    })

    it('isAllSelected 应该正确判断是否全选', () => {
      expect(store.isAllSelected).toBe(false)
      
      store.items.forEach(item => item.selected = true)
      expect(store.isAllSelected).toBe(true)
    })
  })

  describe('actions', () => {
    describe('fetchCart', () => {
      it('成功获取购物车列表', async () => {
        const mockResponse: ApiResponse<CartItem[]> = {
          code: 200,
          message: 'Success',
          success: true,
          data: [mockCartItem]
        }
        vi.mocked(cartApi.getCart).mockResolvedValue(mockResponse)

        const result = await store.fetchCart()

        expect(result).toEqual([mockCartItem])
        expect(store.items).toEqual([mockCartItem])
        expect(store.loading).toBe(false)
      })

      it('获取失败时应该设置错误状态', async () => {
        vi.mocked(cartApi.getCart).mockRejectedValue(new Error('网络错误'))

        const result = await store.fetchCart()

        expect(result).toEqual([])
        expect(store.items).toEqual([])
        expect(store.error).toBe('网络错误')
      })
    })

    describe('addToCart', () => {
      it('成功添加新商品到购物车', async () => {
        const mockResponse: ApiResponse<CartItem> = {
          code: 200,
          message: 'Success',
          success: true,
          data: mockCartItem
        }
        vi.mocked(cartApi.addToCart).mockResolvedValue(mockResponse)

        const result = await store.addToCart(1, 1, 2)

        expect(result).toEqual(mockCartItem)
        expect(store.items).toContainEqual(mockCartItem)
      })

      it('添加已存在商品时应该更新数量', async () => {
        store.items = [mockCartItem]
        
        const updatedItem = { ...mockCartItem, quantity: 5 }
        const mockResponse: ApiResponse<CartItem> = {
          code: 200,
          message: 'Success',
          success: true,
          data: updatedItem
        }
        vi.mocked(cartApi.addToCart).mockResolvedValue(mockResponse)

        await store.addToCart(1, 1, 3)

        expect(store.items[0].quantity).toBe(5)
      })
    })

    describe('updateCartItem', () => {
      beforeEach(() => {
        store.items = [mockCartItem]
      })

      it('成功更新购物车项', async () => {
        const updatedItem = { ...mockCartItem, quantity: 5 }
        const mockResponse: ApiResponse<CartItem> = {
          code: 200,
          message: 'Success',
          success: true,
          data: updatedItem
        }
        vi.mocked(cartApi.updateCartItem).mockResolvedValue(mockResponse)

        const result = await store.updateCartItem(1, { quantity: 5 })

        expect(result?.quantity).toBe(5)
        expect(store.items[0].quantity).toBe(5)
      })

      it('数量为0时应该删除购物车项', async () => {
        const mockResponse: ApiResponse<CartItem> = {
          code: 200,
          message: 'Success',
          success: true,
          data: null as unknown as CartItem
        }
        vi.mocked(cartApi.updateCartItem).mockResolvedValue(mockResponse)

        await store.updateCartItem(1, { quantity: 0 })

        expect(store.items).toHaveLength(0)
      })
    })

    describe('selectItem', () => {
      beforeEach(() => {
        store.items = [mockCartItem]
      })

      it('成功选择购物车项', async () => {
        vi.mocked(cartApi.selectCartItem).mockResolvedValue({
          code: 200,
          message: 'Success',
          success: true,
          data: undefined
        })

        await store.selectItem(1, false)

        expect(store.items[0].selected).toBe(false)
      })
    })

    describe('selectAll', () => {
      beforeEach(() => {
        store.items = [
          { ...mockCartItem, id: 1, selected: false },
          { ...mockCartItem, id: 2, selected: false }
        ]
      })

      it('成功全选', async () => {
        vi.mocked(cartApi.selectAll).mockResolvedValue({
          code: 200,
          message: 'Success',
          success: true,
          data: undefined
        })

        await store.selectAll(true)

        expect(store.items.every(item => item.selected)).toBe(true)
      })
    })

    describe('removeFromCart', () => {
      beforeEach(() => {
        store.items = [mockCartItem]
      })

      it('成功删除购物车项', async () => {
        vi.mocked(cartApi.deleteCartItem).mockResolvedValue({
          code: 200,
          message: 'Success',
          success: true,
          data: undefined
        })

        const result = await store.removeFromCart(1)

        expect(result).toBe(true)
        expect(store.items).toHaveLength(0)
      })
    })

    describe('batchDelete', () => {
      beforeEach(() => {
        store.items = [
          { ...mockCartItem, id: 1 },
          { ...mockCartItem, id: 2 },
          { ...mockCartItem, id: 3 }
        ]
      })

      it('成功批量删除', async () => {
        vi.mocked(cartApi.batchDeleteCartItems).mockResolvedValue({
          code: 200,
          message: 'Success',
          success: true,
          data: undefined
        })

        await store.batchDelete([1, 2])

        expect(store.items).toHaveLength(1)
        expect(store.items[0].id).toBe(3)
      })
    })

    describe('clearCart', () => {
      beforeEach(() => {
        store.items = [mockCartItem]
      })

      it('成功清空购物车', async () => {
        vi.mocked(cartApi.clearCart).mockResolvedValue({
          code: 200,
          message: 'Success',
          success: true,
          data: undefined
        })

        const result = await store.clearCart()

        expect(result).toBe(true)
        expect(store.items).toHaveLength(0)
      })
    })

    describe('clearError', () => {
      it('应该清除错误信息', () => {
        store.error = '测试错误'
        
        store.clearError()
        
        expect(store.error).toBeNull()
      })
    })
  })
})
