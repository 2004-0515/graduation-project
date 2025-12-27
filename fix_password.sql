USE shopping_mall;
-- BCrypt hash for password "123456" (generated with cost factor 10)
UPDATE tb_user SET password = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';
SELECT id, username, password FROM tb_user;
