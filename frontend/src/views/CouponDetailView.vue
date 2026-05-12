<template>
  <div class="coupon-detail-page" data-testid="coupon-detail-view">
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

        <div class="coupon-card" v-loading="loading">
          <!-- 优惠券主体 -->
          <div class="coupon-main" :class="statusClass">
            <div class="coupon-left">
              <div class="coupon-value">
                <template v-if="coupon.type === 2">
                  <span class="value-num">{{ Math.round((1 - coupon.discountRate) * 10) }}</span>
                  <span class="value-unit">折</span>
                </template>
                <template v-else>
                  <span class="value-symbol">¥</span>
                  <span class="value-num">{{ coupon.discountAmount }}</span>
                </template>
              </div>
              <div class="coupon-condition">
                <span v-if="coupon.minAmount > 0">满{{ coupon.minAmount }}元可用</span>
                <span v-else>无门槛</span>
              </div>
            </div>
            <div class="coupon-divider"></div>
            <div class="coupon-right">
              <h2 class="coupon-name">{{ coupon.name }}</h2>
              <p class="coupon-desc">{{ coupon.description || '暂无描述' }}</p>
              <div class="coupon-time">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                {{ formatTime(coupon.startTime) }} - {{ formatTime(coupon.endTime) }}
              </div>
            </div>
            <div class="status-badge">{{ coupon.statusText }}</div>
          </div>

          <!-- 优惠券详情 -->
          <div class="coupon-details">
            <div class="detail-section">
              <h3>优惠券信息</h3>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">优惠券类型</span>
                  <span class="info-value">{{ getTypeName(coupon.type) }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">发放总量</span>
                  <span class="info-value">{{ coupon.totalCount }} 张</span>
                </div>
                <div class="info-item">
                  <span class="info-label">剩余数量</span>
                  <span class="info-value highlight">{{ coupon.remaining }} 张</span>
                </div>
                <div class="info-item">
                  <span class="info-label">每人限领</span>
                  <span class="info-value">{{ coupon.limitPerUser }} 张</span>
                </div>
                <div class="info-item" v-if="coupon.userClaimedCount > 0">
                  <span class="info-label">已领取</span>
                  <span class="info-value highlight">{{ coupon.userClaimedCount }} 张</span>
                </div>
                <div class="info-item" v-if="coupon.type === 2 && coupon.maxDiscount">
                  <span class="info-label">最高优惠</span>
                  <span class="info-value">¥{{ coupon.maxDiscount }}</span>
                </div>
              </div>
            </div>

            <div class="detail-section">
              <h3>使用规则</h3>
              <ul class="rules-list">
                <li>本优惠券仅限在有效期内使用</li>
                <li v-if="coupon.minAmount > 0">订单金额需满 ¥{{ coupon.minAmount }} 方可使用</li>
                <li v-else>本券为无门槛优惠券，任意金额可用</li>
                <li>每个订单仅可使用一张优惠券</li>
                <li>优惠券不可兑换现金，不可找零</li>
                <li>如订单取消，优惠券将自动退回</li>
              </ul>
            </div>

            <!-- 领取按钮 -->
            <div class="action-section">
              <button 
                class="claim-btn" 
                data-testid="coupon-detail-claim"
                :class="{ disabled: !canClaim }"
                :disabled="!canClaim"
                @click="handleClaim"
              >
                <span v-if="coupon.claimed">已达领取上限</span>
                <span v-else-if="coupon.statusText === '已领完'">已领完</span>
                <span v-else-if="coupon.statusText === '已结束'">已结束</span>
                <span v-else-if="coupon.statusText === '未开始'">未开始</span>
                <span v-else-if="coupon.statusText === '已停用'">已停用</span>
                <span v-else>立即领取{{ coupon.userClaimedCount > 0 ? `（已领${coupon.userClaimedCount}/${coupon.limitPerUser}张）` : '' }}</span>
              </button>
              <button class="browse-btn" @click="$router.push('/promotions')">
                浏览更多优惠券
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>

    <Footer />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../stores/userStore'
import couponApi from '../api/couponApi'
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'
import { debugError } from '../utils/debug'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const coupon = ref<any>({})
let latestCouponRequestId = 0
const invalidateCouponRequests = () => {
  latestCouponRequestId += 1
}

const statusClass = computed(() => {
  if (coupon.value.statusText === '进行中') return 'active'
  if (coupon.value.statusText === '已领完') return 'soldout'
  return 'inactive'
})

const canClaim = computed(() => {
  return coupon.value.statusText === '进行中' && !coupon.value.claimed
})

const getTypeName = (type: number) => {
  const names: Record<number, string> = {
    1: '满减券',
    2: '折扣券',
    3: '无门槛券'
  }
  return names[type] || '优惠券'
}

const formatTime = (time: string) => {
  if (!time) return ''
  return time.substring(0, 10)
}

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === 'object') {
    const response = (error as { response?: { data?: { message?: string } } }).response
    const message = (error as { message?: string }).message
    return response?.data?.message || message || fallback
  }
  return fallback
}

