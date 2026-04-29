<template>
  <div class="profile-page">
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
              <h3>{{ userInfo?.nickname || userInfo?.username }}</h3>
              <p class="user-email">{{ userInfo?.email }}</p>
            </div>

            <div class="member-stats">
              <div class="stat-item">
                <span class="stat-num">{{ orderCount }}</span>
                <span class="stat-label">订单</span>
              </div>
              <div class="stat-item">
                <span class="stat-num">{{ cartCount }}</span>
                <span class="stat-label">购物车</span>
              </div>
              <div class="stat-item">
                <span class="stat-num">{{ priceAlertCount }}</span>
                <span class="stat-label">提醒</span>
              </div>
            </div>

            <nav class="sidebar-nav">
              <router-link to="/profile" class="nav-item active">个人资料</router-link>
              <router-link to="/orders" class="nav-item">我的订单</router-link>
              <router-link to="/my-products" class="nav-item">我的商品</router-link>
              <router-link to="/seller-orders" class="nav-item">
                卖家订单
                <span v-if="sellerPendingCount > 0" class="nav-badge">{{ sellerPendingCount }}</span>
              </router-link>
              <router-link to="/price-alerts" class="nav-item">
                降价提醒
                <span v-if="priceAlertCount > 0" class="nav-badge">{{ priceAlertCount }}</span>
              </router-link>
              <router-link to="/address" class="nav-item">收货地址</router-link>
              <router-link to="/settings" class="nav-item">设置</router-link>
            </nav>
          </aside>

          <div class="main-panel">
            <div class="quick-actions">
              <div class="action-item" @click="$router.push('/orders?status=0')">
                <span class="action-label">待支付</span>
                <span class="action-count">{{ pendingPayment }}</span>
              </div>
              <div class="action-item" @click="$router.push('/orders?status=1')">
                <span class="action-label">待发货</span>
                <span class="action-count">{{ pendingShipment }}</span>
              </div>
              <div class="action-item" @click="$router.push('/orders?status=2')">
                <span class="action-label">待收货</span>
                <span class="action-count">{{ pendingReceive }}</span>
              </div>
              <div class="action-item" @click="$router.push('/cart')">
                <span class="action-label">购物车</span>
                <span class="action-count">{{ cartCount }}</span>
              </div>
              <div class="action-item" @click="$router.push('/price-alerts')">
                <span class="action-label">降价提醒</span>
                <span class="action-count">{{ priceAlertCount }}</span>
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
                      <el-input v-model="profileForm.username" disabled />
                    </el-form-item>
                    <el-form-item label="昵称">
                      <el-input v-model="profileForm.nickname" placeholder="设置展示昵称" />
                    </el-form-item>
                  </div>
                  <div class="form-row">
                    <el-form-item label="邮箱">
                      <el-input v-model="profileForm.email" placeholder="用于接收通知" />
                    </el-form-item>
                    <el-form-item label="手机号">
                      <el-input v-model="profileForm.phone" placeholder="用于联系沟通" />
                    </el-form-item>
                  </div>
                  <el-form-item label="个人简介">
                    <el-input
                      v-model="profileForm.bio"
                      type="textarea"
                      :rows="3"
                      placeholder="简单介绍一下自己"
                    />
                  </el-form-item>
                  <el-form-item>
                    <button type="button" class="save-btn" @click="saveProfile">保存资料</button>
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
                  <button class="link-btn" @click="showPasswordDialog = true">修改密码</button>
                </div>
                <div class="security-item">
                  <div class="security-info">
                    <h4>绑定手机号</h4>
                    <p>{{ userInfo?.phone ? `已绑定：${maskPhone(userInfo.phone)}` : '暂未绑定手机号' }}</p>
                  </div>
                  <button class="link-btn" disabled>{{ userInfo?.phone ? '已绑定' : '暂不可用' }}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <el-dialog v-model="showPasswordDialog" title="修改密码" width="400px">
      <el-form :model="passwordForm" label-position="top">
        <el-form-item label="当前密码">
          <el-input v-model="passwordForm.currentPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="新密码">
          <el-input v-model="passwordForm.newPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="确认新密码">
          <el-input v-model="passwordForm.confirmPassword" type="password" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <button class="btn-cancel" @click="showPasswordDialog = false">取消</button>
        <button class="btn-confirm" @click="changePassword">确认</button>
      </template>
    </el-dialog>

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
import { ElMessage } from 'element-plus'
import { useUserStore } from '../stores/userStore'
import { useCartStore } from '../stores/cartStore'
import orderApi from '../api/orderApi'
import fileApi from '../api/fileApi'
import axios from '../utils/axios'
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'

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
const showPasswordDialog = ref(false)

