-- =====================================================
-- 数据重置脚本
-- 删除所有数据（保留用户表），插入符合业务逻辑的新数据
-- 执行方式: mysql -u root -p shopping_mall < reset_data.sql
-- =====================================================

USE shopping_mall;

-- =====================================================
-- 第一步：按外键依赖顺序删除所有数据（保留用户表）
-- =====================================================
SET FOREIGN_KEY_CHECKS = 0;

-- 删除评价
DELETE FROM tb_review;

-- 删除上传文件记录
DELETE FROM tb_upload_file;

-- 删除价格提醒
DELETE FROM tb_price_alert;

-- 删除价格历史
DELETE FROM tb_price_history;

-- 删除用户优惠券
DELETE FROM tb_user_coupon;

-- 删除优惠券
DELETE FROM tb_coupon;

-- 删除通知
DELETE FROM notifications;

-- 删除订单项
DELETE FROM tb_order_item;

-- 删除订单
DELETE FROM tb_order;

-- 删除购物车
DELETE FROM tb_cart;

-- 删除商品
DELETE FROM tb_product;

-- 删除分类
DELETE FROM tb_category;

-- 删除收货地址
DELETE FROM addresses;

-- 删除设置表
DELETE FROM security_settings;
DELETE FROM privacy_settings;
DELETE FROM notification_settings;

-- 删除音乐
DELETE FROM music;

SET FOREIGN_KEY_CHECKS = 1;

-- 重置自增ID
ALTER TABLE tb_review AUTO_INCREMENT = 1;
ALTER TABLE tb_upload_file AUTO_INCREMENT = 1;
ALTER TABLE tb_price_alert AUTO_INCREMENT = 1;
ALTER TABLE tb_price_history AUTO_INCREMENT = 1;
ALTER TABLE tb_user_coupon AUTO_INCREMENT = 1;
ALTER TABLE tb_coupon AUTO_INCREMENT = 1;
ALTER TABLE notifications AUTO_INCREMENT = 1;
ALTER TABLE tb_order_item AUTO_INCREMENT = 1;
ALTER TABLE tb_order AUTO_INCREMENT = 1;
ALTER TABLE tb_cart AUTO_INCREMENT = 1;
ALTER TABLE tb_product AUTO_INCREMENT = 1;
ALTER TABLE tb_category AUTO_INCREMENT = 1;
ALTER TABLE addresses AUTO_INCREMENT = 1;
ALTER TABLE security_settings AUTO_INCREMENT = 1;
ALTER TABLE privacy_settings AUTO_INCREMENT = 1;
ALTER TABLE notification_settings AUTO_INCREMENT = 1;
ALTER TABLE music AUTO_INCREMENT = 1;

-- =====================================================
-- 第二步：插入商品分类
-- =====================================================
INSERT INTO tb_category (id, name, description, parent_id, sort_order, icon, status) VALUES
(1, '手机数码', '手机、电脑、平板等数码产品', 0, 1, '/uploads/categories/digital.jpg', 1),
(2, '家用电器', '冰箱、洗衣机、空调等家电', 0, 2, '/uploads/categories/appliance.jpg', 1),
(3, '服装鞋帽', '男装、女装、鞋子、配饰', 0, 3, '/uploads/categories/clothing.jpg', 1),
(4, '美妆护肤', '护肤品、彩妆、香水', 0, 4, '/uploads/categories/beauty.jpg', 1),
(5, '食品饮料', '零食、饮料、生鲜', 0, 5, '/uploads/categories/food.jpg', 1),
(6, '图书文具', '图书、文具、办公用品', 0, 6, '/uploads/categories/books.jpg', 1);

-- =====================================================
-- 第三步：插入商品数据
-- 卖家分配：zhangsan(2)=1-10, lisi(3)=11-20, wangwu(4)=21-30, zhaoliu(5)=31-40, sunqi(6)=41-50
-- 审核状态：1=已通过（大部分），0=待审核（少量），2=已拒绝（少量）
-- =====================================================
INSERT INTO tb_product (id, name, description, category_id, price, original_price, stock, sales, status, main_image, seller_id, seller_name, audit_status, created_time) VALUES
-- zhangsan(ID=2) 的商品 (1-10)
(1, 'iPhone 15 Pro Max 256GB', 'Apple最新旗舰手机，A17 Pro芯片，钛金属设计，超强拍照能力', 1, 9999.00, 10999.00, 100, 256, 1, '/uploads/products/iphone15.jpg', 2, 'zhangsan', 1, '2025-11-01 10:00:00'),
(2, '华为Mate 60 Pro', '麒麟9000S芯片，卫星通话，昆仑玻璃，超可靠品质', 1, 6999.00, 7999.00, 80, 189, 1, '/uploads/products/mate60.jpg', 2, 'zhangsan', 1, '2025-11-05 14:30:00'),
(3, '小米14 Ultra', '骁龙8 Gen3，徕卡光学镜头，专业影像旗舰', 1, 5999.00, 6499.00, 120, 312, 1, '/uploads/products/mi14.jpg', 2, 'zhangsan', 1, '2025-11-10 09:00:00'),
(4, 'MacBook Pro 14英寸', 'M3 Pro芯片，18GB内存，专业创作利器', 1, 14999.00, 16999.00, 50, 87, 1, '/uploads/products/macbook.jpg', 2, 'zhangsan', 1, '2025-11-15 16:00:00'),
(5, 'iPad Pro 12.9英寸', 'M2芯片，Liquid视网膜XDR显示屏，创意无限', 1, 8499.00, 9499.00, 60, 134, 1, '/uploads/products/ipadpro.jpg', 2, 'zhangsan', 1, '2025-11-20 11:00:00'),
(6, 'AirPods Pro 2', '主动降噪，自适应音频，MagSafe充电盒', 1, 1899.00, 1999.00, 200, 567, 1, '/uploads/products/airpods.jpg', 2, 'zhangsan', 1, '2025-11-25 08:30:00'),
(7, 'Apple Watch Ultra 2', '钛金属表壳，双频GPS，极限运动伴侣', 1, 6499.00, 6999.00, 40, 45, 1, '/uploads/products/watchultra.jpg', 2, 'zhangsan', 1, '2025-12-01 10:00:00'),
(8, 'Sony WH-1000XM5', '业界顶级降噪耳机，30小时续航', 1, 2699.00, 2999.00, 80, 234, 1, '/uploads/products/sony.jpg', 2, 'zhangsan', 1, '2025-12-05 14:00:00'),
(9, '任天堂Switch OLED', '7英寸OLED屏幕，便携游戏主机', 1, 2299.00, 2499.00, 100, 456, 1, '/uploads/products/switch.jpg', 2, 'zhangsan', 1, '2025-12-10 09:30:00'),
(10, 'DJI Mini 4 Pro', '4K HDR视频，全向避障，轻巧便携无人机', 1, 5788.00, 6188.00, 30, 67, 1, '/uploads/products/dji.jpg', 2, 'zhangsan', 1, '2025-12-15 15:00:00'),

