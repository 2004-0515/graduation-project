<template>
  <div class="promotion-detail-page">
    <Navbar />

    <main class="main-content">
      <div class="container">
        <!-- 返回 -->
        <button class="back-btn" @click="$router.back()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          返回
        </button>

        <!-- Banner -->
        <div class="banner-card">
          <el-image :src="promotion.bannerImage" fit="cover" class="banner-img">
            <template #error>
              <div class="banner-placeholder">活动图片</div>
            </template>
          </el-image>
          <div class="banner-overlay">
            <span class="status-tag" :class="{ active: promotion.status === '进行中' }">
              {{ promotion.status }}
            </span>
          </div>
        </div>

        <!-- 活动信息 -->
        <div class="info-card">
          <h1>{{ promotion.title }}</h1>
          <div class="time-row">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            <span>{{ promotion.startTime }} - {{ promotion.endTime }}</span>
          </div>

          <div class="section">
            <h3>活动描述</h3>
            <p>{{ promotion.description }}</p>
          </div>

          <div class="section">
            <h3>活动规则</h3>
            <ul class="rules-list">
              <li v-for="(rule, i) in promotion.rules" :key="i">{{ rule }}</li>
            </ul>
          </div>
        </div>

        <!-- 活动商品 -->
        <div class="products-section">
          <h2>活动商品</h2>
          <div class="product-grid" v-if="promotion.relatedProducts.length">
            <div 
              v-for="product in promotion.relatedProducts" 
              :key="product.id"
              class="product-card"
              @click="$router.push(`/product/${product.id}`)"
            >
              <div class="product-image">
                <el-image :src="getImageUrl(product.mainImage)" fit="cover" />
                <span class="discount-tag" v-if="product.discount">{{ product.discount }}折</span>
              </div>
              <div class="product-info">
                <h4>{{ product.name }}</h4>
                <div class="price-row">
                  <span class="price">¥{{ product.price }}</span>
                  <span class="original" v-if="product.originalPrice">¥{{ product.originalPrice }}</span>
                </div>
                <div class="btn-row">
                  <button class="cart-btn" @click.stop="addToCart(product)">加入购物车</button>
                  <button class="buy-btn" @click.stop="buyNow(product)">立即购买</button>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            <p>暂无活动商品</p>
          </div>
        </div>
      </div>
    </main>

    <Footer />
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useCartStore } from '../stores/cartStore'
import { useUserStore } from '../stores/userStore'
import productApi from '../api/productApi'
import fileApi from '../api/fileApi'
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()
const userStore = useUserStore()

const getImageUrl = (path: string) => fileApi.getImageUrl(path)

const userId = computed(() => userStore.userInfo?.id || null)

const promotion = reactive({
  id: 0,
  title: '限时优惠活动',
  status: '进行中',
  startTime: '2025-01-01',
  endTime: '2025-12-31',
  bannerImage: 'https://picsum.photos/1200/400?random=1',
  description: '精选商品限时特惠，品质好物低价入手。活动期间全场商品享受折扣优惠，更有满减活动等你参与！',
  rules: [
    '活动期间全场商品享受8折优惠',
    '满1000元立减100元',
    '每位用户限购5件活动商品',
    '优惠不可与其他活动叠加使用'
  ],
  relatedProducts: [] as any[]
})

// 从真实API获取活动商品
const fetchRelatedProducts = async () => {
  try {
    const res: any = await productApi.getProducts({ page: 1, size: 8 })
    if (res?.code === 200) {
      const list = res.data?.content || res.data?.records || res.data || []
      promotion.relatedProducts = list.slice(0, 4).map((p: any) => ({
        id: p.id,
        name: p.name,
        mainImage: p.mainImage || `https://picsum.photos/300/300?random=${p.id}`,
        price: Math.floor(p.price * 0.8), // 模拟8折活动价
        originalPrice: p.price,
        discount: 8
      }))
    }
  } catch (e) {
    console.error('获取活动商品失败', e)
    // 使用默认数据
    promotion.relatedProducts = [
      { id: 1, name: '精选商品一', mainImage: 'https://picsum.photos/300/300?random=1', price: 59.9, originalPrice: 99.9, discount: 6 },
      { id: 2, name: '精选商品二', mainImage: 'https://picsum.photos/300/300?random=2', price: 39.9, originalPrice: 79.9, discount: 5 },
      { id: 3, name: '精选商品三', mainImage: 'https://picsum.photos/300/300?random=3', price: 89.9, originalPrice: 159.9, discount: 5.6 },
      { id: 4, name: '精选商品四', mainImage: 'https://picsum.photos/300/300?random=4', price: 49.9, originalPrice: 89.9, discount: 5.5 },
    ]
  }
}

const addToCart = async (product: any) => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  try {
    await cartStore.addToCart(userId.value, product.id, 1)
    ElMessage.success('已加入购物车')
  } catch (error) {
    ElMessage.error('加入购物车失败')
  }
}

const buyNow = (product: any) => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  router.push(`/checkout?productId=${product.id}&quantity=1`)
}

onMounted(() => {
  promotion.id = parseInt(route.params.id as string) || 1
  fetchRelatedProducts()
})
</script>

<style scoped>
.promotion-detail-page {
  min-height: 100vh;
  background: var(--white);
  position: relative;
}

