<template>
  <div class="settings-page" data-testid="settings-view">
    <Navbar />
    <main class="main-content">
      <div class="container">
        <div class="page-header">
          <h1>账户设置</h1>
          <p>管理您的账户信息和偏好设置</p>
        </div>

        <div class="settings-layout">
          <aside class="settings-nav">
            <div 
              v-for="section in navSections" 
              :key="section.id"
              :class="['nav-item', { active: activeSection === section.id }]"
              :data-testid="`settings-nav-${section.id}`"
              @click="activeSection = section.id"
            >
              <span class="nav-icon">{{ section.icon }}</span>
              <span class="nav-text">{{ section.label }}</span>
            </div>
          </aside>

          <div class="settings-content">
            <div class="settings-card" data-testid="settings-section-security" v-show="activeSection === 'security'">
              <div class="card-header">
                <h3>账户安全</h3>
                <p>保护您的账户安全</p>
              </div>
              <div class="card-body">
                <div class="form-section">
                  <h4>修改密码</h4>
                  <el-form :model="passwordForm" label-position="top" class="setting-form">
                    <el-form-item label="当前密码">
                      <el-input v-model="passwordForm.oldPassword" type="password" show-password placeholder="请输入当前密码" />
                    </el-form-item>
                    <el-form-item label="新密码">
                      <el-input v-model="passwordForm.newPassword" type="password" show-password placeholder="请输入新密码" />
                    </el-form-item>
                    <el-form-item label="确认新密码">
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
                      <span class="item-icon">手机</span>
                      <div class="item-text">
                        <h5>手机绑定</h5>
                        <p>{{ userStore.userInfo?.phone || '未绑定' }}</p>
                      </div>
                    </div>
                    <button class="link-btn" data-testid="settings-open-phone-dialog" @click="openPhoneDialog">{{ userStore.userInfo?.phone ? '更换' : '绑定' }}</button>
                  </div>
                  <div class="security-item">
                    <div class="item-info">
                      <span class="item-icon">邮箱</span>
                      <div class="item-text">
                        <h5>邮箱绑定</h5>
                        <p>{{ userStore.userInfo?.email || '未绑定' }}</p>
                      </div>
                    </div>
                    <button class="link-btn" data-testid="settings-open-email-dialog" @click="openEmailDialog">{{ userStore.userInfo?.email ? '更换' : '绑定' }}</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- 手机绑定弹窗 -->
            <el-dialog v-model="phoneDialogVisible" title="绑定手机" width="400px">
              <el-form :model="phoneForm" label-position="top">
                <el-form-item label="手机号码">
                  <el-input v-model="phoneForm.phone" placeholder="请输入手机号码" maxlength="11" />
                </el-form-item>
              </el-form>
              <template #footer>
                <el-button @click="closePhoneDialog">取消</el-button>
                <el-button type="primary" @click="savePhone" :loading="saving">确定</el-button>
              </template>
            </el-dialog>

            <!-- 邮箱绑定弹窗 -->
            <el-dialog v-model="emailDialogVisible" title="绑定邮箱" width="400px">
              <el-form :model="emailForm" label-position="top">
                <el-form-item label="邮箱地址">
                  <el-input v-model="emailForm.email" placeholder="请输入邮箱地址" />
                </el-form-item>
              </el-form>
              <template #footer>
                <el-button @click="closeEmailDialog">取消</el-button>
                <el-button type="primary" @click="saveEmail" :loading="saving">确定</el-button>
              </template>
            </el-dialog>

            <div class="settings-card" data-testid="settings-section-notification" v-show="activeSection === 'notification'">
              <div class="card-header">
                <h3>通知设置</h3>
                <p>管理您接收的通知类型</p>
                <span v-if="notificationSyncText" class="sync-status" :class="notificationSaveState">
                  {{ notificationSyncText }}
                </span>
              </div>
              <div class="card-body">
                <div
                  class="setting-item"
                  v-for="item in notificationItems"
                  :key="item.key"
                  :data-testid="`settings-notify-item-${item.key}`"
                >
                  <div class="item-info">
                    <span class="item-icon">{{ item.icon }}</span>
                    <div class="item-text">
                      <h5>{{ item.title }}</h5>
                      <p>{{ item.desc }}</p>
                    </div>
                  </div>
                  <el-switch
                    v-model="notifySettings[item.key]"
                    :data-testid="`settings-notify-switch-${item.key}`"
                  />
                </div>
              </div>
            </div>

            <div class="settings-card" data-testid="settings-section-privacy" v-show="activeSection === 'privacy'">
              <div class="card-header">
                <h3>隐私设置</h3>
                <p>控制您的隐私和数据</p>
                <span v-if="privacySyncText" class="sync-status" :class="privacySaveState">
                  {{ privacySyncText }}
                </span>
              </div>
              <div class="card-body">
                <div class="setting-item">
                  <div class="item-info">
                    <span class="item-icon">用户</span>
                    <div class="item-text">
                      <h5>个人资料可见性</h5>
                      <p>控制谁可以看到您的个人资料</p>
                    </div>
                  </div>
                  <el-select
                    v-model="privacySettings.profileVisibility"
                    size="small"
                    data-testid="settings-privacy-visibility"
                  >
                    <el-option label="所有人" value="public" />
                    <el-option label="仅好友" value="friends" />
                    <el-option label="仅自己" value="private" />
                  </el-select>
                </div>
                <p class="settings-hint">
                  当前服务器已接入的隐私项只有资料可见性。主题和字号仅保存在当前浏览器。
                </p>
              </div>
            </div>

            <div class="settings-card" data-testid="settings-section-appearance" v-show="activeSection === 'appearance'">
              <div class="card-header">
                <h3>外观设置</h3>
                <p>仅在当前浏览器保存和生效</p>
                <span class="scope-badge">仅当前浏览器</span>
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
                    <span class="item-icon">字体</span>
                    <div class="item-text">
                      <h5>字体大小</h5>
                      <p>调整页面文字大小</p>
                    </div>
                  </div>
                  <el-select v-model="appearanceSettings.fontSize" size="small">
                    <el-option label="小" value="small" />
                    <el-option label="标准" value="medium" />
                    <el-option label="大" value="large" />
                  </el-select>
                </div>
              </div>
            </div>

            <div class="settings-card danger-zone" data-testid="settings-section-account" v-show="activeSection === 'account'">
              <div class="card-header">
                <h3>账户操作</h3>
                <p>请谨慎操作</p>
              </div>
              <div class="card-body">
                <div class="action-item">
                  <div class="action-info">
                    <h5>退出登录</h5>
                    <p>退出当前账户，需要重新登录</p>
                  </div>
                  <button class="logout-btn" data-testid="settings-logout" @click="handleLogout">退出登录</button>
                </div>
                <div class="action-item danger">
                  <div class="action-info">
                    <h5>注销账户</h5>
                    <p>仅当账号没有订单、卖家商品、卖家订单项或评价时才可注销；其余个人资料会一并清理。</p>
                  </div>
                  <button class="delete-btn" data-testid="settings-delete-account" @click="handleDeleteAccount">注销账户</button>
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
import { computed, nextTick, ref, reactive, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '../stores/userStore'
import settingsApi from '../api/settingsApi'
import { debugError } from '../utils/debug'
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const activeSection = ref('security')
const loading = ref(false)
type AccountSyncState = 'idle' | 'saving' | 'saved' | 'error'
type NotificationSettingsState = {
  order: boolean
  promotion: boolean
  system: boolean
  logistics: boolean
  comment: boolean
}

type PrivacySettingsState = {
  profileVisibility: 'public' | 'friends' | 'private'
}

const navSections = [
  { id: 'security', label: '账户安全', icon: '安全' },
  { id: 'notification', label: '通知设置', icon: '通知' },
  { id: 'privacy', label: '隐私设置', icon: '隐私' },
  { id: 'appearance', label: '外观设置', icon: '外观' },
  { id: 'account', label: '账户操作', icon: '账户' },
]

const notificationItems: Array<{ key: keyof NotificationSettingsState; title: string; desc: string; icon: string }> = [
  { key: 'order', title: '订单通知', desc: '接收订单状态变更通知', icon: '订单' },
  { key: 'promotion', title: '促销通知', desc: '接收优惠活动和促销信息', icon: '促销' },
  { key: 'system', title: '系统通知', desc: '接收系统公告和安全提醒', icon: '系统' },
  { key: 'logistics', title: '物流通知', desc: '接收包裹配送状态更新', icon: '物流' }
]

const themes = [
  { value: 'light', label: '浅色', icon: '日' },
  { value: 'dark', label: '深色', icon: '夜' },
  { value: 'auto', label: '跟随系统', icon: '自动' },
]
const validFontSizes = new Set(['small', 'medium', 'large'])
const validThemes = new Set(['light', 'dark', 'auto'])
const removeAppearanceStorage = (key: 'fontSize' | 'theme') => {
  try {
    localStorage.removeItem(key)
  } catch (error) {
    debugError(`清理${key === 'fontSize' ? '字体大小' : '主题'}设置失败:`, error)
  }
}

const passwordForm = reactive({ oldPassword: '', newPassword: '', confirmPassword: '' })
const notifySettings = reactive<NotificationSettingsState>({
  order: true,
  promotion: true,
  system: true,
  logistics: true,
  comment: false
})
const privacySettings = reactive<PrivacySettingsState>({ profileVisibility: 'public' })
const appearanceSettings = reactive({ fontSize: 'medium' })
const currentTheme = ref('light')
let systemThemeMediaQuery: MediaQueryList | null = null
let systemThemeChangeHandler: ((event: MediaQueryListEvent) => void) | null = null

// 手机和邮箱绑定
const phoneDialogVisible = ref(false)
const emailDialogVisible = ref(false)
const saving = ref(false)
const phoneForm = reactive({ phone: '' })
const emailForm = reactive({ email: '' })
const notificationSettingsReady = ref(false)
const privacySettingsReady = ref(false)
const notificationSaveState = ref<AccountSyncState>('idle')
const privacySaveState = ref<AccountSyncState>('idle')
let latestNotificationSettingsRequestId = 0
let latestPrivacySettingsRequestId = 0
let skipNotificationSave = false
let skipPrivacySave = false
const confirmedNotificationSettings = reactive<NotificationSettingsState>({
  order: true,
  promotion: true,
  system: true,
  logistics: true,
  comment: false
})
const confirmedPrivacySettings = reactive<PrivacySettingsState>({ profileVisibility: 'public' })

const getSyncStateText = (state: AccountSyncState) => {
  if (state === 'saving') return '保存中'
  if (state === 'saved') return '已同步到账号'
  if (state === 'error') return '保存失败并回退'
  return ''
}

const notificationSyncText = computed(() => getSyncStateText(notificationSaveState.value))
const privacySyncText = computed(() => getSyncStateText(privacySaveState.value))

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === 'object') {
    const response = (error as { response?: { data?: { message?: string } } }).response
    const message = (error as { message?: string }).message
    return response?.data?.message || message || fallback
  }
  return fallback
}

