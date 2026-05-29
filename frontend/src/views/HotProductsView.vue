<template>
  <div class="hot-page" data-testid="hot-products-view">
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
        <div class="top3" v-if="products.length >= 3" data-testid="hot-top3">
          <div class="top-card glass-card second" data-testid="hot-top-card-2" @click="$router.push(`/product/${products[1]?.id}`)">
            <span class="medal silver">2</span>
            <div class="top-img"><img :src="getImageUrl(products[1]?.mainImage)" :alt="products[1]?.name || '热销商品'" @error="imgErr" /></div>
            <h4>{{ products[1]?.name }}</h4>
            <p class="top-sales">已售{{ formatSales(products[1]?.sales) }}件</p>
            <span class="top-price">¥{{ products[1]?.price }}</span>
          </div>
          <div class="top-card glass-card first" data-testid="hot-top-card-1" @click="$router.push(`/product/${products[0]?.id}`)">
            <span class="crown-badge">TOP</span>
            <span class="medal gold">1</span>
            <div class="top-img"><img :src="getImageUrl(products[0]?.mainImage)" :alt="products[0]?.name || '热销商品'" @error="imgErr" /></div>
            <h4>{{ products[0]?.name }}</h4>
            <p class="top-sales">已售{{ formatSales(products[0]?.sales) }}件</p>
            <span class="top-price">¥{{ products[0]?.price }}</span>
          </div>
          <div class="top-card glass-card third" data-testid="hot-top-card-3" @click="$router.push(`/product/${products[2]?.id}`)">
            <span class="medal bronze">3</span>
            <div class="top-img"><img :src="getImageUrl(products[2]?.mainImage)" :alt="products[2]?.name || '热销商品'" @error="imgErr" /></div>
            <h4>{{ products[2]?.name }}</h4>
            <p class="top-sales">已售{{ formatSales(products[2]?.sales) }}件</p>
            <span class="top-price">¥{{ products[2]?.price }}</span>
          </div>
        </div>

        <!-- 完整榜单 -->
        <div class="rank-section glass-card">
          <div class="section-head">
            <h2 class="text-title">完整榜单</h2>
            <span class="update">更新于 {{ updateTime }}</span>
          </div>
          
          <div class="rank-list" v-if="products.length" data-testid="hot-rank-list">
            <div v-for="(p, i) in products" :key="p.id" class="rank-item" :data-testid="`hot-rank-item-${p.id}`" @click="$router.push(`/product/${p.id}`)">
              <span :class="['rank-num', `rank-num-${i + 1}`, { top: i < 3 }]">{{ i + 1 }}</span>
              <img :src="getImageUrl(p.mainImage)" :alt="p.name || '热销商品'" class="rank-img" @error="imgErr" />
              <div class="rank-info">
                <h4>{{ p.name }}</h4>
                <p>{{ p.description?.slice(0, 40) || '品质好物' }}</p>
              </div>
              <div class="rank-stats">
                <span>已售 {{ formatSales(p.sales) }}件</span>
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
import fileApi from '../api/fileApi'
import { useCartStore } from '../stores/cartStore'
import { useUserStore } from '../stores/userStore'
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'
import { debugError } from '../utils/debug'

const cartStore = useCartStore()
const userStore = useUserStore()
const products = ref<any[]>([])
const getResponseMessage = (res: any, fallback: string) => res?.message || fallback
const getErrorMessage = (error: any, fallback: string) => error?.response?.data?.message || error?.message || fallback

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

const getImageUrl = (path: string) => fileApi.getImageUrl(path)

const imgErr = (e: Event) => { 
  const img = e.target as HTMLImageElement
  img.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect fill="#f8f8fc" width="200" height="200"/><text fill="#ccc" font-family="Arial" font-size="16" x="50%" y="50%" text-anchor="middle" dy=".3em">商品图片</text></svg>')
}

const addToCart = async (p: any) => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    return
  }
  try { 
    await cartStore.addToCart(userStore.userInfo?.id, p.id, 1)
  } catch (error: any) { 
    debugError('热销商品加购失败', error)
    ElMessage.error(getErrorMessage(error, '添加失败')) 
  }
}