-- lisi(ID=3) 的商品 (11-20)
(11, '海尔冰箱 BCD-470', '470升十字对开门，一级能效，风冷无霜', 2, 4599.00, 5299.00, 40, 123, 1, '/uploads/products/haier.jpg', 3, 'lisi', 1, '2025-11-02 08:00:00'),
(12, '美的空调 KFR-35GW', '1.5匹变频冷暖，一级能效，智能WiFi', 2, 2999.00, 3499.00, 60, 234, 1, '/uploads/products/midea.jpg', 3, 'lisi', 1, '2025-11-08 13:00:00'),
(13, '西门子洗衣机 WM12', '10公斤滚筒，变频电机，智能投放', 2, 3899.00, 4599.00, 35, 89, 1, '/uploads/products/siemens.jpg', 3, 'lisi', 1, '2025-11-12 10:30:00'),
(14, '戴森吸尘器 V15', '激光探测灰尘，智能显示，强劲吸力', 2, 4990.00, 5490.00, 45, 156, 1, '/uploads/products/dyson.jpg', 3, 'lisi', 1, '2025-11-18 16:00:00'),
(15, '松下电饭煲 SR-HQ153', '5段IH加热，备长炭内胆，米饭更香', 2, 1299.00, 1499.00, 80, 345, 1, '/uploads/products/panasonic.jpg', 3, 'lisi', 1, '2025-11-22 09:00:00'),
(16, '博世洗碗机 SJV68', '13套大容量，智能烘干，静音设计', 2, 5999.00, 6999.00, 25, 56, 1, '/uploads/products/bosch.jpg', 3, 'lisi', 1, '2025-11-28 14:30:00'),
(17, '飞利浦空气净化器', 'HEPA滤网，除甲醛，智能监测', 2, 2499.00, 2999.00, 50, 178, 1, '/uploads/products/philips.jpg', 3, 'lisi', 1, '2025-12-02 11:00:00'),
(18, '小米扫地机器人', '激光导航，自动集尘，智能规划', 2, 2499.00, 2799.00, 70, 289, 1, '/uploads/products/mirobot.jpg', 3, 'lisi', 1, '2025-12-08 08:30:00'),
(19, '格力电风扇', '直流变频，静音舒适，遥控定时', 2, 399.00, 499.00, 150, 567, 1, '/uploads/products/gree.jpg', 3, 'lisi', 1, '2025-12-12 15:00:00'),
(20, '九阳破壁机', '高速破壁，多功能料理，易清洗', 2, 699.00, 899.00, 90, 234, 1, '/uploads/products/joyoung.jpg', 3, 'lisi', 1, '2025-12-18 10:00:00'),

-- wangwu(ID=4) 的商品 (21-30)
(21, 'Nike Air Max 270', '气垫缓震，透气舒适，经典配色', 3, 899.00, 1199.00, 200, 678, 1, '/uploads/products/nike270.jpg', 4, 'wangwu', 1, '2025-11-03 09:00:00'),
(22, 'Adidas Ultraboost', 'Boost中底，轻量回弹，跑步首选', 3, 1099.00, 1499.00, 150, 456, 1, '/uploads/products/ultraboost.jpg', 4, 'wangwu', 1, '2025-11-09 14:00:00'),
(23, '优衣库羽绒服', '90%白鸭绒，轻薄保暖，多色可选', 3, 499.00, 699.00, 300, 890, 1, '/uploads/products/uniqlo.jpg', 4, 'wangwu', 1, '2025-11-14 10:30:00'),
(24, 'Levi''s 501牛仔裤', '经典直筒，原色丹宁，百搭款式', 3, 599.00, 799.00, 180, 345, 1, '/uploads/products/levis.jpg', 4, 'wangwu', 1, '2025-11-20 16:00:00'),
(25, 'The North Face冲锋衣', 'Gore-Tex防水，透气保暖，户外必备', 3, 1999.00, 2499.00, 80, 123, 1, '/uploads/products/tnf.jpg', 4, 'wangwu', 1, '2025-11-25 09:00:00'),
(26, 'New Balance 574', '复古跑鞋，舒适缓震，街头潮流', 3, 699.00, 899.00, 160, 567, 1, '/uploads/products/nb574.jpg', 4, 'wangwu', 1, '2025-12-01 13:30:00'),
(27, 'Champion卫衣', '经典Logo，纯棉面料，休闲百搭', 3, 399.00, 499.00, 250, 789, 1, '/uploads/products/champion.jpg', 4, 'wangwu', 1, '2025-12-06 10:00:00'),
(28, 'Converse帆布鞋', '经典款式，百年传承，潮流永恒', 3, 399.00, 499.00, 200, 654, 1, '/uploads/products/converse.jpg', 4, 'wangwu', 1, '2025-12-11 15:00:00'),
(29, 'Zara西装外套', '修身剪裁，商务休闲，品质面料', 3, 799.00, 999.00, 100, 234, 1, '/uploads/products/zara.jpg', 4, 'wangwu', 1, '2025-12-16 09:30:00'),
(30, 'H&M基础T恤3件装', '纯棉舒适，基础款式，性价比高', 3, 149.00, 199.00, 400, 1234, 1, '/uploads/products/hm.jpg', 4, 'wangwu', 1, '2025-12-20 14:00:00'),

