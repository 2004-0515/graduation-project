# 数据完整性检查规范

每次修改数据或检查项目时，必须执行以下检查。

## 检查脚本

| 脚本 | 用途 | 说明 |
|------|------|------|
| `data_integrity_check.sql` | 完整检查 | 98条查询，详细检查所有项目 |
| `data_integrity_summary.sql` | 汇总检查 | 只显示有问题的项目，快速定位 |
| `fix_seller.sql` | 修复卖家数据 | 修复商品和订单项的卖家信息 |

**执行方式**: 在 Navicat 中打开并执行 (UTF-8 编码)

**禁止**: 通过 PowerShell/命令行执行包含中文的 SQL 文件

## 快速检查

执行 `data_integrity_summary.sql` 后查看"结果2"：
- 如果表格为空 → 38项检查全部通过
- 如果有数据 → 显示具体问题项目和数量

## 检查项目清单

### 1. 外键引用完整性 (22项)

所有结果应返回 0，否则表示存在孤立数据。

| 检查项 | SQL |
|--------|-----|
| 订单->用户 | `SELECT COUNT(*) FROM tb_order WHERE user_id NOT IN (SELECT id FROM tb_user)` |
| 订单项->订单 | `SELECT COUNT(*) FROM tb_order_item WHERE order_id NOT IN (SELECT id FROM tb_order)` |
| 订单项->商品 | `SELECT COUNT(*) FROM tb_order_item WHERE product_id NOT IN (SELECT id FROM tb_product)` |
| 订单项->卖家 | `SELECT COUNT(*) FROM tb_order_item WHERE seller_id IS NOT NULL AND seller_id NOT IN (SELECT id FROM tb_user)` |
| 购物车->用户 | `SELECT COUNT(*) FROM tb_cart WHERE user_id NOT IN (SELECT id FROM tb_user)` |
| 购物车->商品 | `SELECT COUNT(*) FROM tb_cart WHERE product_id NOT IN (SELECT id FROM tb_product)` |
| 评价->用户 | `SELECT COUNT(*) FROM tb_review WHERE user_id NOT IN (SELECT id FROM tb_user)` |
| 评价->商品 | `SELECT COUNT(*) FROM tb_review WHERE product_id NOT IN (SELECT id FROM tb_product)` |
| 评价->订单 | `SELECT COUNT(*) FROM tb_review WHERE order_id IS NOT NULL AND order_id NOT IN (SELECT id FROM tb_order)` |
| 商品->分类 | `SELECT COUNT(*) FROM tb_product WHERE category_id NOT IN (SELECT id FROM tb_category)` |
| 商品->卖家 | `SELECT COUNT(*) FROM tb_product WHERE seller_id IS NOT NULL AND seller_id NOT IN (SELECT id FROM tb_user)` |
| 用户优惠券->用户 | `SELECT COUNT(*) FROM tb_user_coupon WHERE user_id NOT IN (SELECT id FROM tb_user)` |
| 用户优惠券->优惠券 | `SELECT COUNT(*) FROM tb_user_coupon WHERE coupon_id NOT IN (SELECT id FROM tb_coupon)` |
| 地址->用户 | `SELECT COUNT(*) FROM addresses WHERE user_id NOT IN (SELECT id FROM tb_user)` |
| 价格提醒->用户 | `SELECT COUNT(*) FROM tb_price_alert WHERE user_id NOT IN (SELECT id FROM tb_user)` |
| 价格提醒->商品 | `SELECT COUNT(*) FROM tb_price_alert WHERE product_id NOT IN (SELECT id FROM tb_product)` |
| 价格历史->商品 | `SELECT COUNT(*) FROM tb_price_history WHERE product_id NOT IN (SELECT id FROM tb_product)` |
| 心愿单->用户 | `SELECT COUNT(*) FROM tb_wishlist WHERE user_id NOT IN (SELECT id FROM tb_user)` |
| 心愿单->商品 | `SELECT COUNT(*) FROM tb_wishlist WHERE product_id NOT IN (SELECT id FROM tb_product)` |
| 通知->用户 | `SELECT COUNT(*) FROM notifications WHERE user_id NOT IN (SELECT id FROM tb_user)` |
| 消费预算->用户 | `SELECT COUNT(*) FROM tb_consumption_budget WHERE user_id NOT IN (SELECT id FROM tb_user)` |

### 2. 必填字段 NULL 值检查 (12项)

| 检查项 | SQL |
|--------|-----|
| 商品无卖家 | `SELECT COUNT(*) FROM tb_product WHERE seller_id IS NULL` |
| 商品无分类 | `SELECT COUNT(*) FROM tb_product WHERE category_id IS NULL` |
| 商品无名称 | `SELECT COUNT(*) FROM tb_product WHERE name IS NULL OR name = ''` |
| 商品无价格 | `SELECT COUNT(*) FROM tb_product WHERE price IS NULL` |
| 订单无用户 | `SELECT COUNT(*) FROM tb_order WHERE user_id IS NULL` |
| 订单无订单号 | `SELECT COUNT(*) FROM tb_order WHERE order_no IS NULL OR order_no = ''` |
| 订单无总金额 | `SELECT COUNT(*) FROM tb_order WHERE total_amount IS NULL` |
| 订单项无卖家 | `SELECT COUNT(*) FROM tb_order_item WHERE seller_id IS NULL` |
| 订单项无商品 | `SELECT COUNT(*) FROM tb_order_item WHERE product_id IS NULL` |
| 订单项无数量 | `SELECT COUNT(*) FROM tb_order_item WHERE quantity IS NULL OR quantity <= 0` |
| 用户无用户名 | `SELECT COUNT(*) FROM tb_user WHERE username IS NULL OR username = ''` |
| 用户无密码 | `SELECT COUNT(*) FROM tb_user WHERE password IS NULL OR password = ''` |