const fetchCoupon = async (showError: boolean = true) => {
  const id = route.params.id
  if (!id) return

  const requestId = ++latestCouponRequestId
  loading.value = true
  try {
    const res: any = await couponApi.getCouponById(Number(id))
    if (requestId !== latestCouponRequestId) {
      return
    }
    if (res?.code === 200) {
      coupon.value = res.data
    } else {
      const message = res?.message || '获取优惠券信息失败'
      debugError('获取优惠券详情失败', message)
      if (showError) {
        ElMessage.error(message)
      }
    }
  } catch (e) {
    if (requestId !== latestCouponRequestId) {
      return
    }
    debugError('获取优惠券详情失败', e)
    if (showError) {
      ElMessage.error(getErrorMessage(e, '获取优惠券信息失败'))
    }
  } finally {
    if (requestId === latestCouponRequestId) {
      loading.value = false
    }
  }
}

const refreshCouponAfterClaimSuccess = async () => {
  try {
    await fetchCoupon(false)
  } catch (error) {
    debugError('领取成功后刷新优惠券详情失败', error)
  }
}

const handleClaim = async () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  
  try {
    const res: any = await couponApi.claimCoupon(coupon.value.id)
    if (res?.code === 200) {
      invalidateCouponRequests()
      coupon.value = {
        ...coupon.value,
        claimed: true,
        userClaimedCount: Number(coupon.value.userClaimedCount || 0) + 1,
        remaining: Math.max(0, Number(coupon.value.remaining || 0) - 1)
      }
      ElMessage.success('领取成功')
      await refreshCouponAfterClaimSuccess()
    } else {
      const message = res?.message || '领取失败'
      debugError('领取优惠券失败', message)
      ElMessage.error(message)
    }
  } catch (e: any) {
    debugError('领取优惠券失败', e)
    ElMessage.error(getErrorMessage(e, '领取失败'))
  }
}

const reloadCouponDetailFromRoute = () => {
  coupon.value = {}
  void fetchCoupon()
}

onMounted(() => {
  reloadCouponDetailFromRoute()
})

watch(() => route.params.id, () => {
  reloadCouponDetailFromRoute()
})
</script>

<style scoped>
.coupon-detail-page {
  min-height: 100vh;
  background: var(--white);
  position: relative;
}

.coupon-detail-page::before {
  content: '';
  position: fixed;
  top: 5%;
  right: -10%;
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(155, 135, 245, 0.15), transparent);
  opacity: 0.15;
  filter: blur(80px);
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
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
  color: var(--sakura-deep);
}

.coupon-card {
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(200, 220, 255, 0.5);
  border-radius: var(--radius-lg);
  box-shadow: 0 8px 32px rgba(155, 135, 245, 0.08);
  overflow: hidden;
}

