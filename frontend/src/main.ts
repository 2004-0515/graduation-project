import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
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
app.use(ElementPlus, { locale: zhCn })

// 初始化用户信息
const userStore = useUserStore()
userStore.initUser()

// 挂载应用
app.mount('#app')
