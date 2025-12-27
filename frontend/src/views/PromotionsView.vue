<template>
  <div class="promo-page">
    <div class="deco-layer">
      <div class="deco-bg"></div>
      <div class="shape s1"></div>
      <div class="shape s2"></div>
    </div>
    
    <Navbar />
    
    <main class="main">
      <div class="container">
        <div class="hero glass-card">
          <div class="hero-content">
            <span class="hero-tag">限时特惠</span>
            <h1 class="text-title">春季焕新季</h1>
            <p>精选好物低至5折，品质生活从这里开始</p>
            <div class="countdown" v-if="countdown.days > 0 || countdown.hours > 0">
              <span class="countdown-label">距离结束</span>
              <div class="countdown-timer">
                <span class="time-block">{{ countdown.days }}<em>天</em></span>
                <span class="time-block">{{ countdown.hours }}<em>时</em></span>
                <span class="time-block">{{ countdown.minutes }}<em>分</em></span>
                <span class="time-block">{{ countdown.seconds }}<em>秒</em></span>
              </div>
            </div>
          </div>
        </div>

        <section class="section">
          <div class="section-head">
            <h2 class="text-title">优惠券中心</h2>
            <span class="sub">领券立减</span>
          </div>
          <div class="coupon-grid">
            <div v-for="c in coupons" :key="c.id" class="coupon-card glass-card" :class="{ claimed: c.claimed }">
              <div class="coupon-left">
                <span class="coupon-value">{{ c.value }}</span>
                <span class="coupon-cond">满{{ c.minAmount }}可用</span>
              </div>
              <div class="coupon-right">
                <h4>{{ c.name }}</h4>
                <p>{{ c.validTime }}</p>
                <button class="btn btn-primary btn-sm" @click="claimCoupon(c)" :disabled="c.claimed">
                  {{ c.claimed ? '已领取' : '立即领取' }}
                </button>
              </div>
            </div>
          </div>
        </section>

        <section class="section">
          <div class="section-head">
            <h2 class="text-title">精选活动</h2>
            <span class="sub">限时特惠</span>
          </div>
          <div class="promo-grid">
            <div v-for="p in promotions" :key="p.id" class="promo-card glass-card" @click="$router.push(`/promotion/${p.id}`)">
              <div class="promo-img">
                <img :src="p.image" @error="imgErr" />
                <span class="status-tag" :class="p.statusClass">{{ p.status }}</span>
                <span class="discount-tag" v-if="p.discount">{{ p.discount }}</span>
              </div>
              <div class="promo-info">
                <h3>{{ p.title }}</h3>
                <p>{{ p.description }}</p>
                <div class="promo-meta">
                  <span>{{ p.startTime }} - {{ p.endTime }}</span>
                  <span>{{ p.joinCount }}人参与</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="section">
          <div class="section-head">
            <h2 class="text-title">限时秒杀</h2>
            <span class="flash-timer">距本场结束 <em>{{ flashCountdown }}</em></span>
          </div>
          <div class="flash-grid">
            <div v-for="item in flashItems" :key="item.id" class="flash-card glass-card" @click="$router.push(`/product/${item.id}`)">
              <div class="flash-img">
                <img :src="item.image" @error="imgErr" />
                <span class="flash-tag">秒杀</span>
              </div>
              <div class="flash-info">
                <h4>{{ item.name }}</h4>
                <div class="flash-price">
                  <span class="current">{{ item.flashPrice }}</span>
                  <span class="original">{{ item.originalPrice }}</span>
                </div>
                <div class="progress-bar">
                  <div class="progress" :style="{ width: item.progress + '%' }"></div>
                </div>
                <span class="progress-text">已抢{{ item.progress }}%</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
    
    <Footer />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'

const countdown = reactive({ days: 5, hours: 12, minutes: 30, seconds: 0 })
const flashCountdown = ref('01:58:32')

const imgErr = (e: Event) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x200/f8f8fc/ccc?text=活动' }

