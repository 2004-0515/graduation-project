<template>
  <div class="admin-layout">
    <aside class="admin-sidebar">
      <div class="sidebar-header">
        <h1>雅集管理</h1>
        <span class="version">v1.0</span>
      </div>
      
      <nav class="sidebar-nav">
        <router-link to="/admin" class="nav-item" :class="{ active: $route.path === '/admin' }">
          <span class="nav-icon">仪表盘</span>
          <span class="nav-text">数据概览</span>
        </router-link>
        <router-link to="/admin/products" class="nav-item" :class="{ active: $route.path.startsWith('/admin/products') }">
          <span class="nav-icon">商品</span>
          <span class="nav-text">商品管理</span>
          <span v-if="pendingProductCount > 0" class="pending-badge">{{ pendingProductCount }}</span>
        </router-link>
        <router-link to="/admin/categories" class="nav-item" :class="{ active: $route.path.startsWith('/admin/categories') }">
          <span class="nav-icon">分类</span>
          <span class="nav-text">分类管理</span>
        </router-link>
        <router-link to="/admin/orders" class="nav-item" :class="{ active: $route.path.startsWith('/admin/orders') }">
          <span class="nav-icon">订单</span>
          <span class="nav-text">订单管理</span>
          <span v-if="pendingOrderCount > 0" class="pending-badge">{{ pendingOrderCount }}</span>
        </router-link>
        <router-link to="/admin/users" class="nav-item" :class="{ active: $route.path.startsWith('/admin/users') }">
          <span class="nav-icon">用户</span>
          <span class="nav-text">用户管理</span>
        </router-link>
        <router-link to="/admin/files" class="nav-item" :class="{ active: $route.path.startsWith('/admin/files') }">
          <span class="nav-icon">审核</span>
          <span class="nav-text">文件审核</span>
          <span v-if="pendingCount > 0" class="pending-badge">{{ pendingCount }}</span>
        </router-link>
        <router-link to="/admin/notifications" class="nav-item" :class="{ active: $route.path.startsWith('/admin/notifications') }">
          <span class="nav-icon">消息</span>
          <span class="nav-text">消息管理</span>
        </router-link>
        <router-link to="/admin/coupons" class="nav-item" :class="{ active: $route.path.startsWith('/admin/coupons') }">
          <span class="nav-icon">券</span>
          <span class="nav-text">促销管理</span>
        </router-link>
        <router-link to="/admin/music" class="nav-item" :class="{ active: $route.path.startsWith('/admin/music') }">
          <span class="nav-icon">乐</span>
          <span class="nav-text">音乐管理</span>
        </router-link>
      </nav>
      
      <div class="sidebar-footer">
        <router-link to="/" class="back-link">返回商城</router-link>
        <button class="logout-btn" @click="handleLogout">退出登录</button>
      </div>
    </aside>
    
    <main class="admin-main">
      <header class="admin-header">
        <div class="header-left">
          <h2>{{ pageTitle }}</h2>
        </div>
        <div class="header-right">
          <span class="admin-name">管理员：{{ userStore.userInfo?.username }}</span>
        </div>
      </header>
      
      <div class="admin-content">
        <slot></slot>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/userStore'
import { useAdminStore } from '@/stores/adminStore'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const adminStore = useAdminStore()

// 从 store 获取待处理数量
const pendingCount = computed(() => adminStore.pendingFileCount)
const pendingProductCount = computed(() => adminStore.pendingProductCount)
const pendingOrderCount = computed(() => adminStore.pendingOrderCount)

const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    '/admin': '数据概览',
    '/admin/products': '商品管理',
    '/admin/categories': '分类管理',
    '/admin/orders': '订单管理',
    '/admin/users': '用户管理',
    '/admin/files': '文件审核',
    '/admin/notifications': '消息管理',
    '/admin/coupons': '促销管理',
    '/admin/music': '音乐管理'
  }
  return titles[route.path] || '管理后台'
})

const handleLogout = async () => {
  await userStore.logout()
  ElMessage.success('已退出登录')
  router.push('/login')
}

onMounted(() => {
  adminStore.refreshAllCounts()
})
</script>

<style scoped>
.admin-layout { display: flex; min-height: 100vh; background: #f5f7fa; overflow-x: hidden; }

.admin-sidebar {
  width: 240px;
  background: linear-gradient(180deg, #1a1f36 0%, #252b48 100%);
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 100;
}

.sidebar-header {
  padding: 24px 20px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.sidebar-header h1 {
  color: #fff;
  font-size: 20px;
  font-weight: 600;
  margin: 0;
}

.version {
  font-size: 12px;
  color: rgba(255,255,255,0.5);
}

.sidebar-nav {
  flex: 1;
  padding: 16px 12px;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  color: rgba(255,255,255,0.7);
  text-decoration: none;
  border-radius: 8px;
  margin-bottom: 4px;
  transition: all 0.3s;
}

.nav-item:hover {
  background: rgba(255,255,255,0.1);
  color: #fff;
}

.nav-item.active {
  background: linear-gradient(135deg, #5A8FD4, #7BA8E8);
  color: #fff;
}

.nav-icon {
  font-size: 12px;
  padding: 4px 8px;
  background: rgba(255,255,255,0.1);
  border-radius: 4px;
}

.nav-item.active .nav-icon {
  background: rgba(255,255,255,0.2);
}

.nav-text {
  font-size: 15px;
  font-weight: 500;
}

.pending-badge {
  margin-left: auto;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  background: #e74c3c;
  color: #fff;
  font-size: 12px;
  font-weight: 500;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sidebar-footer {
  padding: 16px;
  border-top: 1px solid rgba(255,255,255,0.1);
}

.back-link {
  display: block;
  padding: 12px;
  text-align: center;
  color: rgba(255,255,255,0.7);
  text-decoration: none;
  border-radius: 8px;
  margin-bottom: 8px;
  transition: all 0.3s;
}

.back-link:hover {
  background: rgba(255,255,255,0.1);
  color: #fff;
}

.logout-btn {
  width: 100%;
  padding: 12px;
  background: rgba(231, 76, 60, 0.2);
  border: 1px solid rgba(231, 76, 60, 0.4);
  color: #e74c3c;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.logout-btn:hover {
  background: #e74c3c;
  color: #fff;
}

.admin-main {
  flex: 1;
  margin-left: 240px;
  display: flex;
  flex-direction: column;
  width: calc(100vw - 240px);
  max-width: calc(100vw - 240px);
  overflow-x: hidden;
}

.admin-header {
  height: 64px;
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  position: sticky;
  top: 0;
  z-index: 50;
}

.admin-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: #1a1f36;
  margin: 0;
}

.admin-name {
  font-size: 14px;
  color: #666;
}

.admin-content {
  flex: 1;
  padding: 24px;
  overflow: hidden;
  max-width: 100%;
  box-sizing: border-box;
}

@media (max-width: 768px) {
  .admin-sidebar { width: 200px; }
  .admin-main { margin-left: 200px; }
}
</style>
