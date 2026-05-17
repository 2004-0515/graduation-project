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

CREATE TABLE IF NOT EXISTS tb_search_history (
  id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '搜索历史ID',
  keyword VARCHAR(100) NOT NULL COMMENT '搜索关键词',
  user_id BIGINT NOT NULL COMMENT '用户ID',
  search_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '搜索时间',
  created_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  UNIQUE KEY idx_user_keyword (user_id, keyword),
  INDEX idx_user_time (user_id, search_time DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='搜索历史表';

CREATE TABLE IF NOT EXISTS tb_search_stats (
  id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '搜索统计ID',
  keyword VARCHAR(100) NOT NULL COMMENT '搜索关键词',
  search_count INT NOT NULL DEFAULT 0 COMMENT '搜索次数',
  search_date DATE NOT NULL COMMENT '统计日期',
  created_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  UNIQUE KEY idx_keyword_date (keyword, search_date),
  INDEX idx_date_count (search_date, search_count DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='搜索统计表';
