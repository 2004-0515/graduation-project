<template>
  <div class="profile-page">
    <Navbar />

    <main class="main-content">
      <div class="container">
        <div class="profile-layout">
          <!-- 侧边栏 -->
          <aside class="sidebar">
            <div class="user-card">
              <div class="avatar">{{ userInitial }}</div>
              <h3>{{ userInfo?.nickname || userInfo?.username }}</h3>
              <p class="user-level">
                <span class="level-badge">{{ memberLevel }}</span>
                <span>{{ userInfo?.email }}</span>
              </p>
            </div>
            
            <!-- 会员数据 -->
            <div class="member-stats">
              <div class="stat-item">
                <span class="stat-num">{{ userInfo?.points || 0 }}</span>
                <span class="stat-label">积分</span>
              </div>
              <div class="stat-item">
                <span class="stat-num">{{ userInfo?.memberDays || 0 }}</span>
                <span class="stat-label">会员天数</span>
              </div>
              <div class="stat-item">
                <span class="stat-num">{{ orderCount }}</span>
                <span class="stat-label">订单数</span>
              </div>
            </div>

            <nav class="sidebar-nav">
              <router-link to="/profile" class="nav-item active">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
                个人信息
              </router-link>
              <router-link to="/orders" class="nav-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
                </svg>
                我的订单
              </router-link>
              <router-link to="/address" class="nav-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                收货地址
              </router-link>
              <router-link to="/settings" class="nav-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <circle cx="12" cy="12" r="3"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                </svg>
                账户设置
              </router-link>
            </nav>
          </aside>

          <!-- 主内容 -->
          <div class="main-panel">
            <!-- 快捷入口 -->
            <div class="quick-actions">
              <div class="action-item" @click="$router.push('/orders?status=0')">
                <span class="action-label">待付款</span>
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
            </div>

            <!-- 个人信息表单 -->
            <div class="panel-section">
              <div class="section-header">
                <h2>个人信息</h2>
                <span class="edit-tip">修改后请点击保存</span>
              </div>
              <div class="section-body">
                <el-form :model="profileForm" label-position="top" class="profile-form">
                  <div class="form-row">
                    <el-form-item label="用户名">
                      <el-input v-model="profileForm.username" disabled prefix-icon="User" />
                    </el-form-item>
                    <el-form-item label="昵称">
                      <el-input v-model="profileForm.nickname" placeholder="设置一个昵称" />
                    </el-form-item>
                  </div>
                  <div class="form-row">
                    <el-form-item label="邮箱">
                      <el-input v-model="profileForm.email" placeholder="用于接收通知" />
                    </el-form-item>
                    <el-form-item label="手机号">
                      <el-input v-model="profileForm.phone" placeholder="用于接收短信" />
                    </el-form-item>
                  </div>
                  <el-form-item label="个人简介">
                    <el-input v-model="profileForm.bio" type="textarea" :rows="3" placeholder="介绍一下自己吧" />
                  </el-form-item>
                  <el-form-item>
                    <button type="button" class="save-btn" @click="saveProfile">保存修改</button>
                  </el-form-item>
                </el-form>
              </div>
            </div>

            <!-- 安全设置 -->
            <div class="panel-section">
              <div class="section-header">
                <h2>安全设置</h2>
              </div>
              <div class="section-body">
                <div class="security-item">
                  <div class="security-info">
                    <h4>登录密码</h4>
                    <p>定期更换密码可以保护账户安全</p>
                  </div>
                  <button class="link-btn" @click="showPasswordDialog = true">修改密码</button>
                </div>
                <div class="security-item">
                  <div class="security-info">
                    <h4>绑定手机</h4>
                    <p>{{ userInfo?.phone ? `已绑定 ${maskPhone(userInfo.phone)}` : '未绑定手机号' }}</p>
                  </div>
                  <button class="link-btn">{{ userInfo?.phone ? '更换' : '绑定' }}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- 修改密码弹窗 -->
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
        <button class="btn-confirm" @click="changePassword">确认修改</button>
      </template>
    </el-dialog>

    <Footer />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../stores/userStore'
import { useCartStore } from '../stores/cartStore'
import orderApi from '../api/orderApi'
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'

const userStore = useUserStore()
const cartStore = useCartStore()
const userInfo = computed(() => userStore.userInfo)
const userInitial = computed(() => userInfo.value?.nickname?.charAt(0) || userInfo.value?.username?.charAt(0).toUpperCase() || 'U')

const memberLevel = computed(() => {
  const points = userInfo.value?.points || 0
  if (points >= 10000) return '钻石会员'
  if (points >= 5000) return '金牌会员'
  if (points >= 1000) return '银牌会员'
  return '普通会员'
})

