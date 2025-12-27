# 购物商城系统架构文档

## 快速入门（30分钟内理解核心流程）

### 技术栈概览

| 层级 | 技术 | 版本 |
|------|------|------|
| 前端框架 | Vue 3 + TypeScript | 3.5.x |
| 状态管理 | Pinia | 3.x |
| UI组件库 | Element Plus | 2.x |
| 构建工具 | Vite | 7.x |
| 后端框架 | Spring Boot | 3.2.x |
| 数据库 | MySQL | 8.x |
| 缓存 | Redis | 7.x |
| 认证 | JWT | - |

### 项目结构

```
shopping-mall/
├── frontend/                 # 前端项目
│   ├── src/
│   │   ├── api/             # API 接口层 (TypeScript)
│   │   ├── components/      # 公共组件
│   │   ├── constants/       # 常量定义
│   │   ├── router/          # 路由配置
│   │   ├── stores/          # Pinia 状态管理
│   │   ├── types/           # TypeScript 类型定义
│   │   ├── utils/           # 工具函数
│   │   └── views/           # 页面组件
│   └── ...
├── backend/                  # 后端项目
│   └── src/main/java/com/shopping/
│       ├── config/          # 配置类
│       ├── constants/       # 常量定义
│       ├── controller/      # 控制器层
│       ├── dto/             # 数据传输对象
│       ├── entity/          # 实体类
│       ├── exception/       # 自定义异常
│       ├── filter/          # 过滤器
│       ├── handler/         # 全局处理器
│       ├── repository/      # 数据访问层
│       ├── service/         # 业务逻辑层
│       └── utils/           # 工具类
└── docker-compose.yml        # Docker 编排配置
```

## 核心业务流程

### 1. 用户认证流程

```
用户登录 → AuthController.login() → AuthService.login()
    → 验证用户名密码 → 生成JWT Token → 返回Token和用户信息
    
前端存储Token → 后续请求携带Authorization Header
    → JwtAuthenticationFilter验证Token → 设置SecurityContext
```

### 2. 购物车流程

```
添加商品 → CartController.addToCart() → CartService.addToCart()
    → 验证商品状态和库存 → 创建/更新购物车项 → 返回购物车DTO

结算 → 获取选中商品 → 创建订单 → 扣减库存 → 清空已结算商品
```

### 3. 订单流程

```
创建订单 → OrderController.createOrder() → OrderService.createOrder()
    → 验证地址和商品 → 计算总金额 → 创建订单和订单项 → 扣减库存

订单状态流转:
待支付(0) → 待发货(1) → 待收货(2) → 已完成(3)
    ↓
已取消(4)
```

## 关键设计决策

### 1. 常量管理

所有魔法数字都定义在常量类中：

- 前端: `frontend/src/constants/index.ts`
- 后端: `backend/src/main/java/com/shopping/constants/`

```typescript
// 前端示例
import { ORDER_STATUS, ORDER_STATUS_MAP } from '@/constants'

if (order.status === ORDER_STATUS.PENDING_PAYMENT) {
  // 待支付逻辑
}
```

```java
// 后端示例
import com.shopping.constants.OrderConstants;

if (OrderConstants.OrderStatus.canCancel(order.getOrderStatus())) {
    // 可取消逻辑
}
```

### 2. 类型安全

前端使用 TypeScript 确保类型安全：

- 所有类型定义在 `frontend/src/types/index.ts`
- API 响应都有明确的类型定义
- Store 状态有完整的类型注解

### 3. 统一响应格式

后端所有 API 返回统一的响应格式：

```json
{
  "code": 200,
  "message": "Success",
  "success": true,
  "data": { ... }
}
```

### 4. 安全工具类

使用 `SecurityUtils` 统一获取当前用户信息，避免代码重复：

```java
String username = SecurityUtils.getCurrentUsername();
```

## 开发指南

### 添加新功能的步骤

1. **后端**
   - 在 `entity/` 添加实体类
   - 在 `repository/` 添加数据访问接口
   - 在 `service/` 添加业务逻辑
   - 在 `controller/` 添加 API 端点
   - 在 `dto/` 添加请求/响应 DTO

2. **前端**
   - 在 `types/` 添加类型定义
   - 在 `api/` 添加 API 调用
   - 在 `stores/` 添加状态管理（如需要）
   - 在 `views/` 添加页面组件

### 运行测试

```bash
# 前端测试
cd frontend
npm run test:run

# 后端测试
cd backend
mvn test
```

### 本地开发

```bash
# 启动后端
cd backend
mvn spring-boot:run

# 启动前端
cd frontend
npm run dev
```

## 环境配置

### 前端环境变量

- `.env` - 默认配置
- `.env.development` - 开发环境
- `.env.production` - 生产环境

### 后端配置

- `application.properties` - 主配置
- `application-docker.properties` - Docker 环境配置

关键配置项通过环境变量注入：
- `DB_HOST`, `DB_USERNAME`, `DB_PASSWORD` - 数据库
- `REDIS_HOST`, `REDIS_PASSWORD` - Redis
- `JWT_SECRET` - JWT 密钥
- `CORS_ALLOWED_ORIGINS` - CORS 允许的来源
