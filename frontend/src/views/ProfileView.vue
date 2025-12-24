<template>
  <div class="profile-container">
    <!-- 用户信息头部卡片 -->
    <el-card class="profile-header-card">
      <!-- 装饰性背景元素 -->
      <div class="profile-header-decoration">
        <div class="decoration-circle circle-1"></div>
        <div class="decoration-circle circle-2"></div>
        <div class="decoration-circle circle-3"></div>
      </div>
      
      <div class="profile-header-content">
        <!-- 左侧头像区域 -->
        <div class="profile-header-avatar">
          <div class="avatar-wrapper">
            <el-avatar 
              :size="120" 
              :src="userInfo?.avatar || ''" 
              :icon="User"
              class="profile-avatar-img"
            >
              {{ userInfo?.nickname?.charAt(0)?.toUpperCase() || userInfo?.username?.charAt(0)?.toUpperCase() || 'U' }}
            </el-avatar>
            <div class="avatar-badge">
              <el-icon><Camera /></el-icon>
            </div>
          </div>
        </div>
        
        <!-- 右侧信息区域 -->
        <div class="profile-header-info">
          <!-- 用户名和等级标签 - 顶部 -->
          <div class="profile-header-main">
            <h1 class="profile-username">{{ userInfo?.nickname || userInfo?.username || '用户' }}</h1>
            <el-tag type="info" size="large" class="user-level-tag">
              <el-icon><StarFilled /></el-icon>
              {{ getUserLevel() }}
            </el-tag>
          </div>
          
          <!-- 用户状态信息 - 用户名下方 -->
          <div class="profile-status">
            <div class="status-item">
              <el-icon class="status-icon"><Clock /></el-icon>
              <span class="status-text">注册时间: {{ formatDate(userInfo?.createdTime) }}</span>
            </div>
            <div class="status-item">
              <el-icon class="status-icon"><Monitor /></el-icon>
              <span class="status-text">最后登录: {{ formatDate(userInfo?.lastLoginTime) || '今天 ' + new Date().toLocaleTimeString() }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 统计数据区域 - 单独一行 -->
      <div class="profile-header-stats">
        <div class="stat-item">
          <div class="stat-icon-container">
            <el-icon class="stat-icon"><Coin /></el-icon>
          </div>
          <div class="stat-value">{{ userInfo?.points || 0 }}</div>
          <div class="stat-label">积分</div>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <div class="stat-icon-container">
            <el-icon class="stat-icon"><TrendCharts /></el-icon>
          </div>
          <div class="stat-value">{{ userInfo?.growthValue || 0 }}</div>
          <div class="stat-label">成长值</div>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <div class="stat-icon-container">
            <el-icon class="stat-icon"><Calendar /></el-icon>
          </div>
          <div class="stat-value">{{ userInfo?.memberDays || 0 }}</div>
          <div class="stat-label">会员天数</div>
        </div>
      </div>
      
      <!-- 操作按钮区域 - 统计数据下方 -->
      <div class="profile-header-actions">
        <el-button type="primary" size="large" @click="editProfile">
          <el-icon><Edit /></el-icon>
          编辑资料
        </el-button>
        <el-button size="large" @click="navigateTo('/settings')">
          <el-icon><Setting /></el-icon>
          账号设置
        </el-button>
        <el-button size="large" @click="navigateTo('/orders')">
          <el-icon><Ticket /></el-icon>
          我的订单
        </el-button>
      </div>
    </el-card>
    
    <div class="profile-content">
      <!-- 个人信息卡片 -->
      <el-card class="profile-card">
        <template #header>
          <div class="card-header">
            <h2 class="card-title">基本信息</h2>
          </div>
        </template>
        
        <div class="profile-info">
          <div class="profile-details">
            <div class="detail-item">
              <label class="detail-label">用户名</label>
              <div class="detail-value">{{ userInfo?.username || '-' }}</div>
            </div>
            <div class="detail-item">
              <label class="detail-label">邮箱</label>
              <div class="detail-value">{{ userInfo?.email || '-' }}</div>
              <el-tag type="success" size="small">已验证</el-tag>
            </div>
            <div class="detail-item">
              <label class="detail-label">手机号</label>
              <div class="detail-value">{{ userInfo?.phone || '未绑定' }}</div>
              <el-button type="text" size="small" class="bind-btn">绑定手机</el-button>
            </div>
            <div class="detail-item">
              <label class="detail-label">昵称</label>
              <div class="detail-value">{{ userInfo?.nickname || userInfo?.username || '-' }}</div>
            </div>
            <div class="detail-item">
              <label class="detail-label">个性签名</label>
              <div class="detail-value">{{ userInfo?.bio || '暂无个性签名' }}</div>
            </div>
            <div class="detail-item">
              <label class="detail-label">注册时间</label>
              <div class="detail-value">{{ formatDate(userInfo?.createdTime) }}</div>
            </div>
            <div class="detail-item">
              <label class="detail-label">最后登录</label>
              <div class="detail-value">{{ formatDate(userInfo?.lastLoginTime) || '今天 ' + new Date().toLocaleTimeString() }}</div>
            </div>
            <div class="detail-item">
              <label class="detail-label">登录IP</label>
              <div class="detail-value">{{ userInfo?.lastLoginIp || '-' }}</div>
            </div>
          </div>
        </div>
      </el-card>
      
      <!-- 账户数据卡片 -->
      <div class="profile-stats">
        <el-card class="stat-card">
          <div class="stat-content">
            <el-icon class="stat-icon"><Ticket /></el-icon>
            <div class="stat-info">
              <div class="stat-value">0</div>
              <div class="stat-label">我的订单</div>
            </div>
          </div>
          <el-button type="text" class="stat-link" @click="$router.push('/orders')">查看全部</el-button>
        </el-card>
        
        <el-card class="stat-card">
          <div class="stat-content">
            <el-icon class="stat-icon"><Location /></el-icon>
            <div class="stat-info">
              <div class="stat-value">0</div>
              <div class="stat-label">收货地址</div>
            </div>
          </div>
          <el-button type="text" class="stat-link" @click="$router.push('/address')">管理地址</el-button>
        </el-card>
        
        <el-card class="stat-card">
          <div class="stat-content">
            <el-icon class="stat-icon"><StarFilled /></el-icon>
            <div class="stat-info">
              <div class="stat-value">0</div>
              <div class="stat-label">我的收藏</div>
            </div>
          </div>
          <el-button type="text" class="stat-link">查看收藏</el-button>
        </el-card>
        
        <el-card class="stat-card">
          <div class="stat-content">
            <el-icon class="stat-icon"><Gift /></el-icon>
            <div class="stat-info">
              <div class="stat-value">0</div>
              <div class="stat-label">优惠券</div>
            </div>
          </div>
          <el-button type="text" class="stat-link">查看优惠券</el-button>
        </el-card>
      </div>
      
      <!-- 最近订单 -->
      <el-card class="profile-card">
        <template #header>
          <div class="card-header">
            <h2 class="card-title">最近订单</h2>
            <el-button type="text" class="card-link" @click="$router.push('/orders')">查看全部订单</el-button>
          </div>
        </template>
        
        <div class="empty-orders">
          <el-empty description="暂无订单">
            <el-button type="primary" @click="$router.push('/')">去购物</el-button>
          </el-empty>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '../stores/userStore'
import { useRouter } from 'vue-router'
import { User, Ticket, Location, StarFilled, Edit, Setting, Camera, Clock, Monitor, Coin, TrendCharts, Calendar } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const userStore = useUserStore()
const router = useRouter()

// 计算属性获取用户信息
const userInfo = computed(() => userStore.userInfo)

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '-'  
  const date = new Date(dateString)
  return date.toLocaleString()
}

