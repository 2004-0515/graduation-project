<template>
  <div class="settings-container">
    <div class="settings-header">
      <h1>账号设置</h1>
      <p class="settings-subtitle">管理您的账号信息和安全设置</p>
    </div>
    
    <div class="settings-content">
      <!-- 侧边导航 -->
      <div class="settings-sidebar">
        <el-menu
            :default-active="activeTab"
            class="settings-menu"
            @select="handleTabChange"
          >
            <el-menu-item index="account">
              <el-icon><User /></el-icon>
              <span>账号信息</span>
            </el-menu-item>
            <el-menu-item index="password">
              <el-icon><Lock /></el-icon>
              <span>密码修改</span>
            </el-menu-item>
            <el-menu-item index="security">
              <el-icon><Lock /></el-icon>
              <span>安全设置</span>
            </el-menu-item>
            <el-menu-item index="privacy">
              <el-icon><Document /></el-icon>
              <span>隐私设置</span>
            </el-menu-item>
            <el-menu-item index="notification">
              <el-icon><Bell /></el-icon>
              <span>通知设置</span>
            </el-menu-item>
            <el-menu-item index="delete" class="delete-account-item">
              <el-icon><Delete /></el-icon>
              <span>注销账号</span>
            </el-menu-item>
          </el-menu>
      </div>
      
      <!-- 内容区域 -->
      <div class="settings-main">
        <!-- 账号信息 -->
        <el-card v-if="activeTab === 'account'" class="settings-card">
          <template #header>
            <h2 class="card-title">账号信息</h2>
          </template>
          
          <el-form
            ref="accountFormRef"
            :model="accountForm"
            :rules="accountRules"
            label-width="120px"
            @submit.prevent="saveAccountSettings"
          >
            <el-form-item label="头像">
              <div class="avatar-upload-section">
                <el-avatar 
                  :size="100" 
                  :src="accountForm.avatar || ''" 
                  class="avatar-preview"
                >
                  {{ accountForm.username?.charAt(0)?.toUpperCase() || 'U' }}
                </el-avatar>
                <div class="avatar-upload-actions">
                  <el-button type="primary" @click="avatarDialogVisible = true">
                    <el-icon><Camera /></el-icon>
                    更换头像
                  </el-button>
                  <p class="avatar-hint">支持 JPG、PNG 格式，不超过 2MB</p>
                </div>
              </div>
            </el-form-item>
            
            <el-form-item label="用户名">
              <el-input v-model="accountForm.username" placeholder="请输入用户名" disabled />
              <div class="form-hint">用户名不可修改</div>
            </el-form-item>
            
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="accountForm.email" placeholder="请输入邮箱" />
            </el-form-item>
            
            <el-form-item label="手机号" prop="phone">
              <el-input v-model="accountForm.phone" placeholder="请输入手机号" />
            </el-form-item>
            
            <el-form-item label="昵称" prop="nickname">
              <el-input v-model="accountForm.nickname" placeholder="请输入昵称" />
            </el-form-item>
            
            <el-form-item label="个性签名">
              <el-input 
                v-model="accountForm.bio" 
                type="textarea" 
                :rows="4" 
                placeholder="介绍一下自己吧" 
                maxlength="100"
                show-word-limit
              />
            </el-form-item>
            
            <el-form-item>
              <el-button type="primary" native-type="submit">保存修改</el-button>
              <el-button @click="resetAccountForm">重置</el-button>
              <el-button @click="goToProfile">返回</el-button>
            </el-form-item>
          </el-form>
          
          <!-- 头像上传对话框 -->
          <el-dialog
            v-model="avatarDialogVisible"
            title="更换头像"
            width="600px"
          >
            <div class="avatar-upload-dialog">
              <el-upload
                action="#"
                :show-file-list="false"
                :before-upload="beforeAvatarUpload"
                :http-request="handleAvatarUpload"
                accept="image/jpeg,image/png"
              >
                <div class="avatar-upload-area">
                  <el-icon class="avatar-upload-icon"><Plus /></el-icon>
                  <div>点击上传头像</div>
                  <div class="upload-hint">支持 JPG、PNG 格式，不超过 2MB</div>
                </div>
              </el-upload>
              
              <!-- 头像预览和裁剪区域 -->
              <div v-if="avatarPreviewVisible" class="avatar-preview-section">
                <div class="avatar-cropper-container">
                  <!-- 这里可以集成裁剪库，如 vue-cropper -->
                  <img :src="avatarTempUrl" class="avatar-cropper" alt="头像预览" />
                </div>
                <div class="avatar-crop-actions">
                  <el-button @click="avatarPreviewVisible = false">重新上传</el-button>
                  <el-button type="primary" @click="saveAvatar">保存头像</el-button>
                </div>
              </div>
            </div>
            
            <template #footer>
              <span class="dialog-footer">
                <el-button @click="avatarDialogVisible = false">取消</el-button>
              </span>
            </template>
          </el-dialog>
          
          <!-- 账号注销对话框 -->
          <el-dialog
            v-model="deleteAccountDialogVisible"
            title="账号注销"
            width="500px"
            destroy-on-close
          >
            <div class="delete-account-content">
              <div class="delete-warning">
                <el-alert
                  title="账号注销警告"
                  type="error"
                  description="账号注销后，所有数据将不可恢复，请谨慎操作！"
                  show-icon
                ></el-alert>
              </div>
              
              <div class="delete-notice">
                <h3>注销账号后，您将失去以下内容：</h3>
                <ul>
                  <li>所有账号数据和个人信息</li>
                  <li>已购买的商品记录</li>
                  <li>积分和优惠券</li>
                  <li>收藏的商品和地址</li>
                </ul>
              </div>
              
              <div class="delete-confirm">
                <el-form-item label="请输入" required>
                  <el-input
                    v-model="deleteAccountConfirm"
                    placeholder="输入'确认注销'以确认账号注销"
                    show-password
                  ></el-input>
                </el-form-item>
              </div>
            </div>
            
            <template #footer>
              <span class="dialog-footer">
                <el-button @click="cancelDeleteAccount">取消</el-button>
                <el-button 
                  type="danger" 
                  @click="confirmDeleteAccount"
                  :loading="deleteAccountLoading"
                >
                  确认注销
                </el-button>
              </span>
            </template>
          </el-dialog>
        </el-card>
        
        <!-- 密码修改 -->
        <el-card v-if="activeTab === 'password'" class="settings-card">
          <template #header>
            <h2 class="card-title">密码修改</h2>
          </template>
          
          <el-form
            ref="passwordFormRef"
            :model="passwordForm"
            :rules="passwordRules"
            label-width="120px"
            @submit.prevent="changePassword"
          >
            <el-form-item label="当前密码" prop="currentPassword">
              <el-input v-model="passwordForm.currentPassword" type="password" placeholder="请输入当前密码" show-password />
            </el-form-item>
            
            <el-form-item label="新密码" prop="newPassword">
              <el-input v-model="passwordForm.newPassword" type="password" placeholder="请输入新密码" show-password />
              <div class="form-hint">密码长度为 6-20 位，建议包含字母和数字</div>
            </el-form-item>
            
            <el-form-item label="确认新密码" prop="confirmPassword">
              <el-input v-model="passwordForm.confirmPassword" type="password" placeholder="请再次输入新密码" show-password />
            </el-form-item>
            
            <el-form-item>
              <el-button type="primary" native-type="submit">确认修改</el-button>
              <el-button @click="resetPasswordForm">重置</el-button>
              <el-button @click="goToProfile">返回</el-button>
            </el-form-item>
          </el-form>
        </el-card>
        
        <!-- 安全设置 -->
        <el-card v-if="activeTab === 'security'" class="settings-card">
          <template #header>
            <h2 class="card-title">安全设置</h2>
          </template>
          
          <el-form
            ref="securityFormRef"
            :model="securityForm"
            label-width="160px"
            :loading="loading.security"
          >
            <el-form-item label="密码有效期">
              <el-select v-model="securityForm.passwordExpireDays" placeholder="请选择密码有效期">
                <el-option label="30天" value="30" />
                <el-option label="60天" value="60" />
                <el-option label="90天" value="90" />
                <el-option label="180天" value="180" />
                <el-option label="365天" value="365" />
                <el-option label="永不过期" value="0" />
              </el-select>
              <div class="form-hint">设置密码的有效期限，到期前会收到更换提醒</div>
            </el-form-item>
            
            <el-form-item label="双因素认证">
              <el-switch v-model="securityForm.twoFactorEnabled" />
              <div class="form-hint">开启后登录时需要额外验证，提高账号安全性</div>
            </el-form-item>
            
            <el-form-item label="会话超时时间">
              <el-input-number
                v-model="securityForm.sessionTimeout"
                :min="5"
                :max="120"
                :step="5"
                placeholder="请输入会话超时时间"
                style="width: 200px"
              />
              <span class="unit">分钟</span>
              <div class="form-hint">设置登录后无操作自动退出的时间</div>
            </el-form-item>
            
            <el-form-item label="登录异常检测">
              <el-switch v-model="securityForm.enableLoginDetection" />
              <div class="form-hint">开启后会检测异常登录行为并发送提醒</div>
            </el-form-item>
            
            <el-form-item label="敏感操作二次验证">
              <el-switch v-model="securityForm.enableSensitiveVerify" />
              <div class="form-hint">开启后敏感操作需要再次验证密码</div>
            </el-form-item>
            
            <el-form-item>
              <el-button type="primary" @click="saveSecuritySettings">保存设置</el-button>
              <el-button @click="resetSecurityForm">重置</el-button>
            </el-form-item>
          </el-form>
          
          <div class="security-items">
            <div class="security-item">
              <div class="security-info">
                <div class="security-title">邮箱验证</div>
                <div class="security-desc">验证邮箱可以提高账号安全性，接收重要通知</div>
              </div>
              <div class="security-action">
                <el-tag type="success" size="large">已验证</el-tag>
              </div>
            </div>
            
            <div class="security-item">
              <div class="security-info">
                <div class="security-title">手机验证</div>
                <div class="security-desc">绑定手机可以用于登录和找回密码</div>
              </div>
              <div class="security-action">
                <el-tag type="warning" size="large">未验证</el-tag>
                <el-button type="primary" size="small" class="security-btn">立即验证</el-button>
              </div>
            </div>
            
            <div class="security-item">
              <div class="security-info">
                <div class="security-title">第三方账号绑定</div>
                <div class="security-desc">绑定第三方账号，方便快捷登录</div>
              </div>
              <div class="security-action">
                <div class="third-party-bindings">
                  <el-button type="default" size="small" class="third-party-btn">微信登录</el-button>
                  <el-button type="default" size="small" class="third-party-btn">QQ登录</el-button>
                  <el-button type="default" size="small" class="third-party-btn">微博登录</el-button>
                </div>
              </div>
            </div>
            
            <div class="security-item">
              <div class="security-info">
                <div class="security-title">登录设备管理</div>
                <div class="security-desc">查看和管理最近登录的设备</div>
              </div>
              <div class="security-action">
                <el-button type="primary" size="small" class="security-btn">查看设备</el-button>
              </div>
            </div>
          </div>
        </el-card>
        
        <!-- 隐私设置 -->
        <el-card v-if="activeTab === 'privacy'" class="settings-card">
          <template #header>
            <h2 class="card-title">隐私设置</h2>
          </template>
          
          <el-form
            ref="privacyFormRef"
            :model="privacyForm"
            label-width="160px"
            :loading="loading.privacy"
          >
            <el-form-item label="个人信息可见性">
              <el-select v-model="privacyForm.profileVisibility" placeholder="请选择">
                <el-option label="公开" value="public" />
                <el-option label="仅好友可见" value="friends" />
                <el-option label="私密" value="private" />
              </el-select>
              <div class="form-hint">控制您的个人信息对其他用户的可见范围</div>
            </el-form-item>
            
            <el-form-item label="允许陌生人消息">
              <el-switch v-model="privacyForm.allowStrangerMessages" />
              <div class="form-hint">是否接收来自陌生人的消息</div>
            </el-form-item>
            
            <el-form-item label="允许推荐给朋友">
              <el-switch v-model="privacyForm.allowRecommend" />
              <div class="form-hint">是否允许系统将您推荐给可能认识的人</div>
            </el-form-item>
            
            <el-form-item label="允许数据收集">
              <el-switch v-model="privacyForm.allowDataCollection" />
              <div class="form-hint">是否允许系统收集您的使用数据以改进服务</div>
            </el-form-item>
            
            <el-form-item label="允许第三方共享">
              <el-switch v-model="privacyForm.allowThirdPartyShare" />
              <div class="form-hint">是否允许系统与第三方共享您的数据</div>
            </el-form-item>
            
            <el-form-item label="接收隐私更新通知">
              <el-switch v-model="privacyForm.receivePrivacyUpdates" />
              <div class="form-hint">是否接收隐私政策和设置变更的通知</div>
            </el-form-item>
            
            <el-form-item label="数据保留期限">
              <el-select v-model="privacyForm.dataRetentionDays" placeholder="请选择数据保留期限">
                <el-option label="30天" value="30" />
                <el-option label="90天" value="90" />
                <el-option label="180天" value="180" />
                <el-option label="365天" value="365" />
                <el-option label="永久保留" value="0" />
              </el-select>
              <div class="form-hint">设置系统保留您数据的期限，到期后自动删除</div>
            </el-form-item>
            
            <el-form-item>
              <el-button type="primary" @click="savePrivacySettings">保存设置</el-button>
              <el-button @click="resetPrivacyForm">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
        
        <!-- 通知设置 -->
        <el-card v-if="activeTab === 'notification'" class="settings-card">
          <template #header>
            <h2 class="card-title">通知设置</h2>
          </template>
          
          <el-form
            ref="notificationFormRef"
            :model="notificationForm"
            label-width="160px"
            :loading="loading.notification"
          >
            <el-divider content-position="left">通知类型</el-divider>
            
            <el-form-item label="订单状态更新">
              <el-switch v-model="notificationForm.orderStatusEnabled" />
              <div class="form-hint">订单状态发生变化时通知我</div>
            </el-form-item>
            
            <el-form-item label="发货通知">
              <el-switch v-model="notificationForm.deliveryEnabled" />
              <div class="form-hint">商品发货时通知我</div>
            </el-form-item>
            
            <el-form-item label="促销活动">
              <el-switch v-model="notificationForm.promotionsEnabled" />
              <div class="form-hint">接收最新的促销活动信息</div>
            </el-form-item>
            
            <el-form-item label="新品推荐">
              <el-switch v-model="notificationForm.newProductsEnabled" />
              <div class="form-hint">接收新品上架通知</div>
            </el-form-item>
            
            <el-form-item label="系统通知">
              <el-switch v-model="notificationForm.systemEnabled" />
              <div class="form-hint">接收系统重要通知</div>
            </el-form-item>
            
            <el-divider content-position="left">通知渠道</el-divider>
            
            <el-form-item label="应用内通知">
              <el-switch v-model="notificationForm.inAppEnabled" />
              <div class="form-hint">在应用内接收通知</div>
            </el-form-item>
            
            <el-form-item label="邮件通知">
              <el-switch v-model="notificationForm.emailEnabled" />
              <div class="form-hint">通过邮件接收通知</div>
            </el-form-item>
            
            <el-form-item label="短信通知">
              <el-switch v-model="notificationForm.smsEnabled" />
              <div class="form-hint">通过短信接收通知</div>
            </el-form-item>
            
            <el-divider content-position="left">通知频率</el-divider>
            
            <el-form-item label="通知频率">
              <el-select v-model="notificationForm.notificationFrequency" placeholder="请选择通知频率">
                <el-option label="立即" value="immediate" />
                <el-option label="每日" value="daily" />
                <el-option label="每周" value="weekly" />
              </el-select>
              <div class="form-hint">设置通知的发送频率</div>
            </el-form-item>
            
            <el-form-item label="通知时间段">
              <div class="time-range">
                <el-input-number
                  v-model="notificationForm.notifyStartTime"
                  :min="0"
                  :max="23"
                  placeholder="开始时间"
                  style="width: 150px"
                />
                <span class="time-separator">-</span>
                <el-input-number
                  v-model="notificationForm.notifyEndTime"
                  :min="0"
                  :max="23"
                  placeholder="结束时间"
                  style="width: 150px"
                />
                <span class="unit">小时</span>
              </div>
              <div class="form-hint">设置接收通知的时间段，超出时间段的通知将延迟发送</div>
            </el-form-item>
            
            <el-form-item>
              <el-button type="primary" @click="saveNotificationSettings">保存设置</el-button>
              <el-button @click="resetNotificationForm">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { User, Lock, Document, Bell, Camera, Plus, Delete } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../stores/userStore'
