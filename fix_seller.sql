-- 修复商品卖家数据
-- 将 seller_id 为 NULL 的商品分配给真实用户
-- 按分类分配给不同的卖家，模拟真实电商场景

USE shopping_mall;

-- 数码产品 (category_id = 1) - 分配给 张三(2)、李四(3)
UPDATE tb_product SET seller_id = 2 WHERE category_id = 1 AND seller_id IS NULL AND id % 2 = 1;
UPDATE tb_product SET seller_id = 3 WHERE category_id = 1 AND seller_id IS NULL AND id % 2 = 0;

-- 电脑办公 (category_id = 2) - 分配给 王五(4)、赵六(5)
UPDATE tb_product SET seller_id = 4 WHERE category_id = 2 AND seller_id IS NULL AND id % 2 = 1;
UPDATE tb_product SET seller_id = 5 WHERE category_id = 2 AND seller_id IS NULL AND id % 2 = 0;

-- 家用电器 (category_id = 3) - 分配给 孙七(6)
UPDATE tb_product SET seller_id = 6 WHERE category_id = 3 AND seller_id IS NULL;

-- 服装鞋帽 (category_id = 4) - 分配给 周八(7)、吴九(8)
UPDATE tb_product SET seller_id = 7 WHERE category_id = 4 AND seller_id IS NULL AND id % 2 = 1;
UPDATE tb_product SET seller_id = 8 WHERE category_id = 4 AND seller_id IS NULL AND id % 2 = 0;

-- 美妆护肤 (category_id = 5) - 分配给 郑十(9)
UPDATE tb_product SET seller_id = 9 WHERE category_id = 5 AND seller_id IS NULL;

-- 食品饮料 (category_id = 6) - 分配给 小明(10)
UPDATE tb_product SET seller_id = 10 WHERE category_id = 6 AND seller_id IS NULL;

-- 母婴用品 (category_id = 7) - 分配给 小红(11)
UPDATE tb_product SET seller_id = 11 WHERE category_id = 7 AND seller_id IS NULL;

-- 运动户外 (category_id = 8) - 分配给 张三(2)、李四(3)
UPDATE tb_product SET seller_id = 2 WHERE category_id = 8 AND seller_id IS NULL AND id % 2 = 1;
UPDATE tb_product SET seller_id = 3 WHERE category_id = 8 AND seller_id IS NULL AND id % 2 = 0;

-- 家居生活 (category_id = 9) - 分配给 王五(4)
UPDATE tb_product SET seller_id = 4 WHERE category_id = 9 AND seller_id IS NULL;

-- 图书音像 (category_id = 10) - 分配给 赵六(5)
UPDATE tb_product SET seller_id = 5 WHERE category_id = 10 AND seller_id IS NULL;

-- 汽车用品 (category_id = 11) - 分配给 孙七(6)
UPDATE tb_product SET seller_id = 6 WHERE category_id = 11 AND seller_id IS NULL;

-- 珠宝首饰 (category_id = 12) - 分配给 周八(7)
UPDATE tb_product SET seller_id = 7 WHERE category_id = 12 AND seller_id IS NULL;

-- 检查结果
SELECT 
    p.id,
    p.name,
    p.category_id,
    p.seller_id,
    u.nickname as seller_name
FROM tb_product p
LEFT JOIN tb_user u ON p.seller_id = u.id
ORDER BY p.id
LIMIT 20;

-- 更新 seller_name 字段（根据 seller_id 关联用户名）
UPDATE tb_product p
JOIN tb_user u ON p.seller_id = u.id
SET p.seller_name = u.username
WHERE p.seller_name IS NULL OR p.seller_name = '';

-- ============================================
-- 修复订单项(order_item)的卖家信息
-- 从商品表同步卖家信息到订单项
-- ============================================

-- 更新订单项的 seller_id（从商品表获取）
UPDATE tb_order_item oi
JOIN tb_product p ON oi.product_id = p.id
SET oi.seller_id = p.seller_id
WHERE oi.seller_id IS NULL;

-- 更新订单项的 seller_name（从商品表获取）
UPDATE tb_order_item oi
JOIN tb_product p ON oi.product_id = p.id
SET oi.seller_name = p.seller_name
WHERE oi.seller_name IS NULL OR oi.seller_name = '';

-- ============================================
-- 数据完整性验证
-- ============================================

-- 检查商品是否还有无卖家的情况
SELECT '商品无卖家数量' as check_item, COUNT(*) as count FROM tb_product WHERE seller_id IS NULL;

-- 检查订单项是否还有无卖家的情况
SELECT '订单项无卖家数量' as check_item, COUNT(*) as count FROM tb_order_item WHERE seller_id IS NULL;

-- 检查 seller_name 是否与 seller_id 一致
SELECT '商品卖家名不匹配数量' as check_item, COUNT(*) as count 
FROM tb_product p 
LEFT JOIN tb_user u ON p.seller_id = u.id 
WHERE p.seller_id IS NOT NULL AND (p.seller_name IS NULL OR p.seller_name != u.username);

-- 检查订单项卖家是否与商品卖家一致
SELECT '订单项卖家不匹配数量' as check_item, COUNT(*) as count
FROM tb_order_item oi
JOIN tb_product p ON oi.product_id = p.id
WHERE oi.seller_id != p.seller_id;
