<template>
  <div class="promotion-detail-page" data-testid="promotion-detail-view">
    <Navbar />

    <main class="main-content">
      <div class="container">
        <button class="back-btn" @click="$router.back()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          返回
        </button>

        <section class="hero-section">
          <div class="hero-copy">
            <span class="hero-tag">优惠专题</span>
            <h1>{{ featuredCoupon?.name || '优惠活动详情' }}</h1>
            <p>
              {{ featuredCoupon?.description || '这里展示当前可领取优惠券和可直接购买的真实商品，不再使用演示活动数据。' }}
            </p>
          </div>

          <div
            v-if="featuredCoupon"
            class="coupon-panel"
            :class="getCouponTypeClass(featuredCoupon.type)"
            data-testid="promotion-featured-coupon"
          >
            <div class="coupon-value">
              <template v-if="featuredCoupon.type === 2">
                {{ (Number(featuredCoupon.discountRate || 0) * 10).toFixed(0) }} 折
              </template>
              <template v-else>
                ¥{{ formatMoney(featuredCoupon.discountAmount) }}
              </template>
            </div>
            <div class="coupon-meta">
              <span>{{ couponConditionText(featuredCoupon) }}</span>
              <span>{{ couponDateRange(featuredCoupon) }}</span>
              <span>剩余 {{ featuredCoupon.remaining ?? 0 }} 张</span>
            </div>
            <div class="coupon-actions">
              <button
                class="primary-btn"
                data-testid="promotion-featured-claim"
                :disabled="!canClaim(featuredCoupon)"
                @click="claimCoupon(featuredCoupon)"
              >
                {{ featuredCoupon.claimed ? '已达领取上限' : (featuredCoupon.remaining ?? 0) <= 0 ? '已领完' : '立即领取' }}
              </button>
              <button class="secondary-btn" @click="router.push(`/coupon/${featuredCoupon.id}`)">查看优惠券详情</button>
            </div>
          </div>
        </section>

        <section class="section-card">
          <div class="section-head">
            <h2>活动说明</h2>
          </div>
          <ul class="rules-list">
            <li>本页内容全部来自当前可领取优惠券和真实商品数据。</li>
            <li>优惠金额、有效期、领取限制以优惠券详情页和下单结算页为准。</li>
            <li>商品价格直接展示当前售价，不展示虚构活动价。</li>
          </ul>
        </section>

        <section class="section-card">
          <div class="section-head">
            <h2>可领取优惠券</h2>
            <button class="link-btn" @click="router.push('/promotions')">查看全部</button>
          </div>

          <div v-if="loadingCoupons" class="empty-state">加载中...</div>
          <div v-else-if="coupons.length === 0" class="empty-state">当前暂无可领取优惠券</div>
          <div v-else class="coupon-grid">
            <div
              v-for="coupon in coupons"
              :key="coupon.id"
              class="coupon-card"
              :class="{ active: featuredCoupon?.id === coupon.id }"
              :data-testid="`promotion-coupon-${coupon.id}`"
              @click="router.push(`/coupon/${coupon.id}`)"
            >
              <div class="coupon-badge" :class="getCouponTypeClass(coupon.type)">
                <template v-if="coupon.type === 2">
                  {{ (Number(coupon.discountRate || 0) * 10).toFixed(0) }} 折
                </template>
                <template v-else>
                  ¥{{ formatMoney(coupon.discountAmount) }}
                </template>
              </div>
              <div class="coupon-body">
                <h3>{{ coupon.name }}</h3>
                <p>{{ coupon.description || getCouponTypeText(coupon.type) }}</p>
                <div class="coupon-extra">
                  <span>{{ couponConditionText(coupon) }}</span>
                  <span>{{ couponDateRange(coupon) }}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="section-card">
          <div class="section-head">
            <h2>活动商品</h2>
            <button class="link-btn" @click="router.push('/hot')">更多热销</button>
          </div>

          <div v-if="loadingProducts" class="empty-state">加载中...</div>
          <div v-else-if="products.length === 0" class="empty-state">暂无商品可展示</div>
          <div v-else class="product-grid">
            <div
              v-for="product in products"
              :key="product.id"
              class="product-card"
              @click="router.push(`/product/${product.id}`)"
            >
              <div class="product-image">
                <el-image :src="getImageUrl(product.mainImage)" fit="cover">
                  <template #error>
                    <div class="image-placeholder">商品图片</div>
                  </template>
                </el-image>
              </div>
              <div class="product-info">
                <h3>{{ product.name }}</h3>
                <p class="sales">已售 {{ product.sales || 0 }} 件</p>
                <div class="price-row">
                  <span class="price">¥{{ formatMoney(product.price) }}</span>
                </div>
                <div class="actions">
                  <button class="ghost-btn" @click.stop="addToCart(product)">加入购物车</button>
                  <button class="primary-btn" @click.stop="buyNow(product)">立即购买</button>
                </div>
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
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useCartStore } from '../stores/cartStore'
import { useUserStore } from '../stores/userStore'
import couponApi from '../api/couponApi'
import productApi from '../api/productApi'
import fileApi from '../api/fileApi'
import { debugError } from '../utils/debug'
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()
const userStore = useUserStore()

