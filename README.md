# 购物商场项目开发计划（Spring Boot + Vue 3 + Redis）

## 一、项目概述
开发一个基于Spring Boot + Vue 3 + Redis的前后端分离架构购物商场系统，实现用户注册登录、商品浏览、购物车管理、订单生成、支付等核心功能。

## 二、技术栈选择

### 后端技术栈
- **框架**：Spring Boot 3.x
- **Web框架**：Spring MVC
- **ORM框架**：Spring Data JPA
- **缓存**：Redis
- **身份验证**：JWT (JSON Web Token)
- **密码加密**：BCryptPasswordEncoder
- **API文档**：SpringDoc OpenAPI (Swagger)
- **构建工具**：Maven
- **日志框架**：SLF4J + Logback

### 前端技术栈
- **框架**：Vue 3
- **构建工具**：Vite
- **UI组件库**：Element Plus
- **路由管理**：Vue Router
- **状态管理**：Pinia
- **HTTP请求**：Axios
- **表单验证**：VeeValidate
- **CSS预处理器**：SCSS

### 数据库
- **主数据库**：MySQL 8.x
- **缓存数据库**：Redis 7.x

### 其他技术
- **版本控制**：Git + GitHub
- **容器化**：Docker (可选)
- **CI/CD**：GitHub Actions (可选)

## 三、核心功能模块

### 1. 用户模块
- 用户注册（手机号/邮箱验证）
- 用户登录（密码登录/验证码登录）
- 个人信息管理
- 地址管理
- 密码重置
- JWT身份验证

### 2. 商品模块
- 商品分类管理
- 商品列表展示
- 商品详情展示
- 商品搜索
- 商品筛选与排序
- 商品库存管理
- 商品图片上传

### 3. 购物车模块
- 添加商品到购物车
- 修改购物车商品数量
- 删除购物车商品
- 购物车商品结算
- Redis缓存购物车数据

### 4. 订单模块
- 订单生成
- 订单列表查询
- 订单详情查看
- 订单状态管理
- 订单取消与退款
- 订单物流信息

### 5. 支付模块
- 支付方式集成（微信支付/支付宝支付模拟）
- 支付状态回调
- 支付记录查询

### 6. 管理员后台
- 商品管理
- 用户管理
- 订单管理
- 分类管理
- 统计分析

## 四、数据库设计

### 1. 用户表（tb_user）
- id (主键，自增)
- username (用户名)
- password (密码哈希)
- email (邮箱)
- phone (手机号)
- avatar (头像)
- status (状态：0-禁用，1-启用)
- created_time (创建时间)
- updated_time (更新时间)

### 2. 地址表（tb_address）
- id (主键，自增)
- user_id (外键，关联用户表)
- receiver (收件人)
- phone (联系电话)
- province (省份)
- city (城市)
- district (区县)
- detail (详细地址)
- is_default (是否默认：0-否，1-是)
- created_time (创建时间)
- updated_time (更新时间)

### 3. 商品分类表（tb_category）
- id (主键，自增)
- name (分类名称)
- parent_id (父分类ID，0表示一级分类)
- level (分类级别：1-一级，2-二级，3-三级)
- sort (排序)
- icon (图标)
- status (状态：0-禁用，1-启用)
- created_time (创建时间)
- updated_time (更新时间)

### 4. 商品表（tb_product）
- id (主键，自增)
- category_id (外键，关联分类表)
- name (商品名称)
- subtitle (商品副标题)
- price (价格)
- stock (库存)
- sales (销量)
- images (商品图片，JSON格式)
- detail (商品详情，HTML格式)
- status (状态：0-下架，1-上架)
- created_time (创建时间)
- updated_time (更新时间)

### 5. 购物车表（tb_cart）
- id (主键，自增)
- user_id (外键，关联用户表)
- product_id (外键，关联商品表)
- quantity (数量)
- selected (是否选中：0-否，1-是)
- created_time (创建时间)
- updated_time (更新时间)

### 6. 订单表（tb_order）
- id (主键，自增)
- order_no (订单号，唯一)
- user_id (外键，关联用户表)
- total_amount (总金额)
- payment_method (支付方式：1-微信，2-支付宝)
- payment_status (支付状态：0-未支付，1-已支付，2-支付失败)
- order_status (订单状态：0-待支付，1-待发货，2-待收货，3-已完成，4-已取消)
- shipping_address (收货地址，JSON格式)
- payment_time (支付时间)
- shipping_time (发货时间)
- end_time (完成时间)
- created_time (创建时间)
- updated_time (更新时间)

### 7. 订单商品表（tb_order_item）
- id (主键，自增)
- order_id (外键，关联订单表)
- product_id (外键，关联商品表)
- product_name (商品名称)
- product_image (商品图片)
- price (单价)
- quantity (数量)
- created_time (创建时间)

## 五、开发计划

### 阶段一：项目初始化（1天）
1. 创建后端Spring Boot项目
2. 创建前端Vue 3 + Vite项目
3. 配置Git版本控制
4. 配置MySQL和Redis数据库
5. 搭建项目目录结构

### 阶段二：后端基础架构搭建（2天）
1. 配置Spring Boot基础依赖
2. 配置MySQL数据库连接
3. 配置Redis缓存
4. 配置JWT身份验证
5. 配置跨域支持
6. 配置Swagger API文档
7. 实现全局异常处理
8. 实现统一响应格式

