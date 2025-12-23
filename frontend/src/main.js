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
app.use(router)
app.use(pinia)
app.use(ElementPlus)

// 初始化用户信息
import { useUserStore } from './stores/userStore'
const userStore = useUserStore()
userStore.initUser()

// 挂载应用
app.mount('#app')
