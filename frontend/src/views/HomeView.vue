<template>
  <div class="home">
    <div class="deco-layer">
      <div class="deco-bg" :style="{ transform: `translateY(${scrollY * 0.3}px)` }"></div>
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
              <span v-for="cat in categories" :key="cat" class="category-tag" @click="toTag(cat)">{{ cat }}</span>
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
          <div class="games-grid" v-if="!loading">
            <div v-for="g in hotGames" :key="g.id" class="game-card glass-card" @click="toGame(g.id)">
              <div class="game-cover">
                <img :src="g.mainImage" :alt="g.name" @error="imgErr" />
                <div class="cover-overlay">
                  <button class="btn btn-glass">查看详情</button>
                </div>
              </div>
              <div class="game-body">
                <h3>{{ g.name }}</h3>
                <div class="game-meta">
                  <span class="price">{{ g.price }}</span>
                  <span class="sales">{{ g.sales || 0 }} 喜欢</span>
                </div>
              </div>
            </div>
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
          <div class="games-list">
            <div v-for="g in newGames" :key="g.id" class="game-row glass-card" @click="toGame(g.id)">
              <img :src="g.mainImage" class="row-cover" @error="imgErr" />
              <div class="row-info">
                <span class="tag tag-solid">新品</span>
                <h3>{{ g.name }}</h3>
                <p>{{ g.description || '品质好物，品质保证' }}</p>
              </div>
              <div class="row-action">
                <span class="price">{{ g.price }}</span>
                <button class="btn btn-primary btn-sm">立即购买</button>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <section class="section">
        <div class="container">
          <div class="promo-card glass-card">
            <div class="promo-text">
              <span class="promo-badge">限时特惠</span>
              <h3 class="text-title">新用户专享优惠</h3>
              <p>精选商品低至5折起</p>
              <router-link to="/promotions" class="btn btn-primary">立即查看</router-link>
            </div>
            <div class="promo-visual">
              <span class="big-text text-gradient">50%</span>
              <span>OFF</span>
            </div>
          </div>
        </div>
      </section>
    </main>
    
    <Footer />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import Navbar from '@/components/Navbar.vue'
import Footer from '@/components/Footer.vue'
import productApi from '@/api/productApi'

const router = useRouter()
const scrollY = ref(0)
const loading = ref(true)
const hotGames = ref<any[]>([])
const newGames = ref<any[]>([])

const slides = [
  { image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600', subtitle: '品质生活，从这里开始', title: '雅集商城，精选好物', description: '发现生活中的美好，尽在雅集购物', buttonText: '开始选购', link: '/category' },
  { image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1600', subtitle: '潮流新品上线', title: '时尚大牌，新品首发', description: '精选服饰、美妆、配饰，专属优惠', buttonText: '探索新品', link: '/category?tag=服饰' },
  { image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1600', subtitle: '限时特惠活动', title: '超值折扣，限时抢购', description: '精选商品低至5折，限时抢购中', buttonText: '立即抢购', link: '/promotions' },
  { image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1600', subtitle: '数码精品专区', title: '科技好物，品质之选', description: '发现最新数码产品，品质保证', buttonText: '查看详情', link: '/category?tag=数码' }
]

const currentSlide = ref(0)
let slideInterval: ReturnType<typeof setInterval> | null = null

const nextSlide = () => { currentSlide.value = (currentSlide.value + 1) % slides.length }
const prevSlide = () => { currentSlide.value = (currentSlide.value - 1 + slides.length) % slides.length }
const goToSlide = (index: number) => { currentSlide.value = index }
const startAutoPlay = () => { slideInterval = setInterval(nextSlide, 5000) }
const stopAutoPlay = () => { if (slideInterval) { clearInterval(slideInterval); slideInterval = null } }

const categories = ['服饰', '数码', '美妆', '家居', '食品', '运动', '母婴', '图书', '箱包', '珠宝']

const toGame = (id: number) => router.push(`/product/${id}`)
const toTag = (t: string) => router.push(`/category?tag=${t}`)
const imgErr = (e: Event) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x400/f8f8fc/ccc?text=商品' }
const onScroll = () => { scrollY.value = window.scrollY }

onMounted(async () => {
  window.addEventListener('scroll', onScroll)
  startAutoPlay()
  try {
    const res: any = await productApi.getProducts({ page: 1, size: 8 })
    if (res?.code === 200) {
      const list = res.data?.content || res.data?.records || res.data || []
      hotGames.value = list.slice(0, 4)
      newGames.value = list.slice(4, 7)
    }
  } catch (e) { console.error(e) }
  finally { loading.value = false }
})

onUnmounted(() => { window.removeEventListener('scroll', onScroll); stopAutoPlay() })
</script>

<style scoped>
.home { min-height: 100vh; background: var(--white); position: relative; }
.deco-layer { position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; }
.deco-bg { position: absolute; top: -10%; right: -10%; width: 70%; height: 80%; background: url('https://images.unsplash.com/photo-1522383225653-ed111181a951?w=1200') center/cover; opacity: 0.15; filter: blur(50px) saturate(1.2); will-change: transform; }
.deco-shapes { position: absolute; inset: 0; }
.shape { position: absolute; border-radius: 50%; background: linear-gradient(135deg, #D4E8FF, #B7D4FF); opacity: 0.12; filter: blur(80px); animation: float 20s ease-in-out infinite; }
.s1 { width: 500px; height: 500px; top: 5%; left: 0%; animation-delay: 0s; }
.s2 { width: 400px; height: 400px; top: 45%; right: 5%; background: linear-gradient(135deg, #E0F0FF, #C5D8FF); animation-delay: -7s; }
.s3 { width: 350px; height: 350px; bottom: 5%; left: 25%; animation-delay: -14s; }
@keyframes float { 0%, 100% { transform: translate(0, 0) scale(1); } 33% { transform: translate(20px, -20px) scale(1.05); } 66% { transform: translate(-15px, 15px) scale(0.95); } }
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
@media (max-width: 1024px) { .games-grid { grid-template-columns: repeat(3, 1fr); } .carousel-container { height: 400px; } .slide-title { font-size: 2.5rem; } }
@media (max-width: 768px) { .carousel-container { height: 360px; } .slide-title { font-size: 1.8rem; } .slide-desc { font-size: 15px; margin-bottom: 24px; } .slide-actions { flex-direction: column; gap: 12px; } .carousel-arrow { width: 40px; height: 40px; font-size: 24px; } .carousel-arrow.prev { left: 12px; } .carousel-arrow.next { right: 12px; } .category-tag { padding: 10px 20px; font-size: 14px; } .games-grid { grid-template-columns: repeat(2, 1fr); gap: 16px; } .game-row { flex-direction: column; align-items: stretch; } .row-cover { width: 100%; height: 180px; } .row-action { flex-direction: row; justify-content: space-between; align-items: center; width: 100%; } .promo-card { flex-direction: column; text-align: center; gap: 32px; padding: 32px; } .promo-visual { flex-direction: row; gap: 8px; } .big-text { font-size: 2.5rem; } }
</style>