const loadingCoupons = ref(false)
const loadingProducts = ref(false)
const coupons = ref<any[]>([])
const products = ref<any[]>([])
const featuredCoupon = ref<any | null>(null)
let latestFeaturedCouponRequestId = 0
let latestCouponsRequestId = 0
const invalidateFeaturedCouponRequests = () => {
  latestFeaturedCouponRequestId += 1
}
const invalidateCouponRequests = () => {
  latestCouponsRequestId += 1
}

const getImageUrl = (path: string) => fileApi.getImageUrl(path)
const getErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === 'object') {
    const response = (error as { response?: { data?: { message?: string } } }).response
    const message = (error as { message?: string }).message
    return response?.data?.message || message || fallback
  }
  return fallback
}

const formatMoney = (value: number | string) => Number(value || 0).toFixed(2)

const getCouponTypeClass = (type: number) => {
  const classes: Record<number, string> = { 1: 'type-reduce', 2: 'type-discount', 3: 'type-free' }
  return classes[type] || 'type-reduce'
}

const getCouponTypeText = (type: number) => {
  const texts: Record<number, string> = { 1: '满减优惠券', 2: '折扣优惠券', 3: '无门槛优惠券' }
  return texts[type] || '优惠券'
}

const couponConditionText = (coupon: any) =>
  Number(coupon.minAmount || 0) > 0 ? `满 ¥${formatMoney(coupon.minAmount)} 可用` : '无门槛可用'

const couponDateRange = (coupon: any) =>
  `${String(coupon.startTime || '').slice(0, 10)} - ${String(coupon.endTime || '').slice(0, 10)}`

const canClaim = (coupon: any) => !coupon?.claimed && Number(coupon?.remaining ?? 0) > 0

const fetchFeaturedCoupon = async () => {
  const id = Number(route.params.id)
  if (!id) return
  const requestId = ++latestFeaturedCouponRequestId

  try {
    const res: any = await couponApi.getCouponById(id)
    if (requestId !== latestFeaturedCouponRequestId) {
      return
    }
    if (res?.code === 200 && res.data) {
      featuredCoupon.value = res.data
    } else {
      debugError('获取优惠专题主优惠券失败:', res?.message || '业务返回异常')
      ElMessage.warning('未找到对应优惠活动，已为你展示当前可用优惠券')
    }
  } catch (error) {
    if (requestId !== latestFeaturedCouponRequestId) {
      return
    }
    debugError('获取优惠专题主优惠券失败:', error)
    ElMessage.warning('未找到对应优惠活动，已为你展示当前可用优惠券')
  }
}