import authApi from '../api/authApi'
import settingsApi from '../api/settingsApi'

const userStore = useUserStore()
const router = useRouter()

// 当前激活的标签
const activeTab = ref('account')

// 头像上传相关
const avatarDialogVisible = ref(false)
const avatarPreviewVisible = ref(false)
const avatarTempUrl = ref('')

// 账号注销相关
const deleteAccountDialogVisible = ref(false)
const deleteAccountLoading = ref(false)
const deleteAccountConfirm = ref('')

// 账号信息表单
const accountFormRef = ref(null)
const accountForm = ref({
  username: userStore.userInfo?.username || '',
  email: userStore.userInfo?.email || '',
  phone: userStore.userInfo?.phone || '',
  nickname: userStore.userInfo?.nickname || '',
  bio: userStore.userInfo?.bio || '',
  avatar: userStore.userInfo?.avatar || ''
})

// 账号信息验证规则
const accountRules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  nickname: [
    { min: 2, max: 20, message: '昵称长度在 2 到 20 个字符', trigger: 'blur' }
  ]
}

// 密码修改表单
const passwordFormRef = ref(null)
const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 密码修改验证规则
const passwordRules = {
  currentPassword: [
    { required: true, message: '旧密码不能为空', trigger: ['blur', 'submit'] },
    { min: 6, max: 20, message: '旧密码长度必须在 6 到 20 个字符之间', trigger: ['blur', 'submit'] }
  ],
  newPassword: [
    { required: true, message: '新密码不能为空', trigger: ['blur', 'submit'] },
    { min: 6, max: 20, message: '新密码长度必须在 6 到 20 个字符之间', trigger: ['blur', 'submit'] },
    {
      validator: (rule, value, callback) => {
        if (!/\d/.test(value)) {
          callback(new Error('新密码必须包含至少一个数字'))
        } else {
          callback()
        }
      },
      trigger: ['blur', 'submit']
    },
    {
      validator: (rule, value, callback) => {
        if (value === passwordForm.value.currentPassword) {
          callback(new Error('新密码不能与旧密码相同'))
        } else {
          callback()
        }
      },
      trigger: ['blur', 'submit']
    }
  ],
  confirmPassword: [
    { required: true, message: '确认新密码不能为空', trigger: ['blur', 'submit'] },
    {
      validator: (rule, value, callback) => {
        if (value !== passwordForm.value.newPassword) {
          callback(new Error('两次输入的新密码不一致'))
        } else {
          callback()
        }
      },
      trigger: ['blur', 'submit', 'change']
    }
  ]
}

