<template>
  <el-config-provider :locale="zhCn">
    <div id="app">
      <router-view />
      <MusicPlayer />
    </div>
  </el-config-provider>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import MusicPlayer from '@/components/MusicPlayer.vue'
import { debugError } from '@/utils/debug'

let mediaQueryList: MediaQueryList | null = null
let handleThemeChange: ((event: MediaQueryListEvent) => void) | null = null

const readAppearanceStorage = (key: 'fontSize' | 'theme') => {
  try {
    return localStorage.getItem(key)
  } catch (error) {
    debugError(`读取${key === 'fontSize' ? '字体大小' : '主题'}设置失败:`, error)
    return null
  }
}

// 初始化主题和字体大小设置
const initAppearanceSettings = () => {
  // 字体大小
  const savedFontSize = readAppearanceStorage('fontSize')
  if (savedFontSize) {
    const sizeMap: Record<string, string> = { small: '14px', medium: '16px', large: '18px' }
    document.documentElement.style.setProperty('--base-font-size', sizeMap[savedFontSize] || '16px')
  }
  
  // 主题
  const savedTheme = readAppearanceStorage('theme')
  if (savedTheme === 'dark') {
    document.documentElement.classList.add('dark-theme')
  } else if (savedTheme === 'auto') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    if (prefersDark) {
      document.documentElement.classList.add('dark-theme')
    } else {
      document.documentElement.classList.remove('dark-theme')
    }
  } else {
    document.documentElement.classList.remove('dark-theme')
  }
  
  // 监听系统主题变化
  mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)')
  handleThemeChange = (e) => {
    const currentTheme = readAppearanceStorage('theme')
    if (currentTheme === 'auto') {
      if (e.matches) {
        document.documentElement.classList.add('dark-theme')
      } else {
        document.documentElement.classList.remove('dark-theme')
      }
    }
  }
  mediaQueryList.addEventListener('change', handleThemeChange)
}

onMounted(() => {
  initAppearanceSettings()
})

onUnmounted(() => {
  if (mediaQueryList && handleThemeChange) {
    mediaQueryList.removeEventListener('change', handleThemeChange)
  }
  mediaQueryList = null
  handleThemeChange = null
})
</script>

<style>
/* 全局重置样式 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* 全局字体和基础样式 */
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  line-height: 1.6;
  color: #333;
  background-color: #f5f5f5;
  font-size: 16px;
}

/* 应用容器样式 */
#app {
  width: 100%;
  min-height: 100vh;
  margin: 0;
  padding: 0;
}
</style>