const cartCount = computed(() => cartStore.items.length)

const profileForm = reactive({
  username: '',
  email: '',
  phone: '',
  nickname: '',
  bio: ''
})

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const previewAvatar = () => {
  showAvatarPreview.value = true
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
      await userStore.fetchCurrentUser()
      ElMessage.success(res?.message || '头像更新成功')
    } else {
      ElMessage.error(res?.message || '上传失败')
    }
  } catch (error: any) {
    console.error('头像上传失败:', error)
    ElMessage.error(error?.response?.data?.message || error?.message || '上传失败')
  }

  input.value = ''
}

const maskPhone = (phone: string) => {
  if (!phone || phone.length < 7) return phone
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`
}

const saveProfile = async () => {
  try {
    await userStore.updateUserInfo({
      email: profileForm.email,
      phone: profileForm.phone,
      nickname: profileForm.nickname,
      bio: profileForm.bio
    })
    ElMessage.success('个人资料已保存')
  } catch (error: any) {
    ElMessage.error(error?.message || '保存失败')
  }
}

const changePassword = async () => {
  if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
    ElMessage.warning('请完整填写密码信息')
    return
  }

  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    ElMessage.warning('两次输入的新密码不一致')
    return
  }

  try {
    await userStore.changePassword({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
      confirmPassword: passwordForm.confirmPassword
    })
    ElMessage.success('密码修改成功')
    showPasswordDialog.value = false
    passwordForm.currentPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
  } catch (error: any) {
    ElMessage.error(error?.message || '密码修改失败')
  }
}

const loadOrderStats = async () => {
  try {
    const res: any = await orderApi.getUserOrders()
    if (res?.code === 200) {
      const orders = Array.isArray(res.data) ? res.data : []
      orderCount.value = orders.length
      pendingPayment.value = orders.filter((item: any) => item.orderStatus === 0).length
      pendingShipment.value = orders.filter((item: any) => item.orderStatus === 1).length
      pendingReceive.value = orders.filter((item: any) => item.orderStatus === 2).length
    }
  } catch (error) {
    console.error('获取订单统计失败:', error)
  }
}

const loadPriceAlertCount = async () => {
  try {
    const res: any = await axios.get('/price/alerts')
    if (res?.code === 200) {
      const alerts = Array.isArray(res.data) ? res.data : []
      priceAlertCount.value = alerts.filter((item: any) => item.status === 0).length
    }
  } catch (error) {
    console.error('获取降价提醒失败:', error)
  }
}

const loadSellerPendingCount = async () => {
  try {
    const res: any = await axios.get('/orders/seller/pending/count')
    if (res?.code === 200) {
      sellerPendingCount.value = Number(res.data || 0)
    }
  } catch (error) {
    console.error('获取卖家待处理数量失败:', error)
  }
}

onMounted(async () => {
  if (userInfo.value) {
    profileForm.username = userInfo.value.username || ''
    profileForm.email = userInfo.value.email || ''
    profileForm.phone = userInfo.value.phone || ''
    profileForm.nickname = userInfo.value.nickname || ''
    profileForm.bio = userInfo.value.bio || ''
  }

  if (cartStore.items.length === 0) {
    try {
      await cartStore.fetchCart()
    } catch (error) {
      console.error('获取购物车失败:', error)
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
}
</style>
