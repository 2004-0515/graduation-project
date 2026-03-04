# 项目开发规范

## 数据库规范

### 数据范围约束
- 用户ID范围: 1-20 (tb_user)
- 商品ID范围: 1-51 (tb_product)
- 分类ID范围: 1-12 (tb_category)
- 新增数据时必须验证外键引用在有效范围内

### SQL执行规则
- **禁止**通过PowerShell/命令行执行包含中文的SQL文件（会导致编码损坏）
- 包含中文的SQL文件需要用户在Navicat中手动执行（UTF-8编码）
- 只生成SQL文件，提示用户手动执行

### 状态码定义（必须前后端一致）

#### 订单状态 (order_status)
| 值 | 含义 | 英文常量 |
|----|------|----------|
| 0 | 待付款 | PENDING_PAYMENT |
| 1 | 待发货 | PENDING_SHIPMENT |
| 2 | 待收货 | PENDING_RECEIPT |
| 3 | 已完成 | COMPLETED |
| 4 | 已取消 | CANCELLED |
| 5 | 退款中 | REFUNDING |
| 6 | 申请取消中 | CANCEL_REQUESTED |

#### 支付状态 (payment_status)
| 值 | 含义 |
|----|------|
| 0 | 未支付 |
| 1 | 已支付 |
| 2 | 支付失败 |

#### 审核状态
| 值 | 含义 |
|----|------|
| 0 | 待审核 |
| 1 | 已通过 |
| 2 | 已拒绝 |

#### 商品状态 (status)
| 值 | 含义 |
|----|------|
| 0 | 已下架 |
| 1 | 在售 |

#### 用户状态 (status)
| 值 | 含义 |
|----|------|
| 0 | 禁用 |
| 1 | 启用 |

#### 优惠券类型 (type)
| 值 | 含义 |
|----|------|
| 1 | 满减券 |
| 2 | 折扣券 |
| 3 | 无门槛券 |

#### 优惠券状态 (status)
| 值 | 含义 |
|----|------|
| 0 | 禁用 |
| 1 | 启用 |

#### 用户优惠券状态 (status)
| 值 | 含义 |
|----|------|
| 0 | 未使用 |
| 1 | 已使用 |
| 2 | 已过期 |

#### 价格提醒状态 (status)
| 值 | 含义 |
|----|------|
| 0 | 监控中 |
| 1 | 已触发 |
| 2 | 已取消 |

#### 通知类型 (type)
| 值 | 含义 |
|----|------|
| system | 系统通知 |
| promotion | 促销通知 |
| order | 订单通知 |
| file_review | 文件审核 |
| product | 商品通知 |

#### 通知状态 (status)
| 值 | 含义 |
|----|------|
| 0 | 未读 |
| 1 | 已读 |

#### 文件类型 (file_type)
| 值 | 含义 |
|----|------|
| AVATAR | 用户头像 |
| PRODUCT | 商品图片 |
| REVIEW | 评价图片 |
| CATEGORY | 分类图片 |
| PROMOTION | 促销图片 |

#### 文件审核状态 (status)
| 值 | 含义 |
|----|------|
| 0 | 待审核 |
| 1 | 已通过 |
| 2 | 已拒绝 |

#### 心愿单状态 (status)
| 值 | 含义 | 英文常量 |
|----|------|----------|
| 0 | 冷静中 | COOLING |
| 1 | 可购买 | READY |
| 2 | 已购买 | PURCHASED |
| 3 | 已移除 | REMOVED |

#### 发货状态 (ship_status)
| 值 | 含义 | 英文常量 |
|----|------|----------|
| 0 | 待发货 | PENDING |
| 1 | 已发货 | SHIPPED |

## 业务规则

### 管理员权限
- 管理员(admin/seller_id=1)上传的内容**自动启用**，无需审核
- 普通用户上传的内容需要审核通过后才启用
- 涉及字段: ad_video_enabled, status 等

### 文件上传
- 图片存放: uploads/ 目录下对应子文件夹
- 管理员上传直接生效
- 用户上传需审核

