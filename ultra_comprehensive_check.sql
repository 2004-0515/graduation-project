-- ============================================
-- 超级全面数据完整性检查
-- 检查所有表的数据质量和一致性
-- 执行方式: 在 Navicat 中打开并执行 (UTF-8 编码)
-- ============================================

USE shopping_mall;

-- ============================================
-- 第一部分：基础数据统计
-- ============================================
SELECT '=== 基础数据统计 ===' AS section;

SELECT 
    'tb_user' AS table_name,
    COUNT(*) AS total_records,
    COUNT(DISTINCT id) AS unique_ids,
    SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) AS active_count,
    SUM(CASE WHEN status = 0 THEN 1 ELSE 0 END) AS inactive_count
FROM tb_user
UNION ALL
SELECT 
    'tb_category',
    COUNT(*),
    COUNT(DISTINCT id),
    SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END),
    SUM(CASE WHEN status = 0 THEN 1 ELSE 0 END)
FROM tb_category
UNION ALL
SELECT 
    'tb_product',
    COUNT(*),
    COUNT(DISTINCT id),
    SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END),
    SUM(CASE WHEN status = 0 THEN 1 ELSE 0 END)
FROM tb_product
UNION ALL
SELECT 
    'tb_order',
    COUNT(*),
    COUNT(DISTINCT id),
    NULL,
    NULL
FROM tb_order
UNION ALL
SELECT 
    'tb_order_item',
    COUNT(*),
    COUNT(DISTINCT id),
    NULL,
    NULL
FROM tb_order_item
UNION ALL
SELECT 
    'tb_cart',
    COUNT(*),
    COUNT(DISTINCT id),
    NULL,
    NULL
FROM tb_cart
UNION ALL
SELECT 
    'tb_review',
    COUNT(*),
    COUNT(DISTINCT id),
    NULL,
    NULL
FROM tb_review
UNION ALL
SELECT 
    'tb_coupon',
    COUNT(*),
    COUNT(DISTINCT id),
    SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END),
    SUM(CASE WHEN status = 0 THEN 1 ELSE 0 END)
FROM tb_coupon
UNION ALL
SELECT 
    'tb_user_coupon',
    COUNT(*),
    COUNT(DISTINCT id),
    NULL,
    NULL
FROM tb_user_coupon
UNION ALL
SELECT 
    'tb_price_alert',
    COUNT(*),
    COUNT(DISTINCT id),
    NULL,
    NULL
FROM tb_price_alert
UNION ALL
SELECT 
    'tb_price_history',
    COUNT(*),
    COUNT(DISTINCT id),
    NULL,
    NULL
FROM tb_price_history
UNION ALL
SELECT 
    'tb_wishlist',
    COUNT(*),
    COUNT(DISTINCT id),
    NULL,
    NULL
FROM tb_wishlist
UNION ALL
SELECT 
    'tb_consumption_budget',
    COUNT(*),
    COUNT(DISTINCT id),
    NULL,
    NULL
FROM tb_consumption_budget
UNION ALL
SELECT 
    'tb_consumption_achievement',
    COUNT(*),
    COUNT(DISTINCT id),
    NULL,
    NULL
FROM tb_consumption_achievement
UNION ALL
SELECT 
    'addresses',
    COUNT(*),
    COUNT(DISTINCT id),
    NULL,
    NULL
FROM addresses
UNION ALL
SELECT 
    'notifications',
    COUNT(*),
    COUNT(DISTINCT id),
    NULL,
    NULL
FROM notifications;

-- ============================================
-- 第二部分：用户表检查
-- ============================================
SELECT '=== 用户表检查 ===' AS section;

-- 用户数据完整性
SELECT 
    '用户缺少必填字段' AS issue,
    COUNT(*) AS problem_count
FROM tb_user
WHERE username IS NULL OR username = ''
   OR password IS NULL OR password = '';