// 获取用户等级
const getUserLevel = () => {
  const points = userInfo.value?.points || 0
  if (points >= 5000) return '钻石会员'
  if (points >= 2000) return '黄金会员'
  if (points >= 500) return '白银会员'
  return '普通会员'
}

// 编辑资料
const editProfile = () => {
  ElMessage.info('编辑功能开发中...')
}

// 导航方法
const navigateTo = (path) => {
  router.push(path)
}

// 组件挂载时初始化用户信息
onMounted(() => {
  if (userStore.token && !userStore.userInfo) {
    userStore.fetchCurrentUser()
  }
})
</script>

<style scoped>
.profile-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  min-height: calc(100vh - 140px);
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* 头部卡片样式 */
.profile-header-card {
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  background: 
    linear-gradient(rgba(64, 158, 255, 0.8), rgba(40, 140, 255, 0.75)),
    url('@/assets/images/profile-bg.jpg');
  background-size: cover;
  background-position: center;
  background-blend-mode: overlay;
  color: #fff;
  overflow: hidden;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  position: relative;
}

/* 装饰性背景元素 */
.profile-header-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  z-index: 0;
}

.decoration-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  animation: float 6s ease-in-out infinite;
}

.circle-1 {
  width: 200px;
  height: 200px;
  top: -50px;
  right: -50px;
  animation-delay: 0s;
}

