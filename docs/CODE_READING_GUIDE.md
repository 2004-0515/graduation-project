# 代码阅读指南 - 从哪里开始看？

## 推荐阅读顺序

```
┌─────────────────────────────────────────────────────────────────┐
│                    代码阅读路线图                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   第1步：入口文件（了解项目如何启动）                            │
│      ↓                                                           │
│   第2步：数据库表结构（了解数据长什么样）                        │
│      ↓                                                           │
│   第3步：实体类 Entity（了解Java如何表示数据）                   │
│      ↓                                                           │
│   第4步：跟踪一个完整功能（登录流程）                            │
│      ↓                                                           │
│   第5步：跟踪第二个功能（商品列表）                              │
│      ↓                                                           │
│   第6步：跟踪第三个功能（购物车→下单）                           │
│      ↓                                                           │
│   第7步：自己尝试修改/添加功能                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 第1步：入口文件

### 1.1 后端入口

打开文件：`backend/src/main/java/com/shopping/ShoppingMallApplication.java`

```java
@SpringBootApplication  // 这个注解告诉Spring这是启动类
public class ShoppingMallApplication {
    public static void main(String[] args) {
        // 这是Java程序的入口，运行这个方法就启动了整个后端
        SpringApplication.run(ShoppingMallApplication.class, args);
    }
}
```

**理解要点**：
- 这是整个后端的起点
- `@SpringBootApplication` 会自动扫描同包及子包下的所有类
- Spring会自动创建和管理所有带 `@Service`, `@Controller`, `@Repository` 注解的类

### 1.2 前端入口

打开文件：`frontend/src/main.ts`

```typescript
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'

const app = createApp(App)  // 创建Vue应用，App.vue是根组件
app.use(router)             // 使用路由
app.use(createPinia())      // 使用状态管理
app.mount('#app')           // 挂载到index.html的#app元素
```

然后看：`frontend/src/App.vue`

```vue
<template>
  <Navbar />           <!-- 导航栏组件 -->
  <router-view />      <!-- 路由出口，显示当前页面 -->
  <Footer />           <!-- 页脚组件 -->
</template>
```

**理解要点**：
- `main.ts` 是前端的起点
- `App.vue` 是根组件，包含导航栏、页面内容、页脚
- `<router-view />` 会根据URL显示不同的页面组件

---

## 第2步：数据库表结构

打开文件：`backend/src/main/resources/schema.sql`

先看最核心的几张表：

### 2.1 用户表 tb_user
```sql
CREATE TABLE tb_user (
    id BIGINT PRIMARY KEY,      -- 用户ID
    username VARCHAR(50),       -- 用户名（登录用）
    password VARCHAR(255),      -- 密码（加密存储）
    nickname VARCHAR(50),       -- 昵称（显示用）
    role VARCHAR(20),           -- 角色：USER普通用户 / ADMIN管理员
    status TINYINT              -- 状态：0禁用 / 1启用
);
```

### 2.2 商品表 tb_product
```sql
CREATE TABLE tb_product (
    id BIGINT PRIMARY KEY,
    name VARCHAR(200),          -- 商品名称
    price DECIMAL(10,2),        -- 价格
    stock INT,                  -- 库存
    category_id BIGINT,         -- 分类ID（关联tb_category）
    seller_id BIGINT,           -- 卖家ID（关联tb_user）
    status TINYINT              -- 状态：0下架 / 1在售
);
```

### 2.3 订单表 tb_order
```sql
CREATE TABLE tb_order (
    id BIGINT PRIMARY KEY,
    order_no VARCHAR(50),       -- 订单号
    user_id BIGINT,             -- 用户ID
    total_amount DECIMAL(10,2), -- 总金额
    order_status TINYINT,       -- 订单状态：0待付款/1待发货/2待收货/3已完成/4已取消
    payment_status TINYINT      -- 支付状态：0未支付/1已支付
);
```

**理解要点**：
- 表之间通过ID关联（如 order.user_id 关联 user.id）
- 状态用数字表示，具体含义看 `project-rules.md`

---

## 第3步：实体类 Entity

实体类是Java对数据库表的映射。

打开文件：`backend/src/main/java/com/shopping/entity/User.java`

```java
@Entity                          // 标记这是实体类
@Table(name = "tb_user")         // 对应数据库表 tb_user
public class User {
    @Id                          // 主键
    @GeneratedValue(strategy = GenerationType.IDENTITY)  // 自增
    private Long id;
    
