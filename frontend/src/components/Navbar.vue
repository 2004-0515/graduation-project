<template>
  <nav class="navbar">
    <div class="nav-inner">
      <router-link to="/" class="logo">
        <span class="logo-text">雅集</span>
      </router-link>
      
      <div class="nav-links">
        <router-link to="/" class="nav-link" :class="{ active: $route.path === '/' }">首页</router-link>
        <router-link to="/category" class="nav-link" :class="{ active: $route.path.startsWith('/category') }">全部商品</router-link>
        <router-link to="/hot" class="nav-link" :class="{ active: $route.path === '/hot' }">热销榜</router-link>
        <router-link to="/promotions" class="nav-link" :class="{ active: $route.path === '/promotions' }">促销活动</router-link>
      </div>
      
      <div class="nav-actions">
        <div class="search-box">
          <input type="text" placeholder="搜索商品..." v-model="query" @keyup.enter="search" />
        </div>
        
        <!-- 消息通知 -->
        <router-link to="/notifications" class="icon-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <span v-if="notificationCount" class="badge">{{ notificationCount }}</span>
        </router-link>
        
        <!-- 购物车 -->
        <router-link to="/cart" class="icon-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M6 6h15l-1.5 9h-12z M9 20a1 1 0 100-2 1 1 0 000 2z M18 20a1 1 0 100-2 1 1 0 000 2z"/>
          </svg>
          <span v-if="cartStore.totalItems" class="badge">{{ cartStore.totalItems }}</span>
        </router-link>
        
        <!-- 用户头像下拉菜单 -->
        <template v-if="userStore.isLoggedIn">
          <div class="user-dropdown" @mouseenter="showDropdown = true" @mouseleave="showDropdown = false">
            <div class="user-link" @click="$router.push('/profile')">
              <img :src="userStore.user?.avatar || avatar" class="avatar" />
            </div>
            <transition name="fade">
              <div v-if="showDropdown" class="dropdown-menu">
                <div class="dropdown-header">
                  <img :src="userStore.user?.avatar || avatar" class="dropdown-avatar" />
                  <div class="dropdown-info">
                    <span class="dropdown-name">{{ userStore.user?.username || '用户' }}</span>
                    <span class="dropdown-email">{{ userStore.user?.email || '' }}</span>
                  </div>
                </div>
                <div class="dropdown-divider"></div>
                <router-link to="/profile" class="dropdown-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  个人中心
                </router-link>
                <router-link to="/orders" class="dropdown-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                  我的订单
                </router-link>
                <router-link to="/address" class="dropdown-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  收货地址
                </router-link>
                <router-link v-if="isAdmin" to="/admin" class="dropdown-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                  管理后台
                </router-link>
                <div class="dropdown-divider"></div>
                <button class="dropdown-item logout" @click="handleLogout">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  退出登录
                </button>
              </div>
            </transition>
          </div>
        </template>
        <template v-else>
          <router-link to="/login" class="btn btn-primary btn-sm">登录</router-link>
        </template>
      </div>
      
      <button class="mobile-btn" @click="open = !open">
        <span :class="{ open }"></span>
      </button>
    </div>
    
    <transition name="slide">
      <div v-if="open" class="mobile-menu">
        <router-link to="/" @click="open = false">首页</router-link>
        <router-link to="/category" @click="open = false">全部商品</router-link>
        <router-link to="/hot" @click="open = false">热销榜</router-link>
        <router-link to="/cart" @click="open = false">购物车</router-link>
        <router-link to="/notifications" @click="open = false">消息通知</router-link>
        <router-link v-if="!userStore.isLoggedIn" to="/login" @click="open = false">登录</router-link>
        <template v-else>
          <router-link to="/profile" @click="open = false">个人中心</router-link>
          <router-link to="/orders" @click="open = false">我的订单</router-link>
          <a @click="handleLogout; open = false" class="logout-link">退出登录</a>
        </template>
      </div>
    </transition>
  </nav>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/userStore'
import { useCartStore } from '@/stores/cartStore'

const router = useRouter()
const userStore = useUserStore()
const cartStore = useCartStore()
const open = ref(false)
const query = ref('')
const showDropdown = ref(false)
const notificationCount = ref(3) // 模拟消息数量
const avatar = 'https://api.dicebear.com/7.x/notionists/svg?seed=default'

// 判断是否为管理员（用户名为 admin）
const isAdmin = computed(() => userStore.userInfo?.username === 'admin')

const search = () => { if (query.value.trim()) router.push(`/category?q=${query.value}`) }

const handleLogout = async () => {
  await userStore.logout()
  ElMessage.success('已退出登录')
  router.push('/')
}

onMounted(() => cartStore.fetchCart())
</script>

<style scoped>
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: linear-gradient(135deg, rgba(230, 242, 255, 0.95), rgba(240, 248, 255, 0.95));
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(183, 212, 255, 0.4);
  box-shadow: 0 2px 20px rgba(90, 143, 212, 0.15);
}

