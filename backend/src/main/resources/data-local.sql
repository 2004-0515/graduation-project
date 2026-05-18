-- Minimal fallback seed data for the optional local H2 profile.
-- This file must never be used by the default MySQL-backed web startup path.
INSERT INTO tb_user (id, username, password, email, phone, avatar, nickname, bio, points, growth_value, member_days, status, role, created_time, updated_time)
VALUES
  (1, 'admin', '$2a$10$ion4ZW8KGoDWpPAzbobIPeOR5FLFr.0BBeWI8O.FzqAlbHBZFmdae', 'admin@menggo.com', '13800138000', '/seed/avatar-user.svg', '管理员', '系统管理员', 10000, 5000, 365, 1, 'ADMIN', CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP()),
  (2, 'zhangsan', '$2a$10$ion4ZW8KGoDWpPAzbobIPeOR5FLFr.0BBeWI8O.FzqAlbHBZFmdae', 'zhangsan@menggo.com', '13800138001', '/seed/avatar-user.svg', '张三', '日常买家账号', 500, 200, 30, 1, 'BUYER', CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP()),
  (3, 'lisi', '$2a$10$ion4ZW8KGoDWpPAzbobIPeOR5FLFr.0BBeWI8O.FzqAlbHBZFmdae', 'lisi@menggo.com', '13800138002', '/seed/avatar-user.svg', '李四', '店铺运营账号', 100, 50, 7, 1, 'SELLER', CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP());

INSERT INTO tb_category (id, name, description, parent_id, sort_order, icon, status, created_time, updated_time)
VALUES
  (1, '手机数码', '手机、电脑与桌面数码配件', 0, 1, '/seed/category-card.svg', 1, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP()),
  (2, '家用电器', '厨房、清洁与居家电器', 0, 2, '/seed/category-card.svg', 1, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP());

INSERT INTO tb_product (id, name, description, category_id, price, original_price, pending_price, pending_original_price, stock, sales, status, main_image, images, seller_id, seller_name, audit_status, audit_remark, audit_time, ad_video, ad_video_duration, ad_video_enabled, version, created_time, updated_time)
VALUES
  (1, '云纹机械键盘', '75键热插拔机械键盘，适合桌面办公与轻量游戏', 1, 199.00, 299.00, NULL, NULL, 50, 10, 1, '/seed/product-card.svg', '["/seed/product-card.svg"]', 3, 'lisi', 1, NULL, NULL, NULL, NULL, 0, 0, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP()),
  (2, '星河蓝牙音箱', '小体积蓝牙音箱，低延迟连接与长续航设计', 1, 299.00, 399.00, NULL, NULL, 40, 5, 1, '/seed/product-card.svg', '["/seed/product-card.svg"]', 3, 'lisi', 1, NULL, NULL, NULL, NULL, 0, 0, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP()),
  (3, '暖光空气循环扇', '桌面空气循环扇，三档风速与静音运行', 2, 399.00, 499.00, NULL, NULL, 30, 3, 1, '/seed/product-card.svg', '["/seed/product-card.svg"]', 3, 'lisi', 1, NULL, NULL, NULL, NULL, 0, 0, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP());

INSERT INTO addresses (id, user_id, name, phone, province, city, district, detail, is_default, status)
VALUES
  (1, 2, '张三', '13800138001', '广东省', '深圳市', '南山区', '科技园路1号', TRUE, 1);

INSERT INTO security_settings (id, user_id, password_last_changed, created_at, updated_at)
VALUES
  (1, 1, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP()),
  (2, 2, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP()),
  (3, 3, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP());

INSERT INTO privacy_settings (id, user_id, profile_visibility, created_at, updated_at)
VALUES
  (1, 1, 'public', CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP()),
  (2, 2, 'public', CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP()),
  (3, 3, 'private', CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP());

INSERT INTO notification_settings (id, user_id, order_status_enabled, delivery_enabled, promotions_enabled, new_products_enabled, system_enabled, in_app_enabled, email_enabled, sms_enabled, notification_frequency, notify_start_time, notify_end_time, created_at, updated_at)
VALUES
  (1, 1, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, 'immediate', 8, 22, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP()),
  (2, 2, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, 'immediate', 9, 21, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP()),
  (3, 3, TRUE, TRUE, FALSE, FALSE, TRUE, TRUE, FALSE, FALSE, 'daily', 10, 20, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP());

INSERT INTO tb_order (id, order_no, user_id, total_amount, pay_amount, payment_method, payment_status, order_status, shipping_address, payment_time, shipping_time, end_time, remark, coupon_id, coupon_discount, created_time, updated_time)
VALUES
  (1, 'ORD-LOCAL-COMPLETE-1', 2, 199.00, 199.00, 1, 1, 3, '{"receiver":"张三","phone":"13800138001","province":"广东省","city":"深圳市","district":"南山区","detail":"科技园路1号"}', CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP(), NULL, NULL, NULL, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP()),
  (2, 'ORD-LOCAL-COMPLETE-2', 2, 299.00, 299.00, 1, 1, 3, '{"receiver":"张三","phone":"13800138001","province":"广东省","city":"深圳市","district":"南山区","detail":"科技园路1号"}', CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP(), NULL, NULL, NULL, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP()),
  (3, 'ORD-LOCAL-PENDING-1', 2, 399.00, NULL, 1, 0, 0, '{"receiver":"张三","phone":"13800138001","province":"广东省","city":"深圳市","district":"南山区","detail":"科技园路1号"}', NULL, NULL, NULL, NULL, NULL, NULL, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP());

INSERT INTO tb_order_item (id, order_id, product_id, product_name, product_price, quantity, total_price, product_image, seller_id, seller_name, ship_status, ship_time, created_time, updated_time)
VALUES
  (1, 1, 1, '云纹机械键盘', 199.00, 1, 199.00, '/seed/product-card.svg', 3, 'lisi', 1, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP()),
  (2, 2, 2, '星河蓝牙音箱', 299.00, 1, 299.00, '/seed/product-card.svg', 3, 'lisi', 1, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP()),
  (3, 3, 3, '暖光空气循环扇', 399.00, 1, 399.00, '/seed/product-card.svg', 3, 'lisi', 0, NULL, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP());

