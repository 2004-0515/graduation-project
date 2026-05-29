import { createApp } from 'vue'
import { createPinia } from 'pinia'
import 'element-plus/dist/index.css'
import './style.css'
import App from './App.vue'
import router from './router'
import { useUserStore } from '@/stores/userStore'

// 创建Vue应用
const app = createApp(App)

// 配置Pinia状态管理
const pinia = createPinia()

// 注册插件
app.use(router)
app.use(pinia)

// 初始化用户信息
const userStore = useUserStore()
userStore.initUser()

// 挂载应用
app.mount('#app')