    private String username;     // 对应 username 列
    private String password;
    private String nickname;
    private String role;
    private Integer status;
    
    // getter 和 setter 方法...
}
```

**对照理解**：
```
数据库表 tb_user          Java类 User
─────────────────────────────────────
id BIGINT            →    Long id
username VARCHAR     →    String username
password VARCHAR     →    String password
status TINYINT       →    Integer status
```

再看：`backend/src/main/java/com/shopping/entity/Product.java`
再看：`backend/src/main/java/com/shopping/entity/Order.java`

**理解要点**：
- 一个Entity类对应一张数据库表
- 类的属性对应表的列
- `@Entity` 和 `@Table` 告诉JPA这个类对应哪张表

---

## 第4步：跟踪登录功能（最重要！）

这是理解整个项目的关键！跟着数据流走一遍。

### 4.1 用户点击登录按钮

打开：`frontend/src/views/LoginView.vue`

```vue
<template>
  <el-form>
    <el-form-item>
      <el-input v-model="form.username" />  <!-- 用户名输入框 -->
    </el-form-item>
    <el-form-item>
      <el-input v-model="form.password" type="password" />  <!-- 密码输入框 -->
    </el-form-item>
    <el-button @click="handleLogin">登录</el-button>  <!-- 点击触发handleLogin -->
  </el-form>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { login } from '@/api/authApi'      // 导入登录API
import { useUserStore } from '@/stores/userStore'
import { useRouter } from 'vue-router'

const form = ref({ username: '', password: '' })
const userStore = useUserStore()
const router = useRouter()

const handleLogin = async () => {
  const res = await login(form.value)      // 调用登录API
  if (res.data.success) {
    userStore.setToken(res.data.data.token)  // 保存token
    userStore.setUser(res.data.data.user)    // 保存用户信息
    router.push('/')                          // 跳转首页
  }
}
</script>
```

### 4.2 前端API发送请求

打开：`frontend/src/api/authApi.ts`

```typescript
import axios from '@/utils/axios'

// 登录接口
export const login = (data: { username: string; password: string }) => {
  return axios.post('/api/auth/login', data)
  // 发送POST请求到 http://localhost:8080/api/auth/login
  // 请求体是 { username: "xxx", password: "xxx" }
}
```

### 4.3 后端Controller接收请求

打开：`backend/src/main/java/com/shopping/controller/AuthController.java`

```java
@RestController
@RequestMapping("/api/auth")  // 处理 /api/auth 开头的请求
public class AuthController {
    
    @Autowired
    private AuthService authService;  // 注入AuthService
    
    @PostMapping("/login")  // 处理 POST /api/auth/login
    public Response<?> login(@RequestBody LoginRequest request) {
        // @RequestBody 把JSON转为LoginRequest对象
        return authService.login(request.getUsername(), request.getPassword());
    }
}
```

### 4.4 Service处理业务逻辑

打开：`backend/src/main/java/com/shopping/service/AuthService.java`

```java
@Service
public class AuthService {
    
    @Autowired
    private UserRepository userRepository;  // 注入Repository
    
