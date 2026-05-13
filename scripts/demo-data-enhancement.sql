-- Demo data enhancement for the dedicated demo database.
-- Purpose:
--   1. Improve demo-critical product detail pages with gallery images and ad videos.
--   2. Ensure top-exposure products have enough reviews, review images, and seller replies.
--   3. Keep inserts replayable by using fixed order numbers and guarded INSERT ... WHERE NOT EXISTS logic.
--
-- Recommended usage:
--   powershell -ExecutionPolicy Bypass -File scripts/apply-demo-data-enhancement.ps1
-- Direct usage:
--   mysql -u root -p shopping_mall_demo < scripts/demo-data-enhancement.sql

START TRANSACTION;

DROP TEMPORARY TABLE IF EXISTS demo_product_media;
CREATE TEMPORARY TABLE demo_product_media (
    product_id BIGINT PRIMARY KEY,
    images_json TEXT NOT NULL,
    ad_video VARCHAR(500) NULL,
    ad_video_duration INT NULL,
    ad_video_enabled TINYINT NOT NULL DEFAULT 0,
    created_time DATETIME NOT NULL
);

INSERT INTO demo_product_media (product_id, images_json, ad_video, ad_video_duration, ad_video_enabled, created_time) VALUES
(45, '["/uploads/products/食品饮料/2026/04/294f4d2b-3ca5-4f1a-8c11-83aa30e90b9d.webp","/uploads/products/食品饮料/2026/04/02867ded-e6c7-4ec2-9665-27f06168156c.webp","/uploads/products/食品饮料/2026/01/0f354d4a-b282-4bbc-9c13-07428da8aeee.webp"]', '/uploads/videos/2026/01/7e59abdf-d701-4661-9d39-5cc25282ccc1.mp4', 6, 1, '2026-05-12 10:15:00'),
(46, '["/uploads/products/食品饮料/2026/04/827d0361-11c5-4adc-99a5-f69929ba1820.webp","/uploads/products/食品饮料/2026/04/27187590-0a47-40df-b944-0996c5ea5ae9.webp","/uploads/products/食品饮料/2026/04/02867ded-e6c7-4ec2-9665-27f06168156c.webp"]', '/uploads/videos/2026/01/35c849d2-77d5-405f-96cb-a6aec24b6494.mp4', 6, 1, '2026-05-11 14:30:00'),
(25, '["/uploads/products/家用电器/2026/04/af53d474-fdfd-4c4f-b17c-fbcf629dd275.webp","/uploads/products/家用电器/2026/04/aa272347-8c2b-4faf-bcd1-60023fcc6778.webp","/uploads/products/家用电器/2026/04/75174a31-3332-4e32-9096-cab42d8abed7.webp"]', '/uploads/videos/2026/01/1dcc0a56-d7c5-4f9d-92b5-d1e53dc20704.mp4', 8, 1, '2026-05-10 09:20:00'),
(40, '["/uploads/products/美妆护肤/2026/04/74719003-2d4f-4516-bca6-9c81274307af.webp","/uploads/products/美妆护肤/2026/04/6e3133f9-3426-480b-9eb8-a0293e5057c1.webp","/uploads/products/美妆护肤/2026/04/67bb03b2-fbd7-4c61-86d9-bc02d7ce3f32.webp"]', '/uploads/videos/2025/12/77fa78d8-2510-4153-a284-d30ea535304a.mp4', 7, 1, '2026-05-09 16:40:00'),
(24, '["/uploads/products/家用电器/2026/04/630ac5c4-5224-449b-aac2-2767094b4675.webp","/uploads/products/家用电器/2026/04/3366b400-7a5d-4d90-95ca-5a0cfa3c164b.webp","/uploads/products/家用电器/2026/04/e0fd4bda-0239-496d-b0bc-ae078eaff0cd.webp"]', NULL, NULL, 0, '2026-05-08 11:00:00'),
(44, '["/uploads/products/食品饮料/2026/04/27187590-0a47-40df-b944-0996c5ea5ae9.webp","/uploads/products/食品饮料/2026/04/827d0361-11c5-4adc-99a5-f69929ba1820.webp","/uploads/products/食品饮料/2026/04/02867ded-e6c7-4ec2-9665-27f06168156c.webp"]', NULL, NULL, 0, '2026-05-07 13:25:00'),
(15, '["/uploads/products/数码电子/2026/04/69d7a1f8-7a67-4a70-9845-88be8e2f775b.webp","/uploads/products/数码电子/2026/04/231ab70b-c664-451a-83c5-a41b437822ee.webp","/uploads/products/数码电子/2026/04/1bdf4e4d-30a7-4dd3-aa87-702c1e538c7c.webp"]', '/uploads/videos/2025/12/67d634a3-ce8a-4a96-bbb9-892602000f76.mp4', 6, 1, '2026-05-06 18:10:00'),
(51, '["/uploads/products/图书文娱/2026/04/46338869-0a0a-4a76-a0ef-e8d990100d2c.webp","/uploads/products/图书文娱/2026/04/91d2cff1-af1c-4cb3-ac94-33976fd6067a.webp","/uploads/products/图书文娱/2026/04/10f4bcdd-efac-4134-a7e0-bd715cf3cda2.webp"]', NULL, NULL, 0, '2026-05-05 09:45:00');