/* 优惠券主体 */
.coupon-main {
  display: flex;
  align-items: stretch;
  padding: 32px;
  background: linear-gradient(135deg, var(--primary) 0%, rgba(155, 135, 245, 0.8) 100%);
  position: relative;
  color: #fff;
}

.coupon-main.inactive {
  background: linear-gradient(135deg, #9CA3AF 0%, #B8BFC9 100%);
}

.coupon-main.soldout {
  background: linear-gradient(135deg, #8E7CC3 0%, #A594D2 100%);
}

.coupon-left {
  flex-shrink: 0;
  width: 160px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.coupon-value {
  display: flex;
  align-items: baseline;
}

.value-symbol {
  font-size: 24px;
  font-weight: 500;
}

.value-num {
  font-size: 56px;
  font-weight: 700;
  line-height: 1;
}

.value-unit {
  font-size: 24px;
  font-weight: 500;
  margin-left: 4px;
}

.coupon-condition {
  margin-top: 8px;
  font-size: 14px;
  opacity: 0.9;
}

.coupon-divider {
  width: 1px;
  background: rgba(255, 255, 255, 0.3);
  margin: 0 32px;
  position: relative;
}

.coupon-divider::before,
.coupon-divider::after {
  content: '';
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 20px;
  background: var(--white);
  border-radius: 50%;
}

.coupon-divider::before { top: -42px; }
.coupon-divider::after { bottom: -42px; }

.coupon-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.coupon-name {
  margin: 0 0 8px;
  font-size: 24px;
  font-weight: 600;
}

.coupon-desc {
  margin: 0 0 16px;
  font-size: 15px;
  opacity: 0.9;
  line-height: 1.6;
}

.coupon-time {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  opacity: 0.85;
}

.status-badge {
  position: absolute;
  top: 16px;
  right: 16px;
  padding: 6px 16px;
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
}

/* 详情部分 */
.coupon-details {
  padding: 32px;
}

.detail-section {
  margin-bottom: 32px;
}

.detail-section:last-of-type {
  margin-bottom: 0;
}

.detail-section h3 {
  margin: 0 0 16px;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-title);
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(200, 220, 255, 0.3);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(245, 250, 255, 0.5);
  border-radius: var(--radius-md);
}

.info-label {
  color: var(--text-muted);
  font-size: 14px;
}

.info-value {
  font-weight: 500;
  color: var(--text-title);
}

.info-value.highlight {
  color: var(--sakura-deep);
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

/* 操作按钮 */
.action-section {
  display: flex;
  gap: 16px;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid rgba(200, 220, 255, 0.3);
}

.claim-btn {
  flex: 1;
  padding: 16px 32px;
  background: linear-gradient(135deg, var(--sakura), var(--primary));
  border: none;
  border-radius: var(--radius-md);
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  cursor: pointer;
  transition: all 0.3s;
}

.claim-btn:hover:not(.disabled) {
  box-shadow: 0 8px 24px rgba(155, 135, 245, 0.4);
  transform: translateY(-2px);
}

.claim-btn.disabled {
  background: #ccc;
  cursor: not-allowed;
}

.browse-btn {
  padding: 16px 32px;
  background: transparent;
  border: 2px solid rgba(155, 135, 245, 0.4);
  border-radius: var(--radius-md);
  font-size: 16px;
  font-weight: 500;
  color: var(--text-body);
  cursor: pointer;
  transition: all 0.3s;
}

.browse-btn:hover {
  border-color: var(--sakura);
  color: var(--sakura-deep);
}

@media (max-width: 768px) {
  .coupon-main {
    flex-direction: column;
    text-align: center;
  }
  
  .coupon-left {
    width: 100%;
    margin-bottom: 20px;
  }
  
  .coupon-divider {
    width: 100%;
    height: 1px;
    margin: 20px 0;
  }
  
  .coupon-divider::before,
  .coupon-divider::after {
    display: none;
  }
  
  .coupon-right {
    text-align: center;
  }
  
  .coupon-time {
    justify-content: center;
  }
  
  .action-section {
    flex-direction: column;
  }
}
</style>