// 隐私设置表单引用
const privacyFormRef = ref(null)

// 隐私设置
const privacyForm = ref({
  profileVisibility: 'public',
  allowStrangerMessages: true,
  allowRecommend: true,
  allowDataCollection: true,
  allowThirdPartyShare: false,
  receivePrivacyUpdates: true,
  dataRetentionDays: 365
})

// 通知设置表单引用
const notificationFormRef = ref(null)

// 通知设置
const notificationForm = ref({
  orderStatusEnabled: true,
  deliveryEnabled: true,
  promotionsEnabled: true,
  newProductsEnabled: true,
  systemEnabled: true,
  inAppEnabled: true,
  emailEnabled: true,
  smsEnabled: false,
  notificationFrequency: 'immediate',
  notifyStartTime: 8,
  notifyEndTime: 22
})

// 安全设置表单引用
const securityFormRef = ref(null)

// 安全设置
const securityForm = ref({
  passwordExpireDays: 90,
  twoFactorEnabled: false,
  sessionTimeout: 30,
  enableLoginDetection: true,
  enableSensitiveVerify: true
})

// 加载状态
const loading = reactive({
  security: false,
  privacy: false,
  notification: false
})

// 处理标签切换
const handleTabChange = (index) => {
  if (index === 'delete') {
    // 显示账号注销对话框
    deleteAccountDialogVisible.value = true
  } else {
    activeTab.value = index
  }
}

