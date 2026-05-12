<template>
  <div class="profile-page" data-testid="profile-view">
    <Navbar />

    <main class="main-content">
      <div class="container">
        <div class="profile-layout">
          <aside class="sidebar">
            <div class="user-card">
              <div class="avatar-wrapper">
                <div class="avatar" @click="previewAvatar" title="预览头像">
                  <img :src="getAvatarUrl(userInfo?.avatar)" alt="头像" />
                  <div class="avatar-zoom-hint">查看</div>
                </div>
                <label class="avatar-upload" title="更换头像">
                  修改
                  <input type="file" accept="image/*" @change="handleAvatarChange" />
                </label>
              </div>
              <h3 data-testid="profile-display-name">{{ userInfo?.nickname || userInfo?.username }}</h3>
              <p class="user-email">{{ userInfo?.email }}</p>
            </div>

            <div class="member-stats" data-testid="profile-member-stats">
              <div class="stat-item">
                <span class="stat-num">{{ orderCountDisplay }}</span>
                <span class="stat-label">订单</span>
              </div>
              <div class="stat-item">
                <span class="stat-num">{{ cartCountDisplay }}</span>
                <span class="stat-label">购物车</span>
              </div>
              <div class="stat-item">
                <span class="stat-num">{{ priceAlertCountDisplay }}</span>
                <span class="stat-label">提醒</span>
              </div>
            </div>
            <p v-if="hasUnavailableStats" class="stats-hint">部分统计暂未同步，请稍后刷新重试。</p>

            <nav class="sidebar-nav">
              <router-link to="/profile" class="nav-item active">个人资料</router-link>
              <router-link to="/orders" class="nav-item">我的订单</router-link>
              <router-link to="/my-products" class="nav-item">我的商品</router-link>
              <router-link to="/seller-orders" class="nav-item">
                卖家订单
                <span v-if="showSellerPendingBadge" class="nav-badge">{{ sellerPendingCount }}</span>
              </router-link>
              <router-link to="/price-alerts" class="nav-item">
                降价提醒
                <span v-if="showPriceAlertBadge" class="nav-badge">{{ priceAlertCount }}</span>
              </router-link>
              <router-link to="/address" class="nav-item">收货地址</router-link>
              <router-link to="/settings" class="nav-item">设置</router-link>
            </nav>
          </aside>

          <div class="main-panel">
            <div class="quick-actions" data-testid="profile-quick-actions">
              <div
                class="action-item"
                data-testid="profile-quick-action-pending-payment"
                @click="$router.push('/orders?status=0')"
              >
                <span class="action-label">待支付</span>
                <span class="action-count">{{ pendingPaymentDisplay }}</span>
              </div>
              <div
                class="action-item"
                data-testid="profile-quick-action-pending-shipment"
                @click="$router.push('/orders?status=1')"
              >
                <span class="action-label">待发货</span>
                <span class="action-count">{{ pendingShipmentDisplay }}</span>
              </div>
              <div
                class="action-item"
                data-testid="profile-quick-action-pending-receive"
                @click="$router.push('/orders?status=2')"
              >
                <span class="action-label">待收货</span>
                <span class="action-count">{{ pendingReceiveDisplay }}</span>
              </div>
              <div class="action-item" data-testid="profile-quick-action-cart" @click="$router.push('/cart')">
                <span class="action-label">购物车</span>
                <span class="action-count">{{ cartCountDisplay }}</span>
              </div>
              <div
                class="action-item"
                data-testid="profile-quick-action-price-alerts"
                @click="$router.push('/price-alerts')"
              >
                <span class="action-label">降价提醒</span>
                <span class="action-count">{{ priceAlertCountDisplay }}</span>
              </div>
            </div>

            <div class="panel-section">
              <div class="section-header">
                <h2>个人资料</h2>
                <span class="edit-tip">修改后记得保存。</span>
              </div>
              <div class="section-body">
                <el-form :model="profileForm" label-position="top" class="profile-form">
                  <div class="form-row">
                    <el-form-item label="用户名">
                      <el-input v-model="profileForm.username" disabled data-testid="profile-username-input" />
                    </el-form-item>
                    <el-form-item label="昵称">
                      <el-input
                        v-model="profileForm.nickname"
                        placeholder="设置展示昵称"
                        data-testid="profile-nickname-input"
                      />
                    </el-form-item>
                  </div>
                  <div class="profile-contact-hint">
                    <span>邮箱和手机号已收口到账户设置统一维护。</span>
                    <button type="button" class="link-btn inline-link" @click="goToSecuritySettings">前往设置</button>
                  </div>
                  <el-form-item label="个人简介">
                    <el-input
                      v-model="profileForm.bio"
                      type="textarea"
                      :rows="3"
                      placeholder="简单介绍一下自己"
                      data-testid="profile-bio-input"
                    />
                  </el-form-item>
                  <el-form-item>
                  <button type="button" class="save-btn" data-testid="profile-save" @click="saveProfile">保存资料</button>
                  </el-form-item>
                </el-form>
              </div>
            </div>

            <div class="panel-section">
              <div class="section-header">
                <h2>账号安全</h2>
              </div>
              <div class="section-body">
                <div class="security-item">
                  <div class="security-info">
                    <h4>登录密码</h4>
                    <p>建议定期修改密码，保障账号安全。</p>
                  </div>
                  <button class="link-btn" @click="goToSecuritySettings">前往设置</button>
                </div>
                <div class="security-item">
                  <div class="security-info">
                    <h4>绑定手机号</h4>
                    <p>{{ userInfo?.phone ? `已绑定：${maskPhone(userInfo.phone)}` : '暂未绑定手机号' }}</p>
                  </div>
                  <button class="link-btn" @click="goToSecuritySettings">
                    {{ userInfo?.phone ? '前往设置' : '去绑定' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <Transition name="preview">
      <div v-if="showAvatarPreview" class="avatar-preview-overlay" @click="showAvatarPreview = false">
        <div class="avatar-preview-content" @click.stop>
          <img :src="getAvatarUrl(userInfo?.avatar)" alt="头像预览" />
          <div class="preview-info">
            <span>{{ userInfo?.nickname || userInfo?.username }}</span>
          </div>
          <button class="preview-close" @click="showAvatarPreview = false">x</button>
        </div>
      </div>
    </Transition>

    <Footer />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../stores/userStore'
import { useCartStore } from '../stores/cartStore'
import orderApi from '../api/orderApi'
import fileApi from '../api/fileApi'
import axios from '../utils/axios'
import { debugError } from '../utils/debug'
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'
import type { ApiResponse, Order } from '../types'

const router = useRouter()
const userStore = useUserStore()
const cartStore = useCartStore()

const userInfo = computed(() => userStore.userInfo)
const userInitial = computed(
  () => userInfo.value?.nickname?.charAt(0) || userInfo.value?.username?.charAt(0)?.toUpperCase() || 'U'
)

const showAvatarPreview = ref(false)
const orderCount = ref(0)
const pendingPayment = ref(0)
const pendingShipment = ref(0)
const pendingReceive = ref(0)
const priceAlertCount = ref(0)
const sellerPendingCount = ref(0)
const orderStatsAvailable = ref(true)
const priceAlertStatsAvailable = ref(true)
const sellerPendingStatsAvailable = ref(true)
const cartStatsAvailable = ref(true)
let latestOrderStatsRequestId = 0
let latestPriceAlertCountRequestId = 0
let latestSellerPendingCountRequestId = 0

const cartCount = computed(() => cartStore.items.length)
const unavailableMarker = '--'
const orderCountDisplay = computed(() => orderStatsAvailable.value ? String(orderCount.value) : unavailableMarker)
const pendingPaymentDisplay = computed(() => orderStatsAvailable.value ? String(pendingPayment.value) : unavailableMarker)
const pendingShipmentDisplay = computed(() => orderStatsAvailable.value ? String(pendingShipment.value) : unavailableMarker)
const pendingReceiveDisplay = computed(() => orderStatsAvailable.value ? String(pendingReceive.value) : unavailableMarker)
const priceAlertCountDisplay = computed(() => priceAlertStatsAvailable.value ? String(priceAlertCount.value) : unavailableMarker)
const cartCountDisplay = computed(() => cartStatsAvailable.value ? String(cartCount.value) : unavailableMarker)
const showPriceAlertBadge = computed(() => priceAlertStatsAvailable.value && priceAlertCount.value > 0)
const showSellerPendingBadge = computed(() => sellerPendingStatsAvailable.value && sellerPendingCount.value > 0)
const hasUnavailableStats = computed(() =>
  !orderStatsAvailable.value ||
  !priceAlertStatsAvailable.value ||
  !sellerPendingStatsAvailable.value ||
  !cartStatsAvailable.value
)

const profileForm = reactive({
  username: '',
  nickname: '',
  bio: ''
})

const syncProfileFormFromUserInfo = () => {
  profileForm.username = userInfo.value?.username || ''
  profileForm.nickname = userInfo.value?.nickname || ''
  profileForm.bio = userInfo.value?.bio || ''
}

const previewAvatar = () => {
  showAvatarPreview.value = true
}

const goToSecuritySettings = () => {
  router.push('/settings?section=security')
}

const getDefaultAvatarUrl = (initial: string) =>
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#FFB7D5"/><stop offset="50%" style="stop-color:#C7A3FF"/><stop offset="100%" style="stop-color:#A3D5FF"/></linearGradient></defs><rect fill="url(#g)" width="100" height="100"/><text x="50" y="62" font-size="42" fill="white" text-anchor="middle" font-family="Arial, sans-serif" font-weight="600">${initial}</text></svg>`
  )

const getAvatarUrl = (avatar: string | undefined | null) => {
  if (avatar) {
    return fileApi.getImageUrl(avatar)
  }
  return getDefaultAvatarUrl(userInitial.value)
}

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === 'object') {
    const response = (error as { response?: { data?: { message?: string } } }).response
    const message = (error as { message?: string }).message
    return response?.data?.message || message || fallback
  }
  return fallback
}