### 订单流程
1. 用户下单 → order_status=0(待付款)
2. 用户支付 → order_status=1(待发货), payment_status=1
3. 卖家发货 → order_status=2(待收货)
4. 用户确认收货 → order_status=3(已完成)
5. 用户取消(待付款时) → order_status=4(已取消)
6. 用户申请取消(待发货时) → order_status=6(申请取消中)
7. 管理员同意取消 → order_status=4(已取消)

### 商品审核流程
1. 用户上传商品 → audit_status=0(待审核)
2. 管理员审核通过 → audit_status=1(已通过)
3. 管理员审核拒绝 → audit_status=2(已拒绝)
4. 管理员上传商品 → audit_status=1(自动通过)

### 商品卖家规则
- seller_id=1 (admin): 管理员/平台自营
- seller_id=2-20: 普通卖家用户
- 商品必须有真实卖家，不允许 seller_id=NULL
- 按分类分配卖家，模拟真实电商场景

### 优惠券使用流程
1. 用户领取优惠券 → user_coupon.status=0(未使用)
2. 用户下单使用 → user_coupon.status=1(已使用)
3. 优惠券过期 → user_coupon.status=2(已过期)

## 代码位置

### 常量定义
- 后端: `backend/src/main/java/com/shopping/constants/`
  - `OrderConstants.java` - 订单、支付相关常量
  - `AuditConstants.java` - 审核、商品、用户状态常量
  - `CouponConstants.java` - 优惠券相关常量
  - `PriceAlertConstants.java` - 价格提醒相关常量
  - `NotificationConstants.java` - 通知、文件类型、文件审核相关常量
  - `WishlistConstants.java` - 心愿单相关常量
- 前端: `frontend/src/constants/index.ts`
- 前端类型: `frontend/src/types/index.ts`

### 状态映射
- 后端常量: `OrderConstants.java`, `AuditConstants.java`
- 前端映射: 各View组件中的 `getStatusText()` 函数
- 前端常量: `frontend/src/constants/index.ts`

## 修改检查清单

当修改状态码或枚举值时，必须同步更新：
1. [ ] 后端常量类 (constants/*.java)
2. [ ] 前端常量文件 (constants/index.ts)
3. [ ] 前端组件中的状态映射函数
4. [ ] 数据库中的现有数据
5. [ ] 下拉筛选框选项

## 测试账号
- 管理员: admin / 123456
- 普通用户: zhangsan / 123456

## 数据库表说明

| 表名 | 说明 | 记录数 |
|------|------|--------|
| tb_user | 用户表 | 20 |
| tb_product | 商品表 | 51 |
| tb_category | 分类表 | 12 |
| tb_order | 订单表 | 30 |
| tb_order_item | 订单项表 | 45 |
| tb_cart | 购物车表 | 25 |
| tb_review | 评价表 | 23 |
| tb_coupon | 优惠券表 | 10 |
| tb_user_coupon | 用户优惠券表 | 15 |
| tb_price_alert | 价格提醒表 | 15 |
| tb_price_history | 价格历史表 | 29 |
| tb_upload_file | 上传文件表 | - |
| tb_wishlist | 心愿单表 | - |
| tb_consumption_budget | 消费预算表 | - |
| tb_consumption_achievement | 消费成就表 | - |
| addresses | 地址表 | 30 |
| notifications | 通知表 | - |
| music | 背景音乐表 | - |

## 技术栈

### 后端
- Java 17 + Spring Boot 3
- Spring Data JPA
- MySQL 8.0
- Maven

### 前端
- Vue 3 + TypeScript
- Vite
- Element Plus
- Pinia (状态管理)
- Axios (HTTP请求)

## 开发注意事项

### 后端
- 使用常量类代替魔法数字
- Controller层做参数校验
- Service层处理业务逻辑
- 管理员操作需调用 `AdminUtils.requireAdmin()`

### 前端
- 使用 `constants/index.ts` 中的常量
- API调用统一使用 `api/` 目录下的模块
- 状态管理使用 Pinia stores
- 图片URL使用 `fileApi.getImageUrl()` 处理

### 命名规范
- 后端: 驼峰命名 (camelCase)
- 数据库: 下划线命名 (snake_case)
- 前端组件: 大驼峰 (PascalCase)
- CSS类名: 短横线 (kebab-case)