// 确认账号注销
const confirmDeleteAccount = async () => {
  if (deleteAccountConfirm.value !== '确认注销') {
    ElMessage.error('请输入\"确认注销\"以确认账号注销')
    return
  }
  
  deleteAccountLoading.value = true
  
  try {
    // 先关闭对话框，让用户感觉操作已经开始
    deleteAccountDialogVisible.value = false
    
    // 调用API删除账号
    await authApi.deleteAccount()
    
    // 清除本地存储的token和用户信息
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
    // 清除store中的用户信息
    userStore.clearUserInfo()
    
    // 显示成功消息
    ElMessage.success('账号注销成功')
    
    // 快速跳转到登录页，使用window.location.replace避免返回历史记录
    window.location.replace('/login')
  } catch (error) {
    console.error('账号注销失败:', error)
    ElMessage.error('账号注销失败')
  } finally {
    deleteAccountLoading.value = false
  }
}

// 取消账号注销
const cancelDeleteAccount = () => {
  deleteAccountDialogVisible.value = false
  deleteAccountConfirm.value = ''
}



// 修改密码
const changePassword = async () => {
  if (!passwordFormRef.value) return
  
  try {
    await passwordFormRef.value.validate()
    
    // 调用API修改密码
    await authApi.changePassword({
      currentPassword: passwordForm.value.currentPassword,
      newPassword: passwordForm.value.newPassword,
      confirmPassword: passwordForm.value.confirmPassword
    })
    
    ElMessage.success('密码修改成功，请使用新密码重新登录')
    
    // 清除本地存储的token
    localStorage.removeItem('token')
    // 清除store中的用户信息
    userStore.clearUserInfo()
    
    // 跳转到登录页
    router.push('/login')
  } catch (error) {
    console.error('修改密码失败:', error)
    // 根据不同的错误类型，显示更友好的提示信息
    let errorMessage = '密码修改失败'
    
    if (error.message) {
      // 处理已知错误类型
      if (error.message.includes('旧密码')) {
        errorMessage = error.message
      } else if (error.message.includes('新密码')) {
        errorMessage = error.message
      } else if (error.message.includes('用户不存在')) {
        errorMessage = '用户不存在，请重新登录后再试'
      } else if (error.message.includes('服务器无响应')) {
        errorMessage = '服务器暂时无响应，请检查网络连接后重试'
      } else {
        errorMessage = error.message
      }
    }
    
    ElMessage.error(errorMessage)
  }
}