const getResponseMessage = (response: { message?: string } | null | undefined, fallback: string) =>
  response?.message || fallback

const snapshotNotificationSettings = (): NotificationSettingsState => ({
  order: notifySettings.order,
  promotion: notifySettings.promotion,
  system: notifySettings.system,
  logistics: notifySettings.logistics,
  comment: notifySettings.comment
})

const applyNotificationSettings = (snapshot: NotificationSettingsState) => {
  skipNotificationSave = true
  notifySettings.order = snapshot.order
  notifySettings.promotion = snapshot.promotion
  notifySettings.system = snapshot.system
  notifySettings.logistics = snapshot.logistics
  notifySettings.comment = snapshot.comment
  void nextTick(() => {
    skipNotificationSave = false
  })
}

const snapshotPrivacySettings = (): PrivacySettingsState => ({
  profileVisibility: privacySettings.profileVisibility
})

const applyPrivacySettings = (snapshot: PrivacySettingsState) => {
  skipPrivacySave = true
  privacySettings.profileVisibility = snapshot.profileVisibility
  void nextTick(() => {
    skipPrivacySave = false
  })
}

const openPhoneDialog = () => {
  phoneForm.phone = userStore.userInfo?.phone || ''
  phoneDialogVisible.value = true
}

const openEmailDialog = () => {
  emailForm.email = userStore.userInfo?.email || ''
  emailDialogVisible.value = true
}

