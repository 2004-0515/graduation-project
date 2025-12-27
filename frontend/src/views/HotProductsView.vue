<template>
  <div class="hot-page">
    <div class="deco-layer">
      <div class="deco-bg"></div>
      <div class="shape s1"></div>
      <div class="shape s2"></div>
    </div>
    
    <Navbar />
    
    <main class="main">
      <div class="container">
        <div class="page-header">
          <div class="header-text">
            <h1 class="text-title">热销排行榜</h1>
            <p>实时更新，发现最受欢迎的好物</p>
          </div>
          <div class="header-stats">
            <div class="stat">
              <span class="num text-gradient">{{ products.length }}</span>
              <span class="label">热销商品</span>
            </div>
            <div class="stat">
              <span class="num text-gradient">{{ totalSales }}</span>
              <span class="label">累计销量</span>
            </div>
          </div>
        </div>

        <!-- TOP3 -->
        <div class="top3" v-if="products.length >= 3">
          <div class="top-card glass-card second" @click="$router.push(`/product/${products[1]?.id}`)">
            <span class="medal silver">2</span>
            <div class="top-img"><img :src="products[1]?.mainImage" @error="imgErr" /></div>
            <h4>{{ products[1]?.name }}</h4>
            <span class="top-price">¥{{ products[1]?.price }}</span>
          </div>
          <div class="top-card glass-card first" @click="$router.push(`/product/${products[0]?.id}`)">
            <span class="crown-badge">TOP</span>
            <span class="medal gold">1</span>
            <div class="top-img"><img :src="products[0]?.mainImage" @error="imgErr" /></div>
            <h4>{{ products[0]?.name }}</h4>
            <span class="top-price">¥{{ products[0]?.price }}</span>
          </div>
          <div class="top-card glass-card third" @click="$router.push(`/product/${products[2]?.id}`)">
            <span class="medal bronze">3</span>
            <div class="top-img"><img :src="products[2]?.mainImage" @error="imgErr" /></div>
            <h4>{{ products[2]?.name }}</h4>
            <span class="top-price">¥{{ products[2]?.price }}</span>
          </div>
        </div>

        <!-- 完整榜单 -->
        <div class="rank-section glass-card">
          <div class="section-head">
            <h2 class="text-title">完整榜单</h2>
            <span class="update">更新于 {{ updateTime }}</span>
          </div>
          
          <div class="rank-list" v-if="products.length">
            <div v-for="(p, i) in products" :key="p.id" class="rank-item" @click="$router.push(`/product/${p.id}`)">
              <span :class="['rank-num', { top: i < 3 }]">{{ i + 1 }}</span>
              <img :src="p.mainImage" class="rank-img" @error="imgErr" />
              <div class="rank-info">
                <h4>{{ p.name }}</h4>
                <p>{{ p.description?.slice(0, 40) || '品质好物' }}</p>
              </div>
              <div class="rank-stats">
                <span>销量 {{ formatSales(p.sales) }}</span>
              </div>
              <span class="rank-price">¥{{ p.price }}</span>
              <button class="btn btn-glass btn-sm" @click.stop="addToCart(p)">加购</button>
            </div>
          </div>
          
          <div v-else class="empty">暂无数据</div>
        </div>
      </div>
    </main>
    
    <Footer />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import productApi from '../api/productApi'
import { useCartStore } from '../stores/cartStore'
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'

const cartStore = useCartStore()
const products = ref<any[]>([])

const totalSales = computed(() => {
  const sum = products.value.reduce((acc, p) => acc + (p.sales || 0), 0)
  return sum >= 10000 ? (sum / 10000).toFixed(1) + '万' : sum + '+'
})

const updateTime = computed(() => {
  const now = new Date()
  return `${now.getHours().toString().padStart(2, '0')}:00`
})

const formatSales = (sales: number) => {
  if (!sales) return 0
  if (sales >= 10000) return (sales / 10000).toFixed(1) + '万'
  return sales
}

const imgErr = (e: Event) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200x200/f8f8fc/ccc?text=商品' }

const addToCart = async (p: any) => {
  try { await cartStore.addItem(p.id, 1); ElMessage.success('已加入购物车') } catch { ElMessage.error('添加失败') }
}

onMounted(async () => {
  try {
    const res: any = await productApi.getProducts({ page: 1, size: 12, sort: 'sales' })
    if (res?.code === 200) products.value = res.data?.records || res.data?.content || res.data || []
  } catch (e) { console.error(e) }
})
</script>

<style scoped>
.hot-page { min-height: 100vh; background: var(--white); position: relative; }

