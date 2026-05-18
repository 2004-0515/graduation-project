<template>
  <div class="category-page" data-testid="category-view">
    <div class="deco-layer">
      <div class="deco-bg"></div>
      <div class="shape s1"></div>
      <div class="shape s2"></div>
    </div>
    
    <Navbar />
    
    <main class="main">
      <div class="container">
        <div class="page-header">
          <h1 class="text-title">全部商品</h1>
          <p>发现更多精选好物</p>
        </div>

        <div class="layout">
          <aside class="sidebar glass-card">
            <div class="filter-group">
              <h3>商品分类</h3>
              <ul class="cat-list">
                <li :class="{ active: !selectedCategory }" data-testid="category-filter-all" @click="selectCategory(null)">
                  全部
                </li>
                <li v-for="cat in categories" :key="cat.id" 
                    :data-testid="`category-filter-${cat.id}`"
                    :class="{ active: selectedCategory === cat.id }" 
                    @click="selectCategory(cat.id)">
                  {{ cat.name }}
                </li>
              </ul>
            </div>
            <div class="filter-group">
              <h3>价格区间</h3>
              <div class="price-range">
                <input type="number" v-model.number="minPrice" placeholder="最低" data-testid="category-min-price" />
                <span>-</span>
                <input type="number" v-model.number="maxPrice" placeholder="最高" data-testid="category-max-price" />
              </div>
              <button class="btn btn-glass btn-sm" data-testid="category-apply-price" @click="applyPriceFilter">筛选</button>
              <button class="btn btn-text btn-sm" data-testid="category-clear-price" @click="clearPriceFilter" v-if="minPrice || maxPrice">清除</button>
            </div>
          </aside>

          <div class="content">
            <!-- 搜索提示 -->
            <div v-if="searchKeyword" class="search-hint" data-testid="category-search-hint">
              <span>搜索 "<em>{{ searchKeyword }}</em>" 的结果</span>
              <button class="clear-search" data-testid="category-clear-search" @click="clearSearchKeyword">清除搜索</button>
            </div>

            <div class="toolbar">
              <div class="sort-bar">
                <span>排序：</span>
                <button :class="{ active: sortBy === 'default' }" data-testid="category-sort-default" @click="changeSort('default')">综合</button>
                <button :class="{ active: sortBy === 'sales' }" data-testid="category-sort-sales" @click="changeSort('sales')">销量</button>
                <button :class="{ active: sortBy === 'price' }" data-testid="category-sort-price-asc" @click="changeSort('price')">
                  价格升序
                  <span class="sort-arrow" v-if="sortBy === 'price'">↑</span>
                </button>
                <button :class="{ active: sortBy === 'price_desc' }" data-testid="category-sort-price-desc" @click="changeSort('price_desc')">
                  价格降序
                  <span class="sort-arrow" v-if="sortBy === 'price_desc'">↓</span>
                </button>
              </div>
              <div class="result-info" data-testid="category-result-info">
                共 <em>{{ total }}</em> 件商品
              </div>
            </div>

            <div v-if="loading" class="loading-state">
              <div class="loading-spinner"></div>
              <p>加载中...</p>
            </div>

            <div class="product-grid" v-else-if="products.length" data-testid="category-product-grid">
              <div v-for="p in products" :key="p.id" class="product-card glass-card" :data-testid="`category-product-${p.id}`" @click="$router.push(`/product/${p.id}`)">
                <div class="product-img">
                  <img :src="getImageUrl(p.mainImage)" :alt="p.name" @error="imgErr" />
                  <div class="img-overlay">
                    <button class="btn btn-glass">查看详情</button>
                  </div>
                  <span class="product-tag" v-if="p.sales > 500">热销</span>
                </div>
                <div class="product-info">
                  <h4>{{ p.name }}</h4>
                  <p class="product-desc">{{ p.description || '暂无描述' }}</p>
                  <div class="product-meta">
                    <span class="price">{{ p.price }}</span>
                    <span class="sales">已售{{ p.sales || 0 }}件</span>
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="empty glass-card">
              <h3>暂无商品</h3>
              <p>换个条件试试吧</p>
            </div>

            <div class="pagination" v-if="totalPages > 1">
              <button
                class="page-btn page-nav"
                :disabled="currentPage === 1"
                @click="handlePageChange(currentPage - 1)"
              >
                <span aria-hidden="true">&lt;</span>
                <span class="sr-only">上一页</span>
              </button>
              <template
                v-for="item in paginationItems"
                :key="`page-${item}`"
              >
                <button
                  v-if="typeof item === 'number'"
                  :class="['page-btn', { active: item === currentPage }]"
                  @click="handlePageChange(item)"
                >
                  {{ item }}
                </button>
                <span v-else class="page-ellipsis" aria-hidden="true">...</span>
              </template>
              <button
                class="page-btn page-nav"
                :disabled="currentPage === totalPages"
                @click="handlePageChange(currentPage + 1)"
              >
                <span class="sr-only">下一页</span>
                <span aria-hidden="true">&gt;</span>
              </button>
              <span class="page-summary">第 {{ currentPage }} / {{ totalPages }} 页</span>
            </div>
          </div>
        </div>
      </div>
    </main>
    
    <Footer />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import productApi from '../api/productApi'