-- 用户状态异常
SELECT 
    '用户状态值异常' AS issue,
    COUNT(*) AS problem_count
FROM tb_user
WHERE status NOT IN (0, 1);

-- 用户ID范围统计
SELECT 
    '用户ID范围' AS info,
    MIN(id) AS min_id,
    MAX(id) AS max_id,
    COUNT(*) AS total_users
FROM tb_user;

-- ============================================
-- 第三部分：商品表检查
-- ============================================
SELECT '=== 商品表检查 ===' AS section;

-- 商品缺少必填字段
SELECT 
    '商品缺少必填字段' AS issue,
    COUNT(*) AS problem_count
FROM tb_product
WHERE name IS NULL OR name = ''
   OR price IS NULL OR price <= 0
   OR category_id IS NULL
   OR seller_id IS NULL;

-- 商品状态异常
SELECT 
    '商品状态异常' AS issue,
    COUNT(*) AS problem_count
FROM tb_product
WHERE status NOT IN (0, 1)
   OR audit_status NOT IN (0, 1, 2);

-- 商品外键引用检查
SELECT 
    '商品分类不存在' AS issue,
    COUNT(*) AS problem_count
FROM tb_product
WHERE category_id NOT IN (SELECT id FROM tb_category);

SELECT 
    '商品卖家不存在' AS issue,
    COUNT(*) AS problem_count
FROM tb_product
WHERE seller_id NOT IN (SELECT id FROM tb_user);

-- 商品卖家名称一致性
SELECT 
    '商品卖家名称不一致' AS issue,
    COUNT(*) AS problem_count
FROM tb_product p
LEFT JOIN tb_user u ON p.seller_id = u.id
WHERE p.seller_name != u.username;

-- 商品价格异常
SELECT 
    '商品价格异常' AS issue,
    COUNT(*) AS problem_count
FROM tb_product
WHERE price > original_price
   OR price <= 0
   OR original_price <= 0;

-- 商品库存异常
SELECT 
    '商品库存为负' AS issue,
    COUNT(*) AS problem_count
FROM tb_product
WHERE stock < 0;

-- 按分类统计商品
SELECT 
    '按分类统计商品' AS info,
    c.name AS category_name,
    COUNT(p.id) AS product_count
FROM tb_category c
LEFT JOIN tb_product p ON c.id = p.category_id
GROUP BY c.id, c.name
ORDER BY c.id;

-- ============================================
-- 第四部分：订单表检查
-- ============================================
SELECT '=== 订单表检查 ===' AS section;

-- 订单缺少必填字段
SELECT 
    '订单缺少必填字段' AS issue,
    COUNT(*) AS problem_count
FROM tb_order
WHERE order_no IS NULL OR order_no = ''
   OR user_id IS NULL
   OR total_amount IS NULL;

-- 订单状态异常
SELECT 
    '订单状态异常' AS issue,
    COUNT(*) AS problem_count
FROM tb_order
WHERE order_status NOT IN (0, 1, 2, 3, 4, 5, 6)
   OR payment_status NOT IN (0, 1, 2);

-- 订单用户不存在
SELECT 
    '订单用户不存在' AS issue,
    COUNT(*) AS problem_count
FROM tb_order
WHERE user_id NOT IN (SELECT id FROM tb_user);

-- 订单没有订单项
SELECT 
    '订单没有订单项' AS issue,
    COUNT(*) AS problem_count
FROM tb_order o
WHERE NOT EXISTS (SELECT 1 FROM tb_order_item oi WHERE oi.order_id = o.id);

-- 订单金额一致性
SELECT 
    '订单金额与订单项不一致' AS issue,
    COUNT(*) AS problem_count
FROM tb_order o
WHERE EXISTS (SELECT 1 FROM tb_order_item oi WHERE oi.order_id = o.id)
AND ABS(o.total_amount - (
    SELECT COALESCE(SUM(oi.total_price), 0)
    FROM tb_order_item oi
    WHERE oi.order_id = o.id
)) > 0.01;

