<template>
  <div class="home" data-testid="home-view">
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
        <div v-if="slides.length > 0" class="carousel-container">
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
        <div v-else class="carousel-container empty-hero">
          <div class="slide-content">
            <p class="slide-sub">内容准备中</p>
            <h1 class="slide-title">本周精选正在更新</h1>
            <p class="slide-desc">展示内容会在后台配置完成后出现在这里。</p>
          </div>
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
              <span v-for="cat in visibleCategories" :key="cat.id" class="category-tag" @click="toCategory(cat)">{{ cat.name }}</span>
              <span v-if="categories.length > 8" class="category-tag more-tag" @click="categoriesExpanded = !categoriesExpanded">
                {{ categoriesExpanded ? '收起分类' : '更多分类' }}
              </span>
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
                <div
                  v-for="g in hotGames"
                  :key="g.id"
                  class="game-card glass-card"
                  data-testid="home-product-card"
                  @click="toGame(g.id)"
                >
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
      
      <section class="section promo-section" data-testid="home-coupon-section">
        <div class="container">
          <div class="section-head">
            <h2 class="text-title">限时活动</h2>
            <router-link to="/promotions" class="more">更多活动 &gt;</router-link>
          </div>
          <div class="promo-grid">
            <!-- 主活动卡片 -->
            <div class="promo-main glass-card" data-testid="home-promotions-entry" @click="$router.push('/promotions')">
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
              <div
                v-for="c in quickCoupons"
                :key="c.id"
                class="quick-coupon glass-card"
                :data-testid="`home-quick-coupon-${c.id}`"
                @click="claimQuickCoupon(c)"
              >
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
                <button
                  class="quick-claim-btn"
                  :class="{ claimed: c.claimed }"
                  :data-testid="`home-quick-coupon-claim-${c.id}`"
                  :disabled="c.claimed"
                >
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
import { ElMessage } from 'element-plus'
import Navbar from '@/components/Navbar.vue'
import Footer from '@/components/Footer.vue'
import productApi from '@/api/productApi'
import categoryApi from '@/api/categoryApi'
import couponApi from '@/api/couponApi'
import fileApi from '@/api/fileApi'
import showcaseApi, { type ShowcaseBanner } from '@/api/showcaseApi'
import { useUserStore } from '@/stores/userStore'
import { debugError } from '@/utils/debug'

const router = useRouter()
const userStore = useUserStore()
const loading = ref(true)
const hotGames = ref<any[]>([])
const newGames = ref<any[]>([])
const categories = ref<any[]>([])
const categoriesExpanded = ref(false)
const quickCoupons = ref<any[]>([])
const availableCouponsCount = ref(0)
const countdownText = ref('')
const maxDiscount = ref('50%')
let latestCouponsRequestId = 0

interface HomeHeroSlide {
  image: string
  subtitle: string
  title: string
  description: string
  buttonText: string
  link: string
}

const slides = ref<HomeHeroSlide[]>([])

const currentSlide = ref(0)
let slideInterval: ReturnType<typeof setInterval> | null = null

const nextSlide = () => {
  if (slides.value.length === 0) return
  currentSlide.value = (currentSlide.value + 1) % slides.value.length
}
const prevSlide = () => {
  if (slides.value.length === 0) return
  currentSlide.value = (currentSlide.value - 1 + slides.value.length) % slides.value.length
}
const goToSlide = (index: number) => { currentSlide.value = index }
const startAutoPlay = () => {
  stopAutoPlay()
  if (slides.value.length > 1) {
    slideInterval = setInterval(nextSlide, 5000)
  }
}
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

// 分类展开/收起
const visibleCategories = computed(() => categoriesExpanded.value ? categories.value : categories.value.slice(0, 8))

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

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === 'object') {
    const response = (error as { response?: { data?: { message?: string } } }).response
    const message = (error as { message?: string }).message
    return response?.data?.message || message || fallback
  }
  return fallback
}

const fetchCoupons = async () => {
  const requestId = ++latestCouponsRequestId
  try {
    const res: any = await couponApi.getAvailableCoupons()
    if (requestId !== latestCouponsRequestId) {
      return
    }
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
    } else {
      debugError('获取首页优惠券失败', res?.message || '首页优惠券返回异常')
    }
  } catch (e) {
    if (requestId !== latestCouponsRequestId) {
      return
    }
    debugError('获取首页优惠券失败', e)
  }
}