// 重置密码表单
const resetPasswordForm = () => {
  passwordForm.value = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  }
  if (passwordFormRef.value) {
    passwordFormRef.value.resetFields()
  }
}



// 保存安全设置
const saveSecuritySettings = async () => {
  loading.security = true
  try {
    await settingsApi.updateSecuritySettings(securityForm.value)
    ElMessage.success('安全设置保存成功')
  } catch (error) {
    console.error('保存安全设置失败:', error)
    ElMessage.error('保存安全设置失败')
  } finally {
    loading.security = false
  }
}

// 重置安全设置表单
const resetSecurityForm = () => {
  if (securityFormRef.value) {
    securityFormRef.value.resetFields()
  }
  // 重新加载初始值
  fetchSecuritySettings()
}

// 重置隐私设置表单
const resetPrivacyForm = () => {
  if (privacyFormRef.value) {
    privacyFormRef.value.resetFields()
  }
  // 重新加载初始值
  fetchPrivacySettings()
}

// 重置通知设置表单
const resetNotificationForm = () => {
  if (notificationFormRef.value) {
    notificationFormRef.value.resetFields()
  }
  // 重新加载初始值
  fetchNotificationSettings()
}

// 保存隐私设置
const savePrivacySettings = async () => {
  loading.privacy = true
  try {
    await settingsApi.updatePrivacySettings(privacyForm.value)
    ElMessage.success('隐私设置保存成功')
  } catch (error) {
    console.error('保存隐私设置失败:', error)
    ElMessage.error('保存隐私设置失败')
  } finally {
    loading.privacy = false
  }
}