const closePhoneDialog = () => {
  phoneDialogVisible.value = false
  phoneForm.phone = ''
}

const closeEmailDialog = () => {
  emailDialogVisible.value = false
  emailForm.email = ''
}

const savePhone = async () => {
  if (!phoneForm.phone) {
    ElMessage.warning('请输入手机号码')
    return
  }
  if (!/^1[3-9]\d{9}$/.test(phoneForm.phone)) {
    ElMessage.warning('请输入正确的手机号码')
    return
  }
  saving.value = true
  try {
    await userStore.updateUserInfo({ phone: phoneForm.phone })
    ElMessage.success('手机绑定成功')
    closePhoneDialog()
  } catch (error) {
    debugError('保存手机号失败:', error)
    ElMessage.error(getErrorMessage(error, '绑定失败'))
  } finally {
    saving.value = false
  }
}

const saveEmail = async () => {
  if (!emailForm.email) {
    ElMessage.warning('请输入邮箱地址')
    return
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailForm.email)) {
    ElMessage.warning('请输入正确的邮箱地址')
    return
  }
  saving.value = true
  try {
    await userStore.updateUserInfo({ email: emailForm.email })
    ElMessage.success('邮箱绑定成功')
    closeEmailDialog()
  } catch (error) {
    debugError('保存邮箱失败:', error)
    ElMessage.error(getErrorMessage(error, '绑定失败'))
  } finally {
    saving.value = false
  }
}