-- zhaoliu(ID=5) 的商品 (31-40)
(31, 'SK-II神仙水230ml', '改善肤质，细腻毛孔，经典护肤', 4, 1590.00, 1790.00, 60, 234, 1, '/uploads/products/skii.jpg', 5, 'zhaoliu', 1, '2025-11-04 10:00:00'),
(32, '兰蔻小黑瓶100ml', '修护肌肤，提亮肤色，抗老精华', 4, 1280.00, 1480.00, 70, 189, 1, '/uploads/products/lancome.jpg', 5, 'zhaoliu', 1, '2025-11-10 14:30:00'),
(33, '雅诗兰黛眼霜15ml', '淡化细纹，紧致眼周，明亮双眸', 4, 590.00, 690.00, 100, 345, 1, '/uploads/products/estee.jpg', 5, 'zhaoliu', 1, '2025-11-15 09:00:00'),
(34, '资生堂红腰子50ml', '强韧肌底，提升吸收，日系护肤', 4, 760.00, 860.00, 80, 156, 1, '/uploads/products/shiseido.jpg', 5, 'zhaoliu', 1, '2025-11-21 16:00:00'),
(35, 'YSL口红正红色', '丝绒质地，显色持久，气场全开', 4, 320.00, 380.00, 150, 567, 1, '/uploads/products/ysl.jpg', 5, 'zhaoliu', 1, '2025-11-26 10:30:00'),
(36, 'MAC子弹头口红', '经典色号，滋润不干，百搭日常', 4, 170.00, 210.00, 200, 789, 1, '/uploads/products/mac.jpg', 5, 'zhaoliu', 1, '2025-12-02 14:00:00'),
(37, '迪奥香水50ml', '花香调，持久留香，优雅女性', 4, 890.00, 990.00, 50, 123, 1, '/uploads/products/dior.jpg', 5, 'zhaoliu', 1, '2025-12-07 09:30:00'),
(38, '欧莱雅面膜10片', '补水保湿，提亮肤色，性价比高', 4, 99.00, 129.00, 300, 1456, 1, '/uploads/products/loreal.jpg', 5, 'zhaoliu', 1, '2025-12-12 15:00:00'),
(39, '科颜氏高保湿面霜', '深层保湿，修护屏障，敏感可用', 4, 350.00, 420.00, 90, 234, 1, '/uploads/products/kiehls.jpg', 5, 'zhaoliu', 1, '2025-12-17 10:00:00'),
(40, '悦木之源菌菇水', '平衡水油，舒缓肌肤，清爽不腻', 4, 320.00, 380.00, 120, 345, 1, '/uploads/products/origins.jpg', 5, 'zhaoliu', 1, '2025-12-22 14:30:00'),

-- sunqi(ID=6) 的商品 (41-50)
(41, '三只松鼠坚果礼盒', '8袋装，年货礼盒，健康美味', 5, 128.00, 168.00, 500, 2345, 1, '/uploads/products/squirrel.jpg', 6, 'sunqi', 1, '2025-11-05 08:00:00'),
(42, '农夫山泉矿泉水24瓶', '天然矿泉水，550ml整箱装', 5, 39.90, 49.90, 1000, 5678, 1, '/uploads/products/nongfu.jpg', 6, 'sunqi', 1, '2025-11-11 13:00:00'),
(43, '星巴克咖啡豆1kg', '派克市场烘焙，中度烘焙，醇香', 5, 198.00, 238.00, 200, 456, 1, '/uploads/products/starbucks.jpg', 6, 'sunqi', 1, '2025-11-16 10:30:00'),
(44, '德芙巧克力礼盒', '丝滑牛奶巧克力，送礼佳品', 5, 89.00, 109.00, 300, 890, 1, '/uploads/products/dove.jpg', 6, 'sunqi', 1, '2025-11-22 16:00:00'),
(45, '百草味零食大礼包', '多种口味，休闲零食，追剧必备', 5, 79.00, 99.00, 400, 1234, 1, '/uploads/products/baicaowei.jpg', 6, 'sunqi', 1, '2025-11-27 09:00:00'),
(46, '伊利纯牛奶24盒', '全脂纯牛奶，营养健康，整箱装', 5, 69.90, 79.90, 600, 3456, 1, '/uploads/products/yili.jpg', 6, 'sunqi', 1, '2025-12-03 14:30:00'),
(47, '良品铺子肉脯', '猪肉脯，香辣味，200g装', 5, 35.90, 45.90, 350, 789, 1, '/uploads/products/liangpin.jpg', 6, 'sunqi', 1, '2025-12-08 10:00:00'),
(48, '元气森林气泡水12瓶', '0糖0脂0卡，白桃味，清爽解渴', 5, 59.90, 69.90, 450, 1567, 1, '/uploads/products/yuanqi.jpg', 6, 'sunqi', 1, '2025-12-13 15:00:00'),
(49, '三体全集典藏版', '刘慈欣科幻巨著，精装珍藏', 6, 99.00, 128.00, 200, 678, 1, '/uploads/products/santi.jpg', 6, 'sunqi', 1, '2025-12-18 09:30:00'),
(50, '人类简史', '尤瓦尔·赫拉利，从动物到上帝', 6, 68.00, 88.00, 250, 456, 1, '/uploads/products/sapiens.jpg', 6, 'sunqi', 1, '2025-12-23 14:00:00');


