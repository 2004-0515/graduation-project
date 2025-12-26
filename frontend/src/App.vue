<template>
  <div id="app">
    <router-view />
  </div>
</template>

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