import categoryApi from '../api/categoryApi'
import fileApi from '../api/fileApi'
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'
import { debugError } from '../utils/debug'

const route = useRoute()
const router = useRouter()
const products = ref<any[]>([])
const categories = ref<any[]>([])
const selectedCategory = ref<number | null>(null)
const minPrice = ref<number | null>(null)
const maxPrice = ref<number | null>(null)
const sortBy = ref('default')
const currentPage = ref(1)
const pageSize = ref(12)
const total = ref(0)
const loading = ref(false)
let latestFetchProductsRequestId = 0
const getResponseMessage = (res: any, fallback: string) => res?.message || fallback
type PaginationItem = number | 'ellipsis-left' | 'ellipsis-right'

// 搜索关键词
const searchKeyword = computed(() => {
  return (route.query.q || route.query.keyword || '') as string
})

const syncSelectedCategoryFromRoute = () => {
  const routeCategoryId = route.query.id
  if (routeCategoryId === undefined || routeCategoryId === null || routeCategoryId === '') {
    selectedCategory.value = null
    return
  }

  const parsedCategoryId = Number(routeCategoryId)
  selectedCategory.value = Number.isFinite(parsedCategoryId) ? parsedCategoryId : null
}

const clearSearchKeyword = () => {
  router.push('/category')
}

const imgErr = (e: Event) => { 
  const img = e.target as HTMLImageElement
  img.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect fill="#f8f8fc" width="300" height="300"/><text fill="#ccc" font-family="Arial" font-size="18" x="50%" y="50%" text-anchor="middle" dy=".3em">商品图片</text></svg>')
}

const getImageUrl = (path: string) => fileApi.getImageUrl(path)
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))

const paginationItems = computed<PaginationItem[]>(() => {
  const pageCount = totalPages.value
  const page = currentPage.value
  if (pageCount <= 6) {
    return Array.from({ length: pageCount }, (_, index) => index + 1)
  }

  if (page <= 3) {
    return [1, 2, 3, 4, 'ellipsis-right', pageCount]
  }

  if (page >= pageCount - 2) {
    return [1, 'ellipsis-left', pageCount - 3, pageCount - 2, pageCount - 1, pageCount]
  }

  return [1, 'ellipsis-left', page - 1, page, page + 1, 'ellipsis-right', pageCount]
})

const fetchProducts = async () => {
  const requestId = ++latestFetchProductsRequestId
  loading.value = true
  try {
    const params: any = { 
      pageNo: currentPage.value - 1, // 后端从0开始
      pageSize: pageSize.value 
    }
    if (selectedCategory.value) params.categoryId = selectedCategory.value
    if (minPrice.value) params.minPrice = minPrice.value
    if (maxPrice.value) params.maxPrice = maxPrice.value
    if (sortBy.value !== 'default') params.sort = sortBy.value
    
    // 支持搜索
    const searchKeyword = route.query.q || route.query.keyword
    if (searchKeyword) params.keyword = searchKeyword
    
    const res: any = await productApi.getProducts(params)
    if (requestId !== latestFetchProductsRequestId) {
      return
    }
    if (res?.code === 200) {
      const data = res.data
      products.value = data?.content || []
      total.value = data?.totalElements || 0
    } else {
      debugError('获取分类商品列表失败:', getResponseMessage(res, '业务返回异常'))
    }
  } catch (e) { 
    if (requestId !== latestFetchProductsRequestId) {
      return
    }
    debugError('获取分类商品列表失败', e)
  } finally {
    if (requestId === latestFetchProductsRequestId) {
      loading.value = false
    }
  }
}

const fetchCategories = async () => {
  try {
    const res: any = await categoryApi.getCategories()
    if (res?.code === 200) {
      categories.value = res.data || []
    } else {
      debugError('获取分类列表失败:', getResponseMessage(res, '业务返回异常'))
    }
  } catch (e) { debugError('获取分类列表失败', e) }
}

