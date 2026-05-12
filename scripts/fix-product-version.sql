-- Backfill optimistic-lock version values for legacy products.
-- This fixes real MySQL data that predates the @Version field on tb_product.
--
-- Safe usage:
--   mysql -u root -p shopping_mall < scripts/fix-product-version.sql

USE shopping_mall;

START TRANSACTION;

SELECT COUNT(*) AS null_product_versions
FROM tb_product
WHERE version IS NULL;

UPDATE tb_product
SET version = 0
WHERE version IS NULL;

SELECT COUNT(*) AS remaining_null_product_versions
FROM tb_product
WHERE version IS NULL;

COMMIT;
