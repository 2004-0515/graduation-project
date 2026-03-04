-- ============================================================
-- 数据完整性检查汇总 - 只显示有问题的项目
-- 执行方式: 在 Navicat 中打开并执行 (UTF-8 编码)
-- ============================================================

USE shopping_mall;

SELECT '=== 数据完整性检查 - 问题汇总 ===' AS title;

-- 使用 UNION ALL 合并所有检查，只显示问题数量 > 0 的项目
SELECT * FROM (
    SELECT '外键引用' AS category, '订单->用户' AS item, (SELECT COUNT(*) FROM tb_order WHERE user_id NOT IN (SELECT id FROM tb_user)) AS cnt
    UNION ALL SELECT '外键引用', '订单项->订单', (SELECT COUNT(*) FROM tb_order_item WHERE order_id NOT IN (SELECT id FROM tb_order))
    UNION ALL SELECT '外键引用', '订单项->商品', (SELECT COUNT(*) FROM tb_order_item WHERE product_id NOT IN (SELECT id FROM tb_product))
    UNION ALL SELECT '外键引用', '订单项->卖家', (SELECT COUNT(*) FROM tb_order_item WHERE seller_id IS NOT NULL AND seller_id NOT IN (SELECT id FROM tb_user))
    UNION ALL SELECT '外键引用', '购物车->用户', (SELECT COUNT(*) FROM tb_cart WHERE user_id NOT IN (SELECT id FROM tb_user))
    UNION ALL SELECT '外键引用', '购物车->商品', (SELECT COUNT(*) FROM tb_cart WHERE product_id NOT IN (SELECT id FROM tb_product))
    UNION ALL SELECT '外键引用', '评价->用户', (SELECT COUNT(*) FROM tb_review WHERE user_id NOT IN (SELECT id FROM tb_user))
    UNION ALL SELECT '外键引用', '评价->商品', (SELECT COUNT(*) FROM tb_review WHERE product_id NOT IN (SELECT id FROM tb_product))
    UNION ALL SELECT '外键引用', '商品->分类', (SELECT COUNT(*) FROM tb_product WHERE category_id NOT IN (SELECT id FROM tb_category))
    UNION ALL SELECT '外键引用', '商品->卖家', (SELECT COUNT(*) FROM tb_product WHERE seller_id IS NOT NULL AND seller_id NOT IN (SELECT id FROM tb_user))
    UNION ALL SELECT '外键引用', '用户优惠券->用户', (SELECT COUNT(*) FROM tb_user_coupon WHERE user_id NOT IN (SELECT id FROM tb_user))
    UNION ALL SELECT '外键引用', '用户优惠券->优惠券', (SELECT COUNT(*) FROM tb_user_coupon WHERE coupon_id NOT IN (SELECT id FROM tb_coupon))
    UNION ALL SELECT '外键引用', '地址->用户', (SELECT COUNT(*) FROM addresses WHERE user_id NOT IN (SELECT id FROM tb_user))
    UNION ALL SELECT '外键引用', '价格提醒->用户', (SELECT COUNT(*) FROM tb_price_alert WHERE user_id NOT IN (SELECT id FROM tb_user))
    UNION ALL SELECT '外键引用', '价格提醒->商品', (SELECT COUNT(*) FROM tb_price_alert WHERE product_id NOT IN (SELECT id FROM tb_product))
    UNION ALL SELECT '外键引用', '价格历史->商品', (SELECT COUNT(*) FROM tb_price_history WHERE product_id NOT IN (SELECT id FROM tb_product))
    UNION ALL SELECT '外键引用', '心愿单->用户', (SELECT COUNT(*) FROM tb_wishlist WHERE user_id NOT IN (SELECT id FROM tb_user))
    UNION ALL SELECT '外键引用', '心愿单->商品', (SELECT COUNT(*) FROM tb_wishlist WHERE product_id NOT IN (SELECT id FROM tb_product))
    UNION ALL SELECT '外键引用', '通知->用户', (SELECT COUNT(*) FROM notifications WHERE user_id NOT IN (SELECT id FROM tb_user))
    UNION ALL SELECT '外键引用', '消费预算->用户', (SELECT COUNT(*) FROM tb_consumption_budget WHERE user_id NOT IN (SELECT id FROM tb_user))
    UNION ALL SELECT '必填字段', '商品无卖家', (SELECT COUNT(*) FROM tb_product WHERE seller_id IS NULL)
    UNION ALL SELECT '必填字段', '商品无分类', (SELECT COUNT(*) FROM tb_product WHERE category_id IS NULL)
    UNION ALL SELECT '必填字段', '订单无用户', (SELECT COUNT(*) FROM tb_order WHERE user_id IS NULL)
    UNION ALL SELECT '必填字段', '订单项无卖家', (SELECT COUNT(*) FROM tb_order_item WHERE seller_id IS NULL)
    UNION ALL SELECT '状态值', '无效订单状态', (SELECT COUNT(*) FROM tb_order WHERE order_status NOT IN (0,1,2,3,4,5,6))
    UNION ALL SELECT '状态值', '无效支付状态', (SELECT COUNT(*) FROM tb_order WHERE payment_status NOT IN (0,1,2))
    UNION ALL SELECT '状态值', '无效商品状态', (SELECT COUNT(*) FROM tb_product WHERE status NOT IN (0,1))
    UNION ALL SELECT '状态值', '无效审核状态', (SELECT COUNT(*) FROM tb_product WHERE audit_status NOT IN (0,1,2))
    UNION ALL SELECT '状态值', '无效用户状态', (SELECT COUNT(*) FROM tb_user WHERE status NOT IN (0,1))
    UNION ALL SELECT '状态值', '无效优惠券类型', (SELECT COUNT(*) FROM tb_coupon WHERE type NOT IN (1,2,3))
    UNION ALL SELECT '状态值', '无效心愿单状态', (SELECT COUNT(*) FROM tb_wishlist WHERE status NOT IN (0,1,2,3))
    UNION ALL SELECT '状态值', '无效发货状态', (SELECT COUNT(*) FROM tb_order_item WHERE ship_status NOT IN (0,1))
    UNION ALL SELECT '数据一致性', '商品卖家名称不一致', (SELECT COUNT(*) FROM tb_product p LEFT JOIN tb_user u ON p.seller_id = u.id WHERE p.seller_id IS NOT NULL AND (p.seller_name IS NULL OR p.seller_name != u.username))
    UNION ALL SELECT '数据一致性', '订单项卖家名称不一致', (SELECT COUNT(*) FROM tb_order_item oi LEFT JOIN tb_user u ON oi.seller_id = u.id WHERE oi.seller_id IS NOT NULL AND (oi.seller_name IS NULL OR oi.seller_name != u.username))
    UNION ALL SELECT '业务逻辑', '已支付订单支付状态异常', (SELECT COUNT(*) FROM tb_order WHERE order_status IN (1,2,3) AND payment_status != 1)
    UNION ALL SELECT '业务逻辑', '待付款订单支付状态异常', (SELECT COUNT(*) FROM tb_order WHERE order_status = 0 AND payment_status != 0)
    UNION ALL SELECT '业务逻辑', '商品库存为负', (SELECT COUNT(*) FROM tb_product WHERE stock < 0)
    UNION ALL SELECT '业务逻辑', '商品价格异常', (SELECT COUNT(*) FROM tb_product WHERE price <= 0)
) AS all_checks
WHERE cnt > 0;

-- 如果上面没有结果，说明全部通过
SELECT '如果上方表格为空，则所有38项检查全部通过！' AS note;
