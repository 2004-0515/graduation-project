-- =====================================================
-- 购物商城数据库初始化脚本
-- 数据库: shopping_mall
-- 字符集: utf8mb4
-- =====================================================

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS shopping_mall 
DEFAULT CHARACTER SET utf8mb4 
DEFAULT COLLATE utf8mb4_unicode_ci;

USE shopping_mall;

-- =====================================================
-- 1. 用户表 (tb_user)
-- =====================================================
DROP TABLE IF EXISTS tb_user;
CREATE TABLE tb_user (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '用户ID',
    username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
    password VARCHAR(100) NOT NULL COMMENT '密码（加密存储）',
    email VARCHAR(100) NOT NULL UNIQUE COMMENT '邮箱',
    phone VARCHAR(20) DEFAULT NULL COMMENT '手机号',
    avatar VARCHAR(200) DEFAULT NULL COMMENT '头像URL',
    nickname VARCHAR(50) DEFAULT NULL COMMENT '昵称',
    bio VARCHAR(200) DEFAULT NULL COMMENT '个人简介',
    points INT DEFAULT 0 COMMENT '积分',
    growth_value INT DEFAULT 0 COMMENT '成长值',
    member_days INT DEFAULT 0 COMMENT '会员天数',
    status TINYINT DEFAULT 1 NOT NULL COMMENT '状态：1-正常，0-禁用',
    created_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    last_login_time DATETIME DEFAULT NULL COMMENT '最后登录时间',
    last_login_ip VARCHAR(50) DEFAULT NULL COMMENT '最后登录IP',
    INDEX idx_user_username (username),
    INDEX idx_user_email (email),
    INDEX idx_user_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- =====================================================
-- 2. 商品分类表 (tb_category)
-- =====================================================
DROP TABLE IF EXISTS tb_category;
CREATE TABLE tb_category (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '分类ID',
    name VARCHAR(50) NOT NULL UNIQUE COMMENT '分类名称',
    description VARCHAR(200) DEFAULT NULL COMMENT '分类描述',
    parent_id BIGINT DEFAULT 0 NOT NULL COMMENT '父分类ID，0表示顶级分类',
    sort_order INT DEFAULT 0 NOT NULL COMMENT '排序顺序',
    icon VARCHAR(100) DEFAULT NULL COMMENT '分类图标URL',
    status TINYINT DEFAULT 1 NOT NULL COMMENT '状态：1-启用，0-禁用',
    created_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_category_parent (parent_id),
    INDEX idx_category_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商品分类表';

-- =====================================================
-- 3. 商品表 (tb_product)
-- =====================================================
DROP TABLE IF EXISTS tb_product;
CREATE TABLE tb_product (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '商品ID',
    name VARCHAR(100) NOT NULL COMMENT '商品名称',
    description TEXT DEFAULT NULL COMMENT '商品描述',
    category_id BIGINT NOT NULL COMMENT '分类ID',
    price DECIMAL(10, 2) NOT NULL COMMENT '商品价格',
    original_price DECIMAL(10, 2) DEFAULT NULL COMMENT '原价',
    pending_price DECIMAL(10, 2) DEFAULT NULL COMMENT '待审核价格',
    pending_original_price DECIMAL(10, 2) DEFAULT NULL COMMENT '待审核原价',
    stock INT DEFAULT 0 NOT NULL COMMENT '库存数量',
    sales INT DEFAULT 0 NOT NULL COMMENT '销量',
    status TINYINT DEFAULT 1 NOT NULL COMMENT '状态：1-上架，0-下架',
    main_image VARCHAR(200) DEFAULT NULL COMMENT '主图URL',
    images TEXT DEFAULT NULL COMMENT '商品图片列表（JSON格式）',
    seller_id BIGINT DEFAULT NULL COMMENT '卖家用户ID',
    seller_name VARCHAR(50) DEFAULT NULL COMMENT '卖家用户名',
    audit_status TINYINT DEFAULT 1 NOT NULL COMMENT '审核状态：0-待审核，1-已通过，2-已拒绝',
    audit_remark VARCHAR(200) DEFAULT NULL COMMENT '审核备注',
    audit_time DATETIME DEFAULT NULL COMMENT '审核时间',
    ad_video VARCHAR(500) DEFAULT NULL COMMENT '广告视频URL',
    ad_video_duration INT DEFAULT NULL COMMENT '广告时长(秒)',
    ad_video_enabled TINYINT DEFAULT 0 COMMENT '是否启用广告：0-禁用，1-启用',
    created_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_product_category (category_id),
    INDEX idx_product_status (status),
    INDEX idx_product_name (name),
    INDEX idx_product_audit (audit_status),
    INDEX idx_product_seller (seller_id),
    CONSTRAINT fk_product_category FOREIGN KEY (category_id) REFERENCES tb_category(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商品表';

-- =====================================================
-- 4. 购物车表 (tb_cart)
-- =====================================================
DROP TABLE IF EXISTS tb_cart;
CREATE TABLE tb_cart (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '购物车ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    product_id BIGINT NOT NULL COMMENT '商品ID',
    quantity INT DEFAULT 1 NOT NULL COMMENT '商品数量',
    selected TINYINT DEFAULT 1 NOT NULL COMMENT '是否选中：1-选中，0-未选中',
    created_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_cart_user (user_id),
    INDEX idx_cart_product (product_id),
    UNIQUE KEY uk_cart_user_product (user_id, product_id),
    CONSTRAINT fk_cart_user FOREIGN KEY (user_id) REFERENCES tb_user(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_cart_product FOREIGN KEY (product_id) REFERENCES tb_product(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='购物车表';

-- =====================================================
-- 5. 订单表 (tb_order)
-- =====================================================
DROP TABLE IF EXISTS tb_order;
CREATE TABLE tb_order (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '订单ID',
    order_no VARCHAR(50) NOT NULL UNIQUE COMMENT '订单编号',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    total_amount DECIMAL(10, 2) NOT NULL COMMENT '订单总金额',
    pay_amount DECIMAL(10, 2) DEFAULT NULL COMMENT '实付金额',
    payment_method TINYINT DEFAULT 1 NOT NULL COMMENT '支付方式：1-微信，2-支付宝，3-银行卡',
    payment_status TINYINT DEFAULT 0 NOT NULL COMMENT '支付状态：0-未支付，1-已支付，2-已退款',
    order_status TINYINT DEFAULT 0 NOT NULL COMMENT '订单状态：0-待付款，1-待发货，2-待收货，3-已完成，4-已取消，5-已退款',
    shipping_address TEXT DEFAULT NULL COMMENT '收货地址（JSON格式）',
    payment_time DATETIME DEFAULT NULL COMMENT '支付时间',
    shipping_time DATETIME DEFAULT NULL COMMENT '发货时间',
    end_time DATETIME DEFAULT NULL COMMENT '完成时间',
    remark VARCHAR(200) DEFAULT NULL COMMENT '订单备注',
    created_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_order_user (user_id),
    INDEX idx_order_no (order_no),
    INDEX idx_order_status (order_status),
    INDEX idx_order_payment_status (payment_status),
    CONSTRAINT fk_order_user FOREIGN KEY (user_id) REFERENCES tb_user(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单表';

-- =====================================================
-- 6. 订单项表 (tb_order_item)
-- =====================================================
DROP TABLE IF EXISTS tb_order_item;
CREATE TABLE tb_order_item (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '订单项ID',
    order_id BIGINT NOT NULL COMMENT '订单ID',
    product_id BIGINT NOT NULL COMMENT '商品ID',
    product_name VARCHAR(100) NOT NULL COMMENT '商品名称（快照）',
    product_price DECIMAL(10, 2) NOT NULL COMMENT '商品单价（快照）',
    quantity INT DEFAULT 1 NOT NULL COMMENT '购买数量',
    total_price DECIMAL(10, 2) NOT NULL COMMENT '小计金额',
    product_image VARCHAR(200) DEFAULT NULL COMMENT '商品图片（快照）',
    seller_id BIGINT DEFAULT NULL COMMENT '卖家ID',
    seller_name VARCHAR(50) DEFAULT NULL COMMENT '卖家用户名',
    ship_status TINYINT DEFAULT 0 COMMENT '发货状态：0-未发货，1-已发货',
    ship_time DATETIME DEFAULT NULL COMMENT '发货时间',
    created_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_order_item_order (order_id),
    INDEX idx_order_item_product (product_id),
    INDEX idx_order_item_seller (seller_id),
    CONSTRAINT fk_order_item_order FOREIGN KEY (order_id) REFERENCES tb_order(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_order_item_product FOREIGN KEY (product_id) REFERENCES tb_product(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单项表';

-- =====================================================
-- 7. 收货地址表 (addresses)
-- =====================================================
DROP TABLE IF EXISTS addresses;
CREATE TABLE addresses (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '地址ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    name VARCHAR(50) NOT NULL COMMENT '收货人姓名',
    phone VARCHAR(20) NOT NULL COMMENT '收货人电话',
    province VARCHAR(50) NOT NULL COMMENT '省份',
    city VARCHAR(50) NOT NULL COMMENT '城市',
    district VARCHAR(50) NOT NULL COMMENT '区/县',
    detail VARCHAR(200) NOT NULL COMMENT '详细地址',
    is_default BOOLEAN DEFAULT FALSE NOT NULL COMMENT '是否默认地址',
    status INT DEFAULT 1 NOT NULL COMMENT '状态：1-正常，0-无效',
    INDEX idx_address_user (user_id),
    CONSTRAINT fk_address_user FOREIGN KEY (user_id) REFERENCES tb_user(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='收货地址表';

-- =====================================================
-- 8. 安全设置表 (security_settings)
-- =====================================================
DROP TABLE IF EXISTS security_settings;
CREATE TABLE security_settings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '设置ID',
    user_id BIGINT NOT NULL UNIQUE COMMENT '用户ID',
    password_last_changed DATETIME DEFAULT NULL COMMENT '密码最后修改时间',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    CONSTRAINT fk_security_user FOREIGN KEY (user_id) REFERENCES tb_user(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='安全设置表';

-- =====================================================
-- 9. 隐私设置表 (privacy_settings)
-- =====================================================
DROP TABLE IF EXISTS privacy_settings;
CREATE TABLE privacy_settings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '设置ID',
    user_id BIGINT NOT NULL UNIQUE COMMENT '用户ID',
    profile_visibility VARCHAR(20) DEFAULT 'public' COMMENT '个人信息可见性：public-公开，private-私密',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    CONSTRAINT fk_privacy_user FOREIGN KEY (user_id) REFERENCES tb_user(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='隐私设置表';

-- =====================================================
-- 10. 通知设置表 (notification_settings)
-- =====================================================
DROP TABLE IF EXISTS notification_settings;
CREATE TABLE notification_settings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '设置ID',
    user_id BIGINT NOT NULL UNIQUE COMMENT '用户ID',
    order_status_enabled BOOLEAN DEFAULT TRUE COMMENT '订单状态更新通知',
    delivery_enabled BOOLEAN DEFAULT TRUE COMMENT '发货通知',
    promotions_enabled BOOLEAN DEFAULT TRUE COMMENT '促销活动通知',
    new_products_enabled BOOLEAN DEFAULT TRUE COMMENT '新品推荐通知',
    system_enabled BOOLEAN DEFAULT TRUE COMMENT '系统通知',
    in_app_enabled BOOLEAN DEFAULT TRUE COMMENT '应用内通知',
    email_enabled BOOLEAN DEFAULT TRUE COMMENT '邮件通知',
    sms_enabled BOOLEAN DEFAULT FALSE COMMENT '短信通知',
    notification_frequency VARCHAR(20) DEFAULT 'immediate' COMMENT '通知频率：immediate-立即，daily-每日，weekly-每周',
    notify_start_time INT DEFAULT 8 COMMENT '通知开始时间（小时）',
    notify_end_time INT DEFAULT 22 COMMENT '通知结束时间（小时）',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES tb_user(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='通知设置表';

-- =====================================================
-- 11. 消息通知表 (notifications)
-- =====================================================
DROP TABLE IF EXISTS notifications;
CREATE TABLE notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '通知ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    type VARCHAR(20) NOT NULL COMMENT '通知类型：system-系统，order-订单，promotion-促销',
    title VARCHAR(100) NOT NULL COMMENT '通知标题',
    message VARCHAR(500) NOT NULL COMMENT '通知内容',
    is_read BOOLEAN DEFAULT FALSE NOT NULL COMMENT '是否已读',
    related_id BIGINT DEFAULT NULL COMMENT '关联ID（如订单ID）',
    created_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_notification_user (user_id),
    INDEX idx_notification_read (is_read),
    INDEX idx_notification_type (type),
    CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES tb_user(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='消息通知表';


-- =====================================================
-- 12. 优惠券表 (tb_coupon)
-- =====================================================
DROP TABLE IF EXISTS tb_coupon;
CREATE TABLE tb_coupon (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '优惠券ID',
    name VARCHAR(100) NOT NULL COMMENT '优惠券名称',
    description VARCHAR(500) DEFAULT NULL COMMENT '优惠券描述',
    type TINYINT NOT NULL COMMENT '类型：1-满减券，2-折扣券，3-无门槛券',
    discount_amount DECIMAL(10, 2) DEFAULT NULL COMMENT '优惠金额',
    discount_rate DECIMAL(3, 2) DEFAULT NULL COMMENT '折扣比例（如0.8表示8折）',
    min_amount DECIMAL(10, 2) DEFAULT NULL COMMENT '最低消费金额',
    max_discount DECIMAL(10, 2) DEFAULT NULL COMMENT '最大优惠金额',
    total_count INT NOT NULL COMMENT '发放总量',
    claimed_count INT DEFAULT 0 NOT NULL COMMENT '已领取数量',
    limit_per_user INT DEFAULT 1 NOT NULL COMMENT '每人限领数量',
    start_time DATETIME NOT NULL COMMENT '生效时间',
    end_time DATETIME NOT NULL COMMENT '失效时间',
    status TINYINT DEFAULT 1 NOT NULL COMMENT '状态：1-启用，0-禁用',
    created_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_coupon_status (status),
    INDEX idx_coupon_time (start_time, end_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='优惠券表';

-- =====================================================
-- 13. 用户优惠券表 (tb_user_coupon)
-- =====================================================
DROP TABLE IF EXISTS tb_user_coupon;
CREATE TABLE tb_user_coupon (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    coupon_id BIGINT NOT NULL COMMENT '优惠券ID',
    status TINYINT DEFAULT 0 NOT NULL COMMENT '状态：0-未使用，1-已使用，2-已过期',
    order_id BIGINT DEFAULT NULL COMMENT '使用的订单ID',
    used_time DATETIME DEFAULT NULL COMMENT '使用时间',
    created_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '领取时间',
    INDEX idx_user_coupon_user (user_id),
    INDEX idx_user_coupon_coupon (coupon_id),
    INDEX idx_user_coupon_status (status),
    CONSTRAINT fk_user_coupon_user FOREIGN KEY (user_id) REFERENCES tb_user(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_user_coupon_coupon FOREIGN KEY (coupon_id) REFERENCES tb_coupon(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户优惠券表';

-- 添加订单表的优惠券字段
ALTER TABLE tb_order ADD COLUMN coupon_id BIGINT DEFAULT NULL COMMENT '使用的优惠券ID' AFTER remark;
ALTER TABLE tb_order ADD COLUMN coupon_discount DECIMAL(10, 2) DEFAULT NULL COMMENT '优惠券抵扣金额' AFTER coupon_id;

-- 插入示例优惠券数据
INSERT INTO tb_coupon (name, description, type, discount_amount, min_amount, total_count, limit_per_user, start_time, end_time, status) VALUES
('新人专享券', '新用户首单立减20元', 1, 20.00, 100.00, 1000, 1, '2025-01-01 00:00:00', '2025-12-31 23:59:59', 1),
('满300减50', '满300元立减50元', 1, 50.00, 300.00, 500, 2, '2025-01-01 00:00:00', '2025-12-31 23:59:59', 1),
('满500减100', '满500元立减100元', 1, 100.00, 500.00, 200, 1, '2025-01-01 00:00:00', '2025-12-31 23:59:59', 1),
('8折优惠券', '全场商品8折优惠', 2, NULL, 200.00, 300, 1, '2025-01-01 00:00:00', '2025-12-31 23:59:59', 1),
('无门槛10元券', '无门槛立减10元', 3, 10.00, 0.00, 2000, 3, '2025-01-01 00:00:00', '2025-12-31 23:59:59', 1);


-- =====================================================
-- 14. 音乐表 (music)
-- =====================================================
DROP TABLE IF EXISTS music;
CREATE TABLE music (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '音乐ID',
    title VARCHAR(100) NOT NULL COMMENT '歌曲名称',
    artist VARCHAR(100) DEFAULT NULL COMMENT '歌手',
    url VARCHAR(500) NOT NULL COMMENT '音乐文件URL',
    cover VARCHAR(500) DEFAULT NULL COMMENT '封面图片URL',
    duration INT DEFAULT NULL COMMENT '时长(秒)',
    sort_order INT DEFAULT 0 COMMENT '排序',
    status TINYINT DEFAULT 1 COMMENT '状态：1-启用，0-禁用',
    created_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_music_status (status),
    INDEX idx_music_sort (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='音乐表';

-- 插入示例音乐数据
INSERT INTO music (title, artist, url, cover, sort_order, status) VALUES
('轻音乐1', '纯音乐', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', NULL, 1, 1),
('轻音乐2', '纯音乐', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', NULL, 2, 1);


-- =====================================================
-- 15. 价格历史表 (tb_price_history)
-- =====================================================
DROP TABLE IF EXISTS tb_price_history;
CREATE TABLE tb_price_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '记录ID',
    product_id BIGINT NOT NULL COMMENT '商品ID',
    price DECIMAL(10, 2) NOT NULL COMMENT '记录时的价格',
    original_price DECIMAL(10, 2) DEFAULT NULL COMMENT '原价',
    recorded_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录时间',
    change_type VARCHAR(20) DEFAULT NULL COMMENT '变化类型：INITIAL-初始，INCREASE-涨价，DECREASE-降价，UNCHANGED-不变',
    change_amount DECIMAL(10, 2) DEFAULT NULL COMMENT '价格变化金额',
    change_rate DECIMAL(5, 2) DEFAULT NULL COMMENT '价格变化百分比',
    INDEX idx_price_history_product (product_id),
    INDEX idx_price_history_time (recorded_time),
    CONSTRAINT fk_price_history_product FOREIGN KEY (product_id) REFERENCES tb_product(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='价格历史表';

-- =====================================================
-- 16. 降价提醒表 (tb_price_alert)
-- =====================================================
DROP TABLE IF EXISTS tb_price_alert;
CREATE TABLE tb_price_alert (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '提醒ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    product_id BIGINT NOT NULL COMMENT '商品ID',
    target_price DECIMAL(10, 2) NOT NULL COMMENT '目标价格',
    current_price DECIMAL(10, 2) NOT NULL COMMENT '设置时的当前价格',
    status TINYINT DEFAULT 0 NOT NULL COMMENT '状态：0-监控中，1-已触发，2-已取消',
    triggered_time DATETIME DEFAULT NULL COMMENT '触发时间',
    triggered_price DECIMAL(10, 2) DEFAULT NULL COMMENT '触发时的价格',
    notified TINYINT DEFAULT 0 COMMENT '是否已通知：0-否，1-是',
    created_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_price_alert_user (user_id),
    INDEX idx_price_alert_product (product_id),
    INDEX idx_price_alert_status (status),
    UNIQUE KEY uk_user_product (user_id, product_id),
    CONSTRAINT fk_price_alert_user FOREIGN KEY (user_id) REFERENCES tb_user(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_price_alert_product FOREIGN KEY (product_id) REFERENCES tb_product(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='降价提醒表';




-- =====================================================
-- 17. 商品评价表 (tb_review)
-- =====================================================
DROP TABLE IF EXISTS tb_review;
CREATE TABLE tb_review (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '评价ID',
    product_id BIGINT NOT NULL COMMENT '商品ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    order_id BIGINT NOT NULL COMMENT '订单ID',
    order_item_id BIGINT DEFAULT NULL COMMENT '订单项ID',
    rating INT NOT NULL COMMENT '评分1-5星',
    content VARCHAR(500) DEFAULT NULL COMMENT '评价内容',
    images TEXT DEFAULT NULL COMMENT '评价图片（JSON数组）',
    is_anonymous TINYINT DEFAULT 0 NOT NULL COMMENT '是否匿名：0-否，1-是',
    reply VARCHAR(500) DEFAULT NULL COMMENT '商家回复',
    reply_time DATETIME DEFAULT NULL COMMENT '回复时间',
    created_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_review_product (product_id),
    INDEX idx_review_user (user_id),
    INDEX idx_review_order (order_id),
    CONSTRAINT fk_review_product FOREIGN KEY (product_id) REFERENCES tb_product(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_review_user FOREIGN KEY (user_id) REFERENCES tb_user(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_review_order FOREIGN KEY (order_id) REFERENCES tb_order(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商品评价表';

-- =====================================================
-- 18. 上传文件表 (tb_upload_file)
-- =====================================================
DROP TABLE IF EXISTS tb_upload_file;
CREATE TABLE tb_upload_file (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '文件ID',
    file_type VARCHAR(20) NOT NULL COMMENT '文件类型：AVATAR-头像，PRODUCT-商品，CATEGORY-分类，PROMOTION-促销，REVIEW-评价',
    file_path VARCHAR(255) NOT NULL COMMENT '文件路径',
    original_name VARCHAR(255) DEFAULT NULL COMMENT '原始文件名',
    file_size BIGINT DEFAULT NULL COMMENT '文件大小(字节)',
    user_id BIGINT NOT NULL COMMENT '上传用户ID',
    username VARCHAR(50) DEFAULT NULL COMMENT '上传用户名',
    status TINYINT DEFAULT 0 NOT NULL COMMENT '审核状态：0-待审核，1-已通过，2-已拒绝',
    reviewer_id BIGINT DEFAULT NULL COMMENT '审核人ID',
    reviewer_name VARCHAR(50) DEFAULT NULL COMMENT '审核人用户名',
    review_time DATETIME DEFAULT NULL COMMENT '审核时间',
    review_remark VARCHAR(200) DEFAULT NULL COMMENT '审核备注',
    related_id BIGINT DEFAULT NULL COMMENT '关联ID（如商品ID）',
    created_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '上传时间',
    INDEX idx_upload_file_user (user_id),
    INDEX idx_upload_file_status (status),
    INDEX idx_upload_file_type (file_type),
    CONSTRAINT fk_upload_file_user FOREIGN KEY (user_id) REFERENCES tb_user(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='上传文件表';


-- =====================================================
-- 19. 消费预算表 (tb_consumption_budget)
-- =====================================================
DROP TABLE IF EXISTS tb_consumption_budget;
CREATE TABLE tb_consumption_budget (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '预算ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    monthly_budget DECIMAL(10, 2) NOT NULL COMMENT '月度预算金额',
    budget_month VARCHAR(6) NOT NULL COMMENT '预算年月(格式:202601)',
    alert_enabled TINYINT DEFAULT 1 COMMENT '是否启用预算提醒：0-否，1-是',
    alert_threshold INT DEFAULT 80 COMMENT '预算警告阈值(百分比)',
    created_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_budget_user (user_id),
    INDEX idx_budget_month (budget_month),
    UNIQUE KEY uk_user_month (user_id, budget_month),
    CONSTRAINT fk_budget_user FOREIGN KEY (user_id) REFERENCES tb_user(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='消费预算表';

-- =====================================================
-- 20. 想要清单表 (tb_wishlist) - 延迟满足功能
-- =====================================================
DROP TABLE IF EXISTS tb_wishlist;
CREATE TABLE tb_wishlist (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    product_id BIGINT NOT NULL COMMENT '商品ID',
    added_price DECIMAL(10, 2) DEFAULT NULL COMMENT '加入时的价格',
    cooling_days INT DEFAULT 3 COMMENT '冷静期天数',
    cooling_end_time DATETIME DEFAULT NULL COMMENT '冷静期结束时间',
    status TINYINT DEFAULT 0 COMMENT '状态：0-冷静中，1-可购买，2-已购买，3-已移除',
    reason VARCHAR(500) DEFAULT NULL COMMENT '加入原因/备注',
    created_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_wishlist_user (user_id),
    INDEX idx_wishlist_product (product_id),
    INDEX idx_wishlist_status (status),
    CONSTRAINT fk_wishlist_user FOREIGN KEY (user_id) REFERENCES tb_user(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_wishlist_product FOREIGN KEY (product_id) REFERENCES tb_product(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='想要清单表';

-- =====================================================
-- 21. 消费成就表 (tb_consumption_achievement)
-- =====================================================
DROP TABLE IF EXISTS tb_consumption_achievement;
CREATE TABLE tb_consumption_achievement (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '成就ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    achievement_type VARCHAR(50) NOT NULL COMMENT '成就类型',
    achievement_name VARCHAR(100) NOT NULL COMMENT '成就名称',
    achievement_desc VARCHAR(200) DEFAULT NULL COMMENT '成就描述',
    achieved_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '达成时间',
    INDEX idx_achievement_user (user_id),
    INDEX idx_achievement_type (achievement_type),
    UNIQUE KEY uk_user_achievement (user_id, achievement_type),
    CONSTRAINT fk_achievement_user FOREIGN KEY (user_id) REFERENCES tb_user(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='消费成就表';