const refreshCouponsAfterClaimSuccess = async () => {
  try {
    await fetchCoupons()
  } catch (error) {
    debugError('首页快捷领取成功后刷新优惠券失败', error)
  }
}

const claimQuickCoupon = async (coupon: any) => {
  if (coupon.claimed) return
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }

  try {
    const res: any = await couponApi.claimCoupon(coupon.id)
    if (res?.code === 200) {
      ElMessage.success('领取成功')
      await refreshCouponsAfterClaimSuccess()
    } else {
      const message = res?.message || '领取失败'
      debugError('首页快捷领取优惠券失败', message)
      ElMessage.error(message)
    }
  } catch (e: any) {
    debugError('首页快捷领取优惠券失败', e)
    ElMessage.error(getErrorMessage(e, '领取失败'))
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
    } else {
      debugError('获取首页分类失败', res?.message || '首页分类返回异常')
    }
  } catch (e) { debugError('获取首页分类失败', e) }
}

const resolveBannerLink = (banner: ShowcaseBanner) => {
  const target = banner.linkTarget?.trim()
  if (!target) return '/promotions'
  if (banner.linkType === 'PRODUCT' && /^\d+$/.test(target)) return `/product/${target}`
  if (banner.linkType === 'PROMOTION' && /^\d+$/.test(target)) return `/promotion/${target}`
  if (banner.linkType === 'CATEGORY' && /^\d+$/.test(target)) return `/category?id=${target}`
  return target
}

const fetchHomeBanners = async () => {
  try {
    const res: any = await showcaseApi.getPublicBanners('HOME_HERO')
    if (res?.code === 200) {
      const nextSlides = (res.data || []).map((banner: ShowcaseBanner) => ({
        image: getImageUrl(banner.imagePath),
        subtitle: banner.subtitle || banner.badgeText || '精选推荐',
        title: banner.title,
        description: banner.description || '',
        buttonText: banner.buttonText || '查看详情',
        link: resolveBannerLink(banner)
      }))
      slides.value = nextSlides
      currentSlide.value = 0
      startAutoPlay()
    } else {
      debugError('获取首页展示内容失败', res?.message || '首页展示内容返回异常')
    }
  } catch (error) {
    debugError('获取首页展示内容失败', error)
  }
}

