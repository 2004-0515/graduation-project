<template>
  <div class="search-dropdown" data-testid="search-dropdown" v-if="visible" @mousedown.prevent>
    <!-- 搜索历史区域 -->
    <div v-if="!hasInput && (searchHistory.length > 0 || !isLoggedIn)" class="dropdown-section">
      <div class="section-header">
        <span class="section-title">搜索历史</span>
        <button v-if="searchHistory.length > 0" class="clear-btn" @click="handleClearHistory">
          清空
        </button>
      </div>
      <div v-if="searchHistory.length > 0" class="history-list" data-testid="search-history-list">
        <div 
          v-for="item in searchHistory" 
          :key="item.id" 
          class="history-item"
          :data-testid="`search-history-item-${item.id}`"
          :class="{ selected: selectedIndex === getHistoryIndex(item) }"
          @click="handleSelectHistory(item.keyword)"
          @mouseenter="selectedIndex = getHistoryIndex(item)"
        >
          <svg class="history-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          <span class="history-keyword">{{ item.keyword }}</span>
          <button class="delete-btn" @click.stop="handleDeleteHistory(item.id)">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>
      <div v-else-if="isLoggedIn" class="empty-tip">暂无搜索历史</div>
      <div v-else class="empty-tip">登录后可保存搜索历史</div>
    </div>

    <!-- 热门搜索区域 -->
    <div v-if="!hasInput && hotKeywords.length > 0" class="dropdown-section">
      <div class="section-header">
        <span class="section-title">热门搜索</span>
      </div>
      <div class="hot-keywords" data-testid="search-hot-keywords">
        <span 
          v-for="(item, index) in hotKeywords" 
          :key="item.keyword"
          class="hot-tag"
          :data-testid="`search-hot-item-${index}`"
          :class="{ 
            hot: index < 3,
            selected: selectedIndex === getHotIndex(index)
          }"
          @click="handleSelectHot(item.keyword)"
          @mouseenter="selectedIndex = getHotIndex(index)"
        >
          <span v-if="index < 3" class="hot-rank">{{ index + 1 }}</span>
          {{ item.keyword }}
        </span>
      </div>
    </div>

    <!-- 搜索建议区域 -->
    <div v-if="hasInput && suggestions.length > 0" class="dropdown-section">
      <div class="suggestions-list" data-testid="search-suggestions-list">
        <div 
          v-for="(item, index) in suggestions" 
          :key="item.keyword + item.type"
          class="suggestion-item"
          :data-testid="`search-suggestion-item-${index}`"
          :class="{ selected: selectedIndex === index }"
          @click="handleSelectSuggestion(item.keyword)"
          @mouseenter="selectedIndex = index"
        >
          <svg v-if="item.type === 'product'" class="suggestion-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
            <line x1="7" y1="7" x2="7.01" y2="7"/>
          </svg>
          <svg v-else class="suggestion-icon category" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
          </svg>
          <span class="suggestion-text" v-html="item.highlight"></span>
          <span class="suggestion-type">{{ item.type === 'product' ? '商品' : '分类' }}</span>
        </div>
      </div>
    </div>

    <!-- 无搜索建议时 -->
    <div v-if="hasInput && suggestions.length === 0 && !loading" class="dropdown-section">
      <div class="empty-tip">未找到相关内容</div>
    </div>

    <!-- 加载中 -->
    <div v-if="loading" class="dropdown-section">
      <div class="loading-tip">搜索中...</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useUserStore } from '@/stores/userStore'
import searchApi from '@/api/searchApi'
import type { SearchSuggestion, HotKeyword, SearchHistory } from '@/types'
import { debugError } from '@/utils/debug'

const props = defineProps<{
  visible: boolean
  keyword: string
}>()

const emit = defineEmits<{
  (e: 'select', keyword: string): void
  (e: 'close'): void
}>()

const userStore = useUserStore()
const isLoggedIn = computed(() => userStore.isLoggedIn)
const hasInput = computed(() => props.keyword.trim().length > 0)

