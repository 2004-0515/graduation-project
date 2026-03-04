-- 全面数据完整性检查和修复

-- ============================================
-- 第一部分：检查所有没有订单项的订单
-- ============================================
SELECT 
    '没有订单项的订单' AS issue_type,
    COUNT(*) AS problem_count
FROM tb_order o
WHERE NOT EXISTS (
    SELECT 1 FROM tb_order_item oi WHERE oi.order_id = o.id
);

-- 详细列出所有没有订单项的订单
SELECT 
    o.id AS order_id,
    o.order_no,
    o.user_id,
    u.username,
    o.total_amount,
    o.order_status,
    o.created_time
FROM tb_order o
LEFT JOIN tb_user u ON o.user_id = u.id
WHERE NOT EXISTS (
    SELECT 1 FROM tb_order_item oi WHERE oi.order_id = o.id
)
ORDER BY o.id;

-- ============================================
-- 第二部分：检查订单项数据完整性
-- ============================================

-- 检查订单项缺少商品信息
SELECT 
    '订单项缺少商品信息' AS issue_type,
    COUNT(*) AS problem_count
FROM tb_order_item oi
WHERE oi.product_name IS NULL 
   OR oi.product_name = ''
   OR oi.product_price IS NULL
   OR oi.quantity IS NULL
   OR oi.total_price IS NULL;

-- 检查订单项缺少卖家信息
SELECT 
    '订单项缺少卖家信息' AS issue_type,
    COUNT(*) AS problem_count
FROM tb_order_item oi
WHERE oi.seller_id IS NULL 
   OR oi.seller_name IS NULL
   OR oi.seller_name = '';

-- ============================================
-- 第三部分：检查订单金额一致性
-- ============================================

-- 检查订单总金额与订单项总和不一致
SELECT 
    '订单金额不一致' AS issue_type,
    COUNT(*) AS problem_count
FROM tb_order o
WHERE EXISTS (SELECT 1 FROM tb_order_item oi WHERE oi.order_id = o.id)
AND ABS(o.total_amount - (
    SELECT COALESCE(SUM(oi.total_price), 0)
    FROM tb_order_item oi
    WHERE oi.order_id = o.id
)) > 0.01;

-- 详细列出金额不一致的订单
SELECT 
    o.id,
    o.order_no,
    o.total_amount AS order_total,
    (SELECT COALESCE(SUM(oi.total_price), 0) FROM tb_order_item oi WHERE oi.order_id = o.id) AS items_total,
    ABS(o.total_amount - (SELECT COALESCE(SUM(oi.total_price), 0) FROM tb_order_item oi WHERE oi.order_id = o.id)) AS difference
FROM tb_order o
WHERE EXISTS (SELECT 1 FROM tb_order_item oi WHERE oi.order_id = o.id)
AND ABS(o.total_amount - (
    SELECT COALESCE(SUM(oi.total_price), 0)
    FROM tb_order_item oi
    WHERE oi.order_id = o.id
)) > 0.01
ORDER BY difference DESC;

-- ============================================
-- 第四部分：统计汇总
-- ============================================
SELECT 
    '总订单数' AS metric,
    COUNT(*) AS count
FROM tb_order
UNION ALL
SELECT 
    '有订单项的订单数',
    COUNT(DISTINCT oi.order_id)
FROM tb_order_item oi
UNION ALL
SELECT 
    '没有订单项的订单数',
    COUNT(*)
FROM tb_order o
WHERE NOT EXISTS (SELECT 1 FROM tb_order_item oi WHERE oi.order_id = o.id)
UNION ALL
SELECT 
    '总订单项数',
    COUNT(*)
FROM tb_order_item;
