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
                <li :class="{ active: !selectedCategory }" @click="selectedCategory = null">全部</li>
                <li v-for="cat in categories" :key="cat.id" :class="{ active: selectedCategory === cat.id }" @click="selectedCategory = cat.id">
                  {{ cat.name }}
                </li>
              </ul>
            </div>
            <div class="filter-group">
              <h3>价格区间</h3>
              <div class="price-range">
                <input type="number" v-model="minPrice" placeholder="最低" />
                <span>-</span>
                <input type="number" v-model="maxPrice" placeholder="最高" />
              </div>
              <button class="btn btn-glass btn-sm" @click="fetchProducts">筛选</button>
            </div>
          </aside>

          <div class="content">
            <div class="sort-bar">
              <span>排序：</span>
              <button :class="{ active: sortBy === 'default' }" @click="sortBy = 'default'">综合</button>
              <button :class="{ active: sortBy === 'sales' }" @click="sortBy = 'sales'">销量</button>
              <button :class="{ active: sortBy === 'price' }" @click="sortBy = 'price'">价格</button>
            </div>

            <div class="product-grid" v-if="products.length">
              <div v-for="p in products" :key="p.id" class="product-card glass-card" @click="$router.push(`/product/${p.id}`)">
                <div class="product-img">
                  <img :src="p.mainImage" :alt="p.name" @error="imgErr" />
                  <div class="img-overlay">
                    <button class="btn btn-glass">查看详情</button>
                  </div>
                </div>
                <div class="product-info">
                  <h4>{{ p.name }}</h4>
                  <div class="product-meta">
                    <span class="price">{{ p.price }}</span>
                    <span class="sales">{{ p.sales || 0 }}人购买</span>
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="empty glass-card">暂无商品</div>

            <div class="pagination" v-if="total > pageSize">
              <el-pagination v-model:current-page="currentPage" :page-size="pageSize" :total="total" layout="prev, pager, next" @current-change="fetchProducts" />
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

const imgErr = (e: Event) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x300/f8f8fc/ccc?text=商品' }

const fetchProducts = async () => {
  try {
    const params: any = { page: currentPage.value, size: pageSize.value }
    if (selectedCategory.value) params.categoryId = selectedCategory.value
    if (minPrice.value) params.minPrice = minPrice.value
    if (maxPrice.value) params.maxPrice = maxPrice.value
    if (route.query.keyword) params.keyword = route.query.keyword
    
    const res: any = await productApi.getProducts(params)
    if (res?.code === 200) {
      const data = res.data
      products.value = data?.records || data?.content || data || []
      total.value = data?.total || data?.totalElements || products.value.length
    }
  } catch (e) { console.error(e) }
}

const fetchCategories = async () => {
  try {
    const res: any = await categoryApi.getCategories()
    if (res?.code === 200) categories.value = res.data || []
  } catch (e) { console.error(e) }
}

watch([selectedCategory, sortBy], () => { currentPage.value = 1; fetchProducts() })
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
.layout { display: grid; grid-template-columns: 240px 1fr; gap: 32px; }
.sidebar { padding: 24px; height: fit-content; position: sticky; top: 100px; }
.filter-group { margin-bottom: 28px; }
.filter-group:last-child { margin-bottom: 0; }
.filter-group h3 { font-size: 14px; font-weight: 600; color: var(--text-title); margin: 0 0 16px; text-transform: uppercase; letter-spacing: 1px; }
.cat-list { list-style: none; margin: 0; padding: 0; }
.cat-list li { padding: 12px 14px; font-size: 15px; color: var(--text-body); cursor: pointer; border-radius: var(--radius-sm); transition: all 0.3s; }
.cat-list li:hover { background: rgba(90, 143, 212, 0.1); }
.cat-list li.active { background: rgba(90, 143, 212, 0.2); color: var(--text-title); }
.price-range { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.price-range input { width: 70px; padding: 8px 10px; font-size: 13px; border: 1px solid rgba(200, 220, 255, 0.5); border-radius: var(--radius-sm); }
.price-range span { color: var(--text-muted); }
.btn-sm { padding: 8px 16px; font-size: 13px; }
.sort-bar { display: flex; align-items: center; gap: 8px; margin-bottom: 24px; }
.sort-bar span { font-size: 15px; color: var(--text-muted); }
.sort-bar button { padding: 10px 20px; background: rgba(255,255,255,0.6); border: 1px solid rgba(200,200,220,0.3); border-radius: var(--radius-md); font-size: 14px; color: var(--text-body); cursor: pointer; transition: all 0.3s; }
.sort-bar button:hover { background: rgba(255,255,255,0.9); }
.sort-bar button.active { background: var(--sakura); color: white; border-color: var(--sakura); }
.product-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
.product-card { cursor: pointer; overflow: hidden; }
.product-img { position: relative; aspect-ratio: 1; overflow: hidden; border-radius: var(--radius-lg) var(--radius-lg) 0 0; }
.product-img img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s; }
.product-card:hover .product-img img { transform: scale(1.05); }
.img-overlay { position: absolute; inset: 0; background: rgba(255,255,255,0.1); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.3s; }
.product-card:hover .img-overlay { opacity: 1; }
.product-info { padding: 18px; }
.product-info h4 { font-size: 15px; font-weight: 600; color: var(--text-title); margin: 0 0 12px; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.product-meta { display: flex; justify-content: space-between; align-items: center; }
.price { font-size: 20px; font-weight: 600; color: #5A8FD4; }
.sales { font-size: 13px; color: var(--text-muted); }
.empty { text-align: center; padding: 80px; color: var(--text-muted); }
.pagination { margin-top: 40px; display: flex; justify-content: center; }
:deep(.el-pagination button), :deep(.el-pager li) { background: rgba(255,255,255,0.6) !important; border: 1px solid rgba(200,200,220,0.3) !important; }
:deep(.el-pager li.is-active) { background: var(--sakura) !important; color: white !important; border-color: var(--sakura) !important; }
@media (max-width: 1024px) { .product-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 768px) { .layout { grid-template-columns: 1fr; } .sidebar { position: static; } .product-grid { gap: 16px; } }
</style>