// 数据状态
const searchHistory = ref<SearchHistory[]>([])
const hotKeywords = ref<HotKeyword[]>([])
const suggestions = ref<SearchSuggestion[]>([])
const loading = ref(false)
const selectedIndex = ref(-1)

// 本地存储的搜索历史（游客模式）
const LOCAL_HISTORY_KEY = 'search_history_local'
const MAX_LOCAL_HISTORY = 10

// 防抖定时器
let debounceTimer: ReturnType<typeof setTimeout> | null = null
let latestHistoryRequestId = 0
let latestHotKeywordsRequestId = 0
let latestSuggestionsRequestId = 0
const getResponseMessage = (res: any, fallback: string) => res?.message || fallback
const isSuccessfulResponse = (res: any) => res?.code === 200
const invalidateHistoryRequests = () => {
  latestHistoryRequestId += 1
}

const clearLocalHistoryStorage = (reason: 'parse' | 'clear') => {
  try {
    localStorage.removeItem(LOCAL_HISTORY_KEY)
  } catch (error) {
    debugError(reason === 'parse' ? '清理本地搜索历史失败' : '清空本地搜索历史失败', error)
  }
}

const loadLocalHistoryKeywords = () => {
  let local: string | null = null
  try {
    local = localStorage.getItem(LOCAL_HISTORY_KEY)
  } catch (error) {
    debugError('读取本地搜索历史失败', error)
    return []
  }
  if (!local) {
    return []
  }

  try {
    const parsed = JSON.parse(local)
    return Array.isArray(parsed) ? parsed.filter((keyword): keyword is string => typeof keyword === 'string') : []
  } catch (error) {
    debugError('解析本地搜索历史失败', error)
    clearLocalHistoryStorage('parse')
    return []
  }
}

// 计算索引
const getHistoryIndex = (item: SearchHistory) => {
  return searchHistory.value.findIndex(h => h.id === item.id)
}

const getHotIndex = (index: number) => {
  return searchHistory.value.length + index
}

const totalItems = computed(() => {
  if (hasInput.value) {
    return suggestions.value.length
  }
  return searchHistory.value.length + hotKeywords.value.length
})

// 加载搜索历史
const loadSearchHistory = async () => {
  const requestId = ++latestHistoryRequestId
  if (isLoggedIn.value) {
    try {
      const res = await searchApi.getSearchHistory()
      if (requestId !== latestHistoryRequestId) {
        return
      }
      if (isSuccessfulResponse(res)) {
        searchHistory.value = res.data
      } else {
        debugError('加载搜索历史失败:', getResponseMessage(res, '业务返回异常'))
      }
    } catch (error) {
      if (requestId !== latestHistoryRequestId) {
        return
      }
      debugError('加载搜索历史失败', error)
    }
  } else {
    // 游客模式：从本地存储加载
    if (requestId === latestHistoryRequestId) {
      searchHistory.value = loadLocalHistoryKeywords().map((keyword, index) => ({
        id: index,
        keyword,
        searchTime: new Date().toISOString()
      }))
    }
  }
}

// 加载热门搜索词
const loadHotKeywords = async () => {
  const requestId = ++latestHotKeywordsRequestId
  try {
    const res = await searchApi.getHotKeywords()
    if (requestId !== latestHotKeywordsRequestId) {
      return
    }
    if (isSuccessfulResponse(res)) {
      hotKeywords.value = res.data
    } else {
      debugError('加载热门搜索词失败:', getResponseMessage(res, '业务返回异常'))
    }
  } catch (error) {
    if (requestId !== latestHotKeywordsRequestId) {
      return
    }
    debugError('加载热门搜索词失败', error)
  }
}

// 加载搜索建议（带防抖）
const loadSuggestions = (keyword: string) => {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
  
  if (!keyword.trim()) {
    suggestions.value = []
    return
  }
  
  loading.value = true
  debounceTimer = setTimeout(async () => {
    const requestId = ++latestSuggestionsRequestId
    try {
      const res = await searchApi.getSuggestions(keyword)
      if (requestId !== latestSuggestionsRequestId) {
        return
      }
      if (isSuccessfulResponse(res)) {
        suggestions.value = res.data
      } else {
        debugError('加载搜索建议失败:', getResponseMessage(res, '业务返回异常'))
        suggestions.value = []
      }
    } catch (error) {
      if (requestId !== latestSuggestionsRequestId) {
        return
      }
      debugError('加载搜索建议失败', error)
      suggestions.value = []
    } finally {
      if (requestId === latestSuggestionsRequestId) {
        loading.value = false
      }
    }
  }, 300)
}