### 阶段三：后端核心功能开发（5天）
1. 实现用户模块API
2. 实现商品分类模块API
3. 实现商品模块API
4. 实现购物车模块API
5. 实现订单模块API
6. 实现支付模块API

### 阶段四：前端基础架构搭建（1天）
1. 配置Vue 3 + Vite项目依赖
2. 配置Element Plus UI组件库
3. 配置Vue Router路由
4. 配置Pinia状态管理
5. 配置Axios拦截器
6. 配置全局样式

### 阶段五：前端核心功能开发（5天）
1. 实现用户登录注册页面
2. 实现商品分类和列表页面
3. 实现商品详情页面
4. 实现购物车页面
5. 实现订单确认和支付页面
6. 实现个人中心页面
7. 实现管理员后台页面

### 阶段六：前后端联调与测试（2天）
1. 前后端API联调
2. 单元测试
3. 集成测试
4. 功能测试
5. 性能测试

### 阶段七：项目优化与部署（1天）
1. 代码优化
2. 性能优化
3. 安全性加固
4. 前端项目构建
5. 后端项目打包
6. 部署到服务器（可选）

## 六、开发流程规范

### 1. 分支管理
- 主分支：main（用于发布稳定版本）
- 开发分支：develop（用于日常开发）
- 功能分支：feature/xxx（用于开发新功能）
- 修复分支：bugfix/xxx（用于修复bug）

### 2. 代码规范
- 后端：遵循Spring Boot编码规范，使用Lombok简化代码
- 前端：遵循Vue 3编码规范，使用ESLint + Prettier格式化代码

### 3. 提交规范
- 提交信息格式：type(scope): description
- 示例：feat(user): 实现用户注册功能
- 常用type：feat（新功能）、fix（修复bug）、docs（文档更新）、style（代码格式）、refactor（代码重构）、test（测试）、chore（构建/工具）

### 4. 版本控制
- 每完成一个功能模块，进行一次git提交
- 每天结束前，将代码推送到GitHub远程仓库
- 每周进行一次代码评审

### 5. 文档规范
- 后端API文档：使用Swagger自动生成
- 项目文档：使用Markdown编写，包括需求分析、设计文档、部署文档等

## 七、预期实现效果

1. 完成一个功能完整的购物商场系统
2. 实现前后端分离架构
3. 具有良好的用户体验和界面设计
4. 系统性能稳定，响应迅速
5. 代码结构清晰，易于维护和扩展
6. 具备完善的API文档

## 八、部署说明

### 8.1 本地开发环境

#### 环境要求
- JDK 17+
- Node.js 18+
- MySQL 8.0+
- Redis 7+

#### 启动步骤
1. **后端服务**
   ```bash
   cd backend
   mvn clean install
   mvn spring-boot:run
   ```

2. **前端服务**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **数据库初始化**
   - 创建数据库：`shopping_mall`
   - 导入初始化脚本（如果有）

### 8.2 Docker部署

#### 使用Docker Compose
```bash
# 克隆项目
git clone <repository-url>
cd shopping-mall

# 复制环境变量文件
cp env.example .env

# 编辑环境变量
vim .env

# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f
```

#### 服务说明
- **MySQL**: 数据库服务，端口3306
- **Redis**: 缓存服务，端口6379
- **Backend**: Spring Boot API服务，端口8080
- **Frontend**: Vue.js前端服务，端口80

### 8.3 生产环境部署

#### 1. 环境变量配置
```bash
# 数据库配置
DB_HOST=your-db-host
DB_USERNAME=your-db-user
DB_PASSWORD=your-db-password

# Redis配置
REDIS_HOST=your-redis-host
REDIS_PASSWORD=your-redis-password

# JWT配置
JWT_SECRET=your-secure-jwt-secret

# CORS配置
CORS_ALLOWED_ORIGINS=https://yourdomain.com
```

#### 2. SSL证书配置
```nginx
# 在nginx.conf中添加SSL配置
server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # ... 其他配置
}
```

#### 3. 监控和日志
- 使用ELK Stack进行日志收集
- 配置Prometheus + Grafana进行监控
- 设置健康检查端点

## 九、风险评估与应对措施

1. **技术难点**：支付功能集成
   - 解决方案：使用第三方支付SDK，模拟支付流程，优先实现核心功能

2. **时间压力**：开发周期紧张
   - 解决方案：合理安排开发计划，优先实现核心功能，简化非核心功能

3. **需求变更**：需求可能发生变化
   - 解决方案：采用敏捷开发方式，及时调整开发计划，保持代码的可扩展性

4. **性能问题**：系统访问量大时性能下降
   - 解决方案：优化数据库查询，使用Redis缓存热点数据，实现异步处理

5. **安全性问题**：系统存在安全漏洞
   - 解决方案：实现JWT身份验证，密码加密存储，防止SQL注入，配置CORS策略

## 九、后续扩展方向

1. 集成更多支付方式
2. 实现商品推荐功能
3. 增加评价和评论系统
4. 实现优惠券和促销活动
5. 开发移动端应用
6. 引入微服务架构
7. 实现分布式事务管理
8. 增加数据统计和报表功能

这个开发计划基于Spring Boot + Vue 3 + Redis技术栈，详细描述了购物商场项目的开发流程和功能模块，为项目的顺利进行提供了指导。