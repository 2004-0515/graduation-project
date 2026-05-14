-- Temporary production-grade data enhancement for shopping_mall.
-- This file is intentionally kept only for the current backfill cycle and
-- will be removed after verification and repository backup.

START TRANSACTION;

SET @script_now = '2026-05-14 20:00:00';

-- ---------------------------------------------------------------------
-- 1. Fill user profile gaps
-- ---------------------------------------------------------------------
UPDATE tb_user
SET avatar = CASE MOD(id, 3)
    WHEN 0 THEN '/uploads/avatars/2026/03/e13aab6f-3360-47df-9ca9-cffec7c4e233.jpg'
    WHEN 1 THEN '/uploads/avatars/2026/05/0836ddae-bd89-45fe-a82f-421e885b8ebf.jpg'
    ELSE '/uploads/avatars/2025/12/4ade804c-8c1a-44b5-a91e-c0339dce67b4.jpg'
END
WHERE avatar IS NULL OR avatar = '';

UPDATE tb_user
SET nickname = CONCAT('用户', LPAD(id, 2, '0'))
WHERE nickname IS NULL OR nickname = '';

UPDATE tb_user
SET bio = CASE MOD(id, 5)
    WHEN 0 THEN '偏爱高性价比商品，购物前会认真对比评价与活动力度。'
    WHEN 1 THEN '关注日常品质消费，喜欢把常买商品加入想要清单慢慢观察。'
    WHEN 2 THEN '对数码与家居品类更感兴趣，购买前更在意售后与口碑。'
    WHEN 3 THEN '习惯按月规划预算，遇到活动会优先使用店铺券和平台券。'
    ELSE '重视购物体验和物流效率，偏爱页面信息完整、评价真实的商品。'
END
WHERE bio IS NULL OR bio = '';

-- ---------------------------------------------------------------------
-- 2. Backfill product galleries and selected media
-- ---------------------------------------------------------------------
UPDATE tb_product
SET images = CASE category_id
    WHEN 1 THEN JSON_ARRAY(main_image, '/uploads/products/数码电子/2026/04/231ab70b-c664-451a-83c5-a41b437822ee.webp', '/uploads/products/数码电子/2026/04/95ef0f35-4155-4475-9bce-5258045fae71.webp')
    WHEN 2 THEN JSON_ARRAY(main_image, '/uploads/products/家用电器/2026/04/af53d474-fdfd-4c4f-b17c-fbcf629dd275.webp', '/uploads/products/家用电器/2026/04/e8ca3ae2-958e-478e-af53-1a2e9b618c84.webp')
    WHEN 3 THEN JSON_ARRAY(main_image, '/uploads/products/服装鞋包/2026/04/3235f964-4f1b-44a5-bf0c-2f924a3134a7.webp', '/uploads/products/服装鞋包/2026/04/95a3e7ef-91ce-4f28-82cc-e1fde9f10899.webp')
    WHEN 4 THEN JSON_ARRAY(main_image, '/uploads/products/美妆护肤/2026/04/74719003-2d4f-4516-bca6-9c81274307af.webp', '/uploads/products/美妆护肤/2026/04/99279659-32ea-488d-9edf-5fe71b167b62.webp')
    WHEN 5 THEN JSON_ARRAY(main_image, '/uploads/products/食品饮料/2026/04/02867ded-e6c7-4ec2-9665-27f06168156c.webp', '/uploads/products/食品饮料/2026/04/827d0361-11c5-4adc-99a5-f69929ba1820.webp')
    WHEN 6 THEN JSON_ARRAY(main_image, '/uploads/products/图书文娱/2026/04/46338869-0a0a-4a76-a0ef-e8d990100d2c.webp', '/uploads/products/图书文娱/2026/04/91d2cff1-af1c-4cb3-ac94-33976fd6067a.webp')
    ELSE JSON_ARRAY(main_image)
END
WHERE main_image IS NOT NULL
  AND main_image <> ''
  AND (images IS NULL OR images = '');

UPDATE tb_product
SET seller_name = (SELECT u.username FROM tb_user u WHERE u.id = tb_product.seller_id)
WHERE seller_id IS NOT NULL
  AND (seller_name IS NULL OR seller_name = '');

UPDATE tb_product
SET audit_status = 1,
    audit_time = COALESCE(audit_time, updated_time, created_time),
    version = COALESCE(version, 0)