// 保存搜索历史
const saveSearchHistory = async (keyword: string) => {
  if (isLoggedIn.value) {
    try {
      const res = await searchApi.addSearchHistory(keyword)
      if (isSuccessfulResponse(res)) {
        invalidateHistoryRequests()
        searchHistory.value = [
          {
            id: Date.now(),
            keyword,
            searchTime: new Date().toISOString()
          },
          ...searchHistory.value.filter((item) => item.keyword !== keyword)
        ]
        await loadSearchHistory()
      } else {
        debugError('保存搜索历史失败:', getResponseMessage(res, '业务返回异常'))
      }
    } catch (error) {
      debugError('保存搜索历史失败', error)
    }
  } else {
    // 游客模式：保存到本地存储
    let history = loadLocalHistoryKeywords()
    // 去重并添加到开头
    history = history.filter(h => h !== keyword)
    history.unshift(keyword)
    // 限制数量
    if (history.length > MAX_LOCAL_HISTORY) {
      history = history.slice(0, MAX_LOCAL_HISTORY)
    }
    try {
      localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(history))
    } catch (error) {
      debugError('保存本地搜索历史失败', error)
    }
  }
}

// 删除单条历史
const handleDeleteHistory = async (id: number) => {
  if (isLoggedIn.value) {
    try {
      const res = await searchApi.deleteSearchHistory(id)
      if (isSuccessfulResponse(res)) {
        invalidateHistoryRequests()
        searchHistory.value = searchHistory.value.filter(h => h.id !== id)
        await loadSearchHistory()
      } else {
        debugError('删除搜索历史失败:', getResponseMessage(res, '业务返回异常'))
      }
    } catch (error) {
      debugError('删除搜索历史失败', error)
    }
  } else {
    // 游客模式
    const item = searchHistory.value.find(h => h.id === id)
    if (item) {
      const history = loadLocalHistoryKeywords().filter(h => h !== item.keyword)
      try {
        localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(history))
      } catch (error) {
        debugError('删除本地搜索历史失败', error)
      }
      searchHistory.value = searchHistory.value.filter(h => h.id !== id)
    }
  }
}

// 清空历史
const handleClearHistory = async () => {
  if (isLoggedIn.value) {
    try {
      const res = await searchApi.clearSearchHistory()
      if (isSuccessfulResponse(res)) {
        invalidateHistoryRequests()
        searchHistory.value = []
        await loadSearchHistory()
      } else {
        debugError('清空搜索历史失败:', getResponseMessage(res, '业务返回异常'))
      }
    } catch (error) {
      debugError('清空搜索历史失败', error)
    }
  } else {
    clearLocalHistoryStorage('clear')
    searchHistory.value = []
  }
}

// 选择历史记录
const handleSelectHistory = (keyword: string) => {
  emit('select', keyword)
}

// 选择热门词
const handleSelectHot = (keyword: string) => {
  emit('select', keyword)
}

// 选择搜索建议
const handleSelectSuggestion = (keyword: string) => {
  emit('select', keyword)
}

// 键盘导航
const handleKeyDown = (e: KeyboardEvent) => {
  if (!props.visible) return
  
  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault()
      selectedIndex.value = Math.min(selectedIndex.value + 1, totalItems.value - 1)
      break
    case 'ArrowUp':
      e.preventDefault()
      selectedIndex.value = Math.max(selectedIndex.value - 1, -1)
      break
    case 'Enter':
      if (selectedIndex.value >= 0) {
        e.preventDefault()
        selectCurrentItem()
      }
      break
    case 'Escape':
      emit('close')
      break
  }
}

