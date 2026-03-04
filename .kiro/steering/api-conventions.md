# API 接口规范

## 响应格式

所有API响应统一使用以下格式：

```json
{
  "code": 200,
  "message": "success",
  "success": true,
  "data": {}
}
```

### 状态码定义

| code | 含义 | 说明 |
|------|------|------|
| 200 | 成功 | 请求处理成功 |
| 400 | 参数错误 | 请求参数验证失败 |
| 401 | 未授权 | 未登录或token过期 |
| 403 | 禁止访问 | 无权限访问该资源 |
| 404 | 资源不存在 | 请求的资源不存在 |
| 500 | 服务器错误 | 服务器内部错误 |

## 分页响应

分页接口返回格式：

```json
{
  "code": 200,
  "data": {
    "content": [],
    "totalElements": 100,
    "totalPages": 10,
    "size": 10,
    "number": 0,
    "first": true,
    "last": false
  }
}
```

### 分页参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| page | int | 0 | 页码（从0开始） |
| size | int | 10 | 每页数量 |
| sort | string | - | 排序字段,方向 |

## 认证方式

使用 JWT Token 认证：

```
Authorization: Bearer <token>
```

### Token 获取

```
POST /api/auth/login
{
  "username": "string",
  "password": "string"
}
```

### Token 刷新

Token 有效期 24 小时，过期后需重新登录。

## 常用接口

### 用户模块 `/api/auth`

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | /login | 登录 | 公开 |
| POST | /register | 注册 | 公开 |
| GET | /me | 获取当前用户 | 登录 |
| PUT | /profile | 更新个人信息 | 登录 |
| PUT | /change-password | 修改密码 | 登录 |

### 商品模块 `/api/products`

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | / | 商品列表 | 公开 |
| GET | /{id} | 商品详情 | 公开 |
| GET | /category/{id} | 分类商品 | 公开 |
| GET | /search | 搜索商品 | 公开 |
| POST | / | 创建商品 | 登录 |
| PUT | /{id} | 更新商品 | 卖家 |
| DELETE | /{id} | 删除商品 | 卖家 |

### 购物车模块 `/api/cart`

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | / | 购物车列表 | 登录 |
| POST | / | 添加商品 | 登录 |
| PUT | /{id} | 更新数量 | 登录 |
| DELETE | /{id} | 删除商品 | 登录 |
| DELETE | /clear | 清空购物车 | 登录 |

### 订单模块 `/api/orders`

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | / | 订单列表 | 登录 |
| GET | /{id} | 订单详情 | 登录 |
| POST | / | 创建订单 | 登录 |
| POST | /{id}/pay | 支付订单 | 登录 |
| POST | /{id}/cancel | 取消订单 | 登录 |
| POST | /{id}/confirm | 确认收货 | 登录 |

### 管理员模块 `/api/admin`

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | /dashboard | 仪表盘数据 | 管理员 |
| GET | /users | 用户列表 | 管理员 |
| GET | /orders | 订单列表 | 管理员 |
| GET | /products | 商品列表 | 管理员 |
| PUT | /products/{id}/audit | 审核商品 | 管理员 |

## 错误处理

### 业务异常

```json
{
  "code": 400,
  "message": "商品库存不足",
  "success": false,
  "data": null
}
```

### 验证异常

```json
{
  "code": 400,
  "message": "参数验证失败",
  "success": false,
  "data": {
    "errors": [
      {"field": "username", "message": "用户名不能为空"},
      {"field": "password", "message": "密码长度至少6位"}
    ]
  }
}
```

## 文件上传

### 上传接口

```
POST /api/files/upload
Content-Type: multipart/form-data

file: 文件
type: AVATAR | PRODUCT | REVIEW | CATEGORY | PROMOTION
```

### 图片访问

```
GET /api/files/image/{filename}
```

### 前端处理

```typescript
import { fileApi } from '@/api/fileApi'

// 获取完整图片URL
const imageUrl = fileApi.getImageUrl(filename)
```

## 最佳实践

### 前端调用

1. 使用 `api/` 目录下的模块化API
2. 统一使用 axios 实例处理请求
3. 错误统一在拦截器中处理
4. Token 自动附加到请求头

### 后端开发

1. Controller 层只做参数校验和响应封装
2. Service 层处理业务逻辑
3. 使用常量类代替魔法数字
4. 管理员接口需调用 `AdminUtils.requireAdmin()`

### 状态码使用

1. 使用常量类中定义的状态码
2. 前后端状态码必须一致
3. 新增状态码需同步更新所有相关文件
