# 密码修改功能端到端重构计划

## 1. 项目现状分析

### 1.1 现有实现
- **前端**：在 SettingsView.vue 中实现了密码修改表单
- **前端 API**：在 authApi.js 中实现了 changePassword 方法
- **后端接口**：在 AuthController.java 中实现了 /auth/change-password 接口
- **数据库交互**：使用 UserRepository.java 中的 updatePasswordById 方法更新密码

### 1.2 存在问题
- 后端控制器直接处理业务逻辑，违反了分层架构原则
- 使用 Map 接收请求参数，缺乏类型安全
- 错误处理可以更统一和详细
- 前端验证规则可以更完善

## 2. 重构目标

- 实现分层架构，将业务逻辑从控制器移到服务层
- 使用 DTO 类确保类型安全和数据验证
- 统一错误处理，提供清晰的错误信息
- 增强密码验证规则，提高安全性
- 优化用户体验，添加加载状态和详细的错误提示

## 3. 重构方案

### 3.1 后端重构

#### 3.1.1 创建密码修改 DTO
- 创建 `PasswordChangeDto.java` 类，包含当前密码、新密码和确认新密码字段
- 添加数据验证注解

#### 3.1.2 完善 AuthService
- 在 `AuthService.java` 中添加 `changePassword` 方法，实现密码修改的核心逻辑
- 包含旧密码验证、新密码复杂度检查、密码更新等功能

#### 3.1.3 重构 AuthController
- 修改 `changePassword` 接口，使用 `PasswordChangeDto` 接收请求
- 简化控制器逻辑，调用 Service 层处理业务

#### 3.1.4 增强密码验证
- 添加密码复杂度验证（长度、包含字母和数字等）
- 确保新密码与旧密码不同

### 3.2 前端重构

#### 3.2.1 优化表单验证
- 增强前端验证规则，与后端保持一致
- 添加密码强度指示器

#### 3.2.2 改进 API 调用
- 优化错误处理，显示更详细的错误信息
- 添加加载状态

#### 3.2.3 优化用户体验
- 添加密码修改成功后的提示
- 自动跳转到登录页面或刷新当前页面

## 4. 重构步骤

### 4.1 后端实现
1. 创建 `PasswordChangeDto.java` DTO 类
2. 在 `AuthService.java` 中实现 `changePassword` 方法
3. 重构 `AuthController.java` 中的 `changePassword` 接口
4. 测试后端接口功能

### 4.2 前端实现
1. 优化 SettingsView.vue 中的表单验证规则
2. 改进 authApi.js 中的错误处理
3. 添加加载状态和成功提示
4. 测试前端功能

### 4.3 集成测试
1. 测试完整的密码修改流程
2. 测试各种错误场景
3. 测试密码修改后的登录功能

## 5. 预期效果

- 代码结构更清晰，符合分层架构原则
- 类型安全，减少运行时错误
- 错误信息更详细，便于调试和用户理解
- 密码修改过程更安全，防止常见攻击
- 用户体验更流畅，反馈更及时

## 6. 技术栈

- **后端**：Spring Boot 3.2.0 + Spring Security + JPA + MySQL
- **前端**：Vue 3 + Element Plus + Axios + Pinia
- **构建工具**：Maven (后端) + Vite (前端)