-- 检查 zhangsan 用户的订单和订单项
-- 执行方式: 在 Navicat 中打开并执行 (UTF-8 编码)

USE shopping_mall;

-- 1. zhangsan 的基本信息
SELECT 
    '用户信息' AS info,
    id,
    username,
    nickname,
    status
FROM tb_user 
WHERE username = 'zhangsan';

-- 2. zhangsan 的所有订单
SELECT 
    '订单列表' AS info,
    o.id AS order_id,
    o.order_no,
    o.total_amount,
    o.order_status,
    o.payment_status,
    o.created_time,
    (SELECT COUNT(*) FROM tb_order_item WHERE order_id = o.id) AS item_count
FROM tb_order o
WHERE o.user_id = 2
ORDER BY o.id;

-- 3. zhangsan 订单的详细商品信息
SELECT 
    '订单商品详情' AS info,
    oi.order_id,
    o.order_no,
    oi.product_id,
    oi.product_name,
    oi.product_price,
    oi.quantity,
    oi.total_price,
    oi.seller_name
FROM tb_order o
JOIN tb_order_item oi ON o.id = oi.order_id
WHERE o.user_id = 2
ORDER BY oi.order_id, oi.id;

-- 4. 统计汇总
SELECT 
    '统计汇总' AS info,
    (SELECT COUNT(*) FROM tb_order WHERE user_id = 2) AS total_orders,
    (SELECT COUNT(DISTINCT oi.order_id) FROM tb_order o JOIN tb_order_item oi ON o.id = oi.order_id WHERE o.user_id = 2) AS orders_with_items,
    (SELECT COUNT(*) FROM tb_order o WHERE o.user_id = 2 AND NOT EXISTS (SELECT 1 FROM tb_order_item oi WHERE oi.order_id = o.id)) AS orders_without_items,
    (SELECT COUNT(*) FROM tb_order o JOIN tb_order_item oi ON o.id = oi.order_id WHERE o.user_id = 2) AS total_items;
