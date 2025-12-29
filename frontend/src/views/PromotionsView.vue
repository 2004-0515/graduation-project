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
            <h1 class="text-title">优惠券中心</h1>
            <p>领券享优惠，精选好物等你来</p>
          </div>
        </div>

        <section class="section">
          <div class="section-head">
            <h2 class="text-title">可领取优惠券</h2>
            <span class="sub">领券立减</span>
          </div>
          
          <div v-if="loading" class="loading-state">加载中...</div>
          
          <div class="coupon-grid" v-else-if="coupons.length > 0">
            <div v-for="c in coupons" :key="c.id" class="coupon-card glass-card" :class="{ claimed: c.claimed }" @click="goToCouponDetail(c.id)">
              <div class="coupon-left" :class="getCouponTypeClass(c.type)">
                <span class="coupon-value">
                  <template v-if="c.type === 2">{{ (c.discountRate * 10).toFixed(0) }}折</template>
                  <template v-else>¥{{ c.discountAmount }}</template>
                </span>
                <span class="coupon-cond">
                  <template v-if="c.minAmount > 0">满{{ c.minAmount }}可用</template>
                  <template v-else>无门槛</template>
                </span>
              </div>
              <div class="coupon-right">
                <h4>{{ c.name }}</h4>
                <p class="coupon-desc">{{ c.description || getCouponTypeText(c.type) }}</p>
                <p class="coupon-time">{{ formatDate(c.startTime) }} - {{ formatDate(c.endTime) }}</p>
                <div class="coupon-footer">
                  <span class="remaining">
                    剩余 {{ c.remaining }} 张
                    <template v-if="c.limitPerUser > 1">（限领{{ c.limitPerUser }}张，已领{{ c.userClaimedCount || 0 }}张）</template>
                  </span>
                  <button class="btn btn-primary btn-sm" @click.stop="claimCoupon(c)" :disabled="c.claimed || c.remaining <= 0">
                    {{ c.claimed ? '已领完' : c.remaining <= 0 ? '已领完' : '立即领取' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div v-else class="empty-state glass-card">
            <p>暂无可领取的优惠券</p>
          </div>
        </section>

        <section class="section">
          <div class="section-head">
            <h2 class="text-title">我的优惠券</h2>
            <router-link to="/profile" class="more">查看全部 ></router-link>
          </div>
          
          <div class="my-coupons" v-if="myCoupons.length > 0">
            <div v-for="c in myCoupons.slice(0, 4)" :key="c.id" class="my-coupon-card glass-card" :class="{ used: c.status === 1, expired: c.expired }">
              <div class="coupon-left" :class="getCouponTypeClass(c.type)">
                <span class="coupon-value">
                  <template v-if="c.type === 2">{{ (c.discountRate * 10).toFixed(0) }}折</template>
                  <template v-else>¥{{ c.discountAmount }}</template>
                </span>
                <span class="coupon-cond">
                  <template v-if="c.minAmount > 0">满{{ c.minAmount }}可用</template>
                  <template v-else>无门槛</template>
                </span>
              </div>
              <div class="coupon-right">
                <h4>{{ c.name }}</h4>
                <p class="coupon-time">有效期至 {{ formatDate(c.endTime) }}</p>
                <span class="status-tag" v-if="c.status === 1">已使用</span>
                <span class="status-tag expired" v-else-if="c.expired">已过期</span>
                <router-link v-else to="/category" class="btn btn-glass btn-sm">去使用</router-link>
              </div>
            </div>
          </div>
          
          <div v-else class="empty-state glass-card">
            <p>暂无优惠券，快去领取吧</p>
          </div>
        </section>

        <section class="section">
          <div class="section-head">
            <h2 class="text-title">热销商品</h2>
            <router-link to="/hot" class="more">查看全部 ></router-link>
          </div>
          <div class="flash-grid">
            <div v-for="item in hotProducts" :key="item.id" class="flash-card glass-card" @click="$router.push(`/product/${item.id}`)">
              <div class="flash-img">
                <img :src="getImageUrl(item.mainImage)" @error="imgErr" />
              </div>
              <div class="flash-info">
                <h4>{{ item.name }}</h4>
                <div class="flash-price">
                  <span class="current">¥{{ item.price }}</span>
                </div>
                <span class="sales-text">已售{{ item.sales || 0 }}件</span>
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
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../stores/userStore'
import { useRouter } from 'vue-router'
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'
import couponApi from '../api/couponApi'
import productApi from '../api/productApi'
import fileApi from '../api/fileApi'

const router = useRouter()
const userStore = useUserStore()
const loading = ref(true)
const coupons = ref<any[]>([])
const myCoupons = ref<any[]>([])
const hotProducts = ref<any[]>([])

const getImageUrl = (path: string) => fileApi.getImageUrl(path)

const imgErr = (e: Event) => { 
  const img = e.target as HTMLImageElement
  img.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect fill="#f8f8fc" width="200" height="200"/><text fill="#ccc" font-family="Arial" font-size="16" x="50%" y="50%" text-anchor="middle" dy=".3em">商品图片</text></svg>')
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}.${date.getDate()}`
}

const getCouponTypeClass = (type: number) => {
  const classes: Record<number, string> = { 1: 'type-reduce', 2: 'type-discount', 3: 'type-free' }
  return classes[type] || 'type-reduce'
}

const getCouponTypeText = (type: number) => {
  const texts: Record<number, string> = { 1: '满减优惠券', 2: '折扣优惠券', 3: '无门槛优惠券' }
  return texts[type] || '优惠券'
}

const fetchCoupons = async () => {
  loading.value = true
  try {
    const res: any = await couponApi.getAvailableCoupons()
    if (res?.code === 200) {
      coupons.value = res.data || []
    }
  } catch (e) {
    console.error('获取优惠券失败', e)
  } finally {
    loading.value = false
  }
}

const fetchMyCoupons = async () => {
  if (!userStore.isLoggedIn) return
  try {
    const res: any = await couponApi.getMyCoupons()
    if (res?.code === 200) {
      myCoupons.value = res.data || []
    }
  } catch (e) {
    console.error('获取我的优惠券失败', e)
  }
}

const fetchHotProducts = async () => {
  try {
    const res: any = await productApi.getProducts({ page: 1, size: 4, sort: 'sales' })
    if (res?.code === 200) {
      hotProducts.value = res.data?.content || []
    }
  } catch (e) {
    console.error('获取热销商品失败', e)
  }
}

const claimCoupon = async (coupon: any) => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  
  if (coupon.claimed || coupon.remaining <= 0) return
  
  try {
    const res: any = await couponApi.claimCoupon(coupon.id)
    if (res?.code === 200) {
      ElMessage.success('领取成功')
      // 更新已领取数量
      coupon.userClaimedCount = (coupon.userClaimedCount || 0) + 1
      coupon.remaining--
      // 检查是否达到限领上限
      if (coupon.userClaimedCount >= coupon.limitPerUser) {
        coupon.claimed = true
      }
      fetchMyCoupons()
    } else {
      ElMessage.error(res?.message || '领取失败')
    }
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '领取失败')
  }
}

const goToCouponDetail = (id: number) => {
  router.push(`/coupon/${id}`)
}

onMounted(() => {
  fetchCoupons()
  fetchMyCoupons()
  fetchHotProducts()
})
</script>

<style scoped>
.promo-page { min-height: 100vh; background: var(--white); position: relative; }
.deco-layer { position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; }
.deco-bg { position: absolute; top: 0; left: 0; width: 60%; height: 50%; background: linear-gradient(135deg, #E8F4FF 0%, #D4E8FF 100%); opacity: 0.5; filter: blur(60px); }
.shape { position: absolute; border-radius: 50%; filter: blur(60px); }
.s1 { width: 600px; height: 600px; top: 25%; right: -5%; background: linear-gradient(135deg, #D4E8FF, #B7D4FF); opacity: 0.15; }
.s2 { width: 500px; height: 500px; bottom: 5%; left: -5%; background: linear-gradient(135deg, #E0F0FF, #C5D8FF); opacity: 0.12; }

.main { position: relative; z-index: 1; padding: 100px 0 60px; }

.hero { padding: 48px; margin-bottom: 48px; text-align: center; }
.hero-tag { display: inline-block; padding: 8px 20px; background: var(--sakura); color: #fff; border-radius: 20px; font-size: 15px; font-weight: 500; margin-bottom: 16px; }
.hero h1 { font-size: 2.5rem; font-weight: 600; margin: 0 0 12px; }
.hero p { font-size: 18px; color: var(--text-body); margin: 0; }

.section { margin-bottom: 48px; }
.section-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.section-head h2 { font-size: 1.75rem; font-weight: 600; margin: 0; }
.sub { font-size: 15px; color: var(--text-muted); }
.more { font-size: 14px; color: var(--text-muted); text-decoration: none; }
.more:hover { color: var(--sakura); }

.loading-state, .empty-state { text-align: center; padding: 60px; color: var(--text-muted); }

.coupon-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
.coupon-card { display: flex; overflow: hidden; transition: all 0.3s; cursor: pointer; }
.coupon-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(90, 143, 212, 0.15); }
.coupon-card.claimed { opacity: 0.6; }

.coupon-left { width: 120px; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; color: #fff; }
.coupon-left.type-reduce { background: linear-gradient(135deg, #5A8FD4, #7BA8E8); }
.coupon-left.type-discount { background: linear-gradient(135deg, #f5a623, #f7b84b); }
.coupon-left.type-free { background: linear-gradient(135deg, #52c41a, #73d13d); }

.coupon-value { font-size: 28px; font-weight: 700; line-height: 1.2; }
.coupon-cond { font-size: 12px; opacity: 0.9; margin-top: 4px; }

.coupon-right { flex: 1; padding: 16px 20px; display: flex; flex-direction: column; }
.coupon-right h4 { margin: 0 0 6px; font-size: 16px; font-weight: 600; color: var(--text-title); }
.coupon-desc { margin: 0 0 4px; font-size: 13px; color: var(--text-muted); }
.coupon-time { margin: 0 0 12px; font-size: 12px; color: var(--text-muted); }
.coupon-footer { display: flex; justify-content: space-between; align-items: center; margin-top: auto; }
.remaining { font-size: 12px; color: var(--text-muted); }

.btn-sm { padding: 8px 18px; font-size: 13px; }

.my-coupons { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
.my-coupon-card { display: flex; overflow: hidden; }
.my-coupon-card.used, .my-coupon-card.expired { opacity: 0.5; }
.my-coupon-card .coupon-left { width: 100px; padding: 16px; }
.my-coupon-card .coupon-value { font-size: 24px; }
.my-coupon-card .coupon-right { padding: 12px 16px; }
.my-coupon-card .coupon-right h4 { font-size: 14px; margin-bottom: 4px; }
.status-tag { display: inline-block; padding: 4px 12px; background: #f0f0f0; color: #999; font-size: 12px; border-radius: 12px; }
.status-tag.expired { background: #fff1f0; color: #ff4d4f; }

.flash-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.flash-card { overflow: hidden; cursor: pointer; transition: all 0.3s; }
.flash-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(90, 143, 212, 0.15); }
.flash-img { height: 160px; overflow: hidden; }
.flash-img img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s; }
.flash-card:hover .flash-img img { transform: scale(1.05); }
.flash-info { padding: 14px; }
.flash-info h4 { margin: 0 0 8px; font-size: 14px; font-weight: 600; color: var(--text-title); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.flash-price { margin-bottom: 4px; }
.flash-price .current { font-size: 18px; font-weight: 600; color: #5A8FD4; }
.sales-text { font-size: 12px; color: var(--text-muted); }

@media (max-width: 1024px) { .flash-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 768px) { 
  .coupon-grid, .my-coupons { grid-template-columns: 1fr; } 
  .hero h1 { font-size: 1.75rem; } 
}
</style>
