# 购物商城项目零基础教程

## 目录

1. [项目概述](#1-项目概述)
2. [技术栈介绍](#2-技术栈介绍)
3. [项目结构详解](#3-项目结构详解)
4. [核心概念讲解](#4-核心概念讲解)
5. [数据库设计](#5-数据库设计)
6. [后端架构](#6-后端架构)
7. [前端架构](#7-前端架构)
8. [功能模块详解](#8-功能模块详解)
9. [如何运行项目](#9-如何运行项目)
10. [开发流程指南](#10-开发流程指南)

---

## 1. 项目概述

### 1.1 这是什么项目？

这是一个**全栈购物商城系统**，类似于淘宝、京东的简化版。用户可以：
- 浏览和搜索商品
- 将商品加入购物车
- 下单购买
- 管理订单
- 使用优惠券
- 设置降价提醒
- 等等...

### 1.2 项目特色功能

| 功能模块 | 说明 |
|----------|------|
| 用户系统 | 注册、登录、个人信息管理 |
| 商品系统 | 商品展示、分类、搜索 |
| 购物车 | 添加、修改、删除商品 |
| 订单系统 | 下单、支付、发货、收货 |
| 优惠券 | 领取、使用优惠券 |
| 价格监控 | 商品降价提醒 |
| 理性消费 | 预算管理、心愿单冷静期 |
| 后台管理 | 管理员管理商品、订单、用户 |

---

## 2. 技术栈介绍

### 2.1 什么是"技术栈"？

技术栈就是开发这个项目用到的所有技术工具的组合。就像盖房子需要砖头、水泥、钢筋一样，开发软件也需要各种工具。

### 2.2 后端技术（服务器端）

```
后端 = 处理数据和业务逻辑的部分（用户看不到）
```

| 技术 | 作用 | 通俗解释 |
|------|------|----------|
| **Java 17** | 编程语言 | 写代码用的语言，就像英语是交流工具 |
| **Spring Boot 3** | 开发框架 | 帮你快速搭建项目的工具箱 |
| **Spring Data JPA** | 数据库操作 | 让你用Java代码操作数据库，不用写SQL |
| **MySQL 8.0** | 数据库 | 存储所有数据的仓库 |
| **Maven** | 项目管理 | 管理项目依赖和构建的工具 |
| **JWT** | 身份认证 | 验证用户身份的"通行证" |

### 2.3 前端技术（用户界面）

```
前端 = 用户能看到和操作的界面部分
```

| 技术 | 作用 | 通俗解释 |
|------|------|----------|
| **Vue 3** | 前端框架 | 构建用户界面的工具 |
| **TypeScript** | 编程语言 | JavaScript的增强版，更安全 |
| **Vite** | 构建工具 | 让开发更快的工具 |
| **Element Plus** | UI组件库 | 现成的按钮、表格等界面组件 |
| **Pinia** | 状态管理 | 管理全局数据的工具 |
| **Axios** | HTTP请求 | 前端和后端通信的工具 |

### 2.4 前后端如何协作？

```
┌─────────────┐     HTTP请求      ┌─────────────┐     SQL      ┌─────────────┐
│   前端      │ ───────────────→ │   后端      │ ──────────→ │   数据库    │
│  (Vue 3)   │ ←─────────────── │(Spring Boot)│ ←────────── │  (MySQL)   │
│  用户界面   │     JSON响应      │  业务逻辑   │    数据      │  数据存储   │
└─────────────┘                  └─────────────┘              └─────────────┘
```

**举例说明**：
1. 用户在前端点击"登录"按钮
2. 前端发送用户名和密码到后端
3. 后端查询数据库验证用户
4. 后端返回登录结果给前端
5. 前端显示登录成功或失败

---

## 3. 项目结构详解

### 3.1 整体目录结构

```
shopping-mall/                    # 项目根目录
├── backend/                      # 后端代码（Java）
├── frontend/                     # 前端代码（Vue）
├── docs/                         # 文档
├── uploads/                      # 上传的文件（图片等）
├── .kiro/                        # Kiro配置和规范
│   ├── specs/                    # 功能规格说明
│   └── steering/                 # 开发规范文档
├── docker-compose.yml            # Docker配置
└── *.sql                         # 数据库脚本
```

### 3.2 后端目录结构详解

```
backend/src/main/java/com/shopping/
├── config/          # 配置类 - 项目的各种设置
├── constants/       # 常量类 - 定义状态码等固定值
├── controller/      # 控制器 - 接收前端请求
├── dto/             # 数据传输对象 - 前后端数据交换格式
├── entity/          # 实体类 - 对应数据库表
├── exception/       # 异常类 - 错误处理
├── filter/          # 过滤器 - 请求拦截
├── handler/         # 处理器 - 全局异常处理
├── repository/      # 仓库层 - 数据库操作
├── service/         # 服务层 - 业务逻辑
└── utils/           # 工具类 - 通用功能
```

### 3.3 前端目录结构详解

```
frontend/src/
├── api/             # API接口 - 调用后端的函数
├── assets/          # 静态资源 - 图片等
├── components/      # 组件 - 可复用的界面部分
├── constants/       # 常量 - 状态码等
├── router/          # 路由 - 页面导航配置
├── stores/          # 状态管理 - 全局数据
├── types/           # 类型定义 - TypeScript类型
├── utils/           # 工具函数
├── views/           # 页面视图
│   └── admin/       # 管理员页面
├── App.vue          # 根组件
└── main.ts          # 入口文件
```

---

## 4. 核心概念讲解

### 4.1 MVC架构模式

这个项目使用**MVC架构**，这是一种组织代码的方式：

```
┌─────────────────────────────────────────────────────────────┐
│                        MVC 架构                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   Model（模型）        View（视图）        Controller（控制器）│
│   ↓                    ↓                   ↓                 │
│   数据和业务逻辑        用户界面             处理请求          │
│   ↓                    ↓                   ↓                 │
│   Entity + Service     Vue组件              Controller       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 后端分层架构

```
请求流程：前端 → Controller → Service → Repository → 数据库

┌──────────────┐
│  Controller  │  接收请求，返回响应（交通警察）
├──────────────┤
│   Service    │  处理业务逻辑（大脑）
├──────────────┤
│  Repository  │  操作数据库（仓库管理员）
├──────────────┤
│   Entity     │  数据模型（货物）
└──────────────┘
```

**举例：用户登录流程**

```java
// 1. Controller 接收请求
@PostMapping("/login")
public Response login(@RequestBody LoginRequest request) {
    return authService.login(request);  // 交给Service处理
}

// 2. Service 处理业务逻辑
public Response login(LoginRequest request) {
    User user = userRepository.findByUsername(request.getUsername());
    if (user != null && 密码正确) {
        return 生成Token并返回;
    }
    return 登录失败;
}

// 3. Repository 查询数据库
User findByUsername(String username);  // 自动生成SQL查询
```

### 4.3 RESTful API

REST是一种设计API的风格，让接口更规范：

| HTTP方法 | 用途 | 示例 |
|----------|------|------|
| GET | 获取数据 | GET /api/products → 获取商品列表 |
| POST | 创建数据 | POST /api/orders → 创建订单 |
| PUT | 更新数据 | PUT /api/users/1 → 更新用户1的信息 |
| DELETE | 删除数据 | DELETE /api/cart/1 → 删除购物车项1 |

### 4.4 JWT身份认证

JWT（JSON Web Token）是一种身份验证方式：

```
登录流程：
1. 用户输入用户名密码
2. 后端验证成功后，生成一个Token（像通行证）
3. 前端保存这个Token
4. 之后每次请求都带上Token
5. 后端验证Token，确认用户身份

Token示例：
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJuYW1lIjoiYWRtaW4ifQ.xxx
```

---

## 5. 数据库设计

### 5.1 主要数据表

```
┌─────────────────────────────────────────────────────────────────┐
│                        数据库表关系图                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   tb_user (用户表)                                               │
│      ↓                                                           │
│   ┌──┴──────────────────────────────────────┐                   │
│   ↓           ↓           ↓           ↓     ↓                   │
│ tb_order   tb_cart   tb_review   addresses  tb_wishlist         │
│ (订单)     (购物车)   (评价)      (地址)     (心愿单)            │
│   ↓                                                              │
│ tb_order_item (订单项)                                           │
│   ↓                                                              │
│ tb_product (商品) ← tb_category (分类)                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 核心表结构

#### 用户表 (tb_user)
```sql
CREATE TABLE tb_user (
    id          BIGINT PRIMARY KEY,      -- 用户ID
    username    VARCHAR(50) NOT NULL,    -- 用户名
    password    VARCHAR(255) NOT NULL,   -- 密码（加密存储）
    nickname    VARCHAR(50),             -- 昵称
    email       VARCHAR(100),            -- 邮箱
    phone       VARCHAR(20),             -- 手机号
    avatar      VARCHAR(255),            -- 头像
    role        VARCHAR(20),             -- 角色：USER/ADMIN
    status      TINYINT DEFAULT 1,       -- 状态：0禁用/1启用
    created_time DATETIME,               -- 创建时间
    updated_time DATETIME                -- 更新时间
);
```

#### 商品表 (tb_product)
```sql
CREATE TABLE tb_product (
    id           BIGINT PRIMARY KEY,     -- 商品ID
    name         VARCHAR(200) NOT NULL,  -- 商品名称
    description  TEXT,                   -- 商品描述
    price        DECIMAL(10,2),          -- 价格
    stock        INT,                    -- 库存
    category_id  BIGINT,                 -- 分类ID
    seller_id    BIGINT,                 -- 卖家ID
    image        VARCHAR(255),           -- 商品图片
    status       TINYINT DEFAULT 1,      -- 状态：0下架/1在售
    audit_status TINYINT DEFAULT 0,      -- 审核：0待审/1通过/2拒绝
    created_time DATETIME
);
```

#### 订单表 (tb_order)
```sql
CREATE TABLE tb_order (
    id             BIGINT PRIMARY KEY,
    order_no       VARCHAR(50) NOT NULL,  -- 订单号
    user_id        BIGINT NOT NULL,       -- 用户ID
    total_amount   DECIMAL(10,2),         -- 总金额
    pay_amount     DECIMAL(10,2),         -- 实付金额
    order_status   TINYINT DEFAULT 0,     -- 订单状态
    payment_status TINYINT DEFAULT 0,     -- 支付状态
    address_id     BIGINT,                -- 收货地址
    created_time   DATETIME,
    pay_time       DATETIME,              -- 支付时间
    end_time       DATETIME               -- 完成时间
);
```

### 5.3 状态码说明

这是项目中最重要的概念之一！

#### 订单状态 (order_status)
```
0 = 待付款    用户刚下单，还没付钱
1 = 待发货    用户已付款，等卖家发货
2 = 待收货    卖家已发货，等用户收货
3 = 已完成    用户确认收货，订单结束
4 = 已取消    订单被取消
5 = 退款中    用户申请退款
6 = 申请取消中 用户申请取消（待发货时）
```

#### 支付状态 (payment_status)
```
0 = 未支付
1 = 已支付
2 = 支付失败
```

---

## 6. 后端架构

### 6.1 代码示例：一个完整的功能

以"获取商品列表"为例，看看代码是怎么组织的：

#### Entity（实体类）- 对应数据库表
```java
// backend/src/main/java/com/shopping/entity/Product.java
@Entity
@Table(name = "tb_product")
public class Product {
    @Id
    private Long id;
    private String name;
    private BigDecimal price;
    private Integer stock;
    // ... 其他字段
}
```

#### Repository（仓库）- 数据库操作
```java
// backend/src/main/java/com/shopping/repository/ProductRepository.java
public interface ProductRepository extends JpaRepository<Product, Long> {
    // Spring Data JPA 会自动实现这些方法！
    List<Product> findByStatus(Integer status);
    List<Product> findByCategoryId(Long categoryId);
    Page<Product> findByNameContaining(String name, Pageable pageable);
}
```

#### Service（服务）- 业务逻辑
```java
// backend/src/main/java/com/shopping/service/ProductService.java
@Service
public class ProductService {
    @Autowired
    private ProductRepository productRepository;
    
    public Page<Product> getProducts(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return productRepository.findByStatus(1, pageable);  // 只查在售商品
    }
    
    public Product getProductById(Long id) {
        return productRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("商品不存在"));
    }
}
```

#### Controller（控制器）- 接收请求
```java
// backend/src/main/java/com/shopping/controller/ProductController.java
@RestController
@RequestMapping("/api/products")
public class ProductController {
    @Autowired
    private ProductService productService;
    
    @GetMapping
    public Response<Page<Product>> getProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<Product> products = productService.getProducts(page, size);
        return Response.success(products);
    }
    
    @GetMapping("/{id}")
    public Response<Product> getProduct(@PathVariable Long id) {
        Product product = productService.getProductById(id);
        return Response.success(product);
    }
}
```

### 6.2 常量类的使用

为什么要用常量？避免"魔法数字"，让代码更易读：

```java
// ❌ 不好的写法
if (order.getStatus() == 1) { ... }  // 1是什么意思？

// ✅ 好的写法
if (order.getStatus() == OrderConstants.OrderStatus.PENDING_SHIPMENT) { ... }
```

```java
// backend/src/main/java/com/shopping/constants/OrderConstants.java
public class OrderConstants {
    public static class OrderStatus {
        public static final int PENDING_PAYMENT = 0;   // 待付款
        public static final int PENDING_SHIPMENT = 1;  // 待发货
        public static final int PENDING_RECEIPT = 2;   // 待收货
        public static final int COMPLETED = 3;         // 已完成
        public static final int CANCELLED = 4;         // 已取消
        public static final int REFUNDING = 5;         // 退款中
        public static final int CANCEL_REQUESTED = 6;  // 申请取消中
    }
}
```

### 6.3 统一响应格式

所有API都返回统一格式：

```java
// backend/src/main/java/com/shopping/dto/Response.java
public class Response<T> {
    private int code;        // 状态码：200成功，400错误等
    private String message;  // 提示信息
    private boolean success; // 是否成功
    private T data;          // 返回的数据
    
    public static <T> Response<T> success(T data) {
        return new Response<>(200, "success", true, data);
    }
    
    public static Response<?> error(String message) {
        return new Response<>(400, message, false, null);
    }
}
```

---

## 7. 前端架构

### 7.1 Vue 3 基础概念

#### 组件是什么？
组件就是可复用的界面模块，像乐高积木一样拼装页面。

```vue
<!-- frontend/src/components/Navbar.vue -->
<template>
  <!-- 模板：定义界面长什么样 -->
  <nav class="navbar">
    <div class="logo">购物商城</div>
    <div class="user-info">{{ username }}</div>
  </nav>
</template>

<script setup lang="ts">
// 脚本：定义数据和逻辑
import { ref } from 'vue'

const username = ref('张三')  // ref 创建响应式数据
</script>

<style scoped>
/* 样式：定义外观 */
.navbar {
  background: #409eff;
  padding: 10px;
}
</style>
```

### 7.2 API调用示例

```typescript
// frontend/src/api/productApi.ts
import axios from '@/utils/axios'

// 获取商品列表
export const getProducts = (page: number, size: number) => {
  return axios.get('/api/products', { params: { page, size } })
}

// 获取商品详情
export const getProductById = (id: number) => {
  return axios.get(`/api/products/${id}`)
}

// 搜索商品
export const searchProducts = (keyword: string) => {
  return axios.get('/api/products/search', { params: { keyword } })
}
```

### 7.3 在页面中使用API

```vue
<!-- frontend/src/views/HomeView.vue -->
<template>
  <div class="home">
    <div v-for="product in products" :key="product.id" class="product-card">
      <img :src="product.image" />
      <h3>{{ product.name }}</h3>
      <p class="price">¥{{ product.price }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getProducts } from '@/api/productApi'

const products = ref([])  // 商品列表

// 组件加载时获取数据
onMounted(async () => {
  const res = await getProducts(0, 10)
  if (res.data.success) {
    products.value = res.data.data.content
  }
})
</script>
```

### 7.4 状态管理 (Pinia)

Pinia用于管理全局共享的数据，比如用户登录状态：

```typescript
// frontend/src/stores/userStore.ts
import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  // 状态（数据）
  state: () => ({
    user: null as User | null,
    token: localStorage.getItem('token') || ''
  }),
  
  // 计算属性
  getters: {
    isLoggedIn: (state) => !!state.token,
    isAdmin: (state) => state.user?.role === 'ADMIN'
  },
  
  // 方法
  actions: {
    setUser(user: User) {
      this.user = user
    },
    setToken(token: string) {
      this.token = token
      localStorage.setItem('token', token)
    },
    logout() {
      this.user = null
      this.token = ''
      localStorage.removeItem('token')
    }
  }
})
```

### 7.5 在组件中使用Store

```vue
<script setup lang="ts">
import { useUserStore } from '@/stores/userStore'

const userStore = useUserStore()

// 使用状态
console.log(userStore.isLoggedIn)  // 是否登录
console.log(userStore.user?.username)  // 用户名

// 调用方法
userStore.logout()  // 退出登录
</script>
```

---

## 8. 功能模块详解

### 8.1 用户模块

**功能**：注册、登录、个人信息管理

**相关文件**：
```
后端：
- controller/AuthController.java    # 认证接口
- service/AuthService.java          # 认证逻辑
- entity/User.java                  # 用户实体

前端：
- views/LoginView.vue               # 登录页面
- views/RegisterView.vue            # 注册页面
- views/ProfileView.vue             # 个人中心
- stores/userStore.ts               # 用户状态
- api/authApi.ts                    # 认证API
```

**登录流程图**：
```
用户输入账号密码
       ↓
前端调用 authApi.login()
       ↓
后端 AuthController.login()
       ↓
AuthService 验证用户名密码
       ↓
验证成功 → 生成JWT Token
       ↓
返回Token给前端
       ↓
前端保存Token到 localStorage
       ↓
userStore 更新登录状态
       ↓
跳转到首页
```

### 8.2 商品模块

**功能**：商品展示、分类浏览、搜索

**相关文件**：
```
后端：
- controller/ProductController.java
- service/ProductService.java
- entity/Product.java
- entity/Category.java

前端：
- views/HomeView.vue                # 首页商品展示
- views/ProductDetailView.vue       # 商品详情
- views/CategoryView.vue            # 分类页面
- api/productApi.ts
```

### 8.3 购物车模块

**功能**：添加商品、修改数量、删除、结算

**相关文件**：
```
后端：
- controller/CartController.java
- service/CartService.java
- entity/Cart.java

前端：
- views/CartView.vue
- stores/cartStore.ts
- api/cartApi.ts
```

**购物车操作流程**：
```
添加商品到购物车
       ↓
cartApi.addToCart(productId, quantity)
       ↓
后端检查：商品是否存在？库存够吗？
       ↓
如果购物车已有该商品 → 增加数量
如果没有 → 新增记录
       ↓
返回更新后的购物车
       ↓
前端更新 cartStore
```

### 8.4 订单模块

**功能**：创建订单、支付、发货、收货、取消

**相关文件**：
```
后端：
- controller/OrderController.java
- service/OrderService.java
- entity/Order.java
- entity/OrderItem.java

前端：
- views/CheckoutView.vue            # 结算页面
- views/OrdersView.vue              # 订单列表
- views/OrderDetailView.vue         # 订单详情
- api/orderApi.ts
```

**订单状态流转**：
```
┌─────────────────────────────────────────────────────────────┐
│                      订单状态流转图                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   创建订单 → [待付款] ──支付──→ [待发货] ──发货──→ [待收货]  │
│                 │                  │                  │      │
│                 │                  │                  ↓      │
│                 │                  │              [已完成]   │
│                 │                  │                         │
│                 ↓                  ↓                         │
│            [已取消]          [申请取消中]                    │
│                                    │                         │
│                                    ↓                         │
│                               [已取消]                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 8.5 管理员模块

**功能**：管理用户、商品、订单、优惠券等

**相关文件**：
```
前端：
- views/admin/DashboardView.vue     # 仪表盘
- views/admin/UsersView.vue         # 用户管理
- views/admin/ProductsView.vue      # 商品管理
- views/admin/OrdersManageView.vue  # 订单管理
- views/admin/CouponsManageView.vue # 优惠券管理
- components/AdminLayout.vue        # 管理后台布局
- api/adminApi.ts
```

---

## 9. 如何运行项目

### 9.1 环境准备

需要安装以下软件：

| 软件 | 版本 | 用途 | 下载地址 |
|------|------|------|----------|
| JDK | 17+ | 运行Java | https://adoptium.net/ |
| Node.js | 18+ | 运行前端 | https://nodejs.org/ |
| MySQL | 8.0 | 数据库 | https://mysql.com/ |
| Maven | 3.8+ | 构建后端 | https://maven.apache.org/ |

### 9.2 数据库配置

1. 创建数据库：
```sql
CREATE DATABASE shopping_mall CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. 导入数据：
   - 在 Navicat 中打开 `backend/src/main/resources/schema.sql`
   - 执行创建表结构
   - 打开 `backend/src/main/resources/data.sql`
   - 执行插入测试数据

3. 修改数据库配置：
```properties
# backend/src/main/resources/application.properties
spring.datasource.url=jdbc:mysql://localhost:3306/shopping_mall
spring.datasource.username=你的用户名
spring.datasource.password=你的密码
```

### 9.3 启动后端

```bash
# 进入后端目录
cd backend

# 使用Maven启动（首次会下载依赖，需要等待）
mvn spring-boot:run

# 或者先编译再运行
mvn clean package -DskipTests
java -jar target/shopping-mall-0.0.1-SNAPSHOT.jar
```

启动成功后会看到：
```
Started ShoppingMallApplication in X.XXX seconds
```

后端运行在：http://localhost:8080

### 9.4 启动前端

```bash
# 进入前端目录
cd frontend

# 安装依赖（首次需要）
npm install

# 启动开发服务器
npm run dev
```

启动成功后会看到：
```
VITE v5.x.x  ready in XXX ms

➜  Local:   http://localhost:5173/
```

前端运行在：http://localhost:5173

### 9.5 测试账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | admin | 123456 |
| 普通用户 | zhangsan | 123456 |

### 9.6 常见问题

**Q: 后端启动报数据库连接错误？**
A: 检查MySQL是否启动，用户名密码是否正确

**Q: 前端启动报错？**
A: 删除 `node_modules` 文件夹，重新执行 `npm install`

**Q: 登录后跳转失败？**
A: 检查后端是否正常运行，查看浏览器控制台错误信息

---

## 10. 开发流程指南

### 10.1 如何添加一个新功能？

以"添加商品收藏功能"为例：

#### 步骤1：设计数据库表
```sql
CREATE TABLE tb_favorite (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    created_time DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 步骤2：创建后端Entity
```java
// backend/src/main/java/com/shopping/entity/Favorite.java
@Entity
@Table(name = "tb_favorite")
public class Favorite {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long userId;
    private Long productId;
    private LocalDateTime createdTime;
    // getter/setter
}
```

#### 步骤3：创建Repository
```java
// backend/src/main/java/com/shopping/repository/FavoriteRepository.java
public interface FavoriteRepository extends JpaRepository<Favorite, Long> {
    List<Favorite> findByUserId(Long userId);
    Optional<Favorite> findByUserIdAndProductId(Long userId, Long productId);
    void deleteByUserIdAndProductId(Long userId, Long productId);
}
```

#### 步骤4：创建Service
```java
// backend/src/main/java/com/shopping/service/FavoriteService.java
@Service
public class FavoriteService {
    @Autowired
    private FavoriteRepository favoriteRepository;
    
    public void addFavorite(Long userId, Long productId) {
        // 检查是否已收藏
        if (favoriteRepository.findByUserIdAndProductId(userId, productId).isPresent()) {
            throw new BusinessException("已经收藏过了");
        }
        Favorite favorite = new Favorite();
        favorite.setUserId(userId);
        favorite.setProductId(productId);
        favoriteRepository.save(favorite);
    }
    
    public List<Favorite> getUserFavorites(Long userId) {
        return favoriteRepository.findByUserId(userId);
    }
}
```

#### 步骤5：创建Controller
```java
// backend/src/main/java/com/shopping/controller/FavoriteController.java
@RestController
@RequestMapping("/api/favorites")
public class FavoriteController {
    @Autowired
    private FavoriteService favoriteService;
    
    @PostMapping
    public Response<?> addFavorite(@RequestParam Long productId) {
        Long userId = SecurityUtils.getCurrentUserId();
        favoriteService.addFavorite(userId, productId);
        return Response.success("收藏成功");
    }
    
    @GetMapping
    public Response<List<Favorite>> getFavorites() {
        Long userId = SecurityUtils.getCurrentUserId();
        return Response.success(favoriteService.getUserFavorites(userId));
    }
}
```

#### 步骤6：创建前端API
```typescript
// frontend/src/api/favoriteApi.ts
import axios from '@/utils/axios'

export const addFavorite = (productId: number) => {
  return axios.post('/api/favorites', null, { params: { productId } })
}

export const getFavorites = () => {
  return axios.get('/api/favorites')
}
```

#### 步骤7：在页面中使用
```vue
<template>
  <el-button @click="handleFavorite">
    {{ isFavorited ? '已收藏' : '收藏' }}
  </el-button>
</template>

<script setup lang="ts">
import { addFavorite } from '@/api/favoriteApi'

const handleFavorite = async () => {
  await addFavorite(productId)
  ElMessage.success('收藏成功')
}
</script>
```

### 10.2 代码规范要点

1. **使用常量代替魔法数字**
2. **前后端状态码保持一致**
3. **统一的响应格式**
4. **适当的错误处理**
5. **写注释说明复杂逻辑**

### 10.3 测试方法

```bash
# 后端测试
cd backend
mvn test

# 前端测试
cd frontend
npm run test -- --run
```

---

## 附录A：常用命令速查

### 后端命令
```bash
cd backend

mvn spring-boot:run          # 启动项目
mvn clean package            # 打包项目
mvn test                     # 运行测试
mvn clean                    # 清理编译文件
```

### 前端命令
```bash
cd frontend

npm install                  # 安装依赖
npm run dev                  # 启动开发服务器
npm run build                # 构建生产版本
npm run test -- --run        # 运行测试
npm run lint                 # 代码检查
```

---

## 附录B：文件命名规范

| 类型 | 命名规范 | 示例 |
|------|----------|------|
| Java类 | 大驼峰 | `ProductService.java` |
| Vue组件 | 大驼峰 | `ProductCard.vue` |
| TypeScript文件 | 小驼峰 | `productApi.ts` |
| CSS类名 | 短横线 | `product-card` |
| 数据库表 | 下划线+前缀 | `tb_product` |
| 数据库字段 | 下划线 | `created_time` |

---

## 附录C：学习资源推荐

### Java & Spring Boot
- [Spring Boot 官方文档](https://spring.io/projects/spring-boot)
- [Spring Data JPA 教程](https://spring.io/projects/spring-data-jpa)

### Vue 3 & TypeScript
- [Vue 3 官方文档](https://cn.vuejs.org/)
- [TypeScript 官方文档](https://www.typescriptlang.org/)
- [Element Plus 组件库](https://element-plus.org/)
- [Pinia 状态管理](https://pinia.vuejs.org/)

### 数据库
- [MySQL 教程](https://www.runoob.com/mysql/mysql-tutorial.html)

---

## 附录D：项目亮点功能

### 1. 理性消费模块
- 设置月度预算，超支提醒
- 心愿单冷静期（24小时后才能购买）
- 消费报告和成就系统

### 2. 价格监控
- 商品价格历史记录
- 降价提醒功能
- 价格趋势图表

### 3. 智能搜索
- 搜索历史记录
- 热门搜索词
- 搜索建议

### 4. 多角色系统
- 普通用户：购物
- 卖家：发布商品、发货
- 管理员：全局管理

---

**恭喜你完成了项目教程的学习！** 🎉

如果有任何问题，可以：
1. 查看项目中的 `.kiro/steering/` 目录下的规范文档
2. 查看 `docs/` 目录下的其他文档
3. 直接问我！

祝你学习愉快！
