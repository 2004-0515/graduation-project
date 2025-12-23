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
            <a href="#" @click.prevent="navigateTo('/category/1')" :class="{ active: $route.path.startsWith('/category') }">商品分类</a>
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
            <el-button type="info">
              {{ userStore.userInfo?.username || '用户' }}
              <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item>个人中心</el-dropdown-item>
                <el-dropdown-item>我的订单</el-dropdown-item>
                <el-dropdown-item divided @click="handleLogout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
        
        <el-badge :value="cartItemCount" class="nav-badge" @click="navigateTo('/cart')">
          <el-icon class="icon-nav"><ShoppingCart /></el-icon>
        </el-badge>
        <el-badge :value="0" class="nav-badge" @click="navigateTo('/notifications')">
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
import { ShoppingCart, Bell, ArrowDown } from '@element-plus/icons-vue'
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
  gap: 10px;
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