const fetchCoupons = async () => {
  const requestId = ++latestCouponsRequestId
  loadingCoupons.value = true
  try {
    const res: any = await couponApi.getAvailableCoupons()
    if (requestId !== latestCouponsRequestId) {
      return
    }
    if (res?.code === 200) {
      coupons.value = res.data || []
      if (!featuredCoupon.value && coupons.value.length > 0) {
        featuredCoupon.value = coupons.value[0]
      }
    } else {
      debugError('获取优惠专题优惠券失败:', res?.message || '业务返回异常')
    }
  } catch (error) {
    if (requestId !== latestCouponsRequestId) {
      return
    }
    debugError('获取优惠专题优惠券失败:', error)
  } finally {
    if (requestId === latestCouponsRequestId) {
      loadingCoupons.value = false
    }
  }
}

const fetchProducts = async () => {
  loadingProducts.value = true
  try {
    const res: any = await productApi.getProducts({ pageNo: 0, pageSize: 8, sort: 'sales' })
    if (res?.code === 200) {
      products.value = res.data?.content || res.data?.records || res.data || []
    } else {
      debugError('获取优惠专题商品失败:', res?.message || '业务返回异常')
    }
  } catch (error) {
    debugError('获取优惠专题商品失败:', error)
  } finally {
    loadingProducts.value = false
  }
}

const refreshCouponsAfterClaimSuccess = async () => {
  const results = await Promise.allSettled([fetchFeaturedCoupon(), fetchCoupons()])
  const targetLabels = ['专题主优惠券', '优惠券列表']

  results.forEach((result, index) => {
    if (result.status !== 'rejected') {
      return
    }
    debugError(`优惠专题领取成功后刷新${targetLabels[index]}失败:`, result.reason)
  })
}

const applyLocalCouponClaimState = (couponId: number) => {
  coupons.value = coupons.value.map((item) =>
    item.id === couponId
      ? {
          ...item,
          claimed: true,
          remaining: Math.max(0, Number(item.remaining || 0) - 1)
        }
      : item
  )

  if (featuredCoupon.value?.id === couponId) {
    featuredCoupon.value = {
      ...featuredCoupon.value,
      claimed: true,
      remaining: Math.max(0, Number(featuredCoupon.value.remaining || 0) - 1)
    }
  }
}

const claimCoupon = async (coupon: any) => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }

  try {
    const res: any = await couponApi.claimCoupon(coupon.id)
    if (res?.code === 200) {
      invalidateFeaturedCouponRequests()
      invalidateCouponRequests()
      applyLocalCouponClaimState(coupon.id)
      ElMessage.success('领取成功')
      await refreshCouponsAfterClaimSuccess()
    } else {
      const message = res?.message || '领取失败'
      debugError('优惠专题领取优惠券失败:', message)
      ElMessage.error(message)
    }
  } catch (error) {
    debugError('优惠专题领取优惠券失败:', error)
    ElMessage.error(getErrorMessage(error, '领取失败'))
  }
}