-- =====================================================
-- 第四步：插入收货地址
-- 为每个普通用户创建1-2个收货地址
-- =====================================================
INSERT INTO addresses (user_id, name, phone, province, city, district, detail, is_default, status) VALUES
-- zhangsan(ID=2)的地址
(2, '张三', '13800000002', '北京市', '北京市', '朝阳区', '科技园区88号A座1001室', TRUE, 1),
(2, '张三(公司)', '13800000002', '北京市', '北京市', '海淀区', '中关村软件园二期B座502', FALSE, 1),
-- lisi(ID=3)的地址
(3, '李四', '13800000003', '上海市', '上海市', '浦东新区', '陆家嘴金融中心B座2002室', TRUE, 1),
-- wangwu(ID=4)的地址
(4, '王五', '13800000004', '广东省', '深圳市', '南山区', '科技园南区T3栋3003室', TRUE, 1),
(4, '王五(家)', '13800000004', '广东省', '广州市', '天河区', '珠江新城花城大道100号', FALSE, 1),
-- zhaoliu(ID=5)的地址
(5, '赵六', '13800000005', '浙江省', '杭州市', '西湖区', '文三路478号华星时代广场', TRUE, 1),
-- sunqi(ID=6)的地址
(6, '孙七', '13800000006', '江苏省', '南京市', '鼓楼区', '中山北路88号建伟大厦', TRUE, 1),
-- abc(ID=21)的地址
(21, '测试用户', '13800000021', '四川省', '成都市', '高新区', '天府软件园E区5栋', TRUE, 1);

-- =====================================================
-- 第五步：插入优惠券
-- =====================================================
INSERT INTO tb_coupon (id, name, description, type, discount_amount, discount_rate, min_amount, max_discount, total_count, claimed_count, limit_per_user, start_time, end_time, status) VALUES
(1, '新人专享20元券', '新用户首单立减20元', 1, 20.00, NULL, 100.00, NULL, 1000, 50, 1, '2025-01-01 00:00:00', '2026-12-31 23:59:59', 1),
(2, '满300减50券', '满300元立减50元', 1, 50.00, NULL, 300.00, NULL, 500, 30, 2, '2025-01-01 00:00:00', '2026-12-31 23:59:59', 1),
(3, '满500减100券', '满500元立减100元', 1, 100.00, NULL, 500.00, NULL, 200, 20, 1, '2025-01-01 00:00:00', '2026-12-31 23:59:59', 1),
(4, '8折优惠券', '全场商品8折，最高优惠200元', 2, NULL, 0.80, 200.00, 200.00, 300, 25, 1, '2025-01-01 00:00:00', '2026-12-31 23:59:59', 1),
(5, '无门槛10元券', '无门槛立减10元', 3, 10.00, NULL, 0.00, NULL, 2000, 100, 3, '2025-01-01 00:00:00', '2026-12-31 23:59:59', 1),
(6, '数码专享券', '数码产品满1000减80', 1, 80.00, NULL, 1000.00, NULL, 100, 10, 1, '2025-01-01 00:00:00', '2026-12-31 23:59:59', 1);

-- =====================================================
-- 第六步：插入用户优惠券（用户已领取的优惠券）
-- =====================================================
INSERT INTO tb_user_coupon (user_id, coupon_id, status, order_id, used_time, created_time) VALUES
-- zhangsan(ID=2)领取的优惠券
(2, 1, 1, NULL, NULL, '2025-12-01 10:00:00'),  -- 新人券已使用
(2, 2, 0, NULL, NULL, '2025-12-15 14:00:00'),  -- 满300减50未使用
(2, 5, 0, NULL, NULL, '2025-12-20 09:00:00'),  -- 无门槛券未使用
-- lisi(ID=3)领取的优惠券
(3, 1, 0, NULL, NULL, '2025-12-05 11:00:00'),  -- 新人券未使用
(3, 4, 0, NULL, NULL, '2025-12-18 16:00:00'),  -- 8折券未使用
-- wangwu(ID=4)领取的优惠券
(4, 2, 0, NULL, NULL, '2025-12-10 10:30:00'),  -- 满300减50未使用
(4, 5, 0, NULL, NULL, '2025-12-22 15:00:00'),  -- 无门槛券未使用
-- zhaoliu(ID=5)领取的优惠券
(5, 3, 0, NULL, NULL, '2025-12-12 09:00:00'),  -- 满500减100未使用
-- sunqi(ID=6)领取的优惠券
(6, 5, 0, NULL, NULL, '2025-12-25 14:00:00'),  -- 无门槛券未使用
(6, 6, 0, NULL, NULL, '2025-12-28 10:00:00'); -- 数码专享券未使用

-- =====================================================
-- 第七步：插入订单数据
-- 订单状态：0=待付款, 1=待发货, 2=待收货, 3=已完成, 4=已取消, 6=申请取消中
-- =====================================================

-- zhangsan(ID=2)的订单
INSERT INTO tb_order (id, order_no, user_id, total_amount, pay_amount, payment_method, payment_status, order_status, shipping_address, payment_time, shipping_time, end_time, remark, coupon_id, coupon_discount, created_time) VALUES
-- 已完成订单1
(1, 'ORD202512010001', 2, 1899.00, 1879.00, 1, 1, 3, '{"receiver":"张三","phone":"13800000002","province":"北京市","city":"北京市","district":"朝阳区","detail":"科技园区88号A座1001室"}', '2025-12-01 10:30:00', '2025-12-02 09:00:00', '2025-12-05 14:00:00', '请尽快发货', 1, 20.00, '2025-12-01 10:15:00'),
-- 已完成订单2
(2, 'ORD202512080002', 2, 899.00, 899.00, 1, 1, 3, '{"receiver":"张三","phone":"13800000002","province":"北京市","city":"北京市","district":"朝阳区","detail":"科技园区88号A座1001室"}', '2025-12-08 15:00:00', '2025-12-09 10:00:00', '2025-12-12 16:00:00', NULL, NULL, NULL, '2025-12-08 14:45:00'),
-- 待收货订单
(3, 'ORD202601050003', 2, 2999.00, 2999.00, 1, 1, 2, '{"receiver":"张三(公司)","phone":"13800000002","province":"北京市","city":"北京市","district":"海淀区","detail":"中关村软件园二期B座502"}', '2026-01-05 11:00:00', '2026-01-06 09:30:00', NULL, '送到前台即可', NULL, NULL, '2026-01-05 10:30:00'),
-- 待发货订单
(4, 'ORD202601100004', 2, 699.00, 699.00, 1, 1, 1, '{"receiver":"张三","phone":"13800000002","province":"北京市","city":"北京市","district":"朝阳区","detail":"科技园区88号A座1001室"}', '2026-01-10 09:00:00', NULL, NULL, NULL, NULL, NULL, '2026-01-10 08:45:00');

