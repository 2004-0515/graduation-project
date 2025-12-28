<template>
  <div class="category-page">
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
                <li :class="{ active: !selectedCategory }" @click="selectCategory(null)">
                  全部
                </li>
                <li v-for="cat in categories" :key="cat.id" 
                    :class="{ active: selectedCategory === cat.id }" 
                    @click="selectCategory(cat.id)">
                  {{ cat.name }}
                </li>
              </ul>
            </div>
            <div class="filter-group">
              <h3>价格区间</h3>
              <div class="price-range">
                <input type="number" v-model.number="minPrice" placeholder="最低" />
                <span>-</span>
                <input type="number" v-model.number="maxPrice" placeholder="最高" />
              </div>
              <button class="btn btn-glass btn-sm" @click="applyPriceFilter">筛选</button>
              <button class="btn btn-text btn-sm" @click="clearPriceFilter" v-if="minPrice || maxPrice">清除</button>
            </div>
          </aside>

          <div class="content">
            <div class="toolbar">
              <div class="sort-bar">
                <span>排序：</span>
                <button :class="{ active: sortBy === 'default' }" @click="changeSort('default')">综合</button>
                <button :class="{ active: sortBy === 'sales' }" @click="changeSort('sales')">销量</button>
                <button :class="{ active: sortBy === 'price' }" @click="changeSort('price')">
                  价格升序
                  <span class="sort-arrow" v-if="sortBy === 'price'">↑</span>
                </button>
                <button :class="{ active: sortBy === 'price_desc' }" @click="changeSort('price_desc')">
                  价格降序
                  <span class="sort-arrow" v-if="sortBy === 'price_desc'">↓</span>
                </button>
              </div>
              <div class="result-info">
                共 <em>{{ total }}</em> 件商品
              </div>
            </div>

            <div v-if="loading" class="loading-state">
              <div class="loading-spinner"></div>
              <p>加载中...</p>
            </div>

            <div class="product-grid" v-else-if="products.length">
              <div v-for="p in products" :key="p.id" class="product-card glass-card" @click="$router.push(`/product/${p.id}`)">
                <div class="product-img">
                  <img :src="getImageUrl(p.mainImage)" :alt="p.name" @error="imgErr" />
                  <div class="img-overlay">
                    <button class="btn btn-glass">查看详情</button>
                  </div>
                  <span class="product-tag" v-if="p.sales > 100">热销</span>
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

            <div class="pagination" v-if="total > 0">
              <el-pagination 
                v-model:current-page="currentPage" 
                :page-size="pageSize" 
                :total="total" 
                :pager-count="5"
                layout="prev, pager, next" 
                @current-change="handlePageChange" 
              />
            </div>
          </div>
        </div>
      </div>
    </main>
    
    <Footer />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import productApi from '../api/productApi'
import categoryApi from '../api/categoryApi'
import fileApi from '../api/fileApi'
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'

const route = useRoute()
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

const imgErr = (e: Event) => { 
  const img = e.target as HTMLImageElement
  img.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect fill="#f8f8fc" width="300" height="300"/><text fill="#ccc" font-family="Arial" font-size="18" x="50%" y="50%" text-anchor="middle" dy=".3em">商品图片</text></svg>')
}

const getImageUrl = (path: string) => fileApi.getImageUrl(path)

const fetchProducts = async () => {
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
    if (res?.code === 200) {
      const data = res.data
      products.value = data?.content || []
      total.value = data?.totalElements || 0
    }
  } catch (e) { 
    console.error(e) 
  } finally {
    loading.value = false
  }
}

const fetchCategories = async () => {
  try {
    const res: any = await categoryApi.getCategories()
    if (res?.code === 200) categories.value = res.data || []
  } catch (e) { console.error(e) }
}

const selectCategory = (id: number | null) => {
  selectedCategory.value = id
  currentPage.value = 1
  fetchProducts()
}

const changeSort = (sort: string) => {
  sortBy.value = sort
  currentPage.value = 1
  fetchProducts()
}

const applyPriceFilter = () => {
  currentPage.value = 1
  fetchProducts()
}