WHERE status = 1;

UPDATE tb_product
SET ad_video = CASE id
    WHEN 1 THEN '/uploads/videos/2025/12/67d634a3-ce8a-4a96-bbb9-892602000f76.mp4'
    WHEN 17 THEN '/uploads/videos/2026/01/1dcc0a56-d7c5-4f9d-92b5-d1e53dc20704.mp4'
    WHEN 38 THEN '/uploads/videos/2025/12/77fa78d8-2510-4153-a284-d30ea535304a.mp4'
    WHEN 43 THEN '/uploads/videos/2026/01/35c849d2-77d5-405f-96cb-a6aec24b6494.mp4'
    ELSE ad_video
END,
ad_video_duration = CASE id
    WHEN 1 THEN 6
    WHEN 17 THEN 8
    WHEN 38 THEN 7
    WHEN 43 THEN 6
    ELSE ad_video_duration
END,
ad_video_enabled = CASE
    WHEN id IN (1, 17, 38, 43) THEN 1
    ELSE ad_video_enabled
END
WHERE id IN (1, 17, 38, 43);

INSERT INTO tb_product (
    name, description, category_id, price, original_price, stock, sales, status, main_image, images,
    created_time, updated_time, audit_status, audit_time, seller_id, seller_name,
    ad_video, ad_video_duration, ad_video_enabled, version
)
SELECT
    seed.name, seed.description, seed.category_id, seed.price, seed.original_price, seed.stock, seed.sales, 1,
    seed.main_image, seed.images, seed.created_time, @script_now, 1, @script_now, seed.seller_id,
    (SELECT username FROM tb_user WHERE id = seed.seller_id), seed.ad_video, seed.ad_video_duration, seed.ad_video_enabled, 0