-- lisi(ID=3)的订单
INSERT INTO tb_order (id, order_no, user_id, total_amount, pay_amount, payment_method, payment_status, order_status, shipping_address, payment_time, shipping_time, end_time, remark, coupon_id, coupon_discount, created_time) VALUES
-- 已完成订单
(5, 'ORD202512150005', 3, 4599.00, 4599.00, 2, 1, 3, '{"receiver":"李四","phone":"13800000003","province":"上海市","city":"上海市","district":"浦东新区","detail":"陆家嘴金融中心B座2002室"}', '2025-12-15 14:30:00', '2025-12-16 10:00:00', '2025-12-20 11:00:00', NULL, NULL, NULL, '2025-12-15 14:00:00'),
-- 待收货订单
(6, 'ORD202601080006', 3, 1099.00, 1099.00, 1, 1, 2, '{"receiver":"李四","phone":"13800000003","province":"上海市","city":"上海市","district":"浦东新区","detail":"陆家嘴金融中心B座2002室"}', '2026-01-08 16:00:00', '2026-01-09 09:00:00', NULL, NULL, NULL, NULL, '2026-01-08 15:30:00'),
-- 待付款订单
(7, 'ORD202601110007', 3, 5999.00, 5999.00, 1, 0, 0, '{"receiver":"李四","phone":"13800000003","province":"上海市","city":"上海市","district":"浦东新区","detail":"陆家嘴金融中心B座2002室"}', NULL, NULL, NULL, '希望能送货上门', NULL, NULL, '2026-01-11 10:00:00');

-- wangwu(ID=4)的订单
INSERT INTO tb_order (id, order_no, user_id, total_amount, pay_amount, payment_method, payment_status, order_status, shipping_address, payment_time, shipping_time, end_time, remark, coupon_id, coupon_discount, created_time) VALUES
-- 已完成订单
(8, 'ORD202512200008', 4, 1590.00, 1590.00, 1, 1, 3, '{"receiver":"王五","phone":"13800000004","province":"广东省","city":"深圳市","district":"南山区","detail":"科技园南区T3栋3003室"}', '2025-12-20 10:00:00', '2025-12-21 09:00:00', '2025-12-25 15:00:00', NULL, NULL, NULL, '2025-12-20 09:30:00'),
-- 已取消订单
(9, 'ORD202512250009', 4, 499.00, 499.00, 1, 0, 4, '{"receiver":"王五","phone":"13800000004","province":"广东省","city":"深圳市","district":"南山区","detail":"科技园南区T3栋3003室"}', NULL, NULL, NULL, '不想要了', NULL, NULL, '2025-12-25 14:00:00'),
-- 待发货订单
(10, 'ORD202601090010', 4, 320.00, 320.00, 2, 1, 1, '{"receiver":"王五(家)","phone":"13800000004","province":"广东省","city":"广州市","district":"天河区","detail":"珠江新城花城大道100号"}', '2026-01-09 11:00:00', NULL, NULL, NULL, NULL, NULL, '2026-01-09 10:30:00');

-- zhaoliu(ID=5)的订单
INSERT INTO tb_order (id, order_no, user_id, total_amount, pay_amount, payment_method, payment_status, order_status, shipping_address, payment_time, shipping_time, end_time, remark, coupon_id, coupon_discount, created_time) VALUES
-- 已完成订单
(11, 'ORD202512280011', 5, 128.00, 128.00, 1, 1, 3, '{"receiver":"赵六","phone":"13800000005","province":"浙江省","city":"杭州市","district":"西湖区","detail":"文三路478号华星时代广场"}', '2025-12-28 09:00:00', '2025-12-29 10:00:00', '2026-01-02 14:00:00', '年货礼盒', NULL, NULL, '2025-12-28 08:30:00'),
-- 申请取消中订单
(12, 'ORD202601080012', 5, 2499.00, 2499.00, 1, 1, 6, '{"receiver":"赵六","phone":"13800000005","province":"浙江省","city":"杭州市","district":"西湖区","detail":"文三路478号华星时代广场"}', '2026-01-08 14:00:00', NULL, NULL, '买错了想取消', NULL, NULL, '2026-01-08 13:30:00');

-- sunqi(ID=6)的订单
INSERT INTO tb_order (id, order_no, user_id, total_amount, pay_amount, payment_method, payment_status, order_status, shipping_address, payment_time, shipping_time, end_time, remark, coupon_id, coupon_discount, created_time) VALUES
-- 已完成订单
(13, 'ORD202601020013', 6, 99.00, 99.00, 1, 1, 3, '{"receiver":"孙七","phone":"13800000006","province":"江苏省","city":"南京市","district":"鼓楼区","detail":"中山北路88号建伟大厦"}', '2026-01-02 16:00:00', '2026-01-03 09:00:00', '2026-01-06 11:00:00', NULL, NULL, NULL, '2026-01-02 15:30:00'),
-- 待收货订单
(14, 'ORD202601100014', 6, 198.00, 198.00, 2, 1, 2, '{"receiver":"孙七","phone":"13800000006","province":"江苏省","city":"南京市","district":"鼓楼区","detail":"中山北路88号建伟大厦"}', '2026-01-10 10:00:00', '2026-01-11 08:00:00', NULL, NULL, NULL, NULL, '2026-01-10 09:30:00');

