<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'

// 初始化主题和字体大小设置
const initAppearanceSettings = () => {
  // 字体大小
  const savedFontSize = localStorage.getItem('fontSize')
  if (savedFontSize) {
    const sizeMap: Record<string, string> = { small: '14px', medium: '16px', large: '18px' }
    document.documentElement.style.setProperty('--base-font-size', sizeMap[savedFontSize] || '16px')
  }
  
  // 主题
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme === 'dark') {
    document.documentElement.classList.add('dark-theme')
  } else if (savedTheme === 'auto') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    if (prefersDark) {
      document.documentElement.classList.add('dark-theme')
    }
  }
  
  // 监听系统主题变化
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    const currentTheme = localStorage.getItem('theme')
    if (currentTheme === 'auto') {
      if (e.matches) {
        document.documentElement.classList.add('dark-theme')
      } else {
        document.documentElement.classList.remove('dark-theme')
      }
    }
  })
}

onMounted(() => {
  initAppearanceSettings()
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
