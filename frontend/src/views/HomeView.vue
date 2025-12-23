<template>
  <div class="home-container">
    <h1>欢迎来到购物商场</h1>
    <p>这里有各种优质商品，欢迎选购！</p>
    <div class="button-group">
      <el-button type="primary" @click="$router.push('/login')">登录</el-button>
      <el-button @click="$router.push('/register')">注册</el-button>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.home-container {
  text-align: center;
  padding: 40px 0;
}

.button-group {
  margin-top: 20px;
}

.button-group .el-button {
  margin: 0 10px;
}
</style>