    public Response<?> login(String username, String password) {
        // 1. 查询用户
        User user = userRepository.findByUsername(username);
        
        // 2. 验证用户存在
        if (user == null) {
            return Response.error("用户不存在");
        }
        
        // 3. 验证密码
        if (!passwordEncoder.matches(password, user.getPassword())) {
            return Response.error("密码错误");
        }
        
        // 4. 生成Token
        String token = jwtUtils.generateToken(user);
        
        // 5. 返回结果
        Map<String, Object> data = new HashMap<>();
        data.put("token", token);
        data.put("user", user);
        return Response.success(data);
    }
}
```

### 4.5 Repository查询数据库

打开：`backend/src/main/java/com/shopping/repository/UserRepository.java`

```java
public interface UserRepository extends JpaRepository<User, Long> {
    
    User findByUsername(String username);
    // Spring Data JPA 自动生成SQL:
    // SELECT * FROM tb_user WHERE username = ?
}
```

### 4.6 完整流程图

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           登录流程                                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  [用户]                                                                  │
│    │ 输入用户名密码，点击登录                                            │
│    ↓                                                                     │
│  [LoginView.vue]                                                         │
│    │ handleLogin() 调用 login API                                        │
│    ↓                                                                     │
│  [authApi.ts]                                                            │
│    │ axios.post('/api/auth/login', {username, password})                │
│    ↓                                                                     │
│  ════════════════════ HTTP请求 ════════════════════                     │
│    ↓                                                                     │
│  [AuthController.java]                                                   │
│    │ @PostMapping("/login") 接收请求                                     │
│    │ 调用 authService.login()                                            │
│    ↓                                                                     │
│  [AuthService.java]                                                      │
│    │ 1. userRepository.findByUsername() 查询用户                         │
│    │ 2. 验证密码                                                         │
│    │ 3. 生成JWT Token                                                    │
│    │ 4. 返回 Response.success({token, user})                            │
│    ↓                                                                     │
│  [UserRepository.java]                                                   │
│    │ findByUsername() → SELECT * FROM tb_user WHERE username = ?        │
│    ↓                                                                     │
│  [MySQL数据库]                                                           │
│    │ 返回用户数据                                                        │
│    ↓                                                                     │
│  ════════════════════ HTTP响应 ════════════════════                     │
│    ↓                                                                     │
│  [LoginView.vue]                                                         │
│    │ 收到响应，保存token到userStore                                      │
│    │ 跳转到首页                                                          │
│    ↓                                                                     │
│  [用户看到首页]                                                          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 第5步：跟踪商品列表功能

### 5.1 前端页面

打开：`frontend/src/views/HomeView.vue`（或商品列表页面）

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getProducts } from '@/api/productApi'

const products = ref([])

onMounted(async () => {
  // 组件加载时获取商品列表
  const res = await getProducts(0, 10)
  products.value = res.data.data.content
})
</script>
```

### 5.2 前端API

打开：`frontend/src/api/productApi.ts`

```typescript
export const getProducts = (page: number, size: number) => {
  return axios.get('/api/products', { params: { page, size } })
  // GET /api/products?page=0&size=10
}
```

### 5.3 后端Controller

打开：`backend/src/main/java/com/shopping/controller/ProductController.java`

```java
@RestController
@RequestMapping("/api/products")
public class ProductController {
    
    @Autowired
    private ProductService productService;
    
    @GetMapping
    public Response<Page<Product>> getProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return Response.success(productService.getProducts(page, size));
    }
}
```

### 5.4 后端Service

打开：`backend/src/main/java/com/shopping/service/ProductService.java`

```java
@Service
public class ProductService {
    
    @Autowired
    private ProductRepository productRepository;
    
    public Page<Product> getProducts(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return productRepository.findByStatus(1, pageable);  // 只查在售商品
    }
}
```

### 5.5 后端Repository

打开：`backend/src/main/java/com/shopping/repository/ProductRepository.java`

```java
public interface ProductRepository extends JpaRepository<Product, Long> {
    Page<Product> findByStatus(Integer status, Pageable pageable);
    // SELECT * FROM tb_product WHERE status = 1 LIMIT 10 OFFSET 0
}
```