const selectCategory = (id: number | null) => {
  selectedCategory.value = id
  currentPage.value = 1
  fetchProducts()
  // 滚动到内容区域顶部
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const changeSort = (sort: string) => {
  sortBy.value = sort
  currentPage.value = 1
  fetchProducts()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const applyPriceFilter = () => {
  currentPage.value = 1
  fetchProducts()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const clearPriceFilter = () => {
  minPrice.value = null
  maxPrice.value = null
  currentPage.value = 1
  fetchProducts()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const handlePageChange = (page: number) => {
  if (page < 1 || page > totalPages.value || page === currentPage.value) {
    return
  }
  currentPage.value = page
  fetchProducts()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// 监听路由查询参数变化
watch(() => route.query, () => { 
  syncSelectedCategoryFromRoute()
  currentPage.value = 1
  fetchProducts() 
}, { deep: true })

onMounted(() => {
  syncSelectedCategoryFromRoute()
  fetchCategories()
  fetchProducts()
})
</script>

<style scoped>
.category-page { min-height: 100vh; background: var(--white); position: relative; }
.deco-layer { position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; }
.deco-bg { position: absolute; top: 0; right: -10%; width: 50%; height: 60%; background: radial-gradient(circle at center, rgba(92, 170, 255, 0.18), rgba(92, 170, 255, 0) 72%); opacity: 0.95; filter: blur(50px); }
.shape { position: absolute; border-radius: 50%; filter: blur(80px); animation: float 20s ease-in-out infinite; }
.s1 { width: 600px; height: 600px; top: 10%; left: -10%; background: radial-gradient(circle, rgba(155, 135, 245, 0.15), transparent); opacity: 0.5; }
.s2 { width: 500px; height: 500px; bottom: 5%; right: -5%; background: radial-gradient(circle, rgba(155, 135, 245, 0.12), transparent); opacity: 0.5; animation-delay: -10s; }
@keyframes float { 0%, 100% { transform: translate(0, 0) scale(1); } 33% { transform: translate(30px, -30px) scale(1.05); } 66% { transform: translate(-20px, 20px) scale(0.95); } }

.main { position: relative; z-index: 1; padding: 100px 0 60px; }
.page-header { margin-bottom: 40px; }
.page-header h1 { font-size: 2.25rem; font-weight: 500; margin: 0 0 8px; color: var(--text-primary); }
.page-header p { font-size: 15px; color: var(--text-secondary); margin: 0; }

/* 搜索提示 */
.search-hint {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  margin-bottom: 16px;
  background: rgba(155, 135, 245, 0.08);
  border-radius: 10px;
  border: 1px solid rgba(155, 135, 245, 0.2);
}

.search-hint span {
  font-size: 14px;
  color: var(--text-secondary);
}

.search-hint em {
  color: var(--primary);
  font-style: normal;
  font-weight: 600;
}

.search-hint .clear-search {
  padding: 6px 14px;
  background: var(--white);
  border: 1px solid var(--primary);
  border-radius: 6px;
  font-size: 13px;
  color: var(--primary);
  cursor: pointer;
  transition: all 0.2s;
}

.search-hint .clear-search:hover {
  background: var(--primary);
  color: var(--white);
}

.layout { display: grid; grid-template-columns: 260px 1fr; gap: 32px; }

/* 侧边栏 */
.sidebar { padding: 24px; height: fit-content; position: sticky; top: 100px; max-height: calc(100vh - 120px); overflow-y: auto; }
.sidebar::-webkit-scrollbar { width: 4px; }
.sidebar::-webkit-scrollbar-track { background: transparent; }
.sidebar::-webkit-scrollbar-thumb { background: rgba(155, 135, 245, 0.2); border-radius: 2px; }
.sidebar::-webkit-scrollbar-thumb:hover { background: rgba(155, 135, 245, 0.4); }
.filter-group { margin-bottom: 28px; }
.filter-group:last-child { margin-bottom: 0; }
.filter-group h3 { font-size: 14px; font-weight: 600; color: var(--text-primary); margin: 0 0 16px; text-transform: uppercase; letter-spacing: 1px; }

.cat-list { list-style: none; margin: 0; padding: 0; }
.cat-list li { 
  padding: 12px 14px; 
  font-size: 15px; 
  color: var(--text-secondary); 
  cursor: pointer; 
  border-radius: var(--radius-sm); 
  transition: all 0.3s; 
}
.cat-list li:hover { background: rgba(155, 135, 245, 0.1); }
.cat-list li.active { background: rgba(155, 135, 245, 0.15); color: var(--primary); font-weight: 500; }

.price-range { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.price-range input { 
  width: 80px; 
  padding: 10px 12px; 
  font-size: 14px; 
  border: 1px solid var(--gray-300); 
  border-radius: var(--radius-sm); 
  background: var(--white);
}
.price-range input:focus { border-color: var(--primary); outline: none; }
.price-range span { color: var(--text-tertiary); }

.btn-sm { padding: 10px 18px; font-size: 13px; }
.btn-text { background: transparent; border: none; color: var(--text-tertiary); }
.btn-text:hover { color: var(--primary); }

/* 工具栏 */
.toolbar { 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.sort-bar { display: flex; align-items: center; gap: 8px; }
.sort-bar span { font-size: 15px; color: var(--text-tertiary); }
.sort-bar button { 
  padding: 10px 18px; 
  background: var(--white); 
  border: 1px solid var(--gray-300); 
  border-radius: var(--radius-md); 
  font-size: 14px; 
  color: var(--text-secondary); 
  cursor: pointer; 
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 4px;
}
.sort-bar button:hover { background: var(--gray-50); }
.sort-bar button.active { background: var(--primary); color: var(--white); border-color: var(--primary); }
.sort-arrow { font-size: 12px; }

.result-info { font-size: 14px; color: var(--text-tertiary); }
.result-info em { font-style: normal; color: var(--primary); font-weight: 600; }

/* 加载状态 */
.loading-state { 
  text-align: center; 
  padding: 80px 20px; 
  color: var(--text-tertiary);
}
.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(155, 135, 245, 0.2);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* 商品网格 */
.product-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }

.product-card { cursor: pointer; overflow: hidden; transition: transform 0.3s, box-shadow 0.3s; }
.product-card:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(155, 135, 245, 0.15); }

.product-img { position: relative; aspect-ratio: 1; overflow: hidden; border-radius: var(--radius-lg) var(--radius-lg) 0 0; }
.product-img img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s; }
.product-card:hover .product-img img { transform: scale(1.05); }

.img-overlay { 
  position: absolute; 
  inset: 0; 
  background: rgba(255,255,255,0.1); 
  backdrop-filter: blur(8px); 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  opacity: 0; 
  transition: opacity 0.3s; 
}
.product-card:hover .img-overlay { opacity: 1; }

.product-tag {
  position: absolute;
  top: 12px;
  left: 12px;
  padding: 4px 10px;
  background: linear-gradient(135deg, #ff6b6b, #ee5a5a);
  color: white;
  font-size: 12px;
  font-weight: 500;
  border-radius: 4px;
}

.product-info { padding: 18px; }
.product-info h4 { 
  font-size: 15px; 
  font-weight: 600; 
  color: var(--text-primary); 
  margin: 0 0 8px; 
  line-height: 1.5; 
  display: -webkit-box; 
  -webkit-line-clamp: 2; 
  -webkit-box-orient: vertical; 
  overflow: hidden; 
}
.product-desc {
  font-size: 13px;
  color: var(--text-tertiary);
  margin: 0 0 12px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.product-meta { display: flex; justify-content: space-between; align-items: center; }
.price { font-size: 20px; font-weight: 600; color: var(--primary); }
.price::before { content: '¥'; font-size: 14px; }
.sales { font-size: 13px; color: var(--text-tertiary); }

/* 空状态 */
.empty { text-align: center; padding: 80px 20px; }
.empty h3 { font-size: 18px; color: var(--text-primary); margin: 0 0 8px; }
.empty p { font-size: 14px; color: var(--text-tertiary); margin: 0; }

/* 分页 */
.pagination { margin-top: 40px; display: flex; justify-content: center; align-items: center; gap: 8px; flex-wrap: wrap; }
.page-btn {
  min-width: 42px;
  height: 42px;
  padding: 0 12px;
  border: 1px solid var(--gray-300);
  border-radius: 10px;
  background: var(--white);
  color: var(--text-secondary);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.page-btn:hover:not(:disabled) {
  border-color: var(--primary);
  color: var(--primary);
}
.page-btn.active {
  background: var(--primary);
  border-color: var(--primary);
  color: var(--white);
  font-weight: 600;
}
.page-btn:disabled {
  opacity: 0.55;
}
.page-btn.page-nav {
  font-size: 16px;
}
.page-ellipsis {
  min-width: 42px;
  height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
  font-size: 14px;
  user-select: none;
}
.page-summary {
  margin-left: 8px;
  font-size: 13px;
  color: var(--text-tertiary);
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 1024px) { 
  .product-grid { grid-template-columns: repeat(2, 1fr); } 
}
@media (max-width: 768px) { 
  .layout { grid-template-columns: 1fr; } 
  .sidebar { position: static; } 
  .product-grid { gap: 16px; }
  .sort-bar { flex-wrap: wrap; }
}
</style>