const addToCart = async (product: any) => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }

  try {
    await cartStore.addToCart(userStore.userInfo?.id || null, product.id, 1)
  } catch (error) {
    debugError('优惠专题加入购物车失败:', error)
    ElMessage.error(getErrorMessage(error, '加入购物车失败'))
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

const reloadPromotionDetailFromRoute = async () => {
  featuredCoupon.value = null
  coupons.value = []
  products.value = []
  await Promise.all([fetchFeaturedCoupon(), fetchCoupons(), fetchProducts()])
}

onMounted(async () => {
  await reloadPromotionDetailFromRoute()
})

watch(() => route.params.id, async () => {
  await reloadPromotionDetailFromRoute()
})
</script>

<style scoped>
.promotion-detail-page {
  min-height: 100vh;
  background: var(--white);
}

.main-content {
  padding: 96px 0 72px;
}

.back-btn,
.link-btn,
.ghost-btn,
.primary-btn,
.secondary-btn {
  cursor: pointer;
  transition: all 0.2s ease;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 24px;
  padding: 10px 18px;
  border: 1px solid var(--gray-300);
  border-radius: 8px;
  background: var(--white);
  color: var(--text-secondary);
}

.hero-section,
.section-card {
  border: 1px solid var(--gray-200);
  border-radius: 8px;
  background: var(--white);
  box-shadow: var(--shadow-sm);
}

.hero-section {
  display: grid;
  grid-template-columns: 1.3fr 1fr;
  gap: 24px;
  padding: 28px;
  margin-bottom: 24px;
}

.hero-tag {
  display: inline-block;
  margin-bottom: 12px;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(155, 135, 245, 0.12);
  color: var(--primary);
  font-size: 13px;
  font-weight: 600;
}

.hero-copy h1 {
  margin: 0 0 10px;
  font-size: 30px;
  color: var(--text-title);
}

.hero-copy p {
  margin: 0;
  color: var(--text-body);
  line-height: 1.8;
}

.coupon-panel {
  padding: 24px;
  border-radius: 8px;
  color: #fff;
}

.coupon-panel.type-reduce {
  background: linear-gradient(135deg, #8e7cc3, #6f59c7);
}

.coupon-panel.type-discount {
  background: linear-gradient(135deg, #f5a623, #e67e22);
}

.coupon-panel.type-free {
  background: linear-gradient(135deg, #52c41a, #2f9e44);
}

.coupon-value {
  font-size: 34px;
  font-weight: 700;
}

.coupon-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 14px;
  font-size: 14px;
  opacity: 0.92;
}

.coupon-actions,
.actions {
  display: flex;
  gap: 10px;
  margin-top: 18px;
}

.primary-btn,
.secondary-btn,
.ghost-btn,
.link-btn {
  border-radius: 8px;
  font-size: 14px;
}

.primary-btn {
  border: none;
  background: var(--primary);
  color: #fff;
  padding: 10px 16px;
}

.primary-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.secondary-btn,
.ghost-btn,
.link-btn {
  border: 1px solid var(--gray-300);
  background: var(--white);
  color: var(--text-secondary);
  padding: 10px 16px;
}

.section-card {
  margin-bottom: 24px;
  padding: 24px;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}

.section-head h2 {
  margin: 0;
  font-size: 22px;
  color: var(--text-title);
}

.rules-list {
  margin: 0;
  padding-left: 20px;
  color: var(--text-body);
  line-height: 1.9;
}

.coupon-grid,
.product-grid {
  display: grid;
  gap: 16px;
}

.coupon-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.coupon-card {
  display: grid;
  grid-template-columns: 116px 1fr;
  overflow: hidden;
  border: 1px solid var(--gray-200);
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
}

.coupon-card.active {
  border-color: var(--primary);
}

.coupon-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 24px;
  font-weight: 700;
}

.coupon-badge.type-reduce {
  background: #8e7cc3;
}

.coupon-badge.type-discount {
  background: #f5a623;
}

.coupon-badge.type-free {
  background: #52c41a;
}

.coupon-body {
  padding: 16px;
}

.coupon-body h3,
.product-info h3 {
  margin: 0 0 8px;
  font-size: 16px;
  line-height: 1.4;
  color: var(--text-title);
}

.product-info h3 {
  min-height: 44px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.coupon-body p,
.sales {
  margin: 0;
  font-size: 14px;
  color: var(--text-body);
}

.coupon-extra {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 10px;
  font-size: 12px;
  color: var(--text-muted);
}

.product-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.product-card {
  overflow: hidden;
  border: 1px solid var(--gray-200);
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
}

.product-image {
  height: 180px;
  background: var(--gray-50);
}

.product-image :deep(.el-image) {
  width: 100%;
  height: 100%;
}

.image-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-muted);
  font-size: 14px;
}

.product-info {
  padding: 16px;
}

.price-row {
  margin-top: 10px;
}

.price {
  font-size: 22px;
  font-weight: 700;
  color: var(--primary);
}

.empty-state {
  padding: 36px 0;
  text-align: center;
  color: var(--text-muted);
}

@media (max-width: 1024px) {
  .hero-section,
  .coupon-grid,
  .product-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .main-content {
    padding-top: 88px;
  }

  .hero-copy h1 {
    font-size: 24px;
  }

  .coupon-card {
    grid-template-columns: 92px 1fr;
  }
}
</style>