const orderCount = ref(0)
const pendingPayment = ref(0)
const pendingShipment = ref(0)
const pendingReceive = ref(0)
const cartCount = computed(() => cartStore.items.length)

const showPasswordDialog = ref(false)

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

const maskPhone = (phone: string) => {
  if (!phone || phone.length < 7) return phone
  return phone.slice(0, 3) + '****' + phone.slice(-4)
}

const saveProfile = async () => {
  try {
    await userStore.updateUserInfo({
      email: profileForm.email,
      phone: profileForm.phone,
      nickname: profileForm.nickname,
      bio: profileForm.bio
    })
    ElMessage.success('保存成功')
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

const changePassword = async () => {
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    ElMessage.warning('两次密码输入不一致')
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
  } catch (error: any) {
    ElMessage.error(error.message || '修改失败')
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
  
  // 获取订单统计
  try {
    const res: any = await orderApi.getOrders(1, 100)
    if (res?.code === 200) {
      const orders = res.data?.content || res.data?.records || res.data || []
      orderCount.value = orders.length
      pendingPayment.value = orders.filter((o: any) => o.orderStatus === 0).length
      pendingShipment.value = orders.filter((o: any) => o.orderStatus === 1).length
      pendingReceive.value = orders.filter((o: any) => o.orderStatus === 2).length
    }
  } catch (e) {
    console.error('获取订单统计失败:', e)
  }
})
</script>

<style scoped>
.profile-page { min-height: 100vh; background: var(--white); position: relative; }

.profile-page::before {
  content: '';
  position: fixed;
  top: 5%;
  right: -5%;
  width: 600px;
  height: 600px;
  background: linear-gradient(135deg, #D4E8FF, #B7D4FF);
  opacity: 0.15;
  filter: blur(80px);
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
  animation: float 20s ease-in-out infinite;
}

.profile-page::after {
  content: '';
  position: fixed;
  bottom: 10%;
  left: -5%;
  width: 500px;
  height: 500px;
  background: linear-gradient(135deg, #E0F0FF, #C5D8FF);
  opacity: 0.12;
  filter: blur(80px);
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
  animation: float 20s ease-in-out infinite reverse;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -30px) scale(1.05); }
  66% { transform: translate(-20px, 20px) scale(0.95); }
}

.main-content { position: relative; z-index: 1; padding: 100px 0 80px; }
.profile-layout { display: grid; grid-template-columns: 280px 1fr; gap: 24px; }

/* Sidebar */
.sidebar { 
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(200, 220, 255, 0.5);
  border-radius: var(--radius-lg);
  box-shadow: 0 8px 32px rgba(90, 143, 212, 0.08);
  overflow: hidden;
  height: fit-content;
  position: sticky;
  top: 88px;
}

.user-card { padding: 32px 24px 24px; text-align: center; background: linear-gradient(180deg, rgba(230, 242, 255, 0.5) 0%, transparent 100%); }
.avatar { width: 80px; height: 80px; margin: 0 auto 16px; background: linear-gradient(135deg, var(--sakura), #5A8FD4); color: #fff; font-size: 32px; font-weight: 600; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 16px rgba(90, 143, 212, 0.4); }
.user-card h3 { margin: 0 0 8px; font-size: 20px; font-weight: 600; color: var(--text-title); }
.user-level { margin: 0; font-size: 14px; color: var(--text-muted); display: flex; flex-direction: column; gap: 6px; align-items: center; }
.level-badge { display: inline-block; padding: 4px 14px; background: linear-gradient(135deg, var(--sakura), #5A8FD4); color: #fff; border-radius: 12px; font-size: 12px; font-weight: 500; }

.member-stats { display: grid; grid-template-columns: repeat(3, 1fr); padding: 20px; border-bottom: 1px solid rgba(200, 220, 255, 0.3); }
.stat-item { text-align: center; }
.stat-num { display: block; font-size: 22px; font-weight: 600; color: #5A8FD4; }
.stat-label { font-size: 13px; color: var(--text-muted); }

.sidebar-nav { padding: 12px; }
.nav-item { display: flex; align-items: center; gap: 12px; padding: 14px 18px; color: var(--text-body); text-decoration: none; border-radius: var(--radius-md); transition: all 0.3s; margin-bottom: 4px; font-size: 15px; }
.nav-item:hover { background: rgba(230, 242, 255, 0.5); color: var(--sakura); }
.nav-item.active { background: rgba(230, 242, 255, 0.6); color: #5A8FD4; }

/* Main Panel */
.quick-actions { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
.action-item { 
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(24px);
  border: 2px solid rgba(90, 143, 212, 0.4);
  border-radius: var(--radius-lg);
  padding: 28px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.4s;
  box-shadow: 0 4px 20px rgba(90, 143, 212, 0.12);
}
.action-item:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(90, 143, 212, 0.2); border-color: var(--sakura); }
.action-label { display: block; font-size: 15px; font-weight: 600; color: var(--text-title); margin-bottom: 8px; }
.action-count { display: block; font-size: 32px; font-weight: 600; color: #5A8FD4; }

.panel-section { 
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(24px);
  border: 2px solid rgba(90, 143, 212, 0.35);
  border-radius: var(--radius-lg);
  box-shadow: 0 4px 24px rgba(90, 143, 212, 0.1);
  margin-bottom: 24px;
}
.section-header { display: flex; justify-content: space-between; align-items: center; padding: 24px; border-bottom: 1px solid rgba(200, 220, 255, 0.3); }
.section-header h2 { margin: 0; font-size: 18px; font-weight: 600; color: var(--text-title); }
.edit-tip { font-size: 13px; color: var(--text-muted); }
.section-body { padding: 24px; }

.profile-form { max-width: 100%; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
:deep(.el-form-item__label) { font-size: 14px; color: var(--text-body); font-weight: 500; }
:deep(.el-input__wrapper) { border-radius: var(--radius-md); background: rgba(255, 255, 255, 0.6); border: 1px solid rgba(200, 220, 255, 0.4); box-shadow: none !important; }
:deep(.el-input__wrapper:hover), :deep(.el-input__wrapper.is-focus) { border-color: var(--sakura); }

.save-btn { 
  padding: 12px 36px; 
  background: linear-gradient(135deg, #9EC5FF 0%, #B8D4FF 50%, #C8E0FF 100%);
  color: #fff; 
  border: none; 
  border-radius: var(--radius-xl); 
  font-size: 15px; 
  font-weight: 500; 
  cursor: pointer; 
  transition: all 0.3s;
  box-shadow: 0 4px 15px rgba(90, 143, 212, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.4);
  text-shadow: 0 1px 2px rgba(70, 110, 170, 0.3);
}
.save-btn:hover { 
  background: linear-gradient(135deg, #A8CDFF 0%, #C2DCFF 50%, #D2E8FF 100%);
  box-shadow: 0 6px 25px rgba(90, 143, 212, 0.5), 0 0 20px rgba(143, 180, 230, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.5);
  transform: translateY(-2px); 
}

.security-item { display: flex; justify-content: space-between; align-items: center; padding: 20px 0; border-bottom: 1px solid rgba(200, 220, 255, 0.3); }
.security-item:last-child { border-bottom: none; }
.security-info h4 { margin: 0 0 4px; font-size: 15px; font-weight: 600; color: var(--text-title); }
.security-info p { margin: 0; font-size: 14px; color: var(--text-muted); }
.link-btn { background: none; border: none; color: var(--sakura); font-size: 14px; cursor: pointer; font-weight: 500; }
.link-btn:hover { text-decoration: underline; }

:deep(.el-dialog) { border-radius: var(--radius-lg); }
:deep(.el-dialog__header) { border-bottom: 1px solid rgba(200, 220, 255, 0.3); padding: 20px 24px; }
:deep(.el-dialog__body) { padding: 24px; }
:deep(.el-dialog__footer) { border-top: 1px solid rgba(200, 220, 255, 0.3); padding: 16px 24px; display: flex; justify-content: flex-end; gap: 12px; }
.btn-cancel, .btn-confirm { padding: 12px 28px; border-radius: var(--radius-xl); font-size: 15px; cursor: pointer; transition: all 0.3s; }
.btn-cancel { background: transparent; border: 1px solid rgba(200, 200, 220, 0.4); color: var(--text-body); }
.btn-confirm { 
  background: linear-gradient(135deg, #9EC5FF 0%, #B8D4FF 50%, #C8E0FF 100%);
  border: none; 
  color: #fff;
  box-shadow: 0 4px 15px rgba(90, 143, 212, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.4);
}
.btn-confirm:hover {
  background: linear-gradient(135deg, #A8CDFF 0%, #C2DCFF 50%, #D2E8FF 100%);
  box-shadow: 0 6px 25px rgba(90, 143, 212, 0.5);
  transform: translateY(-2px);
}

@media (max-width: 768px) {
  .profile-layout { grid-template-columns: 1fr; }
  .sidebar { position: static; }
  .quick-actions { grid-template-columns: repeat(2, 1fr); }
  .form-row { grid-template-columns: 1fr; }
}
</style>