UPDATE tb_product p
JOIN demo_product_media d ON d.product_id = p.id
SET p.images = d.images_json,
    p.ad_video = d.ad_video,
    p.ad_video_duration = d.ad_video_duration,
    p.ad_video_enabled = d.ad_video_enabled,
    p.created_time = d.created_time,
    p.updated_time = GREATEST(COALESCE(p.updated_time, d.created_time), d.created_time);

UPDATE tb_user
SET avatar = '/uploads/avatars/2026/03/e13aab6f-3360-47df-9ca9-cffec7c4e233.jpg'
WHERE id IN (10, 12, 16) AND (avatar IS NULL OR avatar = '');

UPDATE tb_user
SET avatar = '/uploads/avatars/2025/12/4ade804c-8c1a-44b5-a91e-c0339dce67b4.jpg'
WHERE id IN (11, 13, 17) AND (avatar IS NULL OR avatar = '');

DROP TEMPORARY TABLE IF EXISTS demo_review_seed;
CREATE TEMPORARY TABLE demo_review_seed (
    order_no VARCHAR(50) PRIMARY KEY,
    user_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    rating INT NOT NULL,
    content VARCHAR(500) NOT NULL,
    images_json TEXT NULL,
    reply_text VARCHAR(500) NULL,
    created_time DATETIME NOT NULL
);

INSERT INTO demo_review_seed (order_no, user_id, product_id, rating, content, images_json, reply_text, created_time) VALUES
('DEMO-2026-0513-001', 10, 45, 5, '冰镇后口感很稳定，日期新，适合聚餐和囤货。', '["/uploads/products/食品饮料/2026/04/294f4d2b-3ca5-4f1a-8c11-83aa30e90b9d.webp"]', '感谢反馈，这一批次支持整箱直发，后续会继续保证日期和包装。', '2026-05-13 09:10:00'),
('DEMO-2026-0513-002', 11, 46, 5, '早餐配麦片很方便，箱体完整，没有压坏。', '["/uploads/products/食品饮料/2026/04/827d0361-11c5-4adc-99a5-f69929ba1820.webp"]', '谢谢认可，仓库已针对牛奶类商品加强外箱缓冲。', '2026-05-13 09:20:00'),
('DEMO-2026-0513-003', 12, 46, 4, '奶味比较醇，发货速度快，适合家庭常备。', NULL, NULL, '2026-05-13 09:30:00'),
('DEMO-2026-0513-004', 13, 25, 5, '火力够用，日常炒菜加热很快，按键也直观。', '["/uploads/products/家用电器/2026/04/af53d474-fdfd-4c4f-b17c-fbcf629dd275.webp"]', '感谢支持，后续如需锅具搭配建议可以随时咨询。', '2026-05-13 09:40:00'),
('DEMO-2026-0513-005', 14, 25, 4, '租房使用很合适，体积不大，收纳方便。', NULL, NULL, '2026-05-13 09:50:00'),
('DEMO-2026-0513-006', 15, 40, 5, '补水效果在线，敷完第二天上妆更服帖。', '["/uploads/products/美妆护肤/2026/04/74719003-2d4f-4516-bca6-9c81274307af.webp"]', '感谢分享，活动期下单的面膜批次都是近期到仓的新货。', '2026-05-13 10:00:00'),
('DEMO-2026-0513-007', 16, 24, 5, '锅体厚实，导热均匀，适合做家常菜。', '["/uploads/products/家用电器/2026/04/630ac5c4-5224-449b-aac2-2767094b4675.webp"]', '感谢好评，这款炒锅目前是厨房类热销款，售后也支持换新。', '2026-05-13 10:10:00'),
('DEMO-2026-0513-008', 17, 44, 4, '口感中规中矩，家庭日常消耗挺合适。', NULL, NULL, '2026-05-13 10:20:00'),
('DEMO-2026-0513-009', 18, 15, 5, '佩戴轻，消息提醒和运动记录都比较顺手。', '["/uploads/products/数码电子/2026/04/69d7a1f8-7a67-4a70-9845-88be8e2f775b.webp"]', '感谢反馈，已经为这款手环补充了更完整的商品图和视频展示。', '2026-05-13 10:30:00'),
('DEMO-2026-0513-010', 10, 15, 4, '续航够日常通勤，表带佩戴也比较舒服。', NULL, NULL, '2026-05-13 10:40:00'),
('DEMO-2026-0513-011', 11, 40, 4, '精华量足，连续用几次后皮肤状态更稳定。', NULL, NULL, '2026-05-13 10:50:00'),
('DEMO-2026-0513-012', 12, 24, 4, '锅底受热比较均匀，清洗也不费力。', NULL, NULL, '2026-05-13 11:00:00'),
('DEMO-2026-0513-013', 13, 44, 5, '生产日期新，奶香味自然，早餐搭配方便。', '["/uploads/products/食品饮料/2026/04/27187590-0a47-40df-b944-0996c5ea5ae9.webp"]', '感谢支持，我们会持续补充乳品类实拍图和评价。', '2026-05-13 11:10:00'),
('DEMO-2026-0513-014', 14, 45, 4, '整箱包装稳，补货速度快，办公室囤一些很方便。', NULL, NULL, '2026-05-13 11:20:00');