-- 订单业务逻辑一致性
SELECT 
    '已支付订单但支付状态未更新' AS issue,
    COUNT(*) AS problem_count
FROM tb_order
WHERE order_status IN (1, 2, 3) AND payment_status != 1;

SELECT 
    '待付款订单但支付状态已支付' AS issue,
    COUNT(*) AS problem_count
FROM tb_order
WHERE order_status = 0 AND payment_status = 1;

SELECT 
    '已完成订单缺少结束时间' AS issue,
    COUNT(*) AS problem_count
FROM tb_order
WHERE order_status = 3 AND end_time IS NULL;

-- 按状态统计订单
SELECT 
    '按状态统计订单' AS info,
    order_status,
    CASE order_status
        WHEN 0 THEN '待付款'
        WHEN 1 THEN '待发货'
        WHEN 2 THEN '待收货'
        WHEN 3 THEN '已完成'
        WHEN 4 THEN '已取消'
        WHEN 5 THEN '退款中'
        WHEN 6 THEN '申请取消中'
        ELSE '未知'
    END AS status_name,
    COUNT(*) AS count
FROM tb_order
GROUP BY order_status
ORDER BY order_status;

-- ============================================
-- 第五部分：订单项表检查
-- ============================================
SELECT '=== 订单项表检查 ===' AS section;

-- 订单项缺少必填字段
SELECT 
    '订单项缺少必填字段' AS issue,
    COUNT(*) AS problem_count
FROM tb_order_item
WHERE order_id IS NULL
   OR product_id IS NULL
   OR product_name IS NULL OR product_name = ''
   OR product_price IS NULL
   OR quantity IS NULL OR quantity <= 0
   OR total_price IS NULL
   OR seller_id IS NULL;

-- 订单项外键引用检查
SELECT 
    '订单项订单不存在' AS issue,
    COUNT(*) AS problem_count
FROM tb_order_item
WHERE order_id NOT IN (SELECT id FROM tb_order);

SELECT 
    '订单项商品不存在' AS issue,
    COUNT(*) AS problem_count
FROM tb_order_item
WHERE product_id NOT IN (SELECT id FROM tb_product);

SELECT 
    '订单项卖家不存在' AS issue,
    COUNT(*) AS problem_count
FROM tb_order_item
WHERE seller_id NOT IN (SELECT id FROM tb_user);

-- 订单项卖家一致性
SELECT 
    '订单项卖家与商品卖家不一致' AS issue,
    COUNT(*) AS problem_count
FROM tb_order_item oi
JOIN tb_product p ON oi.product_id = p.id
WHERE oi.seller_id != p.seller_id;

SELECT 
    '订单项卖家名称不一致' AS issue,
    COUNT(*) AS problem_count
FROM tb_order_item oi
LEFT JOIN tb_user u ON oi.seller_id = u.id
WHERE oi.seller_name != u.username;

-- 订单项金额计算
SELECT 
    '订单项总价计算错误' AS issue,
    COUNT(*) AS problem_count
FROM tb_order_item
WHERE ABS(total_price - (product_price * quantity)) > 0.01;

-- 订单项发货状态异常
SELECT 
    '订单项发货状态异常' AS issue,
    COUNT(*) AS problem_count
FROM tb_order_item
WHERE ship_status NOT IN (0, 1);

-- ============================================
-- 第六部分：购物车表检查
-- ============================================
SELECT '=== 购物车表检查 ===' AS section;

-- 购物车外键引用
SELECT 
    '购物车用户不存在' AS issue,
    COUNT(*) AS problem_count
FROM tb_cart
WHERE user_id NOT IN (SELECT id FROM tb_user);

SELECT 
    '购物车商品不存在' AS issue,
    COUNT(*) AS problem_count
FROM tb_cart
WHERE product_id NOT IN (SELECT id FROM tb_product);

