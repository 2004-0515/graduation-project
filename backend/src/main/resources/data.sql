-- =====================================================
-- 购物商城初始数据脚本
-- =====================================================

USE shopping_mall;

-- =====================================================
-- 插入测试用户
-- 密码: test123456 (BCrypt加密)
-- 可用账号: admin / testuser / demo，密码都是 test123456
-- =====================================================
INSERT INTO tb_user (username, password, email, phone, nickname, avatar, bio, points, growth_value, member_days, status) VALUES
('admin', '$2a$10$Z3dt/05IIDpRxISAgrx/NutBkRDGKm0IJ/x0/9ZMnjkkSePKo6bWu', 'admin@menggo.com', '13800138000', '管理员', 'https://picsum.photos/200/200?random=1', '系统管理员', 10000, 5000, 365, 1),
('testuser', '$2a$10$Z3dt/05IIDpRxISAgrx/NutBkRDGKm0IJ/x0/9ZMnjkkSePKo6bWu', 'test@menggo.com', '13800138001', '测试用户', 'https://picsum.photos/200/200?random=2', '我是测试用户', 500, 200, 30, 1),
('demo', '$2a$10$Z3dt/05IIDpRxISAgrx/NutBkRDGKm0IJ/x0/9ZMnjkkSePKo6bWu', 'demo@menggo.com', '13800138002', '演示账号', 'https://picsum.photos/200/200?random=3', '演示账号', 100, 50, 7, 1);

-- =====================================================
-- 插入商品分类
-- =====================================================
INSERT INTO tb_category (name, description, parent_id, sort_order, icon, status) VALUES
('手机数码', '各种品牌手机、电脑、数码产品', 0, 1, 'https://picsum.photos/200/200?random=10', 1),
('家用电器', '冰箱、洗衣机、空调等家用电器', 0, 2, 'https://picsum.photos/200/200?random=11', 1),
('服装鞋帽', '时尚服装、鞋帽配饰', 0, 3, 'https://picsum.photos/200/200?random=12', 1),
('美妆护肤', '各种品牌化妆品、护肤品', 0, 4, 'https://picsum.photos/200/200?random=13', 1),
('食品饮料', '零食、饮料、生鲜食品', 0, 5, 'https://picsum.photos/200/200?random=14', 1),
('图书音像', '各种图书、音像制品', 0, 6, 'https://picsum.photos/200/200?random=15', 1);

-- =====================================================
-- 插入商品数据（设置不同的创建时间以区分新品）
-- =====================================================
INSERT INTO tb_product (name, description, category_id, price, original_price, stock, sales, status, main_image, images, created_time) VALUES
-- 手机数码（较早上架）
('iPhone 15 Pro Max', 'Apple iPhone 15 Pro Max 256GB 原色钛金属，A17 Pro芯片，钛金属设计', 1, 9999.00, 10999.00, 500, 1234, 1, 'https://picsum.photos/400/400?random=101', '["https://picsum.photos/400/400?random=101","https://picsum.photos/400/400?random=102"]', '2025-12-01 10:00:00'),
('华为 Mate 60 Pro', '华为Mate60 Pro 12GB+512GB 雅丹黑，麒麟9000S芯片，卫星通话', 1, 6999.00, 7999.00, 300, 2345, 1, 'https://picsum.photos/400/400?random=103', '["https://picsum.photos/400/400?random=103","https://picsum.photos/400/400?random=104"]', '2025-12-02 14:30:00'),
('小米14 Ultra', '小米14 Ultra 16GB+512GB 黑色，骁龙8 Gen3，徕卡光学镜头', 1, 5999.00, 6499.00, 400, 3456, 1, 'https://picsum.photos/400/400?random=105', '["https://picsum.photos/400/400?random=105","https://picsum.photos/400/400?random=106"]', '2025-12-05 09:15:00'),
('MacBook Pro 14', 'Apple MacBook Pro 14英寸 M3 Pro芯片 18GB+512GB 深空黑', 1, 14999.00, 16999.00, 200, 876, 1, 'https://picsum.photos/400/400?random=107', '["https://picsum.photos/400/400?random=107","https://picsum.photos/400/400?random=108"]', '2025-12-08 16:00:00'),
('iPad Pro 12.9', 'Apple iPad Pro 12.9英寸 M2芯片 256GB WiFi版 深空灰', 1, 8499.00, 9499.00, 350, 654, 1, 'https://picsum.photos/400/400?random=109', '["https://picsum.photos/400/400?random=109","https://picsum.photos/400/400?random=110"]', '2025-12-10 11:30:00'),

