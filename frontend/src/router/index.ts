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
      path: '/ai-recommend',
      name: 'aiRecommend',
      component: () => import('@/views/AiRecommendView.vue')
    },
    {
      path: '/promotion/:id',
      name: 'promotionDetail',
      component: () => import('@/views/PromotionDetailView.vue')
    },
    {
      path: '/coupon/:id',
      name: 'couponDetail',
      component: () => import('@/views/CouponDetailView.vue')
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
      path: '/payment/:id',
      name: 'payment',
      component: () => import('@/views/PaymentView.vue'),
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
    },
    {
      path: '/my-products',
      name: 'myProducts',
      component: () => import('@/views/MyProductsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/seller-orders',
      name: 'sellerOrders',
      component: () => import('@/views/SellerOrdersView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/price-alerts',
      name: 'priceAlerts',
      component: () => import('@/views/PriceAlertsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/rational-consumption',
      name: 'rationalConsumption',
      component: () => import('@/views/RationalConsumptionView.vue'),
      meta: { requiresAuth: true }
    },
    // 管理员后台路由
    {
      path: '/admin',
      name: 'adminDashboard',
      component: () => import('@/views/admin/DashboardView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
      path: '/admin/products',
      name: 'adminProducts',
      component: () => import('@/views/admin/ProductsView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
      path: '/admin/categories',
      name: 'adminCategories',
      component: () => import('@/views/admin/CategoriesView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
      path: '/admin/orders',
      name: 'adminOrders',
      component: () => import('@/views/admin/OrdersManageView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
      path: '/admin/users',
      name: 'adminUsers',
      component: () => import('@/views/admin/UsersView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
      path: '/admin/files',
      name: 'adminFiles',
      component: () => import('@/views/admin/FileReviewView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
      path: '/admin/notifications',
      name: 'adminNotifications',
      component: () => import('@/views/admin/NotificationsManageView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
      path: '/admin/coupons',
      name: 'adminCoupons',
      component: () => import('@/views/admin/CouponsManageView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
      path: '/admin/music',
      name: 'adminMusic',
      component: () => import('@/views/admin/MusicManageView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
      path: '/admin/price',
      name: 'adminPrice',
      component: () => import('@/views/admin/PriceManageView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
      path: '/admin/rational',
      name: 'adminRational',
      component: () => import('@/views/admin/RationalManageView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true }
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
      } catch (error) {
        next({ name: 'login', query: { redirect: to.fullPath } })
        return
      }
    }
    
    // 检查管理员权限
    if (to.meta.requiresAdmin) {
      if (userStore.userInfo?.username !== 'admin') {
        // 非管理员用户访问管理页面，重定向到首页
        next({ name: 'home' })
        return
      }
    }
    
    next()
  } else {
    next()
  }
})

export default router
