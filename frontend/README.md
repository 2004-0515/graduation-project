# 雅集商城 - 前端项目

基于 Vue 3 + TypeScript + Vite 构建的电子商务前端应用。

## 技术栈

- Vue 3 (Composition API + script setup)
- TypeScript
- Vite
- Vue Router
- Pinia (状态管理)
- Axios (HTTP请求)
- Element Plus (UI组件库)

## 项目结构

```
frontend/
├── src/
│   ├── api/                # API接口封装
│   │   ├── authApi.ts      # 认证接口
│   │   ├── productApi.ts   # 商品接口
│   │   ├── cartApi.ts      # 购物车接口
│   │   ├── orderApi.ts     # 订单接口
│   │   ├── addressApi.ts   # 地址接口
│   │   ├── couponApi.ts    # 优惠券接口
│   │   ├── reviewApi.ts    # 评价接口
│   │   └── adminApi.ts     # 管理员接口
│   ├── components/         # 公共组件
│   │   ├── Navbar.vue      # 导航栏
│   │   ├── Footer.vue      # 页脚
│   │   └── AdminLayout.vue # 管理后台布局
│   ├── views/              # 页面视图
│   │   ├── HomeView.vue    # 首页
│   │   ├── LoginView.vue   # 登录页
│   │   ├── RegisterView.vue # 注册页
│   │   ├── CartView.vue    # 购物车
│   │   ├── OrdersView.vue  # 订单列表
│   │   └── admin/          # 管理后台页面
│   ├── stores/             # Pinia状态管理
│   │   ├── userStore.ts    # 用户状态
│   │   └── cartStore.ts    # 购物车状态
│   ├── router/             # 路由配置
│   ├── types/              # TypeScript类型定义
│   ├── utils/              # 工具函数
│   │   └── axios.ts        # Axios配置
│   ├── constants/          # 常量定义
│   ├── App.vue             # 根组件
│   ├── main.ts             # 入口文件
│   └── style.css           # 全局样式
├── public/                 # 静态资源
├── index.html              # HTML模板
├── vite.config.ts          # Vite配置
├── tsconfig.json           # TypeScript配置
└── package.json            # 依赖配置
```

## 开发环境

### 环境要求
- Node.js 18+
- npm 或 yarn

### 安装依赖
```bash
npm install
```

### 启动开发服务器
```bash
npm run dev
```
访问 http://localhost:5173

### 构建生产版本
```bash
npm run build
```

### 运行测试
```bash
npm run test
```

## 环境变量

开发环境配置文件：`.env.development`
```
VITE_API_BASE_URL=http://localhost:8080/api
```

生产环境配置文件：`.env.production`
```
VITE_API_BASE_URL=/api
```

## 页面路由

### 公共页面
- `/` - 首页
- `/login` - 登录
- `/register` - 注册
- `/category` - 商品分类
- `/product/:id` - 商品详情
- `/hot` - 热销榜
- `/promotions` - 促销活动

### 用户页面（需登录）
- `/cart` - 购物车
- `/checkout` - 结算
- `/orders` - 我的订单
- `/order/:id` - 订单详情
- `/profile` - 个人中心
- `/address` - 收货地址
- `/settings` - 账户设置
- `/notifications` - 消息通知

### 管理后台（需管理员权限）
- `/admin` - 仪表盘
- `/admin/products` - 商品管理
- `/admin/categories` - 分类管理
- `/admin/orders` - 订单管理
- `/admin/users` - 用户管理
- `/admin/coupons` - 优惠券管理
- `/admin/notifications` - 通知管理

## 状态管理

使用Pinia进行状态管理：

- `userStore` - 用户登录状态、用户信息
- `cartStore` - 购物车数据、数量统计

## API请求

使用Axios进行HTTP请求，已配置：
- 请求拦截器：自动添加JWT Token
- 响应拦截器：统一错误处理
- 基础URL配置

## 代码规范

- 使用ESLint进行代码检查
- 使用Prettier进行代码格式化
- 遵循Vue 3 Composition API最佳实践
