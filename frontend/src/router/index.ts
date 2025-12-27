import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue')
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue')
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/RegisterView.vue')
    },
    {
      path: '/product/:id',
      name: 'productDetail',
      component: () => import('@/views/ProductDetailView.vue')
    },
    {
      path: '/cart',
      name: 'cart',
      component: () => import('@/views/CartView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/category',
      name: 'category',
      component: () => import('@/views/CategoryView.vue')
    },
    {
      path: '/hot',
      name: 'hot',
      component: () => import('@/views/HotProductsView.vue')
    },
    {
      path: '/promotions',
      name: 'promotions',
      component: () => import('@/views/PromotionsView.vue')
    },
    {
      path: '/promotion/:id',
      name: 'promotionDetail',
      component: () => import('@/views/PromotionDetailView.vue')
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('@/views/ProfileView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/orders',
      name: 'orders',
      component: () => import('@/views/OrdersView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/order/:id',
      name: 'orderDetail',
      component: () => import('@/views/OrderDetailView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/address',
      name: 'address',
      component: () => import('@/views/AddressView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/SettingsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/notifications',
      name: 'notifications',
      component: () => import('@/views/NotificationsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/checkout',
      name: 'checkout',
      component: () => import('@/views/CheckoutView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/help',
      name: 'help',
      component: () => import('@/views/HelpCenterView.vue')
    },
    {
      path: '/contact',
      name: 'contact',
      component: () => import('@/views/ContactView.vue')
    },
    {
      path: '/terms',
      name: 'terms',
      component: () => import('@/views/TermsView.vue')
    }
  ],
  scrollBehavior() {
    return { top: 0 }
  }
})

// 路由守卫
import { useUserStore } from '@/stores/userStore'
router.beforeEach(async (to, _from, next) => {
  const userStore = useUserStore()

  if (to.meta.requiresAuth) {
    if (!userStore.token) {
      next({ name: 'login', query: { redirect: to.fullPath } })
      return
    }

    if (!userStore.userInfo) {
      try {
        await userStore.fetchCurrentUser()
        next()
      } catch (error) {
        next({ name: 'login', query: { redirect: to.fullPath } })
      }
    } else {
      next()
    }
  } else {
    next()
  }
})

export default router