FROM (
    SELECT '华硕灵耀14 2026款' AS name, '14英寸轻薄本，OLED 屏幕与长续航配置，适合办公与学习场景。' AS description, 1 AS category_id, 6999.00 AS price, 7599.00 AS original_price, 68 AS stock, 86 AS sales, '/uploads/products/数码电子/2026/04/7e8115e7-f609-498d-a503-8b5777c147df.webp' AS main_image, JSON_ARRAY('/uploads/products/数码电子/2026/04/7e8115e7-f609-498d-a503-8b5777c147df.webp', '/uploads/products/数码电子/2026/04/c1e58760-4de0-464a-a1c1-e26cf56617d6.webp', '/uploads/products/数码电子/2026/04/8a5ecb4f-cec2-4978-8b28-f3ff1f4e8e1a.webp') AS images, 3 AS seller_id, NULL AS ad_video, NULL AS ad_video_duration, 0 AS ad_video_enabled, '2026-05-06 10:00:00' AS created_time
    UNION ALL
    SELECT '博乐宝台式净饮机', '即热即饮净水设备，适合家庭与办公室日常饮水场景。', 2, 2299.00, 2699.00, 94, 122, '/uploads/products/家用电器/2026/04/aa272347-8c2b-4faf-bcd1-60023fcc6778.webp', JSON_ARRAY('/uploads/products/家用电器/2026/04/aa272347-8c2b-4faf-bcd1-60023fcc6778.webp', '/uploads/products/家用电器/2026/04/75174a31-3332-4e32-9096-cab42d8abed7.webp', '/uploads/products/家用电器/2026/04/e8ca3ae2-958e-478e-af53-1a2e9b618c84.webp'), 8, NULL, NULL, 0, '2026-05-07 09:20:00'
    UNION ALL
    SELECT 'Columbia 三合一冲锋衣', '适合通勤与轻户外穿着，内胆可拆卸，兼顾保暖与防风。', 3, 899.00, 1199.00, 136, 154, '/uploads/products/服装鞋包/2026/04/3235f964-4f1b-44a5-bf0c-2f924a3134a7.webp', JSON_ARRAY('/uploads/products/服装鞋包/2026/04/3235f964-4f1b-44a5-bf0c-2f924a3134a7.webp', '/uploads/products/服装鞋包/2026/04/12a25d4f-db9a-42ae-bb01-401d7bd33330.webp', '/uploads/products/服装鞋包/2026/04/95a3e7ef-91ce-4f28-82cc-e1fde9f10899.webp'), 10, NULL, NULL, 0, '2026-05-08 11:10:00'
    UNION ALL
    SELECT '珀莱雅红宝石精华 30ml', '主打紧致与修护的精华产品，适合作为护肤类稳定复购商品。', 4, 329.00, 399.00, 220, 318, '/uploads/products/美妆护肤/2026/04/6e3133f9-3426-480b-9eb8-a0293e5057c1.webp', JSON_ARRAY('/uploads/products/美妆护肤/2026/04/6e3133f9-3426-480b-9eb8-a0293e5057c1.webp', '/uploads/products/美妆护肤/2026/04/67bb03b2-fbd7-4c61-86d9-bc02d7ce3f32.webp', '/uploads/products/美妆护肤/2026/04/99279659-32ea-488d-9edf-5fe71b167b62.webp'), 13, NULL, NULL, 0, '2026-05-09 14:40:00'
    UNION ALL
    SELECT '元气森林白桃气泡水 480ml*15', '清爽型气泡饮品，适合作为食品饮料类高频购买商品。', 5, 79.00, 99.00, 420, 506, '/uploads/products/食品饮料/2026/04/eba003b5-ba6a-46cb-858a-73d295b601a2.webp', JSON_ARRAY('/uploads/products/食品饮料/2026/04/eba003b5-ba6a-46cb-858a-73d295b601a2.webp', '/uploads/products/食品饮料/2026/04/02867ded-e6c7-4ec2-9665-27f06168156c.webp', '/uploads/products/食品饮料/2026/04/827d0361-11c5-4adc-99a5-f69929ba1820.webp'), 15, NULL, NULL, 0, '2026-05-10 09:30:00'
    UNION ALL
    SELECT '你当像鸟飞往你的山', '适合图书类长期陈列与阅读分享的回忆录作品。', 6, 52.00, 69.00, 360, 288, '/uploads/products/图书文娱/2026/04/91d2cff1-af1c-4cb3-ac94-33976fd6067a.webp', JSON_ARRAY('/uploads/products/图书文娱/2026/04/91d2cff1-af1c-4cb3-ac94-33976fd6067a.webp', '/uploads/products/图书文娱/2026/04/46338869-0a0a-4a76-a0ef-e8d990100d2c.webp', '/uploads/products/图书文娱/2026/04/70b557c4-7c77-4ac2-b410-628c5236def5.webp'), 16, NULL, NULL, 0, '2026-05-11 16:10:00'
) seed
WHERE NOT EXISTS (SELECT 1 FROM tb_product p WHERE p.name = seed.name);

-- ---------------------------------------------------------------------
-- 3. Coupon and user coupon enrichment
-- ---------------------------------------------------------------------
INSERT INTO tb_coupon (
    claimed_count, created_time, description, discount_amount, discount_rate, end_time,
    limit_per_user, max_discount, min_amount, name, start_time, status, total_count, type, updated_time
)
SELECT 0, '2026-05-10 09:00:00', '适用于平台大部分实物商品订单，适合月中购物补贴。', 60.00, NULL, '2026-08-31 23:59:59',
       2, NULL, 399.00, '满399减60购物券', '2026-05-10 09:00:00', 1, 3000, 1, @script_now
WHERE NOT EXISTS (SELECT 1 FROM tb_coupon WHERE name = '满399减60购物券');

INSERT INTO tb_coupon (
    claimed_count, created_time, description, discount_amount, discount_rate, end_time,
    limit_per_user, max_discount, min_amount, name, start_time, status, total_count, type, updated_time
)
SELECT 0, '2026-05-10 09:10:00', '适用于日常数码、家电和图书等品类，封顶优惠控制在合理范围。', NULL, 0.92, '2026-08-31 23:59:59',
       1, 180.00, 299.00, '精选商品92折券', '2026-05-10 09:10:00', 1, 1800, 2, @script_now
WHERE NOT EXISTS (SELECT 1 FROM tb_coupon WHERE name = '精选商品92折券');

INSERT INTO tb_user_coupon (coupon_id, created_time, order_id, status, used_time, user_id)
SELECT c.id, '2026-05-11 10:00:00', NULL, 0, NULL, 3
FROM tb_coupon c
WHERE c.name = '满399减60购物券'
  AND NOT EXISTS (
    SELECT 1 FROM tb_user_coupon uc
    WHERE uc.coupon_id = c.id AND uc.user_id = 3 AND uc.created_time = '2026-05-11 10:00:00'
  );

