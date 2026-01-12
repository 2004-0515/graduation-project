-- 更新心愿单数据，填充空字段
USE shopping_mall;
SET NAMES utf8mb4;

-- 更新现有的心愿单记录
UPDATE tb_wishlist SET 
    added_price = (SELECT price FROM tb_product WHERE tb_product.id = tb_wishlist.product_id),
    cooling_days = 3,
    cooling_end_time = DATE_ADD(created_time, INTERVAL 3 DAY),
    reason = '想要购买这个商品',
    status = 0
WHERE id <= 20;

-- 给不同用户设置不同的理由
UPDATE tb_wishlist SET reason = '等待降价再购买' WHERE user_id IN (2, 5, 8);
UPDATE tb_wishlist SET reason = '生日礼物备选' WHERE user_id IN (3, 6, 9);
UPDATE tb_wishlist SET reason = '节日促销时购买' WHERE user_id IN (4, 7, 10);

-- 设置部分为已过冷静期状态
UPDATE tb_wishlist SET status = 1, cooling_end_time = DATE_SUB(NOW(), INTERVAL 1 DAY) WHERE id IN (1, 3, 5, 7, 9);

SELECT '心愿单数据更新完成！' as result;