.circle-2 {
  width: 150px;
  height: 150px;
  bottom: -30px;
  left: -30px;
  animation-delay: 2s;
}

.circle-3 {
  width: 100px;
  height: 100px;
  top: 50%;
  right: 20%;
  animation-delay: 4s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px) scale(1);
  }
  50% {
    transform: translateY(-20px) scale(1.1);
  }
}

.profile-header-content {
  display: flex;
  align-items: flex-start;
  gap: 40px;
  padding: 32px 32px 0;
  position: relative;
  z-index: 1;
}

.profile-header-avatar {
  flex-shrink: 0;
}

/* 头像包装器 */
.avatar-wrapper {
  position: relative;
  display: inline-block;
}

.profile-avatar-img {
  border: 6px solid rgba(255, 255, 255, 0.4);
  box-shadow: 
    0 8px 24px rgba(0, 0, 0, 0.25),
    0 0 0 1px rgba(255, 255, 255, 0.1),
    inset 0 0 0 1px rgba(255, 255, 255, 0.1);
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.profile-avatar-img::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%);
  transform: translateX(-100%);
  transition: transform 0.6s ease;
}

.profile-avatar-img:hover {
  transform: scale(1.12) translateY(-2px);
  box-shadow: 
    0 16px 40px rgba(0, 0, 0, 0.35),
    0 0 0 1px rgba(255, 255, 255, 0.2),
    inset 0 0 0 1px rgba(255, 255, 255, 0.2);
}

.profile-avatar-img:hover::before {
  transform: translateX(100%);
}

/* 头像编辑徽章 */
.avatar-badge {
  position: absolute;
  bottom: 8px;
  right: 8px;
  width: 36px;
  height: 36px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  transition: all 0.3s ease;
  color: #409eff;
  border: 2px solid rgba(255, 255, 255, 0.8);
}

.avatar-badge:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25);
  background: #fff;
}

.avatar-badge .el-icon {
  font-size: 18px;
}

/* 用户状态信息 */
.profile-status {
  display: flex;
  gap: 24px;
  padding: 8px 0;
  flex-wrap: wrap;
  margin-bottom: 0;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
}

.status-icon {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.9);
}

.status-text {
  line-height: 1.5;
}

.profile-header-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: relative;
}

.profile-header-main {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  position: relative;
}

.profile-username {
  font-size: 32px;
  font-weight: 700;
  margin: 0;
  color: #fff;
  text-shadow: 
    0 2px 8px rgba(0, 0, 0, 0.2),
    0 1px 3px rgba(0, 0, 0, 0.3);
  letter-spacing: -0.5px;
  transition: all 0.3s ease;
}

.profile-header-main:hover .profile-username {
  text-shadow: 
    0 4px 16px rgba(0, 0, 0, 0.25),
    0 2px 4px rgba(0, 0, 0, 0.35);
}

