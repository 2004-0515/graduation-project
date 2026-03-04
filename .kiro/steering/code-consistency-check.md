# 代码一致性检查规范

## 前后端常量同步检查

每次修改状态码或枚举值时，必须检查以下文件是否同步：

### 检查清单

| 检查项 | 后端位置 | 前端位置 |
|--------|----------|----------|
| 订单状态 | `OrderConstants.OrderStatus` | `constants/index.ts` ORDER_STATUS |
| 支付状态 | `OrderConstants.PaymentStatus` | `constants/index.ts` PAYMENT_STATUS |
| 支付方式 | `OrderConstants.PaymentMethod` | `constants/index.ts` PAYMENT_METHOD |
| 商品状态 | `AuditConstants.ProductStatus` | `constants/index.ts` PRODUCT_STATUS |
| 审核状态 | `AuditConstants.AuditStatus` | `constants/index.ts` AUDIT_STATUS |
| 用户状态 | `AuditConstants.UserStatus` | `constants/index.ts` USER_STATUS |
| 优惠券类型 | `CouponConstants.CouponType` | `constants/index.ts` COUPON_TYPE |
| 优惠券状态 | `CouponConstants.CouponStatus` | `constants/index.ts` COUPON_STATUS |
| 用户优惠券状态 | `CouponConstants.UserCouponStatus` | `constants/index.ts` USER_COUPON_STATUS |
| 价格提醒状态 | `PriceAlertConstants.AlertStatus` | `constants/index.ts` PRICE_ALERT_STATUS |
| 通知类型 | `NotificationConstants.NotificationType` | `constants/index.ts` NOTIFICATION_TYPE |
| 通知状态 | `NotificationConstants.NotificationStatus` | `constants/index.ts` NOTIFICATION_STATUS |
| 文件类型 | `NotificationConstants.FileType` | `constants/index.ts` FILE_TYPE |
| 文件审核状态 | `NotificationConstants.FileReviewStatus` | `constants/index.ts` FILE_REVIEW_STATUS |
| 心愿单状态 | `WishlistConstants.WishlistStatus` | `constants/index.ts` WISHLIST_STATUS |
| 发货状态 | - | `constants/index.ts` SHIP_STATUS |

### TypeScript 类型定义检查

`frontend/src/types/index.ts` 中的枚举必须与常量保持一致：

```typescript
// 必须包含所有状态
export enum OrderStatus {
  PENDING_PAYMENT = 0,
  PENDING_SHIPMENT = 1,
  PENDING_RECEIPT = 2,
  COMPLETED = 3,
  CANCELLED = 4,
  REFUNDING = 5,        // 容易遗漏
  CANCEL_REQUESTED = 6  // 容易遗漏
}
```

## 硬编码检查

### 禁止在组件中硬编码状态映射

❌ 错误做法：
```typescript
const getStatusText = (status: number) => {
  const map = { 0: '待付款', 1: '待发货', ... }
  return map[status] || '未知'
}
```

✅ 正确做法：
```typescript
import { ORDER_STATUS_MAP } from '@/constants'

const getStatusText = (status: number) => {
  return ORDER_STATUS_MAP[status] || '未知'
}
```

### 需要检查的文件模式

搜索以下模式找出硬编码：
```
grep -r "getStatusText\|statusText" frontend/src/views/
grep -r "status\s*===?\s*\d" frontend/src/views/
```

## 测试文件同步检查

后端测试文件必须覆盖所有状态值：

### OrderConstantsTest.java 必须测试

- 所有 7 种订单状态 (0-6) 的名称映射
- canCancel() 对所有状态的判断
- canRequestCancel() 对所有状态的判断
- canConfirm() 对所有状态的判断
- canDelete() 对所有状态的判断

## 常见遗漏场景

### 1. 新增状态后遗漏更新

当新增状态（如退款中=5）时，容易遗漏：
- [ ] 后端常量类
- [ ] 前端常量文件
- [ ] 前端类型定义 (types/index.ts)
- [ ] 各组件中的 getStatusText 函数
- [ ] 下拉筛选框选项
- [ ] 测试文件

### 2. 业务逻辑不一致

- canCancel(1) 应返回 false（待发货需申请取消）
- canRequestCancel(1) 应返回 true（待发货可申请取消）

### 3. 状态显示为"未知"

原因：数据库中存在未映射的状态值
解决：检查数据库数据，确保状态值在有效范围内

## 自动化检查建议

### 1. 添加编译时检查

在前端添加类型守卫：
```typescript
function assertNever(x: never): never {
  throw new Error("Unexpected status: " + x);
}
```

### 2. 添加运行时日志

当遇到未知状态时记录日志：
```typescript
const getStatusText = (status: number) => {
  const text = ORDER_STATUS_MAP[status]
  if (!text) {
    console.warn(`Unknown order status: ${status}`)
  }
  return text || '未知'
}
```

### 3. 数据库约束

添加 CHECK 约束限制状态值范围：
```sql
ALTER TABLE tb_order ADD CONSTRAINT chk_order_status 
  CHECK (order_status IN (0,1,2,3,4,5,6));
```

## 检查时机

1. **新增/修改状态码时**: 执行完整同步检查
2. **代码审查时**: 检查是否有硬编码
3. **发现"未知"显示时**: 检查数据库和映射
4. **测试失败时**: 检查测试是否覆盖所有状态