const handleAvatarChange = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    ElMessage.warning('请选择图片文件')
    input.value = ''
    return
  }

  if (file.size > 2 * 1024 * 1024) {
    ElMessage.warning('头像大小不能超过 2MB')
    input.value = ''
    return
  }

  try {
    const res: any = await fileApi.uploadAvatar(file)
    if (res?.code === 200) {
      if (userStore.userInfo && res?.data) {
        userStore.userInfo.avatar = res.data
      }
      try {
        await userStore.fetchCurrentUser()
      } catch (refreshError) {
        debugError('刷新当前用户头像失败:', refreshError)
      }
      ElMessage.success(res?.message || '头像更新成功')
    } else {
      const message = res?.message || '上传失败'
      debugError('头像上传失败:', message)
      ElMessage.error(message)
    }
  } catch (error) {
    debugError('头像上传失败:', error)
    ElMessage.error(getErrorMessage(error, '上传失败'))
  }

  input.value = ''
}

const maskPhone = (phone: string) => {
  if (!phone || phone.length < 7) return phone
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`
}

const saveProfile = async () => {
  try {
    const payload = {
      nickname: profileForm.nickname,
      bio: profileForm.bio
    }
    await userStore.updateUserInfo(payload)
    if (userStore.userInfo) {
      userStore.userInfo.nickname = payload.nickname
      userStore.userInfo.bio = payload.bio
    }
    syncProfileFormFromUserInfo()
    ElMessage.success('个人资料已保存')
  } catch (error) {
    debugError('保存个人资料失败:', error)
    ElMessage.error(getErrorMessage(error, '保存失败'))
  }
}

const loadOrderStats = async () => {
  const requestId = ++latestOrderStatsRequestId
  try {
    const res = (await orderApi.getOrders(1, 1000)) as ApiResponse<Order[]>
    if (requestId !== latestOrderStatsRequestId) {
      return
    }
    if (res?.code === 200) {
      const orders = Array.isArray(res.data) ? res.data : []
      orderCount.value = orders.length
      pendingPayment.value = orders.filter((item) => item.orderStatus === 0).length
      pendingShipment.value = orders.filter((item) => item.orderStatus === 1).length
      pendingReceive.value = orders.filter((item) => item.orderStatus === 2).length
      orderStatsAvailable.value = true
      return
    }
    orderStatsAvailable.value = false
    debugError('获取订单统计失败:', res?.message || '订单统计返回异常')
  } catch (error) {
    if (requestId !== latestOrderStatsRequestId) {
      return
    }
    orderStatsAvailable.value = false
    debugError('获取订单统计失败:', error)
  }
}

const loadPriceAlertCount = async () => {
  const requestId = ++latestPriceAlertCountRequestId
  try {
    const res = (await axios.get('/price/alerts')) as ApiResponse<Array<{ status?: number }>>
    if (requestId !== latestPriceAlertCountRequestId) {
      return
    }
    if (res?.code === 200) {
      const alerts = Array.isArray(res.data) ? res.data : []
      priceAlertCount.value = alerts.filter((item) => item.status === 0).length
      priceAlertStatsAvailable.value = true
      return
    }
    priceAlertStatsAvailable.value = false
    debugError('获取降价提醒失败:', res?.message || '降价提醒返回异常')
  } catch (error) {
    if (requestId !== latestPriceAlertCountRequestId) {
      return
    }
    priceAlertStatsAvailable.value = false
    debugError('获取降价提醒失败:', error)
  }
}

const loadSellerPendingCount = async () => {
  const requestId = ++latestSellerPendingCountRequestId
  try {
    const res: any = await axios.get('/orders/seller/pending/count')
    if (requestId !== latestSellerPendingCountRequestId) {
      return
    }
    if (res?.code === 200) {
      sellerPendingCount.value = Number(res.data || 0)
      sellerPendingStatsAvailable.value = true
      return
    }
    sellerPendingStatsAvailable.value = false
    debugError('获取卖家待处理数量失败:', res?.message || '卖家待处理数量返回异常')
  } catch (error) {
    if (requestId !== latestSellerPendingCountRequestId) {
      return
    }
    sellerPendingStatsAvailable.value = false
    debugError('获取卖家待处理数量失败:', error)
  }
}

onMounted(async () => {
  syncProfileFormFromUserInfo()

  if (cartStore.items.length === 0) {
    try {
      await cartStore.fetchCart()
      cartStatsAvailable.value = true
    } catch (error) {
      cartStatsAvailable.value = false
      debugError('获取购物车失败:', error)
    }
  }

  await Promise.all([loadOrderStats(), loadPriceAlertCount(), loadSellerPendingCount()])
})
</script>

<style scoped>
.profile-page { min-height: 100vh; background: var(--white); position: relative; }
.main-content { position: relative; z-index: 1; padding: 100px 0 80px; }
.profile-layout { display: grid; grid-template-columns: 280px 1fr; gap: 24px; }
.sidebar {
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(24px);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-lg);
  box-shadow: 0 8px 32px rgba(155, 135, 245, 0.08);
  overflow: hidden;
  height: fit-content;
  position: sticky;
  top: 88px;
}
.user-card { padding: 32px 24px 24px; text-align: center; background: linear-gradient(180deg, rgba(155, 135, 245, 0.05) 0%, transparent 100%); }
.avatar-wrapper { position: relative; width: 80px; height: 80px; margin: 0 auto 16px; }
.avatar { width: 80px; height: 80px; background: var(--primary); color: var(--white); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 20px rgba(155, 135, 245, 0.4); overflow: hidden; cursor: pointer; position: relative; }
.avatar img { width: 100%; height: 100%; object-fit: cover; }
.avatar-zoom-hint { position: absolute; inset: 0; background: rgba(0, 0, 0, 0.4); display: flex; align-items: center; justify-content: center; color: #fff; opacity: 0; transition: opacity 0.3s; }
.avatar:hover .avatar-zoom-hint { opacity: 1; }
.avatar-upload { position: absolute; bottom: 0; right: 0; min-width: 36px; height: 28px; background: var(--white); border-radius: 14px; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.15); transition: all 0.3s; font-size: 12px; padding: 0 8px; }
.avatar-upload:hover { background: var(--primary); color: var(--white); }
.avatar-upload input { display: none; }
.user-card h3 { margin: 0 0 8px; font-size: 20px; font-weight: 600; color: var(--text-primary); }
.user-email { margin: 0; font-size: 14px; color: var(--text-tertiary); }
.member-stats { display: grid; grid-template-columns: repeat(3, 1fr); padding: 20px; border-bottom: 1px solid var(--gray-200); }
.stats-hint { margin: 0; padding: 0 20px 16px; font-size: 12px; color: var(--text-tertiary); border-bottom: 1px solid var(--gray-200); }
.stat-item { text-align: center; }
.stat-num { display: block; font-size: 22px; font-weight: 600; color: var(--primary); }
.stat-label { font-size: 13px; color: var(--text-tertiary); }
.sidebar-nav { padding: 12px; }
.nav-item { display: flex; align-items: center; gap: 12px; padding: 14px 18px; color: var(--text-secondary); text-decoration: none; border-radius: var(--radius-md); transition: all 0.3s; margin-bottom: 4px; font-size: 15px; }
.nav-item:hover { background: rgba(155, 135, 245, 0.1); color: var(--primary); }
.nav-item.active { background: rgba(155, 135, 245, 0.15); color: var(--primary); font-weight: 500; }
.nav-badge { display: inline-block; min-width: 18px; height: 18px; line-height: 18px; padding: 0 6px; margin-left: auto; font-size: 12px; background: #f56c6c; color: #fff; border-radius: 9px; text-align: center; }
.quick-actions { display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px; margin-bottom: 24px; }
.action-item { background: rgba(255, 255, 255, 0.92); backdrop-filter: blur(24px); border: 1px solid var(--gray-200); border-radius: var(--radius-lg); padding: 28px 20px; text-align: center; cursor: pointer; transition: all 0.4s; box-shadow: 0 4px 20px rgba(155, 135, 245, 0.08); }
.action-item:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(155, 135, 245, 0.15); border-color: var(--primary); }
.action-label { display: block; font-size: 15px; font-weight: 600; color: var(--text-primary); margin-bottom: 8px; }
.action-count { display: block; font-size: 32px; font-weight: 600; color: var(--primary); }
.panel-section { background: rgba(255, 255, 255, 0.92); backdrop-filter: blur(24px); border: 1px solid var(--gray-200); border-radius: var(--radius-lg); box-shadow: 0 4px 24px rgba(155, 135, 245, 0.08); margin-bottom: 24px; }
.section-header { display: flex; justify-content: space-between; align-items: center; padding: 24px; border-bottom: 1px solid var(--gray-200); }
.section-header h2 { margin: 0; font-size: 18px; font-weight: 600; color: var(--text-primary); }
.edit-tip { font-size: 13px; color: var(--text-tertiary); }
.section-body { padding: 24px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.profile-contact-hint {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 20px;
  padding: 14px 16px;
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
  background: rgba(155, 135, 245, 0.05);
  color: var(--text-secondary);
  font-size: 14px;
}
.inline-link { padding: 0; white-space: nowrap; }
:deep(.el-form-item__label) { font-size: 14px; color: var(--text-secondary); font-weight: 500; }
:deep(.el-input__wrapper) { border-radius: var(--radius-md); background: var(--white); border: 1px solid var(--gray-300); box-shadow: none !important; }
:deep(.el-input__wrapper:hover), :deep(.el-input__wrapper.is-focus) { border-color: var(--primary); }
.save-btn { padding: 12px 36px; background: var(--primary); color: var(--white); border: none; border-radius: var(--radius-xl); font-size: 15px; font-weight: 500; cursor: pointer; transition: all 0.3s; box-shadow: 0 4px 20px rgba(155, 135, 245, 0.3); }
.save-btn:hover { transform: translateY(-2px); }
.security-item { display: flex; justify-content: space-between; align-items: center; padding: 20px 0; border-bottom: 1px solid var(--gray-200); }
.security-item:last-child { border-bottom: none; }
.security-info h4 { margin: 0 0 4px; font-size: 15px; font-weight: 600; color: var(--text-primary); }
.security-info p { margin: 0; font-size: 14px; color: var(--text-tertiary); }
.link-btn { background: none; border: none; color: var(--primary); font-size: 14px; cursor: pointer; font-weight: 500; }
.link-btn:disabled { opacity: 0.5; cursor: not-allowed; }
:deep(.el-dialog) { border-radius: var(--radius-lg); }
:deep(.el-dialog__header) { border-bottom: 1px solid var(--gray-200); padding: 20px 24px; }
:deep(.el-dialog__body) { padding: 24px; }
:deep(.el-dialog__footer) { border-top: 1px solid var(--gray-200); padding: 16px 24px; display: flex; justify-content: flex-end; gap: 12px; }
.btn-cancel, .btn-confirm { padding: 12px 28px; border-radius: var(--radius-xl); font-size: 15px; cursor: pointer; transition: all 0.3s; }
.btn-cancel { background: transparent; border: 1px solid var(--gray-300); color: var(--text-secondary); }
.btn-confirm { background: var(--primary); border: none; color: var(--white); }
.avatar-preview-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.85); display: flex; align-items: center; justify-content: center; z-index: 2000; backdrop-filter: blur(8px); }
.avatar-preview-content { position: relative; max-width: 90vw; max-height: 90vh; }
.avatar-preview-content img { width: 300px; height: 300px; object-fit: cover; border-radius: 50%; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5); border: 4px solid rgba(255, 255, 255, 0.2); }
.preview-info { text-align: center; margin-top: 20px; color: #fff; font-size: 18px; font-weight: 500; }
.preview-close { position: absolute; top: -50px; right: -50px; width: 44px; height: 44px; background: rgba(255, 255, 255, 0.15); border: none; border-radius: 50%; color: #fff; cursor: pointer; }
.preview-enter-active, .preview-leave-active { transition: all 0.3s ease; }
.preview-enter-from, .preview-leave-to { opacity: 0; }
.preview-enter-from .avatar-preview-content, .preview-leave-to .avatar-preview-content { transform: scale(0.8); }
@media (max-width: 768px) {
  .profile-layout { grid-template-columns: 1fr; }
  .sidebar { position: static; }
  .quick-actions { grid-template-columns: repeat(2, 1fr); }
  .form-row { grid-template-columns: 1fr; }
  .profile-contact-hint { flex-direction: column; align-items: flex-start; }
}
</style>
