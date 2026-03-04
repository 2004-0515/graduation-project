# 常见错误排查手册

遇到报错不要慌，按照这个手册一步步排查！

---

## 一、后端错误

### 1.1 启动失败类

#### 错误：端口被占用
```
Web server failed to start. Port 8080 was already in use.
```

**原因**：8080端口已经被其他程序占用

**解决**：
```bash
# Windows - 查找占用端口的进程
netstat -ano | findstr :8080

# 杀死进程（PID是上面查到的数字）
taskkill /PID 进程号 /F

# 或者修改端口，在 application.properties 添加：
server.port=8081
```

---

#### 错误：数据库连接失败
```
Communications link failure
Cannot create connection to database server
```

**原因**：MySQL没启动 或 连接配置错误

**解决**：
1. 确认MySQL服务已启动
2. 检查 `application.properties` 配置：
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/shopping_mall
spring.datasource.username=root
spring.datasource.password=你的密码
```

---

#### 错误：找不到数据库
```
Unknown database 'shopping_mall'
```

**解决**：在MySQL中创建数据库
```sql
CREATE DATABASE shopping_mall CHARACTER SET utf8mb4;
```

---

### 1.2 编译错误类

#### 错误：找不到符号 / Cannot find symbol
```
java: cannot find symbol
  symbol: variable userRepository
```

**原因**：
1. 忘记导入类
2. 忘记添加 `@Autowired` 注解
3. 拼写错误

**解决**：
```java
// 检查是否有导入
import com.shopping.repository.UserRepository;

// 检查是否有注入
@Autowired
private UserRepository userRepository;  // 不是 userrepository
```

---

#### 错误：类型不匹配
```
incompatible types: String cannot be converted to Long
```

**原因**：数据类型不对

**解决**：
```java
// 错误
Long id = "123";

// 正确
Long id = 123L;
// 或
Long id = Long.parseLong("123");
```

---

### 1.3 运行时错误类

#### 错误：空指针异常 NullPointerException
```
java.lang.NullPointerException: Cannot invoke method because "user" is null
```

**原因**：访问了null对象的属性或方法

**解决**：
```java
// 错误写法
String name = user.getName();  // 如果user是null就报错

// 正确写法1：先判断
if (user != null) {
    String name = user.getName();
}

// 正确写法2：使用Optional
Optional<User> optional = userRepository.findById(id);
User user = optional.orElseThrow(() -> new RuntimeException("用户不存在"));
```

---

#### 错误：401 Unauthorized
```
{
  "code": 401,
  "message": "未授权"
}
```

**原因**：
1. 没有登录
2. Token过期
3. Token格式错误

**解决**：
1. 确认已登录并获取token
2. 检查请求头是否正确：`Authorization: Bearer <token>`
3. 重新登录获取新token

---

#### 错误：403 Forbidden
```
{
  "code": 403,
  "message": "禁止访问"
}
```

**原因**：没有权限访问该接口（如普通用户访问管理员接口）

**解决**：使用有权限的账号登录（如admin）

---

## 二、前端错误

### 2.1 启动失败类

#### 错误：模块找不到
```
Cannot find module 'xxx'
Module not found: Error: Can't resolve 'xxx'
```

**解决**：
```bash
# 删除node_modules重新安装
rm -rf node_modules
npm install

# 或者安装缺失的包
npm install xxx
```

---

#### 错误：端口被占用
```
Port 5173 is already in use
```

**解决**：
```bash
# 杀死占用进程，或修改端口
# 在 vite.config.ts 中：
export default defineConfig({
  server: {
    port: 5174  // 改成其他端口
  }
})
```

---

### 2.2 编译错误类

#### 错误：类型错误
```
Type 'string' is not assignable to type 'number'
```

**原因**：TypeScript类型检查不通过

**解决**：
```typescript
// 错误
const id: number = "123"

// 正确
const id: number = 123
// 或
const id: number = parseInt("123")
```

---

#### 错误：属性不存在
```
Property 'xxx' does not exist on type 'yyy'
```

**原因**：访问了对象上不存在的属性

**解决**：
```typescript
// 检查类型定义
interface User {
  id: number
  name: string  // 确保有这个属性
}

