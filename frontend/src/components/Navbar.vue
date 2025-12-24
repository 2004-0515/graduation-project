<template>
  <header class="navbar">
    <div class="nav-content">
      <div class="logo">
        <h1>购物商城</h1>
      </div>
      <nav class="nav-menu">
        <ul>
          <li>
            <a href="#" @click.prevent="navigateTo('/')" :class="{ active: $route.path === '/' }">首页</a>
          </li>
          <li>
            <a href="#" @click.prevent="navigateTo('/category/0')" :class="{ active: $route.path.startsWith('/category') }">商品分类</a>
          </li>
          <li>
            <a href="#" @click.prevent="navigateTo('/hot-products')" :class="{ active: $route.path === '/hot-products' }">热销商品</a>
          </li>
          <li>
            <a href="#" @click.prevent="navigateTo('/promotions')" :class="{ active: $route.path === '/promotions' }">促销活动</a>
          </li>
        </ul>
      </nav>
      <div class="nav-actions">
        <!-- 未登录状态显示登录/注册按钮 -->
        <template v-if="!userStore.isLoggedIn">
          <el-button @click="navigateTo('/login')" type="primary">登录</el-button>
          <el-button @click="navigateTo('/register')">注册</el-button>
        </template>
        
        <!-- 已登录状态显示用户信息和退出登录按钮 -->
        <template v-else>
          <el-dropdown>
            <div class="user-info-dropdown">
              <div class="user-avatar" @click="navigateTo('/profile')">
                <el-avatar 
                  :size="36" 
                  :src="userStore.userInfo?.avatar || 'https://picsum.photos/200/200?random=' + userStore.userInfo?.id || 'default'"
                  :icon="User"
                  class="user-avatar-img"
                >
                  {{ userStore.userInfo?.username?.charAt(0)?.toUpperCase() || 'U' }}
                </el-avatar>
              </div>
              <span class="username">{{ userStore.userInfo?.username || '用户' }}</span>
              <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="navigateTo('/profile')">
                  <el-icon class="menu-icon"><User /></el-icon>
                  个人中心
                </el-dropdown-item>
                <el-dropdown-item @click="navigateTo('/orders')">
                  <el-icon class="menu-icon"><Ticket /></el-icon>
                  我的订单
                </el-dropdown-item>
                <el-dropdown-item @click="navigateTo('/address')">
                  <el-icon class="menu-icon"><Location /></el-icon>
                  收货地址
                </el-dropdown-item>
                <el-dropdown-item @click="navigateTo('/settings')">
                  <el-icon class="menu-icon"><Setting /></el-icon>
                  账号设置
                </el-dropdown-item>
                <el-dropdown-item divided @click="handleLogout">
                  <el-icon class="menu-icon"><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
        
        <el-badge :value="cartItemCount" :hidden="cartItemCount === 0" class="nav-badge" @click="navigateTo('/cart')">
          <el-icon class="icon-nav"><ShoppingCart /></el-icon>
        </el-badge>
        <el-badge :value="notificationCount" :hidden="notificationCount === 0" class="nav-badge" @click="navigateTo('/notifications')">
          <el-icon class="icon-nav"><Bell /></el-icon>
        </el-badge>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ShoppingCart, Bell, ArrowDown, User, Ticket, Location, Setting, SwitchButton } from '@element-plus/icons-vue'
import { useCartStore } from '../stores/cartStore'
import { useUserStore } from '../stores/userStore'

const router = useRouter()
const cartStore = useCartStore()
const userStore = useUserStore()

// 从用户信息中获取用户ID
const userId = computed(() => {
  return userStore.userInfo?.id || null
})

// 获取购物车商品数量
const cartItemCount = computed(() => {
  return cartStore.totalItems
})

// 通知数量（可以从后端API获取，这里暂时设为0）
const notificationCount = computed(() => {
  // 实际项目中这里应该从后端API获取通知数量
  return 0
})

// 导航方法
const navigateTo = (path) => {
  router.push(path)
}

// 退出登录
const handleLogout = async () => {
  try {
    await userStore.logout()
    ElMessage.success('退出登录成功')
    // 退出登录后清空购物车
    cartStore.cartItems = []
    // 跳转首页
    router.push('/')
  } catch (error) {
    console.error('退出登录失败:', error)
    ElMessage.error('退出登录失败')
  }
}
</script>

