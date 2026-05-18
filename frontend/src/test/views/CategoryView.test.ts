import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import productApi from '@/api/productApi'
import categoryApi from '@/api/categoryApi'
import fileApi from '@/api/fileApi'
import * as debugModule from '@/utils/debug'
import CategoryView from '@/views/CategoryView.vue'

const getProductsSpy = vi.spyOn(productApi, 'getProducts')
const getCategoriesSpy = vi.spyOn(categoryApi, 'getCategories')
const getImageUrlSpy = vi.spyOn(fileApi, 'getImageUrl')
const debugError = vi.spyOn(debugModule, 'debugError').mockImplementation(() => {})

describe('CategoryView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('scrollTo', vi.fn())
    getProductsSpy.mockResolvedValue({
      code: 200,
      data: { content: [], totalElements: 0 }
    } as any)
    getCategoriesSpy.mockResolvedValue({
      code: 200,
      data: [{ id: 1, name: '数码' }]
    } as any)
    getImageUrlSpy.mockReturnValue('/img.png')
    debugError.mockImplementation(() => {})
  })

  const mountView = async (query: Record<string, string> = {}) => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/category', component: { template: '<div />' } },
        { path: '/product/:id', component: { template: '<div />' } }
      ]
    })

    await router.push({ path: '/category', query })
    await router.isReady()

    const wrapper = mount(CategoryView, {
      global: {
        plugins: [router],
        stubs: {
          Navbar: true,
          Footer: true,
          ElPagination: true
        }
      }
    })

    return { wrapper, router }
  }

  it('logs when product list returns non-200 payload', async () => {
    getProductsSpy.mockResolvedValue({
      code: 500,
      message: '商品读取失败'
    } as any)

    await mountView()
    await flushPromises()

    expect(debugError).toHaveBeenCalledWith('获取分类商品列表失败:', '商品读取失败')
  })

  it('logs when categories returns non-200 payload', async () => {
    getCategoriesSpy.mockResolvedValue({
      code: 500,
      message: '分类读取失败'
    } as any)

    await mountView()
    await flushPromises()

    expect(debugError).toHaveBeenCalledWith('获取分类列表失败:', '分类读取失败')
  })

  it('clears search keyword by routing back to category page', async () => {
    const { wrapper, router } = await mountView({ q: '耳机' })

    await flushPromises()
    await wrapper.find('.clear-search').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.fullPath).toBe('/category')
  })

  it('syncs selected category when route query id changes after mount', async () => {
    const { wrapper, router } = await mountView({ id: '1' })

    await flushPromises()
    expect((wrapper.vm as any).selectedCategory).toBe(1)

    await router.push({ path: '/category', query: { id: '2' } })
    await flushPromises()

    expect((wrapper.vm as any).selectedCategory).toBe(2)
  })

  it('clears selected category when route query id is removed', async () => {
    const { wrapper, router } = await mountView({ id: '1' })

    await flushPromises()
    expect((wrapper.vm as any).selectedCategory).toBe(1)

    await router.push('/category')
    await flushPromises()

    expect((wrapper.vm as any).selectedCategory).toBeNull()
  })

  it('ignores stale product responses when a newer request finishes later', async () => {
    let resolveFirst: ((value: unknown) => void) | undefined
    let resolveSecond: ((value: unknown) => void) | undefined

    getProductsSpy
      .mockImplementationOnce(() => new Promise((resolve) => { resolveFirst = resolve }))
      .mockImplementationOnce(() => new Promise((resolve) => { resolveSecond = resolve }))

    const { wrapper } = await mountView()
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

  it('renders pagination ellipsis as non-interactive text instead of quick-jump buttons', async () => {
    getProductsSpy.mockResolvedValue({
      code: 200,
      data: { content: [], totalElements: 120 }
    } as any)

    const { wrapper } = await mountView()
    await flushPromises()

    expect((wrapper.vm as any).paginationItems).toEqual([1, 2, 3, 4, 'ellipsis-right', 10])
    expect(wrapper.find('.page-ellipsis').exists()).toBe(true)
    expect(wrapper.find('.page-btn.ghost').exists()).toBe(false)

    ;(wrapper.vm as any).handlePageChange(5)
    await flushPromises()

    expect((wrapper.vm as any).paginationItems).toEqual([1, 'ellipsis-left', 4, 5, 6, 'ellipsis-right', 10])
    expect(wrapper.findAll('.page-ellipsis')).toHaveLength(2)
  })

  it('ignores out-of-range page changes', async () => {
    getProductsSpy.mockResolvedValue({
      code: 200,
      data: { content: [], totalElements: 24 }
    } as any)

    const { wrapper } = await mountView()
    await flushPromises()
    getProductsSpy.mockClear()

    ;(wrapper.vm as any).handlePageChange(0)
    ;(wrapper.vm as any).handlePageChange(3)

    expect(getProductsSpy).not.toHaveBeenCalled()
  })
})
