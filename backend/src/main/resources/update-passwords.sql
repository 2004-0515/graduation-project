-- 更新用户密码为 123456 的BCrypt加密值
-- BCrypt hash for "123456": $2a$10$ion4ZW8KGoDWpPAzbobIPeOR5FLFr.0BBeWI8O.FzqAlbHBZFmdae

USE shopping_mall;

-- 使用一个已知有效的BCrypt哈希值（密码为123456）
UPDATE tb_user SET password = '$2a$10$ion4ZW8KGoDWpPAzbobIPeOR5FLFr.0BBeWI8O.FzqAlbHBZFmdae' WHERE id = 1;
UPDATE tb_user SET password = '$2a$10$ion4ZW8KGoDWpPAzbobIPeOR5FLFr.0BBeWI8O.FzqAlbHBZFmdae' WHERE id = 2;
UPDATE tb_user SET password = '$2a$10$ion4ZW8KGoDWpPAzbobIPeOR5FLFr.0BBeWI8O.FzqAlbHBZFmdae' WHERE id = 3;
