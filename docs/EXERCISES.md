# 实战练习题

通过动手练习来巩固知识！按难度递进，建议按顺序完成。

---

## 难度说明

| 等级 | 说明 | 预计时间 |
|------|------|----------|
| ⭐ | 入门级，只需修改现有代码 | 10-30分钟 |
| ⭐⭐ | 基础级，需要理解代码结构 | 30-60分钟 |
| ⭐⭐⭐ | 进阶级，需要添加新功能 | 1-2小时 |

---

## 练习1：修改页面文字 ⭐

### 目标
把登录页面的标题从"用户登录"改成"欢迎回来"

### 步骤
1. 找到登录页面文件：`frontend/src/views/LoginView.vue`
2. 找到标题文字的位置
3. 修改文字
4. 保存，查看效果

### 提示
在 `<template>` 部分找类似这样的代码：
```vue
<h2>用户登录</h2>
```

### 验证
打开 http://localhost:5173/login 查看标题是否改变

---

## 练习2：添加控制台日志 ⭐

### 目标
在用户登录时，在浏览器控制台打印用户名

### 步骤
1. 打开 `frontend/src/views/LoginView.vue`
2. 找到 `handleLogin` 函数
3. 在函数开头添加 `console.log`
4. 测试登录，打开F12查看控制台

### 代码示例
```typescript
const handleLogin = async () => {
  console.log('用户正在登录:', form.value.username)  // 添加这行
  // ... 其他代码
}
```

### 验证
登录时在浏览器控制台（F12）看到打印的用户名

---

## 练习3：修改API返回的提示信息 ⭐

### 目标
把登录成功的提示从"登录成功"改成"欢迎回来，xxx！"

### 步骤
1. 找到后端登录接口：`backend/.../service/AuthService.java`
2. 找到登录成功返回的地方
3. 修改返回的message
4. 重启后端，测试

### 提示
找类似这样的代码：
```java
return Response.success("登录成功", data);
```
改成：
```java
return Response.success("欢迎回来，" + user.getNickname() + "！", data);
```

---

## 练习4：理解数据流 ⭐⭐

### 目标
跟踪"获取商品详情"的完整数据流，写出经过的所有文件

### 任务
当用户访问商品详情页时，数据是怎么从数据库到页面的？

### 答案模板
```
1. 用户点击商品，前端路由跳转到 /product/123
2. 前端页面文件：_______________
3. 前端调用API：_______________
4. 后端Controller：_______________
5. 后端Service：_______________
6. 后端Repository：_______________
7. 数据库表：_______________
```

### 参考答案（先自己想，再看）
<details>
<summary>点击查看答案</summary>

```
1. 用户点击商品，前端路由跳转到 /product/123
2. 前端页面文件：frontend/src/views/ProductDetailView.vue
3. 前端调用API：frontend/src/api/productApi.ts → getProductById()
4. 后端Controller：backend/.../controller/ProductController.java → @GetMapping("/{id}")
5. 后端Service：backend/.../service/ProductService.java → getProductById()
6. 后端Repository：backend/.../repository/ProductRepository.java → findById()
7. 数据库表：tb_product
```
</details>

---

## 练习5：添加新字段显示 ⭐⭐

### 目标
在商品详情页显示商品的"创建时间"

### 前提
假设数据库和Entity已经有 `created_time` 字段

### 步骤
1. 打开 `frontend/src/views/ProductDetailView.vue`
2. 找到显示商品信息的地方
3. 添加创建时间的显示
4. 格式化日期显示

### 代码示例
```vue
<template>
  <div class="product-info">
    <h1>{{ product.name }}</h1>
    <p>价格：¥{{ product.price }}</p>
    <!-- 添加这行 -->
    <p>上架时间：{{ formatDate(product.createdTime) }}</p>
  </div>
</template>

<script setup>
// 添加日期格式化函数
const formatDate = (date: string) => {
  if (!date) return '未知'
  return new Date(date).toLocaleDateString('zh-CN')
}
</script>
```

---

## 练习6：添加前端表单验证 ⭐⭐

### 目标
在注册页面添加"确认密码"验证，确保两次输入的密码一致

### 步骤
1. 打开 `frontend/src/views/RegisterView.vue`
2. 添加"确认密码"输入框
3. 添加验证逻辑
4. 提交前检查两次密码是否一致

### 代码提示
```vue
<template>
  <el-form-item label="确认密码" prop="confirmPassword">
    <el-input v-model="form.confirmPassword" type="password" />
  </el-form-item>
</template>

<script setup>
const form = ref({
  username: '',
  password: '',
  confirmPassword: ''  // 新增
})

const handleRegister = async () => {
  // 添加验证
  if (form.value.password !== form.value.confirmPassword) {
    ElMessage.error('两次密码不一致')
    return
  }
  // ... 继续注册逻辑
}
</script>
```