const coupons = ref([
  { id: 1, name: '新人专享券', value: 20, minAmount: 100, validTime: '2025.01.01-2025.01.31', claimed: false },
  { id: 2, name: '满减优惠券', value: 50, minAmount: 300, validTime: '2025.01.01-2025.01.31', claimed: false },
  { id: 3, name: '品类专属券', value: 30, minAmount: 200, validTime: '2025.01.01-2025.01.31', claimed: true },
  { id: 4, name: '会员专享券', value: 100, minAmount: 500, validTime: '2025.01.01-2025.01.31', claimed: false },
])

const promotions = ref([
  { id: 1, title: '新年特惠季', description: '全场商品低至5折起', image: 'https://picsum.photos/600/300?random=10', status: '进行中', statusClass: 'active', discount: '5折起', startTime: '01.01', endTime: '01.31', joinCount: 12580 },
  { id: 2, title: '会员专享日', description: '会员专属折扣，积分翻倍', image: 'https://picsum.photos/600/300?random=11', status: '进行中', statusClass: 'active', discount: '8折', startTime: '01.15', endTime: '01.20', joinCount: 8920 },
  { id: 3, title: '品牌特卖', description: '精选品牌限时特惠', image: 'https://picsum.photos/600/300?random=12', status: '即将开始', statusClass: 'upcoming', discount: '3折起', startTime: '01.25', endTime: '01.28', joinCount: 0 },
  { id: 4, title: '清仓大促', description: '库存清仓，超低价格', image: 'https://picsum.photos/600/300?random=13', status: '进行中', statusClass: 'active', discount: '2折起', startTime: '01.01', endTime: '02.28', joinCount: 25600 },
])

const flashItems = ref([
  { id: 1, name: '无线蓝牙耳机', image: 'https://picsum.photos/200/200?random=20', flashPrice: 89, originalPrice: 299, progress: 78 },
  { id: 2, name: '智能手表', image: 'https://picsum.photos/200/200?random=21', flashPrice: 199, originalPrice: 599, progress: 45 },
  { id: 3, name: '便携充电宝', image: 'https://picsum.photos/200/200?random=22', flashPrice: 49, originalPrice: 129, progress: 92 },
  { id: 4, name: '机械键盘', image: 'https://picsum.photos/200/200?random=23', flashPrice: 159, originalPrice: 399, progress: 33 },
])

const claimCoupon = (c: any) => { if (c.claimed) return; c.claimed = true; ElMessage.success('领取成功') }

let timer: number
onMounted(() => {
  timer = window.setInterval(() => {
    if (countdown.seconds > 0) countdown.seconds--
    else if (countdown.minutes > 0) { countdown.minutes--; countdown.seconds = 59 }
    else if (countdown.hours > 0) { countdown.hours--; countdown.minutes = 59; countdown.seconds = 59 }
    else if (countdown.days > 0) { countdown.days--; countdown.hours = 23; countdown.minutes = 59; countdown.seconds = 59 }
  }, 1000)
})
onUnmounted(() => clearInterval(timer))
</script>

