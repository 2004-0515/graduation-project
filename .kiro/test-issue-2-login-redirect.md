# 测试问题 2: 登录后跳转到购物车页面

## 问题描述

**现象**: 用户从购物车页面退出登录后，再次登录时会自动跳转回购物车页面，而不是首页。

**期望行为**: 登录成功后应该跳转到首页 (`/`)，而不是之前访问的页面。

**用户反馈**: "为什么登录成功一开始就跳转到购物车页面？"

## 问题分析

### 根本原因

1. **路由守卫设置 redirect 参数**:
   - 在 `router/index.ts` 的 `beforeEach` 守卫中
   - 当用户访问需要认证的页面（如 `/cart`）但未登录时
   - 会重定向到登录页并设置 `redirect` 参数: `/login?redirect=/cart`

2. **登录后使用 redirect 参数**:
   - 在 `LoginView.vue` 的 `handleLogin` 函数中
   - 登录成功后会读取 `redirect` 参数并跳转
   - 代码: `router.push(redirect || '/')`

3. **退出登录未清除 redirect**:
   - 用户在购物车页面点击退出
   - 退出后跳转到首页 (`/`)
   - 但浏览器历史记录中仍保留了 `/login?redirect=/cart`
   - 用户再次访问登录页时，redirect 参数仍然存在

### 触发场景

1. 用户访问购物车页面 (`/cart`)
2. 点击退出登录
3. 系统跳转到首页 (`/`)
4. 用户点击登录按钮
5. 浏览器可能使用历史记录中的 `/login?redirect=/cart`
6. 登录成功后跳转到 `/cart` 而不是 `/`

## 解决方案

### 方案 1: 退出时跳转到登录页（推荐）

修改 `Navbar.vue` 的 `handleLogout` 函数，退出后直接跳转到登录页（不带 redirect 参数）:

```typescript
const handleLogout = async () => {
  await userStore.logout()
  // 清空购物车状态
  cartStore.items = []
  // 清空通知数量
  notificationStore.clearCount()
  ElMessage.success('已退出登录')
  // 跳转到登录页，清除可能存在的 redirect 参数
  router.push('/login')
}
```

**优点**:
- 简单直接
- 退出后立即可以重新登录
- 清除了 redirect 参数

**缺点**:
- 退出后直接到登录页，可能不符合某些用户习惯

### 方案 2: 登录时忽略特定页面的 redirect

修改 `LoginView.vue` 的 `handleLogin` 函数，忽略购物车等页面的 redirect:

```typescript
const handleLogin = async () => {
  if (!loginFormRef.value) return
  loginFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      loading.value = true
      try {
        await userStore.login({ username: loginForm.username, password: loginForm.password })
        ElMessage.success('登录成功')
        const redirect = router.currentRoute.value.query.redirect as string
        // 忽略购物车等页面的 redirect，统一跳转到首页
        const ignoredPaths = ['/cart', '/checkout', '/payment']
        if (redirect && !ignoredPaths.some(path => redirect.startsWith(path))) {
          router.push(redirect)
        } else {
          router.push('/')
        }
      } catch (error) {
        ElMessage.error(userStore.error || '登录失败')
        refreshCaptcha()
      } finally { loading.value = false }
    }
  })
}
```

**优点**:
- 保留了其他页面的 redirect 功能
- 只针对特定页面忽略 redirect

**缺点**:
- 需要维护忽略列表
- 逻辑较复杂

### 方案 3: 完全移除 redirect 功能

修改 `LoginView.vue`，登录后始终跳转到首页:

```typescript
const handleLogin = async () => {
  if (!loginFormRef.value) return
  loginFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      loading.value = true
      try {
        await userStore.login({ username: loginForm.username, password: loginForm.password })
        ElMessage.success('登录成功')
        // 登录后始终跳转到首页
        router.push('/')
      } catch (error) {
        ElMessage.error(userStore.error || '登录失败')
        refreshCaptcha()
      } finally { loading.value = false }
    }
  })
}
```

**优点**:
- 最简单
- 行为一致，用户体验统一

**缺点**:
- 失去了 redirect 功能的便利性
- 用户需要手动导航回原页面

## 推荐方案

**采用方案 3（完全移除 redirect）**

理由:
1. 对于电商网站，登录后跳转到首页是最常见的做法
2. 避免了复杂的 redirect 逻辑
3. 用户体验更一致
4. 代码更简单，易于维护

## 实施步骤

1. 修改 `frontend/src/views/LoginView.vue`
2. 移除 redirect 参数的读取和使用
3. 登录成功后始终跳转到 `/`
4. 测试验证

## 测试验证

### 测试场景 1: 从购物车退出登录
1. 登录用户访问购物车页面
2. 点击退出登录
3. 点击登录按钮
4. 输入用户名密码登录
5. **验证**: 应该跳转到首页 `/`，而不是 `/cart`

### 测试场景 2: 直接访问登录页
1. 未登录状态
2. 直接访问 `/login`
3. 输入用户名密码登录
4. **验证**: 应该跳转到首页 `/`

### 测试场景 3: 访问受保护页面后登录
1. 未登录状态
2. 尝试访问 `/orders`（需要登录）
3. 系统重定向到 `/login?redirect=/orders`
4. 输入用户名密码登录
5. **验证**: 应该跳转到首页 `/`（不再使用 redirect）

## 状态

- [x] 问题分析完成
- [ ] 解决方案实施
- [ ] 测试验证

## 相关文件

- `frontend/src/views/LoginView.vue` - 登录页面
- `frontend/src/router/index.ts` - 路由守卫
- `frontend/src/components/Navbar.vue` - 导航栏（退出登录）