const fetchHomeProducts = async () => {
  // 获取热销商品（按销量排序）
  try {
    const hotRes: any = await productApi.getProducts({ pageNo: 0, pageSize: 8, sort: 'sales' })
    if (hotRes?.code === 200) {
      const list = hotRes.data?.content || hotRes.data?.records || hotRes.data || []
      hotGames.value = list
    } else {
      debugError('获取首页热销商品失败', hotRes?.message || '首页热销商品返回异常')
    }
  } catch (e) {
    debugError('获取首页热销商品失败', e)
  }

  // 获取新品上架（按最新排序）
  try {
    const newRes: any = await productApi.getProducts({ pageNo: 0, pageSize: 24, sort: 'newest' })
    if (newRes?.code === 200) {
      const list = newRes.data?.content || newRes.data?.records || newRes.data || []
      const hotIds = new Set(hotGames.value.map((item: any) => item.id))
      newGames.value = list.filter((item: any) => !hotIds.has(item.id)).slice(0, 10)
    } else {
      debugError('获取首页新品失败', newRes?.message || '首页新品返回异常')
    }
  } catch (e) {
    debugError('获取首页新品失败', e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  updateCountdown()
  countdownTimer = setInterval(updateCountdown, 1000)
  void fetchHomeBanners()
  void fetchCategories()
  void fetchCoupons()
  void fetchHomeProducts()
})

onUnmounted(() => { 
  stopAutoPlay()
  if (countdownTimer) clearInterval(countdownTimer)
})
</script>

<style scoped>
.home { min-height: 100vh; background: var(--gray-50); position: relative; }
.deco-layer { position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; }
.deco-bg { position: absolute; top: -10%; right: -10%; width: 70%; height: 80%; background: linear-gradient(135deg, rgba(155, 135, 245, 0.03), rgba(155, 135, 245, 0.05)); opacity: 0.8; filter: blur(80px); }
.deco-shapes { position: absolute; inset: 0; }
.shape { position: absolute; border-radius: 50%; background: rgba(155, 135, 245, 0.04); opacity: 0.6; filter: blur(60px); }
.s1 { width: 500px; height: 500px; top: 5%; left: 0%; }
.s2 { width: 400px; height: 400px; top: 45%; right: 5%; }
.s3 { width: 350px; height: 350px; bottom: 5%; left: 25%; }
.main { position: relative; z-index: 1; padding-top: 72px; }
.hero-carousel { position: relative; margin-bottom: 20px; }
.carousel-container { position: relative; width: 100%; height: 480px; overflow: hidden; border-radius: 0 0 var(--radius-lg) var(--radius-lg); }
.empty-hero { background: linear-gradient(135deg, rgba(155, 135, 245, 0.18), rgba(99, 102, 241, 0.16)); }
.carousel-track { display: flex; height: 100%; transition: transform 0.6s ease-in-out; }
.carousel-slide { min-width: 100%; height: 100%; position: relative; }
.slide-bg { position: absolute; inset: 0; background-size: cover; background-position: center; filter: brightness(0.7); }
.slide-bg::after { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, rgba(155, 135, 245, 0.3), rgba(155, 135, 245, 0.2)); }
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
.category-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid var(--gray-200); }
.category-header h3 { font-size: 18px; font-weight: 600; color: var(--text-primary); margin: 0; }
.view-all { font-size: 14px; color: var(--text-secondary); text-decoration: none; transition: color 0.3s; }
.view-all:hover { color: var(--primary); }
.category-tags { display: flex; flex-wrap: wrap; gap: 12px; }
.category-tag { padding: 12px 28px; background: var(--white); border: 1px solid var(--gray-300); border-radius: var(--radius-full); font-size: 15px; font-weight: 500; color: var(--text-secondary); cursor: pointer; transition: var(--transition); }
.category-tag:hover { background: rgba(155, 135, 245, 0.05); border-color: var(--primary); color: var(--primary); transform: translateY(-2px); box-shadow: var(--shadow-sm); }
.more-tag { text-decoration: none; font-weight: 600; letter-spacing: 2px; }
.section { padding: 40px 0; }
.section-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
.section-head h2 { font-size: 1.75rem; font-weight: 600; margin: 0; color: var(--text-primary); }
.more { color: var(--text-secondary); text-decoration: none; font-size: 14px; transition: var(--transition); }
.more:hover { color: var(--primary); }

/* 热销商品轮播 */
.hot-carousel { position: relative; display: flex; align-items: center; gap: 16px; }
.hot-track-wrapper { flex: 1; overflow: hidden; }
.hot-track { display: flex; transition: transform 0.4s ease-in-out; }
.hot-carousel .game-card { width: calc(25% - 18px); flex-shrink: 0; margin-right: 24px; }
.hot-carousel .game-card:last-child { margin-right: 0; }
.hot-arrow { width: 44px; height: 44px; border-radius: 50%; background: var(--white); border: 1px solid var(--gray-300); color: var(--text-secondary); font-size: 20px; cursor: pointer; transition: var(--transition); display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: var(--shadow-sm); }
.hot-arrow:hover:not(:disabled) { background: var(--gray-50); border-color: var(--primary); color: var(--primary); transform: scale(1.05); }
.hot-arrow:disabled { opacity: 0.4; cursor: not-allowed; }