-- 家用电器（中期上架）
('海尔冰箱 BCD-470', '海尔470升十字对开门冰箱 一级能效 风冷无霜', 2, 4599.00, 5299.00, 150, 432, 1, 'https://picsum.photos/400/400?random=111', '["https://picsum.photos/400/400?random=111","https://picsum.photos/400/400?random=112"]', '2025-12-12 08:00:00'),
('美的空调 KFR-35GW', '美的1.5匹变频冷暖空调 一级能效 智能WiFi控制', 2, 2999.00, 3499.00, 280, 765, 1, 'https://picsum.photos/400/400?random=113', '["https://picsum.photos/400/400?random=113","https://picsum.photos/400/400?random=114"]', '2025-12-14 13:45:00'),
('西门子洗衣机 WM12', '西门子10公斤滚筒洗衣机 变频电机 智能投放', 2, 3899.00, 4599.00, 180, 543, 1, 'https://picsum.photos/400/400?random=115', '["https://picsum.photos/400/400?random=115","https://picsum.photos/400/400?random=116"]', '2025-12-16 10:20:00'),
('戴森吸尘器 V15', '戴森V15 Detect无绳吸尘器 激光探测 智能显示', 2, 4990.00, 5490.00, 120, 321, 1, 'https://picsum.photos/400/400?random=117', '["https://picsum.photos/400/400?random=117","https://picsum.photos/400/400?random=118"]', '2025-12-18 15:00:00'),

-- 服装鞋帽（较新上架）
('Nike Air Max 270', 'Nike Air Max 270 男子运动鞋 气垫缓震 透气舒适', 3, 899.00, 1199.00, 500, 2134, 1, 'https://picsum.photos/400/400?random=119', '["https://picsum.photos/400/400?random=119","https://picsum.photos/400/400?random=120"]', '2025-12-20 09:00:00'),
('Adidas Ultraboost', 'Adidas Ultraboost 22 跑步鞋 Boost中底 轻量回弹', 3, 1099.00, 1499.00, 400, 1876, 1, 'https://picsum.photos/400/400?random=121', '["https://picsum.photos/400/400?random=121","https://picsum.photos/400/400?random=122"]', '2025-12-21 14:30:00'),
('优衣库羽绒服', '优衣库高级轻型羽绒服 90%白鸭绒 轻薄保暖', 3, 499.00, 699.00, 600, 3245, 1, 'https://picsum.photos/400/400?random=123', '["https://picsum.photos/400/400?random=123","https://picsum.photos/400/400?random=124"]', '2025-12-22 11:00:00'),

-- 美妆护肤（新品）
('SK-II神仙水', 'SK-II护肤精华露 230ml 改善肤质 细腻毛孔', 4, 1590.00, 1790.00, 200, 987, 1, 'https://picsum.photos/400/400?random=125', '["https://picsum.photos/400/400?random=125","https://picsum.photos/400/400?random=126"]', '2025-12-24 10:00:00'),
('兰蔻小黑瓶', '兰蔻小黑瓶精华肌底液 100ml 修护肌肤 提亮肤色', 4, 1280.00, 1480.00, 250, 1234, 1, 'https://picsum.photos/400/400?random=127', '["https://picsum.photos/400/400?random=127","https://picsum.photos/400/400?random=128"]', '2025-12-25 09:30:00'),
('雅诗兰黛眼霜', '雅诗兰黛小棕瓶眼霜 15ml 淡化细纹 紧致眼周', 4, 590.00, 690.00, 300, 876, 1, 'https://picsum.photos/400/400?random=129', '["https://picsum.photos/400/400?random=129","https://picsum.photos/400/400?random=130"]', '2025-12-26 14:00:00'),