<style scoped>
.promo-page { min-height: 100vh; background: var(--white); position: relative; }
.deco-layer { position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; }
.deco-bg { position: absolute; top: 0; left: 0; width: 60%; height: 50%; background: url('https://images.unsplash.com/photo-1607082350899-7e105aa886ae?w=800') center/cover; opacity: 0.1; filter: blur(60px) saturate(1.2); }
.shape { position: absolute; border-radius: 50%; filter: blur(80px); animation: float 20s ease-in-out infinite; }
.s1 { width: 600px; height: 600px; top: 25%; right: -5%; background: linear-gradient(135deg, #D4E8FF, #B7D4FF); opacity: 0.15; animation-delay: 0s; }
.s2 { width: 500px; height: 500px; bottom: 5%; left: -5%; background: linear-gradient(135deg, #E0F0FF, #C5D8FF); opacity: 0.12; animation-delay: -10s; }
@keyframes float { 0%, 100% { transform: translate(0, 0) scale(1); } 33% { transform: translate(30px, -30px) scale(1.05); } 66% { transform: translate(-20px, 20px) scale(0.95); } }
.main { position: relative; z-index: 1; padding: 100px 0 60px; }
.hero { padding: 48px; margin-bottom: 48px; text-align: center; }
.hero-tag { display: inline-block; padding: 8px 20px; background: var(--sakura); color: #fff; border-radius: 20px; font-size: 15px; font-weight: 500; margin-bottom: 16px; }
.hero h1 { font-size: 2.75rem; font-weight: 600; margin: 0 0 12px; }
.hero p { font-size: 18px; color: var(--text-body); margin: 0 0 24px; }
.countdown { display: inline-flex; flex-direction: column; gap: 8px; }
.countdown-label { font-size: 15px; color: var(--text-muted); }
.countdown-timer { display: flex; gap: 8px; }
.time-block { background: var(--sakura); color: #fff; padding: 10px 14px; border-radius: var(--radius-sm); font-size: 20px; font-weight: 600; }
.time-block em { font-style: normal; font-size: 14px; margin-left: 2px; }
.section { margin-bottom: 48px; }
.section-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.section-head h2 { font-size: 1.75rem; font-weight: 600; margin: 0; }
.sub { font-size: 15px; color: var(--text-muted); }
.coupon-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.coupon-card { display: flex; overflow: hidden; }
.coupon-card.claimed { opacity: 0.6; }
.coupon-left { width: 110px; background: var(--sakura); color: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 16px; }
.coupon-value { font-size: 32px; font-weight: 600; }
.coupon-cond { font-size: 13px; opacity: 0.9; }
.coupon-right { flex: 1; padding: 16px; display: flex; flex-direction: column; }
.coupon-right h4 { margin: 0 0 4px; font-size: 16px; font-weight: 600; color: var(--text-title); }
.coupon-right p { margin: 0 0 12px; font-size: 13px; color: var(--text-muted); flex: 1; }
.btn-sm { padding: 8px 18px; font-size: 14px; }
.promo-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; }
.promo-card { overflow: hidden; cursor: pointer; }
.promo-img { position: relative; height: 180px; }
.promo-img img { width: 100%; height: 100%; object-fit: cover; }
.status-tag { position: absolute; top: 12px; left: 12px; padding: 6px 14px; border-radius: 12px; font-size: 14px; font-weight: 500; }
.status-tag.active { background: var(--sakura); color: #fff; }
.status-tag.upcoming { background: var(--sky-light); color: var(--text-title); }
.discount-tag { position: absolute; top: 12px; right: 12px; padding: 6px 12px; background: rgba(255,255,255,0.9); color: var(--sakura); border-radius: 4px; font-size: 14px; font-weight: 600; }
.promo-info { padding: 20px; }
.promo-info h3 { margin: 0 0 8px; font-size: 20px; font-weight: 600; color: var(--text-title); }
.promo-info p { margin: 0 0 12px; font-size: 16px; color: var(--text-body); }
.promo-meta { display: flex; justify-content: space-between; font-size: 15px; color: var(--text-muted); }
.flash-timer { font-size: 15px; color: var(--text-muted); }
.flash-timer em { padding: 6px 14px; background: var(--sakura); color: #fff; border-radius: var(--radius-sm); font-style: normal; font-weight: 600; margin-left: 8px; }
.flash-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.flash-card { overflow: hidden; cursor: pointer; }
.flash-img { position: relative; height: 160px; }
.flash-img img { width: 100%; height: 100%; object-fit: cover; }
.flash-tag { position: absolute; top: 8px; left: 8px; padding: 4px 10px; background: var(--sakura); color: #fff; font-size: 13px; font-weight: 500; border-radius: 4px; }
.flash-info { padding: 14px; }
.flash-info h4 { margin: 0 0 8px; font-size: 15px; font-weight: 600; color: var(--text-title); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.flash-price { display: flex; align-items: baseline; gap: 8px; margin-bottom: 8px; }
.flash-price .current { font-size: 20px; font-weight: 600; color: #5A8FD4; }
.flash-price .original { font-size: 14px; color: var(--text-muted); text-decoration: line-through; }
.progress-bar { height: 6px; background: rgba(90, 143, 212, 0.2); border-radius: 3px; overflow: hidden; margin-bottom: 4px; }
.progress { height: 100%; background: var(--sakura); border-radius: 3px; }
.progress-text { font-size: 13px; color: var(--text-muted); }
@media (max-width: 1024px) { .coupon-grid, .flash-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 768px) { .promo-grid, .coupon-grid { grid-template-columns: 1fr; } .hero h1 { font-size: 1.75rem; } }
</style>