.deco-layer { position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; }
.deco-bg { position: absolute; top: -10%; left: -10%; width: 50%; height: 60%; background: url('https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800') center/cover; opacity: 0.1; filter: blur(50px); }
.shape { position: absolute; border-radius: 50%; filter: blur(80px); animation: float 20s ease-in-out infinite; }
.s1 { width: 600px; height: 600px; top: 20%; right: -5%; background: linear-gradient(135deg, #D4E8FF, #B7D4FF); opacity: 0.15; }
.s2 { width: 500px; height: 500px; bottom: 5%; left: -5%; background: linear-gradient(135deg, #E0F0FF, #C5D8FF); opacity: 0.12; animation-delay: -10s; }

@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -30px) scale(1.05); }
  66% { transform: translate(-20px, 20px) scale(0.95); }
}

.main { position: relative; z-index: 1; padding: 100px 0 60px; }

.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 48px; }
.header-text h1 { font-size: 2.25rem; font-weight: 500; margin: 0 0 8px; }
.header-text p { font-size: 15px; color: var(--text-body); margin: 0; }
.header-stats { display: flex; gap: 40px; }
.stat { text-align: center; }
.stat .num { display: block; font-size: 2rem; font-weight: 600; }
.stat .label { font-size: 13px; color: var(--text-muted); }

/* TOP3 */
.top3 { display: grid; grid-template-columns: 1fr 1.2fr 1fr; gap: 24px; align-items: end; margin-bottom: 48px; }
.top-card { padding: 28px; text-align: center; cursor: pointer; position: relative; }
.top-card.first { padding: 36px; }
.medal { 
  width: 40px; 
  height: 40px; 
  display: flex; 
  align-items: center; 
  justify-content: center;
  margin: 0 auto 12px;
  border-radius: 50%;
  font-size: 18px;
  font-weight: 700;
  color: #fff;
}
.medal.gold { background: linear-gradient(135deg, #FFD700, #FFA500); box-shadow: 0 4px 12px rgba(255, 215, 0, 0.4); }
.medal.silver { background: linear-gradient(135deg, #C0C0C0, #A8A8A8); box-shadow: 0 4px 12px rgba(192, 192, 192, 0.4); }
.medal.bronze { background: linear-gradient(135deg, #CD7F32, #B87333); box-shadow: 0 4px 12px rgba(205, 127, 50, 0.4); }
.crown-badge { 
  position: absolute; 
  top: -8px; 
  left: 50%; 
  transform: translateX(-50%); 
  padding: 4px 12px;
  background: linear-gradient(135deg, #FFD700, #FFA500);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(255, 215, 0, 0.4);
}
.top-img { width: 140px; height: 140px; margin: 0 auto 16px; border-radius: var(--radius-lg); overflow: hidden; background: rgba(255,255,255,0.5); }
.top-card.first .top-img { width: 180px; height: 180px; }
.top-img img { width: 100%; height: 100%; object-fit: cover; }
.top-card h4 { font-size: 15px; font-weight: 600; color: var(--text-title); margin: 0 0 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.top-price { font-size: 22px; font-weight: 600; color: #5A8FD4; }

/* 榜单 */
.rank-section { padding: 32px; }
.section-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid rgba(200,200,220,0.2); }
.section-head h2 { font-size: 1.5rem; font-weight: 500; margin: 0; }
.update { font-size: 14px; color: var(--text-muted); }

.rank-list { display: flex; flex-direction: column; gap: 12px; }
.rank-item { display: flex; align-items: center; gap: 16px; padding: 16px; background: rgba(255,255,255,0.5); border-radius: var(--radius-md); cursor: pointer; transition: all 0.3s; }
.rank-item:hover { background: rgba(90, 143, 212, 0.1); transform: translateX(4px); }

.rank-num { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 500; color: var(--text-muted); background: rgba(255,255,255,0.8); border-radius: var(--radius-sm); }
.rank-num.top { background: var(--sakura); color: white; }

.rank-img { width: 64px; height: 64px; border-radius: var(--radius-md); object-fit: cover; }
.rank-info { flex: 1; min-width: 0; }
.rank-info h4 { font-size: 15px; font-weight: 600; color: var(--text-title); margin: 0 0 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.rank-info p { font-size: 13px; color: var(--text-muted); margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.rank-stats { font-size: 14px; color: var(--text-muted); min-width: 80px; }
.rank-price { font-size: 20px; font-weight: 600; color: #5A8FD4; min-width: 80px; text-align: right; }
.btn-sm { padding: 10px 20px; font-size: 13px; }

.empty { text-align: center; padding: 60px; color: var(--text-muted); }

@media (max-width: 768px) {
  .page-header { flex-direction: column; gap: 24px; text-align: center; }
  .top3 { grid-template-columns: 1fr; }
  .top-card.first { order: -1; }
  .rank-item { flex-wrap: wrap; }
  .rank-stats, .rank-price { width: 50%; }
  .rank-item .btn { width: 100%; margin-top: 12px; }
}
</style>
