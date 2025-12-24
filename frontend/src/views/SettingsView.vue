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
              <el-icon><Shield /></el-icon>
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
          >
            <el-form-item label="头像">
              <div class="avatar-upload-section">
                <el-avatar 
                  :size="100" 
                  :src="accountForm.avatar || ''" 
                  :icon="User"
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
              <el-button type="primary" @click="saveAccountSettings">保存修改</el-button>
              <el-button @click="resetAccountForm">取消</el-button>
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
              <el-button type="primary" @click="changePassword">确认修改</el-button>
              <el-button @click="resetPasswordForm">取消</el-button>
            </el-form-item>
          </el-form>
        </el-card>
        
        <!-- 安全设置 -->
        <el-card v-if="activeTab === 'security'" class="settings-card">
          <template #header>
            <h2 class="card-title">安全设置</h2>
          </template>
          
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
          
          <div class="privacy-settings">
            <div class="privacy-item">
              <div class="privacy-info">
                <div class="privacy-title">个人信息可见性</div>
                <div class="privacy-desc">控制您的个人信息对其他用户的可见范围</div>
              </div>
              <div class="privacy-action">
                <el-select v-model="privacyForm.profileVisibility" placeholder="请选择" size="small">
                  <el-option label="公开" value="public" />
                  <el-option label="仅好友可见" value="friends" />
                  <el-option label="私密" value="private" />
                </el-select>
              </div>
            </div>
            
            <div class="privacy-item">
              <div class="privacy-info">
                <div class="privacy-title">允许陌生人消息</div>
                <div class="privacy-desc">是否接收来自陌生人的消息</div>
              </div>
              <div class="privacy-action">
                <el-switch v-model="privacyForm.allowStrangerMessages" size="small" />
              </div>
            </div>
            
            <div class="privacy-item">
              <div class="privacy-info">
                <div class="privacy-title">允许推荐给朋友</div>
                <div class="privacy-desc">是否允许系统将您推荐给可能认识的人</div>
              </div>
              <div class="privacy-action">
                <el-switch v-model="privacyForm.allowRecommend" size="small" />
              </div>
            </div>
            
            <el-form-item class="privacy-save-btn">
              <el-button type="primary" @click="savePrivacySettings">保存设置</el-button>
            </el-form-item>
          </div>
        </el-card>
        
        <!-- 通知设置 -->
        <el-card v-if="activeTab === 'notification'" class="settings-card">
          <template #header>
            <h2 class="card-title">通知设置</h2>
          </template>
          
          <div class="notification-settings">
            <div class="notification-section">
              <h3 class="section-title">订单通知</h3>
              
              <div class="notification-item">
                <div class="notification-info">
                  <div class="notification-title">订单状态更新</div>
                  <div class="notification-desc">订单状态发生变化时通知我</div>
                </div>
                <div class="notification-action">
                  <el-switch v-model="notificationForm.orderStatus" size="small" />
                </div>
              </div>
              
              <div class="notification-item">
                <div class="notification-info">
                  <div class="notification-title">发货通知</div>
                  <div class="notification-desc">商品发货时通知我</div>
                </div>
                <div class="notification-action">
                  <el-switch v-model="notificationForm.delivery" size="small" />
                </div>
              </div>
            </div>
            
            <div class="notification-section">
              <h3 class="section-title">营销通知</h3>
              
              <div class="notification-item">
                <div class="notification-info">
                  <div class="notification-title">促销活动</div>
                  <div class="notification-desc">接收最新的促销活动信息</div>
                </div>
                <div class="notification-action">
                  <el-switch v-model="notificationForm.promotions" size="small" />
                </div>
              </div>
              
              <div class="notification-item">
                <div class="notification-info">
                  <div class="notification-title">新品推荐</div>
                  <div class="notification-desc">接收新品上架通知</div>
                </div>
                <div class="notification-action">
                  <el-switch v-model="notificationForm.newProducts" size="small" />
                </div>
              </div>
            </div>
            
            <el-form-item class="notification-save-btn">
              <el-button type="primary" @click="saveNotificationSettings">保存设置</el-button>
            </el-form-item>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { User, Lock, Document, Bell, Camera, Plus, Delete } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../stores/userStore'
import authApi from '../api/authApi'

const userStore = useUserStore()

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
    { required: true, message: '请输入当前密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== passwordForm.value.newPassword) {
          callback(new Error('两次输入密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 隐私设置
const privacyForm = ref({
  profileVisibility: 'public',
  allowStrangerMessages: true,
  allowRecommend: true
})

// 通知设置
const notificationForm = ref({
  orderStatus: true,
  delivery: true,
  promotions: true,
  newProducts: true
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
    // 调用API注销账号
    await userStore.logout()
    ElMessage.success('账号注销成功')
    deleteAccountDialogVisible.value = false
    // 跳转到登录页
    window.location.href = '/login'
  } catch (error) {
    console.error('账号注销失败:', error)
    ElMessage.error('账号注销失败，请稍后重试')
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
    // 实际项目中这里应该调用API修改密码
    ElMessage.success('密码修改成功')
    passwordForm.value = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
    if (passwordFormRef.value) {
      passwordFormRef.value.resetFields()
    }
  } catch (error) {
    console.error('表单验证失败:', error)
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

// 保存隐私设置
const savePrivacySettings = () => {
  // 实际项目中这里应该调用API保存隐私设置
  ElMessage.success('隐私设置保存成功')
}

// 保存通知设置
const saveNotificationSettings = () => {
  // 实际项目中这里应该调用API保存通知设置
  ElMessage.success('通知设置保存成功')
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
  } catch (error) {
    console.error('保存账号信息失败:', error)
    ElMessage.error(userStore.error || '保存失败，请稍后重试')
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

// 组件挂载时初始化数据
onMounted(() => {
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