onMounted(async () => {
  try {
    const res: any = await productApi.getProducts({ pageNo: 0, pageSize: 20, sort: 'sales' })
    if (res?.code === 200) {
      const list = res.data?.content || res.data?.records || res.data || []
      // 按销量降序排序
      products.value = list.sort((a: any, b: any) => (b.sales || 0) - (a.sales || 0))
    } else {
      debugError('获取热销排行榜失败:', getResponseMessage(res, '业务返回异常'))
    }
  } catch (e) { debugError('获取热销排行榜失败', e) }
})
</script>

<style scoped>
.hot-page { min-height: 100vh; background: var(--white); position: relative; }

.deco-layer { position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; }
.deco-bg { position: absolute; top: -10%; left: -10%; width: 50%; height: 60%; background: radial-gradient(circle at center, rgba(255, 176, 77, 0.22), rgba(255, 176, 77, 0) 72%); opacity: 0.95; filter: blur(50px); }
.shape { position: absolute; border-radius: 50%; filter: blur(80px); animation: float 20s ease-in-out infinite; }
.s1 { width: 600px; height: 600px; top: 20%; right: -5%; background: radial-gradient(circle, rgba(155, 135, 245, 0.15), transparent); opacity: 0.15; }
.s2 { width: 500px; height: 500px; bottom: 5%; left: -5%; background: radial-gradient(circle, rgba(155, 135, 245, 0.12), transparent); opacity: 0.12; animation-delay: -10s; }

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
.top-img { width: 140px; height: 140px; margin: 0 auto 16px; border-radius: var(--radius-lg); overflow: hidden; background: #f7f5f1; border: 1px solid rgba(213, 205, 190, 0.72); }
.top-card.first .top-img { width: 180px; height: 180px; }
.top-img img { width: 100%; height: 100%; object-fit: contain; display: block; }
.top-card h4 { font-size: 15px; font-weight: 600; color: var(--text-title); margin: 0 0 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.top-sales { font-size: 13px; color: var(--text-muted); margin: 0 0 8px; }
.top-price { font-size: 22px; font-weight: 600; color: var(--primary); }

/* 榜单 */
.rank-section { padding: 32px; }
.section-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid rgba(200,200,220,0.2); }
.section-head h2 { font-size: 1.5rem; font-weight: 500; margin: 0; }
.update { font-size: 14px; color: var(--text-muted); }

.rank-list { display: flex; flex-direction: column; gap: 12px; }
.rank-item { display: flex; align-items: center; gap: 16px; padding: 16px; background: rgba(255,255,255,0.72); border: 1px solid rgba(155, 135, 245, 0.08); border-radius: var(--radius-md); cursor: pointer; transition: all 0.3s; }
.rank-item:hover { background: rgba(155, 135, 245, 0.1); transform: translateX(4px); }

.rank-num {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 700;
  color: #4f566b;
  background: linear-gradient(180deg, #ffffff 0%, #f3f4f8 100%);
  border: 1px solid rgba(79, 86, 107, 0.12);
  border-radius: 10px;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.75);
}
.rank-num.top { color: #fff; border-color: transparent; text-shadow: 0 1px 2px rgba(0,0,0,0.18); }
.rank-num-1 { background: linear-gradient(135deg, #ffcc3e 0%, #ff9f1c 100%); }
.rank-num-2 { background: linear-gradient(135deg, #c7d2e3 0%, #8f9bb3 100%); }
.rank-num-3 { background: linear-gradient(135deg, #d99058 0%, #b96a33 100%); }

.rank-img { width: 64px; height: 64px; border-radius: var(--radius-md); object-fit: contain; background: #f7f5f1; border: 1px solid rgba(213, 205, 190, 0.72); }
.rank-info { flex: 1; min-width: 0; }
.rank-info h4 { font-size: 15px; font-weight: 600; color: var(--text-title); margin: 0 0 4px; line-height: 1.4; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.rank-info p { font-size: 13px; color: var(--text-body); margin: 0; line-height: 1.4; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.rank-stats { font-size: 14px; color: var(--text-body); min-width: 88px; }
.rank-price { font-size: 20px; font-weight: 600; color: var(--primary); min-width: 80px; text-align: right; }
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
