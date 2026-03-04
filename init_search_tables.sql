-- =====================================================
-- 搜索功能增强 - 数据库表初始化脚本
-- 请在 Navicat 中执行此脚本（UTF-8 编码）
-- =====================================================

-- 1. 创建搜索历史表
CREATE TABLE IF NOT EXISTS tb_search_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    keyword VARCHAR(100) NOT NULL COMMENT '搜索关键词',
    search_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '搜索时间',
    created_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    -- 外键约束
    CONSTRAINT fk_search_history_user FOREIGN KEY (user_id) REFERENCES tb_user(id) ON DELETE CASCADE,
    
    -- 索引：按用户ID和搜索时间查询
    INDEX idx_user_time (user_id, search_time DESC),
    -- 唯一索引：同一用户同一关键词只保留一条（用于去重）
    UNIQUE INDEX idx_user_keyword (user_id, keyword)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='搜索历史表';

-- 2. 创建搜索统计表
CREATE TABLE IF NOT EXISTS tb_search_stats (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    keyword VARCHAR(100) NOT NULL COMMENT '搜索关键词',
    search_count INT NOT NULL DEFAULT 1 COMMENT '搜索次数',
    search_date DATE NOT NULL COMMENT '统计日期',
    created_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    -- 唯一索引：同一关键词同一日期只有一条记录
    UNIQUE INDEX idx_keyword_date (keyword, search_date),
    -- 索引：按日期和搜索次数查询热门词
    INDEX idx_date_count (search_date, search_count DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='搜索统计表';

-- 3. 插入一些初始热门搜索词数据（可选）
INSERT INTO tb_search_stats (keyword, search_count, search_date, created_time, updated_time) VALUES
('手机', 150, CURDATE(), NOW(), NOW()),
('笔记本电脑', 120, CURDATE(), NOW(), NOW()),
('耳机', 98, CURDATE(), NOW(), NOW()),
('键盘', 85, CURDATE(), NOW(), NOW()),
('显示器', 72, CURDATE(), NOW(), NOW()),
('鼠标', 68, CURDATE(), NOW(), NOW()),
('平板', 55, CURDATE(), NOW(), NOW()),
('相机', 42, CURDATE(), NOW(), NOW()),
('手表', 38, CURDATE(), NOW(), NOW()),
('音箱', 35, CURDATE(), NOW(), NOW())
ON DUPLICATE KEY UPDATE search_count = search_count;

-- 4. 验证表创建成功
SELECT 'tb_search_history' AS table_name, COUNT(*) AS record_count FROM tb_search_history
UNION ALL
SELECT 'tb_search_stats' AS table_name, COUNT(*) AS record_count FROM tb_search_stats;