---

## 第6步：跟踪购物车→下单流程

这是最复杂的流程，涉及多个步骤：

### 6.1 添加购物车

```
文件阅读顺序：
1. frontend/src/views/ProductDetailView.vue  → 点击"加入购物车"
2. frontend/src/api/cartApi.ts               → addToCart()
3. backend/.../controller/CartController.java → @PostMapping
4. backend/.../service/CartService.java       → addToCart()
5. backend/.../repository/CartRepository.java → save()
```

### 6.2 查看购物车

```
文件阅读顺序：
1. frontend/src/views/CartView.vue           → 显示购物车列表
2. frontend/src/api/cartApi.ts               → getCartItems()
3. backend/.../controller/CartController.java → @GetMapping
4. backend/.../service/CartService.java       → getCartItems()
```

### 6.3 创建订单

```
文件阅读顺序：
1. frontend/src/views/CheckoutView.vue       → 结算页面
2. frontend/src/api/orderApi.ts              → createOrder()
3. backend/.../controller/OrderController.java → @PostMapping
4. backend/.../service/OrderService.java      → createOrder()
   - 创建订单记录
   - 创建订单项
   - 清空购物车
   - 扣减库存
```

### 6.4 支付订单

```
文件阅读顺序：
1. frontend/src/views/PaymentView.vue        → 支付页面
2. frontend/src/api/orderApi.ts              → payOrder()
3. backend/.../controller/OrderController.java → @PostMapping("/{id}/pay")
4. backend/.../service/OrderService.java      → payOrder()
   - 更新订单状态为"待发货"
   - 更新支付状态为"已支付"
```

---

## 第7步：关键文件速查表

### 后端关键文件

| 文件 | 作用 | 优先级 |
|------|------|--------|
| `ShoppingMallApplication.java` | 启动类 | ⭐⭐⭐ |
| `entity/User.java` | 用户实体 | ⭐⭐⭐ |
| `entity/Product.java` | 商品实体 | ⭐⭐⭐ |
| `entity/Order.java` | 订单实体 | ⭐⭐⭐ |
| `controller/AuthController.java` | 认证接口 | ⭐⭐⭐ |
| `controller/ProductController.java` | 商品接口 | ⭐⭐⭐ |
| `controller/OrderController.java` | 订单接口 | ⭐⭐⭐ |
| `controller/CartController.java` | 购物车接口 | ⭐⭐⭐ |
| `service/AuthService.java` | 认证逻辑 | ⭐⭐⭐ |
| `service/ProductService.java` | 商品逻辑 | ⭐⭐ |
| `service/OrderService.java` | 订单逻辑 | ⭐⭐ |
| `repository/UserRepository.java` | 用户数据库操作 | ⭐⭐ |
| `constants/OrderConstants.java` | 订单状态常量 | ⭐⭐ |
| `config/SecurityConfig.java` | 安全配置 | ⭐ |
| `filter/JwtAuthenticationFilter.java` | JWT过滤器 | ⭐ |

### 前端关键文件

| 文件 | 作用 | 优先级 |
|------|------|--------|
| `main.ts` | 入口文件 | ⭐⭐⭐ |
| `App.vue` | 根组件 | ⭐⭐⭐ |
| `router/index.ts` | 路由配置 | ⭐⭐⭐ |
| `views/LoginView.vue` | 登录页 | ⭐⭐⭐ |
| `views/HomeView.vue` | 首页 | ⭐⭐⭐ |
| `views/ProductDetailView.vue` | 商品详情 | ⭐⭐⭐ |
| `views/CartView.vue` | 购物车 | ⭐⭐⭐ |
| `views/OrdersView.vue` | 订单列表 | ⭐⭐⭐ |
| `stores/userStore.ts` | 用户状态 | ⭐⭐⭐ |
| `stores/cartStore.ts` | 购物车状态 | ⭐⭐ |
| `api/authApi.ts` | 认证API | ⭐⭐⭐ |
| `api/productApi.ts` | 商品API | ⭐⭐ |
| `api/orderApi.ts` | 订单API | ⭐⭐ |
| `api/cartApi.ts` | 购物车API | ⭐⭐ |
| `utils/axios.ts` | Axios配置 | ⭐⭐ |
| `constants/index.ts` | 常量定义 | ⭐⭐ |
| `components/Navbar.vue` | 导航栏 | ⭐ |

