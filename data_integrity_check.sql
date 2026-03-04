-- ============================================================
-- 雅集商城数据完整性检查脚本
-- 执行方式: 在 Navicat 中打开并执行 (UTF-8 编码)
-- 数据库: shopping_mall
-- 最后更新: 2026-01-13
-- ============================================================

USE shopping_mall;

-- ============================================================
-- 第一部分: 外键引用完整性检查
-- 所有结果应该返回 0，否则表示存在孤立数据
-- ============================================================

SELECT '=== 外键引用完整性检查 ===' AS '检查类型';

-- 1.1 订单引用检查
SELECT '订单->用户 (无效引用数)' AS '检查项', COUNT(*) AS '问题数量' 
FROM tb_order WHERE user_id NOT IN (SELECT id FROM tb_user);

-- 1.2 订单项引用检查
SELECT '订单项->订单 (无效引用数)' AS '检查项', COUNT(*) AS '问题数量' 
FROM tb_order_item WHERE order_id NOT IN (SELECT id FROM tb_order);

SELECT '订单项->商品 (无效引用数)' AS '检查项', COUNT(*) AS '问题数量' 
FROM tb_order_item WHERE product_id NOT IN (SELECT id FROM tb_product);

SELECT '订单项->卖家 (无效引用数)' AS '检查项', COUNT(*) AS '问题数量' 
FROM tb_order_item WHERE seller_id IS NOT NULL AND seller_id NOT IN (SELECT id FROM tb_user);

-- 1.3 购物车引用检查
SELECT '购物车->用户 (无效引用数)' AS '检查项', COUNT(*) AS '问题数量' 
FROM tb_cart WHERE user_id NOT IN (SELECT id FROM tb_user);

SELECT '购物车->商品 (无效引用数)' AS '检查项', COUNT(*) AS '问题数量' 
FROM tb_cart WHERE product_id NOT IN (SELECT id FROM tb_product);

-- 1.4 评价引用检查
SELECT '评价->用户 (无效引用数)' AS '检查项', COUNT(*) AS '问题数量' 
FROM tb_review WHERE user_id NOT IN (SELECT id FROM tb_user);

SELECT '评价->商品 (无效引用数)' AS '检查项', COUNT(*) AS '问题数量' 
FROM tb_review WHERE product_id NOT IN (SELECT id FROM tb_product);

SELECT '评价->订单 (无效引用数)' AS '检查项', COUNT(*) AS '问题数量' 
FROM tb_review WHERE order_id IS NOT NULL AND order_id NOT IN (SELECT id FROM tb_order);

-- 1.5 商品引用检查
SELECT '商品->分类 (无效引用数)' AS '检查项', COUNT(*) AS '问题数量' 
FROM tb_product WHERE category_id NOT IN (SELECT id FROM tb_category);

SELECT '商品->卖家 (无效引用数)' AS '检查项', COUNT(*) AS '问题数量' 
FROM tb_product WHERE seller_id IS NOT NULL AND seller_id NOT IN (SELECT id FROM tb_user);

-- 1.6 用户优惠券引用检查
SELECT '用户优惠券->用户 (无效引用数)' AS '检查项', COUNT(*) AS '问题数量' 
FROM tb_user_coupon WHERE user_id NOT IN (SELECT id FROM tb_user);

SELECT '用户优惠券->优惠券 (无效引用数)' AS '检查项', COUNT(*) AS '问题数量' 
FROM tb_user_coupon WHERE coupon_id NOT IN (SELECT id FROM tb_coupon);

-- 1.7 地址引用检查
SELECT '地址->用户 (无效引用数)' AS '检查项', COUNT(*) AS '问题数量' 
FROM addresses WHERE user_id NOT IN (SELECT id FROM tb_user);

-- 1.8 价格提醒引用检查
SELECT '价格提醒->用户 (无效引用数)' AS '检查项', COUNT(*) AS '问题数量' 
FROM tb_price_alert WHERE user_id NOT IN (SELECT id FROM tb_user);

SELECT '价格提醒->商品 (无效引用数)' AS '检查项', COUNT(*) AS '问题数量' 
FROM tb_price_alert WHERE product_id NOT IN (SELECT id FROM tb_product);

-- 1.9 价格历史引用检查
SELECT '价格历史->商品 (无效引用数)' AS '检查项', COUNT(*) AS '问题数量' 
FROM tb_price_history WHERE product_id NOT IN (SELECT id FROM tb_product);

-- 1.10 心愿单引用检查
SELECT '心愿单->用户 (无效引用数)' AS '检查项', COUNT(*) AS '问题数量' 
FROM tb_wishlist WHERE user_id NOT IN (SELECT id FROM tb_user);

SELECT '心愿单->商品 (无效引用数)' AS '检查项', COUNT(*) AS '问题数量' 
FROM tb_wishlist WHERE product_id NOT IN (SELECT id FROM tb_product);