/* Steam风格新品上架 - 左右两栏布局 */
.new-products-wrapper { display: flex; gap: 24px; }
.new-products-list { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.new-product-item { display: flex; align-items: center; gap: 16px; padding: 12px 16px; background: var(--white); border-radius: var(--radius-md); cursor: pointer; transition: var(--transition); border: 1px solid var(--gray-200); }
.new-product-item:hover, .new-product-item.active { background: rgba(155, 135, 245, 0.03); border-color: var(--primary); box-shadow: var(--shadow-sm); }
.new-product-image { width: 120px; height: 68px; border-radius: 8px; overflow: hidden; flex-shrink: 0; }
.new-product-image img { width: 100%; height: 100%; object-fit: cover; }
.new-product-info { flex: 1; display: flex; align-items: center; gap: 16px; }
.new-product-info h3 { font-size: 15px; font-weight: 500; color: var(--text-primary); margin: 0; flex: 1; }
.new-tag { padding: 4px 10px; background: var(--primary); color: white; font-size: 11px; font-weight: 600; border-radius: 4px; flex-shrink: 0; }
.new-price { font-size: 16px; font-weight: 600; color: var(--primary); flex-shrink: 0; }

/* 展开更多按钮 */
.expand-btn { width: 100%; padding: 14px; margin-top: 8px; background: var(--gray-50); border: 1px dashed var(--gray-300); border-radius: var(--radius-md); color: var(--text-secondary); font-size: 14px; cursor: pointer; transition: var(--transition); display: flex; align-items: center; justify-content: center; gap: 8px; }
.expand-btn:hover { background: rgba(155, 135, 245, 0.05); border-color: var(--primary); color: var(--primary); }
.expand-icon { font-size: 10px; transition: transform 0.3s; }
.expand-icon.rotated { transform: rotate(180deg); }

/* 右侧展开面板 */
.expand-panel { width: 360px; flex-shrink: 0; overflow: hidden; }
.expand-image { width: 100%; height: 200px; overflow: hidden; }
.expand-image img { width: 100%; height: 100%; object-fit: cover; transition: all 0.3s; }
.expand-content { padding: 20px; }
.expand-content h3 { font-size: 18px; font-weight: 600; color: var(--text-primary); margin: 0 0 12px; }
.expand-desc { font-size: 14px; color: var(--text-secondary); line-height: 1.6; margin: 0 0 16px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.expand-tags { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
.expand-tag { padding: 4px 10px; background: var(--gray-100); color: var(--text-secondary); font-size: 12px; border-radius: 4px; }
.expand-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 16px; border-top: 1px solid var(--gray-200); }
.expand-price .current { font-size: 22px; font-weight: 600; color: var(--primary); }
.expand-price .original { font-size: 14px; color: var(--text-tertiary); text-decoration: line-through; margin-left: 8px; }

/* 限时活动区域 */
.promo-section { padding-bottom: 60px; }
.promo-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }

.promo-main { position: relative; padding: 32px; display: flex; justify-content: space-between; align-items: center; overflow: hidden; cursor: pointer; min-height: 200px; }
.promo-main-bg { position: absolute; inset: 0; background: linear-gradient(135deg, rgba(155, 135, 245, 0.05) 0%, rgba(155, 135, 245, 0.08) 100%); }
.promo-main-content { position: relative; z-index: 1; }
.promo-main-content h3 { font-size: 1.75rem; font-weight: 600; color: var(--text-primary); margin: 12px 0 8px; }
.promo-main-content p { font-size: 15px; color: var(--text-secondary); margin: 0 0 16px; }
.promo-countdown { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
.countdown-label { font-size: 13px; color: var(--text-secondary); }
.countdown-time { font-size: 18px; font-weight: 600; color: var(--error); font-family: monospace; background: rgba(245, 34, 45, 0.1); padding: 4px 12px; border-radius: 6px; }
.promo-visual { position: relative; z-index: 1; text-align: center; }
.promo-visual .big-text { font-size: 3.5rem; font-weight: 700; line-height: 1; background: linear-gradient(135deg, var(--primary), var(--primary-dark)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.promo-visual .off-text { display: block; font-size: 14px; color: var(--text-secondary); margin-top: 4px; }

.coupon-quick { display: flex; flex-direction: column; gap: 12px; }
.quick-coupon { display: flex; align-items: center; gap: 16px; padding: 16px 20px; cursor: pointer; transition: all 0.3s; }
.quick-coupon:hover { transform: translateX(4px); }
.quick-coupon-value { min-width: 60px; font-size: 20px; font-weight: 700; text-align: center; }
.quick-coupon-value.type-reduce { color: var(--primary); }
.quick-coupon-value.type-discount { color: var(--warning); }
.quick-coupon-value.type-free { color: var(--success); }
.quick-coupon-info { flex: 1; }
.quick-coupon-name { display: block; font-size: 14px; font-weight: 500; color: var(--text-primary); margin-bottom: 2px; }
.quick-coupon-cond { font-size: 12px; color: var(--text-secondary); }
.quick-claim-btn { padding: 6px 16px; background: var(--primary); color: white; border: none; border-radius: var(--radius-full); font-size: 12px; font-weight: 500; cursor: pointer; transition: var(--transition); }
.quick-claim-btn:hover:not(:disabled) { background: var(--primary-dark); transform: scale(1.05); }
.quick-claim-btn.claimed { background: var(--gray-300); color: var(--text-disabled); cursor: default; }
.no-coupon { flex: 1; display: flex; align-items: center; justify-content: center; color: var(--text-secondary); }

.games-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
.game-card { cursor: pointer; overflow: hidden; }
.game-cover { position: relative; aspect-ratio: 3/4; overflow: hidden; border-radius: var(--radius-lg) var(--radius-lg) 0 0; }
.game-cover img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s; }
.game-card:hover .game-cover img { transform: scale(1.05); }
.cover-overlay { position: absolute; inset: 0; background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.3s; }
.game-card:hover .cover-overlay { opacity: 1; }
.game-body { padding: 20px; }
.game-body h3 { font-size: 15px; font-weight: 600; color: var(--text-primary); margin: 0 0 12px; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.game-meta { display: flex; justify-content: space-between; align-items: center; }
.price { font-size: 20px; font-weight: 600; color: var(--primary); }
.sales { font-size: 13px; color: var(--text-secondary); }
.games-list { display: flex; flex-direction: column; gap: 20px; }
.game-row { display: flex; align-items: center; gap: 24px; padding: 20px; cursor: pointer; }
.row-cover { width: 100px; height: 140px; object-fit: cover; border-radius: var(--radius-md); flex-shrink: 0; }
.row-info { flex: 1; min-width: 0; }
.row-info .tag { margin-bottom: 8px; }
.row-info h3 { font-size: 17px; font-weight: 600; color: var(--text-primary); margin: 0 0 8px; }
.row-info p { font-size: 14px; color: var(--text-secondary); margin: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.row-action { display: flex; flex-direction: column; align-items: flex-end; gap: 12px; }
.btn-sm { padding: 12px 24px; font-size: 14px; }
.promo-card { display: flex; justify-content: space-between; align-items: center; padding: 48px; }
.promo-badge { display: inline-block; padding: 6px 14px; background: var(--primary); color: white; font-size: 12px; font-weight: 600; border-radius: var(--radius-sm); margin-bottom: 16px; }
.promo-text h3 { font-size: 2rem; font-weight: 600; margin: 0 0 8px; color: var(--text-primary); }
.promo-text p { color: var(--text-secondary); margin: 0 0 24px; font-size: 15px; }
.promo-visual { display: flex; flex-direction: column; align-items: center; color: var(--text-secondary); font-size: 14px; font-weight: 300; }
.big-text { font-size: 4rem; font-weight: 600; line-height: 1; }
.loading-box { display: flex; justify-content: center; gap: 12px; padding: 60px; }
.loading-pulse { width: 12px; height: 12px; background: var(--primary); border-radius: 50%; animation: pulse 1.4s ease-in-out infinite; }
.loading-pulse:nth-child(2) { animation-delay: 0.2s; }
.loading-pulse:nth-child(3) { animation-delay: 0.4s; }
@keyframes pulse { 0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); } 40% { opacity: 1; transform: scale(1); } }
.empty { text-align: center; padding: 60px; color: var(--text-secondary); }
@media (max-width: 1024px) { .games-grid { grid-template-columns: repeat(3, 1fr); } .carousel-container { height: 400px; } .slide-title { font-size: 2.5rem; } .hot-carousel .game-card { width: calc(33.333% - 16px); } .new-products-wrapper { flex-direction: column; } .expand-panel { width: 100%; } .expand-image { height: 240px; } .promo-grid { grid-template-columns: 1fr; } }
@media (max-width: 768px) { .carousel-container { height: 360px; } .slide-title { font-size: 1.8rem; } .slide-desc { font-size: 15px; margin-bottom: 24px; } .slide-actions { flex-direction: column; gap: 12px; } .carousel-arrow { width: 40px; height: 40px; font-size: 24px; } .carousel-arrow.prev { left: 12px; } .carousel-arrow.next { right: 12px; } .category-tag { padding: 10px 20px; font-size: 14px; } .games-grid { grid-template-columns: repeat(2, 1fr); gap: 16px; } .hot-carousel .game-card { width: calc(50% - 12px); } .hot-arrow { width: 36px; height: 36px; font-size: 16px; } .new-product-image { width: 80px; height: 45px; } .new-product-info { flex-wrap: wrap; gap: 8px; } .new-product-info h3 { font-size: 14px; } .expand-panel { display: none; } .promo-main { flex-direction: column; text-align: center; gap: 20px; } .promo-visual .big-text { font-size: 2.5rem; } .coupon-quick { flex-direction: row; flex-wrap: wrap; } .quick-coupon { flex: 1; min-width: 140px; } }
</style>