INSERT INTO tb_user_coupon (coupon_id, created_time, order_id, status, used_time, user_id)
SELECT c.id, '2026-05-11 10:05:00', NULL, 0, NULL, 4
FROM tb_coupon c
WHERE c.name = '精选商品92折券'
  AND NOT EXISTS (
    SELECT 1 FROM tb_user_coupon uc
    WHERE uc.coupon_id = c.id AND uc.user_id = 4 AND uc.created_time = '2026-05-11 10:05:00'
  );

-- ---------------------------------------------------------------------
-- 4. Formal orders and order items
-- ---------------------------------------------------------------------
INSERT INTO tb_order (
    order_no, user_id, total_amount, pay_amount, payment_method, payment_status, order_status,
    shipping_address, payment_time, shipping_time, end_time, remark, created_time, updated_time, coupon_discount, coupon_id
)
SELECT 'ORD202605140001', 3, 6999.00, 6939.00, 1, 1, 1,
       '{"receiver":"李四","phone":"13987654321","province":"江苏省","city":"苏州市","district":"工业园区","detail":"星湖街 88 号"}',
       '2026-05-12 10:08:00', NULL, NULL, '准备升级办公设备', '2026-05-12 10:00:00', @script_now, 60.00,
       (SELECT id FROM tb_coupon WHERE name = '满399减60购物券' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM tb_order WHERE order_no = 'ORD202605140001');

INSERT INTO tb_order (
    order_no, user_id, total_amount, pay_amount, payment_method, payment_status, order_status,
    shipping_address, payment_time, shipping_time, end_time, remark, created_time, updated_time, coupon_discount, coupon_id
)
SELECT 'ORD202605140002', 4, 2299.00, 2115.08, 2, 1, 2,
       '{"receiver":"王五","phone":"13666666666","province":"浙江省","city":"杭州市","district":"西湖区","detail":"文三路 18 号"}',
       '2026-05-12 14:28:00', '2026-05-13 09:15:00', NULL, '办公室饮水设备更新', '2026-05-12 14:20:00', @script_now, 183.92,
       (SELECT id FROM tb_coupon WHERE name = '精选商品92折券' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM tb_order WHERE order_no = 'ORD202605140002');

INSERT INTO tb_order (
    order_no, user_id, total_amount, pay_amount, payment_method, payment_status, order_status,
    shipping_address, payment_time, shipping_time, end_time, remark, created_time, updated_time, coupon_discount, coupon_id
)
SELECT 'ORD202605140003', 5, 951.00, 951.00, 1, 1, 3,
       '{"receiver":"赵六","phone":"13555555555","province":"广东省","city":"深圳市","district":"南山区","detail":"科技园中区 6 栋"}',
       '2026-05-11 19:05:00', '2026-05-12 10:30:00', '2026-05-14 18:20:00', '换季通勤穿搭', '2026-05-11 18:58:00', @script_now, 0.00, NULL
WHERE NOT EXISTS (SELECT 1 FROM tb_order WHERE order_no = 'ORD202605140003');

INSERT INTO tb_order (
    order_no, user_id, total_amount, pay_amount, payment_method, payment_status, order_status,
    shipping_address, payment_time, shipping_time, end_time, remark, created_time, updated_time, coupon_discount, coupon_id
)
SELECT 'ORD202605140004', 6, 381.00, 381.00, 1, 0, 0,
       '{"receiver":"孙七","phone":"13444444444","province":"四川省","city":"成都市","district":"高新区","detail":"天府大道 1666 号"}',
       NULL, NULL, NULL, '先加入待支付，准备凑单', '2026-05-13 20:40:00', @script_now, 0.00, NULL
WHERE NOT EXISTS (SELECT 1 FROM tb_order WHERE order_no = 'ORD202605140004');

INSERT INTO tb_order_item (
    order_id, product_id, product_name, product_price, quantity, total_price, product_image,
    seller_id, seller_name, ship_status, ship_time, created_time, updated_time
)
SELECT o.id, p.id, p.name, p.price, 1, p.price, p.main_image, p.seller_id, p.seller_name, 0, NULL, o.created_time, @script_now
FROM tb_order o
JOIN tb_product p ON p.name = '华硕灵耀14 2026款'
WHERE o.order_no = 'ORD202605140001'
  AND NOT EXISTS (SELECT 1 FROM tb_order_item oi WHERE oi.order_id = o.id AND oi.product_id = p.id);