-- 1.11 通知引用检查
SELECT '通知->用户 (无效引用数)' AS '检查项', COUNT(*) AS '问题数量' 
FROM notifications WHERE user_id NOT IN (SELECT id FROM tb_user);

-- 1.12 消费预算引用检查
SELECT '消费预算->用户 (无效引用数)' AS '检查项', COUNT(*) AS '问题数量' 
FROM tb_consumption_budget WHERE user_id NOT IN (SELECT id FROM tb_user);

-- ============================================================
-- 第二部分: 必填字段 NULL 值检查
-- 所有结果应该返回 0
-- ============================================================

SELECT '=== 必填字段 NULL 值检查 ===' AS '检查类型';

-- 2.1 商品必填字段
SELECT '商品无卖家' AS '检查项', COUNT(*) AS '问题数量' FROM tb_product WHERE seller_id IS NULL;
SELECT '商品无分类' AS '检查项', COUNT(*) AS '问题数量' FROM tb_product WHERE category_id IS NULL;
SELECT '商品无名称' AS '检查项', COUNT(*) AS '问题数量' FROM tb_product WHERE name IS NULL OR name = '';
SELECT '商品无价格' AS '检查项', COUNT(*) AS '问题数量' FROM tb_product WHERE price IS NULL;

-- 2.2 订单必填字段
SELECT '订单无用户' AS '检查项', COUNT(*) AS '问题数量' FROM tb_order WHERE user_id IS NULL;
SELECT '订单无订单号' AS '检查项', COUNT(*) AS '问题数量' FROM tb_order WHERE order_no IS NULL OR order_no = '';
SELECT '订单无总金额' AS '检查项', COUNT(*) AS '问题数量' FROM tb_order WHERE total_amount IS NULL;

-- 2.3 订单项必填字段
SELECT '订单项无卖家' AS '检查项', COUNT(*) AS '问题数量' FROM tb_order_item WHERE seller_id IS NULL;
SELECT '订单项无商品' AS '检查项', COUNT(*) AS '问题数量' FROM tb_order_item WHERE product_id IS NULL;
SELECT '订单项无数量' AS '检查项', COUNT(*) AS '问题数量' FROM tb_order_item WHERE quantity IS NULL OR quantity <= 0;

-- 2.4 用户必填字段
SELECT '用户无用户名' AS '检查项', COUNT(*) AS '问题数量' FROM tb_user WHERE username IS NULL OR username = '';
SELECT '用户无密码' AS '检查项', COUNT(*) AS '问题数量' FROM tb_user WHERE password IS NULL OR password = '';

-- ============================================================
-- 第三部分: 状态值有效性检查
-- 所有结果应该返回 0
-- ============================================================

SELECT '=== 状态值有效性检查 ===' AS '检查类型';

-- 3.1 订单状态 (0-6)
SELECT '无效订单状态' AS '检查项', COUNT(*) AS '问题数量' 
FROM tb_order WHERE order_status NOT IN (0,1,2,3,4,5,6);

-- 3.2 支付状态 (0-2)
SELECT '无效支付状态' AS '检查项', COUNT(*) AS '问题数量' 
FROM tb_order WHERE payment_status NOT IN (0,1,2);

-- 3.3 商品状态 (0-1)
SELECT '无效商品状态' AS '检查项', COUNT(*) AS '问题数量' 
FROM tb_product WHERE status NOT IN (0,1);

-- 3.4 审核状态 (0-2)
SELECT '无效审核状态' AS '检查项', COUNT(*) AS '问题数量' 
FROM tb_product WHERE audit_status NOT IN (0,1,2);

-- 3.5 用户状态 (0-1)
SELECT '无效用户状态' AS '检查项', COUNT(*) AS '问题数量' 
FROM tb_user WHERE status NOT IN (0,1);

-- 3.6 优惠券类型 (1-3)
SELECT '无效优惠券类型' AS '检查项', COUNT(*) AS '问题数量' 
FROM tb_coupon WHERE type NOT IN (1,2,3);

-- 3.7 优惠券状态 (0-1)
SELECT '无效优惠券状态' AS '检查项', COUNT(*) AS '问题数量' 
FROM tb_coupon WHERE status NOT IN (0,1);

-- 3.8 用户优惠券状态 (0-2)
SELECT '无效用户优惠券状态' AS '检查项', COUNT(*) AS '问题数量' 
FROM tb_user_coupon WHERE status NOT IN (0,1,2);

-- 3.9 价格提醒状态 (0-2)
SELECT '无效价格提醒状态' AS '检查项', COUNT(*) AS '问题数量' 
FROM tb_price_alert WHERE status NOT IN (0,1,2);