// 或使用可选链
const name = user?.name
```

---

### 2.3 运行时错误类

#### 错误：Network Error / 请求失败
```
AxiosError: Network Error
```

**原因**：
1. 后端没启动
2. 跨域问题
3. URL错误

**解决**：
1. 确认后端已启动（http://localhost:8080）
2. 检查 `vite.config.ts` 代理配置
3. 检查API地址是否正确

---

#### 错误：Cannot read properties of undefined
```
Uncaught TypeError: Cannot read properties of undefined (reading 'xxx')
```

**原因**：访问了undefined的属性

**解决**：
```typescript
// 错误
const name = response.data.user.name  // 如果user是undefined就报错

// 正确 - 使用可选链
const name = response.data?.user?.name

// 或先判断
if (response.data && response.data.user) {
  const name = response.data.user.name
}
```

---

#### 错误：页面空白 / 白屏
**排查步骤**：
1. 打开浏览器控制台（F12）查看错误
2. 检查Network标签，看请求是否成功
3. 检查Console标签，看有没有JS错误

---

## 三、数据库错误

### 3.1 SQL语法错误
```
You have an error in your SQL syntax
```

**常见原因**：
1. 关键字拼写错误
2. 缺少逗号或分号
3. 引号不匹配

**解决**：仔细检查SQL语句

---

### 3.2 外键约束错误
```
Cannot add or update a child row: a foreign key constraint fails
```

**原因**：插入的外键值在关联表中不存在

**解决**：
```sql
-- 例如插入订单时，user_id必须在tb_user表中存在
-- 先检查用户是否存在
SELECT * FROM tb_user WHERE id = 1;

-- 确保存在后再插入订单
INSERT INTO tb_order (user_id, ...) VALUES (1, ...);
```

---

### 3.3 数据截断错误
```
Data truncation: Data too long for column 'xxx'
```

**原因**：插入的数据超过了字段长度限制

**解决**：
```sql
-- 检查字段长度
DESCRIBE tb_user;

-- 修改字段长度
ALTER TABLE tb_user MODIFY COLUMN nickname VARCHAR(100);
```

---

## 四、常见业务问题

### 4.1 登录后跳转失败
**排查**：
1. 检查token是否保存成功：`localStorage.getItem('token')`
2. 检查路由配置是否正确
3. 检查是否有路由守卫拦截

---

### 4.2 数据不显示
**排查**：
1. 打开Network查看请求是否成功
2. 检查响应数据格式是否正确
3. 检查Vue组件中数据绑定是否正确
4. 检查v-if条件是否满足

---

### 4.3 修改代码后没效果
**解决**：
1. 后端：重启服务 `mvn spring-boot:run`
2. 前端：通常自动刷新，不行就手动刷新浏览器
3. 清除浏览器缓存（Ctrl+Shift+Delete）

---

### 4.4 状态显示"未知"
**原因**：数据库中的状态值没有对应的映射

**解决**：
1. 检查数据库中的状态值是否在有效范围内
2. 检查前端常量映射是否完整
3. 参考 `project-rules.md` 中的状态码定义

---

## 五、调试技巧

### 5.1 后端调试
```java
// 添加日志输出
System.out.println("=== 调试信息 ===");
System.out.println("变量值: " + variable);

// 或使用日志框架
log.info("用户登录: {}", username);
```

### 5.2 前端调试
```typescript
// 控制台输出
console.log('调试信息', data)

// 断点调试
debugger  // 代码执行到这里会暂停
```

### 5.3 网络请求调试
1. 打开浏览器开发者工具（F12）
2. 切换到 Network 标签
3. 查看请求的 Headers、Payload、Response

### 5.4 数据库调试
```sql
-- 查看表结构
DESCRIBE tb_user;

-- 查看数据
SELECT * FROM tb_user LIMIT 10;

-- 查看最近的错误
SHOW WARNINGS;
```

---

**记住**：遇到错误先看错误信息，90%的问题错误信息里都有答案！
