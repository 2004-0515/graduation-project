# 项目语法详解手册

本文档详细解释项目中出现的每一种语法，帮助零基础同学理解代码。

---

## 目录

1. [Java后端语法](#一-java后端语法)
2. [TypeScript/JavaScript前端语法](#二-typescriptjavascript前端语法)
3. [Vue模板语法](#三-vue模板语法)
4. [SQL数据库语法](#四-sql数据库语法)

---

# 一、Java后端语法

## 1. 注解（Annotation）- 以@开头的标记

注解是Java的"标签"，告诉框架这个类/方法/字段有什么特殊用途。

### 1.1 类级别注解（放在class上面）

```java
@Entity                    // 标记这是一个数据库实体类，对应数据库的一张表
@Table(name = "tb_user")   // 指定对应的数据库表名是 tb_user
public class User { }
```

```java
@Service                   // 标记这是一个服务类，处理业务逻辑
public class UserService { }
```

```java
@RestController            // 标记这是一个控制器，处理HTTP请求，返回JSON数据
@RequestMapping("/api/users")  // 这个控制器处理所有 /api/users 开头的请求
public class UserController { }
```

```java
@Repository                // 标记这是一个仓库类，负责数据库操作
public interface UserRepository { }
```

```java
@Configuration             // 标记这是一个配置类
public class SecurityConfig { }
```

```java
@Component                 // 标记这是一个通用组件，Spring会自动管理它
public class MyComponent { }
```

### 1.2 字段级别注解（放在变量上面）

```java
@Id                                              // 标记这是主键字段
@GeneratedValue(strategy = GenerationType.IDENTITY)  // 主键自动增长
private Long id;
```

```java
@Column(name = "user_name", nullable = false, length = 50)
// name: 数据库列名是 user_name
// nullable: 不能为空
// length: 最大长度50
private String username;
```

```java
@Autowired                 // 自动注入依赖（Spring自动创建并赋值）
private UserService userService;
// 不需要 new UserService()，Spring自动帮你创建
```

```java
@Value("${jwt.secret}")    // 从配置文件读取值
private String jwtSecret;
// 会读取 application.properties 中的 jwt.secret=xxx
```

### 1.3 方法级别注解（放在方法上面）

```java
@GetMapping                // 处理 GET 请求（获取数据）
public List<User> getUsers() { }

@GetMapping("/{id}")       // 处理 GET /api/users/123 这样的请求
public User getUser(@PathVariable Long id) { }
// @PathVariable 表示从URL路径中获取参数
```

```java
@PostMapping               // 处理 POST 请求（创建数据）
public User createUser(@RequestBody User user) { }
// @RequestBody 表示从请求体中获取JSON数据并转换为User对象
```

```java
@PutMapping("/{id}")       // 处理 PUT 请求（更新数据）
public User updateUser(@PathVariable Long id, @RequestBody User user) { }
```

```java
@DeleteMapping("/{id}")    // 处理 DELETE 请求（删除数据）
public void deleteUser(@PathVariable Long id) { }
```

```java
@RequestParam              // 从URL查询参数获取值
public List<User> search(@RequestParam String keyword) { }
// 处理 /api/users/search?keyword=张三 这样的请求

@RequestParam(defaultValue = "0")  // 设置默认值
public Page<User> list(@RequestParam(defaultValue = "0") int page) { }
```

```java
@Transactional             // 事务注解，方法内的数据库操作要么全成功，要么全失败
public void transferMoney() {
    // 扣钱和加钱必须同时成功或同时失败
}
```

```java
@Override                  // 表示这个方法重写了父类的方法
public String toString() { }
```

### 1.4 参数注解

```java
@PathVariable              // 从URL路径获取参数
// GET /api/users/123
public User getUser(@PathVariable Long id) { }
// id = 123
```

```java
@RequestBody               // 从请求体获取JSON并转为对象
// POST /api/users  请求体: {"username": "张三", "password": "123"}
public User create(@RequestBody User user) { }
// user.username = "张三", user.password = "123"
```

```java
@RequestParam              // 从URL查询参数获取
// GET /api/users?page=0&size=10
public Page<User> list(
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "10") int size
) { }
```

```java
@RequestHeader             // 从请求头获取
public void doSomething(@RequestHeader("Authorization") String token) { }
```

---

## 2. 常见Java语法结构

### 2.1 类的定义

```java
public class User {        // public: 公开的  class: 类  User: 类名
    // 类的内容
}
```

```java
public interface UserRepository extends JpaRepository<User, Long> { }
// interface: 接口（只定义方法，不实现）
// extends: 继承
// JpaRepository<User, Long>: 泛型，User是实体类型，Long是主键类型
```

### 2.2 变量声明

```java
private Long id;           // private: 私有的  Long: 长整数类型  id: 变量名
private String name;       // String: 字符串类型
private Integer age;       // Integer: 整数类型（可以为null）
private int count;         // int: 基本整数类型（不能为null）
private BigDecimal price;  // BigDecimal: 精确小数（用于金额）
private Boolean active;    // Boolean: 布尔类型（true/false）
private LocalDateTime createdTime;  // LocalDateTime: 日期时间类型
private List<String> tags; // List<String>: 字符串列表
```

### 2.3 方法定义

```java
public User getUser(Long id) {
//  ↑      ↑        ↑
// 访问修饰符 返回类型 方法名(参数类型 参数名)
    return userRepository.findById(id);
}

public void deleteUser(Long id) {
// void 表示没有返回值
    userRepository.deleteById(id);
}

private boolean isValid(String str) {
// private: 只能在本类内部调用
// boolean: 返回true或false
    return str != null && !str.isEmpty();
}
```

### 2.4 常见操作语句

```java
// 创建对象
User user = new User();

// 调用方法
user.setName("张三");
String name = user.getName();

// 条件判断
if (user != null) {
    // user不为空时执行
} else {
    // user为空时执行
}

// 三元运算符（简化的if-else）
String result = (age >= 18) ? "成年" : "未成年";
// 如果age>=18，result="成年"，否则result="未成年"

// 循环
for (User user : userList) {
    // 遍历userList中的每个user
    System.out.println(user.getName());
}

// 抛出异常
if (user == null) {
    throw new RuntimeException("用户不存在");
}

// 捕获异常
try {
    // 可能出错的代码
    User user = userService.getUser(id);
} catch (Exception e) {
    // 出错时执行
    log.error("获取用户失败", e);
}
```

### 2.5 Lambda表达式（箭头函数）

```java
// 传统写法
List<User> adults = new ArrayList<>();
for (User user : users) {
    if (user.getAge() >= 18) {
        adults.add(user);
    }
}

// Lambda写法（更简洁）
List<User> adults = users.stream()
    .filter(user -> user.getAge() >= 18)  // -> 是Lambda表达式
    .collect(Collectors.toList());

// 解释：
// user -> user.getAge() >= 18
// 意思是：对于每个user，判断age是否>=18
```

```java
// 常见Lambda用法
users.forEach(user -> System.out.println(user.getName()));
// 对每个user执行打印操作

Optional<User> found = users.stream()
    .filter(u -> u.getId().equals(id))
    .findFirst();
// 找到第一个id匹配的user
```

### 2.6 Optional（可能为空的值）

```java
Optional<User> optional = userRepository.findById(id);

// 方式1：判断是否存在
if (optional.isPresent()) {
    User user = optional.get();
}

// 方式2：不存在时抛异常
User user = optional.orElseThrow(() -> new RuntimeException("用户不存在"));

// 方式3：不存在时返回默认值
User user = optional.orElse(new User());

// 方式4：不存在时返回null
User user = optional.orElse(null);
```

### 2.7 Spring Data JPA 查询方法命名规则

```java
public interface UserRepository extends JpaRepository<User, Long> {
    
    // 根据方法名自动生成SQL！
    
    User findByUsername(String username);
    // 自动生成: SELECT * FROM tb_user WHERE username = ?
    
    List<User> findByStatus(Integer status);
    // 自动生成: SELECT * FROM tb_user WHERE status = ?
    
    List<User> findByAgeGreaterThan(Integer age);
    // 自动生成: SELECT * FROM tb_user WHERE age > ?
    
    List<User> findByAgeBetween(Integer min, Integer max);
    // 自动生成: SELECT * FROM tb_user WHERE age BETWEEN ? AND ?
    
    List<User> findByNameContaining(String keyword);
    // 自动生成: SELECT * FROM tb_user WHERE name LIKE '%keyword%'
    
    List<User> findByStatusAndRole(Integer status, String role);
    // 自动生成: SELECT * FROM tb_user WHERE status = ? AND role = ?
    
    List<User> findByStatusOrRole(Integer status, String role);
    // 自动生成: SELECT * FROM tb_user WHERE status = ? OR role = ?
    
    List<User> findByOrderByCreatedTimeDesc();
    // 自动生成: SELECT * FROM tb_user ORDER BY created_time DESC
    
    long countByStatus(Integer status);
    // 自动生成: SELECT COUNT(*) FROM tb_user WHERE status = ?
    
    boolean existsByUsername(String username);
    // 自动生成: SELECT EXISTS(SELECT 1 FROM tb_user WHERE username = ?)
    
    void deleteByUserId(Long userId);
    // 自动生成: DELETE FROM tb_user WHERE user_id = ?
}
```

### 2.8 分页查询

```java
// Pageable 是分页参数
Pageable pageable = PageRequest.of(0, 10);  // 第0页，每页10条
// PageRequest.of(page, size, Sort.by("createdTime").descending())
// 还可以加排序

Page<User> page = userRepository.findByStatus(1, pageable);

// Page对象包含的信息：
page.getContent();       // 当前页的数据列表
page.getTotalElements(); // 总记录数
page.getTotalPages();    // 总页数
page.getNumber();        // 当前页码
page.getSize();          // 每页大小
page.isFirst();          // 是否第一页
page.isLast();           // 是否最后一页
```

---

# 二、TypeScript/JavaScript前端语法

## 1. 变量声明

```typescript
const name = "张三";       // const: 常量，不能重新赋值
let age = 18;              // let: 变量，可以重新赋值
var old = "旧写法";        // var: 旧写法，不推荐使用

// TypeScript 类型声明
const name: string = "张三";        // 字符串
const age: number = 18;             // 数字
const active: boolean = true;       // 布尔值
const items: string[] = ["a", "b"]; // 字符串数组
const user: User = { id: 1 };       // 自定义类型
const data: any = "任意类型";        // 任意类型（不推荐）
```

## 2. 函数定义

```typescript
// 普通函数
function add(a: number, b: number): number {
    return a + b;
}

// 箭头函数（更常用）
const add = (a: number, b: number): number => {
    return a + b;
}

// 简写（只有一行时可省略大括号和return）
const add = (a: number, b: number): number => a + b;

// 异步函数
const fetchData = async () => {
    const response = await axios.get('/api/data');
    return response.data;
}
```

## 3. 解构赋值

```typescript
// 对象解构
const user = { name: "张三", age: 18, city: "北京" };
const { name, age } = user;  // 从user中取出name和age
console.log(name);  // "张三"
console.log(age);   // 18

// 数组解构
const arr = [1, 2, 3];
const [first, second] = arr;  // first=1, second=2

// 函数参数解构
const printUser = ({ name, age }: User) => {
    console.log(name, age);
}
```

## 4. 展开运算符（...）

```typescript
// 数组展开
const arr1 = [1, 2, 3];
const arr2 = [...arr1, 4, 5];  // [1, 2, 3, 4, 5]

// 对象展开
const user = { name: "张三", age: 18 };
const newUser = { ...user, age: 20 };  // { name: "张三", age: 20 }
// 复制user的所有属性，然后覆盖age为20
```

## 5. 异步操作（async/await）

```typescript
// Promise 是异步操作的结果
// async 标记函数是异步的
// await 等待异步操作完成

// 方式1：async/await（推荐）
const loadData = async () => {
    try {
        const response = await axios.get('/api/users');  // 等待请求完成
        console.log(response.data);  // 请求成功，打印数据
    } catch (error) {
        console.error('请求失败', error);  // 请求失败，打印错误
    }
}

// 方式2：Promise.then（旧写法）
axios.get('/api/users')
    .then(response => {
        console.log(response.data);
    })
    .catch(error => {
        console.error('请求失败', error);
    });
```

## 6. 模块导入导出

```typescript
// ========== 导出 ==========

// 命名导出（可以导出多个）
export const API_URL = 'http://localhost:8080';
export const getUsers = () => { };
export interface User { id: number; name: string; }

// 默认导出（每个文件只能有一个）
export default function login() { }

// ========== 导入 ==========

// 导入命名导出（用大括号）
import { API_URL, getUsers, User } from './api';

// 导入默认导出（不用大括号）
import login from './auth';

// 导入全部
import * as api from './api';
// 使用: api.API_URL, api.getUsers()

// 导入并重命名
import { getUsers as fetchUsers } from './api';

// 路径说明
import xxx from './file';      // 相对路径，当前目录
import xxx from '../file';     // 相对路径，上级目录
import xxx from '@/api/file';  // @是src目录的别名
import xxx from 'axios';       // node_modules中的包
```

## 7. 类型定义

```typescript
// 接口（定义对象的结构）
interface User {
    id: number;
    name: string;
    age?: number;        // ? 表示可选属性
    readonly email: string;  // readonly 表示只读
}

// 类型别名
type Status = 'pending' | 'success' | 'error';  // 联合类型，只能是这三个值之一
type ID = number | string;  // 可以是number或string

// 泛型（类型参数）
interface Response<T> {
    code: number;
    data: T;        // T是类型参数，使用时指定
    message: string;
}
// 使用：Response<User> 表示 data 是 User 类型
// 使用：Response<User[]> 表示 data 是 User 数组
```

## 8. 数组常用方法

```typescript
const users = [
    { id: 1, name: '张三', age: 20 },
    { id: 2, name: '李四', age: 25 },
    { id: 3, name: '王五', age: 18 }
];

// map - 转换数组中的每个元素
const names = users.map(user => user.name);
// ['张三', '李四', '王五']

// filter - 过滤数组
const adults = users.filter(user => user.age >= 20);
// [{ id: 1, name: '张三', age: 20 }, { id: 2, name: '李四', age: 25 }]

// find - 找到第一个符合条件的元素
const found = users.find(user => user.id === 2);
// { id: 2, name: '李四', age: 25 }

// findIndex - 找到第一个符合条件的元素的索引
const index = users.findIndex(user => user.id === 2);
// 1

// some - 是否有元素符合条件
const hasAdult = users.some(user => user.age >= 18);
// true

// every - 是否所有元素都符合条件
const allAdult = users.every(user => user.age >= 18);
// true

// reduce - 累加/聚合
const totalAge = users.reduce((sum, user) => sum + user.age, 0);
// 63 (20 + 25 + 18)

// forEach - 遍历（不返回新数组）
users.forEach(user => console.log(user.name));

// includes - 数组是否包含某值
const arr = [1, 2, 3];
arr.includes(2);  // true

// sort - 排序
users.sort((a, b) => a.age - b.age);  // 按age升序
users.sort((a, b) => b.age - a.age);  // 按age降序
```

## 9. 可选链和空值合并

```typescript
// 可选链 ?.（安全访问可能为空的属性）
const name = user?.name;        // 如果user为null/undefined，返回undefined而不是报错
const city = user?.address?.city;  // 链式安全访问

// 空值合并 ??（提供默认值）
const name = user?.name ?? '未知';  // 如果name为null/undefined，使用'未知'

// 与 || 的区别
const count = 0;
count || 10;   // 10（因为0是假值）
count ?? 10;   // 0（只有null/undefined才用默认值）
```

---

# 三、Vue模板语法

## 1. 基本结构

```vue
<template>
  <!-- 模板：定义HTML结构 -->
</template>

<script setup lang="ts">
// 脚本：定义数据和逻辑
// setup 是Vue3的组合式API语法
// lang="ts" 表示使用TypeScript
</script>

<style scoped>
/* 样式：定义CSS */
/* scoped 表示样式只作用于当前组件 */
</style>
```

## 2. 数据绑定

```vue
<template>
  <!-- 文本插值：显示变量值 -->
  <p>{{ message }}</p>
  <p>{{ user.name }}</p>
  <p>{{ count + 1 }}</p>
  
  <!-- 属性绑定：v-bind 或简写 : -->
  <img v-bind:src="imageUrl" />
  <img :src="imageUrl" />           <!-- 简写 -->
  <div :class="className"></div>
  <div :style="{ color: textColor }"></div>
  
  <!-- 双向绑定：v-model -->
  <input v-model="username" />
  <!-- 输入框的值和username变量同步 -->
</template>

<script setup lang="ts">
import { ref } from 'vue'

const message = ref('Hello')      // ref创建响应式数据
const username = ref('')
const imageUrl = ref('/img/logo.png')
</script>
```

## 3. 条件渲染

```vue
<template>
  <!-- v-if：条件为true时渲染 -->
  <div v-if="isLoggedIn">欢迎回来</div>
  <div v-else>请登录</div>
  
  <!-- v-else-if -->
  <div v-if="status === 0">待付款</div>
  <div v-else-if="status === 1">待发货</div>
  <div v-else-if="status === 2">待收货</div>
  <div v-else>已完成</div>
  
  <!-- v-show：通过CSS控制显示隐藏（元素始终存在） -->
  <div v-show="isVisible">我可能被隐藏</div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const isLoggedIn = ref(true)
const status = ref(1)
const isVisible = ref(true)
</script>
```

## 4. 列表渲染

```vue
<template>
  <!-- v-for：循环渲染 -->
  <ul>
    <li v-for="item in items" :key="item.id">
      {{ item.name }}
    </li>
  </ul>
  
  <!-- 带索引 -->
  <ul>
    <li v-for="(item, index) in items" :key="item.id">
      {{ index + 1 }}. {{ item.name }}
    </li>
  </ul>
  
  <!-- 遍历对象 -->
  <div v-for="(value, key) in user" :key="key">
    {{ key }}: {{ value }}
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const items = ref([
  { id: 1, name: '苹果' },
  { id: 2, name: '香蕉' }
])
</script>
```

## 5. 事件处理

```vue
<template>
  <!-- v-on 或简写 @ -->
  <button v-on:click="handleClick">点击</button>
  <button @click="handleClick">点击</button>  <!-- 简写 -->
  
  <!-- 传参 -->
  <button @click="handleClick(item.id)">删除</button>
  
  <!-- 事件修饰符 -->
  <form @submit.prevent="handleSubmit">  <!-- .prevent 阻止默认行为 -->
    <button type="submit">提交</button>
  </form>
  
  <div @click.stop="handleClick">  <!-- .stop 阻止事件冒泡 -->
    点击
  </div>
  
  <input @keyup.enter="handleEnter" />  <!-- .enter 按回车时触发 -->
</template>

<script setup lang="ts">
const handleClick = () => {
  console.log('被点击了')
}

const handleSubmit = () => {
  console.log('表单提交')
}
</script>
```

## 6. Vue 3 组合式API

```vue
<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'

// ========== ref：创建响应式基本类型 ==========
const count = ref(0)
// 访问值：count.value
// 模板中自动解包：{{ count }}

// ========== reactive：创建响应式对象 ==========
const user = reactive({
  name: '张三',
  age: 18
})
// 直接访问：user.name

// ========== computed：计算属性 ==========
const doubleCount = computed(() => count.value * 2)
// 当count变化时，doubleCount自动更新

// ========== watch：监听变化 ==========
watch(count, (newValue, oldValue) => {
  console.log(`count从${oldValue}变为${newValue}`)
})

// 监听多个
watch([count, user], ([newCount, newUser]) => {
  console.log('数据变化了')
})

// ========== 生命周期钩子 ==========
onMounted(() => {
  // 组件挂载完成后执行（常用于初始化数据）
  console.log('组件已挂载')
  loadData()
})

// 其他生命周期
// onBeforeMount - 挂载前
// onUpdated - 更新后
// onBeforeUpdate - 更新前
// onUnmounted - 卸载后
// onBeforeUnmount - 卸载前
</script>
```

## 7. 组件通信

```vue
<!-- 父组件 Parent.vue -->
<template>
  <Child 
    :message="msg"           <!-- 传递数据给子组件 -->
    @update="handleUpdate"   <!-- 监听子组件事件 -->
  />
</template>

<script setup lang="ts">
import Child from './Child.vue'
import { ref } from 'vue'

const msg = ref('Hello')

const handleUpdate = (value: string) => {
  console.log('子组件传来:', value)
}
</script>
```

```vue
<!-- 子组件 Child.vue -->
<template>
  <div>{{ message }}</div>
  <button @click="sendToParent">发送给父组件</button>
</template>

<script setup lang="ts">
// defineProps：接收父组件传来的数据
const props = defineProps<{
  message: string
}>()

// defineEmits：定义可以触发的事件
const emit = defineEmits<{
  (e: 'update', value: string): void
}>()

const sendToParent = () => {
  emit('update', '来自子组件的数据')
}
</script>
```

## 8. Pinia 状态管理

```typescript
// stores/userStore.ts
import { defineStore } from 'pinia'

// defineStore 定义一个store
// 第一个参数是store的唯一ID
export const useUserStore = defineStore('user', {
  // state：存储数据
  state: () => ({
    user: null as User | null,
    token: ''
  }),
  
  // getters：计算属性
  getters: {
    isLoggedIn: (state) => !!state.token,  // !! 转换为布尔值
    username: (state) => state.user?.name ?? '游客'
  },
  
  // actions：方法
  actions: {
    setUser(user: User) {
      this.user = user
    },
    logout() {
      this.user = null
      this.token = ''
    }
  }
})
```

```vue
<!-- 在组件中使用 -->
<script setup lang="ts">
import { useUserStore } from '@/stores/userStore'

const userStore = useUserStore()

// 访问state
console.log(userStore.token)

// 访问getters
console.log(userStore.isLoggedIn)

// 调用actions
userStore.setUser({ id: 1, name: '张三' })
userStore.logout()
</script>
```

## 9. Vue Router 路由

```typescript
// router/index.ts
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',              // URL路径
      name: 'home',           // 路由名称
      component: HomeView     // 对应的组件
    },
    {
      path: '/product/:id',   // :id 是动态参数
      name: 'product',
      component: ProductView
    },
    {
      path: '/admin',
      component: AdminLayout,
      children: [             // 嵌套路由
        { path: 'users', component: UsersView },
        { path: 'products', component: ProductsView }
      ]
    }
  ]
})
```

```vue
<!-- 在组件中使用路由 -->
<template>
  <!-- 路由链接 -->
  <router-link to="/">首页</router-link>
  <router-link :to="{ name: 'product', params: { id: 1 } }">商品1</router-link>
  
  <!-- 路由出口（显示匹配的组件） -->
  <router-view />
</template>

<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()  // 路由实例，用于跳转
const route = useRoute()    // 当前路由信息

// 编程式导航
router.push('/')                          // 跳转到首页
router.push({ name: 'product', params: { id: 1 } })  // 跳转到商品页
router.back()                             // 返回上一页

// 获取路由参数
const productId = route.params.id         // 获取动态参数
const keyword = route.query.keyword       // 获取查询参数 ?keyword=xxx
</script>
```

---

# 四、SQL数据库语法

## 1. 基本查询

```sql
-- 查询所有列
SELECT * FROM tb_user;

-- 查询指定列
SELECT id, username, email FROM tb_user;

-- 条件查询
SELECT * FROM tb_user WHERE status = 1;
SELECT * FROM tb_user WHERE age > 18;
SELECT * FROM tb_user WHERE name LIKE '%张%';  -- 包含"张"

-- 多条件
SELECT * FROM tb_user WHERE status = 1 AND role = 'USER';
SELECT * FROM tb_user WHERE status = 1 OR role = 'ADMIN';

-- 排序
SELECT * FROM tb_user ORDER BY created_time DESC;  -- 降序
SELECT * FROM tb_user ORDER BY created_time ASC;   -- 升序

-- 限制数量
SELECT * FROM tb_user LIMIT 10;           -- 前10条
SELECT * FROM tb_user LIMIT 10 OFFSET 20; -- 跳过20条，取10条

-- 去重
SELECT DISTINCT category_id FROM tb_product;

-- 统计
SELECT COUNT(*) FROM tb_user;                    -- 总数
SELECT COUNT(*) FROM tb_user WHERE status = 1;  -- 条件统计
SELECT SUM(price) FROM tb_order;                -- 求和
SELECT AVG(price) FROM tb_product;              -- 平均值
SELECT MAX(price), MIN(price) FROM tb_product;  -- 最大最小值
```

## 2. 插入数据

```sql
-- 插入单条
INSERT INTO tb_user (username, password, email) 
VALUES ('zhangsan', '123456', 'zhangsan@example.com');

-- 插入多条
INSERT INTO tb_user (username, password) VALUES 
('user1', '123456'),
('user2', '123456'),
('user3', '123456');
```

## 3. 更新数据

```sql
-- 更新单个字段
UPDATE tb_user SET status = 0 WHERE id = 1;

-- 更新多个字段
UPDATE tb_user SET status = 0, updated_time = NOW() WHERE id = 1;

-- 批量更新
UPDATE tb_product SET status = 0 WHERE category_id = 5;
```

## 4. 删除数据

```sql
-- 删除指定记录
DELETE FROM tb_user WHERE id = 1;

-- 删除多条
DELETE FROM tb_cart WHERE user_id = 1;

-- 清空表（谨慎使用！）
TRUNCATE TABLE tb_cart;
```

## 5. 表连接

```sql
-- 内连接（只返回匹配的记录）
SELECT o.*, u.username 
FROM tb_order o
INNER JOIN tb_user u ON o.user_id = u.id;

-- 左连接（返回左表所有记录）
SELECT p.*, c.name as category_name
FROM tb_product p
LEFT JOIN tb_category c ON p.category_id = c.id;

-- 多表连接
SELECT oi.*, p.name as product_name, u.username as seller_name
FROM tb_order_item oi
JOIN tb_product p ON oi.product_id = p.id
JOIN tb_user u ON oi.seller_id = u.id;
```

## 6. 分组查询

```sql
-- 按分类统计商品数量
SELECT category_id, COUNT(*) as count 
FROM tb_product 
GROUP BY category_id;

-- 按用户统计订单金额
SELECT user_id, SUM(total_amount) as total 
FROM tb_order 
GROUP BY user_id;

-- 分组后筛选（HAVING）
SELECT category_id, COUNT(*) as count 
FROM tb_product 
GROUP BY category_id 
HAVING count > 5;  -- 只显示商品数>5的分类
```

## 7. 子查询

```sql
-- 查询有订单的用户
SELECT * FROM tb_user 
WHERE id IN (SELECT DISTINCT user_id FROM tb_order);

-- 查询价格高于平均价的商品
SELECT * FROM tb_product 
WHERE price > (SELECT AVG(price) FROM tb_product);
```

## 8. 创建表

```sql
CREATE TABLE tb_user (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,  -- 主键，自增
    username VARCHAR(50) NOT NULL,         -- 不能为空
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE,             -- 唯一约束
    status TINYINT DEFAULT 1,              -- 默认值
    created_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_username (username),         -- 创建索引
    INDEX idx_status (status)
);
```

## 9. 修改表

```sql
-- 添加列
ALTER TABLE tb_user ADD COLUMN phone VARCHAR(20);

-- 修改列
ALTER TABLE tb_user MODIFY COLUMN phone VARCHAR(30);

-- 删除列
ALTER TABLE tb_user DROP COLUMN phone;

-- 添加索引
ALTER TABLE tb_user ADD INDEX idx_email (email);

-- 添加外键
ALTER TABLE tb_order 
ADD CONSTRAINT fk_order_user 
FOREIGN KEY (user_id) REFERENCES tb_user(id);
```

---

# 五、项目中的特殊语法

## 1. Element Plus 组件

```vue
<template>
  <!-- 按钮 -->
  <el-button type="primary" @click="handleClick">主要按钮</el-button>
  <el-button type="success">成功按钮</el-button>
  <el-button type="danger">危险按钮</el-button>
  
  <!-- 表格 -->
  <el-table :data="tableData">
    <el-table-column prop="name" label="姓名" />
    <el-table-column prop="age" label="年龄" />
    <el-table-column label="操作">
      <template #default="{ row }">
        <el-button @click="handleEdit(row)">编辑</el-button>
      </template>
    </el-table-column>
  </el-table>
  
  <!-- 表单 -->
  <el-form :model="form" :rules="rules" ref="formRef">
    <el-form-item label="用户名" prop="username">
      <el-input v-model="form.username" />
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="submitForm">提交</el-button>
    </el-form-item>
  </el-form>
  
  <!-- 消息提示 -->
  <!-- 在JS中调用：ElMessage.success('操作成功') -->
  
  <!-- 分页 -->
  <el-pagination
    v-model:current-page="currentPage"
    v-model:page-size="pageSize"
    :total="total"
    @current-change="handlePageChange"
  />
</template>
```

## 2. Axios 请求

```typescript
// 基本用法
import axios from 'axios'

// GET 请求
axios.get('/api/users')
axios.get('/api/users', { params: { page: 0, size: 10 } })

// POST 请求
axios.post('/api/users', { username: '张三', password: '123456' })

// PUT 请求
axios.put('/api/users/1', { username: '李四' })

// DELETE 请求
axios.delete('/api/users/1')

// 带请求头
axios.get('/api/users', {
  headers: { 'Authorization': 'Bearer ' + token }
})
```

```typescript
// 项目中的封装 (utils/axios.ts)
import axios from 'axios'

const instance = axios.create({
  baseURL: 'http://localhost:8080',
  timeout: 10000
})

// 请求拦截器：每次请求前自动添加token
instance.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截器：统一处理响应
instance.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // token过期，跳转登录
      router.push('/login')
    }
    return Promise.reject(error)
  }
)

export default instance
```

---

# 六、常见符号解释

| 符号 | 名称 | 用途 |
|------|------|------|
| `=>` | 箭头 | 箭头函数 `(a) => a + 1` |
| `...` | 展开运算符 | 展开数组/对象 `{...obj}` |
| `?.` | 可选链 | 安全访问 `user?.name` |
| `??` | 空值合并 | 默认值 `name ?? '未知'` |
| `!!` | 双重否定 | 转布尔值 `!!value` |
| `\|\|` | 或 | 逻辑或 `a \|\| b` |
| `&&` | 与 | 逻辑与 `a && b` |
| `===` | 严格等于 | 值和类型都相等 |
| `!==` | 严格不等 | 值或类型不相等 |
| `${}` | 模板字符串 | `` `Hello ${name}` `` |
| `<T>` | 泛型 | 类型参数 `Array<string>` |
| `@` | 装饰器/事件 | Java注解 / Vue事件 |
| `:` | 绑定/类型 | Vue属性绑定 / TS类型声明 |
| `#` | 插槽/私有 | Vue插槽 `#default` |

---

# 七、快速对照表

## Java vs TypeScript 对照

| 概念 | Java | TypeScript |
|------|------|------------|
| 变量声明 | `String name = "张三";` | `const name: string = "张三"` |
| 数组 | `List<String> list` | `string[]` 或 `Array<string>` |
| 对象 | `new User()` | `{ name: "张三" }` |
| 空值 | `null` | `null` 或 `undefined` |
| 函数 | `public void fn() {}` | `const fn = () => {}` |
| 类 | `public class User {}` | `class User {}` 或 `interface User {}` |
| 循环 | `for (User u : list)` | `for (const u of list)` |
| 条件 | `if (a == 1)` | `if (a === 1)` |

---

**学习建议**：
1. 先理解基本语法，再看项目代码
2. 遇到不懂的语法，回来查这个手册
3. 多动手敲代码，光看不练是学不会的
4. 有问题随时问我！

祝学习顺利！🎉