const loadNotificationSettings = async () => {
  const requestId = ++latestNotificationSettingsRequestId
  try {
    const res: any = await settingsApi.getNotificationSettings()
    if (requestId !== latestNotificationSettingsRequestId) {
      return
    }
    if (res?.code === 200 && res.data) {
      const nextSettings = {
        order: res.data.orderStatusEnabled ?? true,
        promotion: res.data.promotionsEnabled ?? true,
        system: res.data.systemEnabled ?? true,
        logistics: res.data.deliveryEnabled ?? true,
        comment: notifySettings.comment
      }
      applyNotificationSettings(nextSettings)
      Object.assign(confirmedNotificationSettings, nextSettings)
      notificationSaveState.value = 'saved'
    } else {
      debugError('获取通知设置失败:', getResponseMessage(res, '通知设置返回异常'))
    }
  } catch (error) {
    if (requestId !== latestNotificationSettingsRequestId) {
      return
    }
    debugError('获取通知设置失败:', error)
  } finally {
    if (requestId === latestNotificationSettingsRequestId) {
      await nextTick()
      notificationSettingsReady.value = true
    }
  }
}

const loadPrivacySettings = async () => {
  const requestId = ++latestPrivacySettingsRequestId
  try {
    const res: any = await settingsApi.getPrivacySettings()
    if (requestId !== latestPrivacySettingsRequestId) {
      return
    }
    if (res?.code === 200 && res.data) {
      const nextSettings = { profileVisibility: res.data.profileVisibility || 'public' }
      applyPrivacySettings(nextSettings)
      Object.assign(confirmedPrivacySettings, nextSettings)
      privacySaveState.value = 'saved'
    } else {
      debugError('获取隐私设置失败:', getResponseMessage(res, '隐私设置返回异常'))
    }
  } catch (error) {
    if (requestId !== latestPrivacySettingsRequestId) {
      return
    }
    debugError('获取隐私设置失败:', error)
  } finally {
    if (requestId === latestPrivacySettingsRequestId) {
      await nextTick()
      privacySettingsReady.value = true
    }
  }
}

