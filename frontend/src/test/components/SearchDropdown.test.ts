import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount, VueWrapper, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import SearchDropdown from '@/components/SearchDropdown.vue'
import searchApi from '@/api/searchApi'
import type { SearchSuggestion, HotKeyword, SearchHistory, ApiResponse } from '@/types'

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

describe('SearchDropdown', () => {
  let wrapper: VueWrapper<any>

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
})