const clearPriceFilter = () => {
  minPrice.value = null
  maxPrice.value = null
  currentPage.value = 1
  fetchProducts()
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  fetchProducts()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// 监听路由查询参数变化
watch(() => route.query, () => { 
  currentPage.value = 1
  fetchProducts() 
}, { deep: true })

onMounted(() => {
  if (route.query.id) selectedCategory.value = Number(route.query.id)
  fetchCategories()
  fetchProducts()
})
</script>

<style scoped>
.category-page { min-height: 100vh; background: var(--white); position: relative; }
.deco-layer { position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; }
.deco-bg { position: absolute; top: 0; right: -10%; width: 50%; height: 60%; background: url('https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800') center/cover; opacity: 0.1; filter: blur(50px); }
.shape { position: absolute; border-radius: 50%; filter: blur(80px); animation: float 20s ease-in-out infinite; }
.s1 { width: 600px; height: 600px; top: 10%; left: -10%; background: linear-gradient(135deg, #D4E8FF, #B7D4FF); opacity: 0.15; }
.s2 { width: 500px; height: 500px; bottom: 5%; right: -5%; background: linear-gradient(135deg, #E0F0FF, #C5D8FF); opacity: 0.12; animation-delay: -10s; }
@keyframes float { 0%, 100% { transform: translate(0, 0) scale(1); } 33% { transform: translate(30px, -30px) scale(1.05); } 66% { transform: translate(-20px, 20px) scale(0.95); } }

.main { position: relative; z-index: 1; padding: 100px 0 60px; }
.page-header { margin-bottom: 40px; }
.page-header h1 { font-size: 2.25rem; font-weight: 500; margin: 0 0 8px; }
.page-header p { font-size: 15px; color: var(--text-body); margin: 0; }

.layout { display: grid; grid-template-columns: 260px 1fr; gap: 32px; }

/* 侧边栏 */
.sidebar { padding: 24px; height: fit-content; position: sticky; top: 100px; }
.filter-group { margin-bottom: 28px; }
.filter-group:last-child { margin-bottom: 0; }
.filter-group h3 { font-size: 14px; font-weight: 600; color: var(--text-title); margin: 0 0 16px; text-transform: uppercase; letter-spacing: 1px; }

.cat-list { list-style: none; margin: 0; padding: 0; }
.cat-list li { 
  padding: 12px 14px; 
  font-size: 15px; 
  color: var(--text-body); 
  cursor: pointer; 
  border-radius: var(--radius-sm); 
  transition: all 0.3s; 
}
.cat-list li:hover { background: rgba(90, 143, 212, 0.1); }
.cat-list li.active { background: rgba(90, 143, 212, 0.2); color: var(--text-title); font-weight: 500; }

.price-range { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.price-range input { 
  width: 80px; 
  padding: 10px 12px; 
  font-size: 14px; 
  border: 1px solid rgba(200, 220, 255, 0.5); 
  border-radius: var(--radius-sm); 
  background: rgba(255,255,255,0.8);
}
.price-range input:focus { border-color: var(--sakura); outline: none; }
.price-range span { color: var(--text-muted); }

.btn-sm { padding: 10px 18px; font-size: 13px; }
.btn-text { background: transparent; border: none; color: var(--text-muted); }
.btn-text:hover { color: var(--sakura); }

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
.sort-bar span { font-size: 15px; color: var(--text-muted); }
.sort-bar button { 
  padding: 10px 18px; 
  background: rgba(255,255,255,0.6); 
  border: 1px solid rgba(200,200,220,0.3); 
  border-radius: var(--radius-md); 
  font-size: 14px; 
  color: var(--text-body); 
  cursor: pointer; 
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 4px;
}
.sort-bar button:hover { background: rgba(255,255,255,0.9); }
.sort-bar button.active { background: var(--sakura); color: white; border-color: var(--sakura); }
.sort-arrow { font-size: 12px; }

.result-info { font-size: 14px; color: var(--text-muted); }
.result-info em { font-style: normal; color: var(--sakura); font-weight: 600; }

/* 加载状态 */
.loading-state { 
  text-align: center; 
  padding: 80px 20px; 
  color: var(--text-muted);
}
.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(90, 143, 212, 0.2);
  border-top-color: var(--sakura);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* 商品网格 */
.product-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }

.product-card { cursor: pointer; overflow: hidden; transition: transform 0.3s, box-shadow 0.3s; }
.product-card:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(90, 143, 212, 0.15); }

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
  color: var(--text-title); 
  margin: 0 0 8px; 
  line-height: 1.5; 
  display: -webkit-box; 
  -webkit-line-clamp: 2; 
  -webkit-box-orient: vertical; 
  overflow: hidden; 
}
.product-desc {
  font-size: 13px;
  color: var(--text-muted);
  margin: 0 0 12px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.product-meta { display: flex; justify-content: space-between; align-items: center; }
.price { font-size: 20px; font-weight: 600; color: #5A8FD4; }
.price::before { content: '¥'; font-size: 14px; }
.sales { font-size: 13px; color: var(--text-muted); }

/* 空状态 */
.empty { text-align: center; padding: 80px 20px; }
.empty h3 { font-size: 18px; color: var(--text-title); margin: 0 0 8px; }
.empty p { font-size: 14px; color: var(--text-muted); margin: 0; }

/* 分页 */
.pagination { margin-top: 40px; display: flex; justify-content: center; }
:deep(.el-pagination button), :deep(.el-pager li) { 
  background: rgba(255,255,255,0.6) !important; 
  border: 1px solid rgba(200,200,220,0.3) !important; 
}
:deep(.el-pager li.is-active) { 
  background: var(--sakura) !important; 
  color: white !important; 
  border-color: var(--sakura) !important; 
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
