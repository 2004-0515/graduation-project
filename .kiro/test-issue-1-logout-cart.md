# 测试问题1: 退出登录后购物车数量未清空

**发现时间**: 2026-03-04 08:30
**严重程度**: 中等
**状态**: ✅ 已修复

---

## 问题描述

用户退出登录后，导航栏购物车图标仍然显示商品数量，这是不正确的行为。

**预期行为**:
- 用户退出登录后，购物车图标不应显示数量
- 购物车状态应该被清空

**实际行为**:
- 退出登录后，购物车图标仍然显示之前的商品数量
- 购物车状态没有被清空

---

## 问题原因

在 `frontend/src/components/Navbar.vue` 的 `handleLogout` 函数中，只调用了 `userStore.logout()`，但没有清空购物车状态。

**问题代码**:
```typescript
const handleLogout = async () => {
  await userStore.logout()
  ElMessage.success('已退出登录')
  router.push('/')
}
```

---

## 修复方案

在退出登录时，同时清空购物车状态和通知数量。

**修复后代码**:
```typescript
const handleLogout = async () => {
  await userStore.logout()
  // 清空购物车状态
  cartStore.items = []
  // 清空通知数量
  notificationStore.clearCount()
  ElMessage.success('已退出登录')
  router.push('/')
}
```

---

## 修复文件

- `frontend/src/components/Navbar.vue`

---

## 测试验证

**测试步骤**:
1. 登录用户账号 (zhangsan/123456)
2. 添加商品到购物车
3. 确认购物车图标显示数量
4. 退出登录
5. 检查购物车图标是否还显示数量

**预期结果**:
- ✅ 退出登录后，购物车图标不显示数量
- ✅ 购物车状态已清空

---

## 相关问题

这个问题可能是昨天修改库存验证功能时引入的，但实际上是一个一直存在的bug，只是之前没有被发现。

---

## 经验教训

1. **状态管理**: 退出登录时需要清空所有用户相关的状态
2. **测试覆盖**: 需要测试退出登录后的各种状态清理
3. **代码审查**: 修改功能时要考虑相关联的状态管理

---

**修复时间**: 2026-03-04 08:32
**修复人**: Kiro AI
