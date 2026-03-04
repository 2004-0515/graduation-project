-- ============================================
-- 修复商品卖家名称不一致问题
-- 执行方式: 在 Navicat 中打开并执行 (UTF-8 编码)
-- ============================================

USE shopping_mall;

-- 显示当前问题
SELECT '修复前 - 商品卖家名称不一致' AS status, COUNT(*) AS problem_count
FROM tb_product p
LEFT JOIN tb_user u ON p.seller_id = u.id
WHERE p.seller_name != u.username;

-- 修复商品表的卖家名称
UPDATE tb_product p
JOIN tb_user u ON p.seller_id = u.id
SET p.seller_name = u.username
WHERE p.seller_name IS NULL OR p.seller_name != u.username;

-- 显示修复结果
SELECT '修复后 - 商品卖家名称不一致' AS status, COUNT(*) AS problem_count
FROM tb_product p
LEFT JOIN tb_user u ON p.seller_id = u.id
WHERE p.seller_name != u.username;

-- 同时检查订单项的卖家名称
SELECT '订单项卖家名称不一致' AS status, COUNT(*) AS problem_count
FROM tb_order_item oi
LEFT JOIN tb_user u ON oi.seller_id = u.id
WHERE oi.seller_name != u.username;

-- 如果订单项也有问题，一并修复
UPDATE tb_order_item oi
JOIN tb_user u ON oi.seller_id = u.id
SET oi.seller_name = u.username
WHERE oi.seller_name IS NULL OR oi.seller_name != u.username;

-- 最终验证
SELECT '最终验证 - 商品卖家名称' AS check_item, COUNT(*) AS problem_count
FROM tb_product p
LEFT JOIN tb_user u ON p.seller_id = u.id
WHERE p.seller_name != u.username
UNION ALL
SELECT '最终验证 - 订单项卖家名称', COUNT(*)
FROM tb_order_item oi
LEFT JOIN tb_user u ON oi.seller_id = u.id
WHERE oi.seller_name != u.username;

SELECT '✅ 修复完成！' AS message;