INSERT INTO tb_order (
    order_no,
    user_id,
    total_amount,
    pay_amount,
    payment_method,
    payment_status,
    order_status,
    shipping_address,
    payment_time,
    shipping_time,
    end_time,
    remark,
    created_time,
    updated_time,
    coupon_discount,
    coupon_id
)
SELECT
    s.order_no,
    s.user_id,
    p.price,
    p.price,
    1,
    1,
    3,
    CONCAT('演示地址-', s.user_id, '-商品', s.product_id),
    s.created_time,
    DATE_ADD(s.created_time, INTERVAL 6 HOUR),
    DATE_ADD(s.created_time, INTERVAL 2 DAY),
    'demo-enhancement',
    s.created_time,
    DATE_ADD(s.created_time, INTERVAL 2 DAY),
    0,
    NULL
FROM demo_review_seed s
JOIN tb_product p ON p.id = s.product_id
WHERE NOT EXISTS (
    SELECT 1
    FROM tb_order o
    WHERE o.order_no = s.order_no
);

INSERT INTO tb_order_item (
    order_id,
    product_id,
    product_name,
    product_price,
    quantity,
    total_price,
    product_image,
    seller_id,
    seller_name,
    ship_status,
    ship_time,
    created_time,
    updated_time
)
SELECT
    o.id,
    p.id,
    p.name,
    p.price,
    1,
    p.price,
    p.main_image,
    p.seller_id,
    p.seller_name,
    1,
    DATE_ADD(s.created_time, INTERVAL 6 HOUR),
    s.created_time,
    DATE_ADD(s.created_time, INTERVAL 1 DAY)
FROM demo_review_seed s
JOIN tb_order o ON o.order_no = s.order_no
JOIN tb_product p ON p.id = s.product_id
WHERE NOT EXISTS (
    SELECT 1
    FROM tb_order_item oi
    WHERE oi.order_id = o.id
      AND oi.product_id = p.id
);

INSERT INTO tb_review (
    is_anonymous,
    content,
    created_time,
    images,
    order_id,
    order_item_id,
    product_id,
    rating,
    reply,
    reply_time,
    user_id
)
SELECT
    b'0',
    s.content,
    s.created_time,
    s.images_json,
    o.id,
    oi.id,
    s.product_id,
    s.rating,
    s.reply_text,
    CASE WHEN s.reply_text IS NULL OR s.reply_text = '' THEN NULL ELSE DATE_ADD(s.created_time, INTERVAL 1 DAY) END,
    s.user_id
FROM demo_review_seed s
JOIN tb_order o ON o.order_no = s.order_no
JOIN tb_order_item oi ON oi.order_id = o.id AND oi.product_id = s.product_id
WHERE NOT EXISTS (
    SELECT 1
    FROM tb_review r
    WHERE r.order_id = o.id
      AND r.product_id = s.product_id
      AND r.user_id = s.user_id
);

SELECT 'products_with_demo_video' AS item, COUNT(*) AS affected_rows
FROM tb_product
WHERE id IN (SELECT product_id FROM demo_product_media)
  AND ad_video_enabled = 1
  AND ad_video IS NOT NULL
  AND ad_video <> '';

SELECT 'demo_orders_present' AS item, COUNT(*) AS affected_rows
FROM tb_order
WHERE order_no LIKE 'DEMO-2026-0513-%';

SELECT 'demo_reviews_present' AS item, COUNT(*) AS affected_rows
FROM tb_review
WHERE order_id IN (
    SELECT id
    FROM tb_order
    WHERE order_no LIKE 'DEMO-2026-0513-%'
);

COMMIT;
