import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { productApi, categoryApi, fileApi, routeState, routerPush, debugError } = vi.hoisted(() => ({
  productApi: {
    getProducts: vi.fn()
  },
  categoryApi: {
    getCategories: vi.fn()
  },
  fileApi: {
    getImageUrl: vi.fn(() => '/img.png')
  },
  routeState: {
    query: {}
  },
  routerPush: vi.fn(),
  debugError: vi.fn()
}))

vi.mock('vue-router', () => ({
  useRoute: () => routeState,
  useRouter: () => ({ push: routerPush })
}))

vi.mock('@/api/productApi', () => ({
  default: productApi
}))

vi.mock('@/api/categoryApi', () => ({
  default: categoryApi
}))

vi.mock('@/api/fileApi', () => ({
  default: fileApi
}))

vi.mock('@/utils/debug', () => ({
  debugError
}))

import CategoryView from '@/views/CategoryView.vue'

describe('CategoryView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('scrollTo', vi.fn())
    routeState.query = {}
    productApi.getProducts.mockResolvedValue({
      code: 200,
      data: { content: [], totalElements: 0 }
    })
    categoryApi.getCategories.mockResolvedValue({
      code: 200,
      data: [{ id: 1, name: '数码' }]
    })
  })

  const mountView = () =>
    mount(CategoryView, {
      global: {
        stubs: {
          Navbar: true,
          Footer: true,
          ElPagination: true
        }
      }
    })

  it('logs when product list returns non-200 payload', async () => {
    productApi.getProducts.mockResolvedValue({
      code: 500,
      message: '商品读取失败'
    })

    mountView()
    await flushPromises()

    expect(debugError).toHaveBeenCalledWith('获取分类商品列表失败:', '商品读取失败')
  })

  it('logs when categories returns non-200 payload', async () => {
    categoryApi.getCategories.mockResolvedValue({
      code: 500,
      message: '分类读取失败'
    })

    mountView()
    await flushPromises()

    expect(debugError).toHaveBeenCalledWith('获取分类列表失败:', '分类读取失败')
  })

  it('clears search keyword by routing back to category page', async () => {
    routeState.query = { q: '耳机' }
    const wrapper = mountView()

    await flushPromises()
    await wrapper.find('.clear-search').trigger('click')

    expect(routerPush).toHaveBeenCalledWith('/category')
  })

  it('syncs selected category when route query id changes after mount', async () => {
    routeState.query = { id: '1' }
    const wrapper = mountView()

    await flushPromises()
    expect((wrapper.vm as any).selectedCategory).toBe(1)

    routeState.query = { id: '2' }
    ;(wrapper.vm as any).syncSelectedCategoryFromRoute()

    expect((wrapper.vm as any).selectedCategory).toBe(2)
  })

  it('clears selected category when route query id is removed', async () => {
    routeState.query = { id: '1' }
    const wrapper = mountView()

    await flushPromises()
    expect((wrapper.vm as any).selectedCategory).toBe(1)

    routeState.query = {}
    ;(wrapper.vm as any).syncSelectedCategoryFromRoute()

    expect((wrapper.vm as any).selectedCategory).toBeNull()
  })

  it('ignores stale product responses when a newer request finishes later', async () => {
    let resolveFirst: ((value: unknown) => void) | undefined
    let resolveSecond: ((value: unknown) => void) | undefined

    productApi.getProducts
      .mockImplementationOnce(() => new Promise((resolve) => { resolveFirst = resolve }))
      .mockImplementationOnce(() => new Promise((resolve) => { resolveSecond = resolve }))

    const wrapper = mountView()
    await flushPromises()

    ;(wrapper.vm as any).changeSort('sales')

    resolveSecond?.({
      code: 200,
      data: { content: [{ id: 2, name: '新结果' }], totalElements: 1 }
    })
    await flushPromises()

    resolveFirst?.({
      code: 200,
      data: { content: [{ id: 1, name: '旧结果' }], totalElements: 1 }
    })
    await flushPromises()

    expect((wrapper.vm as any).products).toEqual([{ id: 2, name: '新结果' }])
    expect((wrapper.vm as any).total).toBe(1)
  })
})