-- abc(ID=21)的订单
INSERT INTO tb_order (id, order_no, user_id, total_amount, pay_amount, payment_method, payment_status, order_status, shipping_address, payment_time, shipping_time, end_time, remark, coupon_id, coupon_discount, created_time) VALUES
-- 待发货订单
(15, 'ORD202601110015', 21, 399.00, 399.00, 1, 1, 1, '{"receiver":"测试用户","phone":"13800000021","province":"四川省","city":"成都市","district":"高新区","detail":"天府软件园E区5栋"}', '2026-01-11 14:00:00', NULL, NULL, '测试订单', NULL, NULL, '2026-01-11 13:30:00');


-- =====================================================
-- 第八步：插入订单项数据
-- 发货状态：0=未发货, 1=已发货
-- =====================================================
INSERT INTO tb_order_item (order_id, product_id, product_name, product_price, quantity, total_price, product_image, seller_id, seller_name, ship_status, ship_time, created_time) VALUES
-- 订单1的商品（zhangsan买的AirPods，已完成）
(1, 6, 'AirPods Pro 2', 1899.00, 1, 1899.00, '/uploads/products/airpods.jpg', 2, 'zhangsan', 1, '2025-12-02 09:00:00', '2025-12-01 10:15:00'),
-- 订单2的商品（zhangsan买的Nike鞋，已完成）
(2, 21, 'Nike Air Max 270', 899.00, 1, 899.00, '/uploads/products/nike270.jpg', 4, 'wangwu', 1, '2025-12-09 10:00:00', '2025-12-08 14:45:00'),
-- 订单3的商品（zhangsan买的美的空调，待收货）
(3, 12, '美的空调 KFR-35GW', 2999.00, 1, 2999.00, '/uploads/products/midea.jpg', 3, 'lisi', 1, '2026-01-06 09:30:00', '2026-01-05 10:30:00'),
-- 订单4的商品（zhangsan买的九阳破壁机，待发货）
(4, 20, '九阳破壁机', 699.00, 1, 699.00, '/uploads/products/joyoung.jpg', 3, 'lisi', 0, NULL, '2026-01-10 08:45:00'),

-- 订单5的商品（lisi买的海尔冰箱，已完成）
(5, 11, '海尔冰箱 BCD-470', 4599.00, 1, 4599.00, '/uploads/products/haier.jpg', 3, 'lisi', 1, '2025-12-16 10:00:00', '2025-12-15 14:00:00'),
-- 订单6的商品（lisi买的Adidas鞋，待收货）
(6, 22, 'Adidas Ultraboost', 1099.00, 1, 1099.00, '/uploads/products/ultraboost.jpg', 4, 'wangwu', 1, '2026-01-09 09:00:00', '2026-01-08 15:30:00'),
-- 订单7的商品（lisi买的小米14，待付款）
(7, 3, '小米14 Ultra', 5999.00, 1, 5999.00, '/uploads/products/mi14.jpg', 2, 'zhangsan', 0, NULL, '2026-01-11 10:00:00'),

-- 订单8的商品（wangwu买的SK-II，已完成）
(8, 31, 'SK-II神仙水230ml', 1590.00, 1, 1590.00, '/uploads/products/skii.jpg', 5, 'zhaoliu', 1, '2025-12-21 09:00:00', '2025-12-20 09:30:00'),
-- 订单9的商品（wangwu买的羽绒服，已取消）
(9, 23, '优衣库羽绒服', 499.00, 1, 499.00, '/uploads/products/uniqlo.jpg', 4, 'wangwu', 0, NULL, '2025-12-25 14:00:00'),
-- 订单10的商品（wangwu买的YSL口红，待发货）
(10, 35, 'YSL口红正红色', 320.00, 1, 320.00, '/uploads/products/ysl.jpg', 5, 'zhaoliu', 0, NULL, '2026-01-09 10:30:00'),

-- 订单11的商品（zhaoliu买的坚果礼盒，已完成）
(11, 41, '三只松鼠坚果礼盒', 128.00, 1, 128.00, '/uploads/products/squirrel.jpg', 6, 'sunqi', 1, '2025-12-29 10:00:00', '2025-12-28 08:30:00'),
-- 订单12的商品（zhaoliu买的小米扫地机，申请取消中）
(12, 18, '小米扫地机器人', 2499.00, 1, 2499.00, '/uploads/products/mirobot.jpg', 3, 'lisi', 0, NULL, '2026-01-08 13:30:00'),

-- 订单13的商品（sunqi买的三体，已完成）
(13, 49, '三体全集典藏版', 99.00, 1, 99.00, '/uploads/products/santi.jpg', 6, 'sunqi', 1, '2026-01-03 09:00:00', '2026-01-02 15:30:00'),
-- 订单14的商品（sunqi买的咖啡豆，待收货）
(14, 43, '星巴克咖啡豆1kg', 198.00, 1, 198.00, '/uploads/products/starbucks.jpg', 6, 'sunqi', 1, '2026-01-11 08:00:00', '2026-01-10 09:30:00'),

-- 订单15的商品（abc买的Champion卫衣，待发货）
(15, 27, 'Champion卫衣', 399.00, 1, 399.00, '/uploads/products/champion.jpg', 4, 'wangwu', 0, NULL, '2026-01-11 13:30:00');