<style scoped>
/* 导航栏基础样式 */
.navbar {
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 1000;
  width: 100%;
  height: 60px;
  display: flex;
  align-items: center;
}

/* 导航内容容器 */
.nav-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 0 20px;
  height: 100%;
}

/* Logo样式 */
.logo h1 {
  margin: 0;
  font-size: 24px;
  color: #409eff;
  line-height: 1;
}

/* 导航菜单 */
.nav-menu {
  flex: 1;
  display: flex;
  justify-content: center;
  pointer-events: auto;
}

.nav-menu ul {
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
  pointer-events: auto;
}

.nav-menu li {
  margin: 0 15px;
  pointer-events: auto;
}

.nav-menu a {
  text-decoration: none;
  color: #333;
  font-size: 16px;
  transition: all 0.3s ease;
  padding: 8px 12px;
  border-radius: 4px;
  display: inline-block;
  cursor: pointer;
  pointer-events: auto;
  user-select: none;
  position: relative;
  z-index: 1001;
}

.nav-menu a:hover, .nav-menu a.active {
  color: #409eff;
  background-color: rgba(64, 158, 255, 0.1);
}

/* 导航操作按钮 */
.nav-actions {
  display: flex;
  align-items: center;
  gap: 20px;
  pointer-events: auto;
  z-index: 1001;
}

.nav-actions .el-button {
  margin: 0;
}

/* 图标样式 */
.icon-nav {
  font-size: 20px;
  cursor: pointer;
  color: #666;
  transition: all 0.3s ease;
  padding: 8px;
  border-radius: 4px;
  display: inline-block;
  user-select: none;
}

.icon-nav:hover {
  color: #409eff;
  background-color: rgba(64, 158, 255, 0.1);
}

/* 购物车徽章 */
.nav-badge {
  cursor: pointer;
  pointer-events: auto;
  z-index: 1001;
  /* 调整徽章容器大小 */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

/* 优化徽章样式 */
:deep(.el-badge__content) {
  /* 调整徽章大小 */
  min-width: 18px;
  height: 18px;
  padding: 0 6px;
  font-size: 12px;
  line-height: 18px;
  /* 调整徽章位置 */
  top: 4px;
  right: 4px;
  /* 优化徽章颜色 */
  background-color: #f56c6c;
  color: #fff;
  /* 优化边框 */
  border: 2px solid #fff;
  /* 优化圆角 */
  border-radius: 9px;
}

/* 优化徽章显示效果 */
:deep(.el-badge__content.is-fixed) {
  transform: none;
}

/* 用户信息下拉菜单样式 */
.user-info-dropdown {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  border-radius: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: rgba(64, 158, 255, 0.08);
  border: 1px solid rgba(64, 158, 255, 0.15);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.user-info-dropdown:hover {
  background-color: rgba(64, 158, 255, 0.15);
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.2);
  transform: translateY(-1px);
}

.user-avatar {
  cursor: pointer;
}

.user-avatar-img {
  border: 2px solid #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.user-avatar-img:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.username {
  font-size: 14px;
  color: #333;
  font-weight: 600;
  transition: color 0.3s ease;
}

.user-info-dropdown:hover .username {
  color: #409eff;
}

.menu-icon {
  margin-right: 8px;
  font-size: 16px;
}

.el-dropdown-menu {
  min-width: 190px;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(64, 158, 255, 0.1);
  padding: 8px 0;
}

.el-dropdown-item {
  display: flex;
  align-items: center;
  font-size: 14px;
  padding: 12px 20px;
  border-radius: 0;
  transition: all 0.3s ease;
}

.el-dropdown-item:hover {
  background-color: rgba(64, 158, 255, 0.1);
  color: #409eff;
}

.el-dropdown-item.divided {
  border-top: 1px solid #f0f0f0;
  margin-top: 8px;
  padding-top: 12px;
  margin-bottom: -8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .nav-menu {
    display: none;
  }
  
  .nav-actions {
    justify-content: flex-end;
  }
}

/* 确保点击区域完整 */
.nav-menu a, .nav-actions .el-button, .nav-badge {
  min-height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  vertical-align: middle;
}
</style>