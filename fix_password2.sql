USE shopping_mall;
-- 使用新注册用户的密码哈希（密码为 test123456）更新其他用户
-- 这样所有用户的密码都是 test123456
UPDATE tb_user SET password = '$2a$10$Z3dt/05IIDpRxISAgrx/NutBkRDGKm0IJ/x0/9ZMnjkkSePKo6bWu' WHERE id IN (1, 2, 3);
SELECT id, username, LEFT(password, 30) as pwd FROM tb_user;
