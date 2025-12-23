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
    }
  ]
})

// 配置Pinia状态管理
const pinia = createPinia()

// 注册插件
app.use(router)
app.use(pinia)
app.use(ElementPlus)

// 挂载应用
app.mount('#app')
