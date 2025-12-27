<template>
  <div class="settings-page">
    <Navbar />
    <main class="main-content">
      <div class="container">
        <!-- 页面头部 -->
        <div class="page-header">
          <h1>⚙️ 账户设置</h1>
          <p>管理您的账户信息和偏好设�?/p>
        </div>

        <div class="settings-layout">
          <!-- 侧边导航 -->
          <aside class="settings-nav">
            <div 
              v-for="section in navSections" 
              :key="section.id"
              :class="['nav-item', { active: activeSection === section.id }]"
              @click="activeSection = section.id"
            >
              <span class="nav-icon">{{ section.icon }}</span>
              <span class="nav-text">{{ section.label }}</span>
            </div>
          </aside>

          <!-- 设置内容 -->
          <div class="settings-content">
            <!-- 账户安全 -->
            <div class="settings-card" v-show="activeSection === 'security'">
              <div class="card-header">
                <h3>🔐 账户安全</h3>
                <p>保护您的账户安全</p>
              </div>
              <div class="card-body">
                <div class="form-section">
                  <h4>修改密码</h4>
                  <el-form :model="passwordForm" label-position="top" class="setting-form">
                    <el-form-item label="当前密码">
                      <el-input v-model="passwordForm.oldPassword" type="password" show-password placeholder="请输入当前密�? />
                    </el-form-item>
                    <el-form-item label="新密�?>
                      <el-input v-model="passwordForm.newPassword" type="password" show-password placeholder="请输入新密码（至�?位）" />
                    </el-form-item>
                    <el-form-item label="确认新密�?>
                      <el-input v-model="passwordForm.confirmPassword" type="password" show-password placeholder="请再次输入新密码" />
                    </el-form-item>
                    <el-form-item>
                      <button type="button" class="primary-btn" @click="changePassword">修改密码</button>
                    </el-form-item>
                  </el-form>
                </div>

                <div class="divider"></div>

                <div class="security-items">
                  <div class="security-item">
                    <div class="item-info">
                      <span class="item-icon">📱</span>
                      <div class="item-text">
                        <h5>手机绑定</h5>
                        <p>{{ userStore.userInfo?.phone || '未绑�? }}</p>
                      </div>
                    </div>
                    <button class="link-btn">{{ userStore.userInfo?.phone ? '更换' : '绑定' }}</button>
                  </div>
                  <div class="security-item">
                    <div class="item-info">
                      <span class="item-icon">📧</span>
                      <div class="item-text">
                        <h5>邮箱绑定</h5>
                        <p>{{ userStore.userInfo?.email || '未绑�? }}</p>
                      </div>
                    </div>
                    <button class="link-btn">{{ userStore.userInfo?.email ? '更换' : '绑定' }}</button>
                  </div>
                  <div class="security-item">
                    <div class="item-info">
                      <span class="item-icon">🔑</span>
                      <div class="item-text">
                        <h5>登录设备</h5>
                        <p>当前设备：Windows Chrome</p>
                      </div>
                    </div>
                    <button class="link-btn">管理</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- 通知设置 -->
            <div class="settings-card" v-show="activeSection === 'notification'">
              <div class="card-header">
                <h3>🔔 通知设置</h3>
                <p>管理您接收的通知类型</p>
              </div>
              <div class="card-body">
                <div class="setting-item" v-for="item in notificationItems" :key="item.key">
                  <div class="item-info">
                    <span class="item-icon">{{ item.icon }}</span>
                    <div class="item-text">
                      <h5>{{ item.title }}</h5>
                      <p>{{ item.desc }}</p>
                    </div>
                  </div>
                  <el-switch v-model="notifySettings[item.key]" />
                </div>
              </div>
            </div>

            <!-- 隐私设置 -->
            <div class="settings-card" v-show="activeSection === 'privacy'">
              <div class="card-header">
                <h3>🛡�?隐私设置</h3>
                <p>控制您的隐私和数�?/p>
              </div>
              <div class="card-body">
                <div class="setting-item">
                  <div class="item-info">
                    <span class="item-icon">👤</span>
                    <div class="item-text">
                      <h5>个人资料可见�?/h5>
                      <p>控制谁可以看到您的个人资�?/p>
                    </div>
                  </div>
                  <el-select v-model="privacySettings.profileVisibility" size="small">
                    <el-option label="所有人" value="public" />
                    <el-option label="仅好�? value="friends" />
                    <el-option label="仅自�? value="private" />
                  </el-select>
                </div>
                <div class="setting-item">
                  <div class="item-info">
                    <span class="item-icon">📊</span>
                    <div class="item-text">
                      <h5>购买记录</h5>
                      <p>是否在个人主页展示购买记�?/p>
                    </div>
                  </div>
                  <el-switch v-model="privacySettings.showPurchases" />
                </div>
                <div class="setting-item">
                  <div class="item-info">
                    <span class="item-icon">🍪</span>
                    <div class="item-text">
                      <h5>个性化推荐</h5>
                      <p>根据您的浏览记录推荐商品</p>
                    </div>
                  </div>
                  <el-switch v-model="privacySettings.personalization" />
                </div>
              </div>
            </div>

            <!-- 外观设置 -->
            <div class="settings-card" v-show="activeSection === 'appearance'">
              <div class="card-header">
                <h3>🎨 外观设置</h3>
                <p>自定义您的界面外�?/p>
              </div>
              <div class="card-body">
                <div class="theme-section">
                  <h4>主题模式</h4>
                  <div class="theme-options">
                    <div 
                      v-for="theme in themes" 
                      :key="theme.value"
                      :class="['theme-option', { active: currentTheme === theme.value }]"
                      @click="currentTheme = theme.value"
                    >
                      <span class="theme-icon">{{ theme.icon }}</span>
                      <span class="theme-name">{{ theme.label }}</span>
                    </div>
                  </div>
                </div>
                <div class="divider"></div>
                <div class="setting-item">
                  <div class="item-info">
                    <span class="item-icon">🔤</span>
                    <div class="item-text">
                      <h5>字体大小</h5>
                      <p>调整页面文字大小</p>
                    </div>
                  </div>
                  <el-select v-model="appearanceSettings.fontSize" size="small">
                    <el-option label="�? value="small" />
                    <el-option label="标准" value="medium" />
                    <el-option label="�? value="large" />
                  </el-select>
                </div>
              </div>
            </div>

            <!-- 账户操作 -->
            <div class="settings-card danger-zone" v-show="activeSection === 'account'">
              <div class="card-header">
                <h3>⚠️ 账户操作</h3>
                <p>请谨慎操�?/p>
              </div>
              <div class="card-body">
                <div class="action-item">
                  <div class="action-info">
                    <h5>退出登�?/h5>
                    <p>退出当前账户，需要重新登�?/p>
                  </div>
                  <button class="logout-btn" @click="handleLogout">退出登�?/button>
                </div>
                <div class="action-item danger">
                  <div class="action-info">
                    <h5>注销账户</h5>
                    <p>永久删除您的账户和所有数据，此操作不可恢�?/p>
                  </div>
                  <button class="delete-btn" @click="handleDeleteAccount">注销账户</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
    <Footer />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '../stores/userStore'
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'

const router = useRouter()
const userStore = useUserStore()

const activeSection = ref('security')

const navSections = [
  { id: 'security', label: '账户安全', icon: '🔐' },
  { id: 'notification', label: '通知设置', icon: '🔔' },
  { id: 'privacy', label: '隐私设置', icon: '🛡�? },
  { id: 'appearance', label: '外观设置', icon: '🎨' },
  { id: 'account', label: '账户操作', icon: '⚙️' },
]

const notificationItems = [
  { key: 'order', title: '订单通知', desc: '接收订单状态变更通知', icon: '📦' },
  { key: 'promotion', title: '促销通知', desc: '接收优惠活动和促销信息', icon: '🎁' },
  { key: 'system', title: '系统通知', desc: '接收系统公告和安全提�?, icon: '📢' },
  { key: 'logistics', title: '物流通知', desc: '接收包裹配送状态更�?, icon: '🚚' },
  { key: 'comment', title: '评论回复', desc: '有人回复您的评论时通知', icon: '💬' },
]

const themes = [
  { value: 'light', label: '浅色', icon: '☀�? },
  { value: 'dark', label: '深色', icon: '🌙' },
  { value: 'auto', label: '跟随系统', icon: '💻' },
]

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const notifySettings = reactive<Record<string, boolean>>({
  order: true,
  promotion: true,
  system: true,
  logistics: true,
  comment: false,
})

const privacySettings = reactive({
  profileVisibility: 'public',
  showPurchases: false,
  personalization: true,
})

const appearanceSettings = reactive({
  fontSize: 'medium',
})

const currentTheme = ref('light')

const changePassword = () => {
  if (!passwordForm.oldPassword || !passwordForm.newPassword) {
    ElMessage.warning('请填写完�?)
    return
  }
  if (passwordForm.newPassword.length < 6) {
    ElMessage.warning('新密码至�?�?)
    return
  }
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    ElMessage.warning('两次输入的密码不一�?)
    return
  }
  ElMessage.success('密码修改成功')
  passwordForm.oldPassword = ''
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
}

const handleLogout = () => {
  ElMessageBox.confirm('确定要退出登录吗�?, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    userStore.logout()
    ElMessage.success('已退出登�?)
    router.push('/')
  }).catch(() => {})
}

const handleDeleteAccount = () => {
  ElMessageBox.confirm('注销账户后，您的所有数据将被永久删除且无法恢复。确定要继续吗？', '危险操作', {
    confirmButtonText: '确定注销',
    cancelButtonText: '取消',
    type: 'error',
  }).then(() => {
    ElMessage.info('账户注销功能暂未开�?)
  }).catch(() => {})
}
</script>

<style scoped>
.settings-page { min-height: 100vh; background: var(--white); position: relative; }

.settings-page::before {
  content: '';
  position: fixed;
  top: 5%;
  right: -10%;
  width: 600px;
  height: 600px;
  background: linear-gradient(135deg, #D4E8FF, #B7D4FF);
  opacity: 0.15;
  filter: blur(80px);
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
  animation: floatAnim 20s ease-in-out infinite;
}

.settings-page::after {
  content: '';
  position: fixed;
  bottom: 5%;
  left: -10%;
  width: 500px;
  height: 500px;
  background: linear-gradient(135deg, #E0F0FF, #C5D8FF);
  opacity: 0.12;
  filter: blur(80px);
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
  animation: floatAnim 20s ease-in-out infinite reverse;
}

@keyframes floatAnim {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -30px) scale(1.05); }
  66% { transform: translate(-20px, 20px) scale(0.95); }
}

.main-content { position: relative; z-index: 1; padding: 100px 0 80px; }
.container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }

/* 页面头部 */
.page-header { margin-bottom: 32px; }
.page-header h1 { font-size: 2rem; font-weight: 600; color: var(--text-title); margin: 0 0 6px; }
.page-header p { font-size: 15px; color: var(--text-muted); margin: 0; }

/* 布局 */
.settings-layout { display: grid; grid-template-columns: 220px 1fr; gap: 24px; }

/* 侧边导航 */
.settings-nav { 
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(200, 220, 255, 0.5);
  border-radius: var(--radius-lg);
  padding: 16px;
  height: fit-content;
  position: sticky;
  top: 88px;
}
.nav-item { display: flex; align-items: center; gap: 12px; padding: 14px 18px; border-radius: var(--radius-md); cursor: pointer; transition: all 0.3s; margin-bottom: 4px; }
.nav-item:last-child { margin-bottom: 0; }
.nav-item:hover { background: rgba(230, 242, 255, 0.5); }
.nav-item.active { background: rgba(230, 242, 255, 0.6); color: #5A8FD4; }
.nav-icon { font-size: 18px; }
.nav-text { font-size: 15px; font-weight: 500; color: var(--text-body); }
.nav-item.active .nav-text { color: #5A8FD4; font-weight: 600; }

/* 设置卡片 */
.settings-card { 
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(200, 220, 255, 0.5);
  border-radius: var(--radius-lg);
  box-shadow: 0 8px 32px rgba(90, 143, 212, 0.08);
  margin-bottom: 20px;
  overflow: hidden;
}
.card-header { padding: 24px; border-bottom: 1px solid rgba(200, 220, 255, 0.3); }
.card-header h3 { font-size: 20px; font-weight: 600; color: var(--text-title); margin: 0 0 4px; }
.card-header p { font-size: 14px; color: var(--text-muted); margin: 0; }
.card-body { padding: 24px; }

/* 表单 */
.form-section h4 { font-size: 16px; font-weight: 600; color: var(--text-title); margin: 0 0 16px; }
.setting-form { max-width: 400px; }
:deep(.el-form-item__label) { font-size: 14px; color: var(--text-body); font-weight: 500; }
:deep(.el-input__wrapper) { border-radius: var(--radius-md); background: rgba(255, 255, 255, 0.6); border: 1px solid rgba(200, 220, 255, 0.4); box-shadow: none !important; }
:deep(.el-input__wrapper:hover), :deep(.el-input__wrapper.is-focus) { border-color: var(--sakura); }
.primary-btn { padding: 12px 36px; background: linear-gradient(135deg, var(--sakura), #5A8FD4); color: white; border: none; border-radius: var(--radius-xl); font-size: 15px; cursor: pointer; transition: all 0.3s; }
.primary-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(90, 143, 212, 0.4); }

.divider { height: 1px; background: rgba(200, 220, 255, 0.3); margin: 24px 0; }

/* 安全项目 */
.security-items { display: flex; flex-direction: column; gap: 12px; }
.security-item { display: flex; justify-content: space-between; align-items: center; padding: 20px; background: rgba(245, 250, 255, 0.5); border-radius: var(--radius-md); }
.item-info { display: flex; align-items: center; gap: 14px; }
.item-icon { font-size: 28px; }
.item-text h5 { font-size: 15px; font-weight: 600; color: var(--text-title); margin: 0 0 2px; }
.item-text p { font-size: 14px; color: var(--text-muted); margin: 0; }
.link-btn { padding: 10px 20px; background: transparent; border: 1px solid var(--sakura); color: var(--sakura); border-radius: 24px; font-size: 14px; cursor: pointer; transition: all 0.3s; }
.link-btn:hover { background: var(--sakura); color: white; }

/* 设置�?*/
.setting-item { display: flex; justify-content: space-between; align-items: center; padding: 20px 0; border-bottom: 1px solid rgba(200, 220, 255, 0.3); }
.setting-item:last-child { border-bottom: none; }

/* 主题选择 */
.theme-section h4 { font-size: 16px; font-weight: 600; color: var(--text-title); margin: 0 0 16px; }
.theme-options { display: flex; gap: 16px; }
.theme-option { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 24px 36px; background: rgba(245, 250, 255, 0.5); border: 2px solid transparent; border-radius: var(--radius-md); cursor: pointer; transition: all 0.3s; }
.theme-option:hover { border-color: rgba(90, 143, 212, 0.4); }
.theme-option.active { border-color: var(--sakura); background: rgba(230, 242, 255, 0.5); }
.theme-icon { font-size: 32px; }
.theme-name { font-size: 14px; color: var(--text-body); }
.theme-option.active .theme-name { color: #5A8FD4; font-weight: 600; }

/* 危险区域 */
.danger-zone .card-header { background: rgba(255, 240, 240, 0.5); }
.danger-zone .card-header h3 { color: #e74c3c; }
.action-item { display: flex; justify-content: space-between; align-items: center; padding: 24px; background: rgba(245, 250, 255, 0.5); border-radius: var(--radius-md); margin-bottom: 12px; }
.action-item:last-child { margin-bottom: 0; }
.action-item.danger { background: rgba(255, 240, 240, 0.5); }
.action-info h5 { font-size: 16px; font-weight: 600; color: var(--text-title); margin: 0 0 4px; }
.action-info p { font-size: 14px; color: var(--text-muted); margin: 0; }
.logout-btn { padding: 12px 28px; background: transparent; border: 1px solid var(--text-muted); color: var(--text-body); border-radius: 24px; font-size: 15px; cursor: pointer; transition: all 0.3s; }
.logout-btn:hover { background: var(--text-muted); color: white; }
.delete-btn { padding: 12px 28px; background: transparent; border: 1px solid #e74c3c; color: #e74c3c; border-radius: 24px; font-size: 15px; cursor: pointer; transition: all 0.3s; }
.delete-btn:hover { background: #e74c3c; color: white; }

/* 响应�?*/
@media (max-width: 768px) {
  .settings-layout { grid-template-columns: 1fr; }
  .settings-nav { position: static; display: flex; overflow-x: auto; padding: 12px; gap: 8px; }
  .nav-item { flex-shrink: 0; padding: 10px 16px; margin-bottom: 0; }
  .theme-options { flex-wrap: wrap; }
  .theme-option { flex: 1; min-width: 100px; }
}
</style>
