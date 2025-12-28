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
    created_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_order_item_order (order_id),
    INDEX idx_order_item_product (product_id),
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