-- 购物车数量异常
SELECT 
    '购物车数量异常' AS issue,
    COUNT(*) AS problem_count
FROM tb_cart
WHERE quantity IS NULL OR quantity <= 0;

-- 购物车重复项
SELECT 
    '购物车重复项' AS issue,
    COUNT(*) AS problem_count
FROM (
    SELECT user_id, product_id, COUNT(*) as cnt
    FROM tb_cart
    GROUP BY user_id, product_id
    HAVING cnt > 1
) AS duplicates;

-- ============================================
-- 第七部分：评价表检查
-- ============================================
SELECT '=== 评价表检查 ===' AS section;

-- 评价外键引用
SELECT 
    '评价用户不存在' AS issue,
    COUNT(*) AS problem_count
FROM tb_review
WHERE user_id NOT IN (SELECT id FROM tb_user);

SELECT 
    '评价商品不存在' AS issue,
    COUNT(*) AS problem_count
FROM tb_review
WHERE product_id NOT IN (SELECT id FROM tb_product);

SELECT 
    '评价订单不存在' AS issue,
    COUNT(*) AS problem_count
FROM tb_review
WHERE order_id IS NOT NULL 
  AND order_id NOT IN (SELECT id FROM tb_order);

-- 评价评分异常
SELECT 
    '评价评分超出范围' AS issue,
    COUNT(*) AS problem_count
FROM tb_review
WHERE rating < 1 OR rating > 5;

-- ============================================
-- 第八部分：优惠券表检查
-- ============================================
SELECT '=== 优惠券表检查 ===' AS section;

-- 优惠券类型和状态异常
SELECT 
    '优惠券类型异常' AS issue,
    COUNT(*) AS problem_count
FROM tb_coupon
WHERE type NOT IN (1, 2, 3);

SELECT 
    '优惠券状态异常' AS issue,
    COUNT(*) AS problem_count
FROM tb_coupon
WHERE status NOT IN (0, 1);

-- 优惠券金额异常
SELECT 
    '优惠券折扣值异常' AS issue,
    COUNT(*) AS problem_count
FROM tb_coupon
WHERE (type = 1 AND (discount_amount IS NULL OR discount_amount <= 0))  -- 满减券
   OR (type = 2 AND (discount_rate IS NULL OR discount_rate <= 0 OR discount_rate >= 1))  -- 折扣券
   OR (type = 3 AND (discount_amount IS NULL OR discount_amount <= 0));  -- 无门槛券

SELECT 
    '优惠券最低消费异常' AS issue,
    COUNT(*) AS problem_count
FROM tb_coupon
WHERE min_amount < 0;

-- 优惠券时间异常
SELECT 
    '优惠券时间异常' AS issue,
    COUNT(*) AS problem_count
FROM tb_coupon
WHERE start_time >= end_time;

-- ============================================
-- 第九部分：用户优惠券表检查
-- ============================================
SELECT '=== 用户优惠券表检查 ===' AS section;

-- 用户优惠券外键引用
SELECT 
    '用户优惠券用户不存在' AS issue,
    COUNT(*) AS problem_count
FROM tb_user_coupon
WHERE user_id NOT IN (SELECT id FROM tb_user);

SELECT 
    '用户优惠券优惠券不存在' AS issue,
    COUNT(*) AS problem_count
FROM tb_user_coupon
WHERE coupon_id NOT IN (SELECT id FROM tb_coupon);

-- 用户优惠券状态异常
SELECT 
    '用户优惠券状态异常' AS issue,
    COUNT(*) AS problem_count
FROM tb_user_coupon
WHERE status NOT IN (0, 1, 2);

-- ============================================
-- 第十部分：价格相关表检查
-- ============================================
SELECT '=== 价格相关表检查 ===' AS section;

-- 价格提醒外键引用
SELECT 
    '价格提醒用户不存在' AS issue,
    COUNT(*) AS problem_count