.user-level-tag {
  background-color: rgba(255, 255, 255, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.35);
  color: #fff;
  font-weight: 600;
  backdrop-filter: blur(5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.user-level-tag:hover {
  background-color: rgba(255, 255, 255, 0.25);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.user-level-tag .el-icon {
  margin-right: 6px;
}

.profile-header-stats {
  display: flex;
  align-items: center;
  gap: 32px;
  padding: 24px 32px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  margin: 0 32px;
  position: relative;
  z-index: 1;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 16px 24px;
  border-radius: 10px;
  position: relative;
  overflow: hidden;
  flex: 1;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.stat-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.08);
  transform: scaleY(0);
  transform-origin: bottom;
  transition: transform 0.3s ease;
}

.stat-item:hover {
  transform: translateY(-6px);
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.25);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.stat-item:hover::before {
  transform: scaleY(1);
}

/* 统计图标容器 */
.stat-icon-container {
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.stat-item:hover .stat-icon-container {
  transform: scale(1.1);
  background: rgba(255, 255, 255, 0.25);
}

.stat-icon {
  font-size: 24px;
  color: #fff;
  transition: all 0.3s ease;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #fff;
  margin: 0;
  text-shadow: 
    0 2px 8px rgba(0, 0, 0, 0.2),
    0 1px 3px rgba(0, 0, 0, 0.3);
  position: relative;
  z-index: 1;
  letter-spacing: -0.5px;
}

.stat-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.95);
  margin: 0;
  font-weight: 600;
  position: relative;
  z-index: 1;
  letter-spacing: 0.5px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.stat-divider {
  width: 1px;
  height: 80px;
  background-color: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(5px);
  margin: 0 8px;
}

.profile-header-actions {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  padding: 0 32px 32px;
  position: relative;
  z-index: 1;
}

.profile-header-actions .el-button {
  flex: 1;
  min-width: 160px;
}

.profile-header-actions .el-button {
  border-radius: 12px;
  font-weight: 600;
  padding: 12px 24px;
  font-size: 15px;
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid transparent;
}

.profile-header-actions .el-button {
  background: rgba(255, 255, 255, 0.95);
  color: #409eff;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  border: 1px solid transparent;
}

.profile-header-actions .el-button:hover {
  background: #fff;
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  color: #3a8ee6;
  border-color: transparent;
}

/* 内容区域样式 */
.profile-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin-top: -12px;
  position: relative;
  z-index: 2;
}

.profile-card {
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.profile-card:hover {
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.card-link {
  font-size: 14px;
  color: #409eff;
}

.profile-info {
  padding: 24px 0;
}

.profile-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  background-color: #fafafa;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.detail-item:hover {
  background-color: #f0f9ff;
  transform: translateY(-1px);
}

.detail-label {
  font-size: 14px;
  color: #666;
  font-weight: 500;
  margin: 0;
}

.detail-value {
  font-size: 16px;
  color: #333;
  font-weight: 500;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.bind-btn {
  margin-top: 0;
  padding: 0;
  font-size: 13px;
  color: #409eff;
}

.profile-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
}

.stat-card {
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #409eff 0%, #3a8ee6 100%);
  transform: scaleX(0);
  transition: transform 0.35s ease;
}

.stat-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.18);
}

.stat-card:hover::before {
  transform: scaleX(1);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
  position: relative;
}

.stat-icon {
  font-size: 40px;
  color: #409eff;
  transition: all 0.3s ease;
  position: relative;
  z-index: 1;
}

.stat-card:hover .stat-icon {
  transform: scale(1.1) rotate(5deg);
  color: #3a8ee6;
}

.stat-info {
  flex: 1;
  position: relative;
  z-index: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.stat-label {
  font-size: 16px;
  color: #666;
  margin: 0;
  font-weight: 500;
}

.stat-link {
  width: 100%;
  text-align: right;
  color: #409eff;
  font-weight: 600;
  transition: all 0.3s ease;
}

.stat-link:hover {
  color: #3a8ee6;
  transform: translateX(4px);
}

.empty-orders {
  text-align: center;
  padding: 60px 20px;
}

/* 响应式设计 */
@media (max-width: 968px) {
  .profile-header-content {
    flex-direction: column;
    text-align: center;
    padding: 24px;
    gap: 24px;
  }
  
  .profile-header-main {
    justify-content: center;
  }
  
  .profile-header-actions {
    justify-content: center;
  }
  
  .profile-header-stats {
    justify-content: center;
    gap: 24px;
  }
}

@media (max-width: 768px) {
  .profile-username {
    font-size: 24px;
  }
  
  .profile-details {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .profile-stats {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
  
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .profile-header-stats {
    gap: 16px;
  }
  
  .stat-value {
    font-size: 24px;
  }
}
</style>