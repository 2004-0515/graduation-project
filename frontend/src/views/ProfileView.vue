<template>
  <div class="profile-container">
    <!-- 用户信息头部卡片 -->
    <el-card class="profile-header-card">
      <div class="profile-header-content">
        <div class="profile-header-avatar">
          <el-avatar 
            :size="120" 
            :src="userInfo?.avatar || ''" 
            :icon="User"
            class="profile-avatar-img"
          >
            {{ userInfo?.username?.charAt(0)?.toUpperCase() || 'U' }}
          </el-avatar>
        </div>
        
        <div class="profile-header-info">
          <div class="profile-header-main">
            <h1 class="profile-username">{{ userInfo?.username || '用户' }}</h1>
            <el-tag type="info" size="large" class="user-level-tag">
              <el-icon><StarFilled /></el-icon>
              {{ getUserLevel() }}
            </el-tag>
          </div>
          
          <div class="profile-header-stats">
            <div class="stat-item">
              <div class="stat-value">{{ userInfo?.points || 0 }}</div>
              <div class="stat-label">积分</div>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <div class="stat-value">{{ userInfo?.growthValue || 0 }}</div>
              <div class="stat-label">成长值</div>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <div class="stat-value">{{ userInfo?.memberDays || 0 }}</div>
              <div class="stat-label">会员天数</div>
            </div>
          </div>
          
          <div class="profile-header-actions">
            <el-button type="primary" size="large" @click="editProfile">
              <el-icon><Edit /></el-icon>
              编辑资料
            </el-button>
            <el-button size="large" @click="navigateTo('/settings')">
              <el-icon><Setting /></el-icon>
              账号设置
            </el-button>
          </div>
        </div>
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
import { User, Ticket, Location, StarFilled, Edit, Setting } from '@element-plus/icons-vue'
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
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  overflow: hidden;
}

.profile-header-content {
  display: flex;
  align-items: center;
  gap: 40px;
  padding: 32px;
}

.profile-header-avatar {
  flex-shrink: 0;
}

.profile-avatar-img {
  border: 6px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
  cursor: pointer;
}

.profile-avatar-img:hover {
  transform: scale(1.1);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
}

.profile-header-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.profile-header-main {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.profile-username {
  font-size: 32px;
  font-weight: 700;
  margin: 0;
  color: #fff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.user-level-tag {
  background-color: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #fff;
  font-weight: 600;
}

.user-level-tag .el-icon {
  margin-right: 6px;
}

.profile-header-stats {
  display: flex;
  align-items: center;
  gap: 32px;
  padding: 16px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #fff;
  margin: 0;
}

.stat-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
}

.stat-divider {
  width: 1px;
  height: 40px;
  background-color: rgba(255, 255, 255, 0.2);
}

.profile-header-actions {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

/* 内容区域样式 */
.profile-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.profile-card {
  border-radius: 16px;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
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
  gap: 24px;
}

.stat-card {
  border-radius: 16px;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  overflow: hidden;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.16);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
}

.stat-icon {
  font-size: 40px;
  color: #409eff;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 16px;
  color: #666;
  margin: 0;
}

.stat-link {
  width: 100%;
  text-align: right;
  color: #409eff;
  font-weight: 500;
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