# 购物商场API文档

## 概述

本文档描述了购物商场系统的REST API接口规范。

### 基础信息

- **基础URL**: `http://localhost:8080/api`
- **认证方式**: JWT Bearer Token
- **数据格式**: JSON
- **字符编码**: UTF-8

### 认证

大部分API需要认证，在请求头中添加：
```
Authorization: Bearer <your-jwt-token>
```

## 用户认证API

### 注册用户

```http
POST /auth/register
Content-Type: application/json

{
  "username": "string",
  "password": "string",
  "email": "string",
  "phone": "string"
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "用户注册成功",
  "data": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "phone": "13800138000",
    "createdTime": "2024-01-01T00:00:00"
  }
}
```

### 用户登录

```http
POST /auth/login
Content-Type: application/json

{
  "username": "string",
  "password": "string"
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "testuser",
      "email": "test@example.com"
    }
  }
}
```

### 获取当前用户信息

```http
GET /auth/me
Authorization: Bearer <token>
```

### 更新用户信息

```http
PUT /auth/me
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "newemail@example.com",
  "nickname": "新昵称",
  "phone": "13800138001"
}
```

### 修改密码

```http
POST /auth/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword",
  "confirmPassword": "newpassword"
}
```

## 购物车API

### 获取购物车列表

```http
GET /cart
Authorization: Bearer <token>
```

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "productId": 1,
      "productName": "iPhone 15 Pro",
      "productImage": "https://example.com/iphone.jpg",
      "price": 8999.00,
      "quantity": 2,
      "stock": 100,
      "selected": true
    }
  ]
}
```

### 添加商品到购物车

```http
POST /cart
Authorization: Bearer <token>
Content-Type: application/json

{
  "productId": 1,
  "quantity": 2
}
```

### 更新购物车项

```http
PUT /cart/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "quantity": 3,
  "selected": true
}
```

### 删除购物车项

```http
DELETE /cart/{id}
Authorization: Bearer <token>
```

### 批量删除购物车项

```http
DELETE /cart/batch
Authorization: Bearer <token>
Content-Type: application/json

{
  "ids": [1, 2, 3]
}
```

### 清空购物车

```http
DELETE /cart/clear
Authorization: Bearer <token>
```

### 全选/取消全选

```http
PUT /cart/select-all?selected=true
Authorization: Bearer <token>
```

## 订单API

### 创建订单

```http
POST /orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "addressId": 1,
  "paymentMethod": 1,
  "items": [
    {
      "productId": 1,
      "quantity": 2
    }
  ]
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "订单创建成功",
  "data": {
    "id": 1,
    "orderNo": "ORD1704067200000123",
    "totalAmount": 17998.00,
    "paymentMethod": 1,
    "paymentStatus": 0,
    "orderStatus": 0,
    "createdTime": "2024-01-01T00:00:00"
  }
}
```

### 获取订单列表

```http
GET /orders?page=0&size=10&status=0
Authorization: Bearer <token>
```

### 获取订单详情

```http
GET /orders/{id}
Authorization: Bearer <token>
```

### 取消订单

```http
PUT /orders/{id}/cancel
Authorization: Bearer <token>
```

### 确认收货

```http
PUT /orders/{id}/confirm
Authorization: Bearer <token>
```

### 删除订单

```http
DELETE /orders/{id}
Authorization: Bearer <token>
```

## 商品API

### 获取商品列表

```http
GET /products?page=0&size=20&categoryId=1&keyword=iPhone
```

### 获取商品详情

```http
GET /products/{id}
```

### 获取商品分类

```http
GET /categories
```

## 地址管理API

### 获取用户地址列表

```http
GET /addresses
Authorization: Bearer <token>
```

### 创建地址

```http
POST /addresses
Authorization: Bearer <token>
Content-Type: application/json

{
  "receiver": "张三",
  "phone": "13800138000",
  "province": "北京市",
  "city": "北京市",
  "district": "朝阳区",
  "detail": "xxx路xxx号",
  "isDefault": true
}
```

### 更新地址

```http
PUT /addresses/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "receiver": "李四",
  "phone": "13800138001",
  "province": "上海市",
  "city": "上海市",
  "district": "浦东新区",
  "detail": "xxx路xxx号",
  "isDefault": false
}
```

### 删除地址

```http
DELETE /addresses/{id}
Authorization: Bearer <token>
```

### 设置默认地址

```http
PUT /addresses/{id}/default
Authorization: Bearer <token>
```

## 错误响应格式

所有API在出错时都会返回统一的错误格式：

```json
{
  "success": false,
  "code": 400,
  "message": "错误描述信息"
}
```

### 常见错误码

- `400`: 请求参数错误
- `401`: 未认证或认证失败
- `403`: 权限不足
- `404`: 资源不存在
- `422`: 验证失败
- `500`: 服务器内部错误

## 分页响应格式

对于列表接口，返回数据包含分页信息：

```json
{
  "success": true,
  "data": {
    "content": [...],
    "totalElements": 100,
    "totalPages": 10,
    "size": 10,
    "number": 0,
    "first": true,
    "last": false
  }
}
```

## 状态码说明

### 支付方式
- `1`: 微信支付
- `2`: 支付宝

### 支付状态
- `0`: 未支付
- `1`: 已支付
- `2`: 支付失败

### 订单状态
- `0`: 待支付
- `1`: 待发货
- `2`: 待收货
- `3`: 已完成
- `4`: 已取消

### 商品状态
- `0`: 已下架
- `1`: 已上架
