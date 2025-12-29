<template>
  <div class="home">
    <div class="deco-layer">
      <div class="deco-bg"></div>
      <div class="deco-shapes">
        <div class="shape s1"></div>
        <div class="shape s2"></div>
        <div class="shape s3"></div>
      </div>
    </div>
    
    <Navbar />
    
    <main class="main">
      <section class="hero-carousel">
        <div class="carousel-container">
          <div class="carousel-track" :style="{ transform: `translateX(-${currentSlide * 100}%)` }">
            <div v-for="(slide, index) in slides" :key="index" class="carousel-slide">
              <div class="slide-bg" :style="{ backgroundImage: `url(${slide.image})` }"></div>
              <div class="slide-content">
                <p class="slide-sub">{{ slide.subtitle }}</p>
                <h1 class="slide-title">{{ slide.title }}</h1>
                <p class="slide-desc">{{ slide.description }}</p>
                <div class="slide-actions">
                  <router-link :to="slide.link" class="btn btn-primary">{{ slide.buttonText }}</router-link>
                  <router-link to="/hot" class="btn btn-glass">热销排行</router-link>
                </div>
              </div>
            </div>
          </div>
          <div class="carousel-dots">
            <button v-for="(_, index) in slides" :key="index" :class="['dot', { active: currentSlide === index }]" @click="goToSlide(index)"></button>
          </div>
          <button class="carousel-arrow prev" @click="prevSlide"><span>&lt;</span></button>
          <button class="carousel-arrow next" @click="nextSlide"><span>&gt;</span></button>
        </div>
      </section>
      
      <section class="category-section">
        <div class="container">
          <div class="category-card glass-card">
            <div class="category-header">
              <h3>商品分类</h3>
              <router-link to="/category" class="view-all">全部分类 &gt;</router-link>
            </div>
            <div class="category-tags">
              <span v-for="cat in categories" :key="cat.id" class="category-tag" @click="toCategory(cat)">{{ cat.name }}</span>
              <router-link to="/category" class="category-tag more-tag">...</router-link>
            </div>
          </div>
        </div>
      </section>
      
      <section class="section">
        <div class="container">
          <div class="section-head">
            <h2 class="text-title">热销商品</h2>
            <router-link to="/hot" class="more">查看全部 &gt;</router-link>
          </div>
          <div class="hot-carousel" v-if="!loading">
            <button class="hot-arrow prev" @click="prevHot" :disabled="hotIndex === 0"><span>&lt;</span></button>
            <div class="hot-track-wrapper">
              <div class="hot-track" :style="{ transform: `translateX(-${hotIndex * 25}%)` }">
                <div v-for="g in hotGames" :key="g.id" class="game-card glass-card" @click="toGame(g.id)">
                  <div class="game-cover">
                    <img :src="getImageUrl(g.mainImage)" :alt="g.name" @error="imgErr" />
                    <div class="cover-overlay">
                      <button class="btn btn-glass">查看详情</button>
                    </div>
                  </div>
                  <div class="game-body">
                    <h3>{{ g.name }}</h3>
                    <div class="game-meta">
                      <span class="price">¥{{ g.price }}</span>
                      <span class="sales">已售{{ g.sales || 0 }}件</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <button class="hot-arrow next" @click="nextHot" :disabled="hotIndex >= maxHotIndex"><span>&gt;</span></button>
          </div>
          <div v-if="loading" class="loading-box">
            <span class="loading-pulse"></span>
            <span class="loading-pulse"></span>
            <span class="loading-pulse"></span>
          </div>
          <div v-if="!loading && !hotGames.length" class="empty">暂无数据</div>
        </div>
      </section>
      
      <section class="section">
        <div class="container">
          <div class="section-head">
            <h2 class="text-title">新品上架</h2>
            <router-link to="/category?new=1" class="more">查看全部 &gt;</router-link>
          </div>
          <div class="new-products-wrapper">
            <div class="new-products-list">
              <div v-for="(g, index) in visibleNewGames" :key="g.id" 
                   :class="['new-product-item', { active: hoveredNewIndex === index }]" 
                   @mouseenter="hoveredNewIndex = index"
                   @click="toGame(g.id)">
                <div class="new-product-image">
                  <img :src="getImageUrl(g.mainImage)" :alt="g.name" @error="imgErr" />
                </div>
                <div class="new-product-info">
                  <span class="new-tag">新品</span>
                  <h3>{{ g.name }}</h3>
                  <span class="new-price">¥{{ g.price }}</span>
                </div>
              </div>
              <!-- 展开/收起按钮 -->
              <button v-if="newGames.length > 4" class="expand-btn" @click="newExpanded = !newExpanded">
                <span>{{ newExpanded ? '收起' : `展开更多 (${newGames.length - 4})` }}</span>
                <span class="expand-icon" :class="{ rotated: newExpanded }">▼</span>
              </button>
            </div>
            <!-- 右侧展开面板 -->
            <div class="expand-panel glass-card" v-if="visibleNewGames.length > 0">
              <div class="expand-image">
                <img :src="getImageUrl(visibleNewGames[hoveredNewIndex]?.mainImage)" :alt="visibleNewGames[hoveredNewIndex]?.name" @error="imgErr" />
              </div>
              <div class="expand-content">
                <h3>{{ visibleNewGames[hoveredNewIndex]?.name }}</h3>
                <p class="expand-desc">{{ visibleNewGames[hoveredNewIndex]?.description || '品质好物，品质保证。精选优质商品，为您的生活增添美好。' }}</p>
                <div class="expand-tags">
                  <span class="expand-tag">品质保证</span>
                  <span class="expand-tag">正品保障</span>
                  <span class="expand-tag">极速发货</span>
                </div>
                <div class="expand-footer">
                  <div class="expand-price">
                    <span class="current">¥{{ visibleNewGames[hoveredNewIndex]?.price }}</span>
                    <span class="original" v-if="visibleNewGames[hoveredNewIndex]?.originalPrice">¥{{ visibleNewGames[hoveredNewIndex]?.originalPrice }}</span>
                  </div>
                  <button class="btn btn-primary btn-sm" @click.stop="toGame(visibleNewGames[hoveredNewIndex]?.id)">立即购买</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <section class="section promo-section">
        <div class="container">
          <div class="section-head">
            <h2 class="text-title">限时活动</h2>
            <router-link to="/promotions" class="more">更多活动 &gt;</router-link>
          </div>
          <div class="promo-grid">
            <!-- 主活动卡片 -->
            <div class="promo-main glass-card" @click="$router.push('/promotions')">
              <div class="promo-main-bg"></div>
              <div class="promo-main-content">
                <span class="promo-badge">限时特惠</span>
                <h3>领券中心</h3>
                <p>{{ availableCouponsCount }} 张优惠券待领取</p>
                <div class="promo-countdown" v-if="countdownText">
                  <span class="countdown-label">距活动结束</span>
                  <span class="countdown-time">{{ countdownText }}</span>
                </div>
                <button class="btn btn-primary">立即领取</button>
              </div>
              <div class="promo-visual">
                <span class="big-text text-gradient">{{ maxDiscount }}</span>
                <span class="off-text">优惠</span>
              </div>
            </div>
            
            <!-- 优惠券快捷领取 -->
            <div class="coupon-quick">
              <div v-for="c in quickCoupons" :key="c.id" class="quick-coupon glass-card" @click="claimQuickCoupon(c)">
                <div class="quick-coupon-value" :class="getCouponClass(c.type)">
                  <template v-if="c.type === 2">{{ (c.discountRate * 10).toFixed(0) }}折</template>
                  <template v-else>¥{{ c.discountAmount }}</template>
                </div>
                <div class="quick-coupon-info">
                  <span class="quick-coupon-name">{{ c.name }}</span>
                  <span class="quick-coupon-cond">
                    <template v-if="c.minAmount > 0">满{{ c.minAmount }}可用</template>
                    <template v-else>无门槛</template>
                  </span>
                </div>
                <button class="quick-claim-btn" :class="{ claimed: c.claimed }" :disabled="c.claimed">
                  {{ c.claimed ? '已领' : '领取' }}
                </button>
              </div>
              <div v-if="quickCoupons.length === 0" class="no-coupon">
                <p>暂无可领优惠券</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
    
    <Footer />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import Navbar from '@/components/Navbar.vue'
