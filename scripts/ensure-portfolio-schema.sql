SET @has_role = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'tb_user'
    AND COLUMN_NAME = 'role'
);
SET @add_role_sql = IF(
  @has_role = 0,
  "ALTER TABLE tb_user ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'BUYER' COMMENT 'Role: BUYER, SELLER, ADMIN'",
  "DO 0"
);
PREPARE add_role_stmt FROM @add_role_sql;
EXECUTE add_role_stmt;
DEALLOCATE PREPARE add_role_stmt;

SET @has_role_index = (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'tb_user'
    AND INDEX_NAME = 'idx_user_role'
);
SET @add_role_index_sql = IF(
  @has_role_index = 0,
  "CREATE INDEX idx_user_role ON tb_user(role)",
  "DO 0"
);
PREPARE add_role_index_stmt FROM @add_role_index_sql;
EXECUTE add_role_index_stmt;
DEALLOCATE PREPARE add_role_index_stmt;

UPDATE tb_user SET role = 'ADMIN' WHERE username = 'admin';
UPDATE tb_user
SET role = 'SELLER'
WHERE username IN ('lisi', 'sunqi', 'xiaogang', 'xiaohong', 'xiaomei', 'xiaoming', 'zhouba');
UPDATE tb_user
SET role = 'BUYER'
WHERE username <> 'admin'
  AND username NOT IN ('lisi', 'sunqi', 'xiaogang', 'xiaohong', 'xiaomei', 'xiaoming', 'zhouba');