INSERT INTO tb_order_item (
    order_id, product_id, product_name, product_price, quantity, total_price, product_image,
    seller_id, seller_name, ship_status, ship_time, created_time, updated_time
)
SELECT o.id, p.id, p.name, p.price, 1, p.price, p.main_image, p.seller_id, p.seller_name, 1, '2026-05-13 09:15:00', o.created_time, @script_now
FROM tb_order o
JOIN tb_product p ON p.name = '博乐宝台式净饮机'
WHERE o.order_no = 'ORD202605140002'
  AND NOT EXISTS (SELECT 1 FROM tb_order_item oi WHERE oi.order_id = o.id AND oi.product_id = p.id);

INSERT INTO tb_order_item (
    order_id, product_id, product_name, product_price, quantity, total_price, product_image,
    seller_id, seller_name, ship_status, ship_time, created_time, updated_time
)
SELECT o.id, p.id, p.name, p.price, 1, p.price, p.main_image, p.seller_id, p.seller_name, 1, '2026-05-12 10:30:00', o.created_time, @script_now
FROM tb_order o
JOIN tb_product p ON p.name = 'Columbia 三合一冲锋衣'
WHERE o.order_no = 'ORD202605140003'
  AND NOT EXISTS (SELECT 1 FROM tb_order_item oi WHERE oi.order_id = o.id AND oi.product_id = p.id);

INSERT INTO tb_order_item (
    order_id, product_id, product_name, product_price, quantity, total_price, product_image,
    seller_id, seller_name, ship_status, ship_time, created_time, updated_time
)
SELECT o.id, p.id, p.name, p.price, 1, p.price, p.main_image, p.seller_id, p.seller_name, 0, NULL, o.created_time, @script_now
FROM tb_order o
JOIN tb_product p ON p.name = '珀莱雅红宝石精华 30ml'
WHERE o.order_no = 'ORD202605140004'
  AND NOT EXISTS (SELECT 1 FROM tb_order_item oi WHERE oi.order_id = o.id AND oi.product_id = p.id);

INSERT INTO tb_order_item (
    order_id, product_id, product_name, product_price, quantity, total_price, product_image,
    seller_id, seller_name, ship_status, ship_time, created_time, updated_time
)
SELECT o.id, p.id, p.name, p.price, 1, p.price, p.main_image, p.seller_id, p.seller_name, 0, NULL, o.created_time, @script_now
FROM tb_order o
JOIN tb_product p ON p.name = '元气森林白桃气泡水 480ml*15'
WHERE o.order_no = 'ORD202605140004'
  AND NOT EXISTS (SELECT 1 FROM tb_order_item oi WHERE oi.order_id = o.id AND oi.product_id = p.id);

INSERT INTO tb_order_item (
    order_id, product_id, product_name, product_price, quantity, total_price, product_image,
    seller_id, seller_name, ship_status, ship_time, created_time, updated_time
)
SELECT o.id, p.id, p.name, p.price, 1, p.price, p.main_image, p.seller_id, p.seller_name, 0, NULL, o.created_time, @script_now
FROM tb_order o
JOIN tb_product p ON p.name = '你当像鸟飞往你的山'
WHERE o.order_no = 'ORD202605140004'
  AND NOT EXISTS (SELECT 1 FROM tb_order_item oi WHERE oi.order_id = o.id AND oi.product_id = p.id);

UPDATE tb_user_coupon uc
JOIN tb_coupon c ON c.id = uc.coupon_id
JOIN tb_order o ON o.order_no = 'ORD202605140001'
SET uc.order_id = o.id, uc.status = 1, uc.used_time = '2026-05-12 10:08:00'
WHERE uc.user_id = 3
  AND c.name = '满399减60购物券'
  AND uc.created_time = '2026-05-11 10:00:00';