-- =====================================================
-- 第九步：插入评价数据（只有已完成订单才能评价）
-- =====================================================
INSERT INTO tb_review (product_id, user_id, order_id, order_item_id, rating, content, is_anonymous, reply, reply_time, created_time) VALUES
-- 订单1的评价（zhangsan评价AirPods）
(6, 2, 1, 1, 5, '音质非常好，降噪效果一流，戴着很舒服，续航也很给力！', 0, '感谢您的好评，欢迎再次光临！', '2025-12-06 10:00:00', '2025-12-05 15:00:00'),
-- 订单2的评价（zhangsan评价Nike鞋）
(21, 2, 2, 2, 4, '鞋子很舒服，气垫脚感不错，就是尺码偏小一点，建议买大半码。', 0, NULL, NULL, '2025-12-13 10:00:00'),
-- 订单5的评价（lisi评价海尔冰箱）
(11, 3, 5, 5, 5, '冰箱容量大，制冷效果好，运行声音很小，非常满意！', 0, '感谢支持，祝您使用愉快！', '2025-12-22 09:00:00', '2025-12-21 14:00:00'),
-- 订单8的评价（wangwu评价SK-II）
(31, 4, 8, 8, 5, '神仙水名不虚传，用了一周皮肤明显变好了，会回购的！', 1, NULL, NULL, '2025-12-26 11:00:00'),
-- 订单11的评价（zhaoliu评价坚果礼盒）
(41, 5, 11, 11, 4, '坚果很新鲜，包装也很精美，送人很有面子，就是有点贵。', 0, '感谢您的评价，我们会继续努力！', '2026-01-04 10:00:00', '2026-01-03 09:00:00'),
-- 订单13的评价（sunqi评价三体）
(49, 6, 13, 13, 5, '科幻神作，刘慈欣太厉害了，三部曲一口气看完，强烈推荐！', 0, NULL, NULL, '2026-01-07 15:00:00');

-- =====================================================
-- 第十步：插入购物车数据
-- =====================================================
INSERT INTO tb_cart (user_id, product_id, quantity, selected, created_time) VALUES
-- zhangsan(ID=2)的购物车
(2, 1, 1, 1, '2026-01-10 10:00:00'),   -- iPhone 15
(2, 14, 1, 1, '2026-01-10 11:00:00'),  -- 戴森吸尘器
-- lisi(ID=3)的购物车
(3, 4, 1, 1, '2026-01-09 14:00:00'),   -- MacBook Pro
(3, 32, 2, 1, '2026-01-09 15:00:00'),  -- 兰蔻小黑瓶
-- wangwu(ID=4)的购物车
(4, 9, 1, 1, '2026-01-08 09:00:00'),   -- Switch
-- zhaoliu(ID=5)的购物车
(5, 44, 3, 1, '2026-01-07 16:00:00'),  -- 德芙巧克力
(5, 50, 1, 1, '2026-01-07 17:00:00'),  -- 人类简史
-- sunqi(ID=6)的购物车
(6, 2, 1, 1, '2026-01-06 10:00:00'),   -- 华为Mate60
-- abc(ID=21)的购物车
(21, 46, 2, 1, '2026-01-11 09:00:00'), -- 伊利牛奶
(21, 48, 1, 1, '2026-01-11 09:30:00'); -- 元气森林

-- =====================================================
-- 第十一步：插入通知数据
-- =====================================================
INSERT INTO notifications (user_id, type, title, message, is_read, related_id, created_time) VALUES
-- 系统通知
(2, 'system', '欢迎回来', '亲爱的用户，欢迎回到雅集商城，祝您购物愉快！', 1, NULL, '2025-12-01 08:00:00'),
(3, 'system', '欢迎回来', '亲爱的用户，欢迎回到雅集商城，祝您购物愉快！', 1, NULL, '2025-12-05 09:00:00'),
(4, 'system', '欢迎回来', '亲爱的用户，欢迎回到雅集商城，祝您购物愉快！', 0, NULL, '2025-12-10 10:00:00'),
-- 订单通知
(2, 'order', '订单已完成', '您的订单 ORD202512010001 已完成，感谢您的购买！', 1, 1, '2025-12-05 14:00:00'),
(2, 'order', '订单已完成', '您的订单 ORD202512080002 已完成，感谢您的购买！', 1, 2, '2025-12-12 16:00:00'),
(2, 'order', '订单已发货', '您的订单 ORD202601050003 已发货，请注意查收。', 0, 3, '2026-01-06 09:30:00'),
(3, 'order', '订单已完成', '您的订单 ORD202512150005 已完成，感谢您的购买！', 1, 5, '2025-12-20 11:00:00'),
(3, 'order', '订单已发货', '您的订单 ORD202601080006 已发货，请注意查收。', 0, 6, '2026-01-09 09:00:00'),
(4, 'order', '订单已完成', '您的订单 ORD202512200008 已完成，感谢您的购买！', 1, 8, '2025-12-25 15:00:00'),
(5, 'order', '订单已完成', '您的订单 ORD202512280011 已完成，感谢您的购买！', 1, 11, '2026-01-02 14:00:00'),
(6, 'order', '订单已完成', '您的订单 ORD202601020013 已完成，感谢您的购买！', 1, 13, '2026-01-06 11:00:00'),
(6, 'order', '订单已发货', '您的订单 ORD202601100014 已发货，请注意查收。', 0, 14, '2026-01-11 08:00:00'),
-- 卖家通知（新订单待发货）
(2, 'order', '新订单待发货', '用户 lisi 购买了您的商品：小米14 Ultra，请尽快发货', 0, 7, '2026-01-11 10:00:00'),
(3, 'order', '新订单待发货', '用户 zhangsan 购买了您的商品：九阳破壁机，请尽快发货', 0, 4, '2026-01-10 09:00:00'),
(4, 'order', '新订单待发货', '用户 abc 购买了您的商品：Champion卫衣，请尽快发货', 0, 15, '2026-01-11 14:00:00'),
(5, 'order', '新订单待发货', '用户 wangwu 购买了您的商品：YSL口红正红色，请尽快发货', 0, 10, '2026-01-09 11:00:00'),
-- 促销通知
(2, 'promotion', '新年大促', '新年特惠，全场满300减50，快来选购吧！', 0, 2, '2026-01-01 00:00:00'),
(3, 'promotion', '新年大促', '新年特惠，全场满300减50，快来选购吧！', 0, 2, '2026-01-01 00:00:00'),
(4, 'promotion', '新年大促', '新年特惠，全场满300减50，快来选购吧！', 0, 2, '2026-01-01 00:00:00');

