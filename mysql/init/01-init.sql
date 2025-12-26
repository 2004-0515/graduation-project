-- 购物商场数据库初始化脚本

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS shopping_mall CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE shopping_mall;

-- 用户表
CREATE TABLE IF NOT EXISTS tb_user (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '用户ID',
    username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
    password VARCHAR(100) NOT NULL COMMENT '密码哈希',
    email VARCHAR(100) NOT NULL UNIQUE COMMENT '邮箱',
    phone VARCHAR(20) COMMENT '手机号',
    avatar VARCHAR(200) COMMENT '头像URL',
    nickname VARCHAR(50) COMMENT '昵称',
    bio VARCHAR(200) COMMENT '个人简介',
    points INT DEFAULT 0 COMMENT '积分',
    growth_value INT DEFAULT 0 COMMENT '成长值',
    member_days INT DEFAULT 0 COMMENT '会员天数',
    status TINYINT DEFAULT 1 COMMENT '状态：0-禁用，1-启用',
    created_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    last_login_time DATETIME COMMENT '最后登录时间',
    last_login_ip VARCHAR(50) COMMENT '最后登录IP',
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_status (status),
    INDEX idx_created_time (created_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 地址表
CREATE TABLE IF NOT EXISTS tb_address (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '地址ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    receiver VARCHAR(50) NOT NULL COMMENT '收件人',
    phone VARCHAR(20) NOT NULL COMMENT '联系电话',
    province VARCHAR(50) NOT NULL COMMENT '省份',
    city VARCHAR(50) NOT NULL COMMENT '城市',
    district VARCHAR(50) NOT NULL COMMENT '区县',
    detail VARCHAR(200) NOT NULL COMMENT '详细地址',
    is_default TINYINT DEFAULT 0 COMMENT '是否默认：0-否，1-是',
    created_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (user_id) REFERENCES tb_user(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_is_default (is_default)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='地址表';

-- 商品分类表
CREATE TABLE IF NOT EXISTS tb_category (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '分类ID',
    name VARCHAR(50) NOT NULL COMMENT '分类名称',
    parent_id BIGINT DEFAULT 0 COMMENT '父分类ID，0表示一级分类',
    level TINYINT NOT NULL COMMENT '分类级别：1-一级，2-二级，3-三级',
    sort INT DEFAULT 0 COMMENT '排序',
    icon VARCHAR(200) COMMENT '图标',
    status TINYINT DEFAULT 1 COMMENT '状态：0-禁用，1-启用',
    created_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_parent_id (parent_id),
    INDEX idx_level (level),
    INDEX idx_status (status),
    INDEX idx_sort (sort)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品分类表';

-- 商品表
CREATE TABLE IF NOT EXISTS tb_product (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '商品ID',
    category_id BIGINT NOT NULL COMMENT '分类ID',
    name VARCHAR(100) NOT NULL COMMENT '商品名称',
    subtitle VARCHAR(200) COMMENT '商品副标题',
    price DECIMAL(10,2) NOT NULL COMMENT '价格',
    stock INT NOT NULL DEFAULT 0 COMMENT '库存',
    sales INT DEFAULT 0 COMMENT '销量',
    images JSON COMMENT '商品图片URL列表',
    detail TEXT COMMENT '商品详情HTML',
    status TINYINT DEFAULT 1 COMMENT '状态：0-下架，1-上架',
    created_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (category_id) REFERENCES tb_category(id),
    FULLTEXT idx_name_subtitle (name, subtitle),
    INDEX idx_category_id (category_id),
    INDEX idx_status (status),
    INDEX idx_price (price),
    INDEX idx_sales (sales),
    INDEX idx_created_time (created_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品表';

-- 购物车表
CREATE TABLE IF NOT EXISTS tb_cart (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '购物车项ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    product_id BIGINT NOT NULL COMMENT '商品ID',
    quantity INT NOT NULL COMMENT '数量',
    selected TINYINT DEFAULT 1 COMMENT '是否选中：0-否，1-是',
    created_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (user_id) REFERENCES tb_user(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES tb_product(id) ON DELETE CASCADE,
    UNIQUE KEY uk_user_product (user_id, product_id),
    INDEX idx_user_id (user_id),
    INDEX idx_product_id (product_id),
    INDEX idx_selected (selected)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='购物车表';

-- 订单表
CREATE TABLE IF NOT EXISTS tb_order (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '订单ID',
    order_no VARCHAR(50) NOT NULL UNIQUE COMMENT '订单号',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    total_amount DECIMAL(10,2) NOT NULL COMMENT '总金额',
    payment_method TINYINT NOT NULL COMMENT '支付方式：1-微信，2-支付宝',
    payment_status TINYINT DEFAULT 0 COMMENT '支付状态：0-未支付，1-已支付，2-支付失败',
    order_status TINYINT DEFAULT 0 COMMENT '订单状态：0-待支付，1-待发货，2-待收货，3-已完成，4-已取消',
    shipping_address JSON COMMENT '收货地址JSON',
    payment_time DATETIME COMMENT '支付时间',
    shipping_time DATETIME COMMENT '发货时间',
    end_time DATETIME COMMENT '完成时间',
    created_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (user_id) REFERENCES tb_user(id),
    INDEX idx_order_no (order_no),
    INDEX idx_user_id (user_id),
    INDEX idx_payment_status (payment_status),
    INDEX idx_order_status (order_status),
    INDEX idx_created_time (created_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单表';

-- 订单商品表
CREATE TABLE IF NOT EXISTS tb_order_item (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '订单商品ID',
    order_id BIGINT NOT NULL COMMENT '订单ID',
    product_id BIGINT NOT NULL COMMENT '商品ID',
    product_name VARCHAR(100) NOT NULL COMMENT '商品名称',
    product_image VARCHAR(200) COMMENT '商品图片',
    price DECIMAL(10,2) NOT NULL COMMENT '单价',
    quantity INT NOT NULL COMMENT '数量',
    created_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    FOREIGN KEY (order_id) REFERENCES tb_order(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES tb_product(id),
    INDEX idx_order_id (order_id),
    INDEX idx_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单商品表';

-- 安全设置表
CREATE TABLE IF NOT EXISTS tb_security_settings (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '设置ID',
    user_id BIGINT NOT NULL UNIQUE COMMENT '用户ID',
    password_last_changed DATETIME COMMENT '密码最后修改时间',
    two_factor_enabled TINYINT DEFAULT 0 COMMENT '是否启用两步验证',
    login_alert_enabled TINYINT DEFAULT 1 COMMENT '登录提醒',
    created_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (user_id) REFERENCES tb_user(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='安全设置表';

-- 隐私设置表
CREATE TABLE IF NOT EXISTS tb_privacy_settings (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '设置ID',
    user_id BIGINT NOT NULL UNIQUE COMMENT '用户ID',
    profile_visible TINYINT DEFAULT 1 COMMENT '个人资料可见性',
    search_visible TINYINT DEFAULT 1 COMMENT '搜索可见性',
    activity_visible TINYINT DEFAULT 1 COMMENT '活动可见性',
    created_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (user_id) REFERENCES tb_user(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='隐私设置表';

-- 通知设置表
CREATE TABLE IF NOT EXISTS tb_notification_settings (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '设置ID',
    user_id BIGINT NOT NULL UNIQUE COMMENT '用户ID',
    order_notification TINYINT DEFAULT 1 COMMENT '订单通知',
    promotion_notification TINYINT DEFAULT 1 COMMENT '促销通知',
    system_notification TINYINT DEFAULT 1 COMMENT '系统通知',
    email_notification TINYINT DEFAULT 1 COMMENT '邮件通知',
    sms_notification TINYINT DEFAULT 0 COMMENT '短信通知',
    created_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (user_id) REFERENCES tb_user(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='通知设置表';

-- 插入默认分类数据
INSERT IGNORE INTO tb_category (id, name, parent_id, level, sort, status) VALUES
(1, '电子产品', 0, 1, 1, 1),
(2, '服装鞋帽', 0, 1, 2, 1),
(3, '食品饮料', 0, 1, 3, 1),
(4, '家居用品', 0, 1, 4, 1),
(5, '手机', 1, 2, 1, 1),
(6, '电脑', 1, 2, 2, 1),
(7, '男装', 2, 2, 1, 1),
(8, '女装', 2, 2, 2, 1);

-- 插入默认商品数据
INSERT IGNORE INTO tb_product (id, category_id, name, subtitle, price, stock, sales, images, detail, status) VALUES
(1, 5, 'iPhone 15 Pro', '苹果旗舰手机', 8999.00, 100, 50, '["https://example.com/iphone15.jpg"]', '<p>苹果iPhone 15 Pro旗舰手机</p>', 1),
(2, 5, '华为Mate 50', '华为高端手机', 5999.00, 80, 30, '["https://example.com/huawei-mate50.jpg"]', '<p>华为Mate 50高端智能手机</p>', 1),
(3, 6, 'MacBook Pro', '苹果专业笔记本', 15999.00, 50, 20, '["https://example.com/macbook-pro.jpg"]', '<p>苹果MacBook Pro专业笔记本电脑</p>', 1),
(4, 7, 'Nike运动鞋', '专业跑步鞋', 599.00, 200, 100, '["https://example.com/nike-shoes.jpg"]', '<p>Nike专业运动跑步鞋</p>', 1),
(5, 8, '连衣裙', '时尚女装', 199.00, 150, 80, '["https://example.com/dress.jpg"]', '<p>时尚优雅连衣裙</p>', 1);