FROM tb_price_alert
WHERE user_id NOT IN (SELECT id FROM tb_user);

SELECT 
    '价格提醒商品不存在' AS issue,
    COUNT(*) AS problem_count
FROM tb_price_alert
WHERE product_id NOT IN (SELECT id FROM tb_product);

-- 价格提醒状态异常
SELECT 
    '价格提醒状态异常' AS issue,
    COUNT(*) AS problem_count
FROM tb_price_alert
WHERE status NOT IN (0, 1, 2);

-- 价格历史商品不存在
SELECT 
    '价格历史商品不存在' AS issue,
    COUNT(*) AS problem_count
FROM tb_price_history
WHERE product_id NOT IN (SELECT id FROM tb_product);

-- ============================================
-- 第十一部分：理性消费相关表检查
-- ============================================
SELECT '=== 理性消费相关表检查 ===' AS section;

-- 心愿单外键引用
SELECT 
    '心愿单用户不存在' AS issue,
    COUNT(*) AS problem_count
FROM tb_wishlist
WHERE user_id NOT IN (SELECT id FROM tb_user);

SELECT 
    '心愿单商品不存在' AS issue,
    COUNT(*) AS problem_count
FROM tb_wishlist
WHERE product_id NOT IN (SELECT id FROM tb_product);

-- 心愿单状态异常
SELECT 
    '心愿单状态异常' AS issue,
    COUNT(*) AS problem_count
FROM tb_wishlist
WHERE status NOT IN (0, 1, 2, 3);

-- 消费预算用户不存在
SELECT 
    '消费预算用户不存在' AS issue,
    COUNT(*) AS problem_count
FROM tb_consumption_budget
WHERE user_id NOT IN (SELECT id FROM tb_user);

-- ============================================
-- 第十二部分：地址和通知表检查
-- ============================================
SELECT '=== 地址和通知表检查 ===' AS section;

-- 地址用户不存在
SELECT 
    '地址用户不存在' AS issue,
    COUNT(*) AS problem_count
FROM addresses
WHERE user_id NOT IN (SELECT id FROM tb_user);

-- 通知用户不存在
SELECT 
    '通知用户不存在' AS issue,
    COUNT(*) AS problem_count
FROM notifications
WHERE user_id NOT IN (SELECT id FROM tb_user);

-- 通知状态异常
SELECT 
    '通知已读状态异常' AS issue,
    COUNT(*) AS problem_count
FROM notifications
WHERE is_read NOT IN (0, 1, TRUE, FALSE);

-- ============================================
-- 第十三部分：数据范围检查
-- ============================================
SELECT '=== 数据范围检查 ===' AS section;

-- 用户ID范围
SELECT 
    '用户ID超出预期范围' AS issue,
    COUNT(*) AS problem_count
FROM tb_user
WHERE id < 1 OR id > 100;

-- 商品ID范围
SELECT 
    '商品ID超出预期范围' AS issue,
    COUNT(*) AS problem_count
FROM tb_product
WHERE id < 1 OR id > 100;

-- 分类ID范围
SELECT 
    '分类ID超出预期范围' AS issue,
    COUNT(*) AS problem_count
FROM tb_category
WHERE id < 1 OR id > 20;

-- ============================================
-- 第十四部分：最终汇总报告
-- ============================================
SELECT '=== 最终汇总报告 ===' AS section;

SELECT 
    '总检查项数' AS metric,
    60 AS value
UNION ALL
SELECT 
    '数据表总数',
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'shopping_mall' 
     AND table_type = 'BASE TABLE')
UNION ALL
SELECT 
    '总记录数',
    (SELECT SUM(table_rows) FROM information_schema.tables 
     WHERE table_schema = 'shopping_mall' 
     AND table_type = 'BASE TABLE');

-- 显示完成信息
SELECT '✅ 检查完成！如果所有 problem_count 都是 0，说明数据完全正常！' AS final_message;