---

## 练习7：添加后端接口 ⭐⭐⭐

### 目标
添加一个新接口：获取热门商品（销量前10的商品）

### 步骤

#### 7.1 在Repository添加查询方法
```java
// ProductRepository.java
@Query("SELECT p FROM Product p ORDER BY p.sales DESC")
List<Product> findTopBySales(Pageable pageable);
```

#### 7.2 在Service添加业务方法
```java
// ProductService.java
public List<Product> getHotProducts() {
    Pageable pageable = PageRequest.of(0, 10);
    return productRepository.findTopBySales(pageable);
}
```

#### 7.3 在Controller添加接口
```java
// ProductController.java
@GetMapping("/hot")
public Response<List<Product>> getHotProducts() {
    return Response.success(productService.getHotProducts());
}
```

#### 7.4 测试接口
访问 http://localhost:8080/api/products/hot

---

## 练习8：添加前端页面 ⭐⭐⭐

### 目标
创建一个新页面：显示我的收藏列表

### 步骤

#### 8.1 创建页面文件
创建 `frontend/src/views/FavoritesView.vue`

```vue
<template>
  <div class="favorites-page">
    <h2>我的收藏</h2>
    <div v-if="favorites.length === 0">
      暂无收藏
    </div>
    <div v-else class="favorites-list">
      <div v-for="item in favorites" :key="item.id" class="favorite-item">
        <img :src="item.product.image" />
        <span>{{ item.product.name }}</span>
        <span>¥{{ item.product.price }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
// import { getFavorites } from '@/api/favoriteApi'

const favorites = ref([])

onMounted(async () => {
  // const res = await getFavorites()
  // favorites.value = res.data.data
})
</script>
```

#### 8.2 添加路由
在 `frontend/src/router/index.ts` 添加：
```typescript
{
  path: '/favorites',
  name: 'favorites',
  component: () => import('@/views/FavoritesView.vue'),
  meta: { requiresAuth: true }
}
```

#### 8.3 添加导航链接
在 `Navbar.vue` 添加链接到收藏页面

---

## 练习9：完整功能开发 ⭐⭐⭐

### 目标
实现"商品收藏"完整功能

### 需要完成的内容

#### 后端
1. 创建 `Favorite` 实体类
2. 创建 `FavoriteRepository`
3. 创建 `FavoriteService`
4. 创建 `FavoriteController`
5. 接口：
   - POST /api/favorites - 添加收藏
   - DELETE /api/favorites/{productId} - 取消收藏
   - GET /api/favorites - 获取收藏列表
   - GET /api/favorites/check/{productId} - 检查是否已收藏

#### 前端
1. 创建 `favoriteApi.ts`
2. 在商品详情页添加收藏按钮
3. 创建收藏列表页面

### 数据库表设计
```sql
CREATE TABLE tb_favorite (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    created_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_product (user_id, product_id)
);
```

### 提示
参考购物车功能的实现方式，收藏功能的逻辑类似但更简单。

---

## 练习10：Bug修复练习 ⭐⭐

### 场景
用户反馈：订单状态显示"未知"

### 任务
1. 分析可能的原因
2. 找到问题所在
3. 修复问题

### 排查思路
```
1. 检查数据库中订单的 order_status 值是多少
2. 检查前端常量映射是否包含这个值
3. 检查后端常量是否定义了这个状态
```

### 可能的原因
1. 数据库中存了无效的状态值（如7，但只定义了0-6）
2. 前端映射不完整
3. 新增了状态但忘记同步前端

---

## 练习答案检查清单

完成练习后，用这个清单检查：

### 练习1-3（入门级）
- [ ] 代码修改后保存了吗？
- [ ] 前端修改后页面刷新了吗？
- [ ] 后端修改后重启了吗？

### 练习4-6（基础级）
- [ ] 理解了数据流向吗？
- [ ] 知道每个文件的作用吗？
- [ ] 代码能正常运行吗？

### 练习7-9（进阶级）
- [ ] 后端接口能正常访问吗？
- [ ] 前端页面能正常显示吗？
- [ ] 前后端数据能正确交互吗？

---

## 学习建议

1. **先看懂再动手**：每个练习先理解要做什么
2. **遇到问题先查手册**：看 `TROUBLESHOOTING.md`
3. **善用搜索**：Ctrl+Shift+F 全局搜索关键词
4. **多看现有代码**：模仿已有功能的实现方式
5. **不要怕出错**：出错是学习的最好机会

---

## 进阶挑战

完成以上练习后，可以尝试：

1. **添加商品评论回复功能**
2. **实现商品比价功能**
3. **添加订单导出Excel功能**
4. **实现商品推荐算法**
5. **添加数据统计图表**

这些挑战没有标准答案，需要你自己设计和实现！

---

**加油！动手实践是最好的学习方式！** 💪