-- 食品饮料（热销+新品）
('三只松鼠坚果礼盒', '三只松鼠坚果大礼包 1428g 8袋装 年货礼盒', 5, 128.00, 168.00, 1000, 5432, 1, 'https://picsum.photos/400/400?random=131', '["https://picsum.photos/400/400?random=131","https://picsum.photos/400/400?random=132"]', '2025-12-27 08:00:00'),
('农夫山泉矿泉水', '农夫山泉天然矿泉水 550ml*24瓶 整箱装', 5, 39.90, 49.90, 2000, 8765, 1, 'https://picsum.photos/400/400?random=133', '["https://picsum.photos/400/400?random=133","https://picsum.photos/400/400?random=134"]', '2025-12-15 12:00:00'),
('星巴克咖啡豆', '星巴克派克市场烘焙咖啡豆 1.13kg 中度烘焙', 5, 198.00, 238.00, 500, 2134, 1, 'https://picsum.photos/400/400?random=135', '["https://picsum.photos/400/400?random=135","https://picsum.photos/400/400?random=136"]', '2025-12-28 10:00:00'),

-- 图书音像（最新上架）
('三体全集', '刘慈欣《三体》全集 典藏版 科幻小说', 6, 99.00, 128.00, 800, 4321, 1, 'https://picsum.photos/400/400?random=137', '["https://picsum.photos/400/400?random=137","https://picsum.photos/400/400?random=138"]', '2025-12-28 16:00:00'),
('人类简史', '尤瓦尔·赫拉利《人类简史》从动物到上帝', 6, 68.00, 88.00, 600, 3456, 1, 'https://picsum.photos/400/400?random=139', '["https://picsum.photos/400/400?random=139","https://picsum.photos/400/400?random=140"]', '2025-12-29 09:00:00');

-- =====================================================
-- 插入测试用户的收货地址
-- =====================================================
INSERT INTO addresses (user_id, name, phone, province, city, district, detail, is_default, status) VALUES
(2, '张三', '13800138001', '北京市', '北京市', '朝阳区', '科技园区88号A座1001室', TRUE, 1),
(2, '李四', '13800138002', '上海市', '上海市', '浦东新区', '陆家嘴金融中心B座2002室', FALSE, 1),
(3, '王五', '13800138003', '广东省', '深圳市', '南山区', '科技园南区T3栋3003室', TRUE, 1);

-- =====================================================
-- 插入用户设置
-- =====================================================
INSERT INTO security_settings (user_id, password_last_changed) VALUES
(1, NOW()),
(2, NOW()),
(3, NOW());

INSERT INTO privacy_settings (user_id, profile_visibility) VALUES
(1, 'public'),
(2, 'public'),
(3, 'private');

INSERT INTO notification_settings (user_id, order_status_enabled, delivery_enabled, promotions_enabled, new_products_enabled, system_enabled, in_app_enabled, email_enabled, sms_enabled, notification_frequency, notify_start_time, notify_end_time) VALUES
(1, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, 'immediate', 8, 22),
(2, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, 'immediate', 9, 21),
(3, TRUE, TRUE, FALSE, FALSE, TRUE, TRUE, FALSE, FALSE, 'daily', 10, 20);


-- =====================================================
-- 插入优惠券数据
-- =====================================================
INSERT INTO tb_coupon (name, description, type, discount_amount, discount_rate, min_amount, max_discount, total_count, claimed_count, limit_per_user, start_time, end_time, status, created_time, updated_time) VALUES
('新人专享券', '新用户首单立减20元', 1, 20.00, NULL, 100.00, NULL, 1000, 0, 1, '2025-01-01 00:00:00', '2025-12-31 23:59:59', 1, NOW(), NOW()),
('满300减50', '满300元立减50元', 1, 50.00, NULL, 300.00, NULL, 500, 0, 2, '2025-01-01 00:00:00', '2025-12-31 23:59:59', 1, NOW(), NOW()),
('满500减100', '满500元立减100元', 1, 100.00, NULL, 500.00, NULL, 200, 0, 1, '2025-01-01 00:00:00', '2025-12-31 23:59:59', 1, NOW(), NOW()),
('8折优惠券', '全场商品8折优惠，最高优惠200元', 2, NULL, 0.80, 200.00, 200.00, 300, 0, 1, '2025-01-01 00:00:00', '2025-12-31 23:59:59', 1, NOW(), NOW()),
('无门槛10元券', '无门槛立减10元', 3, 10.00, NULL, 0.00, NULL, 2000, 0, 3, '2025-01-01 00:00:00', '2025-12-31 23:59:59', 1, NOW(), NOW());
