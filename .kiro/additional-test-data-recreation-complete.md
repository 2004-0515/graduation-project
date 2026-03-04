# additional_test_data.sql 重建完成

## 执行状态

✅ **已完成** - `additional_test_data.sql` 文件已从头重新创建

## 关键修复

### 问题根源
原文件中的 ORDER INSERT 语句缺少显式 `id` 字段，导致 MySQL 自动生成 ID，但订单项引用了特定的 order_id (51-120)，造成外键约束失败。

### 修复方案
**所有 70 个订单 (51-120) 现在都包含显式 ID 值**

格式示例：
```sql
-- ✅ 正确格式（包含显式 id）
INSERT INTO tb_order (id, order_no, user_id, total_amount, ...) VALUES
(51, 'ORD202512210051', 14, 399.00, ...),
(52, 'ORD202512220052', 15, 39.90, ...);
```

## 数据内容

### 订单分布 (70个订单)

| 状态 | 订单ID范围 | 数量 | 说明 |
|------|-----------|------|------|
| 已完成 | 51-100 | 50个 | 包含 end_time，ship_status=1 |
| 待收货 | 101-110 | 10个 | 已发货，ship_status=1 |
| 待发货 | 111-115 | 5个 | 已支付，ship_status=0 |
| 待付款 | 116-118 | 3个 | payment_status=0 |
| 已取消 | 119-120 | 2个 | order_status=4 |

### 订单项 (120条)
- 每个订单都有对应的订单项
- 所有订单项都包含 `seller_id` 和 `seller_name`
- 已完成和待收货订单的订单项包含 `ship_time`
- 待发货、待付款、已取消订单的订单项 `ship_status=0`

### 其他数据

| 数据类型 | 数量 | 说明 |
|---------|------|------|
| 评价 | 60条 | 针对订单51-100的评价 |
| 购物车 | 30条 | 分布在用户2-16 |
| 地址 | 30条 | 每个用户1-2个地址 |
| 通知 | 150条 | 系统/促销/订单/商品通知 |
| 用户优惠券 | 40条 | 20个未使用，20个已使用 |
| 降价提醒 | 25条 | 15个监控中，10个已触发 |
| 心愿单 | 20条 | 各状态均有分布 |
| 消费预算 | 10条 | 2026年1月预算 |

## 执行步骤

### 1. 清空数据库（可选）
```sql
-- 在 Navicat 中执行
DELETE FROM tb_review WHERE order_id >= 51;
DELETE FROM tb_order_item WHERE order_id >= 51;
DELETE FROM tb_order WHERE id >= 51;
```

### 2. 执行基础数据
```sql
-- 在 Navicat 中执行（UTF-8 编码）
-- 打开 complete_test_data.sql 并执行
```

### 3. 执行补充数据
```sql
-- 在 Navicat 中执行（UTF-8 编码）
-- 打开 additional_test_data.sql 并执行
```

### 4. 验证数据完整性
```sql
-- 在 Navicat 中执行
-- 打开 data_integrity_summary.sql 并执行
-- 查看"结果2"表格，应该为空（无问题）
```

## 验证清单

执行完成后，检查以下内容：

- [ ] 订单总数：120个 (1-50 来自 complete_test_data.sql, 51-120 来自 additional_test_data.sql)
- [ ] 订单项总数：170+条 (50条来自基础数据，120条来自补充数据)
- [ ] 所有订单项都有 seller_id 和 seller_name
- [ ] 订单51-100都有 end_time
- [ ] 订单101-110都有 shipping_time
- [ ] 订单111-115都有 payment_time
- [ ] 订单116-118的 payment_status=0
- [ ] 订单119-120的 order_status=4
- [ ] 执行 data_integrity_summary.sql，结果2为空

## 快速验证 SQL

```sql
-- 检查订单数量
SELECT COUNT(*) AS total_orders FROM tb_order;  -- 应该是120

-- 检查订单51-120
SELECT COUNT(*) AS additional_orders FROM tb_order WHERE id BETWEEN 51 AND 120;  -- 应该是70

-- 检查订单项外键完整性
SELECT COUNT(*) AS orphan_items 
FROM tb_order_item oi
LEFT JOIN tb_order o ON oi.order_id = o.id
WHERE o.id IS NULL;  -- 应该是0

-- 检查订单项数量
SELECT COUNT(*) AS total_items FROM tb_order_item WHERE order_id >= 51;  -- 应该是120

-- 检查评价数量
SELECT COUNT(*) AS total_reviews FROM tb_review WHERE order_id >= 51;  -- 应该是60

-- 按状态统计订单
SELECT 
    order_status,
    COUNT(*) AS count,
    CASE order_status
        WHEN 0 THEN '待付款'
        WHEN 1 THEN '待发货'
        WHEN 2 THEN '待收货'
        WHEN 3 THEN '已完成'
        WHEN 4 THEN '已取消'
        WHEN 5 THEN '退款中'
        WHEN 6 THEN '申请取消中'
    END AS status_name
FROM tb_order
WHERE id BETWEEN 51 AND 120
GROUP BY order_status
ORDER BY order_status;
```

预期结果：
- order_status=0: 3个（待付款）
- order_status=1: 5个（待发货）
- order_status=2: 10个（待收货）
- order_status=3: 50个（已完成）
- order_status=4: 2个（已取消）

## 注意事项

1. ⚠️ **必须在 Navicat 中执行**（UTF-8 编码）
2. ⚠️ **禁止通过 PowerShell 执行**包含中文的 SQL 文件
3. ⚠️ **执行顺序**：complete_test_data.sql → additional_test_data.sql
4. ⚠️ **执行后必须验证**数据完整性

## 文件对比

### 旧文件问题
```sql
-- ❌ 错误：缺少 id 字段
INSERT INTO tb_order (order_no, user_id, total_amount, ...) VALUES
('ORD202512210051', 14, 399.00, ...);
```

### 新文件修复
```sql
-- ✅ 正确：包含显式 id 字段
INSERT INTO tb_order (id, order_no, user_id, total_amount, ...) VALUES
(51, 'ORD202512210051', 14, 399.00, ...);
```

## 下一步

数据准备完成后，可以：
1. 启动后端服务：`cd backend && mvn spring-boot:run`
2. 启动前端服务：`cd frontend && npm run dev`
3. 测试各种业务流程
4. 准备毕业设计演示

## 问题排查

如果执行后仍然出现错误：

1. **外键约束错误 (1452)**
   - 检查订单ID是否连续（51-120）
   - 检查订单项的 order_id 是否在51-120范围内

2. **编码问题**
   - 确保在 Navicat 中执行
   - 确保文件编码为 UTF-8

3. **数据重复**
   - 先清空相关表的数据
   - 重新执行 SQL 文件

## 总结

`additional_test_data.sql` 文件已完全重建，所有70个订单（51-120）都包含显式ID值，确保与订单项的外键引用完全匹配。文件包含完整的测试数据，涵盖所有订单状态和业务场景。