### 3. 状态值有效性检查 (12项)

| 检查项 | 有效范围 | SQL |
|--------|----------|-----|
| 订单状态 | 0-6 | `SELECT COUNT(*) FROM tb_order WHERE order_status NOT IN (0,1,2,3,4,5,6)` |
| 支付状态 | 0-2 | `SELECT COUNT(*) FROM tb_order WHERE payment_status NOT IN (0,1,2)` |
| 商品状态 | 0-1 | `SELECT COUNT(*) FROM tb_product WHERE status NOT IN (0,1)` |
| 审核状态 | 0-2 | `SELECT COUNT(*) FROM tb_product WHERE audit_status NOT IN (0,1,2)` |
| 用户状态 | 0-1 | `SELECT COUNT(*) FROM tb_user WHERE status NOT IN (0,1)` |
| 优惠券类型 | 1-3 | `SELECT COUNT(*) FROM tb_coupon WHERE type NOT IN (1,2,3)` |
| 优惠券状态 | 0-1 | `SELECT COUNT(*) FROM tb_coupon WHERE status NOT IN (0,1)` |
| 用户优惠券状态 | 0-2 | `SELECT COUNT(*) FROM tb_user_coupon WHERE status NOT IN (0,1,2)` |
| 价格提醒状态 | 0-2 | `SELECT COUNT(*) FROM tb_price_alert WHERE status NOT IN (0,1,2)` |
| 心愿单状态 | 0-3 | `SELECT COUNT(*) FROM tb_wishlist WHERE status NOT IN (0,1,2,3)` |
| 通知已读状态 | 0-1/TRUE-FALSE | `SELECT COUNT(*) FROM notifications WHERE is_read NOT IN (0,1,TRUE,FALSE)` |
| 发货状态 | 0-1 | `SELECT COUNT(*) FROM tb_order_item WHERE ship_status NOT IN (0,1)` |

### 4. 数据一致性检查 (3项)

| 检查项 | 说明 |
|--------|------|
| 商品卖家名称一致性 | seller_name 必须与 tb_user.username 一致 |
| 订单项卖家与商品卖家一致性 | order_item.seller_id 必须与 product.seller_id 一致 |
| 订单项卖家名称一致性 | order_item.seller_name 必须与 tb_user.username 一致 |

### 5. 业务逻辑一致性检查 (10项)

| 检查项 | 规则 |
|--------|------|
| 已支付订单支付状态 | order_status IN (1,2,3) 时 payment_status 必须为 1 |
| 待付款订单支付状态 | order_status = 0 时 payment_status 必须为 0 |
| 已取消订单发货状态 | order_status = 4 时不应有 ship_status = 0 的订单项 |
| 已完成订单结束时间 | order_status = 3 时 end_time 不能为 NULL |
| 商品库存非负 | stock >= 0 |
| 商品价格正数 | price > 0 |
| 订单金额非负 | total_amount >= 0, pay_amount >= 0 |
| 优惠券折扣值正数 | discount_value > 0 |
| 优惠券最低消费非负 | min_amount >= 0 |
| 评价评分范围 | rating BETWEEN 1 AND 5 |

### 6. 数据范围检查

根据项目规范，数据ID应在合理范围内：

| 数据类型 | 当前范围 | 说明 |
|----------|----------|------|
| 用户ID | 1-20 | 可扩展至 100 |
| 商品ID | 1-51 | 可扩展至 100 |
| 分类ID | 1-12 | 可扩展至 20 |

## 检查时机

1. **新增数据前**: 验证外键引用有效
2. **修改状态后**: 检查状态值有效性
3. **批量更新后**: 执行完整性检查
4. **发现异常时**: 全面检查所有项目
5. **发布前**: 必须执行完整检查

## 修复脚本

### 商品无卖家修复

```sql
-- 按分类分配给不同卖家 (seller_id 2-20)
UPDATE tb_product SET seller_id = (category_id % 19) + 2 WHERE seller_id IS NULL;

-- 同步卖家名称
UPDATE tb_product p 
JOIN tb_user u ON p.seller_id = u.id 
SET p.seller_name = u.username 
WHERE p.seller_name IS NULL OR p.seller_name != u.username;
```

### 订单项无卖家修复

```sql
-- 从商品表同步卖家信息
UPDATE tb_order_item oi 
JOIN tb_product p ON oi.product_id = p.id 
SET oi.seller_id = p.seller_id, oi.seller_name = p.seller_name 
WHERE oi.seller_id IS NULL;
```

### 卖家名称不一致修复

```sql
-- 修复商品卖家名称
UPDATE tb_product p 
JOIN tb_user u ON p.seller_id = u.id 
SET p.seller_name = u.username 
WHERE p.seller_name != u.username;

-- 修复订单项卖家名称
UPDATE tb_order_item oi 
JOIN tb_user u ON oi.seller_id = u.id 
SET oi.seller_name = u.username 
WHERE oi.seller_name != u.username;
```

## 完整修复脚本

位于: `fix_seller.sql`

**执行方式**: 在 Navicat 中打开并执行 (UTF-8 编码)

## 验证通过标准

所有检查项的问题数量必须为 **0**，数据完整性验证才算通过。
