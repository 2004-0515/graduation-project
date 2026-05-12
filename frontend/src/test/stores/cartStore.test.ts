import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCartStore } from '@/stores/cartStore'
import cartApi from '@/api/cartApi'
import type { CartItem, ApiResponse } from '@/types'
import { debugError } from '@/utils/debug'

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

vi.mock('@/utils/debug', () => ({
  debugError: vi.fn()
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

  const createDeferred = <T>() => {
    let resolve!: (value: T) => void
    let reject!: (reason?: unknown) => void
    const promise = new Promise<T>((res, rej) => {
      resolve = res
      reject = rej
    })
    return { promise, resolve, reject }
  }

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

      it('业务 non-200 时应该设置中文错误并清空列表', async () => {
        vi.mocked(cartApi.getCart).mockResolvedValue({
          code: 500,
          message: '购物车读取失败',
          success: false,
          data: null as unknown as CartItem[]
        })

        const result = await store.fetchCart()

        expect(result).toEqual([])
        expect(store.items).toEqual([])
        expect(store.error).toBe('购物车读取失败')
      })

      it('不应把 success flag 且非 200 code 误判为购物车读取成功', async () => {
        vi.mocked(cartApi.getCart).mockResolvedValue({
          code: 500,
          message: '购物车读取失败',
          success: true,
          data: [mockCartItem]
        })

        const result = await store.fetchCart()

        expect(result).toEqual([])
        expect(store.items).toEqual([])
        expect(store.error).toBe('购物车读取失败')
      })

      it('忽略过期的购物车成功响应，保留最新购物车列表', async () => {
        const firstRequest = createDeferred<ApiResponse<CartItem[]>>()
        const secondRequest = createDeferred<ApiResponse<CartItem[]>>()

        vi.mocked(cartApi.getCart)
          .mockImplementationOnce(() => firstRequest.promise)
          .mockImplementationOnce(() => secondRequest.promise)

        const firstLoad = store.fetchCart()
        const secondLoad = store.fetchCart()

        secondRequest.resolve({
          code: 200,
          message: 'Success',
          success: true,
          data: [{ ...mockCartItem, id: 2, productName: '最新购物车商品' }]
        })
        await secondLoad

        expect(store.items).toEqual([{ ...mockCartItem, id: 2, productName: '最新购物车商品' }])

        firstRequest.resolve({
          code: 200,
          message: 'Success',
          success: true,
          data: [{ ...mockCartItem, id: 1, productName: '旧购物车商品' }]
        })
        await firstLoad

        expect(store.items).toEqual([{ ...mockCartItem, id: 2, productName: '最新购物车商品' }])
      })

      it('忽略过期的购物车失败响应，不清空较新的购物车结果', async () => {
        const firstRequest = createDeferred<ApiResponse<CartItem[]>>()
        const secondRequest = createDeferred<ApiResponse<CartItem[]>>()

        vi.mocked(cartApi.getCart)
          .mockImplementationOnce(() => firstRequest.promise)
          .mockImplementationOnce(() => secondRequest.promise)

        const firstLoad = store.fetchCart()
        const secondLoad = store.fetchCart()

        secondRequest.resolve({
          code: 200,
          message: 'Success',
          success: true,
          data: [{ ...mockCartItem, id: 3, productName: '保留商品' }]
        })
        await secondLoad

        firstRequest.reject(new Error('旧请求失败'))
        await firstLoad

        expect(store.items).toEqual([{ ...mockCartItem, id: 3, productName: '保留商品' }])
        expect(store.error).toBeNull()
      })

      it('不应让进行中的购物车请求覆盖后续加购结果', async () => {
        const pendingRequest = createDeferred<ApiResponse<CartItem[]>>()
        vi.mocked(cartApi.getCart).mockImplementationOnce(() => pendingRequest.promise)
        vi.mocked(cartApi.addToCart).mockResolvedValue({
          code: 200,
          message: 'Success',
          success: true,
          data: { ...mockCartItem, id: 9, productId: 9, productName: '新加购商品' }
        })

        const loadPromise = store.fetchCart()
        await store.addToCart(1, 9, 1)

        pendingRequest.resolve({
          code: 200,
          message: 'Success',
          success: true,
          data: [{ ...mockCartItem, id: 1, productName: '旧购物车商品' }]
        })
        await loadPromise

        expect(store.items).toEqual([{ ...mockCartItem, id: 9, productId: 9, productName: '新加购商品' }])
      })

      it('不应让进行中的购物车请求覆盖后续清空结果', async () => {
        const pendingRequest = createDeferred<ApiResponse<CartItem[]>>()
        vi.mocked(cartApi.getCart).mockImplementationOnce(() => pendingRequest.promise)
        vi.mocked(cartApi.clearCart).mockResolvedValue({
          code: 200,
          message: 'Success',
          success: true,
          data: undefined
        })
        store.items = [mockCartItem]

        const loadPromise = store.fetchCart()
        await store.clearCart()

        pendingRequest.resolve({
          code: 200,
          message: 'Success',
          success: true,
          data: [{ ...mockCartItem, id: 2, productName: '旧返回商品' }]
        })
        await loadPromise

        expect(store.items).toEqual([])
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

      it('业务 non-200 时不应添加商品且应抛出中文错误', async () => {
        vi.mocked(cartApi.addToCart).mockResolvedValue({
          code: 422,
          message: '库存不足',
          success: false,
          data: null as unknown as CartItem
        })

        await expect(store.addToCart(1, 1, 2)).rejects.toThrow('库存不足')
        expect(store.items).toEqual([])
        expect(store.error).toBe('库存不足')
      })

      it('不应把 success flag 且非 200 code 误判为加购成功', async () => {
        vi.mocked(cartApi.addToCart).mockResolvedValue({
          code: 500,
          message: '加购失败',
          success: true,
          data: mockCartItem
        })

        await expect(store.addToCart(1, 1, 2)).rejects.toThrow('加购失败')
        expect(store.items).toEqual([])
        expect(store.error).toBe('加购失败')
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
        store.items = [{ ...mockCartItem, selected: true }]
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

      it('业务 non-200 时不应修改选中状态', async () => {
        vi.mocked(cartApi.selectCartItem).mockResolvedValue({
          code: 500,
          message: '选择失败',
          success: false,
          data: undefined
        })

        await expect(store.selectItem(1, false)).rejects.toThrow('选择失败')
        expect(store.items[0].selected).toBe(true)
        expect(store.error).toBe('选择失败')
        expect(vi.mocked(debugError)).toHaveBeenCalledWith('切换购物车选中状态失败:', expect.any(Error))
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

      it('业务 non-200 时不应全选', async () => {
        vi.mocked(cartApi.selectAll).mockResolvedValue({
          code: 500,
          message: '全选失败',
          success: false,
          data: undefined
        })

        await expect(store.selectAll(true)).rejects.toThrow('全选失败')
        expect(store.items.every(item => item.selected)).toBe(false)
        expect(store.error).toBe('全选失败')
        expect(vi.mocked(debugError)).toHaveBeenCalledWith('批量切换购物车选中状态失败:', expect.any(Error))
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

      it('静默批量删除时不弹成功提示', async () => {
        const { ElMessage } = await import('element-plus')
        vi.mocked(cartApi.batchDeleteCartItems).mockResolvedValue({
          code: 200,
          message: 'Success',
          success: true,
          data: undefined
        })

        await store.batchDelete([1, 2], { silentSuccess: true })

        expect(ElMessage.success).not.toHaveBeenCalled()
      })

      it('业务 non-200 时不应删除商品', async () => {
        vi.mocked(cartApi.batchDeleteCartItems).mockResolvedValue({
          code: 500,
          message: '批量删除失败',
          success: false,
          data: undefined
        })

        await expect(store.batchDelete([1, 2])).rejects.toThrow('批量删除失败')
        expect(store.items).toHaveLength(3)
        expect(store.error).toBe('批量删除失败')
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

      it('业务 non-200 时不应清空购物车', async () => {
        vi.mocked(cartApi.clearCart).mockResolvedValue({
          code: 500,
          message: '清空失败',
          success: false,
          data: undefined
        })

        await expect(store.clearCart()).rejects.toThrow('清空失败')
        expect(store.items).toEqual([mockCartItem])
        expect(store.error).toBe('清空失败')
      })

      it('不应把 success flag 且非 200 code 误判为清空成功', async () => {
        vi.mocked(cartApi.clearCart).mockResolvedValue({
          code: 500,
          message: '清空失败',
          success: true,
          data: undefined
        })

        await expect(store.clearCart()).rejects.toThrow('清空失败')
        expect(store.items).toEqual([mockCartItem])
        expect(store.error).toBe('清空失败')
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