// 保存通知设置
const saveNotificationSettings = async () => {
  loading.notification = true
  try {
    await settingsApi.updateNotificationSettings(notificationForm.value)
    ElMessage.success('通知设置保存成功')
  } catch (error) {
    console.error('保存通知设置失败:', error)
    ElMessage.error('保存通知设置失败')
  } finally {
    loading.notification = false
  }
}

// 获取安全设置
const fetchSecuritySettings = async () => {
  loading.security = true
  try {
    const data = await settingsApi.getSecuritySettings()
    securityForm.value = {
      passwordExpireDays: data.passwordExpireDays,
      twoFactorEnabled: data.twoFactorEnabled,
      sessionTimeout: data.sessionTimeout,
      enableLoginDetection: data.enableLoginDetection,
      enableSensitiveVerify: data.enableSensitiveVerify
    }
  } catch (error) {
    console.error('获取安全设置失败:', error)
  } finally {
    loading.security = false
  }
}

// 获取隐私设置
const fetchPrivacySettings = async () => {
  loading.privacy = true
  try {
    const data = await settingsApi.getPrivacySettings()
    privacyForm.value = {
      profileVisibility: data.profileVisibility,
      allowStrangerMessages: data.allowStrangerMessages,
      allowRecommend: data.allowRecommend,
      allowDataCollection: data.allowDataCollection,
      allowThirdPartyShare: data.allowThirdPartyShare,
      receivePrivacyUpdates: data.receivePrivacyUpdates,
      dataRetentionDays: data.dataRetentionDays
    }
  } catch (error) {
    console.error('获取隐私设置失败:', error)
  } finally {
    loading.privacy = false
  }
}