// 选择当前项
const selectCurrentItem = () => {
  if (hasInput.value) {
    if (selectedIndex.value >= 0 && selectedIndex.value < suggestions.value.length) {
      handleSelectSuggestion(suggestions.value[selectedIndex.value].keyword)
    }
  } else {
    if (selectedIndex.value < searchHistory.value.length) {
      handleSelectHistory(searchHistory.value[selectedIndex.value].keyword)
    } else {
      const hotIndex = selectedIndex.value - searchHistory.value.length
      if (hotIndex >= 0 && hotIndex < hotKeywords.value.length) {
        handleSelectHot(hotKeywords.value[hotIndex].keyword)
      }
    }
  }
}

// 监听关键词变化
watch(() => props.keyword, (newVal) => {
  selectedIndex.value = -1
  if (newVal.trim()) {
    loadSuggestions(newVal)
  } else {
    suggestions.value = []
  }
})

// 监听可见性变化
watch(() => props.visible, (visible) => {
  if (visible) {
    loadSearchHistory()
    loadHotKeywords()
    selectedIndex.value = -1
  }
})

// 暴露方法给父组件
defineExpose({
  saveSearchHistory
})

onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
})
</script>

<style scoped>
.search-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(155, 135, 245, 0.3);
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(155, 135, 245, 0.2);
  max-height: 400px;
  overflow-y: auto;
  z-index: 200;
}

.dropdown-section {
  padding: 12px 16px;
}

.dropdown-section + .dropdown-section {
  border-top: 1px solid rgba(200, 200, 220, 0.2);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.section-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.clear-btn {
  font-size: 12px;
  color: var(--text-muted);
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px 8px;
  border-radius: 4px;
  transition: all 0.2s;
}

.clear-btn:hover {
  color: #e74c3c;
  background: rgba(231, 76, 60, 0.1);
}

/* 搜索历史列表 */
.history-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.history-item:hover,
.history-item.selected {
  background: rgba(230, 242, 255, 0.6);
}

.history-icon {
  color: var(--text-muted);
  flex-shrink: 0;
}

.history-keyword {
  flex: 1;
  font-size: 14px;
  color: var(--text-body);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.delete-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background: none;
  border: none;
  border-radius: 50%;
  color: var(--text-muted);
  cursor: pointer;
  opacity: 0;
  transition: all 0.2s;
}

.history-item:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  background: rgba(231, 76, 60, 0.1);
  color: #e74c3c;
}

/* 热门搜索标签 */
.hot-keywords {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.hot-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: rgba(230, 242, 255, 0.5);
  border-radius: 16px;
  font-size: 13px;
  color: var(--text-body);
  cursor: pointer;
  transition: all 0.2s;
}

.hot-tag:hover,
.hot-tag.selected {
  background: rgba(158, 197, 255, 0.4);
  color: var(--text-title);
}

.hot-tag.hot {
  background: linear-gradient(135deg, rgba(255, 183, 183, 0.3), rgba(255, 150, 150, 0.2));
}

.hot-tag.hot:hover,
.hot-tag.hot.selected {
  background: linear-gradient(135deg, rgba(255, 183, 183, 0.5), rgba(255, 150, 150, 0.4));
}

.hot-rank {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  background: linear-gradient(135deg, #ff9999, #ff6666);
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  color: white;
}

/* 搜索建议列表 */
.suggestions-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.suggestion-item:hover,
.suggestion-item.selected {
  background: rgba(230, 242, 255, 0.6);
}

.suggestion-icon {
  color: var(--text-muted);
  flex-shrink: 0;
}

.suggestion-icon.category {
  color: var(--primary);
}

.suggestion-text {
  flex: 1;
  font-size: 14px;
  color: var(--text-body);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.suggestion-text :deep(em) {
  font-style: normal;
  color: var(--primary);
  font-weight: 600;
}

.suggestion-type {
  font-size: 11px;
  color: var(--text-muted);
  padding: 2px 6px;
  background: rgba(200, 200, 220, 0.2);
  border-radius: 4px;
}

/* 空状态和加载状态 */
.empty-tip,
.loading-tip {
  text-align: center;
  padding: 20px;
  font-size: 13px;
  color: var(--text-muted);
}
</style>