-- ---------------------------------------------------------------------
-- 5. Review image and seller reply backfill
-- ---------------------------------------------------------------------
UPDATE tb_review
SET images = CASE MOD(id, 4)
    WHEN 0 THEN JSON_ARRAY('/uploads/reviews/2026/05/demo-review-01.webp')
    WHEN 1 THEN JSON_ARRAY('/uploads/reviews/2026/05/demo-review-02.webp')
    WHEN 2 THEN JSON_ARRAY('/uploads/reviews/2026/05/demo-review-03.webp')
    ELSE JSON_ARRAY('/uploads/reviews/2026/05/demo-review-04.webp')
END
WHERE images IS NULL OR images = '';

UPDATE tb_review
SET reply = CASE MOD(id, 6)
    WHEN 0 THEN '感谢您的细致反馈，我们会继续保持发货与包装标准。'
    WHEN 1 THEN '感谢支持，后续活动上新时欢迎继续关注。'
    WHEN 2 THEN '收到您的评价了，祝您使用顺利，有问题可以随时联系店铺客服。'
    WHEN 3 THEN '非常感谢认可，我们会继续把控品质和售后体验。'
    WHEN 4 THEN '感谢真实分享，这类反馈对后续顾客参考很有帮助。'
    ELSE '感谢您的购买与评价，期待下次继续为您服务。'
END,
reply_time = COALESCE(reply_time, DATE_ADD(created_time, INTERVAL 1 DAY))
WHERE reply IS NULL OR reply = '';

INSERT INTO tb_review (
    is_anonymous, content, created_time, images, order_id, order_item_id, product_id, rating, reply, reply_time, user_id
)
SELECT b'0', '做工和版型都很稳，颜色百搭，收到后上身效果比预期更好。', '2026-05-14 19:10:00',
       JSON_ARRAY('/uploads/reviews/2026/05/demo-review-01.webp', '/uploads/reviews/2026/05/demo-review-02.webp'),
       o.id, oi.id, p.id, 5, '感谢支持，后续如需换季搭配建议可以继续联系店铺。', '2026-05-14 20:00:00', 5
FROM tb_order o
JOIN tb_order_item oi ON oi.order_id = o.id
JOIN tb_product p ON p.id = oi.product_id
WHERE o.order_no = 'ORD202605140003'
  AND p.name = 'Columbia 三合一冲锋衣'
  AND NOT EXISTS (
    SELECT 1 FROM tb_review r
    WHERE r.order_id = o.id AND r.product_id = p.id AND r.user_id = 5
  );

-- ---------------------------------------------------------------------
-- 6. Notifications, wishlist, budget, achievement and price alerts
-- ---------------------------------------------------------------------
UPDATE notifications
SET related_id = CASE
    WHEN message LIKE '%格力空调%' THEN 19
    WHEN message LIKE '%小米洗衣机%' THEN 18
    WHEN message LIKE '%美的空调%' THEN 17
    WHEN message LIKE '%海尔冰箱%' THEN 16
    WHEN message LIKE '%小米手环8%' THEN 15
    WHEN message LIKE '%Kindle%' THEN 14
    WHEN message LIKE '%罗技鼠标%' THEN 13
    WHEN message LIKE '%戴尔XPS 13%' THEN 12
    WHEN message LIKE '%联想小新Pro 16%' THEN 11
    WHEN message LIKE '%DJI Mini 4 Pro%' THEN 10
    WHEN message LIKE '%Switch%' THEN 9
    WHEN message LIKE '%Sony耳机%' THEN 8
    WHEN message LIKE '%Apple Watch%' THEN 7
    WHEN message LIKE '%AirPods Pro%' THEN 6
    ELSE related_id
END
WHERE related_id IS NULL
  AND type = 'product';

UPDATE tb_wishlist w
JOIN tb_product p ON p.id = w.product_id
SET w.reason = CASE MOD(w.id, 4)
    WHEN 0 THEN CONCAT('准备等活动价再入手，当前主要关注 ', p.name, ' 的口碑和价格走势。')
    WHEN 1 THEN CONCAT('计划作为近期升级采购候选，先加入清单持续比较 ', p.name, '。')
    WHEN 2 THEN CONCAT('这件商品符合当前需求，先观察一段时间再决定是否购买：', p.name)
    ELSE CONCAT('准备等预算宽松时入手，先把 ', p.name, ' 留在想要清单中。')
END
WHERE w.reason IS NULL OR w.reason = '';

