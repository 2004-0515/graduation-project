-- ============================================
-- 修复缺失的订单项数据
-- 为订单 ID 1-50 补充订单项
-- ============================================

-- 为每个订单生成 1-3 个随机订单项
-- 使用现有商品数据（product_id 1-51）

-- 订单 1-10：每个订单 2 个商品
INSERT INTO tb_order_item (order_id, product_id, product_name, product_price, quantity, total_price, product_image, seller_id, seller_name, ship_status, ship_time) VALUES
(1, 1, 'iPhone 15 Pro', 7999.00, 1, 7999.00, 'iphone15pro.jpg', 2, 'lisi', 1, '2025-11-02 10:00:00'),
(1, 5, 'AirPods Pro 2', 1899.00, 1, 1899.00, 'airpodspro2.jpg', 6, 'sunqi', 1, '2025-11-02 10:00:00'),

(2, 10, '联想小新Pro16', 5999.00, 1, 5999.00, 'lenovopro16.jpg', 11, 'xiaohong', 1, '2025-11-03 14:00:00'),
(2, 15, '罗技MX Master 3S', 699.00, 1, 699.00, 'logitechmx3s.jpg', 16, 'chenchen', 1, '2025-11-03 14:00:00'),

(3, 20, '索尼WH-1000XM5', 2299.00, 1, 2299.00, 'sonywh1000xm5.jpg', 2, 'lisi', 1, '2025-11-04 09:00:00'),
(3, 25, '飞利浦电动牙刷', 399.00, 2, 798.00, 'philips_toothbrush.jpg', 7, 'zhouba', 1, '2025-11-04 09:00:00'),

(4, 30, '戴森吹风机', 2690.00, 1, 2690.00, 'dyson_hairdryer.jpg', 12, 'daming', 1, '2025-11-05 16:00:00'),

(5, 35, '优衣库羽绒服', 599.00, 1, 599.00, 'uniqlo_down.jpg', 17, 'linlin', 1, '2025-11-06 11:00:00'),
(5, 40, '耐克运动鞋', 899.00, 1, 899.00, 'nike_shoes.jpg', 2, 'lisi', 1, '2025-11-06 11:00:00'),

(6, 45, '雀巢咖啡', 128.00, 1, 128.00, 'nescafe.jpg', 7, 'zhouba', 1, '2025-11-07 20:00:00'),

(7, 3, 'MacBook Pro 14', 14999.00, 1, 14999.00, 'macbookpro14.jpg', 4, 'wangwu', 1, '2025-11-08 13:00:00'),

(8, 8, '小米14 Ultra', 5999.00, 1, 5999.00, 'mi14ultra.jpg', 9, 'zhengshi', 1, '2025-11-09 15:00:00'),
(8, 13, '戴尔XPS 13', 8999.00, 1, 8999.00, 'dellxps13.jpg', 14, 'xiaozhang', 1, '2025-11-09 15:00:00'),

(9, 18, 'Bose 700', 2699.00, 1, 2699.00, 'bose700.jpg', 19, 'huihui', 1, '2025-11-10 10:00:00'),
(9, 23, '飞利浦剃须刀', 499.00, 1, 499.00, 'philips_shaver.jpg', 5, 'zhaoliu', 1, '2025-11-10 10:00:00'),

(10, 28, '松下电饭煲', 899.00, 1, 899.00, 'panasonic_cooker.jpg', 10, 'xiaoming', 1, '2025-11-11 18:00:00');

-- 订单 11-20：每个订单 1-2 个商品
INSERT INTO tb_order_item (order_id, product_id, product_name, product_price, quantity, total_price, product_image, seller_id, seller_name, ship_status, ship_time) VALUES
(11, 33, '美的空气炸锅', 599.00, 1, 599.00, 'midea_airfryer.jpg', 15, 'chenchen', 1, '2025-11-12 09:00:00'),
(11, 38, 'Zara连衣裙', 399.00, 3, 1197.00, 'zara_dress.jpg', 20, 'huihui', 1, '2025-11-12 09:00:00'),

(12, 43, '阿迪达斯外套', 699.00, 2, 1398.00, 'adidas_jacket.jpg', 5, 'zhaoliu', 1, '2025-11-13 14:00:00'),
(12, 48, '立顿红茶', 89.00, 5, 445.00, 'lipton_tea.jpg', 10, 'xiaoming', 1, '2025-11-13 14:00:00'),