const saveNotificationSettings = async () => {
  const pendingSettings = snapshotNotificationSettings()
  notificationSaveState.value = 'saving'
  try {
    const res: any = await settingsApi.updateNotificationSettings({
      orderStatusEnabled: pendingSettings.order, deliveryEnabled: pendingSettings.logistics,
      promotionsEnabled: pendingSettings.promotion, systemEnabled: pendingSettings.system,
      newProductsEnabled: true, inAppEnabled: true, emailEnabled: true, smsEnabled: false,
      notificationFrequency: 'immediate', notifyStartTime: 8, notifyEndTime: 22
    })
    if (res?.code !== 200) {
      const message = getResponseMessage(res, '保存通知设置失败')
      applyNotificationSettings({ ...confirmedNotificationSettings })
      notificationSaveState.value = 'error'
      debugError('保存通知设置失败:', message)
      ElMessage.error(message)
      return
    }
    Object.assign(confirmedNotificationSettings, pendingSettings)
    notificationSaveState.value = 'saved'
  } catch (error) {
    applyNotificationSettings({ ...confirmedNotificationSettings })
    notificationSaveState.value = 'error'
    debugError('保存通知设置失败:', error)
    ElMessage.error(getErrorMessage(error, '保存通知设置失败'))
  }
}

const savePrivacySettings = async () => {
  const pendingSettings = snapshotPrivacySettings()
  privacySaveState.value = 'saving'
  try {
    const res: any = await settingsApi.updatePrivacySettings({ profileVisibility: pendingSettings.profileVisibility })
    if (res?.code !== 200) {
      const message = getResponseMessage(res, '保存隐私设置失败')
      applyPrivacySettings({ ...confirmedPrivacySettings })
      privacySaveState.value = 'error'
      debugError('保存隐私设置失败:', message)
      ElMessage.error(message)
      return
    }
    Object.assign(confirmedPrivacySettings, pendingSettings)
    privacySaveState.value = 'saved'
  } catch (error) {
    applyPrivacySettings({ ...confirmedPrivacySettings })
    privacySaveState.value = 'error'
    debugError('保存隐私设置失败:', error)
    ElMessage.error(getErrorMessage(error, '保存隐私设置失败'))
  }
}

watch(notifySettings, () => {
  if (!notificationSettingsReady.value) return
  if (skipNotificationSave) {
    return
  }
  saveNotificationSettings()
}, { deep: true })

watch(() => privacySettings.profileVisibility, () => {
  if (!privacySettingsReady.value) return
  if (skipPrivacySave) {
    return
  }
  savePrivacySettings()
})

watch(
  () => route.query.section,
  (section) => {
    if (typeof section === 'string' && navSections.some((item) => item.id === section)) {
      activeSection.value = section
    }
  },
  { immediate: true }
)

// 外观设置 - 字体大小
watch(() => appearanceSettings.fontSize, (newSize) => {
  const sizeMap: Record<string, string> = { small: '14px', medium: '16px', large: '18px' }
  document.documentElement.style.setProperty('--base-font-size', sizeMap[newSize] || '16px')
  try {
    localStorage.setItem('fontSize', newSize)
  } catch (error) {
    debugError('保存字体大小设置失败:', error)
  }
})

// 外观设置 - 主题
watch(currentTheme, (newTheme) => {
  applyTheme(newTheme)
  try {
    localStorage.setItem('theme', newTheme)
  } catch (error) {
    debugError('保存主题设置失败:', error)
  }
})

// 加载保存的外观设置
const loadAppearanceSettings = () => {
  try {
    const savedFontSize = localStorage.getItem('fontSize')
    if (savedFontSize) {
      if (validFontSizes.has(savedFontSize)) {
        appearanceSettings.fontSize = savedFontSize
        // 立即应用字体大小
        const sizeMap: Record<string, string> = { small: '14px', medium: '16px', large: '18px' }
        document.documentElement.style.setProperty('--base-font-size', sizeMap[savedFontSize] || '16px')
      } else {
        debugError('读取字体大小设置失败:', `invalid fontSize: ${savedFontSize}`)
        removeAppearanceStorage('fontSize')
        appearanceSettings.fontSize = 'medium'
        document.documentElement.style.setProperty('--base-font-size', '16px')
      }
    }
  } catch (error) {
    debugError('读取字体大小设置失败:', error)
    appearanceSettings.fontSize = 'medium'
    document.documentElement.style.setProperty('--base-font-size', '16px')
  }

  try {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) {
      if (validThemes.has(savedTheme)) {
        currentTheme.value = savedTheme
        // 立即应用主题
        applyTheme(savedTheme)
      } else {
        debugError('读取主题设置失败:', `invalid theme: ${savedTheme}`)
        removeAppearanceStorage('theme')
        currentTheme.value = 'light'
        applyTheme('light')
      }
    }
  } catch (error) {
    debugError('读取主题设置失败:', error)
    currentTheme.value = 'light'
    applyTheme('light')
  }
}