// 获取通知设置
const fetchNotificationSettings = async () => {
  loading.notification = true
  try {
    const data = await settingsApi.getNotificationSettings()
    notificationForm.value = {
      orderStatusEnabled: data.orderStatusEnabled,
      deliveryEnabled: data.deliveryEnabled,
      promotionsEnabled: data.promotionsEnabled,
      newProductsEnabled: data.newProductsEnabled,
      systemEnabled: data.systemEnabled,
      inAppEnabled: data.inAppEnabled,
      emailEnabled: data.emailEnabled,
      smsEnabled: data.smsEnabled,
      notificationFrequency: data.notificationFrequency,
      notifyStartTime: data.notifyStartTime,
      notifyEndTime: data.notifyEndTime
    }
  } catch (error) {
    console.error('获取通知设置失败:', error)
  } finally {
    loading.notification = false
  }
}

// 头像上传前验证
const beforeAvatarUpload = (file) => {
  const isJPG = file.type === 'image/jpeg' || file.type === 'image/png'
  const isLt2M = file.size / 1024 / 1024 < 2
  
  if (!isJPG) {
    ElMessage.error('头像只能是 JPG/PNG 格式!')
  }
  if (!isLt2M) {
    ElMessage.error('头像大小不能超过 2MB!')
  }
  
  return isJPG && isLt2M
}

// 处理头像上传
const handleAvatarUpload = (file) => {
  // 读取文件并显示预览
  const reader = new FileReader()
  reader.onload = (e) => {
    avatarTempUrl.value = e.target.result
    avatarPreviewVisible.value = true
  }
  reader.readAsDataURL(file.file)
}

// 保存头像
const saveAvatar = () => {
  // 这里可以调用API上传头像到服务器
  // 模拟上传成功
  accountForm.value.avatar = avatarTempUrl.value
  avatarPreviewVisible.value = false
  avatarDialogVisible.value = false
  ElMessage.success('头像上传成功')
}

// 保存账号设置
const saveAccountSettings = async () => {
  if (!accountFormRef.value) return
  
  try {
    await accountFormRef.value.validate()
    // 创建表单数据副本，移除avatar字段
    // 头像通过专门的上传接口处理，不包含在账号设置保存中
    const formData = {
      ...accountForm.value
    }
    delete formData.avatar
    // 调用store方法保存账号信息
    await userStore.updateUserInfo(formData)
    ElMessage.success('账号信息保存成功')
    // 跳转到个人中心页面
    router.push('/profile')
  } catch (error) {
    console.error('保存账号信息失败:', error)
    ElMessage.error(userStore.error || '保存失败')
  }
}

// 重置账号表单
const resetAccountForm = () => {
  if (userStore.userInfo) {
    accountForm.value = {
      username: userStore.userInfo.username || '',
      email: userStore.userInfo.email || '',
      phone: userStore.userInfo.phone || '',
      nickname: userStore.userInfo.nickname || '',
      bio: userStore.userInfo.bio || '',
      avatar: userStore.userInfo.avatar || ''
    }
  }
  if (accountFormRef.value) {
    accountFormRef.value.resetFields()
  }
}

// 返回个人中心页面
const goToProfile = () => {
  router.push('/profile')
}

// 组件挂载时初始化数据
onMounted(async () => {
  // 检查用户是否已登录
  if (!userStore.token) {
    // 如果没有token，跳转到登录页
    router.push('/login')
    return
  }
  
  // 如果有token但没有用户信息，尝试获取用户信息
  if (!userStore.userInfo) {
    try {
      await userStore.fetchCurrentUser()
    } catch (error) {
      console.error('获取用户信息失败:', error)
      // 获取失败，跳转到登录页
      router.push('/login')
      return
    }
  }
  
  // 初始化账号表单数据
  if (userStore.userInfo) {
    accountForm.value = {
      username: userStore.userInfo.username || '',
      email: userStore.userInfo.email || '',
      phone: userStore.userInfo.phone || '',
      nickname: userStore.userInfo.nickname || '',
      bio: userStore.userInfo.bio || '',
      avatar: userStore.userInfo.avatar || ''
    }
  }
  
  // 获取设置数据
  try {
    await Promise.all([
      fetchSecuritySettings(),
      fetchPrivacySettings(),
      fetchNotificationSettings()
    ])
  } catch (error) {
    console.error('获取设置数据失败:', error)
  }
})
</script>

<style scoped>
.settings-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  min-height: calc(100vh - 140px);
}

.settings-header {
  margin-bottom: 30px;
  text-align: center;
}

.settings-header h1 {
  font-size: 28px;
  color: #333;
  margin-bottom: 10px;
}

.settings-subtitle {
  color: #666;
  font-size: 16px;
}

.settings-content {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 24px;
  align-items: start;
}