import Footer from '@/components/Footer.vue'
import productApi from '@/api/productApi'
import categoryApi from '@/api/categoryApi'
import couponApi from '@/api/couponApi'
import fileApi from '@/api/fileApi'

const router = useRouter()
const loading = ref(true)
const hotGames = ref<any[]>([])
const newGames = ref<any[]>([])
const categories = ref<any[]>([])
const quickCoupons = ref<any[]>([])
const availableCouponsCount = ref(0)
const countdownText = ref('')
const maxDiscount = ref('50%')

const slides = [
  { image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600', subtitle: '品质生活，从这里开始', title: '雅集商城，精选好物', description: '发现生活中的美好，尽在雅集购物', buttonText: '开始选购', link: '/category' },
  { image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1600', subtitle: '潮流新品上线', title: '时尚大牌，新品首发', description: '精选服饰、美妆、配饰，专属优惠', buttonText: '探索新品', link: '/category' },
  { image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1600', subtitle: '限时特惠活动', title: '超值折扣，限时抢购', description: '精选商品低至5折，限时抢购中', buttonText: '立即抢购', link: '/promotions' },
  { image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1600', subtitle: '数码精品专区', title: '科技好物，品质之选', description: '发现最新数码产品，品质保证', buttonText: '查看详情', link: '/category' }
]

const currentSlide = ref(0)
let slideInterval: ReturnType<typeof setInterval> | null = null

const nextSlide = () => { currentSlide.value = (currentSlide.value + 1) % slides.length }
const prevSlide = () => { currentSlide.value = (currentSlide.value - 1 + slides.length) % slides.length }
const goToSlide = (index: number) => { currentSlide.value = index }
const startAutoPlay = () => { slideInterval = setInterval(nextSlide, 5000) }
const stopAutoPlay = () => { if (slideInterval) { clearInterval(slideInterval); slideInterval = null } }

// 热销商品轮播
const hotIndex = ref(0)
const maxHotIndex = computed(() => Math.max(0, hotGames.value.length - 4))
const nextHot = () => { if (hotIndex.value < maxHotIndex.value) hotIndex.value++ }
const prevHot = () => { if (hotIndex.value > 0) hotIndex.value-- }

// 新品上架悬停
const hoveredNewIndex = ref(0)
const newExpanded = ref(false)
const visibleNewGames = computed(() => newExpanded.value ? newGames.value : newGames.value.slice(0, 4))

const toGame = (id: number) => router.push(`/product/${id}`)
const toCategory = (cat: any) => router.push(`/category?id=${cat.id}`)
const getImageUrl = (path: string) => fileApi.getImageUrl(path)
const imgErr = (e: Event) => { 
  const img = e.target as HTMLImageElement
  img.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400"><rect fill="#f8f8fc" width="300" height="400"/><text fill="#ccc" font-family="Arial" font-size="20" x="50%" y="50%" text-anchor="middle" dy=".3em">商品图片</text></svg>')
}

// 优惠券相关
const getCouponClass = (type: number) => {
  const classes: Record<number, string> = { 1: 'type-reduce', 2: 'type-discount', 3: 'type-free' }
  return classes[type] || 'type-reduce'
}

const fetchCoupons = async () => {
  try {
    const res: any = await couponApi.getAvailableCoupons()
    if (res?.code === 200) {
      const coupons = res.data || []
      availableCouponsCount.value = coupons.length
      quickCoupons.value = coupons.slice(0, 3)
      
      // 计算最大优惠
      if (coupons.length > 0) {
        const maxAmount = Math.max(...coupons.map((c: any) => c.discountAmount || 0))
        const minRate = Math.min(...coupons.filter((c: any) => c.type === 2).map((c: any) => c.discountRate || 1))
        if (minRate < 1) {
          maxDiscount.value = `${(minRate * 10).toFixed(0)}折`
        } else if (maxAmount > 0) {
          maxDiscount.value = `¥${maxAmount}`
        }
      }
    }
  } catch (e) { console.error(e) }
}

const claimQuickCoupon = async (coupon: any) => {
  if (coupon.claimed) return
  try {
    const res: any = await couponApi.claimCoupon(coupon.id)
    if (res?.code === 200) {
      coupon.claimed = true
      import('element-plus').then(({ ElMessage }) => ElMessage.success('领取成功'))
    }
  } catch (e: any) {
    import('element-plus').then(({ ElMessage }) => ElMessage.error(e?.response?.data?.message || '领取失败'))
  }
}

// 倒计时
const updateCountdown = () => {
  const now = new Date()
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
  const diff = endOfDay.getTime() - now.getTime()
  
  if (diff > 0) {
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)
    countdownText.value = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
}

let countdownTimer: ReturnType<typeof setInterval> | null = null

const fetchCategories = async () => {
  try {
    const res: any = await categoryApi.getCategories()
    if (res?.code === 200) {
      categories.value = res.data || []
    }
  } catch (e) { console.error(e) }
}

onMounted(async () => {
  startAutoPlay()
  updateCountdown()
  countdownTimer = setInterval(updateCountdown, 1000)
  
  // 获取分类
  fetchCategories()
  
  // 获取优惠券
  fetchCoupons()
  
  // 获取热销商品（按销量排序）
  try {
    const hotRes: any = await productApi.getProducts({ page: 0, size: 8, sort: 'sales' })
    if (hotRes?.code === 200) {
      const list = hotRes.data?.content || hotRes.data?.records || hotRes.data || []
      hotGames.value = list
    }
  } catch (e) { console.error('获取热销商品失败:', e) }
  
  // 获取新品上架（按最新排序）
  try {
    const newRes: any = await productApi.getProducts({ page: 0, size: 10, sort: 'newest' })
    if (newRes?.code === 200) {
      const list = newRes.data?.content || newRes.data?.records || newRes.data || []
      newGames.value = list
    }
  } catch (e) { console.error('获取新品失败:', e) }
  
  loading.value = false
})

onUnmounted(() => { 
  stopAutoPlay()
  if (countdownTimer) clearInterval(countdownTimer)
})
</script>

<style scoped>
.home { min-height: 100vh; background: var(--white); position: relative; }
.deco-layer { position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; }
.deco-bg { position: absolute; top: -10%; right: -10%; width: 70%; height: 80%; background: linear-gradient(135deg, #E8F4FF 0%, #D4E8FF 100%); opacity: 0.5; filter: blur(60px); }
.deco-shapes { position: absolute; inset: 0; }
.shape { position: absolute; border-radius: 50%; background: linear-gradient(135deg, #D4E8FF, #B7D4FF); opacity: 0.15; filter: blur(60px); }
.s1 { width: 500px; height: 500px; top: 5%; left: 0%; }
.s2 { width: 400px; height: 400px; top: 45%; right: 5%; background: linear-gradient(135deg, #E0F0FF, #C5D8FF); }
.s3 { width: 350px; height: 350px; bottom: 5%; left: 25%; }
.main { position: relative; z-index: 1; padding-top: 72px; }
.hero-carousel { position: relative; margin-bottom: 20px; }
.carousel-container { position: relative; width: 100%; height: 480px; overflow: hidden; border-radius: 0 0 var(--radius-lg) var(--radius-lg); }
.carousel-track { display: flex; height: 100%; transition: transform 0.6s ease-in-out; }
.carousel-slide { min-width: 100%; height: 100%; position: relative; }
.slide-bg { position: absolute; inset: 0; background-size: cover; background-position: center; filter: brightness(0.7); }
.slide-bg::after { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, rgba(200, 220, 255, 0.4), rgba(183, 212, 255, 0.3)); }
.slide-content { position: relative; z-index: 2; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 40px; color: white; }
.slide-sub { font-size: 14px; font-weight: 500; letter-spacing: 4px; margin-bottom: 16px; text-transform: uppercase; text-shadow: 0 2px 8px rgba(0,0,0,0.3); }
.slide-title { font-size: 3rem; font-weight: 600; line-height: 1.3; margin-bottom: 16px; text-shadow: 0 4px 16px rgba(0,0,0,0.3); }
.slide-desc { font-size: 17px; margin-bottom: 32px; text-shadow: 0 2px 8px rgba(0,0,0,0.3); }
.slide-actions { display: flex; gap: 16px; }
.slide-actions .btn-glass { background: rgba(255, 255, 255, 0.25); border-color: rgba(255, 255, 255, 0.4); color: white; }
.slide-actions .btn-glass:hover { background: rgba(255, 255, 255, 0.35); }
.carousel-dots { position: absolute; bottom: 24px; left: 50%; transform: translateX(-50%); display: flex; gap: 10px; z-index: 10; }
.dot { width: 10px; height: 10px; border-radius: 50%; background: rgba(255, 255, 255, 0.5); border: none; cursor: pointer; transition: all 0.3s; }
.dot:hover { background: rgba(255, 255, 255, 0.8); }
.dot.active { width: 28px; border-radius: 5px; background: white; }
.carousel-arrow { position: absolute; top: 50%; transform: translateY(-50%); width: 48px; height: 48px; border-radius: 50%; background: rgba(255, 255, 255, 0.2); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.3); color: white; font-size: 28px; cursor: pointer; transition: all 0.3s; display: flex; align-items: center; justify-content: center; z-index: 10; }
.carousel-arrow:hover { background: rgba(255, 255, 255, 0.35); transform: translateY(-50%) scale(1.05); }
.carousel-arrow.prev { left: 24px; }
.carousel-arrow.next { right: 24px; }
.category-section { padding: 40px 0 20px; }
.category-card { padding: 28px 32px; }
.category-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid rgba(183, 212, 255, 0.25); }
.category-header h3 { font-size: 18px; font-weight: 600; color: var(--text-title); margin: 0; }
.view-all { font-size: 14px; color: var(--text-muted); text-decoration: none; transition: color 0.3s; }
.view-all:hover { color: #5A8FD4; }
.category-tags { display: flex; flex-wrap: wrap; gap: 12px; }
.category-tag { padding: 12px 28px; background: rgba(245, 250, 255, 0.7); border: 2px solid rgba(183, 212, 255, 0.4); border-radius: 24px; font-size: 15px; font-weight: 500; color: var(--text-title); cursor: pointer; transition: all 0.3s; }
.category-tag:hover { background: rgba(183, 212, 255, 0.25); border-color: var(--sakura); color: #5A8FD4; transform: translateY(-2px); box-shadow: 0 6px 20px rgba(90, 143, 212, 0.25); }
.more-tag { text-decoration: none; font-weight: 600; letter-spacing: 2px; }
.section { padding: 40px 0; }
.section-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
.section-head h2 { font-size: 1.75rem; font-weight: 500; margin: 0; }
.more { color: var(--text-muted); text-decoration: none; font-size: 14px; transition: color 0.3s; }
.more:hover { color: var(--sakura); }

/* 热销商品轮播 */
.hot-carousel { position: relative; display: flex; align-items: center; gap: 16px; }
.hot-track-wrapper { flex: 1; overflow: hidden; }
.hot-track { display: flex; transition: transform 0.4s ease-in-out; }
.hot-carousel .game-card { width: calc(25% - 18px); flex-shrink: 0; margin-right: 24px; }
.hot-carousel .game-card:last-child { margin-right: 0; }
.hot-arrow { width: 44px; height: 44px; border-radius: 50%; background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(10px); border: 2px solid rgba(183, 212, 255, 0.4); color: var(--text-body); font-size: 20px; cursor: pointer; transition: all 0.3s; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.hot-arrow:hover:not(:disabled) { background: rgba(183, 212, 255, 0.3); border-color: var(--sakura); color: #5A8FD4; transform: scale(1.05); }
.hot-arrow:disabled { opacity: 0.4; cursor: not-allowed; }

/* Steam风格新品上架 - 左右两栏布局 */
.new-products-wrapper { display: flex; gap: 24px; }
.new-products-list { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.new-product-item { display: flex; align-items: center; gap: 16px; padding: 12px 16px; background: rgba(255, 255, 255, 0.6); border-radius: var(--radius-md); cursor: pointer; transition: all 0.3s; border: 2px solid transparent; }
.new-product-item:hover, .new-product-item.active { background: rgba(183, 212, 255, 0.2); border-color: rgba(183, 212, 255, 0.5); }
.new-product-image { width: 120px; height: 68px; border-radius: 8px; overflow: hidden; flex-shrink: 0; }
.new-product-image img { width: 100%; height: 100%; object-fit: cover; }
.new-product-info { flex: 1; display: flex; align-items: center; gap: 16px; }
.new-product-info h3 { font-size: 15px; font-weight: 500; color: var(--text-title); margin: 0; flex: 1; }
.new-tag { padding: 4px 10px; background: linear-gradient(135deg, #5A8FD4, #7BA3D9); color: white; font-size: 11px; font-weight: 500; border-radius: 4px; flex-shrink: 0; }
.new-price { font-size: 16px; font-weight: 600; color: #5A8FD4; flex-shrink: 0; }

/* 展开更多按钮 */
.expand-btn { width: 100%; padding: 14px; margin-top: 8px; background: rgba(183, 212, 255, 0.15); border: 2px dashed rgba(183, 212, 255, 0.4); border-radius: var(--radius-md); color: var(--text-muted); font-size: 14px; cursor: pointer; transition: all 0.3s; display: flex; align-items: center; justify-content: center; gap: 8px; }
.expand-btn:hover { background: rgba(183, 212, 255, 0.25); border-color: rgba(183, 212, 255, 0.6); color: #5A8FD4; }
.expand-icon { font-size: 10px; transition: transform 0.3s; }
.expand-icon.rotated { transform: rotate(180deg); }

/* 右侧展开面板 */
.expand-panel { width: 360px; flex-shrink: 0; overflow: hidden; }
.expand-image { width: 100%; height: 200px; overflow: hidden; }
.expand-image img { width: 100%; height: 100%; object-fit: cover; transition: all 0.3s; }
.expand-content { padding: 20px; }
.expand-content h3 { font-size: 18px; font-weight: 600; color: var(--text-title); margin: 0 0 12px; }
.expand-desc { font-size: 14px; color: var(--text-body); line-height: 1.6; margin: 0 0 16px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.expand-tags { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
.expand-tag { padding: 4px 10px; background: rgba(183, 212, 255, 0.2); color: var(--text-muted); font-size: 12px; border-radius: 4px; }
.expand-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 16px; border-top: 1px solid rgba(183, 212, 255, 0.3); }
.expand-price .current { font-size: 22px; font-weight: 600; color: #5A8FD4; }
.expand-price .original { font-size: 14px; color: var(--text-muted); text-decoration: line-through; margin-left: 8px; }

/* 限时活动区域 */
.promo-section { padding-bottom: 60px; }
.promo-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }

.promo-main { position: relative; padding: 32px; display: flex; justify-content: space-between; align-items: center; overflow: hidden; cursor: pointer; min-height: 200px; }
.promo-main-bg { position: absolute; inset: 0; background: linear-gradient(135deg, rgba(90, 143, 212, 0.1) 0%, rgba(183, 212, 255, 0.2) 100%); }
.promo-main-content { position: relative; z-index: 1; }
.promo-main-content h3 { font-size: 1.75rem; font-weight: 600; color: var(--text-title); margin: 12px 0 8px; }
.promo-main-content p { font-size: 15px; color: var(--text-body); margin: 0 0 16px; }
.promo-countdown { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
.countdown-label { font-size: 13px; color: var(--text-muted); }
.countdown-time { font-size: 18px; font-weight: 600; color: #e74c3c; font-family: monospace; background: rgba(231, 76, 60, 0.1); padding: 4px 12px; border-radius: 6px; }
.promo-visual { position: relative; z-index: 1; text-align: center; }
.promo-visual .big-text { font-size: 3.5rem; font-weight: 700; line-height: 1; }
.promo-visual .off-text { display: block; font-size: 14px; color: var(--text-muted); margin-top: 4px; }

.coupon-quick { display: flex; flex-direction: column; gap: 12px; }
.quick-coupon { display: flex; align-items: center; gap: 16px; padding: 16px 20px; cursor: pointer; transition: all 0.3s; }
.quick-coupon:hover { transform: translateX(4px); }
.quick-coupon-value { min-width: 60px; font-size: 20px; font-weight: 700; text-align: center; }
.quick-coupon-value.type-reduce { color: #5A8FD4; }
.quick-coupon-value.type-discount { color: #f5a623; }
.quick-coupon-value.type-free { color: #52c41a; }
.quick-coupon-info { flex: 1; }
.quick-coupon-name { display: block; font-size: 14px; font-weight: 500; color: var(--text-title); margin-bottom: 2px; }
.quick-coupon-cond { font-size: 12px; color: var(--text-muted); }
.quick-claim-btn { padding: 6px 16px; background: linear-gradient(135deg, #5A8FD4, #7BA3D9); color: #fff; border: none; border-radius: 16px; font-size: 12px; cursor: pointer; transition: all 0.3s; }
.quick-claim-btn:hover:not(:disabled) { transform: scale(1.05); }
.quick-claim-btn.claimed { background: #e0e0e0; color: #999; cursor: default; }
.no-coupon { flex: 1; display: flex; align-items: center; justify-content: center; color: var(--text-muted); }

.games-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
.game-card { cursor: pointer; overflow: hidden; }
.game-cover { position: relative; aspect-ratio: 3/4; overflow: hidden; border-radius: var(--radius-lg) var(--radius-lg) 0 0; }
.game-cover img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s; }
.game-card:hover .game-cover img { transform: scale(1.05); }
.cover-overlay { position: absolute; inset: 0; background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.3s; }
.game-card:hover .cover-overlay { opacity: 1; }
.game-body { padding: 20px; }
.game-body h3 { font-size: 15px; font-weight: 600; color: var(--text-title); margin: 0 0 12px; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.game-meta { display: flex; justify-content: space-between; align-items: center; }
.price { font-size: 20px; font-weight: 600; color: #5A8FD4; }
.sales { font-size: 13px; color: var(--text-muted); }
.games-list { display: flex; flex-direction: column; gap: 20px; }
.game-row { display: flex; align-items: center; gap: 24px; padding: 20px; cursor: pointer; }
.row-cover { width: 100px; height: 140px; object-fit: cover; border-radius: var(--radius-md); flex-shrink: 0; }
.row-info { flex: 1; min-width: 0; }
.row-info .tag { margin-bottom: 8px; }
.row-info h3 { font-size: 17px; font-weight: 600; color: var(--text-title); margin: 0 0 8px; }
.row-info p { font-size: 14px; color: var(--text-muted); margin: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.row-action { display: flex; flex-direction: column; align-items: flex-end; gap: 12px; }
.btn-sm { padding: 12px 24px; font-size: 14px; }
.promo-card { display: flex; justify-content: space-between; align-items: center; padding: 48px; }
.promo-badge { display: inline-block; padding: 6px 14px; background: var(--sakura); color: white; font-size: 12px; font-weight: 500; border-radius: var(--radius-sm); margin-bottom: 16px; }
.promo-text h3 { font-size: 2rem; font-weight: 500; margin: 0 0 8px; }
.promo-text p { color: var(--text-muted); margin: 0 0 24px; font-size: 15px; }
.promo-visual { display: flex; flex-direction: column; align-items: center; color: var(--text-muted); font-size: 14px; font-weight: 300; }
.big-text { font-size: 4rem; font-weight: 600; line-height: 1; }
.loading-box { display: flex; justify-content: center; gap: 12px; padding: 60px; }
.empty { text-align: center; padding: 60px; color: var(--text-muted); }
@media (max-width: 1024px) { .games-grid { grid-template-columns: repeat(3, 1fr); } .carousel-container { height: 400px; } .slide-title { font-size: 2.5rem; } .hot-carousel .game-card { width: calc(33.333% - 16px); } .new-products-wrapper { flex-direction: column; } .expand-panel { width: 100%; } .expand-image { height: 240px; } .promo-grid { grid-template-columns: 1fr; } }
@media (max-width: 768px) { .carousel-container { height: 360px; } .slide-title { font-size: 1.8rem; } .slide-desc { font-size: 15px; margin-bottom: 24px; } .slide-actions { flex-direction: column; gap: 12px; } .carousel-arrow { width: 40px; height: 40px; font-size: 24px; } .carousel-arrow.prev { left: 12px; } .carousel-arrow.next { right: 12px; } .category-tag { padding: 10px 20px; font-size: 14px; } .games-grid { grid-template-columns: repeat(2, 1fr); gap: 16px; } .hot-carousel .game-card { width: calc(50% - 12px); } .hot-arrow { width: 36px; height: 36px; font-size: 16px; } .new-product-image { width: 80px; height: 45px; } .new-product-info { flex-wrap: wrap; gap: 8px; } .new-product-info h3 { font-size: 14px; } .expand-panel { display: none; } .promo-main { flex-direction: column; text-align: center; gap: 20px; } .promo-visual .big-text { font-size: 2.5rem; } .coupon-quick { flex-direction: row; flex-wrap: wrap; } .quick-coupon { flex: 1; min-width: 140px; } }
</style>