---

## 第8步：调试技巧

### 8.1 后端调试

在Service方法中加日志：
```java
@Service
public class AuthService {
    public Response<?> login(String username, String password) {
        System.out.println("=== 登录请求 ===");
        System.out.println("用户名: " + username);
        
        User user = userRepository.findByUsername(username);
        System.out.println("查询结果: " + user);
        
        // ... 其他代码
    }
}
```

### 8.2 前端调试

在浏览器控制台查看：
```typescript
const handleLogin = async () => {
  console.log('=== 登录请求 ===')
  console.log('表单数据:', form.value)
  
  const res = await login(form.value)
  console.log('响应数据:', res.data)
  
  // ... 其他代码
}
```

### 8.3 查看网络请求

1. 打开浏览器开发者工具（F12）
2. 切换到 Network（网络）标签
3. 操作页面，查看发出的请求
4. 点击请求查看详情：
   - Headers：请求头
   - Payload：请求体
   - Response：响应数据

---

## 第9步：学习路线建议

### 第1周：理解基础

1. **Day 1-2**：看入口文件，理解项目如何启动
2. **Day 3-4**：看数据库表和Entity，理解数据结构
3. **Day 5-7**：跟踪登录流程，理解前后端交互

### 第2周：深入功能

1. **Day 1-2**：跟踪商品列表功能
2. **Day 3-4**：跟踪购物车功能
3. **Day 5-7**：跟踪订单流程

### 第3周：动手实践

1. **Day 1-2**：尝试修改一个简单功能（如修改页面文字）
2. **Day 3-4**：尝试添加一个简单字段
3. **Day 5-7**：尝试添加一个新功能

---

## 第10步：常见问题

### Q1：文件太多，不知道看哪个？

**答**：按这个顺序看核心文件：
```
后端：Entity → Repository → Service → Controller
前端：api → stores → views
```

### Q2：看不懂某个语法？

**答**：查看 `docs/SYNTAX_GUIDE.md`，里面有详细解释。

### Q3：不知道某个功能在哪？

**答**：
1. 前端功能：看 `frontend/src/views/` 目录
2. 后端接口：看 `backend/.../controller/` 目录
3. 用搜索功能（Ctrl+Shift+F）搜索关键词

### Q4：修改代码后没效果？

**答**：
1. 后端：需要重启（停止后重新 `mvn spring-boot:run`）
2. 前端：通常自动刷新，如果没有就手动刷新浏览器

### Q5：报错了怎么办？

**答**：
1. 看错误信息，通常会告诉你哪个文件哪一行出错
2. 复制错误信息搜索
3. 问我！

---

## 总结：最简单的开始方式

如果你只想快速了解项目，就按这个顺序看这6个文件：

```
1. backend/.../entity/User.java          # 理解用户数据结构
2. backend/.../controller/AuthController.java  # 理解登录接口
3. backend/.../service/AuthService.java  # 理解登录逻辑
4. frontend/src/api/authApi.ts           # 理解前端如何调用
5. frontend/src/views/LoginView.vue      # 理解登录页面
6. frontend/src/stores/userStore.ts      # 理解用户状态管理
```

看完这6个文件，你就能理解整个项目的核心架构了！

---

**记住**：不要试图一次看懂所有代码，先跟着一个功能走一遍，理解了再看下一个。

有问题随时问我！🎉