(13, 2, 'Samsung S24 Ultra', 8999.00, 1, 8999.00, 'samsungs24.jpg', 3, 'wangwu', 1, '2025-11-14 16:00:00'),

(14, 7, 'OPPO Find X7', 4999.00, 1, 4999.00, 'oppofindx7.jpg', 8, 'wuju', 1, '2025-11-15 11:00:00'),

(15, 12, '华硕天选4', 6999.00, 1, 6999.00, 'asustuf4.jpg', 13, 'xiaoli', 1, '2025-11-16 20:00:00'),

(16, 17, '漫步者TWS1 Pro', 399.00, 2, 798.00, 'edifier_tws1.jpg', 18, 'yangyang', 1, '2025-11-17 09:00:00'),
(16, 22, '博朗剃须刀', 899.00, 1, 899.00, 'braun_shaver.jpg', 4, 'wangwu', 1, '2025-11-17 09:00:00'),

(17, 27, '九阳豆浆机', 299.00, 1, 299.00, 'joyoung_maker.jpg', 9, 'zhengshi', 1, '2025-11-18 14:00:00'),

(18, 32, '苏泊尔炒锅', 199.00, 1, 199.00, 'supor_wok.jpg', 14, 'xiaozhang', 1, '2025-11-19 16:00:00'),
(18, 37, 'H&M T恤', 99.00, 5, 495.00, 'hm_tshirt.jpg', 19, 'huihui', 1, '2025-11-19 16:00:00'),

(19, 42, '李宁篮球鞋', 599.00, 1, 599.00, 'lining_shoes.jpg', 4, 'wangwu', 1, '2025-11-20 11:00:00'),

(20, 47, '康师傅方便面', 59.00, 10, 590.00, 'kangshifu_noodles.jpg', 9, 'zhengshi', 1, '2025-11-21 15:00:00');

-- 订单 21-30：每个订单 1-2 个商品
INSERT INTO tb_order_item (order_id, product_id, product_name, product_price, quantity, total_price, product_image, seller_id, seller_name, ship_status, ship_time) VALUES
(21, 4, '华为Mate 60 Pro', 6999.00, 1, 6999.00, 'huaweimate60.jpg', 5, 'zhaoliu', 1, '2025-11-22 10:00:00'),

(22, 9, 'vivo X100 Pro', 4999.00, 1, 4999.00, 'vivox100.jpg', 10, 'xiaoming', 1, '2025-11-23 14:00:00'),

(23, 14, '惠普战66', 4999.00, 1, 4999.00, 'hp66.jpg', 15, 'chenchen', 1, '2025-11-24 09:00:00'),

(24, 19, 'JBL Flip 6', 799.00, 1, 799.00, 'jblflip6.jpg', 20, 'huihui', 1, '2025-11-25 16:00:00'),

(25, 24, '松下剃须刀', 599.00, 1, 599.00, 'panasonic_shaver.jpg', 6, 'sunqi', 1, '2025-11-26 11:00:00'),

(26, 29, '苏泊尔电压力锅', 399.00, 1, 399.00, 'supor_cooker.jpg', 11, 'xiaohong', 1, '2025-11-27 20:00:00'),

(27, 34, '九阳破壁机', 899.00, 1, 899.00, 'joyoung_blender.jpg', 16, 'chenchen', 1, '2025-11-28 13:00:00'),

(28, 39, 'Gap牛仔裤', 399.00, 2, 798.00, 'gap_jeans.jpg', 2, 'lisi', 1, '2025-11-29 15:00:00'),

(29, 44, '彪马运动裤', 299.00, 2, 598.00, 'puma_pants.jpg', 6, 'sunqi', 1, '2025-11-30 10:00:00'),

(30, 49, '三只松鼠坚果', 128.00, 3, 384.00, 'squirrel_nuts.jpg', 11, 'xiaohong', 1, '2025-12-01 18:00:00');

-- 订单 31-40：每个订单 1-2 个商品
INSERT INTO tb_order_item (order_id, product_id, product_name, product_price, quantity, total_price, product_image, seller_id, seller_name, ship_status, ship_time) VALUES
(31, 6, '荣耀Magic6 Pro', 4999.00, 1, 4999.00, 'honormagic6.jpg', 7, 'zhouba', 1, '2025-12-02 09:00:00'),

