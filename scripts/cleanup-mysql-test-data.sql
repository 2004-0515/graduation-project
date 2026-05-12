-- Cleanup targeted test data accidentally written into the real MySQL database.
-- Scope:
--   1. Test users created by backend property/integration tests
--   2. Test products created by concurrency/order-number tests
--   3. Orders and order items linked to those users/products
--
-- Safe usage:
--   mysql -u root -p shopping_mall < scripts/cleanup-mysql-test-data.sql

USE shopping_mall;

START TRANSACTION;

DROP TEMPORARY TABLE IF EXISTS dirty_users;
CREATE TEMPORARY TABLE dirty_users (
    id BIGINT PRIMARY KEY
)
SELECT id
FROM tb_user
WHERE username REGEXP '^(ordernum_test_|sequential_test_|payment_test_|stock_test_|testuser_)';

DROP TEMPORARY TABLE IF EXISTS dirty_products;
CREATE TEMPORARY TABLE dirty_products (
    id BIGINT PRIMARY KEY
)
SELECT id
FROM tb_product
WHERE name REGEXP '^(OrderNumTest_|SequentialTest_|ConcurrentTest_|HighConcurrency_|Product_|Product_Payment_)';

DROP TEMPORARY TABLE IF EXISTS dirty_orders;
CREATE TEMPORARY TABLE dirty_orders (
    id BIGINT PRIMARY KEY
)
SELECT DISTINCT o.id
FROM tb_order o
LEFT JOIN tb_order_item oi ON oi.order_id = o.id
WHERE o.user_id IN (SELECT id FROM dirty_users)
   OR oi.product_id IN (SELECT id FROM dirty_products);

SELECT 'dirty_users' AS item, COUNT(*) AS affected_rows FROM dirty_users;
SELECT 'dirty_products' AS item, COUNT(*) AS affected_rows FROM dirty_products;
SELECT 'dirty_orders' AS item, COUNT(*) AS affected_rows FROM dirty_orders;
SELECT 'dirty_order_items' AS item, COUNT(*) AS affected_rows FROM tb_order_item WHERE order_id IN (SELECT id FROM dirty_orders);
SELECT 'dirty_reviews' AS item, COUNT(*) AS affected_rows FROM tb_review WHERE order_id IN (SELECT id FROM dirty_orders);
SELECT 'dirty_carts' AS item, COUNT(*) AS affected_rows FROM tb_cart WHERE user_id IN (SELECT id FROM dirty_users) OR product_id IN (SELECT id FROM dirty_products);
SELECT 'dirty_wishlists' AS item, COUNT(*) AS affected_rows FROM tb_wishlist WHERE user_id IN (SELECT id FROM dirty_users) OR product_id IN (SELECT id FROM dirty_products);
SELECT 'dirty_addresses' AS item, COUNT(*) AS affected_rows FROM addresses WHERE user_id IN (SELECT id FROM dirty_users);
SELECT 'dirty_price_history' AS item, COUNT(*) AS affected_rows FROM tb_price_history WHERE product_id IN (SELECT id FROM dirty_products);
SELECT 'dirty_price_alerts' AS item, COUNT(*) AS affected_rows FROM tb_price_alert WHERE user_id IN (SELECT id FROM dirty_users) OR product_id IN (SELECT id FROM dirty_products);

DELETE FROM tb_review
WHERE order_id IN (SELECT id FROM dirty_orders)
   OR user_id IN (SELECT id FROM dirty_users)
   OR product_id IN (SELECT id FROM dirty_products);

DELETE FROM tb_order
WHERE id IN (SELECT id FROM dirty_orders);

DELETE FROM tb_price_alert
WHERE user_id IN (SELECT id FROM dirty_users)
   OR product_id IN (SELECT id FROM dirty_products);

DELETE FROM tb_cart
WHERE user_id IN (SELECT id FROM dirty_users)
   OR product_id IN (SELECT id FROM dirty_products);

DELETE FROM tb_wishlist
WHERE user_id IN (SELECT id FROM dirty_users)
   OR product_id IN (SELECT id FROM dirty_products);

DELETE FROM tb_product
WHERE id IN (SELECT id FROM dirty_products);

DELETE FROM tb_user
WHERE id IN (SELECT id FROM dirty_users);

SELECT 'remaining_dirty_users' AS item, COUNT(*) AS remaining_rows
FROM tb_user
WHERE username REGEXP '^(ordernum_test_|sequential_test_|payment_test_|stock_test_|testuser_)';

SELECT 'remaining_dirty_products' AS item, COUNT(*) AS remaining_rows
FROM tb_product
WHERE name REGEXP '^(OrderNumTest_|SequentialTest_|ConcurrentTest_|HighConcurrency_|Product_|Product_Payment_)';

SELECT 'remaining_dirty_orders' AS item, COUNT(*) AS remaining_rows
FROM tb_order
WHERE user_id IN (SELECT id FROM dirty_users);

COMMIT;
