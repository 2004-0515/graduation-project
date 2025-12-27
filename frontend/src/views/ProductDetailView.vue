<template>
  <div class="detail-page">
    <div class="deco-layer">
      <div class="shape s1"></div>
      <div class="shape s2"></div>
    </div>
    
    <Navbar />
    
    <main class="main">
      <div class="container">
        <div class="product-layout">
          <!-- 图片区 -->
          <div class="gallery glass-card">
            <div class="main-img">
              <img :src="currentImage" :alt="product.name" @error="imgErr" />
            </div>
            <div class="thumb-list" v-if="product.images?.length > 1">
              <div v-for="(img, i) in product.images" :key="i" :class="['thumb', { active: currentImage === img }]" @click="currentImage = img">
                <img :src="img" @error="imgErr" />
              </div>
            </div>
          </div>

          <!-- 信息区 -->
          <div class="info-panel">
            <h1 class="text-title">{{ product.name }}</h1>
            <p class="desc">{{ product.description }}</p>
            
            <div class="price-box glass-card">
              <span class="price">¥{{ product.price }}</span>
              <span class="original" v-if="product.originalPrice">¥{{ product.originalPrice }}</span>
              <span class="sales">已售 {{ product.sales || 0 }}</span>
            </div>

            <div class="info-row">
              <span class="label">库存</span>
              <span class="value">{{ product.stock }} 件</span>
            </div>

            <div class="info-row">
              <span class="label">数量</span>
              <div class="qty-control">
                <button @click="quantity > 1 && quantity--">-</button>
                <input type="number" v-model.number="quantity" min="1" :max="product.stock" />
                <button @click="quantity < product.stock && quantity++">+</button>
              </div>
            </div>

            <div class="action-row">
              <button class="btn btn-glass" @click="addToCart">加入购物车</button>
              <button class="btn btn-primary" @click="buyNow">立即购买</button>
            </div>

            <div class="service-row">
              <span>正品保障</span>
              <span>7天无理由</span>
              <span>极速发货</span>
            </div>
          </div>
        </div>

        <!-- 详情 -->
        <div class="detail-section glass-card">
          <div class="tabs">
            <button :class="{ active: tab === 'detail' }" @click="tab = 'detail'">商品详情</button>
            <button :class="{ active: tab === 'spec' }" @click="tab = 'spec'">规格参数</button>
            <button :class="{ active: tab === 'review' }" @click="tab = 'review'">用户评价</button>
          </div>
          <div class="tab-content">
            <div v-if="tab === 'detail'" class="detail-content">
              <h3>{{ product.name }}</h3>
              <p>{{ product.description || '优质商品，品质保证' }}</p>
            </div>
            <div v-else-if="tab === 'spec'" class="spec-content">
              <table>
                <tr><td>商品名称</td><td>{{ product.name }}</td></tr>
                <tr><td>商品编号</td><td>{{ product.id }}</td></tr>
                <tr><td>库存</td><td>{{ product.stock }} 件</td></tr>
              </table>
            </div>
            <div v-else class="review-content">
              <div class="review-item" v-for="i in 3" :key="i">
                <div class="review-head">
                  <span>用户***{{ i }}</span>
                  <span>2025-01-{{ 10 + i }}</span>
                </div>
                <p>商品质量很好，物流也很快，非常满意！</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
    
    <Footer />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import productApi from '../api/productApi'
import { useCartStore } from '../stores/cartStore'
import { useUserStore } from '../stores/userStore'
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()
const userStore = useUserStore()

const product = ref<any>({})
const quantity = ref(1)
const tab = ref('detail')
const currentImage = ref('')

const userId = computed(() => userStore.userInfo?.id)

const imgErr = (e: Event) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x400/f8f8fc/ccc?text=商品' }

const fetchProduct = async () => {
  try {
    const res: any = await productApi.getProductById(Number(route.params.id))
    if (res?.code === 200) {
      product.value = res.data
      currentImage.value = product.value.mainImage
      if (!product.value.images) product.value.images = [product.value.mainImage]
    }
  } catch { ElMessage.error('获取商品信息失败') }
}

const addToCart = async () => {
  if (!userStore.isLoggedIn) { ElMessage.warning('请先登录'); router.push('/login'); return }
  try { await cartStore.addToCart(userId.value, product.value.id, quantity.value) } catch { ElMessage.error('加入购物车失败') }
}

const buyNow = () => {
  if (!userStore.isLoggedIn) { ElMessage.warning('请先登录'); router.push('/login'); return }
  router.push(`/checkout?productId=${product.value.id}&quantity=${quantity.value}`)
}

onMounted(() => fetchProduct())
</script>

<style scoped>
.detail-page { min-height: 100vh; background: var(--white); position: relative; }