(32, 11, '神舟战神', 5999.00, 1, 5999.00, 'hasee_god.jpg', 12, 'daming', 1, '2025-12-03 14:00:00'),

(33, 16, '雷蛇鼠标', 499.00, 1, 499.00, 'razer_mouse.jpg', 17, 'linlin', 1, '2025-12-04 16:00:00'),

(34, 21, '哈曼卡顿音响', 1999.00, 1, 1999.00, 'harman_speaker.jpg', 3, 'wangwu', 1, '2025-12-05 11:00:00'),

(35, 26, '飞科剃须刀', 199.00, 1, 199.00, 'flyco_shaver.jpg', 8, 'wuju', 1, '2025-12-06 20:00:00'),

(36, 31, '美的电磁炉', 299.00, 1, 299.00, 'midea_cooker.jpg', 13, 'xiaoli', 1, '2025-12-07 13:00:00'),

(37, 36, '优衣库毛衣', 299.00, 2, 598.00, 'uniqlo_sweater.jpg', 18, 'yangyang', 1, '2025-12-08 15:00:00'),

(38, 41, '安踏跑步鞋', 499.00, 1, 499.00, 'anta_shoes.jpg', 3, 'wangwu', 1, '2025-12-09 10:00:00'),

(39, 46, '百事可乐', 59.00, 6, 354.00, 'pepsi.jpg', 8, 'wuju', 1, '2025-12-10 18:00:00'),

(40, 51, '良品铺子零食', 168.00, 2, 336.00, 'liangpin_snacks.jpg', 13, 'xiaoli', 1, '2025-12-11 09:00:00');

-- 订单 41-50：每个订单 1-2 个商品
INSERT INTO tb_order_item (order_id, product_id, product_name, product_price, quantity, total_price, product_image, seller_id, seller_name, ship_status, ship_time) VALUES
(41, 1, 'iPhone 15 Pro', 7999.00, 1, 7999.00, 'iphone15pro.jpg', 2, 'lisi', 1, '2025-12-12 14:00:00'),

(42, 6, '荣耀Magic6 Pro', 4999.00, 1, 4999.00, 'honormagic6.jpg', 7, 'zhouba', 1, '2025-12-13 16:00:00'),

(43, 11, '神舟战神', 5999.00, 1, 5999.00, 'hasee_god.jpg', 12, 'daming', 1, '2025-12-14 11:00:00'),

(44, 16, '雷蛇鼠标', 499.00, 2, 998.00, 'razer_mouse.jpg', 17, 'linlin', 1, '2025-12-15 20:00:00'),

(45, 21, '哈曼卡顿音响', 1999.00, 1, 1999.00, 'harman_speaker.jpg', 3, 'wangwu', 1, '2025-12-16 13:00:00'),

(46, 26, '飞科剃须刀', 199.00, 3, 597.00, 'flyco_shaver.jpg', 8, 'wuju', 1, '2025-12-17 15:00:00'),

(47, 31, '美的电磁炉', 299.00, 2, 598.00, 'midea_cooker.jpg', 13, 'xiaoli', 1, '2025-12-18 10:00:00'),

(48, 36, '优衣库毛衣', 299.00, 3, 897.00, 'uniqlo_sweater.jpg', 18, 'yangyang', 1, '2025-12-19 18:00:00'),

(49, 41, '安踏跑步鞋', 499.00, 2, 998.00, 'anta_shoes.jpg', 3, 'wangwu', 1, '2025-12-20 09:00:00'),

(50, 46, '百事可乐', 59.00, 10, 590.00, 'pepsi.jpg', 8, 'wuju', 1, '2025-12-21 14:00:00');

-- ============================================
-- 验证修复结果
-- ============================================
SELECT 
    '修复后统计' AS info,
    (SELECT COUNT(*) FROM tb_order) AS total_orders,
    (SELECT COUNT(DISTINCT order_id) FROM tb_order_item) AS orders_with_items,
    (SELECT COUNT(*) FROM tb_order WHERE NOT EXISTS (SELECT 1 FROM tb_order_item WHERE order_id = tb_order.id)) AS orders_without_items,
    (SELECT COUNT(*) FROM tb_order_item) AS total_items;