// 应用主题
const applyTheme = (theme: string) => {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark-theme')
  } else if (theme === 'light') {
    document.documentElement.classList.remove('dark-theme')
  } else {
    // auto - 跟随系统
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    if (prefersDark) {
      document.documentElement.classList.add('dark-theme')
    } else {
      document.documentElement.classList.remove('dark-theme')
    }
  }
}

// 监听系统主题变化
const setupSystemThemeListener = () => {
  systemThemeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  systemThemeChangeHandler = (e) => {
    if (currentTheme.value === 'auto') {
      if (e.matches) {
        document.documentElement.classList.add('dark-theme')
      } else {
        document.documentElement.classList.remove('dark-theme')
      }
    }
  }
  systemThemeMediaQuery.addEventListener('change', systemThemeChangeHandler)
}

const changePassword = async () => {
  // 验证表单完整性
  if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) { 
    ElMessage.warning('请填写完整'); 
    return 
  }
  
  // 验证新密码长度
  if (passwordForm.newPassword.length < 6) { 
    ElMessage.warning('新密码至少6位'); 
    return 
  }
  
  // 验证两次密码输入一致
  if (passwordForm.newPassword !== passwordForm.confirmPassword) { 
    ElMessage.warning('两次输入的密码不一致'); 
    return 
  }
  
  // 验证新密码与旧密码不同
  if (passwordForm.oldPassword === passwordForm.newPassword) {
    ElMessage.warning('新密码不能与当前密码相同')
    return
  }
  
  loading.value = true
  try {
    await userStore.changePassword({
      currentPassword: passwordForm.oldPassword, 
      newPassword: passwordForm.newPassword, 
      confirmPassword: passwordForm.confirmPassword
    })
    ElMessage.success('密码修改成功')
    passwordForm.oldPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
  } catch (error) {
    debugError('密码修改失败:', error)
    ElMessage.error(getErrorMessage(error, '密码修改失败'))
  } finally { 
    loading.value = false 
  }
}

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await userStore.logout()
    ElMessage.success('已退出登录')
    router.push('/')
  } catch (error: any) {
    if (error === 'cancel' || error === 'close' || error?.action === 'cancel' || error?.action === 'close') {
      return
    }
    debugError('退出登录失败:', error)
    ElMessage.error(getErrorMessage(error, '退出登录失败'))
  }
}

const handleDeleteAccount = async () => {
  try {
    await ElMessageBox.confirm('仅当账号没有订单、卖家商品、卖家订单项或评价时才可注销。满足条件后将删除账号及其可清理资料，确定继续吗？', '危险操作', {
      confirmButtonText: '确定注销',
      cancelButtonText: '取消',
      type: 'error'
    })

    await userStore.deleteAccount()
    ElMessage.success('账户已注销')
    router.push('/')
  } catch (e: any) {
    if (e === 'cancel' || e === 'close' || e?.action === 'cancel' || e?.action === 'close') {
      return
    }
    debugError('注销账户失败:', e)
    ElMessage.error(getErrorMessage(e, '注销失败'))
  }
}

onMounted(() => {
  loadNotificationSettings()
  loadPrivacySettings()
  loadAppearanceSettings()
  setupSystemThemeListener()
})

onUnmounted(() => {
  if (systemThemeMediaQuery && systemThemeChangeHandler) {
    systemThemeMediaQuery.removeEventListener('change', systemThemeChangeHandler)
  }
  systemThemeMediaQuery = null
  systemThemeChangeHandler = null
})
</script>