-- =====================================================
-- 第十二步：插入价格历史数据
-- =====================================================
INSERT INTO tb_price_history (product_id, price, original_price, recorded_time, change_type, change_amount, change_rate) VALUES
-- iPhone 15 Pro Max (ID=1)
(1, 10999.00, 10999.00, '2025-11-01 10:00:00', 'INITIAL', 0.00, 0.00),
(1, 10499.00, 10999.00, '2025-12-01 10:00:00', 'DECREASE', -500.00, -4.55),
(1, 9999.00, 10999.00, '2025-12-20 10:00:00', 'DECREASE', -500.00, -4.76),
-- 华为Mate 60 Pro (ID=2)
(2, 7999.00, 7999.00, '2025-11-05 14:30:00', 'INITIAL', 0.00, 0.00),
(2, 7499.00, 7999.00, '2025-12-05 14:30:00', 'DECREASE', -500.00, -6.25),
(2, 6999.00, 7999.00, '2025-12-25 14:30:00', 'DECREASE', -500.00, -6.67),
-- 小米14 Ultra (ID=3)
(3, 6499.00, 6499.00, '2025-11-10 09:00:00', 'INITIAL', 0.00, 0.00),
(3, 6199.00, 6499.00, '2025-12-10 09:00:00', 'DECREASE', -300.00, -4.62),
(3, 5999.00, 6499.00, '2025-12-30 09:00:00', 'DECREASE', -200.00, -3.23),
-- MacBook Pro 14 (ID=4)
(4, 16999.00, 16999.00, '2025-11-15 16:00:00', 'INITIAL', 0.00, 0.00),
(4, 15999.00, 16999.00, '2025-12-15 16:00:00', 'DECREASE', -1000.00, -5.88),
(4, 14999.00, 16999.00, '2026-01-05 16:00:00', 'DECREASE', -1000.00, -6.25),
-- Nike Air Max 270 (ID=21)
(21, 1199.00, 1199.00, '2025-11-03 09:00:00', 'INITIAL', 0.00, 0.00),
(21, 999.00, 1199.00, '2025-12-03 09:00:00', 'DECREASE', -200.00, -16.68),
(21, 899.00, 1199.00, '2025-12-23 09:00:00', 'DECREASE', -100.00, -10.01),
-- SK-II神仙水 (ID=31)
(31, 1790.00, 1790.00, '2025-11-04 10:00:00', 'INITIAL', 0.00, 0.00),
(31, 1690.00, 1790.00, '2025-12-04 10:00:00', 'DECREASE', -100.00, -5.59),
(31, 1590.00, 1790.00, '2025-12-24 10:00:00', 'DECREASE', -100.00, -5.92),
-- 三只松鼠坚果礼盒 (ID=41)
(41, 168.00, 168.00, '2025-11-05 08:00:00', 'INITIAL', 0.00, 0.00),
(41, 148.00, 168.00, '2025-12-05 08:00:00', 'DECREASE', -20.00, -11.90),
(41, 128.00, 168.00, '2025-12-25 08:00:00', 'DECREASE', -20.00, -13.51);

-- =====================================================
-- 第十三步：插入降价提醒数据
-- =====================================================
INSERT INTO tb_price_alert (user_id, product_id, target_price, current_price, status, notified, created_time) VALUES
(2, 1, 9500.00, 9999.00, 0, 0, '2026-01-08 10:00:00'),   -- zhangsan关注iPhone
(2, 4, 14000.00, 14999.00, 0, 0, '2026-01-09 11:00:00'), -- zhangsan关注MacBook
(3, 2, 6500.00, 6999.00, 0, 0, '2026-01-07 09:00:00'),   -- lisi关注华为
(4, 3, 5500.00, 5999.00, 0, 0, '2026-01-08 14:00:00'),   -- wangwu关注小米
(5, 31, 1500.00, 1590.00, 0, 0, '2026-01-09 10:00:00'),  -- zhaoliu关注SK-II
(6, 49, 89.00, 99.00, 0, 0, '2026-01-10 15:00:00');      -- sunqi关注三体

-- =====================================================
-- 第十四步：插入用户设置
-- =====================================================
INSERT INTO security_settings (user_id, password_last_changed) VALUES
(1, '2025-01-01 00:00:00'),
(2, '2025-06-15 10:00:00'),
(3, '2025-08-20 14:00:00'),
(4, '2025-09-10 09:00:00'),
(5, '2025-10-05 16:00:00'),
(6, '2025-11-01 11:00:00'),
(21, '2025-12-01 08:00:00');

INSERT INTO privacy_settings (user_id, profile_visibility) VALUES
(1, 'public'),
(2, 'public'),
(3, 'public'),
(4, 'private'),
(5, 'public'),
(6, 'public'),
(21, 'public');

INSERT INTO notification_settings (user_id, order_status_enabled, delivery_enabled, promotions_enabled, new_products_enabled, system_enabled, in_app_enabled, email_enabled, sms_enabled) VALUES
(1, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE),
(2, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, FALSE),
(3, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, FALSE),
(4, TRUE, TRUE, FALSE, FALSE, TRUE, TRUE, FALSE, FALSE),
(5, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, FALSE),
(6, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, FALSE),
(21, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, FALSE);

-- =====================================================
-- 第十五步：插入音乐数据
-- =====================================================
INSERT INTO music (title, artist, url, cover, sort_order, status) VALUES
('轻音乐 - 宁静', '纯音乐', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', NULL, 1, 1),
('轻音乐 - 悠扬', '纯音乐', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', NULL, 2, 1),
('轻音乐 - 舒缓', '纯音乐', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', NULL, 3, 1);

-- =====================================================
-- 完成
-- =====================================================
SELECT '数据重置完成！' AS message;
SELECT CONCAT('分类数量: ', COUNT(*)) AS info FROM tb_category;
SELECT CONCAT('商品数量: ', COUNT(*)) AS info FROM tb_product;
SELECT CONCAT('订单数量: ', COUNT(*)) AS info FROM tb_order;
SELECT CONCAT('评价数量: ', COUNT(*)) AS info FROM tb_review;
SELECT CONCAT('优惠券数量: ', COUNT(*)) AS info FROM tb_coupon;