-- 3.10 心愿单状态 (0-3)
SELECT '无效心愿单状态' AS '检查项', COUNT(*) AS '问题数量' 
FROM tb_wishlist WHERE status NOT IN (0,1,2,3);

-- 3.11 通知已读状态 (布尔值)
SELECT '无效通知已读状态' AS '检查项', COUNT(*) AS '问题数量' 
FROM notifications WHERE is_read NOT IN (0,1,TRUE,FALSE);

-- 3.12 发货状态 (0-1)
SELECT '无效发货状态' AS '检查项', COUNT(*) AS '问题数量' 
FROM tb_order_item WHERE ship_status NOT IN (0,1);

-- ============================================================
-- 第四部分: 数据一致性检查
-- 所有结果应该返回 0
-- ============================================================

SELECT '=== 数据一致性检查 ===' AS '检查类型';

-- 4.1 商品卖家名称一致性
SELECT '商品卖家名称不一致' AS '检查项', COUNT(*) AS '问题数量'
FROM tb_product p 
LEFT JOIN tb_user u ON p.seller_id = u.id 
WHERE p.seller_id IS NOT NULL AND (p.seller_name IS NULL OR p.seller_name != u.username);

-- 4.2 订单项卖家与商品卖家一致性
SELECT '订单项卖家与商品卖家不一致' AS '检查项', COUNT(*) AS '问题数量'
FROM tb_order_item oi
JOIN tb_product p ON oi.product_id = p.id
WHERE oi.seller_id != p.seller_id;

-- 4.3 订单项卖家名称一致性
SELECT '订单项卖家名称不一致' AS '检查项', COUNT(*) AS '问题数量'
FROM tb_order_item oi
LEFT JOIN tb_user u ON oi.seller_id = u.id
WHERE oi.seller_id IS NOT NULL AND (oi.seller_name IS NULL OR oi.seller_name != u.username);

-- ============================================================
-- 第五部分: 业务逻辑一致性检查
-- 所有结果应该返回 0
-- ============================================================

SELECT '=== 业务逻辑一致性检查 ===' AS '检查类型';

-- 5.1 已支付订单的支付状态必须为1
SELECT '已支付订单支付状态异常' AS '检查项', COUNT(*) AS '问题数量' 
FROM tb_order 
WHERE order_status IN (1,2,3) AND payment_status != 1;

-- 5.2 待付款订单的支付状态必须为0
SELECT '待付款订单支付状态异常' AS '检查项', COUNT(*) AS '问题数量' 
FROM tb_order 
WHERE order_status = 0 AND payment_status != 0;

-- 5.3 已取消订单不应有待发货的订单项
SELECT '已取消订单有待发货项' AS '检查项', COUNT(*) AS '问题数量' 
FROM tb_order_item oi 
JOIN tb_order o ON oi.order_id = o.id 
WHERE o.order_status = 4 AND oi.ship_status = 0;

-- 5.4 已完成订单应有结束时间
SELECT '已完成订单无结束时间' AS '检查项', COUNT(*) AS '问题数量' 
FROM tb_order 
WHERE order_status = 3 AND end_time IS NULL;

-- 5.5 商品库存不能为负
SELECT '商品库存为负' AS '检查项', COUNT(*) AS '问题数量' 
FROM tb_product WHERE stock < 0;

-- 5.6 商品价格不能为负或零
SELECT '商品价格异常' AS '检查项', COUNT(*) AS '问题数量' 
FROM tb_product WHERE price <= 0;

-- 5.7 订单金额不能为负
SELECT '订单金额为负' AS '检查项', COUNT(*) AS '问题数量' 
FROM tb_order WHERE total_amount < 0 OR pay_amount < 0;

-- 5.8 优惠券折扣金额有效性 (满减券和无门槛券)
SELECT '优惠券折扣金额异常' AS '检查项', COUNT(*) AS '问题数量' 
FROM tb_coupon WHERE type IN (1,3) AND (discount_amount IS NULL OR discount_amount <= 0);

-- 5.9 优惠券折扣比例有效性 (折扣券)
SELECT '优惠券折扣比例异常' AS '检查项', COUNT(*) AS '问题数量' 
FROM tb_coupon WHERE type = 2 AND (discount_rate IS NULL OR discount_rate <= 0 OR discount_rate >= 1);

-- 5.10 优惠券最低消费非负 (满减券)
SELECT '优惠券最低消费为负' AS '检查项', COUNT(*) AS '问题数量' 
FROM tb_coupon WHERE type = 1 AND min_amount IS NOT NULL AND min_amount < 0;

-- 5.11 评价评分范围 (1-5)
SELECT '评价评分超出范围' AS '检查项', COUNT(*) AS '问题数量' 
FROM tb_review WHERE rating < 1 OR rating > 5;

-- ============================================================
-- 第六部分: 数据范围检查 (根据项目规范)
-- ============================================================