.nav-inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 32px;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  text-decoration: none;
}

.logo-text {
  font-family: 'Noto Sans JP', sans-serif;
  font-size: 24px;
  font-weight: 500;
  color: var(--text-title);
  letter-spacing: 4px;
}

.nav-links {
  display: flex;
  gap: 8px;
}

.nav-link {
  position: relative;
  padding: 10px 22px;
  color: var(--text-body);
  text-decoration: none;
  font-size: 15px;
  font-weight: 500;
  transition: color 0.3s;
}

.nav-link::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 2px;
  background: var(--sakura);
  border-radius: 1px;
  transition: width 0.3s;
}

.nav-link:hover {
  color: var(--text-title);
}

.nav-link.active::after {
  width: 20px;
}

.nav-link.active {
  color: var(--text-title);
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.search-box input {
  width: 200px;
  padding: 12px 18px;
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(200, 200, 220, 0.2);
  border-radius: 24px;
  font-size: 14px;
}

.search-box input:focus {
  width: 220px;
  background: rgba(255, 255, 255, 0.9);
}

.icon-btn {
  position: relative;
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-nav);
  border-radius: 50%;
  transition: all 0.3s;
}

.icon-btn:hover {
  background: rgba(230, 242, 255, 0.5);
  color: var(--text-title);
}

.badge {
  position: absolute;
  top: 2px;
  right: 2px;
  min-width: 18px;
  height: 18px;
  background: var(--sakura);
  color: white;
  font-size: 11px;
  font-weight: 500;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-link {
  display: block;
  cursor: pointer;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid rgba(183, 212, 255, 0.3);
  object-fit: cover;
  transition: border-color 0.3s;
}

.avatar:hover {
  border-color: rgba(183, 212, 255, 0.6);
}

/* 用户下拉菜单 */
.user-dropdown {
  position: relative;
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 12px);
  right: 0;
  width: 240px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(183, 212, 255, 0.4);
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(90, 143, 212, 0.2);
  padding: 8px 0;
  z-index: 200;
}

.dropdown-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
}

.dropdown-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 2px solid rgba(183, 212, 255, 0.3);
  object-fit: cover;
}

.dropdown-info {
  display: flex;
  flex-direction: column;
}

.dropdown-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-title);
}

.dropdown-email {
  font-size: 12px;
  color: var(--text-muted);
}

.dropdown-divider {
  height: 1px;
  background: rgba(200, 200, 220, 0.2);
  margin: 4px 0;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  font-size: 14px;
  color: var(--text-body);
  text-decoration: none;
  transition: all 0.2s;
  cursor: pointer;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
}

.dropdown-item:hover {
  background: rgba(230, 242, 255, 0.5);
  color: var(--text-title);
}

.dropdown-item svg {
  color: var(--text-muted);
}

.dropdown-item:hover svg {
  color: var(--sakura);
}

.dropdown-item.logout {
  color: #e74c3c;
}

.dropdown-item.logout:hover {
  background: rgba(231, 76, 60, 0.1);
}

.dropdown-item.logout svg {
  color: #e74c3c;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.logout-link {
  color: #e74c3c !important;
  cursor: pointer;
}

.btn-sm {
  padding: 8px 20px;
  font-size: 13px;
}

.mobile-btn {
  display: none;
  width: 40px;
  height: 40px;
  background: none;
  border: none;
  cursor: pointer;
  position: relative;
}

.mobile-btn span,
.mobile-btn span::before,
.mobile-btn span::after {
  display: block;
  width: 20px;
  height: 1.5px;
  background: var(--text-nav);
  position: absolute;
  left: 10px;
  transition: all 0.3s;
}

.mobile-btn span { top: 19px; }
.mobile-btn span::before { content: ''; top: -6px; }
.mobile-btn span::after { content: ''; top: 6px; }

.mobile-btn span.open { background: transparent; }
.mobile-btn span.open::before { transform: rotate(45deg); top: 0; }
.mobile-btn span.open::after { transform: rotate(-45deg); top: 0; }

.mobile-menu {
  display: none;
  flex-direction: column;
  padding: 16px 32px 24px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
}

.mobile-menu a {
  padding: 14px 0;
  color: var(--text-nav);
  text-decoration: none;
  font-size: 15px;
  border-bottom: 1px solid rgba(200, 200, 220, 0.15);
}

.slide-enter-active, .slide-leave-active { transition: all 0.3s; }
.slide-enter-from, .slide-leave-to { opacity: 0; transform: translateY(-10px); }

@media (max-width: 900px) {
  .nav-links, .search-box { display: none; }
  .mobile-btn { display: block; }
  .mobile-menu { display: flex; }
  .nav-inner { padding: 0 20px; }
}
</style>