.promotion-detail-page::before {
  content: '';
  position: fixed;
  top: 5%;
  right: -10%;
  width: 600px;
  height: 600px;
  background: linear-gradient(135deg, #D4E8FF, #B7D4FF);
  opacity: 0.15;
  filter: blur(80px);
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
  animation: floatAnim 20s ease-in-out infinite;
}

.promotion-detail-page::after {
  content: '';
  position: fixed;
  bottom: 5%;
  left: -10%;
  width: 500px;
  height: 500px;
  background: linear-gradient(135deg, #E0F0FF, #C5D8FF);
  opacity: 0.12;
  filter: blur(80px);
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
  animation: floatAnim 20s ease-in-out infinite reverse;
}

@keyframes floatAnim {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -30px) scale(1.05); }
  66% { transform: translate(-20px, 20px) scale(0.95); }
}

.main-content {
  position: relative;
  z-index: 1;
  padding: 100px 0 80px;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(200, 220, 255, 0.5);
  border-radius: var(--radius-md);
  font-size: 15px;
  color: var(--text-body);
  cursor: pointer;
  margin-bottom: 24px;
  transition: all 0.3s;
}

.back-btn:hover {
  border-color: var(--sakura);
  color: var(--sakura);
}

/* Banner */
.banner-card {
  position: relative;
  border-radius: var(--radius-lg);
  overflow: hidden;
  margin-bottom: 24px;
  box-shadow: 0 8px 32px rgba(90, 143, 212, 0.1);
}

.banner-img {
  width: 100%;
  height: 320px;
}

.banner-placeholder {
  width: 100%;
  height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(245, 250, 255, 0.5);
  color: var(--text-muted);
  font-size: 16px;
}

.banner-overlay {
  position: absolute;
  top: 16px;
  right: 16px;
}

.status-tag {
  padding: 8px 18px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-body);
}

.status-tag.active {
  background: var(--sakura);
  color: #fff;
}

/* Info Card */
.info-card {
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(200, 220, 255, 0.5);
  border-radius: var(--radius-lg);
  box-shadow: 0 8px 32px rgba(90, 143, 212, 0.08);
  padding: 36px;
  margin-bottom: 32px;
}

.info-card h1 {
  margin: 0 0 16px;
  font-size: 1.75rem;
  font-weight: 600;
  color: var(--text-title);
}

.time-row {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-muted);
  font-size: 15px;
  margin-bottom: 28px;
  padding-bottom: 24px;
  border-bottom: 1px solid rgba(200, 220, 255, 0.3);
}

.section {
  margin-bottom: 24px;
}

.section:last-child {
  margin-bottom: 0;
}

.section h3 {
  margin: 0 0 12px;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-title);
}

.section p {
  margin: 0;
  font-size: 15px;
  color: var(--text-body);
  line-height: 1.8;
}

.rules-list {
  margin: 0;
  padding-left: 20px;
}

.rules-list li {
  font-size: 15px;
  color: var(--text-body);
  line-height: 2;
}

/* Products */
.products-section {
  margin-top: 40px;
}

.products-section h2 {
  margin: 0 0 24px;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-title);
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.product-card {
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(200, 220, 255, 0.5);
  border-radius: var(--radius-lg);
  box-shadow: 0 8px 32px rgba(90, 143, 212, 0.08);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.4s;
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 48px rgba(90, 143, 212, 0.15);
  border-color: rgba(143, 180, 230, 0.6);
}

.product-image {
  position: relative;
  height: 180px;
}

.product-image .el-image {
  width: 100%;
  height: 100%;
}

.discount-tag {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 6px 14px;
  background: linear-gradient(135deg, var(--sakura), #5A8FD4);
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  border-radius: 14px;
}

.product-info {
  padding: 18px;
}

.product-info h4 {
  margin: 0 0 10px;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-title);
  line-height: 1.4;
  height: 42px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.price-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 14px;
}

.price {
  font-size: 20px;
  font-weight: 600;
  color: #5A8FD4;
}

.original {
  font-size: 14px;
  color: var(--text-muted);
  text-decoration: line-through;
}

.btn-row {
  display: flex;
  gap: 8px;
}

.cart-btn, .buy-btn {
  flex: 1;
  padding: 10px 0;
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.cart-btn {
  background: transparent;
  border: 1px solid rgba(90, 143, 212, 0.5);
  color: var(--text-body);
}

.cart-btn:hover {
  border-color: var(--sakura);
  color: var(--sakura);
}

.buy-btn {
  background: linear-gradient(135deg, var(--sakura), #5A8FD4);
  border: none;
  color: #fff;
}

.buy-btn:hover {
  box-shadow: 0 4px 16px rgba(90, 143, 212, 0.4);
}

.empty-state {
  text-align: center;
  padding: 80px;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(200, 220, 255, 0.5);
  border-radius: var(--radius-lg);
  color: var(--text-muted);
  font-size: 16px;
}

@media (max-width: 1024px) {
  .product-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .product-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .banner-img, .banner-placeholder {
    height: 200px;
  }
  
  .info-card {
    padding: 24px;
  }
}

@media (max-width: 480px) {
  .product-grid {
    grid-template-columns: 1fr;
  }
}
</style>
