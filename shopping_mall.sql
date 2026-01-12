/*
 Navicat Premium Dump SQL

 Source Server         : zjt2203010614
 Source Server Type    : MySQL
 Source Server Version : 90200 (9.2.0)
 Source Host           : localhost:3306
 Source Schema         : shopping_mall

 Target Server Type    : MySQL
 Target Server Version : 90200 (9.2.0)
 File Encoding         : 65001

 Date: 13/01/2026 01:28:35
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for addresses
-- ----------------------------
DROP TABLE IF EXISTS `addresses`;
CREATE TABLE `addresses`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '地址ID',
  `user_id` bigint NOT NULL COMMENT '用户ID',
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '收货人姓名',
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '收货人电话',
  `province` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '省份',
  `city` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '城市',
  `district` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '区/县',
  `detail` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '详细地址',
  `is_default` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否默认地址',
  `status` int NOT NULL DEFAULT 1 COMMENT '状态：1-正常，0-无效',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_address_user`(`user_id` ASC) USING BTREE,
  CONSTRAINT `fk_address_user` FOREIGN KEY (`user_id`) REFERENCES `tb_user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 31 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '收货地址表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of addresses
-- ----------------------------
INSERT INTO `addresses` VALUES (1, 2, '张三', '13812345678', '北京市', '北京市', '朝阳区', '建国路88号SOHO现代城A座1001室', 1, 1);
INSERT INTO `addresses` VALUES (2, 2, '张三', '13812345678', '北京市', '北京市', '海淀区', '中关村大街1号软件园B座502室', 0, 1);
INSERT INTO `addresses` VALUES (3, 3, '李四', '13987654321', '上海市', '上海市', '浦东新区', '陆家嘴环路1000号恒生大厦2002室', 1, 1);
INSERT INTO `addresses` VALUES (4, 4, '王五', '13666666666', '广东省', '深圳市', '南山区', '科技园南区飞亚达大厦3003室', 1, 1);
INSERT INTO `addresses` VALUES (5, 5, '赵六', '13555555555', '浙江省', '杭州市', '西湖区', '文三路478号华星广场A座1205室', 1, 1);
INSERT INTO `addresses` VALUES (6, 6, '孙七', '13444444444', '江苏省', '南京市', '鼓楼区', '中山北路88号建伟大厦1506室', 1, 1);
INSERT INTO `addresses` VALUES (7, 7, '周八', '13333333333', '四川省', '成都市', '武侯区', '天府大道北段1700号环球中心E1区', 1, 1);
INSERT INTO `addresses` VALUES (8, 8, '吴九', '13222222222', '湖北省', '武汉市', '洪山区', '珞喻路1037号华中科技大学', 1, 1);
INSERT INTO `addresses` VALUES (9, 9, '郑十', '13111111111', '陕西省', '西安市', '雁塔区', '高新路88号尚品国际A座1808室', 1, 1);
INSERT INTO `addresses` VALUES (10, 10, '小明', '15012345678', '山东省', '青岛市', '市南区', '香港中路67号书城公寓1203室', 1, 1);
INSERT INTO `addresses` VALUES (11, 11, '小红', '15112345678', '福建省', '厦门市', '思明区', '软件园二期望海路23号', 1, 1);
INSERT INTO `addresses` VALUES (12, 12, '大明', '15212345678', '广东省', '广州市', '天河区', '天河路385号太古汇一座3506室', 1, 1);
INSERT INTO `addresses` VALUES (13, 13, '小丽', '15312345678', '河南省', '郑州市', '金水区', '农业路72号国际企业中心A座', 1, 1);
INSERT INTO `addresses` VALUES (14, 14, '老王', '15412345678', '辽宁省', '大连市', '中山区', '人民路23号虹源大厦1102室', 1, 1);
INSERT INTO `addresses` VALUES (15, 15, '小张', '15512345678', '天津市', '天津市', '和平区', '南京路189号津汇广场2301室', 1, 1);
INSERT INTO `addresses` VALUES (16, 16, '晨晨', '15612345678', '重庆市', '重庆市', '渝中区', '解放碑民权路28号英利中心3205室', 1, 1);
INSERT INTO `addresses` VALUES (17, 17, '琳琳', '15712345678', '湖南省', '长沙市', '岳麓区', '麓谷大道658号企业广场C1栋', 1, 1);
INSERT INTO `addresses` VALUES (18, 18, '洋洋', '15812345678', '安徽省', '合肥市', '蜀山区', '长江西路189号之心城A座2008室', 1, 1);
INSERT INTO `addresses` VALUES (19, 19, '慧慧', '15912345678', '江西省', '南昌市', '红谷滩区', '红谷中大道1326号省医院宿舍', 1, 1);
INSERT INTO `addresses` VALUES (20, 20, '明明', '13012345678', '河北省', '石家庄市', '长安区', '中山东路508号东胜广场A座', 1, 1);
INSERT INTO `addresses` VALUES (21, 3, '李四', '13987654321', '上海市', '上海市', '徐汇区', '漕溪北路88号圣爱大厦1203室', 0, 1);
INSERT INTO `addresses` VALUES (22, 4, '王五', '13666666666', '广东省', '深圳市', '福田区', '深南大道6011号NEO大厦A座', 0, 1);
INSERT INTO `addresses` VALUES (23, 5, '赵六', '13555555555', '浙江省', '杭州市', '滨江区', '网商路599号阿里巴巴西溪园区', 0, 1);
INSERT INTO `addresses` VALUES (24, 12, '大明', '15212345678', '广东省', '广州市', '番禺区', '万博商务区汉溪大道东395号', 0, 1);
INSERT INTO `addresses` VALUES (25, 2, '张三公司', '13812345678', '北京市', '北京市', '西城区', '金融大街35号国际企业大厦B座', 0, 1);
INSERT INTO `addresses` VALUES (26, 7, '周八', '13333333333', '四川省', '成都市', '高新区', '天府三街199号腾讯大厦A座', 0, 1);
INSERT INTO `addresses` VALUES (27, 9, '郑十', '13111111111', '陕西省', '西安市', '碑林区', '南大街1号骡马市步行街', 0, 1);
INSERT INTO `addresses` VALUES (28, 11, '小红', '15112345678', '福建省', '厦门市', '湖里区', '金山路1号观音山商务中心A栋', 0, 1);
INSERT INTO `addresses` VALUES (29, 15, '小张', '15512345678', '天津市', '天津市', '南开区', '鞍山西道259号时代数码广场', 0, 1);
INSERT INTO `addresses` VALUES (30, 18, '洋洋', '15812345678', '安徽省', '合肥市', '包河区', '马鞍山路130号万达广场A座', 0, 1);

-- ----------------------------
-- Table structure for music
-- ----------------------------
DROP TABLE IF EXISTS `music`;
CREATE TABLE `music`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `artist` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `cover` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `created_time` datetime(6) NULL DEFAULT NULL,
  `duration` int NULL DEFAULT NULL,
  `sort_order` int NULL DEFAULT NULL,
  `status` int NULL DEFAULT NULL,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_time` datetime(6) NULL DEFAULT NULL,
  `url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 11 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of music
-- ----------------------------
INSERT INTO `music` VALUES (4, '卢润泽', '', NULL, NULL, 0, 1, '土坡上的狗尾草.臻享版.-卢润泽#2EvYav', '2026-01-11 21:01:16.990356', '/uploads/music/2026/01/a67c9239-2fad-4d66-addd-782998a56ebf.mp3');
INSERT INTO `music` VALUES (5, '王贰浪', '', NULL, NULL, 0, 1, '把回忆拼好给你-王贰浪#2A2wK7', '2026-01-11 21:01:21.501837', '/uploads/music/2026/01/edc324de-571d-4357-b498-30ebebea4c49.mp3');
INSERT INTO `music` VALUES (6, '苏星婕', '', NULL, NULL, 0, 1, '悲伤剧情-苏星婕#2zGF36', '2026-01-11 21:01:28.285783', '/uploads/music/2026/01/248025f4-982c-4d15-8701-0afeea188d13.mp3');
INSERT INTO `music` VALUES (7, '周杰伦', '/music/covers/qingtian.jpg', NULL, 269, 7, 1, '晴天', NULL, '/music/qingtian.mp3');
INSERT INTO `music` VALUES (8, '周杰伦', '/music/covers/qilixiang.jpg', NULL, 299, 8, 1, '七里香', NULL, '/music/qilixiang.mp3');
INSERT INTO `music` VALUES (9, '周杰伦', '/music/covers/qinghuaci.jpg', NULL, 239, 9, 1, '青花瓷', NULL, '/music/qinghuaci.mp3');
INSERT INTO `music` VALUES (10, '周杰伦', '/music/covers/jiandanai.jpg', NULL, 270, 10, 1, '简单爱', NULL, '/music/jiandanai.mp3');

-- ----------------------------
-- Table structure for notification_settings
-- ----------------------------
DROP TABLE IF EXISTS `notification_settings`;
CREATE TABLE `notification_settings`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '设置ID',
  `user_id` bigint NOT NULL COMMENT '用户ID',
  `order_status_enabled` tinyint(1) NULL DEFAULT 1 COMMENT '订单状态更新通知',
  `delivery_enabled` tinyint(1) NULL DEFAULT 1 COMMENT '发货通知',
  `promotions_enabled` tinyint(1) NULL DEFAULT 1 COMMENT '促销活动通知',
  `new_products_enabled` tinyint(1) NULL DEFAULT 1 COMMENT '新品推荐通知',
  `system_enabled` tinyint(1) NULL DEFAULT 1 COMMENT '系统通知',
  `in_app_enabled` tinyint(1) NULL DEFAULT 1 COMMENT '应用内通知',
  `email_enabled` tinyint(1) NULL DEFAULT 1 COMMENT '邮件通知',
  `sms_enabled` tinyint(1) NULL DEFAULT 0 COMMENT '短信通知',
  `notification_frequency` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'immediate' COMMENT '通知频率：immediate-立即，daily-每日，weekly-每周',
  `notify_start_time` int NULL DEFAULT 8 COMMENT '通知开始时间（小时）',
  `notify_end_time` int NULL DEFAULT 22 COMMENT '通知结束时间（小时）',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `user_id`(`user_id` ASC) USING BTREE,
  CONSTRAINT `fk_notification_user` FOREIGN KEY (`user_id`) REFERENCES `tb_user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 15 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '通知设置表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of notification_settings
-- ----------------------------
INSERT INTO `notification_settings` VALUES (1, 2, 1, 1, 1, 1, 1, 1, 1, 0, 'immediate', 8, 22, '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `notification_settings` VALUES (2, 3, 1, 1, 0, 1, 1, 1, 0, 0, 'immediate', 8, 22, '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `notification_settings` VALUES (3, 4, 1, 1, 1, 0, 1, 1, 1, 1, 'immediate', 8, 22, '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `notification_settings` VALUES (4, 5, 1, 1, 1, 1, 1, 1, 0, 0, 'immediate', 8, 22, '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `notification_settings` VALUES (5, 6, 1, 1, 0, 0, 1, 1, 0, 0, 'immediate', 8, 22, '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `notification_settings` VALUES (6, 7, 1, 1, 1, 1, 1, 1, 1, 0, 'immediate', 8, 22, '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `notification_settings` VALUES (7, 8, 1, 1, 1, 1, 1, 1, 0, 0, 'immediate', 8, 22, '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `notification_settings` VALUES (8, 9, 1, 1, 1, 1, 1, 1, 1, 1, 'immediate', 8, 22, '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `notification_settings` VALUES (9, 10, 1, 1, 0, 1, 1, 1, 0, 0, 'immediate', 8, 22, '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `notification_settings` VALUES (10, 11, 1, 1, 1, 1, 1, 1, 1, 0, 'immediate', 8, 22, '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `notification_settings` VALUES (11, 12, 1, 1, 1, 1, 1, 1, 1, 1, 'immediate', 8, 22, '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `notification_settings` VALUES (12, 13, 1, 1, 0, 0, 1, 1, 0, 0, 'immediate', 8, 22, '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `notification_settings` VALUES (13, 14, 1, 1, 0, 1, 1, 1, 0, 0, 'immediate', 8, 22, '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `notification_settings` VALUES (14, 15, 1, 1, 1, 1, 1, 1, 0, 0, 'immediate', 8, 22, '2026-01-13 01:12:24', '2026-01-13 01:12:24');

-- ----------------------------
-- Table structure for notifications
-- ----------------------------
DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_time` datetime(6) NULL DEFAULT NULL,
  `message` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_read` bit(1) NOT NULL,
  `related_id` bigint NULL DEFAULT NULL,
  `title` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `FKglp1g75igtibbl9v3iq0preho`(`user_id` ASC) USING BTREE,
  CONSTRAINT `FKglp1g75igtibbl9v3iq0preho` FOREIGN KEY (`user_id`) REFERENCES `tb_user` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 41 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of notifications
-- ----------------------------
INSERT INTO `notifications` VALUES (1, '2024-03-15 14:35:00.000000', '亲爱的张三欢迎您注册萌购商城新人优惠券已发放', b'1', NULL, '欢迎加入萌购商城', 'system', 2);
INSERT INTO `notifications` VALUES (2, '2024-04-20 09:20:00.000000', '亲爱的李四欢迎您注册萌购商城新人优惠券已发放', b'1', NULL, '欢迎加入萌购商城', 'system', 3);
INSERT INTO `notifications` VALUES (3, '2024-05-10 16:50:00.000000', '亲爱的王五欢迎您注册萌购商城新人优惠券已发放', b'1', NULL, '欢迎加入萌购商城', 'system', 4);
INSERT INTO `notifications` VALUES (4, '2024-06-01 11:25:00.000000', '亲爱的赵六欢迎您注册萌购商城新人优惠券已发放', b'1', NULL, '欢迎加入萌购商城', 'system', 5);
INSERT INTO `notifications` VALUES (5, '2025-01-16 10:00:00.000000', '恭喜您获得500积分奖励积分可抵扣现金', b'1', NULL, '积分到账通知', 'system', 2);
INSERT INTO `notifications` VALUES (6, '2025-01-18 10:00:00.000000', '恭喜您获得350积分奖励积分可抵扣现金', b'1', NULL, '积分到账通知', 'system', 3);
INSERT INTO `notifications` VALUES (7, '2025-01-21 09:00:00.000000', '恭喜您升级为银牌会员享受更多专属优惠', b'0', NULL, '会员等级提升', 'system', 4);
INSERT INTO `notifications` VALUES (8, '2025-01-28 09:00:00.000000', '恭喜您升级为金牌会员享受更多专属优惠', b'0', NULL, '会员等级提升', 'system', 12);
INSERT INTO `notifications` VALUES (9, '2025-01-15 09:00:00.000000', '新年特惠全场满300减50数码专区满1000减100', b'0', 2, '新年大促活动开始啦', 'promotion', 2);
INSERT INTO `notifications` VALUES (10, '2025-01-15 09:00:00.000000', '新年特惠全场满300减50数码专区满1000减100', b'1', 2, '新年大促活动开始啦', 'promotion', 3);
INSERT INTO `notifications` VALUES (11, '2025-01-15 09:00:00.000000', '新年特惠全场满300减50数码专区满1000减100', b'0', 2, '新年大促活动开始啦', 'promotion', 4);
INSERT INTO `notifications` VALUES (12, '2025-01-20 10:00:00.000000', '美妆护肤专场满500减80大牌好物等你来抢', b'0', 5, '美妆节限时特惠', 'promotion', 5);
INSERT INTO `notifications` VALUES (13, '2025-01-20 10:00:00.000000', '美妆护肤专场满500减80大牌好物等你来抢', b'1', 5, '美妆节限时特惠', 'promotion', 9);
INSERT INTO `notifications` VALUES (14, '2025-01-20 10:00:00.000000', '美妆护肤专场满500减80大牌好物等你来抢', b'0', 5, '美妆节限时特惠', 'promotion', 11);
INSERT INTO `notifications` VALUES (15, '2025-01-22 09:00:00.000000', '运动户外专场精选好物低至5折', b'0', 7, '运动装备特卖', 'promotion', 6);
INSERT INTO `notifications` VALUES (16, '2025-01-25 09:00:00.000000', '图书满100减20开学季囤书好时机', b'1', 8, '图书文具满减', 'promotion', 8);
INSERT INTO `notifications` VALUES (17, '2025-01-10 10:36:00.000000', '您的订单ORD202501100001支付成功商家正在备货', b'1', 1, '订单支付成功', 'order', 2);
INSERT INTO `notifications` VALUES (18, '2025-01-11 09:05:00.000000', '您的订单ORD202501100001已发货预计3-5天送达', b'1', 1, '订单已发货', 'order', 2);
INSERT INTO `notifications` VALUES (19, '2025-01-15 14:35:00.000000', '您的订单ORD202501100001已完成欢迎评价', b'1', 1, '订单已完成', 'order', 2);
INSERT INTO `notifications` VALUES (20, '2025-01-12 14:21:00.000000', '您的订单ORD202501120002支付成功商家正在备货', b'1', 2, '订单支付成功', 'order', 3);
INSERT INTO `notifications` VALUES (21, '2025-01-13 08:35:00.000000', '您的订单ORD202501120002已发货预计3-5天送达', b'1', 2, '订单已发货', 'order', 3);
INSERT INTO `notifications` VALUES (22, '2025-01-17 16:05:00.000000', '您的订单ORD202501120002已完成欢迎评价', b'1', 2, '订单已完成', 'order', 3);
INSERT INTO `notifications` VALUES (23, '2025-01-20 15:25:00.000000', '您的订单ORD202501150003已完成感谢购买', b'1', 3, '订单已完成', 'order', 4);
INSERT INTO `notifications` VALUES (24, '2025-01-22 11:35:00.000000', '您的订单ORD202501180004已完成感谢购买', b'1', 4, '订单已完成', 'order', 5);
INSERT INTO `notifications` VALUES (25, '2025-01-25 14:05:00.000000', '您的订单ORD202501200005已完成感谢购买', b'0', 5, '订单已完成', 'order', 6);
INSERT INTO `notifications` VALUES (26, '2025-01-27 16:50:00.000000', '您的订单ORD202501210006已完成感谢购买', b'0', 6, '订单已完成', 'order', 7);
INSERT INTO `notifications` VALUES (27, '2025-01-26 10:35:00.000000', '您的订单ORD202501220007已完成感谢购买', b'1', 7, '订单已完成', 'order', 8);
INSERT INTO `notifications` VALUES (28, '2025-01-28 15:05:00.000000', '您的订单ORD202501230008已完成感谢购买', b'0', 8, '订单已完成', 'order', 9);
INSERT INTO `notifications` VALUES (29, '2025-01-26 08:35:00.000000', '您的订单ORD202501250009已发货预计3-5天送达', b'0', 9, '订单已发货', 'order', 10);
INSERT INTO `notifications` VALUES (30, '2025-01-27 09:05:00.000000', '您的订单ORD202501260010已发货预计3-5天送达', b'0', 10, '订单已发货', 'order', 11);
INSERT INTO `notifications` VALUES (31, '2025-01-28 08:05:00.000000', '您的订单ORD202501270011已发货预计3-5天送达', b'0', 11, '订单已发货', 'order', 12);
INSERT INTO `notifications` VALUES (32, '2025-01-28 09:35:00.000000', '您的订单ORD202501270012已发货预计3-5天送达', b'0', 12, '订单已发货', 'order', 2);
INSERT INTO `notifications` VALUES (33, '2025-01-28 09:55:00.000000', '您的订单ORD202501280013已支付成功商家正在备货', b'0', 13, '订单待发货', 'order', 13);
INSERT INTO `notifications` VALUES (34, '2025-01-28 14:35:00.000000', '您的订单ORD202501280014已支付成功商家正在备货', b'0', 14, '订单待发货', 'order', 14);
INSERT INTO `notifications` VALUES (35, '2025-01-28 17:20:00.000000', '您的订单ORD202501280015已支付成功商家正在备货', b'0', 15, '订单待发货', 'order', 15);
INSERT INTO `notifications` VALUES (36, '2025-01-29 10:05:00.000000', '您的订单ORD202501290016已创建请在30分钟内完成支付', b'0', 16, '订单待支付', 'order', 16);
INSERT INTO `notifications` VALUES (37, '2025-01-29 11:35:00.000000', '您的订单ORD202501290017已创建请在30分钟内完成支付', b'0', 17, '订单待支付', 'order', 17);
INSERT INTO `notifications` VALUES (38, '2025-01-29 14:25:00.000000', '您的订单ORD202501290018已创建请在30分钟内完成支付', b'0', 18, '订单待支付', 'order', 18);
INSERT INTO `notifications` VALUES (39, '2025-01-29 09:15:00.000000', '您的订单ORD202501290029取消申请已提交等待审核', b'0', 29, '取消申请已提交', 'order', 8);
INSERT INTO `notifications` VALUES (40, '2025-01-29 16:05:00.000000', '您的订单ORD202501290030已创建请在30分钟内完成支付', b'0', 30, '订单待支付', 'order', 9);

-- ----------------------------
-- Table structure for privacy_settings
-- ----------------------------
DROP TABLE IF EXISTS `privacy_settings`;
CREATE TABLE `privacy_settings`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '设置ID',
  `user_id` bigint NOT NULL COMMENT '用户ID',
  `profile_visibility` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'public' COMMENT '个人信息可见性：public-公开，private-私密',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `user_id`(`user_id` ASC) USING BTREE,
  CONSTRAINT `fk_privacy_user` FOREIGN KEY (`user_id`) REFERENCES `tb_user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 15 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '隐私设置表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of privacy_settings
-- ----------------------------
INSERT INTO `privacy_settings` VALUES (1, 2, 'public', '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `privacy_settings` VALUES (2, 3, 'private', '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `privacy_settings` VALUES (3, 4, 'public', '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `privacy_settings` VALUES (4, 5, 'public', '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `privacy_settings` VALUES (5, 6, 'private', '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `privacy_settings` VALUES (6, 7, 'public', '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `privacy_settings` VALUES (7, 8, 'public', '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `privacy_settings` VALUES (8, 9, 'private', '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `privacy_settings` VALUES (9, 10, 'public', '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `privacy_settings` VALUES (10, 11, 'public', '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `privacy_settings` VALUES (11, 12, 'private', '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `privacy_settings` VALUES (12, 13, 'public', '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `privacy_settings` VALUES (13, 14, 'public', '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `privacy_settings` VALUES (14, 15, 'private', '2026-01-13 01:12:24', '2026-01-13 01:12:24');

-- ----------------------------
-- Table structure for security_settings
-- ----------------------------
DROP TABLE IF EXISTS `security_settings`;
CREATE TABLE `security_settings`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '设置ID',
  `user_id` bigint NOT NULL COMMENT '用户ID',
  `password_last_changed` datetime NULL DEFAULT NULL COMMENT '密码最后修改时间',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `user_id`(`user_id` ASC) USING BTREE,
  CONSTRAINT `fk_security_user` FOREIGN KEY (`user_id`) REFERENCES `tb_user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 15 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '安全设置表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of security_settings
-- ----------------------------
INSERT INTO `security_settings` VALUES (1, 2, '2024-03-15 14:30:00', '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `security_settings` VALUES (2, 3, '2024-04-20 09:15:00', '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `security_settings` VALUES (3, 4, '2024-05-10 16:45:00', '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `security_settings` VALUES (4, 5, '2024-06-01 11:20:00', '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `security_settings` VALUES (5, 6, '2024-06-15 08:30:00', '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `security_settings` VALUES (6, 7, '2024-07-01 13:00:00', '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `security_settings` VALUES (7, 8, '2024-07-20 10:45:00', '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `security_settings` VALUES (8, 9, '2024-08-05 15:30:00', '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `security_settings` VALUES (9, 10, '2024-08-20 09:00:00', '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `security_settings` VALUES (10, 11, '2024-09-01 14:20:00', '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `security_settings` VALUES (11, 12, '2024-09-15 11:10:00', '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `security_settings` VALUES (12, 13, '2024-10-01 16:00:00', '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `security_settings` VALUES (13, 14, '2024-10-20 08:45:00', '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `security_settings` VALUES (14, 15, '2024-11-01 13:30:00', '2026-01-13 01:12:24', '2026-01-13 01:12:24');

-- ----------------------------
-- Table structure for tb_cart
-- ----------------------------
DROP TABLE IF EXISTS `tb_cart`;
CREATE TABLE `tb_cart`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '购物车ID',
  `user_id` bigint NOT NULL COMMENT '用户ID',
  `product_id` bigint NOT NULL COMMENT '商品ID',
  `quantity` int NOT NULL DEFAULT 1 COMMENT '商品数量',
  `selected` tinyint NOT NULL DEFAULT 1,
  `created_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_cart_user_product`(`user_id` ASC, `product_id` ASC) USING BTREE,
  INDEX `idx_cart_user`(`user_id` ASC) USING BTREE,
  INDEX `idx_cart_product`(`product_id` ASC) USING BTREE,
  CONSTRAINT `fk_cart_product` FOREIGN KEY (`product_id`) REFERENCES `tb_product` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_cart_user` FOREIGN KEY (`user_id`) REFERENCES `tb_user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 26 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '购物车表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of tb_cart
-- ----------------------------
INSERT INTO `tb_cart` VALUES (1, 2, 3, 1, 1, '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `tb_cart` VALUES (2, 2, 21, 2, 1, '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `tb_cart` VALUES (3, 2, 33, 1, 0, '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `tb_cart` VALUES (4, 3, 1, 1, 1, '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `tb_cart` VALUES (5, 3, 27, 1, 1, '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `tb_cart` VALUES (6, 4, 16, 1, 1, '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `tb_cart` VALUES (7, 5, 33, 2, 1, '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `tb_cart` VALUES (8, 5, 36, 1, 1, '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `tb_cart` VALUES (9, 6, 21, 1, 1, '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `tb_cart` VALUES (10, 6, 45, 2, 1, '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `tb_cart` VALUES (11, 7, 50, 1, 1, '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `tb_cart` VALUES (12, 7, 23, 2, 0, '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `tb_cart` VALUES (13, 8, 39, 1, 1, '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `tb_cart` VALUES (14, 8, 40, 1, 1, '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `tb_cart` VALUES (15, 9, 27, 1, 1, '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `tb_cart` VALUES (16, 9, 28, 1, 1, '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `tb_cart` VALUES (17, 10, 42, 3, 1, '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `tb_cart` VALUES (18, 10, 41, 1, 1, '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `tb_cart` VALUES (19, 11, 31, 2, 1, '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `tb_cart` VALUES (20, 11, 32, 1, 1, '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `tb_cart` VALUES (21, 12, 9, 1, 1, '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `tb_cart` VALUES (22, 12, 13, 1, 1, '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `tb_cart` VALUES (23, 13, 48, 1, 1, '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `tb_cart` VALUES (24, 13, 49, 2, 1, '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `tb_cart` VALUES (25, 14, 19, 1, 1, '2026-01-13 01:12:24', '2026-01-13 01:12:24');

-- ----------------------------
-- Table structure for tb_category
-- ----------------------------
DROP TABLE IF EXISTS `tb_category`;
CREATE TABLE `tb_category`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '分类ID',
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '分类名称',
  `description` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '分类描述',
  `parent_id` bigint NOT NULL DEFAULT 0 COMMENT '父分类ID，0表示顶级分类',
  `sort_order` int NOT NULL DEFAULT 0 COMMENT '排序顺序',
  `icon` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '分类图标URL',
  `status` tinyint NOT NULL DEFAULT 1,
  `created_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `name`(`name` ASC) USING BTREE,
  INDEX `idx_category_parent`(`parent_id` ASC) USING BTREE,
  INDEX `idx_category_status`(`status` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 13 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '商品分类表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of tb_category
-- ----------------------------
INSERT INTO `tb_category` VALUES (1, '手机数码', '手机平板数码产品', 0, 1, NULL, 1, '2026-01-13 01:12:23', '2026-01-13 01:12:23');
INSERT INTO `tb_category` VALUES (2, '电脑办公', '笔记本台式机办公设备', 0, 2, NULL, 1, '2026-01-13 01:12:23', '2026-01-13 01:12:23');
INSERT INTO `tb_category` VALUES (3, '家用电器', '冰箱洗衣机空调', 0, 3, NULL, 1, '2026-01-13 01:12:23', '2026-01-13 01:12:23');
INSERT INTO `tb_category` VALUES (4, '服装鞋帽', '时尚服装鞋帽配饰', 0, 4, NULL, 1, '2026-01-13 01:12:23', '2026-01-13 01:12:23');
INSERT INTO `tb_category` VALUES (5, '美妆护肤', '化妆品护肤品', 0, 5, NULL, 1, '2026-01-13 01:12:23', '2026-01-13 01:12:23');
INSERT INTO `tb_category` VALUES (6, '食品饮料', '零食饮料生鲜', 0, 6, NULL, 1, '2026-01-13 01:12:23', '2026-01-13 01:12:23');
INSERT INTO `tb_category` VALUES (7, '图书文具', '图书文具用品', 0, 7, NULL, 1, '2026-01-13 01:12:23', '2026-01-13 01:12:23');
INSERT INTO `tb_category` VALUES (8, '运动户外', '运动装备户外用品', 0, 8, NULL, 1, '2026-01-13 01:12:23', '2026-01-13 01:12:23');
INSERT INTO `tb_category` VALUES (9, '母婴用品', '婴儿孕妇用品', 0, 9, NULL, 1, '2026-01-13 01:12:23', '2026-01-13 01:12:23');
INSERT INTO `tb_category` VALUES (10, '家居生活', '家具家纺生活用品', 0, 10, NULL, 1, '2026-01-13 01:12:23', '2026-01-13 01:12:23');
INSERT INTO `tb_category` VALUES (11, '珠宝首饰', '黄金钻石银饰', 0, 11, NULL, 1, '2026-01-13 01:12:23', '2026-01-13 01:12:23');
INSERT INTO `tb_category` VALUES (12, '汽车用品', '车载电器汽车装饰', 0, 12, NULL, 1, '2026-01-13 01:12:23', '2026-01-13 01:12:23');

-- ----------------------------
-- Table structure for tb_consumption_achievement
-- ----------------------------
DROP TABLE IF EXISTS `tb_consumption_achievement`;
CREATE TABLE `tb_consumption_achievement`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `achieved_time` datetime(6) NULL DEFAULT NULL,
  `achievement_desc` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `achievement_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `achievement_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 25 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of tb_consumption_achievement
-- ----------------------------
INSERT INTO `tb_consumption_achievement` VALUES (1, '2025-11-15 10:30:00.000000', '完成第一笔订单', '首单达成', 'FIRST_ORDER', 2);
INSERT INTO `tb_consumption_achievement` VALUES (2, '2025-12-01 00:00:00.000000', '连续3个月控制在预算内', '预算达人', 'BUDGET_MASTER', 2);
INSERT INTO `tb_consumption_achievement` VALUES (3, '2025-11-20 14:20:00.000000', '完成第一笔订单', '首单达成', 'FIRST_ORDER', 3);
INSERT INTO `tb_consumption_achievement` VALUES (4, '2025-12-10 00:00:00.000000', '累计节省超过500元', '省钱之星', 'SAVING_STAR', 3);
INSERT INTO `tb_consumption_achievement` VALUES (5, '2025-11-22 09:15:00.000000', '完成第一笔订单', '首单达成', 'FIRST_ORDER', 4);
INSERT INTO `tb_consumption_achievement` VALUES (6, '2025-11-25 16:45:00.000000', '完成第一笔订单', '首单达成', 'FIRST_ORDER', 5);
INSERT INTO `tb_consumption_achievement` VALUES (7, '2025-12-20 00:00:00.000000', '30天内无冲动消费', '理性消费者', 'RATIONAL_BUYER', 5);
INSERT INTO `tb_consumption_achievement` VALUES (8, '2025-11-28 11:00:00.000000', '完成第一笔订单', '首单达成', 'FIRST_ORDER', 6);
INSERT INTO `tb_consumption_achievement` VALUES (9, '2025-12-01 13:30:00.000000', '完成第一笔订单', '首单达成', 'FIRST_ORDER', 7);
INSERT INTO `tb_consumption_achievement` VALUES (10, '2025-12-05 10:00:00.000000', '完成第一笔订单', '首单达成', 'FIRST_ORDER', 8);
INSERT INTO `tb_consumption_achievement` VALUES (11, '2025-12-08 15:20:00.000000', '完成第一笔订单', '首单达成', 'FIRST_ORDER', 9);
INSERT INTO `tb_consumption_achievement` VALUES (12, '2025-12-10 09:45:00.000000', '完成第一笔订单', '首单达成', 'FIRST_ORDER', 10);
INSERT INTO `tb_consumption_achievement` VALUES (13, '2025-11-15 10:30:00.000000', '完成第一笔订单', '首单达成', 'FIRST_ORDER', 2);
INSERT INTO `tb_consumption_achievement` VALUES (14, '2025-12-01 00:00:00.000000', '连续3个月控制在预算内', '预算达人', 'BUDGET_MASTER', 2);
INSERT INTO `tb_consumption_achievement` VALUES (15, '2025-11-20 14:20:00.000000', '完成第一笔订单', '首单达成', 'FIRST_ORDER', 3);
INSERT INTO `tb_consumption_achievement` VALUES (16, '2025-12-10 00:00:00.000000', '累计节省超过500元', '省钱之星', 'SAVING_STAR', 3);
INSERT INTO `tb_consumption_achievement` VALUES (17, '2025-11-22 09:15:00.000000', '完成第一笔订单', '首单达成', 'FIRST_ORDER', 4);
INSERT INTO `tb_consumption_achievement` VALUES (18, '2025-11-25 16:45:00.000000', '完成第一笔订单', '首单达成', 'FIRST_ORDER', 5);
INSERT INTO `tb_consumption_achievement` VALUES (19, '2025-12-20 00:00:00.000000', '30天内无冲动消费', '理性消费者', 'RATIONAL_BUYER', 5);
INSERT INTO `tb_consumption_achievement` VALUES (20, '2025-11-28 11:00:00.000000', '完成第一笔订单', '首单达成', 'FIRST_ORDER', 6);
INSERT INTO `tb_consumption_achievement` VALUES (21, '2025-12-01 13:30:00.000000', '完成第一笔订单', '首单达成', 'FIRST_ORDER', 7);
INSERT INTO `tb_consumption_achievement` VALUES (22, '2025-12-05 10:00:00.000000', '完成第一笔订单', '首单达成', 'FIRST_ORDER', 8);
INSERT INTO `tb_consumption_achievement` VALUES (23, '2025-12-08 15:20:00.000000', '完成第一笔订单', '首单达成', 'FIRST_ORDER', 9);
INSERT INTO `tb_consumption_achievement` VALUES (24, '2025-12-10 09:45:00.000000', '完成第一笔订单', '首单达成', 'FIRST_ORDER', 10);

-- ----------------------------
-- Table structure for tb_consumption_budget
-- ----------------------------
DROP TABLE IF EXISTS `tb_consumption_budget`;
CREATE TABLE `tb_consumption_budget`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `alert_enabled` bit(1) NULL DEFAULT NULL,
  `alert_threshold` int NULL DEFAULT NULL,
  `budget_month` varchar(6) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `created_time` datetime(6) NULL DEFAULT NULL,
  `monthly_budget` decimal(10, 2) NULL DEFAULT NULL,
  `updated_time` datetime(6) NULL DEFAULT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 10 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of tb_consumption_budget
-- ----------------------------
INSERT INTO `tb_consumption_budget` VALUES (1, b'1', 80, '202601', '2026-01-13 01:24:11.000000', 2000.00, '2026-01-13 01:24:11.000000', 2);
INSERT INTO `tb_consumption_budget` VALUES (2, b'1', 80, '202601', '2026-01-13 01:24:11.000000', 3000.00, '2026-01-13 01:24:11.000000', 3);
INSERT INTO `tb_consumption_budget` VALUES (3, b'1', 90, '202601', '2026-01-13 01:24:11.000000', 1500.00, '2026-01-13 01:24:11.000000', 4);
INSERT INTO `tb_consumption_budget` VALUES (4, b'0', 80, '202601', '2026-01-13 01:24:11.000000', 2500.00, '2026-01-13 01:24:11.000000', 5);
INSERT INTO `tb_consumption_budget` VALUES (5, b'1', 85, '202601', '2026-01-13 01:24:11.000000', 1800.00, '2026-01-13 01:24:11.000000', 6);
INSERT INTO `tb_consumption_budget` VALUES (6, b'1', 80, '202601', '2026-01-13 01:24:11.000000', 1200.00, '2026-01-13 01:24:11.000000', 7);
INSERT INTO `tb_consumption_budget` VALUES (7, b'0', 75, '202601', '2026-01-13 01:24:11.000000', 2200.00, '2026-01-13 01:24:11.000000', 8);
INSERT INTO `tb_consumption_budget` VALUES (8, b'1', 90, '202601', '2026-01-13 01:24:11.000000', 600.00, '2026-01-13 01:24:11.000000', 9);
INSERT INTO `tb_consumption_budget` VALUES (9, b'1', 80, '202601', '2026-01-13 01:24:11.000000', 1000.00, '2026-01-13 01:24:11.000000', 10);

-- ----------------------------
-- Table structure for tb_coupon
-- ----------------------------
DROP TABLE IF EXISTS `tb_coupon`;
CREATE TABLE `tb_coupon`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `claimed_count` int NOT NULL,
  `created_time` datetime(6) NOT NULL,
  `description` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `discount_amount` decimal(10, 2) NULL DEFAULT NULL,
  `discount_rate` decimal(3, 2) NULL DEFAULT NULL,
  `end_time` datetime(6) NOT NULL,
  `limit_per_user` int NOT NULL,
  `max_discount` decimal(10, 2) NULL DEFAULT NULL,
  `min_amount` decimal(10, 2) NULL DEFAULT NULL,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `start_time` datetime(6) NOT NULL,
  `status` int NOT NULL,
  `total_count` int NOT NULL,
  `type` int NOT NULL,
  `updated_time` datetime(6) NOT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 11 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of tb_coupon
-- ----------------------------
INSERT INTO `tb_coupon` VALUES (1, 156, '2026-01-13 01:24:11.000000', '新用户首单立减20元', 20.00, NULL, '2026-12-31 23:59:59.000000', 1, NULL, 100.00, '新人专享20元券', '2025-01-01 00:00:00.000000', 1, 10000, 1, '2026-01-13 01:24:11.000000');
INSERT INTO `tb_coupon` VALUES (2, 234, '2026-01-13 01:24:11.000000', '满300元立减50元', 50.00, NULL, '2026-12-31 23:59:59.000000', 2, NULL, 300.00, '满300减50券', '2025-01-01 00:00:00.000000', 1, 5000, 1, '2026-01-13 01:24:11.000000');
INSERT INTO `tb_coupon` VALUES (3, 156, '2026-01-13 01:24:11.000000', '满500元立减80元', 80.00, NULL, '2026-12-31 23:59:59.000000', 2, NULL, 500.00, '满500减80券', '2025-01-01 00:00:00.000000', 1, 3000, 1, '2026-01-13 01:24:11.000000');
INSERT INTO `tb_coupon` VALUES (4, 89, '2026-01-13 01:24:11.000000', '满1000元立减150元', 150.00, NULL, '2026-12-31 23:59:59.000000', 1, NULL, 1000.00, '满1000减150券', '2025-01-01 00:00:00.000000', 1, 2000, 1, '2026-01-13 01:24:11.000000');
INSERT INTO `tb_coupon` VALUES (5, 67, '2026-01-13 01:24:11.000000', '数码产品9折优惠', NULL, 0.90, '2026-12-31 23:59:59.000000', 1, 200.00, 500.00, '数码专享9折券', '2025-01-01 00:00:00.000000', 1, 1500, 2, '2026-01-13 01:24:11.000000');
INSERT INTO `tb_coupon` VALUES (6, 123, '2026-01-13 01:24:11.000000', '美妆护肤8.5折', NULL, 0.85, '2026-12-31 23:59:59.000000', 2, 100.00, 200.00, '美妆8.5折券', '2025-01-01 00:00:00.000000', 1, 2000, 2, '2026-01-13 01:24:11.000000');
INSERT INTO `tb_coupon` VALUES (7, 189, '2026-01-13 01:24:11.000000', '服装鞋帽满减', 30.00, NULL, '2026-12-31 23:59:59.000000', 3, NULL, 200.00, '服装满200减30', '2025-01-01 00:00:00.000000', 1, 3000, 1, '2026-01-13 01:24:11.000000');
INSERT INTO `tb_coupon` VALUES (8, 345, '2026-01-13 01:24:11.000000', '食品饮料满减', 15.00, NULL, '2026-12-31 23:59:59.000000', 5, NULL, 99.00, '食品满99减15', '2025-01-01 00:00:00.000000', 1, 5000, 1, '2026-01-13 01:24:11.000000');
INSERT INTO `tb_coupon` VALUES (9, 45, '2026-01-13 01:24:11.000000', '新年大促满800减100', 100.00, NULL, '2026-01-31 23:59:59.000000', 1, NULL, 800.00, '新年特惠100元券', '2026-01-01 00:00:00.000000', 1, 1000, 1, '2026-01-13 01:24:11.000000');
INSERT INTO `tb_coupon` VALUES (10, 23, '2026-01-13 01:24:11.000000', 'VIP会员专属折扣', NULL, 0.95, '2026-12-31 23:59:59.000000', 1, 500.00, 100.00, '会员专享95折', '2025-01-01 00:00:00.000000', 1, 500, 2, '2026-01-13 01:24:11.000000');

-- ----------------------------
-- Table structure for tb_order
-- ----------------------------
DROP TABLE IF EXISTS `tb_order`;
CREATE TABLE `tb_order`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '订单ID',
  `order_no` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '订单编号',
  `user_id` bigint NOT NULL COMMENT '用户ID',
  `total_amount` decimal(10, 2) NOT NULL COMMENT '订单总金额',
  `pay_amount` decimal(10, 2) NULL DEFAULT NULL COMMENT '实付金额',
  `payment_method` tinyint NOT NULL DEFAULT 1,
  `payment_status` tinyint NOT NULL DEFAULT 0,
  `order_status` tinyint NOT NULL DEFAULT 0,
  `shipping_address` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '收货地址（JSON格式）',
  `payment_time` datetime NULL DEFAULT NULL COMMENT '支付时间',
  `shipping_time` datetime NULL DEFAULT NULL COMMENT '发货时间',
  `end_time` datetime NULL DEFAULT NULL COMMENT '完成时间',
  `remark` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '订单备注',
  `created_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `coupon_discount` decimal(10, 2) NULL DEFAULT NULL,
  `coupon_id` bigint NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `order_no`(`order_no` ASC) USING BTREE,
  INDEX `idx_order_user`(`user_id` ASC) USING BTREE,
  INDEX `idx_order_no`(`order_no` ASC) USING BTREE,
  INDEX `idx_order_status`(`order_status` ASC) USING BTREE,
  INDEX `idx_order_payment_status`(`payment_status` ASC) USING BTREE,
  CONSTRAINT `fk_order_user` FOREIGN KEY (`user_id`) REFERENCES `tb_user` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 31 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '订单表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of tb_order
-- ----------------------------
INSERT INTO `tb_order` VALUES (1, 'ORD202501100001', 2, 9999.00, 9899.00, 1, 1, 3, '{\"receiver\":\"张三\",\"phone\":\"13812345678\",\"province\":\"北京市\",\"city\":\"北京市\",\"district\":\"朝阳区\",\"detail\":\"建国路88号SOHO现代城A座1001室\"}', '2025-01-10 10:35:00', '2025-01-11 09:00:00', '2025-01-15 14:30:00', '请工作日送货', '2025-01-10 10:30:00', '2026-01-13 01:12:24', 100.00, 4);
INSERT INTO `tb_order` VALUES (2, 'ORD202501120002', 3, 6999.00, 6899.00, 1, 1, 3, '{\"receiver\":\"李四\",\"phone\":\"13987654321\",\"province\":\"上海市\",\"city\":\"上海市\",\"district\":\"浦东新区\",\"detail\":\"陆家嘴环路1000号恒生大厦2002室\"}', '2025-01-12 14:20:00', '2025-01-13 08:30:00', '2025-01-17 16:00:00', NULL, '2025-01-12 14:15:00', '2026-01-13 01:12:24', 100.00, 4);
INSERT INTO `tb_order` VALUES (3, 'ORD202501150003', 4, 2999.00, 2799.00, 2, 1, 3, '{\"receiver\":\"王五\",\"phone\":\"13666666666\",\"province\":\"广东省\",\"city\":\"深圳市\",\"district\":\"南山区\",\"detail\":\"科技园南区飞亚达大厦3003室\"}', '2025-01-15 11:10:00', '2025-01-16 09:00:00', '2025-01-20 15:20:00', '周末可以送货', '2025-01-15 11:00:00', '2026-01-13 01:12:24', 200.00, 6);
INSERT INTO `tb_order` VALUES (4, 'ORD202501180004', 5, 336.00, 286.00, 1, 1, 3, '{\"receiver\":\"赵六\",\"phone\":\"13555555555\",\"province\":\"浙江省\",\"city\":\"杭州市\",\"district\":\"西湖区\",\"detail\":\"文三路478号华星广场A座1205室\"}', '2025-01-18 16:45:00', '2025-01-19 10:00:00', '2025-01-22 11:30:00', NULL, '2025-01-18 16:40:00', '2026-01-13 01:12:24', 50.00, 2);
INSERT INTO `tb_order` VALUES (5, 'ORD202501200005', 6, 1798.00, 1738.00, 1, 1, 3, '{\"receiver\":\"孙七\",\"phone\":\"13444444444\",\"province\":\"江苏省\",\"city\":\"南京市\",\"district\":\"鼓楼区\",\"detail\":\"中山北路88号建伟大厦1506室\"}', '2025-01-20 09:30:00', '2025-01-21 08:00:00', '2025-01-25 14:00:00', NULL, '2025-01-20 09:25:00', '2026-01-13 01:12:24', 60.00, 7);
INSERT INTO `tb_order` VALUES (6, 'ORD202501210006', 7, 4599.00, 4399.00, 1, 1, 3, '{\"receiver\":\"周八\",\"phone\":\"13333333333\",\"province\":\"四川省\",\"city\":\"成都市\",\"district\":\"武侯区\",\"detail\":\"天府大道北段1700号环球中心E1区\"}', '2025-01-21 15:20:00', '2025-01-22 09:30:00', '2025-01-27 16:45:00', '送货前请电话联系', '2025-01-21 15:15:00', '2026-01-13 01:12:24', 200.00, 6);
INSERT INTO `tb_order` VALUES (7, 'ORD202501220007', 8, 266.00, 246.00, 2, 1, 3, '{\"receiver\":\"吴九\",\"phone\":\"13222222222\",\"province\":\"湖北省\",\"city\":\"武汉市\",\"district\":\"洪山区\",\"detail\":\"珞喻路1037号华中科技大学\"}', '2025-01-22 11:00:00', '2025-01-23 08:00:00', '2025-01-26 10:30:00', NULL, '2025-01-22 10:55:00', '2026-01-13 01:12:24', 20.00, 8);
INSERT INTO `tb_order` VALUES (8, 'ORD202501230008', 9, 2670.00, 2590.00, 1, 1, 3, '{\"receiver\":\"郑十\",\"phone\":\"13111111111\",\"province\":\"陕西省\",\"city\":\"西安市\",\"district\":\"雁塔区\",\"detail\":\"高新路88号尚品国际A座1808室\"}', '2025-01-23 14:35:00', '2025-01-24 09:00:00', '2025-01-28 15:00:00', NULL, '2025-01-23 14:30:00', '2026-01-13 01:12:24', 80.00, 5);
INSERT INTO `tb_order` VALUES (9, 'ORD202501250009', 10, 80.00, 80.00, 1, 1, 2, '{\"receiver\":\"小明\",\"phone\":\"15012345678\",\"province\":\"山东省\",\"city\":\"青岛市\",\"district\":\"市南区\",\"detail\":\"香港中路67号书城公寓1203室\"}', '2025-01-25 10:20:00', '2025-01-26 08:30:00', NULL, NULL, '2025-01-25 10:15:00', '2026-01-13 01:12:24', NULL, NULL);
INSERT INTO `tb_order` VALUES (10, 'ORD202501260010', 11, 670.00, 670.00, 2, 1, 2, '{\"receiver\":\"小红\",\"phone\":\"15112345678\",\"province\":\"福建省\",\"city\":\"厦门市\",\"district\":\"思明区\",\"detail\":\"软件园二期望海路23号\"}', '2025-01-26 15:40:00', '2025-01-27 09:00:00', NULL, '请放快递柜', '2025-01-26 15:35:00', '2026-01-13 01:12:24', NULL, NULL);
INSERT INTO `tb_order` VALUES (11, 'ORD202501270011', 12, 15798.00, 15648.00, 1, 1, 2, '{\"receiver\":\"大明\",\"phone\":\"15212345678\",\"province\":\"广东省\",\"city\":\"广州市\",\"district\":\"天河区\",\"detail\":\"天河路385号太古汇一座3506室\"}', '2025-01-27 11:10:00', '2025-01-28 08:00:00', NULL, '公司地址工作日送', '2025-01-27 11:05:00', '2026-01-13 01:12:24', 150.00, 9);
INSERT INTO `tb_order` VALUES (12, 'ORD202501270012', 2, 1590.00, 1510.00, 1, 1, 2, '{\"receiver\":\"张三\",\"phone\":\"13812345678\",\"province\":\"北京市\",\"city\":\"北京市\",\"district\":\"海淀区\",\"detail\":\"中关村大街1号软件园B座502室\"}', '2025-01-27 16:25:00', '2025-01-28 09:30:00', NULL, NULL, '2025-01-27 16:20:00', '2026-01-13 01:12:24', 80.00, 5);
INSERT INTO `tb_order` VALUES (13, 'ORD202501280013', 13, 1098.00, 1098.00, 1, 1, 1, '{\"receiver\":\"小丽\",\"phone\":\"15312345678\",\"province\":\"河南省\",\"city\":\"郑州市\",\"district\":\"金水区\",\"detail\":\"农业路72号国际企业中心A座\"}', '2025-01-28 09:50:00', NULL, NULL, '尽快发货', '2025-01-28 09:45:00', '2026-01-13 01:12:24', NULL, NULL);
INSERT INTO `tb_order` VALUES (14, 'ORD202501280014', 14, 3999.00, 3999.00, 2, 1, 1, '{\"receiver\":\"老王\",\"phone\":\"15412345678\",\"province\":\"辽宁省\",\"city\":\"大连市\",\"district\":\"中山区\",\"detail\":\"人民路23号虹源大厦1102室\"}', '2025-01-28 14:30:00', NULL, NULL, NULL, '2025-01-28 14:25:00', '2026-01-13 01:12:24', NULL, NULL);
INSERT INTO `tb_order` VALUES (15, 'ORD202501280015', 15, 899.00, 839.00, 1, 1, 1, '{\"receiver\":\"小张\",\"phone\":\"15512345678\",\"province\":\"天津市\",\"city\":\"天津市\",\"district\":\"和平区\",\"detail\":\"南京路189号津汇广场2301室\"}', '2025-01-28 17:15:00', NULL, NULL, NULL, '2025-01-28 17:10:00', '2026-01-13 01:12:24', 60.00, 7);
INSERT INTO `tb_order` VALUES (16, 'ORD202501290016', 16, 5999.00, 5999.00, 1, 0, 0, '{\"receiver\":\"晨晨\",\"phone\":\"15612345678\",\"province\":\"重庆市\",\"city\":\"重庆市\",\"district\":\"渝中区\",\"detail\":\"解放碑民权路28号英利中心3205室\"}', NULL, NULL, NULL, NULL, '2025-01-29 10:00:00', '2026-01-13 01:12:24', NULL, NULL);
INSERT INTO `tb_order` VALUES (17, 'ORD202501290017', 17, 1999.00, 1999.00, 1, 0, 0, '{\"receiver\":\"琳琳\",\"phone\":\"15712345678\",\"province\":\"湖南省\",\"city\":\"长沙市\",\"district\":\"岳麓区\",\"detail\":\"麓谷大道658号企业广场C1栋\"}', NULL, NULL, NULL, '希望能便宜点', '2025-01-29 11:30:00', '2026-01-13 01:12:24', NULL, NULL);
INSERT INTO `tb_order` VALUES (18, 'ORD202501290018', 18, 4990.00, 4990.00, 1, 0, 0, '{\"receiver\":\"洋洋\",\"phone\":\"15812345678\",\"province\":\"安徽省\",\"city\":\"合肥市\",\"district\":\"蜀山区\",\"detail\":\"长江西路189号之心城A座2008室\"}', NULL, NULL, NULL, NULL, '2025-01-29 14:20:00', '2026-01-13 01:12:24', NULL, NULL);
INSERT INTO `tb_order` VALUES (19, 'ORD202412150019', 2, 1299.00, 1239.00, 1, 1, 3, '{\"receiver\":\"张三\",\"phone\":\"13812345678\",\"province\":\"北京市\",\"city\":\"北京市\",\"district\":\"朝阳区\",\"detail\":\"建国路88号SOHO现代城A座1001室\"}', '2024-12-15 10:30:00', '2024-12-16 09:00:00', '2024-12-20 14:00:00', NULL, '2024-12-15 10:25:00', '2026-01-13 01:12:24', 60.00, 7);
INSERT INTO `tb_order` VALUES (20, 'ORD202412200020', 3, 4299.00, 4099.00, 1, 1, 3, '{\"receiver\":\"李四\",\"phone\":\"13987654321\",\"province\":\"上海市\",\"city\":\"上海市\",\"district\":\"浦东新区\",\"detail\":\"陆家嘴环路1000号恒生大厦2002室\"}', '2024-12-20 15:45:00', '2024-12-21 08:30:00', '2024-12-25 16:30:00', NULL, '2024-12-20 15:40:00', '2026-01-13 01:12:24', 200.00, 6);
INSERT INTO `tb_order` VALUES (21, 'ORD202412250021', 4, 168.00, 168.00, 2, 1, 3, '{\"receiver\":\"王五\",\"phone\":\"13666666666\",\"province\":\"广东省\",\"city\":\"深圳市\",\"district\":\"南山区\",\"detail\":\"科技园南区飞亚达大厦3003室\"}', '2024-12-25 11:20:00', '2024-12-26 09:00:00', '2024-12-30 10:45:00', NULL, '2024-12-25 11:15:00', '2026-01-13 01:12:24', NULL, NULL);
INSERT INTO `tb_order` VALUES (22, 'ORD202501050022', 5, 799.00, 799.00, 1, 1, 3, '{\"receiver\":\"赵六\",\"phone\":\"13555555555\",\"province\":\"浙江省\",\"city\":\"杭州市\",\"district\":\"西湖区\",\"detail\":\"文三路478号华星广场A座1205室\"}', '2025-01-05 14:10:00', '2025-01-06 08:00:00', '2025-01-10 15:30:00', NULL, '2025-01-05 14:05:00', '2026-01-13 01:12:24', NULL, NULL);
INSERT INTO `tb_order` VALUES (23, 'ORD202501080023', 19, 590.00, 590.00, 1, 1, 3, '{\"receiver\":\"慧慧\",\"phone\":\"15912345678\",\"province\":\"江西省\",\"city\":\"南昌市\",\"district\":\"红谷滩区\",\"detail\":\"红谷中大道1326号省医院宿舍\"}', '2025-01-08 09:40:00', '2025-01-09 08:30:00', '2025-01-13 11:00:00', NULL, '2025-01-08 09:35:00', '2026-01-13 01:12:24', NULL, NULL);
INSERT INTO `tb_order` VALUES (24, 'ORD202501100024', 20, 14999.00, 14849.00, 1, 1, 3, '{\"receiver\":\"明明\",\"phone\":\"13012345678\",\"province\":\"河北省\",\"city\":\"石家庄市\",\"district\":\"长安区\",\"detail\":\"中山东路508号东胜广场A座\"}', '2025-01-10 16:55:00', '2025-01-11 09:00:00', '2025-01-16 14:20:00', '公司报销需要发票', '2025-01-10 16:50:00', '2026-01-13 01:12:24', 150.00, 9);
INSERT INTO `tb_order` VALUES (25, 'ORD202501150025', 6, 459.00, 459.00, 1, 0, 4, '{\"receiver\":\"孙七\",\"phone\":\"13444444444\",\"province\":\"江苏省\",\"city\":\"南京市\",\"district\":\"鼓楼区\",\"detail\":\"中山北路88号建伟大厦1506室\"}', NULL, NULL, NULL, '不想要了', '2025-01-15 20:00:00', '2026-01-13 01:12:24', NULL, NULL);
INSERT INTO `tb_order` VALUES (26, 'ORD202501200026', 7, 98.00, 98.00, 1, 0, 4, '{\"receiver\":\"周八\",\"phone\":\"13333333333\",\"province\":\"四川省\",\"city\":\"成都市\",\"district\":\"武侯区\",\"detail\":\"天府大道北段1700号环球中心E1区\"}', NULL, NULL, NULL, NULL, '2025-01-20 22:30:00', '2026-01-13 01:12:24', NULL, NULL);
INSERT INTO `tb_order` VALUES (27, 'ORD202501280027', 3, 1080.00, 1000.00, 1, 1, 2, '{\"receiver\":\"李四\",\"phone\":\"13987654321\",\"province\":\"上海市\",\"city\":\"上海市\",\"district\":\"徐汇区\",\"detail\":\"漕溪北路88号圣爱大厦1203室\"}', '2025-01-28 10:20:00', '2025-01-29 08:00:00', NULL, NULL, '2025-01-28 10:15:00', '2026-01-13 01:12:24', 80.00, 5);
INSERT INTO `tb_order` VALUES (28, 'ORD202501280028', 4, 320.00, 270.00, 2, 1, 2, '{\"receiver\":\"王五\",\"phone\":\"13666666666\",\"province\":\"广东省\",\"city\":\"深圳市\",\"district\":\"福田区\",\"detail\":\"深南大道6011号NEO大厦A座\"}', '2025-01-28 15:40:00', '2025-01-29 09:00:00', NULL, NULL, '2025-01-28 15:35:00', '2026-01-13 01:12:24', 50.00, 2);
INSERT INTO `tb_order` VALUES (29, 'ORD202501290029', 8, 299.00, 299.00, 1, 1, 5, '{\"receiver\":\"吴九\",\"phone\":\"13222222222\",\"province\":\"湖北省\",\"city\":\"武汉市\",\"district\":\"洪山区\",\"detail\":\"珞喻路1037号华中科技大学\"}', '2025-01-29 09:10:00', NULL, NULL, '买错了想退', '2025-01-29 09:05:00', '2026-01-13 01:12:24', NULL, NULL);
INSERT INTO `tb_order` VALUES (30, 'ORD202501290030', 9, 350.00, 350.00, 1, 0, 0, '{\"receiver\":\"郑十\",\"phone\":\"13111111111\",\"province\":\"陕西省\",\"city\":\"西安市\",\"district\":\"碑林区\",\"detail\":\"南大街1号骡马市步行街\"}', NULL, NULL, NULL, NULL, '2025-01-29 16:00:00', '2026-01-13 01:12:24', NULL, NULL);

-- ----------------------------
-- Table structure for tb_order_item
-- ----------------------------
DROP TABLE IF EXISTS `tb_order_item`;
CREATE TABLE `tb_order_item`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '订单项ID',
  `order_id` bigint NOT NULL COMMENT '订单ID',
  `product_id` bigint NOT NULL COMMENT '商品ID',
  `product_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '商品名称（快照）',
  `product_price` decimal(10, 2) NOT NULL COMMENT '商品单价（快照）',
  `quantity` int NOT NULL DEFAULT 1 COMMENT '购买数量',
  `total_price` decimal(10, 2) NOT NULL COMMENT '小计金额',
  `product_image` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '商品图片（快照）',
  `seller_id` bigint NULL DEFAULT NULL COMMENT '卖家ID',
  `seller_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '卖家用户名',
  `ship_status` tinyint NULL DEFAULT 0,
  `ship_time` datetime NULL DEFAULT NULL COMMENT '发货时间',
  `created_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_order_item_order`(`order_id` ASC) USING BTREE,
  INDEX `idx_order_item_product`(`product_id` ASC) USING BTREE,
  INDEX `idx_order_item_seller`(`seller_id` ASC) USING BTREE,
  CONSTRAINT `fk_order_item_order` FOREIGN KEY (`order_id`) REFERENCES `tb_order` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_order_item_product` FOREIGN KEY (`product_id`) REFERENCES `tb_product` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 46 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '订单项表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of tb_order_item
-- ----------------------------
INSERT INTO `tb_order_item` VALUES (1, 1, 1, 'iPhone 15 Pro Max 256GB', 9999.00, 1, 9999.00, '/products/iphone15.jpg', NULL, NULL, 0, NULL, '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `tb_order_item` VALUES (2, 2, 2, '华为Mate 60 Pro', 6999.00, 1, 6999.00, '/products/mate60.jpg', NULL, NULL, 0, NULL, '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `tb_order_item` VALUES (3, 3, 16, '美的1.5匹变频空调', 2999.00, 1, 2999.00, '/products/midea.jpg', NULL, NULL, 0, NULL, '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `tb_order_item` VALUES (4, 4, 33, '三只松鼠坚果大礼包', 168.00, 2, 336.00, '/products/nuts.jpg', NULL, NULL, 0, NULL, '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `tb_order_item` VALUES (5, 5, 21, '耐克Air Max 270运动鞋', 899.00, 2, 1798.00, '/products/nike.jpg', NULL, NULL, 0, NULL, '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `tb_order_item` VALUES (6, 6, 15, '海尔470升十字对开门冰箱', 4599.00, 1, 4599.00, '/products/haier.jpg', NULL, NULL, 0, NULL, '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `tb_order_item` VALUES (7, 7, 39, '三体全集典藏版', 98.00, 1, 98.00, '/products/santi.jpg', NULL, NULL, 0, NULL, '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `tb_order_item` VALUES (8, 7, 33, '三只松鼠坚果大礼包', 168.00, 1, 168.00, '/products/nuts.jpg', NULL, NULL, 0, NULL, '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `tb_order_item` VALUES (9, 8, 27, 'SK-II神仙水230ml', 1590.00, 1, 1590.00, '/products/skii.jpg', NULL, NULL, 0, NULL, '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `tb_order_item` VALUES (10, 8, 28, '兰蔻小黑瓶精华50ml', 1080.00, 1, 1080.00, '/products/lancome.jpg', NULL, NULL, 0, NULL, '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `tb_order_item` VALUES (11, 9, 42, '斑马牌中性笔10支装', 25.00, 2, 50.00, '/products/zebra.jpg', NULL, NULL, 0, NULL, '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `tb_order_item` VALUES (12, 9, 41, '百年孤独', 55.00, 1, 55.00, '/products/bainian.jpg', NULL, NULL, 0, NULL, '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `tb_order_item` VALUES (13, 10, 31, 'YSL小金条口红', 320.00, 1, 320.00, '/products/ysl.jpg', NULL, NULL, 0, NULL, '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `tb_order_item` VALUES (14, 10, 32, '迪奥烈艳蓝金唇膏', 350.00, 1, 350.00, '/products/dior.jpg', NULL, NULL, 0, NULL, '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `tb_order_item` VALUES (15, 11, 9, 'MacBook Pro 14英寸 M3 Pro', 14999.00, 1, 14999.00, '/products/macbook.jpg', NULL, NULL, 0, NULL, '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `tb_order_item` VALUES (16, 11, 13, '罗技MX Master 3S', 799.00, 1, 799.00, '/products/mouse.jpg', NULL, NULL, 0, NULL, '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `tb_order_item` VALUES (17, 12, 27, 'SK-II神仙水230ml', 1590.00, 1, 1590.00, '/products/skii.jpg', NULL, NULL, 0, NULL, '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `tb_order_item` VALUES (18, 13, 48, '好孩子婴儿推车', 899.00, 1, 899.00, '/products/goodbaby.jpg', NULL, NULL, 0, NULL, '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `tb_order_item` VALUES (19, 13, 49, '帮宝适纸尿裤L码', 199.00, 1, 199.00, '/products/pampers.jpg', NULL, NULL, 0, NULL, '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `tb_order_item` VALUES (20, 14, 19, '小米电视75英寸', 3999.00, 1, 3999.00, '/products/mitv.jpg', NULL, NULL, 0, NULL, '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `tb_order_item` VALUES (21, 15, 21, '耐克Air Max 270运动鞋', 899.00, 1, 899.00, '/products/nike.jpg', NULL, NULL, 0, NULL, '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `tb_order_item` VALUES (22, 16, 3, '小米14 Ultra', 5999.00, 1, 5999.00, '/products/mi14.jpg', NULL, NULL, 0, NULL, '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `tb_order_item` VALUES (23, 17, 44, '迪卡侬跑步机', 1999.00, 1, 1999.00, '/products/decathlon.jpg', NULL, NULL, 0, NULL, '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `tb_order_item` VALUES (24, 18, 18, '戴森V15吸尘器', 4990.00, 1, 4990.00, '/products/dyson.jpg', NULL, NULL, 0, NULL, '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `tb_order_item` VALUES (25, 19, 22, '阿迪达斯Ultraboost跑鞋', 1299.00, 1, 1299.00, '/products/adidas.jpg', NULL, NULL, 0, NULL, '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `tb_order_item` VALUES (26, 20, 17, '西门子10公斤滚筒洗衣机', 4299.00, 1, 4299.00, '/products/siemens.jpg', NULL, NULL, 0, NULL, '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `tb_order_item` VALUES (27, 21, 33, '三只松鼠坚果大礼包', 168.00, 1, 168.00, '/products/nuts.jpg', NULL, NULL, 0, NULL, '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `tb_order_item` VALUES (28, 22, 13, '罗技MX Master 3S', 799.00, 1, 799.00, '/products/mouse.jpg', NULL, NULL, 0, NULL, '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `tb_order_item` VALUES (29, 23, 29, '雅诗兰黛小棕瓶眼霜15ml', 590.00, 1, 590.00, '/products/estee.jpg', NULL, NULL, 0, NULL, '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `tb_order_item` VALUES (30, 24, 9, 'MacBook Pro 14英寸 M3 Pro', 14999.00, 1, 14999.00, '/products/macbook.jpg', NULL, NULL, 0, NULL, '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `tb_order_item` VALUES (31, 25, 47, '骆驼户外帐篷', 459.00, 1, 459.00, '/products/camel.jpg', NULL, NULL, 0, NULL, '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `tb_order_item` VALUES (32, 26, 39, '三体全集典藏版', 98.00, 1, 98.00, '/products/santi.jpg', NULL, NULL, 0, NULL, '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `tb_order_item` VALUES (33, 27, 28, '兰蔻小黑瓶精华50ml', 1080.00, 1, 1080.00, '/products/lancome.jpg', NULL, NULL, 0, NULL, '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `tb_order_item` VALUES (34, 28, 31, 'YSL小金条口红', 320.00, 1, 320.00, '/products/ysl.jpg', NULL, NULL, 0, NULL, '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `tb_order_item` VALUES (35, 29, 45, '李宁羽毛球拍', 299.00, 1, 299.00, '/products/lining.jpg', NULL, NULL, 0, NULL, '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `tb_order_item` VALUES (36, 30, 32, '迪奥烈艳蓝金唇膏', 350.00, 1, 350.00, '/products/dior.jpg', NULL, NULL, 0, NULL, '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `tb_order_item` VALUES (37, 1, 8, 'AirPods Pro 2', 1899.00, 1, 1899.00, '/products/airpods.jpg', NULL, NULL, 0, NULL, '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `tb_order_item` VALUES (38, 2, 8, 'AirPods Pro 2', 1899.00, 1, 1899.00, '/products/airpods.jpg', NULL, NULL, 0, NULL, '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `tb_order_item` VALUES (39, 5, 26, 'New Balance 574复古跑鞋', 769.00, 1, 769.00, '/products/nb.jpg', NULL, NULL, 0, NULL, '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `tb_order_item` VALUES (40, 8, 31, 'YSL小金条口红', 320.00, 2, 640.00, '/products/ysl.jpg', NULL, NULL, 0, NULL, '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `tb_order_item` VALUES (41, 11, 42, '斑马牌中性笔10支装', 25.00, 2, 50.00, '/products/zebra.jpg', NULL, NULL, 0, NULL, '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `tb_order_item` VALUES (42, 19, 23, '优衣库轻薄羽绒服', 499.00, 1, 499.00, '/products/uniqlo.jpg', NULL, NULL, 0, NULL, '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `tb_order_item` VALUES (43, 22, 42, '斑马牌中性笔10支装', 25.00, 1, 25.00, '/products/zebra.jpg', NULL, NULL, 0, NULL, '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `tb_order_item` VALUES (44, 24, 13, '罗技MX Master 3S', 799.00, 1, 799.00, '/products/mouse.jpg', NULL, NULL, 0, NULL, '2026-01-13 01:12:24', '2026-01-13 01:12:24');
INSERT INTO `tb_order_item` VALUES (45, 27, 29, '雅诗兰黛小棕瓶眼霜15ml', 590.00, 1, 590.00, '/products/estee.jpg', NULL, NULL, 0, NULL, '2026-01-13 01:12:24', '2026-01-13 01:12:24');

-- ----------------------------
-- Table structure for tb_price_alert
-- ----------------------------
DROP TABLE IF EXISTS `tb_price_alert`;
CREATE TABLE `tb_price_alert`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_time` datetime(6) NOT NULL,
  `current_price` decimal(10, 2) NOT NULL,
  `notified` bit(1) NULL DEFAULT NULL,
  `product_id` bigint NOT NULL,
  `status` int NOT NULL,
  `target_price` decimal(10, 2) NOT NULL,
  `triggered_price` decimal(10, 2) NULL DEFAULT NULL,
  `triggered_time` datetime(6) NULL DEFAULT NULL,
  `updated_time` datetime(6) NOT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_user_product`(`user_id` ASC, `product_id` ASC) USING BTREE,
  INDEX `idx_price_alert_user`(`user_id` ASC) USING BTREE,
  INDEX `idx_price_alert_product`(`product_id` ASC) USING BTREE,
  INDEX `idx_price_alert_status`(`status` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 16 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of tb_price_alert
-- ----------------------------
INSERT INTO `tb_price_alert` VALUES (1, '2026-01-08 10:00:00.000000', 9999.00, b'0', 1, 0, 9500.00, NULL, NULL, '2026-01-08 10:00:00.000000', 22);
INSERT INTO `tb_price_alert` VALUES (2, '2026-01-09 11:00:00.000000', 4299.00, b'0', 52, 0, 4000.00, NULL, NULL, '2026-01-09 11:00:00.000000', 22);
INSERT INTO `tb_price_alert` VALUES (3, '2026-01-07 14:00:00.000000', 1590.00, b'0', 27, 0, 1500.00, NULL, NULL, '2026-01-07 14:00:00.000000', 23);
INSERT INTO `tb_price_alert` VALUES (4, '2026-01-06 09:00:00.000000', 899.00, b'0', 21, 0, 800.00, NULL, NULL, '2026-01-06 09:00:00.000000', 24);
INSERT INTO `tb_price_alert` VALUES (5, '2026-01-05 16:00:00.000000', 168.00, b'0', 33, 0, 150.00, NULL, NULL, '2026-01-05 16:00:00.000000', 25);
INSERT INTO `tb_price_alert` VALUES (6, '2026-01-04 11:00:00.000000', 2699.00, b'0', 55, 0, 2500.00, NULL, NULL, '2026-01-04 11:00:00.000000', 26);
INSERT INTO `tb_price_alert` VALUES (7, '2026-01-03 08:00:00.000000', 299.00, b'0', 64, 0, 250.00, NULL, NULL, '2026-01-03 08:00:00.000000', 27);
INSERT INTO `tb_price_alert` VALUES (8, '2026-01-02 10:00:00.000000', 14999.00, b'0', 9, 0, 14000.00, NULL, NULL, '2026-01-02 10:00:00.000000', 28);
INSERT INTO `tb_price_alert` VALUES (9, '2026-01-01 14:00:00.000000', 569.00, b'0', 65, 0, 500.00, NULL, NULL, '2026-01-01 14:00:00.000000', 29);
INSERT INTO `tb_price_alert` VALUES (10, '2025-12-31 09:00:00.000000', 3299.00, b'0', 53, 0, 3000.00, NULL, NULL, '2025-12-31 09:00:00.000000', 30);
INSERT INTO `tb_price_alert` VALUES (11, '2025-12-30 16:00:00.000000', 199.00, b'0', 69, 0, 180.00, NULL, NULL, '2025-12-30 16:00:00.000000', 31);
INSERT INTO `tb_price_alert` VALUES (12, '2025-12-29 11:00:00.000000', 4999.00, b'0', 61, 0, 4500.00, NULL, NULL, '2025-12-29 11:00:00.000000', 32);
INSERT INTO `tb_price_alert` VALUES (13, '2025-12-28 08:00:00.000000', 89.90, b'0', 71, 0, 80.00, NULL, NULL, '2025-12-28 08:00:00.000000', 33);
INSERT INTO `tb_price_alert` VALUES (14, '2025-12-27 10:00:00.000000', 13999.00, b'0', 57, 0, 13000.00, NULL, NULL, '2025-12-27 10:00:00.000000', 34);
INSERT INTO `tb_price_alert` VALUES (15, '2025-12-26 14:00:00.000000', 1299.00, b'0', 68, 0, 1200.00, NULL, NULL, '2025-12-26 14:00:00.000000', 35);

-- ----------------------------
-- Table structure for tb_price_history
-- ----------------------------
DROP TABLE IF EXISTS `tb_price_history`;
CREATE TABLE `tb_price_history`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `change_amount` decimal(10, 2) NULL DEFAULT NULL,
  `change_rate` decimal(5, 2) NULL DEFAULT NULL,
  `change_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `original_price` decimal(10, 2) NULL DEFAULT NULL,
  `price` decimal(10, 2) NOT NULL,
  `product_id` bigint NOT NULL,
  `recorded_time` datetime(6) NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_price_history_product`(`product_id` ASC) USING BTREE,
  INDEX `idx_price_history_time`(`recorded_time` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 30 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of tb_price_history
-- ----------------------------
INSERT INTO `tb_price_history` VALUES (1, -300.00, -6.52, 'DECREASE', 4599.00, 4299.00, 52, '2026-01-01 00:00:00.000000');
INSERT INTO `tb_price_history` VALUES (2, -300.00, -8.34, 'DECREASE', 3599.00, 3299.00, 53, '2026-01-01 00:00:00.000000');
INSERT INTO `tb_price_history` VALUES (3, -300.00, -8.83, 'DECREASE', 3399.00, 3099.00, 54, '2026-01-01 00:00:00.000000');
INSERT INTO `tb_price_history` VALUES (4, -300.00, -10.00, 'DECREASE', 2999.00, 2699.00, 55, '2026-01-01 00:00:00.000000');
INSERT INTO `tb_price_history` VALUES (5, -300.00, -11.54, 'DECREASE', 2599.00, 2299.00, 56, '2026-01-01 00:00:00.000000');
INSERT INTO `tb_price_history` VALUES (6, -2000.00, -12.50, 'DECREASE', 15999.00, 13999.00, 57, '2025-12-12 00:00:00.000000');
INSERT INTO `tb_price_history` VALUES (7, -2000.00, -14.29, 'DECREASE', 13999.00, 11999.00, 58, '2025-12-12 00:00:00.000000');
INSERT INTO `tb_price_history` VALUES (8, -500.00, -14.29, 'DECREASE', 3499.00, 2999.00, 59, '2025-12-12 00:00:00.000000');
INSERT INTO `tb_price_history` VALUES (9, -100.00, -12.52, 'DECREASE', 799.00, 699.00, 60, '2025-12-12 00:00:00.000000');
INSERT INTO `tb_price_history` VALUES (10, -500.00, -9.09, 'DECREASE', 5499.00, 4999.00, 61, '2025-11-11 00:00:00.000000');
INSERT INTO `tb_price_history` VALUES (11, -400.00, -10.81, 'DECREASE', 3699.00, 3299.00, 62, '2025-11-11 00:00:00.000000');
INSERT INTO `tb_price_history` VALUES (12, -200.00, -13.34, 'DECREASE', 1499.00, 1299.00, 63, '2025-11-11 00:00:00.000000');
INSERT INTO `tb_price_history` VALUES (13, -100.00, -25.06, 'DECREASE', 399.00, 299.00, 64, '2025-11-11 00:00:00.000000');
INSERT INTO `tb_price_history` VALUES (14, -130.00, -18.60, 'DECREASE', 699.00, 569.00, 65, '2025-11-11 00:00:00.000000');
INSERT INTO `tb_price_history` VALUES (15, -200.00, -20.02, 'DECREASE', 999.00, 799.00, 66, '2025-11-11 00:00:00.000000');
INSERT INTO `tb_price_history` VALUES (16, -100.00, -20.04, 'DECREASE', 499.00, 399.00, 67, '2025-11-11 00:00:00.000000');
INSERT INTO `tb_price_history` VALUES (17, -300.00, -18.76, 'DECREASE', 1599.00, 1299.00, 68, '2025-11-11 00:00:00.000000');
INSERT INTO `tb_price_history` VALUES (18, -60.00, -23.17, 'DECREASE', 259.00, 199.00, 69, '2025-11-11 00:00:00.000000');
INSERT INTO `tb_price_history` VALUES (19, -60.00, -18.24, 'DECREASE', 329.00, 269.00, 70, '2025-11-11 00:00:00.000000');
INSERT INTO `tb_price_history` VALUES (20, -39.10, -30.31, 'DECREASE', 129.00, 89.90, 71, '2025-11-11 00:00:00.000000');
INSERT INTO `tb_price_history` VALUES (21, -40.00, -21.16, 'DECREASE', 189.00, 149.00, 72, '2025-11-11 00:00:00.000000');
INSERT INTO `tb_price_history` VALUES (22, -15.10, -20.13, 'DECREASE', 75.00, 59.90, 73, '2025-11-11 00:00:00.000000');
INSERT INTO `tb_price_history` VALUES (23, -50.00, -26.60, 'DECREASE', 188.00, 138.00, 74, '2025-11-11 00:00:00.000000');
INSERT INTO `tb_price_history` VALUES (24, -20.00, -22.25, 'DECREASE', 89.90, 69.90, 75, '2025-11-11 00:00:00.000000');
INSERT INTO `tb_price_history` VALUES (25, -30.00, -23.26, 'DECREASE', 129.00, 99.00, 76, '2025-11-11 00:00:00.000000');
INSERT INTO `tb_price_history` VALUES (26, -500.00, -20.01, 'DECREASE', 2499.00, 1999.00, 77, '2025-11-11 00:00:00.000000');
INSERT INTO `tb_price_history` VALUES (27, -40.00, -23.67, 'DECREASE', 169.00, 129.00, 78, '2025-11-11 00:00:00.000000');
INSERT INTO `tb_price_history` VALUES (28, -200.00, -18.20, 'DECREASE', 1099.00, 899.00, 79, '2025-11-11 00:00:00.000000');
INSERT INTO `tb_price_history` VALUES (29, -100.00, -20.04, 'DECREASE', 499.00, 399.00, 80, '2025-11-11 00:00:00.000000');

-- ----------------------------
-- Table structure for tb_product
-- ----------------------------
DROP TABLE IF EXISTS `tb_product`;
CREATE TABLE `tb_product`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '商品ID',
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '商品名称',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '商品描述',
  `category_id` bigint NOT NULL COMMENT '分类ID',
  `price` decimal(10, 2) NOT NULL COMMENT '商品价格',
  `original_price` decimal(10, 2) NULL DEFAULT NULL COMMENT '原价',
  `stock` int NOT NULL DEFAULT 0 COMMENT '库存数量',
  `sales` int NOT NULL DEFAULT 0 COMMENT '销量',
  `status` tinyint NOT NULL DEFAULT 1,
  `main_image` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '主图URL',
  `images` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '商品图片列表（JSON格式）',
  `created_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `audit_remark` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `audit_status` tinyint NOT NULL DEFAULT 1,
  `audit_time` datetime(6) NULL DEFAULT NULL,
  `seller_id` bigint NULL DEFAULT NULL,
  `seller_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `ad_video` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `ad_video_duration` int NULL DEFAULT NULL,
  `ad_video_enabled` tinyint NULL DEFAULT 0,
  `pending_price` decimal(10, 2) NULL DEFAULT NULL,
  `pending_original_price` decimal(10, 2) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_product_category`(`category_id` ASC) USING BTREE,
  INDEX `idx_product_status`(`status` ASC) USING BTREE,
  INDEX `idx_product_name`(`name` ASC) USING BTREE,
  INDEX `idx_product_audit`(`audit_status` ASC) USING BTREE,
  INDEX `idx_product_seller`(`seller_id` ASC) USING BTREE,
  CONSTRAINT `fk_product_category` FOREIGN KEY (`category_id`) REFERENCES `tb_category` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 51 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '商品表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of tb_product
-- ----------------------------
INSERT INTO `tb_product` VALUES (1, 'iPhone 15 Pro Max 256GB', '苹果旗舰A17 Pro芯片钛金属机身', 1, 9999.00, 10999.00, 100, 1256, 1, '/products/iphone15.jpg', NULL, '2026-01-13 01:12:23', '2026-01-13 01:12:23', NULL, 1, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL);
INSERT INTO `tb_product` VALUES (2, '华为Mate 60 Pro', '麒麟9000S芯片支持卫星通话', 1, 6999.00, 7499.00, 80, 2189, 1, '/products/mate60.jpg', NULL, '2026-01-13 01:12:23', '2026-01-13 01:12:23', NULL, 1, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL);
INSERT INTO `tb_product` VALUES (3, '小米14 Ultra', '徕卡光学镜头骁龙8 Gen3', 1, 5999.00, 6299.00, 120, 1812, 1, '/products/mi14.jpg', NULL, '2026-01-13 01:12:23', '2026-01-13 01:12:23', NULL, 1, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL);
INSERT INTO `tb_product` VALUES (4, 'OPPO Find X7 Ultra', '哈苏影像双潜望长焦', 1, 5999.00, 6499.00, 90, 876, 1, '/products/oppo.jpg', NULL, '2026-01-13 01:12:23', '2026-01-13 01:12:23', NULL, 1, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL);
INSERT INTO `tb_product` VALUES (5, 'vivo X100 Pro', '蔡司光学镜头天玑9300', 1, 4999.00, 5499.00, 110, 1345, 1, '/products/vivo.jpg', NULL, '2026-01-13 01:12:23', '2026-01-13 01:12:23', NULL, 1, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL);
INSERT INTO `tb_product` VALUES (6, '三星Galaxy S24 Ultra', '钛金属边框2亿像素AI功能', 1, 9699.00, 10199.00, 60, 567, 1, '/products/samsung.jpg', NULL, '2026-01-13 01:12:23', '2026-01-13 01:12:23', NULL, 1, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL);
INSERT INTO `tb_product` VALUES (7, 'iPad Pro 12.9英寸 M4', 'M4芯片超薄OLED屏幕', 1, 9299.00, 9999.00, 50, 423, 1, '/products/ipadpro.jpg', NULL, '2026-01-13 01:12:23', '2026-01-13 01:12:23', NULL, 1, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL);
INSERT INTO `tb_product` VALUES (8, 'AirPods Pro 2', '主动降噪自适应音频', 1, 1899.00, 1999.00, 200, 3456, 1, '/products/airpods.jpg', NULL, '2026-01-13 01:12:23', '2026-01-13 01:12:23', NULL, 1, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL);
INSERT INTO `tb_product` VALUES (9, 'MacBook Pro 14英寸 M3 Pro', 'M3 Pro芯片18GB+512GB', 2, 14999.00, 15999.00, 50, 687, 1, '/products/macbook.jpg', NULL, '2026-01-13 01:12:23', '2026-01-13 01:12:23', NULL, 1, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL);
INSERT INTO `tb_product` VALUES (10, '联想ThinkPad X1 Carbon', '商务轻薄本14英寸2.8K屏', 2, 9999.00, 11999.00, 40, 345, 1, '/products/thinkpad.jpg', NULL, '2026-01-13 01:12:23', '2026-01-13 01:12:23', NULL, 1, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL);
INSERT INTO `tb_product` VALUES (11, '华为MateBook X Pro', '14.2英寸触控屏酷睿Ultra 9', 2, 12999.00, 13999.00, 35, 234, 1, '/products/matebook.jpg', NULL, '2026-01-13 01:12:23', '2026-01-13 01:12:23', NULL, 1, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL);
INSERT INTO `tb_product` VALUES (12, '戴尔XPS 15', '15.6英寸OLED屏RTX4070', 2, 15999.00, 17999.00, 25, 156, 1, '/products/xps.jpg', NULL, '2026-01-13 01:12:23', '2026-01-13 01:12:23', NULL, 1, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL);
INSERT INTO `tb_product` VALUES (13, '罗技MX Master 3S', '无线办公鼠标静音点击', 2, 799.00, 899.00, 300, 2345, 1, '/products/mouse.jpg', NULL, '2026-01-13 01:12:23', '2026-01-13 01:12:23', NULL, 1, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL);
INSERT INTO `tb_product` VALUES (14, '机械革命蛟龙16 Pro', '游戏本R9-7945HX RTX4060', 2, 7999.00, 8999.00, 60, 567, 1, '/products/jixie.jpg', NULL, '2026-01-13 01:12:23', '2026-01-13 01:12:23', NULL, 1, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL);
INSERT INTO `tb_product` VALUES (15, '海尔470升十字对开门冰箱', '一级能效风冷无霜智能变频', 3, 4599.00, 5299.00, 40, 856, 1, '/products/haier.jpg', NULL, '2026-01-13 01:12:23', '2026-01-13 01:12:23', NULL, 1, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL);
INSERT INTO `tb_product` VALUES (16, '美的1.5匹变频空调', '一级能效智能WiFi控制', 3, 2999.00, 3499.00, 80, 1423, 1, '/products/midea.jpg', NULL, '2026-01-13 01:12:23', '2026-01-13 01:12:23', NULL, 1, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL);
INSERT INTO `tb_product` VALUES (17, '西门子10公斤滚筒洗衣机', '智能投放蒸汽除菌', 3, 4299.00, 4999.00, 50, 678, 1, '/products/siemens.jpg', NULL, '2026-01-13 01:12:23', '2026-01-13 01:12:23', NULL, 1, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL);
INSERT INTO `tb_product` VALUES (18, '戴森V15吸尘器', '无线手持激光探测灰尘', 3, 4990.00, 5490.00, 70, 934, 1, '/products/dyson.jpg', NULL, '2026-01-13 01:12:23', '2026-01-13 01:12:23', NULL, 1, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL);
INSERT INTO `tb_product` VALUES (19, '小米电视75英寸', '4K超高清120Hz高刷', 3, 3999.00, 4499.00, 45, 567, 1, '/products/mitv.jpg', NULL, '2026-01-13 01:12:23', '2026-01-13 01:12:23', NULL, 1, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL);
INSERT INTO `tb_product` VALUES (20, '格力3匹立式空调', '一级能效智能语音控制', 3, 7999.00, 8999.00, 30, 234, 1, '/products/gree.jpg', NULL, '2026-01-13 01:12:23', '2026-01-13 01:12:23', NULL, 1, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL);
INSERT INTO `tb_product` VALUES (21, '耐克Air Max 270运动鞋', '经典气垫跑鞋透气网面', 4, 899.00, 1199.00, 200, 2567, 1, '/products/nike.jpg', NULL, '2026-01-13 01:12:23', '2026-01-13 01:12:23', NULL, 1, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL);
INSERT INTO `tb_product` VALUES (22, '阿迪达斯Ultraboost跑鞋', 'Boost中底Primeknit鞋面', 4, 1299.00, 1499.00, 150, 1234, 1, '/products/adidas.jpg', NULL, '2026-01-13 01:12:23', '2026-01-13 01:12:23', NULL, 1, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL);
INSERT INTO `tb_product` VALUES (23, '优衣库轻薄羽绒服', '90%白鸭绒轻便保暖', 4, 499.00, 599.00, 300, 3456, 1, '/products/uniqlo.jpg', NULL, '2026-01-13 01:12:23', '2026-01-13 01:12:23', NULL, 1, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL);
INSERT INTO `tb_product` VALUES (24, 'Levis 501经典牛仔裤', '经典直筒版型原色丹宁', 4, 699.00, 899.00, 180, 1567, 1, '/products/levis.jpg', NULL, '2026-01-13 01:12:23', '2026-01-13 01:12:23', NULL, 1, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL);
INSERT INTO `tb_product` VALUES (25, '波司登极寒羽绒服', '鹅绒填充防风防水', 4, 1999.00, 2499.00, 100, 876, 1, '/products/bosideng.jpg', NULL, '2026-01-13 01:12:23', '2026-01-13 01:12:23', NULL, 1, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL);
INSERT INTO `tb_product` VALUES (26, 'New Balance 574复古跑鞋', '经典复古款麂皮拼接', 4, 769.00, 899.00, 220, 1890, 1, '/products/nb.jpg', NULL, '2026-01-13 01:12:23', '2026-01-13 01:12:23', NULL, 1, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL);
INSERT INTO `tb_product` VALUES (27, 'SK-II神仙水230ml', '护肤精华露改善肤质', 5, 1590.00, 1790.00, 100, 2134, 1, '/products/skii.jpg', NULL, '2026-01-13 01:12:23', '2026-01-13 01:12:23', NULL, 1, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL);
INSERT INTO `tb_product` VALUES (28, '兰蔻小黑瓶精华50ml', '肌底精华修护肌肤', 5, 1080.00, 1280.00, 120, 1876, 1, '/products/lancome.jpg', NULL, '2026-01-13 01:12:23', '2026-01-13 01:12:23', NULL, 1, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL);
INSERT INTO `tb_product` VALUES (29, '雅诗兰黛小棕瓶眼霜15ml', '眼部精华淡化黑眼圈', 5, 590.00, 690.00, 150, 2345, 1, '/products/estee.jpg', NULL, '2026-01-13 01:12:23', '2026-01-13 01:12:23', NULL, 1, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL);
INSERT INTO `tb_product` VALUES (30, '资生堂红腰子精华75ml', '肌底精华强韧肌肤', 5, 890.00, 990.00, 80, 1234, 1, '/products/shiseido.jpg', NULL, '2026-01-13 01:12:23', '2026-01-13 01:12:23', NULL, 1, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL);
INSERT INTO `tb_product` VALUES (31, 'YSL小金条口红', '丝绒哑光显色持久', 5, 320.00, 380.00, 500, 4567, 1, '/products/ysl.jpg', NULL, '2026-01-13 01:12:23', '2026-01-13 01:12:23', NULL, 1, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL);
INSERT INTO `tb_product` VALUES (32, '迪奥烈艳蓝金唇膏', '滋润显色经典色号', 5, 350.00, 420.00, 400, 3890, 1, '/products/dior.jpg', NULL, '2026-01-13 01:12:23', '2026-01-13 01:12:23', NULL, 1, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL);
INSERT INTO `tb_product` VALUES (33, '三只松鼠坚果大礼包', '混合坚果1500g健康零食', 6, 168.00, 218.00, 500, 5634, 1, '/products/nuts.jpg', NULL, '2026-01-13 01:12:23', '2026-01-13 01:12:23', NULL, 1, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL);
INSERT INTO `tb_product` VALUES (34, '良品铺子零食大礼包', '休闲零食组合1000g', 6, 128.00, 168.00, 400, 4123, 1, '/products/liangpin.jpg', NULL, '2026-01-13 01:12:23', '2026-01-13 01:12:23', NULL, 1, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL);
INSERT INTO `tb_product` VALUES (35, '农夫山泉矿泉水整箱', '天然矿泉水550ml*24瓶', 6, 39.90, 49.90, 1000, 8765, 1, '/products/nongfu.jpg', NULL, '2026-01-13 01:12:23', '2026-01-13 01:12:23', NULL, 1, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL);
INSERT INTO `tb_product` VALUES (36, '蒙牛特仑苏纯牛奶', '优质奶源250ml*16盒', 6, 79.90, 89.90, 600, 6543, 1, '/products/mengniu.jpg', NULL, '2026-01-13 01:12:23', '2026-01-13 01:12:23', NULL, 1, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL);
INSERT INTO `tb_product` VALUES (37, '百草味肉类零食礼盒', '牛肉干猪肉脯500g', 6, 99.00, 139.00, 350, 2345, 1, '/products/baicaowei.jpg', NULL, '2026-01-13 01:12:23', '2026-01-13 01:12:23', NULL, 1, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL);
INSERT INTO `tb_product` VALUES (38, '星巴克咖啡豆', '中度烘焙阿拉比卡豆200g', 6, 98.00, 128.00, 200, 1567, 1, '/products/starbucks.jpg', NULL, '2026-01-13 01:12:23', '2026-01-13 01:12:23', NULL, 1, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL);
INSERT INTO `tb_product` VALUES (39, '三体全集典藏版', '刘慈欣科幻巨著精装三册', 7, 98.00, 128.00, 200, 3567, 1, '/products/santi.jpg', NULL, '2026-01-13 01:12:23', '2026-01-13 01:12:23', NULL, 1, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL);
INSERT INTO `tb_product` VALUES (40, '明朝那些事儿全集', '当年明月著历史读物全9册', 7, 168.00, 218.00, 150, 2134, 1, '/products/mingchao.jpg', NULL, '2026-01-13 01:12:23', '2026-01-13 01:12:23', NULL, 1, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL);
INSERT INTO `tb_product` VALUES (41, '百年孤独', '马尔克斯代表作精装版', 7, 55.00, 68.00, 300, 4321, 1, '/products/bainian.jpg', NULL, '2026-01-13 01:12:23', '2026-01-13 01:12:23', NULL, 1, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL);
INSERT INTO `tb_product` VALUES (42, '斑马牌中性笔10支装', '顺滑书写0.5mm黑色', 7, 25.00, 35.00, 1000, 7654, 1, '/products/zebra.jpg', NULL, '2026-01-13 01:12:23', '2026-01-13 01:12:23', NULL, 1, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL);
INSERT INTO `tb_product` VALUES (43, '得力办公文具套装', '订书机计算器文件夹', 7, 89.00, 119.00, 400, 2345, 1, '/products/deli.jpg', NULL, '2026-01-13 01:12:23', '2026-01-13 01:12:23', NULL, 1, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL);
INSERT INTO `tb_product` VALUES (44, '迪卡侬跑步机', '家用静音折叠收纳', 8, 1999.00, 2499.00, 60, 876, 1, '/products/decathlon.jpg', NULL, '2026-01-13 01:12:23', '2026-01-13 01:12:23', NULL, 1, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL);
INSERT INTO `tb_product` VALUES (45, '李宁羽毛球拍', '碳素材质攻守兼备', 8, 299.00, 399.00, 200, 1567, 1, '/products/lining.jpg', NULL, '2026-01-13 01:12:23', '2026-01-13 01:12:23', NULL, 1, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL);
INSERT INTO `tb_product` VALUES (46, '北面冲锋衣', '防风防水透气速干', 8, 1599.00, 1999.00, 100, 678, 1, '/products/northface.jpg', NULL, '2026-01-13 01:12:23', '2026-01-13 01:12:23', NULL, 1, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL);
INSERT INTO `tb_product` VALUES (47, '骆驼户外帐篷', '双人双层防暴雨', 8, 459.00, 599.00, 150, 1234, 1, '/products/camel.jpg', NULL, '2026-01-13 01:12:23', '2026-01-13 01:12:23', NULL, 1, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL);
INSERT INTO `tb_product` VALUES (48, '好孩子婴儿推车', '轻便折叠可坐可躺', 9, 899.00, 1199.00, 80, 567, 1, '/products/goodbaby.jpg', NULL, '2026-01-13 01:12:23', '2026-01-13 01:12:23', NULL, 1, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL);
INSERT INTO `tb_product` VALUES (49, '帮宝适纸尿裤L码', '超薄透气干爽152片', 9, 199.00, 249.00, 300, 4567, 1, '/products/pampers.jpg', NULL, '2026-01-13 01:12:23', '2026-01-13 01:12:23', NULL, 1, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL);
INSERT INTO `tb_product` VALUES (50, '全友家居布艺沙发', '北欧简约科技布三人位', 10, 3999.00, 4999.00, 30, 234, 1, '/products/quanyou.jpg', NULL, '2026-01-13 01:12:23', '2026-01-13 01:12:23', NULL, 1, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL);

-- ----------------------------
-- Table structure for tb_review
-- ----------------------------
DROP TABLE IF EXISTS `tb_review`;
CREATE TABLE `tb_review`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `is_anonymous` bit(1) NOT NULL,
  `content` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `created_time` datetime(6) NOT NULL,
  `images` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `order_id` bigint NOT NULL,
  `order_item_id` bigint NULL DEFAULT NULL,
  `product_id` bigint NOT NULL,
  `rating` int NOT NULL,
  `reply` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `reply_time` datetime(6) NULL DEFAULT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_review_product`(`product_id` ASC) USING BTREE,
  INDEX `idx_review_user`(`user_id` ASC) USING BTREE,
  INDEX `idx_review_order`(`order_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 24 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of tb_review
-- ----------------------------
INSERT INTO `tb_review` VALUES (1, b'0', 'iPhone一如既往的流畅系统体验非常好钛金属边框手感很棒拍照效果清晰A17 Pro芯片性能强劲', '2025-01-16 10:00:00.000000', NULL, 1, 1, 1, 5, NULL, NULL, 2);
INSERT INTO `tb_review` VALUES (2, b'0', 'AirPods Pro 2降噪效果太棒了通勤路上完全听不到地铁噪音音质也很好低音浑厚', '2025-01-16 10:05:00.000000', NULL, 1, 37, 8, 5, NULL, NULL, 2);
INSERT INTO `tb_review` VALUES (3, b'0', '华为手机真的很好用拍照效果超级棒卫星通话功能太实用了出门在外再也不怕没信号', '2025-01-18 14:00:00.000000', NULL, 2, 2, 2, 5, NULL, NULL, 3);
INSERT INTO `tb_review` VALUES (4, b'0', '耳机音质不错降噪效果也可以就是戴久了耳朵有点不舒服总体来说还是很满意的', '2025-01-18 14:10:00.000000', NULL, 2, 38, 8, 4, NULL, NULL, 3);
INSERT INTO `tb_review` VALUES (5, b'0', '空调制冷效果很好房间很快就凉下来了静音模式下几乎听不到声音一级能效省电', '2025-01-21 10:00:00.000000', NULL, 3, 3, 16, 5, NULL, NULL, 4);
INSERT INTO `tb_review` VALUES (6, b'0', '坚果很新鲜种类丰富有核桃腰果巴旦木等等包装也很精美送人自己吃都很合适', '2025-01-23 09:00:00.000000', NULL, 4, 4, 33, 5, NULL, NULL, 5);
INSERT INTO `tb_review` VALUES (7, b'0', '鞋子很舒服气垫效果不错跑步的时候脚感很好就是尺码偏大半码建议买小一号', '2025-01-26 11:00:00.000000', NULL, 5, 5, 21, 4, NULL, NULL, 6);
INSERT INTO `tb_review` VALUES (8, b'0', 'NB的鞋子一直很喜欢这双574复古款颜值很高搭配牛仔裤很好看鞋底软硬适中', '2025-01-26 11:10:00.000000', NULL, 5, 39, 26, 5, NULL, NULL, 6);
INSERT INTO `tb_review` VALUES (9, b'0', '冰箱容量很大十字对开门设计很方便风冷无霜不用手动除霜省心省力运行声音小', '2025-01-28 10:00:00.000000', NULL, 6, 6, 15, 5, NULL, NULL, 7);
INSERT INTO `tb_review` VALUES (10, b'0', '三体是我看过最好的科幻小说刘慈欣的想象力太丰富了每次重读都有新的感悟', '2025-01-27 14:00:00.000000', NULL, 7, 7, 39, 5, NULL, NULL, 8);
INSERT INTO `tb_review` VALUES (11, b'0', '坚果口感不错就是感觉量有点少性价比一般不过作为零食还是很好吃的', '2025-01-27 14:10:00.000000', NULL, 7, 8, 33, 4, NULL, NULL, 8);
INSERT INTO `tb_review` VALUES (12, b'0', '神仙水名不虚传用了一个月皮肤明显变得细腻了毛孔也小了很多虽然价格贵但效果真的好', '2025-01-29 09:00:00.000000', NULL, 8, 9, 27, 5, NULL, NULL, 9);
INSERT INTO `tb_review` VALUES (13, b'0', '兰蔻小黑瓶精华吸收很快不油腻用了一段时间感觉皮肤状态好了很多细纹也淡了', '2025-01-29 09:10:00.000000', NULL, 8, 10, 28, 5, NULL, NULL, 9);
INSERT INTO `tb_review` VALUES (14, b'0', 'YSL口红颜色很正显白就是有点拔干需要做好唇部打底包装很高级送人很有面子', '2025-01-29 09:20:00.000000', NULL, 8, 40, 31, 4, NULL, NULL, 9);
INSERT INTO `tb_review` VALUES (15, b'0', '阿迪达斯的Boost中底真的很软弹跑步的时候回弹感很强鞋面透气性也不错', '2024-12-21 10:00:00.000000', NULL, 19, 25, 22, 5, NULL, NULL, 2);
INSERT INTO `tb_review` VALUES (16, b'0', '优衣库的羽绒服轻便保暖可以收纳成小包出门携带很方便适合南方冬天穿', '2024-12-21 10:10:00.000000', NULL, 19, 42, 23, 4, NULL, NULL, 2);
INSERT INTO `tb_review` VALUES (17, b'0', '西门子洗衣机质量很好洗得很干净智能投放功能很方便蒸汽除菌功能对有宝宝的家庭很实用', '2024-12-26 14:00:00.000000', NULL, 20, 26, 17, 5, NULL, NULL, 3);
INSERT INTO `tb_review` VALUES (18, b'0', '三只松鼠的坚果一直很喜欢新鲜好吃这次买的大礼包种类很多全家人都爱吃年货必备', '2024-12-31 10:00:00.000000', NULL, 21, 27, 33, 5, NULL, NULL, 4);
INSERT INTO `tb_review` VALUES (19, b'0', '罗技鼠标手感很好静音点击不会打扰到别人多设备切换功能很实用办公神器', '2025-01-11 14:00:00.000000', NULL, 22, 28, 13, 5, NULL, NULL, 5);
INSERT INTO `tb_review` VALUES (20, b'0', '斑马中性笔书写顺滑出墨均匀学生党必备性价比很高就是笔帽容易丢', '2025-01-11 14:10:00.000000', NULL, 22, 43, 42, 4, NULL, NULL, 5);
INSERT INTO `tb_review` VALUES (21, b'0', '雅诗兰黛小棕瓶眼霜真的很好用坚持用了两周黑眼圈淡了很多眼周也没那么干了', '2025-01-14 10:00:00.000000', NULL, 23, 29, 29, 5, NULL, NULL, 19);
INSERT INTO `tb_review` VALUES (22, b'0', 'MacBook Pro性能太强了M3 Pro芯片跑代码飞快编译速度比之前快了好几倍', '2025-01-17 14:00:00.000000', NULL, 24, 30, 9, 5, NULL, NULL, 20);
INSERT INTO `tb_review` VALUES (23, b'0', '配合MacBook使用体验极佳MagSpeed滚轮很顺滑在Mac上的手势操作也很方便', '2025-01-17 14:10:00.000000', NULL, 24, 44, 13, 5, NULL, NULL, 20);

-- ----------------------------
-- Table structure for tb_upload_file
-- ----------------------------
DROP TABLE IF EXISTS `tb_upload_file`;
CREATE TABLE `tb_upload_file`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_time` datetime(6) NOT NULL,
  `file_path` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_size` bigint NULL DEFAULT NULL,
  `file_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `original_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `review_remark` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `review_time` datetime(6) NULL DEFAULT NULL,
  `reviewer_id` bigint NULL DEFAULT NULL,
  `reviewer_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `status` tinyint NOT NULL DEFAULT 0,
  `user_id` bigint NOT NULL,
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `related_id` bigint NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 16 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of tb_upload_file
-- ----------------------------
INSERT INTO `tb_upload_file` VALUES (11, '2025-12-01 10:00:00.000000', '/uploads/avatars/user2.jpg', 102400, 'AVATAR', '头像.jpg', '审核通过', '2026-01-13 01:24:11.000000', 1, 'admin', 1, 2, 'zhangsan', 2);
INSERT INTO `tb_upload_file` VALUES (12, '2025-12-02 11:00:00.000000', '/uploads/avatars/user3.jpg', 98765, 'AVATAR', '照片.jpg', '审核通过', '2026-01-13 01:24:11.000000', 1, 'admin', 1, 3, 'lisi', 3);
INSERT INTO `tb_upload_file` VALUES (13, '2025-12-03 14:00:00.000000', '/uploads/products/prod1.jpg', 204800, 'PRODUCT', '商品图1.jpg', '商品图片审核通过', '2026-01-13 01:24:11.000000', 1, 'admin', 1, 2, 'zhangsan', 1);
INSERT INTO `tb_upload_file` VALUES (14, '2025-12-10 09:00:00.000000', '/uploads/reviews/review1.jpg', 153600, 'REVIEW', '评价图片.jpg', NULL, NULL, NULL, NULL, 0, 4, 'wangwu', 1);
INSERT INTO `tb_upload_file` VALUES (15, '2025-12-05 16:00:00.000000', '/uploads/products/prod2.jpg', 178432, 'PRODUCT', '商品图2.jpg', '图片不清晰，请重新上传', '2026-01-13 01:24:11.000000', 1, 'admin', 2, 5, 'zhaoliu', 2);

-- ----------------------------
-- Table structure for tb_user
-- ----------------------------
DROP TABLE IF EXISTS `tb_user`;
CREATE TABLE `tb_user`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '用户名',
  `password` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '密码（加密存储）',
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '邮箱',
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '手机号',
  `avatar` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '头像URL',
  `nickname` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '昵称',
  `bio` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '个人简介',
  `points` int NULL DEFAULT 0 COMMENT '积分',
  `growth_value` int NULL DEFAULT 0 COMMENT '成长值',
  `member_days` int NULL DEFAULT 0 COMMENT '会员天数',
  `status` tinyint NOT NULL DEFAULT 1,
  `created_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `last_login_time` datetime NULL DEFAULT NULL COMMENT '最后登录时间',
  `last_login_ip` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '最后登录IP',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `username`(`username` ASC) USING BTREE,
  UNIQUE INDEX `email`(`email` ASC) USING BTREE,
  INDEX `idx_user_username`(`username` ASC) USING BTREE,
  INDEX `idx_user_email`(`email` ASC) USING BTREE,
  INDEX `idx_user_status`(`status` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 21 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '用户表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of tb_user
-- ----------------------------
INSERT INTO `tb_user` VALUES (1, 'admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'admin@menggo.com', '13800000001', NULL, '管理员', '系统管理员', 99999, 0, 0, 1, '2026-01-13 01:12:23', '2026-01-13 01:12:23', NULL, NULL);
INSERT INTO `tb_user` VALUES (2, 'zhangsan', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'zhangsan@qq.com', '13812345678', NULL, '张三', '热爱购物', 2580, 0, 0, 1, '2026-01-13 01:12:23', '2026-01-13 01:12:23', NULL, NULL);
INSERT INTO `tb_user` VALUES (3, 'lisi', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'lisi@163.com', '13987654321', NULL, '李四', '数码爱好者', 1890, 0, 0, 1, '2026-01-13 01:12:23', '2026-01-13 01:12:23', NULL, NULL);
INSERT INTO `tb_user` VALUES (4, 'wangwu', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'wangwu@gmail.com', '13666666666', NULL, '王五', '时尚达人', 3200, 0, 0, 1, '2026-01-13 01:12:23', '2026-01-13 01:12:23', NULL, NULL);
INSERT INTO `tb_user` VALUES (5, 'zhaoliu', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'zhaoliu@126.com', '13555555555', NULL, '赵六', '美食爱好者', 1560, 0, 0, 1, '2026-01-13 01:12:23', '2026-01-13 01:12:23', NULL, NULL);
INSERT INTO `tb_user` VALUES (6, 'sunqi', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'sunqi@sina.com', '13444444444', NULL, '孙七', '运动达人', 980, 0, 0, 1, '2026-01-13 01:12:23', '2026-01-13 01:12:23', NULL, NULL);
INSERT INTO `tb_user` VALUES (7, 'zhouba', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'zhouba@qq.com', '13333333333', NULL, '周八', '家居爱好者', 2100, 0, 0, 1, '2026-01-13 01:12:23', '2026-01-13 01:12:23', NULL, NULL);
INSERT INTO `tb_user` VALUES (8, 'wujiu', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'wujiu@163.com', '13222222222', NULL, '吴九', '图书收藏家', 1750, 0, 0, 1, '2026-01-13 01:12:23', '2026-01-13 01:12:23', NULL, NULL);
INSERT INTO `tb_user` VALUES (9, 'zhengshi', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'zhengshi@gmail.com', '13111111111', NULL, '郑十', '护肤达人', 2890, 0, 0, 1, '2026-01-13 01:12:23', '2026-01-13 01:12:23', NULL, NULL);
INSERT INTO `tb_user` VALUES (10, 'xiaoming', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'xiaoming@qq.com', '15012345678', NULL, '小明', '学生党', 680, 0, 0, 1, '2026-01-13 01:12:23', '2026-01-13 01:12:23', NULL, NULL);
INSERT INTO `tb_user` VALUES (11, 'xiaohong', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'xiaohong@163.com', '15112345678', NULL, '小红', '白领丽人', 1420, 0, 0, 1, '2026-01-13 01:12:23', '2026-01-13 01:12:23', NULL, NULL);
INSERT INTO `tb_user` VALUES (12, 'daming', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'daming@126.com', '15212345678', NULL, '大明', '程序员', 3560, 0, 0, 1, '2026-01-13 01:12:23', '2026-01-13 01:12:23', NULL, NULL);
INSERT INTO `tb_user` VALUES (13, 'xiaoli', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'xiaoli@sina.com', '15312345678', NULL, '小丽', '全职妈妈', 890, 0, 0, 1, '2026-01-13 01:12:23', '2026-01-13 01:12:23', NULL, NULL);
INSERT INTO `tb_user` VALUES (14, 'laowang', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'laowang@qq.com', '15412345678', NULL, '老王', '退休教师', 2340, 0, 0, 1, '2026-01-13 01:12:23', '2026-01-13 01:12:23', NULL, NULL);
INSERT INTO `tb_user` VALUES (15, 'xiaozhang', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'xiaozhang@163.com', '15512345678', NULL, '小张', '自由职业', 1680, 0, 0, 1, '2026-01-13 01:12:23', '2026-01-13 01:12:23', NULL, NULL);
INSERT INTO `tb_user` VALUES (16, 'chenchen', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'chenchen@gmail.com', '15612345678', NULL, '晨晨', '大学生', 520, 0, 0, 1, '2026-01-13 01:12:23', '2026-01-13 01:12:23', NULL, NULL);
INSERT INTO `tb_user` VALUES (17, 'linlin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'linlin@126.com', '15712345678', NULL, '琳琳', '设计师', 1950, 0, 0, 1, '2026-01-13 01:12:23', '2026-01-13 01:12:23', NULL, NULL);
INSERT INTO `tb_user` VALUES (18, 'yangyang', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'yangyang@sina.com', '15812345678', NULL, '洋洋', '销售经理', 2780, 0, 0, 1, '2026-01-13 01:12:23', '2026-01-13 01:12:23', NULL, NULL);
INSERT INTO `tb_user` VALUES (19, 'huihui', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'huihui@qq.com', '15912345678', NULL, '慧慧', '医生', 1230, 0, 0, 1, '2026-01-13 01:12:23', '2026-01-13 01:12:23', NULL, NULL);
INSERT INTO `tb_user` VALUES (20, 'mingming', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'mingming@163.com', '13012345678', NULL, '明明', '工程师', 3100, 0, 0, 1, '2026-01-13 01:12:23', '2026-01-13 01:12:23', NULL, NULL);

-- ----------------------------
-- Table structure for tb_user_coupon
-- ----------------------------
DROP TABLE IF EXISTS `tb_user_coupon`;
CREATE TABLE `tb_user_coupon`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `coupon_id` bigint NOT NULL,
  `created_time` datetime(6) NOT NULL,
  `order_id` bigint NULL DEFAULT NULL,
  `status` int NOT NULL,
  `used_time` datetime(6) NULL DEFAULT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `FKonjc6vdxm33uqju6ihncnihog`(`coupon_id` ASC) USING BTREE,
  CONSTRAINT `FKonjc6vdxm33uqju6ihncnihog` FOREIGN KEY (`coupon_id`) REFERENCES `tb_coupon` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 96 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of tb_user_coupon
-- ----------------------------
INSERT INTO `tb_user_coupon` VALUES (81, 1, '2025-12-01 10:00:00.000000', NULL, 0, NULL, 2);
INSERT INTO `tb_user_coupon` VALUES (82, 2, '2025-12-05 14:00:00.000000', NULL, 0, NULL, 2);
INSERT INTO `tb_user_coupon` VALUES (83, 1, '2025-12-02 09:00:00.000000', NULL, 0, NULL, 3);
INSERT INTO `tb_user_coupon` VALUES (84, 5, '2025-12-08 11:00:00.000000', NULL, 0, NULL, 3);
INSERT INTO `tb_user_coupon` VALUES (85, 1, '2025-12-03 16:00:00.000000', NULL, 0, NULL, 4);
INSERT INTO `tb_user_coupon` VALUES (86, 7, '2025-12-10 10:00:00.000000', NULL, 0, NULL, 4);
INSERT INTO `tb_user_coupon` VALUES (87, 1, '2025-12-04 08:00:00.000000', NULL, 0, NULL, 5);
INSERT INTO `tb_user_coupon` VALUES (88, 8, '2025-12-12 15:00:00.000000', NULL, 0, NULL, 5);
INSERT INTO `tb_user_coupon` VALUES (89, 1, '2025-12-05 11:00:00.000000', NULL, 0, NULL, 6);
INSERT INTO `tb_user_coupon` VALUES (90, 6, '2025-12-15 09:00:00.000000', NULL, 0, NULL, 6);
INSERT INTO `tb_user_coupon` VALUES (91, 2, '2025-12-06 14:00:00.000000', NULL, 0, NULL, 7);
INSERT INTO `tb_user_coupon` VALUES (92, 3, '2025-12-07 10:00:00.000000', NULL, 0, NULL, 8);
INSERT INTO `tb_user_coupon` VALUES (93, 4, '2025-12-08 16:00:00.000000', NULL, 0, NULL, 9);
INSERT INTO `tb_user_coupon` VALUES (94, 1, '2025-12-09 09:00:00.000000', NULL, 0, NULL, 10);
INSERT INTO `tb_user_coupon` VALUES (95, 8, '2025-12-18 11:00:00.000000', NULL, 0, NULL, 10);

-- ----------------------------
-- Table structure for tb_wishlist
-- ----------------------------
DROP TABLE IF EXISTS `tb_wishlist`;
CREATE TABLE `tb_wishlist`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `added_price` decimal(10, 2) NULL DEFAULT NULL,
  `cooling_days` int NULL DEFAULT NULL,
  `cooling_end_time` datetime(6) NULL DEFAULT NULL,
  `created_time` datetime(6) NULL DEFAULT NULL,
  `product_id` bigint NOT NULL,
  `reason` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `status` int NULL DEFAULT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `FKmjvq2g6yamny3vckxw49sfc2r`(`product_id` ASC) USING BTREE,
  CONSTRAINT `FKmjvq2g6yamny3vckxw49sfc2r` FOREIGN KEY (`product_id`) REFERENCES `tb_product` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 21 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of tb_wishlist
-- ----------------------------
INSERT INTO `tb_wishlist` VALUES (1, 9999.00, 3, '2026-01-12 01:26:59.000000', '2025-12-01 10:00:00.000000', 1, '等待降价再购买', 1, 2);
INSERT INTO `tb_wishlist` VALUES (2, 4999.00, 3, '2025-12-05 14:30:00.000000', '2025-12-02 14:30:00.000000', 5, '等待降价再购买', 0, 2);
INSERT INTO `tb_wishlist` VALUES (3, 15999.00, 3, '2026-01-12 01:26:59.000000', '2025-12-05 09:15:00.000000', 12, '等待降价再购买', 1, 2);
INSERT INTO `tb_wishlist` VALUES (4, 5999.00, 3, '2025-12-06 11:00:00.000000', '2025-12-03 11:00:00.000000', 3, '生日礼物备选', 0, 3);
INSERT INTO `tb_wishlist` VALUES (5, 1899.00, 3, '2026-01-12 01:26:59.000000', '2025-12-06 16:20:00.000000', 8, '生日礼物备选', 1, 3);
INSERT INTO `tb_wishlist` VALUES (6, 4599.00, 3, '2025-12-11 10:45:00.000000', '2025-12-08 10:45:00.000000', 15, '生日礼物备选', 0, 3);
INSERT INTO `tb_wishlist` VALUES (7, 6999.00, 3, '2026-01-12 01:26:59.000000', '2025-12-04 13:00:00.000000', 2, '节日促销时购买', 1, 4);
INSERT INTO `tb_wishlist` VALUES (8, 9999.00, 3, '2025-12-10 15:30:00.000000', '2025-12-07 15:30:00.000000', 10, '节日促销时购买', 0, 4);
INSERT INTO `tb_wishlist` VALUES (9, 9699.00, 3, '2026-01-12 01:26:59.000000', '2025-12-05 08:00:00.000000', 6, '等待降价再购买', 1, 5);
INSERT INTO `tb_wishlist` VALUES (10, 12999.00, 3, '2025-12-12 12:00:00.000000', '2025-12-09 12:00:00.000000', 11, '等待降价再购买', 0, 5);
INSERT INTO `tb_wishlist` VALUES (11, 7999.00, 3, '2025-12-13 17:00:00.000000', '2025-12-10 17:00:00.000000', 20, '等待降价再购买', 0, 5);
INSERT INTO `tb_wishlist` VALUES (12, 5999.00, 3, '2025-12-09 09:30:00.000000', '2025-12-06 09:30:00.000000', 4, '生日礼物备选', 0, 6);
INSERT INTO `tb_wishlist` VALUES (13, 14999.00, 3, '2025-12-11 14:00:00.000000', '2025-12-08 14:00:00.000000', 9, '生日礼物备选', 0, 6);
INSERT INTO `tb_wishlist` VALUES (14, 9299.00, 3, '2025-12-10 10:00:00.000000', '2025-12-07 10:00:00.000000', 7, '节日促销时购买', 0, 7);
INSERT INTO `tb_wishlist` VALUES (15, 7999.00, 3, '2025-12-13 11:30:00.000000', '2025-12-10 11:30:00.000000', 14, '节日促销时购买', 0, 7);
INSERT INTO `tb_wishlist` VALUES (16, 799.00, 3, '2025-12-11 16:00:00.000000', '2025-12-08 16:00:00.000000', 13, '等待降价再购买', 0, 8);
INSERT INTO `tb_wishlist` VALUES (17, 2999.00, 3, '2025-12-12 09:00:00.000000', '2025-12-09 09:00:00.000000', 16, '生日礼物备选', 0, 9);
INSERT INTO `tb_wishlist` VALUES (18, 4990.00, 3, '2025-12-14 13:45:00.000000', '2025-12-11 13:45:00.000000', 18, '生日礼物备选', 0, 9);
INSERT INTO `tb_wishlist` VALUES (19, 4299.00, 3, '2025-12-13 10:30:00.000000', '2025-12-10 10:30:00.000000', 17, '节日促销时购买', 0, 10);
INSERT INTO `tb_wishlist` VALUES (20, 3999.00, 3, '2025-12-15 15:00:00.000000', '2025-12-12 15:00:00.000000', 19, '节日促销时购买', 0, 10);

SET FOREIGN_KEY_CHECKS = 1;