.settings-sidebar {
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.settings-menu {
  border-right: none;
  background-color: transparent;
  border-radius: 12px;
}

.settings-menu .el-menu-item {
  height: 52px;
  line-height: 52px;
  margin: 4px 8px;
  border-radius: 8px;
  font-size: 14px;
}

.settings-menu .el-menu-item.is-active {
  background-color: rgba(64, 158, 255, 0.1);
  color: #409eff;
}

.settings-menu .el-menu-item:hover {
  background-color: rgba(64, 158, 255, 0.1);
  color: #409eff;
}

.settings-menu .el-icon {
  margin-right: 12px;
  font-size: 18px;
}

.settings-main {
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  padding: 0;
}

.settings-card {
  margin-bottom: 20px;
  border: none;
  box-shadow: none;
  border-radius: 0;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.form-hint {
  font-size: 12px;
  color: #999;
  margin-top: 6px;
}

/* 侧边栏注销选项样式 */
.delete-account-item {
  color: #f56c6c !important;
  border-top: 1px solid #f0f0f0;
  margin-top: 8px;
}

.delete-account-item:hover {
  background-color: rgba(245, 108, 108, 0.1) !important;
}

.delete-account-item.is-active {
  background-color: rgba(245, 108, 108, 0.1) !important;
  color: #f56c6c !important;
}

/* 账号注销对话框样式 */
.delete-account-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.delete-warning {
  margin-bottom: 16px;
}

.delete-notice h3 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #333;
}

.delete-notice ul {
  padding-left: 20px;
  margin: 0;
}

.delete-notice li {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
  line-height: 1.5;
}

.delete-confirm {
  margin-top: 16px;
}

.delete-confirm .el-form-item {
  margin-bottom: 0;
}

/* 确保表单样式统一 */
:deep(.delete-confirm .el-form-item__label) {
  font-weight: 500;
  color: #333;
}

/* 安全设置 */
.security-items {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.security-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background-color: #fafafa;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.security-item:hover {
  background-color: #f0f9ff;
}

.security-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.security-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.security-desc {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}

.security-action {
  display: flex;
  align-items: center;
  gap: 12px;
}

.security-btn {
  margin-left: 12px;
}

.third-party-bindings {
  display: flex;
  gap: 10px;
}

.third-party-btn {
  border-radius: 20px;
  padding: 6px 16px;
}

/* 头像上传样式 */
.avatar-upload-section {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.avatar-preview {
  cursor: pointer;
  transition: all 0.3s ease;
  border: 4px solid #f0f0f0;
}

.avatar-preview:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.avatar-upload-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.avatar-hint {
  font-size: 12px;
  color: #999;
  margin: 0;
}

/* 头像上传对话框样式 */
.avatar-upload-dialog {
  padding: 20px 0;
}

.avatar-upload-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 200px;
  border: 2px dashed #d9d9d9;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: #fafafa;
}

.avatar-upload-area:hover {
  border-color: #409eff;
  background-color: #f0f9ff;
}

.avatar-upload-icon {
  font-size: 48px;
  color: #909399;
  margin-bottom: 16px;
}

.upload-hint {
  font-size: 12px;
  color: #999;
  margin-top: 8px;
}

/* 头像预览和裁剪区域样式 */
.avatar-preview-section {
  margin-top: 24px;
}

.avatar-cropper-container {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.avatar-cropper {
  max-width: 100%;
  max-height: 300px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.avatar-crop-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
}

/* 账号信息表单样式优化 */
:deep(.el-form-item) {
  margin-bottom: 24px;
}

.form-hint {
  font-size: 12px;
  color: #999;
  margin-top: 6px;
}

/* 隐私设置和通知设置 */
.privacy-settings,
.notification-settings {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.privacy-item,
.notification-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background-color: #fafafa;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.privacy-item:hover,
.notification-item:hover {
  background-color: #f0f9ff;
}

.privacy-info,
.notification-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.privacy-title,
.notification-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.privacy-desc,
.notification-desc {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}

.privacy-action,
.notification-action {
  display: flex;
  align-items: center;
  gap: 12px;
}

.notification-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 16px 0 8px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.privacy-save-btn,
.notification-save-btn {
  margin-top: 20px;
  padding: 20px;
  background-color: #fafafa;
  border-radius: 8px;
  text-align: right;
  border: none;
  margin-bottom: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .settings-content {
    grid-template-columns: 1fr;
  }
  
  .security-item,
  .privacy-item,
  .notification-item {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }
  
  .security-action,
  .privacy-action,
  .notification-action {
    justify-content: flex-end;
  }
  
  .third-party-bindings {
    flex-wrap: wrap;
    justify-content: flex-end;
  }
}
</style>