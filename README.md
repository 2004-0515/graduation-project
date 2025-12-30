# 雅集商城 - B2C电子商务系统

基于 Vue 3 + Spring Boot + MySQL 的前后端分离电子商务系统，作为本科毕业设计项目。

## 项目简介

雅集商城是一个功能完善的B2C电子商务平台，采用前后端分离架构，前端使用Vue 3 + TypeScript开发，后端使用Spring Boot构建RESTful API，数据库使用MySQL存储数据。系统实现了用户购物、订单管理、优惠券、商品评价等完整的电商业务功能，同时提供管理员后台进行商品、订单、用户等数据的管理。

## 技术栈

### 前端
- Vue 3 (Composition API)
- TypeScript
- Vite (构建工具)
- Vue Router (路由管理)
- Pinia (状态管理)
- Axios (HTTP请求)
- Element Plus (UI组件库)

### 后端
- Spring Boot 3.x
- Spring Security (安全认证)
- Spring Data JPA (数据访问)
- JWT (身份认证)
- BCrypt (密码加密)
- Maven (构建工具)

### 数据库
- MySQL 8.0

## 功能模块

### 用户端功能
- 用户注册与登录
- 商品浏览（首页、分类、搜索、热销排行）
- 商品详情查看
- 购物车管理（添加、修改数量、删除、全选）
- 订单管理（创建订单、支付、取消、确认收货）
- 收货地址管理
- 优惠券领取与使用
- 商品评价（评分、文字评论、图片上传）
- 消息通知
- 个人中心（信息修改、密码修改）
- 账户设置（通知设置、隐私设置、安全设置）

### 管理端功能
- 数据统计仪表盘
- 商品管理（增删改查、上下架）
- 分类管理
- 订单管理（查看、发货、状态更新、审核取消申请）
- 用户管理（查看、禁用/启用）
- 优惠券管理（创建、编辑、删除）
- 通知管理（发布系统公告）
- 文件审核

## 项目结构

```
graduation-project/
├── backend/                    # 后端Spring Boot项目
│   ├── src/main/java/com/shopping/
│   │   ├── config/            # 配置类
│   │   ├── controller/        # 控制器层
│   │   ├── service/           # 服务层
│   │   ├── repository/        # 数据访问层
│   │   ├── entity/            # 实体类
│   │   ├── dto/               # 数据传输对象
│   │   ├── filter/            # 过滤器
│   │   ├── utils/             # 工具类
│   │   └── exception/         # 异常处理
│   └── src/main/resources/
│       ├── application.properties  # 配置文件
│       ├── schema.sql         # 数据库表结构
│       └── data.sql           # 初始数据
├── frontend/                   # 前端Vue项目
│   ├── src/
│   │   ├── api/               # API接口
│   │   ├── components/        # 公共组件
│   │   ├── views/             # 页面视图
│   │   ├── stores/            # Pinia状态管理
│   │   ├── router/            # 路由配置
│   │   ├── types/             # TypeScript类型定义
│   │   ├── utils/             # 工具函数
│   │   └── constants/         # 常量定义
│   └── public/                # 静态资源
├── uploads/                    # 上传文件存储
├── docs/                       # 项目文档
├── init_chinese.sql           # 中文测试数据
├── docker-compose.yml         # Docker编排文件
└── README.md
```

## 数据库设计

系统包含以下核心数据表：
- tb_user - 用户表
- tb_category - 商品分类表
- tb_product - 商品表
- tb_cart - 购物车表
- tb_order - 订单表
- tb_order_item - 订单明细表
- addresses - 收货地址表
- coupons - 优惠券表
- user_coupons - 用户优惠券关联表
- reviews - 商品评价表
- notifications - 通知消息表
- upload_files - 上传文件表
- notification_settings - 通知设置表
- privacy_settings - 隐私设置表
- security_settings - 安全设置表

## 快速开始

### 环境要求
- JDK 17+
- Node.js 18+
- MySQL 8.0+
- Maven 3.6+

### 数据库配置
1. 创建数据库
```sql
CREATE DATABASE shopping_mall DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. 导入测试数据（可选）
```bash
mysql -u root -p shopping_mall < init_chinese.sql
```

### 后端启动
```bash
cd backend
mvn clean install
mvn spring-boot:run
```
后端服务运行在 http://localhost:8080

### 前端启动
```bash
cd frontend
npm install
npm run dev
```
前端服务运行在 http://localhost:5173

## 测试账号

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | test123456 | 管理员 |
| testuser | test123456 | 普通用户 |

## API接口

后端提供RESTful API，主要接口包括：
- `/api/auth/*` - 认证相关（登录、注册、修改密码）
- `/api/products/*` - 商品相关
- `/api/categories/*` - 分类相关
- `/api/cart/*` - 购物车相关
- `/api/orders/*` - 订单相关
- `/api/addresses/*` - 地址相关
- `/api/coupons/*` - 优惠券相关
- `/api/reviews/*` - 评价相关
- `/api/notifications/*` - 通知相关
- `/api/users/*` - 用户管理

## Docker部署

```bash
# 复制环境变量文件
cp env.example .env

# 编辑配置
vim .env

# 启动服务
docker-compose up -d
```

## 项目截图

（可添加系统截图）

## 开发说明

### 代码规范
- 后端遵循Spring Boot编码规范
- 前端遵循Vue 3 + TypeScript编码规范
- 使用ESLint + Prettier进行代码格式化

### Git提交规范
- feat: 新功能
- fix: 修复bug
- docs: 文档更新
- style: 代码格式
- refactor: 代码重构
- test: 测试相关

## 许可证

MIT License

## 作者

毕业设计项目