<style scoped>
.settings-page { min-height: 100vh; background: var(--white); position: relative; }
.settings-page::before { content: ''; position: fixed; top: 5%; right: -10%; width: 600px; height: 600px; background: radial-gradient(circle, rgba(155, 135, 245, 0.15), transparent); opacity: 0.5; filter: blur(80px); border-radius: 50%; pointer-events: none; z-index: 0; animation: floatAnim 20s ease-in-out infinite; }
.settings-page::after { content: ''; position: fixed; bottom: 5%; left: -10%; width: 500px; height: 500px; background: radial-gradient(circle, rgba(155, 135, 245, 0.12), transparent); opacity: 0.5; filter: blur(80px); border-radius: 50%; pointer-events: none; z-index: 0; animation: floatAnim 20s ease-in-out infinite reverse; }
@keyframes floatAnim { 0%, 100% { transform: translate(0, 0) scale(1); } 33% { transform: translate(30px, -30px) scale(1.05); } 66% { transform: translate(-20px, 20px) scale(0.95); } }
.main-content { position: relative; z-index: 1; padding: 100px 0 80px; }
.container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
.page-header { margin-bottom: 32px; }
.page-header h1 { font-size: 2rem; font-weight: 600; color: var(--text-primary); margin: 0 0 6px; }
.page-header p { font-size: 15px; color: var(--text-tertiary); margin: 0; }
.settings-layout { display: grid; grid-template-columns: 220px 1fr; gap: 24px; }
.settings-nav { background: rgba(255, 255, 255, 0.88); backdrop-filter: blur(24px); border: 1px solid var(--gray-200); border-radius: var(--radius-lg); padding: 16px; height: fit-content; position: sticky; top: 88px; }
.nav-item { display: flex; align-items: center; gap: 12px; padding: 14px 18px; border-radius: var(--radius-md); cursor: pointer; transition: all 0.3s; margin-bottom: 4px; }
.nav-item:last-child { margin-bottom: 0; }
.nav-item:hover { background: rgba(155, 135, 245, 0.1); }
.nav-item.active { background: rgba(155, 135, 245, 0.15); color: var(--primary); }
.nav-icon { font-size: 14px; padding: 4px 8px; background: rgba(155, 135, 245, 0.1); border-radius: 4px; }
.nav-text { font-size: 15px; font-weight: 500; color: var(--text-secondary); }
.nav-item.active .nav-text { color: var(--primary); font-weight: 600; }
.settings-card { background: rgba(255, 255, 255, 0.88); backdrop-filter: blur(24px); border: 1px solid var(--gray-200); border-radius: var(--radius-lg); box-shadow: 0 8px 32px rgba(155, 135, 245, 0.08); margin-bottom: 20px; overflow: hidden; }
.card-header { position: relative; padding: 24px; border-bottom: 1px solid var(--gray-200); }
.card-header h3 { font-size: 20px; font-weight: 600; color: var(--text-primary); margin: 0 0 4px; }
.card-header p { font-size: 14px; color: var(--text-tertiary); margin: 0; }
.sync-status,
.scope-badge {
  position: absolute;
  top: 24px;
  right: 24px;
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  line-height: 1;
}
.sync-status {
  background: rgba(155, 135, 245, 0.1);
  color: var(--primary);
}
.sync-status.saving {
  background: rgba(245, 158, 11, 0.12);
  color: #b45309;
}
.sync-status.saved {
  background: rgba(34, 197, 94, 0.12);
  color: #15803d;
}
.sync-status.error {
  background: rgba(239, 68, 68, 0.12);
  color: #b91c1c;
}
.scope-badge {
  background: rgba(148, 163, 184, 0.14);
  color: var(--text-secondary);
}
.card-body { padding: 24px; }
.form-section h4 { font-size: 16px; font-weight: 600; color: var(--text-primary); margin: 0 0 16px; }
.setting-form { max-width: 400px; }
:deep(.el-form-item__label) { font-size: 14px; color: var(--text-secondary); font-weight: 500; }
:deep(.el-input__wrapper) { border-radius: var(--radius-md); background: var(--white); border: 1px solid var(--gray-300); box-shadow: none !important; }
:deep(.el-input__wrapper:hover), :deep(.el-input__wrapper.is-focus) { border-color: var(--primary); }
.primary-btn { padding: 12px 36px; background: var(--primary); color: white; border: none; border-radius: var(--radius-xl); font-size: 15px; cursor: pointer; transition: all 0.3s; box-shadow: 0 4px 20px rgba(155, 135, 245, 0.3); }
.primary-btn:hover { background: var(--primary-dark); transform: translateY(-2px); box-shadow: 0 6px 30px rgba(155, 135, 245, 0.4); }
.divider { height: 1px; background: var(--gray-200); margin: 24px 0; }
.security-items { display: flex; flex-direction: column; gap: 12px; }
.security-item { display: flex; justify-content: space-between; align-items: center; padding: 20px; background: var(--gray-50); border-radius: var(--radius-md); }
.item-info { display: flex; align-items: center; gap: 14px; }
.item-icon { font-size: 14px; padding: 8px 12px; background: rgba(155, 135, 245, 0.1); border-radius: 8px; }
.item-text h5 { font-size: 15px; font-weight: 600; color: var(--text-primary); margin: 0 0 2px; }
.item-text p { font-size: 14px; color: var(--text-tertiary); margin: 0; }
.link-btn { padding: 10px 20px; background: transparent; border: 1px solid var(--primary); color: var(--primary); border-radius: 24px; font-size: 14px; cursor: pointer; transition: all 0.3s; }
.link-btn:hover { background: var(--primary); color: white; }
.setting-item { display: flex; justify-content: space-between; align-items: center; padding: 20px 0; border-bottom: 1px solid var(--gray-200); }
.setting-item:last-child { border-bottom: none; }
.settings-hint { margin: 16px 0 0; font-size: 13px; color: var(--text-tertiary); line-height: 1.6; }
.theme-section h4 { font-size: 16px; font-weight: 600; color: var(--text-primary); margin: 0 0 16px; }
.theme-options { display: flex; gap: 16px; }
.theme-option { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 24px 36px; background: var(--gray-50); border: 2px solid transparent; border-radius: var(--radius-md); cursor: pointer; transition: all 0.3s; }
.theme-option:hover { border-color: rgba(155, 135, 245, 0.4); }
.theme-option.active { border-color: var(--primary); background: rgba(155, 135, 245, 0.1); }
.theme-icon { font-size: 24px; padding: 8px 12px; background: rgba(155, 135, 245, 0.1); border-radius: 8px; }
.theme-name { font-size: 14px; color: var(--text-secondary); }
.theme-option.active .theme-name { color: var(--primary); font-weight: 600; }
.danger-zone .card-header { background: rgba(255, 240, 240, 0.5); }
.danger-zone .card-header h3 { color: #e74c3c; }
.action-item { display: flex; justify-content: space-between; align-items: center; padding: 24px; background: var(--gray-50); border-radius: var(--radius-md); margin-bottom: 12px; }
.action-item:last-child { margin-bottom: 0; }
.action-item.danger { background: rgba(255, 240, 240, 0.5); }
.action-info h5 { font-size: 16px; font-weight: 600; color: var(--text-primary); margin: 0 0 4px; }
.action-info p { font-size: 14px; color: var(--text-tertiary); margin: 0; }
.logout-btn { padding: 12px 28px; background: transparent; border: 1px solid var(--gray-400); color: var(--text-secondary); border-radius: 24px; font-size: 15px; cursor: pointer; transition: all 0.3s; }
.logout-btn:hover { background: var(--gray-400); color: white; }
.delete-btn { padding: 12px 28px; background: transparent; border: 1px solid #e74c3c; color: #e74c3c; border-radius: 24px; font-size: 15px; cursor: pointer; transition: all 0.3s; }
.delete-btn:hover { background: #e74c3c; color: white; }
@media (max-width: 768px) { .settings-layout { grid-template-columns: 1fr; } .settings-nav { position: static; display: flex; overflow-x: auto; padding: 12px; gap: 8px; } .nav-item { flex-shrink: 0; padding: 10px 16px; margin-bottom: 0; } .theme-options { flex-wrap: wrap; } .theme-option { flex: 1; min-width: 100px; } }
</style>