INSERT INTO notifications (created_time, message, is_read, related_id, title, type, user_id)
SELECT '2026-05-12 10:09:00', '您的订单已支付成功，商家正在为您准备发货。', b'0', o.id, '订单支付成功', 'order', 3
FROM tb_order o
WHERE o.order_no = 'ORD202605140001'
  AND NOT EXISTS (
    SELECT 1 FROM notifications n WHERE n.user_id = 3 AND n.title = '订单支付成功' AND n.related_id = o.id
  );

INSERT INTO notifications (created_time, message, is_read, related_id, title, type, user_id)
SELECT '2026-05-13 09:20:00', CONCAT('用户王五购买了您的商品「', p.name, '」，订单已支付，请及时发货。'), b'0', o.id, '新订单待发货', 'order', p.seller_id
FROM tb_order o
JOIN tb_order_item oi ON oi.order_id = o.id
JOIN tb_product p ON p.id = oi.product_id
WHERE o.order_no = 'ORD202605140002'
  AND NOT EXISTS (
    SELECT 1 FROM notifications n WHERE n.user_id = p.seller_id AND n.title = '新订单待发货' AND n.related_id = o.id
  );

INSERT INTO notifications (created_time, message, is_read, related_id, title, type, user_id)
SELECT '2026-05-14 20:10:00', '您购买的冲锋衣已经完成评价，店铺也已回复，欢迎继续查看搭配建议。', b'0', p.id, '评价互动提醒', 'review', 5
FROM tb_product p
WHERE p.name = 'Columbia 三合一冲锋衣'
  AND NOT EXISTS (
    SELECT 1 FROM notifications n WHERE n.user_id = 5 AND n.title = '评价互动提醒' AND n.related_id = p.id
  );

INSERT INTO tb_consumption_budget (
    alert_enabled, alert_threshold, budget_month, created_time, monthly_budget, updated_time, user_id
)
SELECT b'1', 80, '202605', '2026-05-01 09:00:00', 4800.00, @script_now, 3
WHERE NOT EXISTS (SELECT 1 FROM tb_consumption_budget WHERE user_id = 3 AND budget_month = '202605');

INSERT INTO tb_consumption_budget (
    alert_enabled, alert_threshold, budget_month, created_time, monthly_budget, updated_time, user_id
)
SELECT b'1', 75, '202605', '2026-05-01 09:10:00', 5200.00, @script_now, 4
WHERE NOT EXISTS (SELECT 1 FROM tb_consumption_budget WHERE user_id = 4 AND budget_month = '202605');

INSERT INTO tb_consumption_achievement (
    achieved_time, achievement_desc, achievement_name, achievement_type, user_id
)
SELECT '2026-05-14 18:30:00', '本月完成了多笔按需消费，且主要订单均在预算范围内。', '预算执行稳定', 'RATIONAL_GIVEUP_5', 3
WHERE NOT EXISTS (
    SELECT 1 FROM tb_consumption_achievement
    WHERE user_id = 3 AND achievement_name = '预算执行稳定'
);

INSERT INTO tb_price_alert (
    created_time, current_price, notified, product_id, status, target_price, triggered_price, triggered_time, updated_time, user_id
)
SELECT '2026-05-12 15:00:00', p.price, b'0', p.id, 0, 6599.00, NULL, NULL, @script_now, 3
FROM tb_product p
WHERE p.name = '华硕灵耀14 2026款'
  AND NOT EXISTS (SELECT 1 FROM tb_price_alert pa WHERE pa.user_id = 3 AND pa.product_id = p.id);

INSERT INTO tb_price_alert (
    created_time, current_price, notified, product_id, status, target_price, triggered_price, triggered_time, updated_time, user_id
)
SELECT '2026-05-12 15:20:00', p.price, b'0', p.id, 0, 1999.00, NULL, NULL, @script_now, 4
FROM tb_product p
WHERE p.name = '博乐宝台式净饮机'
  AND NOT EXISTS (SELECT 1 FROM tb_price_alert pa WHERE pa.user_id = 4 AND pa.product_id = p.id);

INSERT INTO tb_price_history (
    change_amount, change_rate, change_type, original_price, price, product_id, recorded_time
)
SELECT -600.00, -7.89, 'PRICE_DROP', 7599.00, 6999.00, p.id, '2026-05-12 09:00:00'
FROM tb_product p
WHERE p.name = '华硕灵耀14 2026款'
  AND NOT EXISTS (SELECT 1 FROM tb_price_history ph WHERE ph.product_id = p.id AND ph.recorded_time = '2026-05-12 09:00:00');

