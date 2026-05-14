import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount, VueWrapper, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import SearchDropdown from '@/components/SearchDropdown.vue'
import searchApi from '@/api/searchApi'
import type { SearchSuggestion, HotKeyword, SearchHistory, ApiResponse } from '@/types'
import { debugError } from '@/utils/debug'

// Mock searchApi
vi.mock('@/api/searchApi', () => ({
  default: {
    getSuggestions: vi.fn(),
    getHotKeywords: vi.fn(),
    getSearchHistory: vi.fn(),
    addSearchHistory: vi.fn(),
    deleteSearchHistory: vi.fn(),
    clearSearchHistory: vi.fn(),
    recordSearch: vi.fn()
  }
}))

// Mock userStore
const mockIsLoggedIn = { value: false }
vi.mock('@/stores/userStore', () => ({
  useUserStore: vi.fn(() => ({
    get isLoggedIn() { return mockIsLoggedIn.value }
  }))
}))

vi.mock('@/utils/debug', () => ({
  debugError: vi.fn()
}))

describe('SearchDropdown', () => {
  let wrapper: VueWrapper<any>
  const mockedDebugError = vi.mocked(debugError)

  const mockHotKeywords: HotKeyword[] = [
    { keyword: '手机', searchCount: 100 },
    { keyword: '电脑', searchCount: 80 },
    { keyword: '耳机', searchCount: 60 }
  ]

  const mockSuggestions: SearchSuggestion[] = [
    { keyword: 'iPhone 15', type: 'product', highlight: '<em>iPhone</em> 15' },
    { keyword: '手机配件', type: 'category', highlight: '<em>手机</em>配件' }
  ]

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockIsLoggedIn.value = false
    window.localStorage.getItem = vi.fn(() => null)
    window.localStorage.setItem = vi.fn()
    window.localStorage.removeItem = vi.fn()
    
    // Setup default mock responses
    vi.mocked(searchApi.getHotKeywords).mockResolvedValue({
      code: 200,
      message: 'success',
      success: true,
      data: mockHotKeywords
    } as ApiResponse<HotKeyword[]>)
    
    vi.mocked(searchApi.getSearchHistory).mockResolvedValue({
      code: 200,
      message: 'success',
      success: true,
      data: []
    } as ApiResponse<SearchHistory[]>)
    
    vi.mocked(searchApi.getSuggestions).mockResolvedValue({
      code: 200,
      message: 'success',
      success: true,
      data: mockSuggestions
    } as ApiResponse<SearchSuggestion[]>)
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  const createWrapper = (props = {}) => {
    return mount(SearchDropdown, {
      props: {
        visible: false,
        keyword: '',
        ...props
      },
      global: {
        plugins: [createPinia()]
      }
    })
  }

  describe('显示逻辑', () => {
    it('visible为false时不显示下拉面板', () => {
      wrapper = createWrapper({ visible: false })
      expect(wrapper.find('.search-dropdown').exists()).toBe(false)
    })

    it('visible为true时显示下拉面板', async () => {
      wrapper = createWrapper({ visible: false })
      await wrapper.setProps({ visible: true })
      await flushPromises()
      expect(wrapper.find('.search-dropdown').exists()).toBe(true)
    })

    it('无输入时显示热门搜索区域', async () => {
      wrapper = createWrapper({ visible: false, keyword: '' })
      await wrapper.setProps({ visible: true })
      await flushPromises()
      await new Promise(resolve => setTimeout(resolve, 150))
      
      expect(wrapper.find('.section-title').exists()).toBe(true)
    })

    it('有输入时调用搜索建议API', async () => {
      wrapper = createWrapper({ visible: false, keyword: '' })
      await wrapper.setProps({ visible: true })
      await flushPromises()
      
      await wrapper.setProps({ keyword: 'iphone' })
      // 等待防抖
      await new Promise(resolve => setTimeout(resolve, 350))
      await flushPromises()
      
      expect(searchApi.getSuggestions).toHaveBeenCalledWith('iphone')
    })
  })

  describe('热门搜索', () => {
    it('应该加载热门搜索词', async () => {
      wrapper = createWrapper({ visible: false, keyword: '' })
      await wrapper.setProps({ visible: true })
      await flushPromises()
      await new Promise(resolve => setTimeout(resolve, 150))
      
      expect(searchApi.getHotKeywords).toHaveBeenCalled()
    })

    it('点击热门词应该触发select事件', async () => {
      wrapper = createWrapper({ visible: false, keyword: '' })
      await wrapper.setProps({ visible: true })
      await flushPromises()
      await new Promise(resolve => setTimeout(resolve, 150))
      
      const hotTags = wrapper.findAll('.hot-tag')
      if (hotTags.length > 0) {
        await hotTags[0].trigger('click')
        expect(wrapper.emitted('select')).toBeTruthy()
      }
    })
  })

  describe('搜索建议', () => {
    it('输入关键词后应该加载搜索建议', async () => {
      wrapper = createWrapper({ visible: false, keyword: '' })
      await wrapper.setProps({ visible: true })
      await flushPromises()
      
      await wrapper.setProps({ keyword: 'test' })
      // 等待防抖
      await new Promise(resolve => setTimeout(resolve, 350))
      await flushPromises()
      
      expect(searchApi.getSuggestions).toHaveBeenCalledWith('test')
    })

    it('空白关键词不应该加载搜索建议', async () => {
      wrapper = createWrapper({ visible: false, keyword: '' })
      await wrapper.setProps({ visible: true })
      await flushPromises()
      
      await wrapper.setProps({ keyword: '   ' })
      await new Promise(resolve => setTimeout(resolve, 350))
      await flushPromises()
      
      // 空白关键词不应该调用API
      expect(searchApi.getSuggestions).not.toHaveBeenCalled()
    })

    it('搜索建议返回非成功 payload 时会记录日志并清空建议', async () => {
      vi.mocked(searchApi.getSuggestions).mockResolvedValue({
        code: 500,
        message: '建议读取失败',
        success: false,
        data: []
      } as ApiResponse<SearchSuggestion[]>)

      wrapper = createWrapper({ visible: false, keyword: '' })
      await wrapper.setProps({ visible: true })
      await flushPromises()

      await wrapper.setProps({ keyword: 'test' })
      await new Promise(resolve => setTimeout(resolve, 350))
      await flushPromises()

      expect(mockedDebugError).toHaveBeenCalledWith('加载搜索建议失败:', '建议读取失败')
      expect(wrapper.vm.suggestions).toEqual([])
    })

    it('不应把 success flag 且非 200 code 误判为搜索建议成功', async () => {
      vi.mocked(searchApi.getSuggestions).mockResolvedValue({
        code: 500,
        message: '建议读取失败',
        success: true,
        data: mockSuggestions
      } as ApiResponse<SearchSuggestion[]>)

      wrapper = createWrapper({ visible: false, keyword: '' })
      await wrapper.setProps({ visible: true })
      await flushPromises()

      await wrapper.setProps({ keyword: 'test' })
      await new Promise(resolve => setTimeout(resolve, 350))
      await flushPromises()

      expect(mockedDebugError).toHaveBeenCalledWith('加载搜索建议失败:', '建议读取失败')
      expect(wrapper.vm.suggestions).toEqual([])
    })

    it('忽略过期的搜索建议响应，保留最新输入结果', async () => {
      let resolveFirst: ((value: ApiResponse<SearchSuggestion[]>) => void) | undefined
      let resolveSecond: ((value: ApiResponse<SearchSuggestion[]>) => void) | undefined

      vi.mocked(searchApi.getSuggestions)
        .mockImplementationOnce(() => new Promise((resolve) => { resolveFirst = resolve }))
        .mockImplementationOnce(() => new Promise((resolve) => { resolveSecond = resolve }))

      wrapper = createWrapper({ visible: false, keyword: '' })
      await wrapper.setProps({ visible: true })
      await flushPromises()

      await wrapper.setProps({ keyword: 'iph' })
      await new Promise(resolve => setTimeout(resolve, 350))

      await wrapper.setProps({ keyword: 'iphone' })
      await new Promise(resolve => setTimeout(resolve, 350))

      resolveSecond?.({
        code: 200,
        message: 'success',
        success: true,
        data: [{ keyword: 'iPhone 15', type: 'product', highlight: '<em>iPhone</em> 15' }]
      } as ApiResponse<SearchSuggestion[]>)
      await flushPromises()

      resolveFirst?.({
        code: 200,
        message: 'success',
        success: true,
        data: [{ keyword: 'iPhone 14', type: 'product', highlight: '<em>iPhone</em> 14' }]
      } as ApiResponse<SearchSuggestion[]>)
      await flushPromises()

      expect(wrapper.vm.suggestions).toEqual([
        { keyword: 'iPhone 15', type: 'product', highlight: '<em>iPhone</em> 15' }
      ])
    })
  })

  describe('键盘导航', () => {
    it('按ESC键应该触发close事件', async () => {
      wrapper = createWrapper({ visible: false })
      await wrapper.setProps({ visible: true })
      await flushPromises()
      
      // 模拟键盘事件
      const event = new KeyboardEvent('keydown', { key: 'Escape' })
      document.dispatchEvent(event)
      
      await wrapper.vm.$nextTick()
      expect(wrapper.emitted('close')).toBeTruthy()
    })
  })

  describe('游客本地存储', () => {
    it('游客模式下组件应该正常渲染', async () => {
      // 游客模式下组件应该正常工作
      mockIsLoggedIn.value = false
      wrapper = createWrapper({ visible: false, keyword: '' })
      await wrapper.setProps({ visible: true })
      await flushPromises()
      await new Promise(resolve => setTimeout(resolve, 150))
      
      // 游客模式下应该显示下拉面板
      expect(wrapper.find('.search-dropdown').exists()).toBe(true)
      // 游客模式下不应该调用服务器端搜索历史API
      expect(searchApi.getSearchHistory).not.toHaveBeenCalled()
    })

    it('游客模式下遇到损坏的本地历史时会清理并继续渲染', async () => {
      window.localStorage.getItem = vi.fn(() => 'not-json')

      mockIsLoggedIn.value = false
      wrapper = createWrapper({ visible: false, keyword: '' })
      await wrapper.setProps({ visible: true })
      await flushPromises()
      await new Promise(resolve => setTimeout(resolve, 150))

      expect(wrapper.find('.search-dropdown').exists()).toBe(true)
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('search_history_local')
      expect(mockedDebugError).toHaveBeenCalled()
    })

    it('游客模式下读取本地历史直接抛错时仍继续渲染', async () => {
      window.localStorage.getItem = vi.fn(() => {
        throw new Error('history unreadable')
      })

      mockIsLoggedIn.value = false
      wrapper = createWrapper({ visible: false, keyword: '' })
      await wrapper.setProps({ visible: true })
      await flushPromises()
      await new Promise(resolve => setTimeout(resolve, 150))

      expect(wrapper.find('.search-dropdown').exists()).toBe(true)
      expect(mockedDebugError).toHaveBeenCalledWith('读取本地搜索历史失败', expect.any(Error))
    })

    it('游客模式下损坏历史清理失败时仍继续渲染', async () => {
      window.localStorage.getItem = vi.fn(() => 'not-json')
      window.localStorage.removeItem = vi.fn(() => {
        throw new Error('remove blocked')
      })

      mockIsLoggedIn.value = false
      wrapper = createWrapper({ visible: false, keyword: '' })
      await wrapper.setProps({ visible: true })
      await flushPromises()
      await new Promise(resolve => setTimeout(resolve, 150))

      expect(wrapper.find('.search-dropdown').exists()).toBe(true)
      expect(mockedDebugError).toHaveBeenCalledWith('解析本地搜索历史失败', expect.any(Error))
      expect(mockedDebugError).toHaveBeenCalledWith('清理本地搜索历史失败', expect.any(Error))
    })

    it('游客模式下本地历史写入失败时仍继续触发选择事件', async () => {
      window.localStorage.setItem = vi.fn(() => {
        throw new Error('storage full')
      })

      mockIsLoggedIn.value = false
      wrapper = createWrapper({ visible: true, keyword: '' })
      await flushPromises()

      await (wrapper.vm as any).saveSearchHistory('机械键盘')
      ;(wrapper.vm as any).handleSelectHistory('机械键盘')
      await flushPromises()

      expect(wrapper.emitted('select')?.[0]).toEqual(['机械键盘'])
      expect(mockedDebugError).toHaveBeenCalledWith('保存本地搜索历史失败', expect.any(Error))
    })

    it('游客模式下删除本地历史写入失败时仍更新当前列表', async () => {
      window.localStorage.getItem = vi.fn(() => JSON.stringify(['耳机']))
      window.localStorage.setItem = vi.fn(() => {
        throw new Error('storage full')
      })

      mockIsLoggedIn.value = false
      wrapper = createWrapper({ visible: true, keyword: '' })
      await wrapper.setProps({ visible: true })
      await flushPromises()
      await new Promise(resolve => setTimeout(resolve, 150))

      ;(wrapper.vm as any).searchHistory = [{ id: 1, keyword: '耳机', searchTime: '' }]
      await (wrapper.vm as any).handleDeleteHistory(1)
      await flushPromises()

      expect((wrapper.vm as any).searchHistory).toEqual([])
      expect(mockedDebugError).toHaveBeenCalledWith('删除本地搜索历史失败', expect.any(Error))
    })

    it('游客模式下清空本地历史删除失败时仍清空当前列表', async () => {
      window.localStorage.removeItem = vi.fn(() => {
        throw new Error('remove failed')
      })

      mockIsLoggedIn.value = false
      wrapper = createWrapper({ visible: true, keyword: '' })
      await flushPromises()

      ;(wrapper.vm as any).searchHistory = [{ id: 1, keyword: '耳机', searchTime: '' }]
      await (wrapper.vm as any).handleClearHistory()
      await flushPromises()

      expect((wrapper.vm as any).searchHistory).toEqual([])
      expect(mockedDebugError).toHaveBeenCalledWith('清空本地搜索历史失败', expect.any(Error))
    })
  })

  describe('搜索历史限制', () => {
    it('登录用户应该调用搜索历史API', async () => {
      mockIsLoggedIn.value = true
      
      wrapper = createWrapper({ visible: false, keyword: '' })
      await wrapper.setProps({ visible: true })
      await flushPromises()
      await new Promise(resolve => setTimeout(resolve, 150))
      
      // 验证API被调用
      expect(searchApi.getSearchHistory).toHaveBeenCalled()
    })

    it('登录用户历史接口返回非成功 payload 时会记录日志', async () => {
      mockIsLoggedIn.value = true
      vi.mocked(searchApi.getSearchHistory).mockResolvedValue({
        code: 500,
        message: '历史读取失败',
        success: false,
        data: []
      } as ApiResponse<SearchHistory[]>)

      wrapper = createWrapper({ visible: false, keyword: '' })
      await wrapper.setProps({ visible: true })
      await flushPromises()
      await new Promise(resolve => setTimeout(resolve, 150))

      expect(mockedDebugError).toHaveBeenCalledWith('加载搜索历史失败:', '历史读取失败')
    })

    it('不应把 success flag 且非 200 code 误判为搜索历史成功', async () => {
      mockIsLoggedIn.value = true
      vi.mocked(searchApi.getSearchHistory).mockResolvedValue({
        code: 500,
        message: '历史读取失败',
        success: true,
        data: [{ id: 1, keyword: '假历史', searchTime: '2026-05-09T10:00:00' }]
      } as ApiResponse<SearchHistory[]>)

      wrapper = createWrapper({ visible: false, keyword: '' })
      await wrapper.setProps({ visible: true })
      await flushPromises()
      await new Promise(resolve => setTimeout(resolve, 150))

      expect(mockedDebugError).toHaveBeenCalledWith('加载搜索历史失败:', '历史读取失败')
      expect(wrapper.vm.searchHistory).toEqual([])
    })

    it('登录用户删除搜索历史成功后会重新拉取服务端历史', async () => {
      mockIsLoggedIn.value = true
      vi.mocked(searchApi.getSearchHistory)
        .mockResolvedValueOnce({
          code: 200,
          message: 'success',
          success: true,
          data: [{ id: 1, keyword: '耳机', searchTime: '2026-05-09T10:00:00' }]
        } as ApiResponse<SearchHistory[]>)
        .mockResolvedValueOnce({
          code: 200,
          message: 'success',
          success: true,
          data: []
        } as ApiResponse<SearchHistory[]>)
      vi.mocked(searchApi.deleteSearchHistory).mockResolvedValue({
        code: 200,
        message: 'success',
        success: true,
        data: true
      } as ApiResponse<boolean>)

      wrapper = createWrapper({ visible: false, keyword: '' })
      await wrapper.setProps({ visible: true })
      await flushPromises()
      await new Promise(resolve => setTimeout(resolve, 150))

      await wrapper.find('.delete-btn').trigger('click')
      await flushPromises()

      expect(searchApi.getSearchHistory).toHaveBeenCalledTimes(2)
      expect(wrapper.findAll('.history-item')).toHaveLength(0)
    })

    it('忽略过期的搜索历史响应，保留最新历史列表', async () => {
      mockIsLoggedIn.value = true
      let resolveFirst: ((value: ApiResponse<SearchHistory[]>) => void) | undefined
      let resolveSecond: ((value: ApiResponse<SearchHistory[]>) => void) | undefined

      vi.mocked(searchApi.getSearchHistory)
        .mockImplementationOnce(() => new Promise((resolve) => { resolveFirst = resolve }))
        .mockImplementationOnce(() => new Promise((resolve) => { resolveSecond = resolve }))

      wrapper = createWrapper({ visible: false, keyword: '' })

      await wrapper.setProps({ visible: true })
      await flushPromises()

      await wrapper.setProps({ visible: false })
      await wrapper.setProps({ visible: true })
      await flushPromises()

      resolveSecond?.({
        code: 200,
        message: 'success',
        success: true,
        data: [{ id: 2, keyword: '新历史', searchTime: '2026-05-10T10:00:00' }]
      } as ApiResponse<SearchHistory[]>)
      await flushPromises()

      resolveFirst?.({
        code: 200,
        message: 'success',
        success: true,
        data: [{ id: 1, keyword: '旧历史', searchTime: '2026-05-09T10:00:00' }]
      } as ApiResponse<SearchHistory[]>)
      await flushPromises()

      expect(wrapper.vm.searchHistory).toEqual([
        { id: 2, keyword: '新历史', searchTime: '2026-05-10T10:00:00' }
      ])
    })

    it('登录用户清空搜索历史成功后会重新拉取服务端历史', async () => {
      mockIsLoggedIn.value = true
      vi.mocked(searchApi.getSearchHistory)
        .mockResolvedValueOnce({
          code: 200,
          message: 'success',
          success: true,
          data: [{ id: 1, keyword: '耳机', searchTime: '2026-05-09T10:00:00' }]
        } as ApiResponse<SearchHistory[]>)
        .mockResolvedValueOnce({
          code: 200,
          message: 'success',
          success: true,
          data: []
        } as ApiResponse<SearchHistory[]>)
      vi.mocked(searchApi.clearSearchHistory).mockResolvedValue({
        code: 200,
        message: 'success',
        success: true,
        data: true
      } as ApiResponse<boolean>)

      wrapper = createWrapper({ visible: false, keyword: '' })
      await wrapper.setProps({ visible: true })
      await flushPromises()
      await new Promise(resolve => setTimeout(resolve, 150))

      await wrapper.find('.clear-btn').trigger('click')
      await flushPromises()

      expect(searchApi.getSearchHistory).toHaveBeenCalledTimes(2)
      expect(wrapper.findAll('.history-item')).toHaveLength(0)
    })

    it('登录用户删除历史后，进行中的旧历史请求不会把已删除项写回', async () => {
      mockIsLoggedIn.value = true
      let resolveInitial: ((value: ApiResponse<SearchHistory[]>) => void) | undefined
      let resolveRefetch: ((value: ApiResponse<SearchHistory[]>) => void) | undefined

      vi.mocked(searchApi.getSearchHistory)
        .mockImplementationOnce(() => new Promise((resolve) => { resolveInitial = resolve }))
        .mockImplementationOnce(() => new Promise((resolve) => { resolveRefetch = resolve }))
      vi.mocked(searchApi.deleteSearchHistory).mockResolvedValue({
        code: 200,
        message: 'success',
        success: true,
        data: true
      } as ApiResponse<boolean>)

      wrapper = createWrapper({ visible: false, keyword: '' })
      await wrapper.setProps({ visible: true })
      await flushPromises()

      ;(wrapper.vm as any).searchHistory = [
        { id: 1, keyword: '耳机', searchTime: '2026-05-09T10:00:00' }
      ]

      const deletePromise = (wrapper.vm as any).handleDeleteHistory(1)
      await flushPromises()

      expect((wrapper.vm as any).searchHistory).toEqual([])

      resolveRefetch?.({
        code: 200,
        message: 'success',
        success: true,
        data: []
      } as ApiResponse<SearchHistory[]>)
      await deletePromise
      await flushPromises()

      resolveInitial?.({
        code: 200,
        message: 'success',
        success: true,
        data: [{ id: 1, keyword: '耳机', searchTime: '2026-05-09T10:00:00' }]
      } as ApiResponse<SearchHistory[]>)
      await flushPromises()

      expect((wrapper.vm as any).searchHistory).toEqual([])
    })

    it('登录用户清空历史后，进行中的旧历史请求不会把列表写回', async () => {
      mockIsLoggedIn.value = true
      let resolveInitial: ((value: ApiResponse<SearchHistory[]>) => void) | undefined
      let resolveRefetch: ((value: ApiResponse<SearchHistory[]>) => void) | undefined

      vi.mocked(searchApi.getSearchHistory)
        .mockImplementationOnce(() => new Promise((resolve) => { resolveInitial = resolve }))
        .mockImplementationOnce(() => new Promise((resolve) => { resolveRefetch = resolve }))
      vi.mocked(searchApi.clearSearchHistory).mockResolvedValue({
        code: 200,
        message: 'success',
        success: true,
        data: true
      } as ApiResponse<boolean>)

      wrapper = createWrapper({ visible: false, keyword: '' })
      await wrapper.setProps({ visible: true })
      await flushPromises()

      ;(wrapper.vm as any).searchHistory = [
        { id: 1, keyword: '耳机', searchTime: '2026-05-09T10:00:00' }
      ]

      const clearPromise = (wrapper.vm as any).handleClearHistory()
      await flushPromises()

      expect((wrapper.vm as any).searchHistory).toEqual([])

      resolveRefetch?.({
        code: 200,
        message: 'success',
        success: true,
        data: []
      } as ApiResponse<SearchHistory[]>)
      await clearPromise
      await flushPromises()

      resolveInitial?.({
        code: 200,
        message: 'success',
        success: true,
        data: [{ id: 1, keyword: '耳机', searchTime: '2026-05-09T10:00:00' }]
      } as ApiResponse<SearchHistory[]>)
      await flushPromises()

      expect((wrapper.vm as any).searchHistory).toEqual([])
    })
  })

  describe('热门搜索限制', () => {
    it('热门搜索API应该被调用', async () => {
      wrapper = createWrapper({ visible: false, keyword: '' })
      await wrapper.setProps({ visible: true })
      await flushPromises()
      await new Promise(resolve => setTimeout(resolve, 150))
      
      // 验证API被调用
      expect(searchApi.getHotKeywords).toHaveBeenCalled()
    })

    it('热门搜索返回非成功 payload 时会记录日志', async () => {
      vi.mocked(searchApi.getHotKeywords).mockResolvedValue({
        code: 500,
        message: '热门词读取失败',
        success: false,
        data: []
      } as ApiResponse<HotKeyword[]>)

      wrapper = createWrapper({ visible: false, keyword: '' })
      await wrapper.setProps({ visible: true })
      await flushPromises()
      await new Promise(resolve => setTimeout(resolve, 150))

      expect(mockedDebugError).toHaveBeenCalledWith('加载热门搜索词失败:', '热门词读取失败')
    })

    it('不应把 success flag 且非 200 code 误判为热搜成功', async () => {
      vi.mocked(searchApi.getHotKeywords).mockResolvedValue({
        code: 500,
        message: '热门词读取失败',
        success: true,
        data: mockHotKeywords
      } as ApiResponse<HotKeyword[]>)

      wrapper = createWrapper({ visible: false, keyword: '' })
      await wrapper.setProps({ visible: true })
      await flushPromises()
      await new Promise(resolve => setTimeout(resolve, 150))

      expect(mockedDebugError).toHaveBeenCalledWith('加载热门搜索词失败:', '热门词读取失败')
      expect(wrapper.vm.hotKeywords).toEqual([])
    })

    it('忽略过期的热门搜索响应，保留最新热搜列表', async () => {
      let resolveFirst: ((value: ApiResponse<HotKeyword[]>) => void) | undefined
      let resolveSecond: ((value: ApiResponse<HotKeyword[]>) => void) | undefined

      vi.mocked(searchApi.getHotKeywords)
        .mockImplementationOnce(() => new Promise((resolve) => { resolveFirst = resolve }))
        .mockImplementationOnce(() => new Promise((resolve) => { resolveSecond = resolve }))

      wrapper = createWrapper({ visible: false, keyword: '' })

      await wrapper.setProps({ visible: true })
      await flushPromises()

      await wrapper.setProps({ visible: false })
      await wrapper.setProps({ visible: true })
      await flushPromises()

      resolveSecond?.({
        code: 200,
        message: 'success',
        success: true,
        data: [{ keyword: '新热搜', searchCount: 200 }]
      } as ApiResponse<HotKeyword[]>)
      await flushPromises()

      resolveFirst?.({
        code: 200,
        message: 'success',
        success: true,
        data: [{ keyword: '旧热搜', searchCount: 100 }]
      } as ApiResponse<HotKeyword[]>)
      await flushPromises()

      expect(wrapper.vm.hotKeywords).toEqual([
        { keyword: '新热搜', searchCount: 200 }
      ])
    })
  })

  describe('搜索建议限制', () => {
    it('搜索建议API应该被调用', async () => {
      wrapper = createWrapper({ visible: false, keyword: '' })
      await wrapper.setProps({ visible: true })
      await flushPromises()
      
      await wrapper.setProps({ keyword: 'test' })
      await new Promise(resolve => setTimeout(resolve, 350))
      await flushPromises()
      
      // 验证API被调用
      expect(searchApi.getSuggestions).toHaveBeenCalledWith('test')
    })
  })

  describe('保存历史', () => {
    it('登录用户保存搜索历史成功后会重新拉取服务端历史', async () => {
      mockIsLoggedIn.value = true
      vi.mocked(searchApi.addSearchHistory).mockResolvedValue({
        code: 200,
        message: 'success',
        success: true,
        data: true
      } as ApiResponse<boolean>)
      vi.mocked(searchApi.getSearchHistory)
        .mockResolvedValueOnce({
          code: 200,
          message: 'success',
          success: true,
          data: []
        } as ApiResponse<SearchHistory[]>)
        .mockResolvedValueOnce({
          code: 200,
          message: 'success',
          success: true,
          data: [{ id: 1, keyword: '耳机', searchTime: '2026-05-09T10:00:00' }]
        } as ApiResponse<SearchHistory[]>)

      wrapper = createWrapper({ visible: false, keyword: '' })
      await wrapper.setProps({ visible: true })
      await flushPromises()
      await new Promise(resolve => setTimeout(resolve, 150))

      await (wrapper.vm as { saveSearchHistory: (keyword: string) => Promise<void> }).saveSearchHistory('耳机')
      await flushPromises()

      expect(searchApi.addSearchHistory).toHaveBeenCalledWith('耳机')
      expect(searchApi.getSearchHistory).toHaveBeenCalledTimes(2)
    })

    it('登录用户保存历史后，进行中的旧历史请求不会覆盖新关键词', async () => {
      mockIsLoggedIn.value = true
      let resolveInitial: ((value: ApiResponse<SearchHistory[]>) => void) | undefined
      let resolveRefetch: ((value: ApiResponse<SearchHistory[]>) => void) | undefined

      vi.mocked(searchApi.getSearchHistory)
        .mockImplementationOnce(() => new Promise((resolve) => { resolveInitial = resolve }))
        .mockImplementationOnce(() => new Promise((resolve) => { resolveRefetch = resolve }))
      vi.mocked(searchApi.addSearchHistory).mockResolvedValue({
        code: 200,
        message: 'success',
        success: true,
        data: true
      } as ApiResponse<boolean>)

      wrapper = createWrapper({ visible: false, keyword: '' })
      await wrapper.setProps({ visible: true })
      await flushPromises()

      const savePromise = (wrapper.vm as { saveSearchHistory: (keyword: string) => Promise<void> }).saveSearchHistory('耳机')
      await flushPromises()

      expect((wrapper.vm as any).searchHistory[0].keyword).toBe('耳机')

      resolveRefetch?.({
        code: 200,
        message: 'success',
        success: true,
        data: [{ id: 2, keyword: '耳机', searchTime: '2026-05-10T10:00:00' }]
      } as ApiResponse<SearchHistory[]>)
      await savePromise
      await flushPromises()

      resolveInitial?.({
        code: 200,
        message: 'success',
        success: true,
        data: [{ id: 1, keyword: '旧历史', searchTime: '2026-05-09T10:00:00' }]
      } as ApiResponse<SearchHistory[]>)
      await flushPromises()

      expect((wrapper.vm as any).searchHistory).toEqual([
        { id: 2, keyword: '耳机', searchTime: '2026-05-10T10:00:00' }
      ])
    })
  })
})