.deco-layer { position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; }
.shape { position: absolute; border-radius: 50%; filter: blur(80px); animation: float 20s ease-in-out infinite; }
.s1 { width: 600px; height: 600px; top: 5%; right: -10%; background: linear-gradient(135deg, #D4E8FF, #B7D4FF); opacity: 0.15; }
.s2 { width: 500px; height: 500px; bottom: 5%; left: -10%; background: linear-gradient(135deg, #E0F0FF, #C5D8FF); opacity: 0.12; animation-delay: -10s; }

@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -30px) scale(1.05); }
  66% { transform: translate(-20px, 20px) scale(0.95); }
}

.main { position: relative; z-index: 1; padding: 100px 0 60px; }

.product-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; margin-bottom: 48px; }

/* Gallery */
.gallery { padding: 24px; }
.main-img { aspect-ratio: 1; border-radius: var(--radius-lg); overflow: hidden; margin-bottom: 16px; background: rgba(255,255,255,0.5); }
.main-img img { width: 100%; height: 100%; object-fit: contain; }
.thumb-list { display: flex; gap: 12px; }
.thumb { width: 72px; height: 72px; border-radius: var(--radius-sm); overflow: hidden; cursor: pointer; border: 2px solid transparent; transition: all 0.3s; }
.thumb:hover, .thumb.active { border-color: var(--sakura); }
.thumb img { width: 100%; height: 100%; object-fit: cover; }

/* Info */
.info-panel h1 { font-size: 2rem; font-weight: 500; margin: 0 0 12px; }
.desc { font-size: 15px; color: var(--text-body); margin: 0 0 24px; line-height: 1.7; }

.price-box { display: flex; align-items: baseline; gap: 12px; padding: 20px; margin-bottom: 24px; }
.price { font-size: 32px; font-weight: 600; color: #5A8FD4; }
.original { font-size: 17px; color: var(--text-muted); text-decoration: line-through; }
.sales { margin-left: auto; font-size: 14px; color: var(--text-muted); }

.info-row { display: flex; align-items: center; padding: 16px 0; border-bottom: 1px solid rgba(200,200,220,0.2); }
.label { width: 80px; font-size: 15px; color: var(--text-muted); }
.value { font-size: 15px; color: var(--text-body); }

.qty-control { display: flex; align-items: center; }
.qty-control button { width: 32px; height: 32px; border: 1px solid rgba(200,200,220,0.3); background: rgba(255,255,255,0.6); cursor: pointer; }
.qty-control button:first-child { border-radius: var(--radius-sm) 0 0 var(--radius-sm); }
.qty-control button:last-child { border-radius: 0 var(--radius-sm) var(--radius-sm) 0; }
.qty-control button:hover { border-color: var(--sakura); color: var(--sakura); }
.qty-control input { width: 60px; height: 32px; border: 1px solid rgba(200,200,220,0.3); border-left: none; border-right: none; text-align: center; font-size: 14px; background: rgba(255,255,255,0.6); }

.action-row { display: flex; gap: 16px; margin-top: 32px; }
.action-row .btn { flex: 1; padding: 14px 0; }

.service-row { display: flex; gap: 20px; margin-top: 24px; padding-top: 24px; border-top: 1px solid rgba(200,200,220,0.2); font-size: 13px; color: var(--text-muted); }

/* Detail Section */
.detail-section { overflow: hidden; }
.tabs { display: flex; border-bottom: 1px solid rgba(200,200,220,0.2); }
.tabs button { padding: 16px 32px; background: none; border: none; font-size: 14px; color: var(--text-muted); cursor: pointer; position: relative; }
.tabs button.active { color: var(--text-title); }
.tabs button.active::after { content: ''; position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); width: 40px; height: 2px; background: var(--sakura); }
.tab-content { padding: 32px; min-height: 200px; }
.detail-content h3 { font-size: 18px; font-weight: 500; color: var(--text-title); margin: 0 0 12px; }
.detail-content p { font-size: 14px; color: var(--text-body); line-height: 1.8; margin: 0; }
.spec-content table { width: 100%; border-collapse: collapse; }
.spec-content tr { border-bottom: 1px solid rgba(200,200,220,0.15); }
.spec-content td { padding: 12px 16px; font-size: 14px; }
.spec-content td:first-child { width: 120px; color: var(--text-muted); background: rgba(255,255,255,0.3); }
.review-item { padding: 16px 0; border-bottom: 1px solid rgba(200,200,220,0.15); }
.review-head { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; color: var(--text-muted); }
.review-item p { margin: 0; font-size: 14px; color: var(--text-body); }

@media (max-width: 768px) {
  .product-layout { grid-template-columns: 1fr; gap: 24px; }
  .action-row { flex-direction: column; }
}
</style>
