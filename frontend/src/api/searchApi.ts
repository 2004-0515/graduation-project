import axios from '@/utils/axios'
import type { ApiResponse, SearchSuggestion, HotKeyword, SearchHistory } from '@/types'

/**
 * 搜索相关API
 */
const searchApi = {
  /**
   * 获取搜索建议
   * @param keyword 搜索关键词前缀
   * @returns 搜索建议列表（最多6条）
   */
  getSuggestions(keyword: string): Promise<ApiResponse<SearchSuggestion[]>> {
    return axios.get('/search/suggestions', { params: { keyword } })
  },

  /**
   * 获取热门搜索词
   * @returns 热门关键词列表（最多8条）
   */
  getHotKeywords(): Promise<ApiResponse<HotKeyword[]>> {
    return axios.get('/search/hot-keywords')
  },

  /**
   * 获取用户搜索历史
   * @returns 搜索历史列表（最多10条）
   */
  getSearchHistory(): Promise<ApiResponse<SearchHistory[]>> {
    return axios.get('/search/history')
  },

  /**
   * 添加搜索历史
   * @param keyword 搜索关键词
   */
  addSearchHistory(keyword: string): Promise<ApiResponse<void>> {
    return axios.post('/search/history', { keyword })
  },

  /**
   * 删除单条搜索历史
   * @param id 历史记录ID
   */
  deleteSearchHistory(id: number): Promise<ApiResponse<void>> {
    return axios.delete(`/search/history/${id}`)
  },

  /**
   * 清空搜索历史
   */
  clearSearchHistory(): Promise<ApiResponse<void>> {
    return axios.delete('/search/history')
  },

  /**
   * 记录搜索统计
   * @param keyword 搜索关键词
   */
  recordSearch(keyword: string): Promise<ApiResponse<void>> {
    return axios.post('/search/stats', { keyword })
  }
}

export default searchApi
