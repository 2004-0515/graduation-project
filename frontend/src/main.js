import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import './style.css'
import App from './App.vue'

// 创建Vue应用
const app = createApp(App)

// 配置路由
const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('./views/HomeView.vue')
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('./views/LoginView.vue')
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('./views/RegisterView.vue')
    },
    {
      path: '/product/:id',
      name: 'productDetail',
      component: () => import('./views/ProductDetailView.vue')
    },
    {
      path: '/cart',
      name: 'cart',
      component: () => import('./views/CartView.vue')
    },
    {
      path: '/category/:id',
      name: 'category',
      component: () => import('./views/CategoryView.vue')
    },
    {
      path: '/hot-products',
      name: 'hotProducts',
      component: () => import('./views/HotProductsView.vue')
    },
    {
      path: '/promotions',
      name: 'promotions',
      component: () => import('./views/PromotionsView.vue')
    },
    {
      path: '/promotion/:id',
      name: 'promotionDetail',
      component: () => import('./views/PromotionDetailView.vue')
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('./views/ProfileView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/orders',
      name: 'orders',
      component: () => import('./views/OrdersView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/address',
      name: 'address',
      component: () => import('./views/AddressView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('./views/SettingsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/notifications',
      name: 'notifications',
      component: () => import('./views/NotificationsView.vue'),
      meta: { requiresAuth: true }
    }
  ],
  // 配置滚动行为，确保页面跳转后滚动到顶部
  scrollBehavior(to, from, savedPosition) {
    // 始终滚动到顶部
    return { top: 0 }
  }
})

// 配置Pinia状态管理
const pinia = createPinia()

// 注册插件
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
app.use(router)
app.use(pinia)
app.use(ElementPlus, {
  locale: zhCn
})

// 添加路由守卫
import { useUserStore } from './stores/userStore'
router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()
  
  // 如果是受保护的路由，需要验证登录状态
  if (to.meta.requiresAuth) {
    // 如果没有token，跳转到登录页
    if (!userStore.token) {
      next({ name: 'login' })
      return
    }
    
    // 如果有token但没有用户信息，尝试获取用户信息
    if (!userStore.userInfo) {
      try {
        await userStore.fetchCurrentUser()
        next()
      } catch (error) {
        // 获取用户信息失败，跳转到登录页
        next({ name: 'login' })
      }
    } else {
      // 已有用户信息，直接通过
      next()
    }
  } else {
    // 非受保护路由，直接通过
    next()
  }
})

// 初始化用户信息
const userStore = useUserStore()
userStore.initUser()

// 挂载应用
app.mount('#app')
