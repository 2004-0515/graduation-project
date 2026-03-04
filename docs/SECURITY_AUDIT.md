# 安全审计报告

## 审计时间: 2026-01-15 (更新)

## 发现的安全问题及修复状态

### 1. 后端权限控制问题

#### 1.1 管理员API缺少权限验证 [已修复]
- **问题**: 多个管理员API端点没有验证调用者是否为管理员
- **修复**: 创建 `AdminUtils.requireAdmin()` 工具方法，在所有管理员API中添加权限验证
- **涉及文件**:
  - `OrderController.java` - 已修复
  - `UserController.java` - 已修复
  - `CouponController.java` - 已修复
  - `NotificationController.java` - 已修复
  - `FileController.java` - 已修复
  - `ProductController.java` - 已修复
  - `MusicController.java` - 已修复
  - `CategoryController.java` - 已修复

#### 1.2 用户删除API权限问题 [已修复]
- **问题**: `UserController.deleteUser()` 没有验证是否为管理员
- **修复**: 添加 `AdminUtils.requireAdmin()` 验证

#### 1.3 商品删除权限问题 [已修复]
- **问题**: `ProductController.deleteProduct()` 没有验证是否为商品所有者或管理员
- **修复**: 添加权限检查，只有管理员或商品所有者可以删除

### 2. 前端权限控制问题

#### 2.1 管理员路由守卫不完整 [已修复]
- **问题**: 路由守卫只检查 `requiresAdmin` 但没有实际验证用户是否为管理员
- **修复**: 在路由守卫中添加 `userStore.userInfo?.username !== 'admin'` 检查

### 3. XSS 漏洞 [已修复]

#### 3.1 AI聊天页面 v-html 使用 [已修复]
- **文件**: `frontend/src/views/AiRecommendView.vue` 第58行
- **问题**: 使用 `v-html="formatMessage(msg.content)"` 渲染AI返回内容
- **风险**: 如果AI返回恶意脚本，可能导致XSS攻击
- **修复**: 添加 `escapeHtml()` 函数，在格式化前先转义HTML特殊字符
- **状态**: 已修复

### 4. 敏感信息泄露 [已修复]

#### 4.1 前端环境文件暴露API密钥 [已修复]
- **文件**: `frontend/.env.development`
- **问题**: 硬编码了 AI API 密钥 `VITE_AI_API_KEY=sk-...`
- **风险**: 
  - 密钥会被打包到前端代码中，任何人都可以查看
  - 密钥可能被滥用，产生费用
- **修复**: 移除硬编码密钥，改为注释说明让用户在界面中配置
- **状态**: 已修复

#### 4.2 JWT密钥使用默认值 [中等风险]
- **文件**: `backend/src/main/resources/application.properties`
- **问题**: JWT密钥有默认值 `shopping-mall-secret-key-change-in-production-environment-2024`
- **风险**: 生产环境如果忘记配置，会使用不安全的默认密钥
- **修复建议**: 生产环境必须通过环境变量配置强密钥
- **状态**: 已通过环境变量支持，需确保生产环境配置

### 5. 数据验证问题

#### 5.1 订单项发货权限 [已实现]
- **状态**: 已在 `OrderService.sellerShipItem()` 中正确验证 sellerId

### 6. 已实现的安全措施

#### 6.1 JWT Token 安全
- 使用 HMAC-SHA256 签名
- Token 有效期配置（24小时）
- 支持环境变量配置密钥

#### 6.2 密码安全
- BCrypt 加密存储
- 密码复杂度验证（6-20字符，包含数字和字母）
- 新旧密码不能相同

#### 6.3 文件上传安全
- 文件类型验证（MIME类型检查）
- 文件大小限制（头像2MB，商品5MB，视频50MB）
- 文件名随机化（UUID）
- 按类型和日期分目录存储
- 非管理员上传需审核

#### 6.4 CORS 配置
- 限制允许的来源
- 支持环境变量配置
- 开发环境仅允许 localhost

#### 6.5 SQL注入防护
- 使用 Spring Data JPA 参数化查询
- 未发现原生SQL拼接

#### 6.6 认证与授权
- JWT无状态认证
- 路由守卫前后端双重验证
- 管理员API统一权限检查

### 7. 安全建议（未来改进）

#### 高优先级
1. 修复 XSS 漏洞 - 添加 HTML 消毒
2. 移除前端硬编码的 API 密钥
3. 启用请求频率限制（RateLimiterFilter）

#### 中优先级
4. 添加 Token 黑名单机制用于登出
5. 实现 Refresh Token 机制
6. 添加文件内容检测（防止伪装文件）
7. 添加操作日志记录

#### 低优先级
8. 添加 HTTPS 强制跳转
9. 添加安全响应头（CSP, X-Frame-Options等）
10. 实现账户锁定机制（多次登录失败）

---

## 修复总结

### 已修复问题（2026-01-11）
1. 后端管理员API权限验证 - 8个控制器已修复
2. 用户/商品删除权限 - 已修复
3. 前端管理员路由守卫 - 已修复

### 待修复问题（2026-01-15 发现）
- 无（已全部修复）

### 安全评估
- **整体安全等级**: 良好
- **主要风险**: 已修复
- **建议**: 生产环境确保配置强JWT密钥
