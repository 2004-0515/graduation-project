-- =====================================================
-- 购物商城数据库初始化脚本
-- 数据库: shopping_mall
-- 字符集: utf8mb4
-- =====================================================

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS shopping_mall_test 
DEFAULT CHARACTER SET utf8mb4 
DEFAULT COLLATE utf8mb4_unicode_ci;

USE shopping_mall_test;

SET FOREIGN_KEY_CHECKS=0;

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
    role VARCHAR(20) DEFAULT 'BUYER' NOT NULL COMMENT '角色：BUYER-买家，SELLER-卖家，ADMIN-管理员',
    created_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    last_login_time DATETIME DEFAULT NULL COMMENT '最后登录时间',
    last_login_ip VARCHAR(50) DEFAULT NULL COMMENT '最后登录IP',
    INDEX idx_user_username (username),
    INDEX idx_user_email (email),
    INDEX idx_user_status (status),
    INDEX idx_user_role (role)
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
    description TEXT COMMENT '商品描述',
    category_id BIGINT NOT NULL COMMENT '分类ID',
    price DECIMAL(10, 2) NOT NULL COMMENT '商品价格',
    original_price DECIMAL(10, 2) DEFAULT NULL COMMENT '原价',
    pending_price DECIMAL(10, 2) DEFAULT NULL COMMENT '待审核价格',
    pending_original_price DECIMAL(10, 2) DEFAULT NULL COMMENT '待审核原价',
    stock INT DEFAULT 0 NOT NULL COMMENT '库存数量',
    version BIGINT DEFAULT 0 NOT NULL COMMENT '乐观锁版本号',
    sales INT DEFAULT 0 NOT NULL COMMENT '销量',
    status TINYINT DEFAULT 1 NOT NULL COMMENT '状态：1-上架，0-下架',
    main_image VARCHAR(200) DEFAULT NULL COMMENT '主图URL',
    images TEXT COMMENT '商品图片列表（JSON格式）',
    seller_id BIGINT NOT NULL COMMENT '卖家用户ID',
    seller_name VARCHAR(50) NOT NULL COMMENT '卖家用户名',
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
    CONSTRAINT fk_product_category FOREIGN KEY (category_id) REFERENCES tb_category(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_product_seller FOREIGN KEY (seller_id) REFERENCES tb_user(id) ON DELETE RESTRICT ON UPDATE CASCADE
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
    payment_status TINYINT DEFAULT 0 NOT NULL COMMENT '支付状态：0-未支付，1-已支付，2-支付失败',
    order_status TINYINT DEFAULT 0 NOT NULL COMMENT '订单状态：0-待支付，1-待发货，2-待收货，3-已完成，4-已取消，5-退款中，6-申请取消中',
    shipping_address TEXT COMMENT '收货地址（JSON格式）',
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
    seller_id BIGINT NOT NULL COMMENT '卖家ID',
    seller_name VARCHAR(50) NOT NULL COMMENT '卖家用户名',
    ship_status TINYINT DEFAULT 0 COMMENT '发货状态：0-未发货，1-已发货',
    ship_time DATETIME DEFAULT NULL COMMENT '发货时间',
    created_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_order_item_order (order_id),
    INDEX idx_order_item_product (product_id),
    INDEX idx_order_item_seller (seller_id),
    CONSTRAINT fk_order_item_order FOREIGN KEY (order_id) REFERENCES tb_order(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_order_item_product FOREIGN KEY (product_id) REFERENCES tb_product(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_order_item_seller FOREIGN KEY (seller_id) REFERENCES tb_user(id) ON DELETE RESTRICT ON UPDATE CASCADE
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
    CONSTRAINT fk_notification_settings_user FOREIGN KEY (user_id) REFERENCES tb_user(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='通知设置表';

-- =====================================================
-- 11. 消息通知表 (notifications)
-- =====================================================
DROP TABLE IF EXISTS notifications;
CREATE TABLE notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '通知ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    type VARCHAR(20) NOT NULL COMMENT '通知类型：system-系统，order-订单，promotion-促销，price_alert-价格提醒，file_review-文件审核，product_review-商品审核，review-评价',
    title VARCHAR(100) NOT NULL COMMENT '通知标题',
    message VARCHAR(500) NOT NULL COMMENT '通知内容',
    is_read BOOLEAN DEFAULT FALSE NOT NULL COMMENT '是否已读',
    related_id BIGINT DEFAULT NULL COMMENT '关联ID（如订单ID）',
    created_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_notification_user (user_id),
    INDEX idx_notification_read (is_read),
    INDEX idx_notification_type (type),
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES tb_user(id) ON DELETE CASCADE ON UPDATE CASCADE
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
    asset_source VARCHAR(50) DEFAULT NULL COMMENT '素材来源平台',
    license_code VARCHAR(40) DEFAULT NULL COMMENT '授权代码',
    license_version VARCHAR(20) DEFAULT NULL COMMENT '授权版本',
    duration INT DEFAULT NULL COMMENT '时长(秒)',
    sort_order INT DEFAULT 0 COMMENT '排序',
    status TINYINT DEFAULT 1 COMMENT '状态：1-启用，0-禁用',
    created_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_music_status (status),
    INDEX idx_music_sort (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='音乐表';


-- =====================================================
-- 14.1 演示数据导入批次表 (demo_import_batch)
-- =====================================================
DROP TABLE IF EXISTS demo_import_batch;
CREATE TABLE demo_import_batch (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    batch_id VARCHAR(64) NOT NULL UNIQUE COMMENT '批次标识',
    batch_type VARCHAR(50) NOT NULL COMMENT '批次类型',
    status VARCHAR(20) NOT NULL COMMENT '状态',
    summary VARCHAR(500) DEFAULT NULL COMMENT '摘要',
    created_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_demo_import_batch_type (batch_type),
    INDEX idx_demo_import_batch_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='演示数据导入批次表';

-- =====================================================
-- 14.2 演示导入资产审计表 (demo_imported_asset)
-- =====================================================
DROP TABLE IF EXISTS demo_imported_asset;
CREATE TABLE demo_imported_asset (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    asset_type VARCHAR(30) NOT NULL COMMENT '资产类型',
    business_type VARCHAR(30) NOT NULL COMMENT '业务类型',
    business_id BIGINT DEFAULT NULL COMMENT '业务ID',
    source_platform VARCHAR(50) NOT NULL COMMENT '来源平台',
    source_url VARCHAR(1000) NOT NULL COMMENT '源资源URL',
    foreign_landing_url VARCHAR(1000) DEFAULT NULL COMMENT '来源落地页',
    license_code VARCHAR(40) DEFAULT NULL COMMENT '授权代码',
    license_version VARCHAR(20) DEFAULT NULL COMMENT '授权版本',
    creator_name VARCHAR(200) DEFAULT NULL COMMENT '作者/创作者',
    content_hash VARCHAR(64) NOT NULL COMMENT '内容哈希',
    file_path VARCHAR(500) NOT NULL COMMENT '本地文件路径',
    file_size BIGINT DEFAULT NULL COMMENT '文件大小',
    batch_id VARCHAR(64) NOT NULL COMMENT '导入批次',
    status VARCHAR(20) NOT NULL COMMENT '导入状态',
    failure_reason VARCHAR(500) DEFAULT NULL COMMENT '失败原因',
    created_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE KEY uk_demo_asset_source_hash (source_url(255), content_hash),
    INDEX idx_demo_asset_business (business_type, business_id),
    INDEX idx_demo_asset_batch (batch_id),
    INDEX idx_demo_asset_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='演示导入资产审计表';


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
    images TEXT COMMENT '评价图片（JSON数组）',
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
-- 20. 心愿单表 (tb_wishlist) - 延迟满足功能
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='心愿单表';

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

-- =====================================================
-- 22. 联系我们留言表 (tb_contact_message)
-- =====================================================
DROP TABLE IF EXISTS tb_contact_message;
CREATE TABLE tb_contact_message (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '留言ID',
    name VARCHAR(50) NOT NULL COMMENT '姓名',
    contact VARCHAR(100) NOT NULL COMMENT '联系方式',
    type VARCHAR(30) NOT NULL COMMENT '问题类型',
    content VARCHAR(1000) NOT NULL COMMENT '留言内容',
    status VARCHAR(20) NOT NULL DEFAULT 'pending' COMMENT '处理状态',
    created_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='联系我们留言表';

-- =====================================================
-- 23. 展示内容表 (tb_showcase_banner)
-- =====================================================
DROP TABLE IF EXISTS tb_showcase_banner;
CREATE TABLE tb_showcase_banner (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '展示内容ID',
    placement VARCHAR(32) NOT NULL COMMENT '展示位置：HOME_HERO、PROMOTION_HERO、CATEGORY_SPOTLIGHT',
    title VARCHAR(120) NOT NULL COMMENT '标题',
    subtitle VARCHAR(120) DEFAULT NULL COMMENT '副标题',
    description TEXT COMMENT '描述',
    badge_text VARCHAR(40) DEFAULT NULL COMMENT '角标文案',
    image_path VARCHAR(255) NOT NULL COMMENT '主图路径',
    mobile_image_path VARCHAR(255) DEFAULT NULL COMMENT '移动端主图路径',
    button_text VARCHAR(40) DEFAULT NULL COMMENT '按钮文案',
    link_type VARCHAR(32) DEFAULT NULL COMMENT '链接类型',
    link_target VARCHAR(255) DEFAULT NULL COMMENT '链接目标',
    sort_order INT NOT NULL DEFAULT 0 COMMENT '排序',
    status TINYINT NOT NULL DEFAULT 1 COMMENT '状态：1-启用，0-禁用',
    start_time DATETIME DEFAULT NULL COMMENT '开始时间',
    end_time DATETIME DEFAULT NULL COMMENT '结束时间',
    created_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_showcase_placement (placement),
    INDEX idx_showcase_status (status),
    INDEX idx_showcase_sort (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='展示内容表';

-- =====================================================
-- 24. 搜索历史表 (tb_search_history)
-- =====================================================
DROP TABLE IF EXISTS tb_search_history;
CREATE TABLE tb_search_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '搜索历史ID',
    keyword VARCHAR(100) NOT NULL COMMENT '搜索关键词',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    search_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '搜索时间',
    created_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE KEY idx_user_keyword (user_id, keyword),
    INDEX idx_user_time (user_id, search_time DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='搜索历史表';

-- =====================================================
-- 25. 搜索统计表 (tb_search_stats)
-- =====================================================
DROP TABLE IF EXISTS tb_search_stats;
CREATE TABLE tb_search_stats (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '搜索统计ID',
    keyword VARCHAR(100) NOT NULL COMMENT '搜索关键词',
    search_count INT NOT NULL DEFAULT 0 COMMENT '搜索次数',
    search_date DATE NOT NULL COMMENT '统计日期',
    created_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE KEY idx_keyword_date (keyword, search_date),
    INDEX idx_date_count (search_date, search_count DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='搜索统计表';

SET FOREIGN_KEY_CHECKS=1;
