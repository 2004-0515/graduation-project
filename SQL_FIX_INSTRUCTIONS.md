# SQL文件修复说明

## 问题原因

`complete_test_data.sql` 和 `additional_test_data.sql` 中的 ORDER INSERT 语句缺少显式的 `id` 字段，导致MySQL自动生成ID，但 `additional_test_data.sql` 中的订单项（order_item）引用了特定的 order_id (51-120)，造成外键约束失败。

## 修复状态

### ✅ 已完成
- `complete_test_data.sql`: 订单1-50已全部添加显式ID

### ⚠️ 需要手动修复
- `additional_test_data.sql`: 订单51-120需要添加显式ID

## 手动修复步骤

由于 `additional_test_data.sql` 文件较大且包含中文，建议在Navicat中手动修复：

### 方法1: 使用查找替换（推荐）

1. 在Navicat中打开 `additional_test_data.sql`
2. 使用查找替换功能（Ctrl+H）：

**替换1 - 修复第一批已完成订单 (51-70)**
```
查找: INSERT INTO tb_order (order_no, user_id, total_amount, pay_amount, payment_method, payment_status, order_status, shipping_address, payment_time, shipping_time, end_time, created_time, updated_time) VALUES
替换为: INSERT INTO tb_order (id, order_no, user_id, total_amount, pay_amount, payment_method, payment_status, order_status, shipping_address, payment_time, shipping_time, end_time, created_time, updated_time) VALUES
```

**替换2 - 修复第二批已完成订单 (71-100)**
```
查找: -- 继续补充已完成订单 (再30个)
INSERT INTO tb_order (order_no,
替换为: -- 继续补充已完成订单 (再30个)
INSERT INTO tb_order (id, order_no,
```

**替换3 - 修复待收货订单 (101-110)**
```
查找: -- 待收货订单 (10个)
INSERT INTO tb_order (order_no,
替换为: -- 待收货订单 (10个)
INSERT INTO tb_order (id, order_no,
```

**替换4 - 修复待发货订单 (111-115)**
```
查找: -- 待发货订单 (5个)
INSERT INTO tb_order (order_no,
替换为: -- 待发货订单 (5个)
INSERT INTO tb_order (id, order_no,
```

**替换5 - 修复待付款订单 (116-118)**
```
查找: -- 待付款订单 (3个)
INSERT INTO tb_order (order_no,
替换为: -- 待付款订单 (3个)
INSERT INTO tb_order (id, order_no,
```

**替换6 - 修复已取消订单 (119-120)**
```
查找: -- 已取消订单 (2个)
INSERT INTO tb_order (order_no,
替换为: -- 已取消订单 (2个)
INSERT INTO tb_order (id, order_no,
```

3. 然后逐个添加ID值到每条记录：

```sql
-- 示例：将
('ORD202512210051', 14, 399.00, ...
-- 改为
(51, 'ORD202512210051', 14, 399.00, ...

-- 订单51-70
(51, 'ORD202512210051', ...
(52, 'ORD202512220052', ...
...
(70, 'ORD202601090070', ...

-- 订单71-100
(71, 'ORD202601100071', ...
...
(100, 'ORD202601120100', ...

-- 订单101-110 (待收货)
(101, 'ORD202601280101', ...
...
(110, 'ORD202602060110', ...

-- 订单111-115 (待发货)
(111, 'ORD202602070111', ...
...
(115, 'ORD202602110115', ...

-- 订单116-118 (待付款)
(116, 'ORD202602120116', ...
(117, 'ORD202602130117', ...
(118, 'ORD202602140118', ...

-- 订单119-120 (已取消)
(119, 'ORD202602150119', ...
(120, 'ORD202602160120', ...
```

### 方法2: 使用正则表达式（高级）

如果你熟悉正则表达式，可以使用支持正则的编辑器（如VS Code）：

```regex
查找: \('(ORD\d+(\d{4}))',
替换为: ($2, '$1',
```

这会自动提取订单号末尾4位数字作为ID。

## 执行顺序

修复完成后，按以下顺序执行：

1. **清空数据库**（重要！）
   ```sql
   DELETE FROM tb_order_item;
   DELETE FROM tb_order;
   ALTER TABLE tb_order AUTO_INCREMENT = 1;
   ```

2. **执行 `complete_test_data.sql`**
   - 在Navicat中打开并执行
   - 确认插入50条订单记录

3. **执行 `additional_test_data.sql`**
   - 在Navicat中打开并执行
   - 确认插入70条订单记录和200+条订单项记录

4. **验证数据**
   ```sql
   -- 检查订单数量
   SELECT COUNT(*) FROM tb_order;  -- 应该是120
   
   -- 检查订单项数量
   SELECT COUNT(*) FROM tb_order_item;  -- 应该是200+
   
   -- 检查外键完整性
   SELECT COUNT(*) FROM tb_order_item oi
   WHERE oi.order_id NOT IN (SELECT id FROM tb_order);  -- 应该是0
   ```

## 注意事项

1. ⚠️ **禁止通过PowerShell执行包含中文的SQL文件**（会导致编码损坏）
2. ✅ **必须在Navicat中手动执行**（UTF-8编码）
3. 📝 修复前建议备份原文件
4. 🔍 修复后务必执行验证SQL确认数据正确

## 快速验证

执行以下SQL检查是否修复成功：

```sql
-- 检查订单1-50
SELECT COUNT(*) FROM tb_order WHERE id BETWEEN 1 AND 50;  -- 应该是50

-- 检查订单51-120
SELECT COUNT(*) FROM tb_order WHERE id BETWEEN 51 AND 120;  -- 应该是70

-- 检查订单项外键
SELECT COUNT(*) FROM tb_order_item oi
LEFT JOIN tb_order o ON oi.order_id = o.id
WHERE o.id IS NULL;  -- 应该是0（无孤立订单项）
```

## 如果仍然报错

如果执行后仍然出现外键错误，请：

1. 截图错误信息
2. 执行 `verify_orders.sql` 查看订单分布
3. 检查是否有订单ID重复或缺失