INSERT INTO tb_price_history (
    change_amount, change_rate, change_type, original_price, price, product_id, recorded_time
)
SELECT -400.00, -14.82, 'PRICE_DROP', 2699.00, 2299.00, p.id, '2026-05-11 10:00:00'
FROM tb_product p
WHERE p.name = '博乐宝台式净饮机'
  AND NOT EXISTS (SELECT 1 FROM tb_price_history ph WHERE ph.product_id = p.id AND ph.recorded_time = '2026-05-11 10:00:00');

-- ---------------------------------------------------------------------
-- 7. Upload file records for newly referenced assets
-- ---------------------------------------------------------------------
INSERT INTO tb_upload_file (
    created_time, file_path, file_size, file_type, original_name, review_remark, review_time,
    reviewer_id, reviewer_name, status, user_id, username, related_id
)
SELECT '2026-05-10 08:40:00', '/uploads/avatars/2026/05/0836ddae-bd89-45fe-a82f-421e885b8ebf.jpg', 69574, 'AVATAR',
       '0836ddae-bd89-45fe-a82f-421e885b8ebf.jpg', '头像文件已审核通过', '2026-05-10 08:45:00',
       1, 'admin', 1, 1, 'admin', NULL
WHERE NOT EXISTS (SELECT 1 FROM tb_upload_file WHERE file_path = '/uploads/avatars/2026/05/0836ddae-bd89-45fe-a82f-421e885b8ebf.jpg');

INSERT INTO tb_upload_file (
    created_time, file_path, file_size, file_type, original_name, review_remark, review_time,
    reviewer_id, reviewer_name, status, user_id, username, related_id
)
SELECT '2026-05-10 08:30:00', '/uploads/reviews/2026/05/demo-review-01.webp', 18240, 'IMAGE',
       'review-detail-01.webp', '评价配图已审核通过', '2026-05-10 08:35:00',
       1, 'admin', 1, 2, 'zhangsan', 1
WHERE NOT EXISTS (SELECT 1 FROM tb_upload_file WHERE file_path = '/uploads/reviews/2026/05/demo-review-01.webp');

INSERT INTO tb_upload_file (
    created_time, file_path, file_size, file_type, original_name, review_remark, review_time,
    reviewer_id, reviewer_name, status, user_id, username, related_id
)
SELECT '2026-05-10 08:31:00', '/uploads/reviews/2026/05/demo-review-02.webp', 17512, 'IMAGE',
       'review-detail-02.webp', '评价配图已审核通过', '2026-05-10 08:36:00',
       1, 'admin', 1, 2, 'zhangsan', 1
WHERE NOT EXISTS (SELECT 1 FROM tb_upload_file WHERE file_path = '/uploads/reviews/2026/05/demo-review-02.webp');

INSERT INTO tb_upload_file (
    created_time, file_path, file_size, file_type, original_name, review_remark, review_time,
    reviewer_id, reviewer_name, status, user_id, username, related_id
)
SELECT '2026-05-10 08:32:00', '/uploads/reviews/2026/05/demo-review-03.webp', 17486, 'IMAGE',
       'review-detail-03.webp', '评价配图已审核通过', '2026-05-10 08:37:00',
       1, 'admin', 1, 2, 'zhangsan', 1
WHERE NOT EXISTS (SELECT 1 FROM tb_upload_file WHERE file_path = '/uploads/reviews/2026/05/demo-review-03.webp');

INSERT INTO tb_upload_file (
    created_time, file_path, file_size, file_type, original_name, review_remark, review_time,
    reviewer_id, reviewer_name, status, user_id, username, related_id
)
SELECT '2026-05-10 08:33:00', '/uploads/reviews/2026/05/demo-review-04.webp', 18002, 'IMAGE',
       'review-detail-04.webp', '评价配图已审核通过', '2026-05-10 08:38:00',
       1, 'admin', 1, 2, 'zhangsan', 1
WHERE NOT EXISTS (SELECT 1 FROM tb_upload_file WHERE file_path = '/uploads/reviews/2026/05/demo-review-04.webp');

COMMIT;