SELECT '=== 数据范围检查 ===' AS '检查类型';

-- 6.1 用户ID范围 (1-20)
SELECT '用户ID超出范围' AS '检查项', COUNT(*) AS '问题数量' 
FROM tb_user WHERE id < 1 OR id > 100;

-- 6.2 商品ID范围 (1-51)
SELECT '商品ID超出范围' AS '检查项', COUNT(*) AS '问题数量' 
FROM tb_product WHERE id < 1 OR id > 100;

-- 6.3 分类ID范围 (1-12)
SELECT '分类ID超出范围' AS '检查项', COUNT(*) AS '问题数量' 
FROM tb_category WHERE id < 1 OR id > 20;

-- ============================================================
-- 第七部分: 数据统计汇总
-- ============================================================

SELECT '=== 数据统计汇总 ===' AS '检查类型';

SELECT '用户总数' AS '统计项', COUNT(*) AS '数量' FROM tb_user;
SELECT '商品总数' AS '统计项', COUNT(*) AS '数量' FROM tb_product;
SELECT '在售商品数' AS '统计项', COUNT(*) AS '数量' FROM tb_product WHERE status = 1;
SELECT '分类总数' AS '统计项', COUNT(*) AS '数量' FROM tb_category;
SELECT '订单总数' AS '统计项', COUNT(*) AS '数量' FROM tb_order;
SELECT '待付款订单' AS '统计项', COUNT(*) AS '数量' FROM tb_order WHERE order_status = 0;
SELECT '待发货订单' AS '统计项', COUNT(*) AS '数量' FROM tb_order WHERE order_status = 1;
SELECT '待收货订单' AS '统计项', COUNT(*) AS '数量' FROM tb_order WHERE order_status = 2;
SELECT '已完成订单' AS '统计项', COUNT(*) AS '数量' FROM tb_order WHERE order_status = 3;
SELECT '已取消订单' AS '统计项', COUNT(*) AS '数量' FROM tb_order WHERE order_status = 4;
SELECT '退款中订单' AS '统计项', COUNT(*) AS '数量' FROM tb_order WHERE order_status = 5;
SELECT '申请取消订单' AS '统计项', COUNT(*) AS '数量' FROM tb_order WHERE order_status = 6;
SELECT '购物车项总数' AS '统计项', COUNT(*) AS '数量' FROM tb_cart;
SELECT '评价总数' AS '统计项', COUNT(*) AS '数量' FROM tb_review;
SELECT '优惠券总数' AS '统计项', COUNT(*) AS '数量' FROM tb_coupon;
SELECT '用户优惠券总数' AS '统计项', COUNT(*) AS '数量' FROM tb_user_coupon;
SELECT '地址总数' AS '统计项', COUNT(*) AS '数量' FROM addresses;
SELECT '通知总数' AS '统计项', COUNT(*) AS '数量' FROM notifications;
SELECT '价格提醒总数' AS '统计项', COUNT(*) AS '数量' FROM tb_price_alert;
SELECT '心愿单总数' AS '统计项', COUNT(*) AS '数量' FROM tb_wishlist;

-- ============================================================
-- 第八部分: 详细问题数据查询 (仅在发现问题时使用)
-- ============================================================

SELECT '=== 详细问题数据 (如有) ===' AS '检查类型';

-- 8.1 查看无卖家的商品详情
SELECT '无卖家商品详情' AS '问题类型', id, name, category_id, seller_id, seller_name
FROM tb_product WHERE seller_id IS NULL LIMIT 10;

-- 8.2 查看卖家名称不一致的商品
SELECT '卖家名称不一致商品' AS '问题类型', p.id, p.name, p.seller_id, p.seller_name AS '商品记录卖家名', u.username AS '用户表用户名'
FROM tb_product p 
LEFT JOIN tb_user u ON p.seller_id = u.id 
WHERE p.seller_id IS NOT NULL AND (p.seller_name IS NULL OR p.seller_name != u.username)
LIMIT 10;

-- 8.3 查看无卖家的订单项
SELECT '无卖家订单项详情' AS '问题类型', oi.id, oi.order_id, oi.product_id, oi.seller_id, oi.seller_name
FROM tb_order_item oi WHERE oi.seller_id IS NULL LIMIT 10;

-- 8.4 查看无效状态的订单
SELECT '无效状态订单详情' AS '问题类型', id, order_no, order_status, payment_status
FROM tb_order WHERE order_status NOT IN (0,1,2,3,4,5,6) LIMIT 10;

-- ============================================================
-- 检查完成
-- ============================================================

SELECT '=== 数据完整性检查完成 ===' AS '状态';
SELECT '如果所有检查项的问题数量都为0，则数据完整性验证通过' AS '说明';
SELECT '如果发现问题，请执行 fix_seller.sql 或手动修复数据' AS '修复建议';
