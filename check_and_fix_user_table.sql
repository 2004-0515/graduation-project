-- 检查当前tb_user表结构
DESCRIBE tb_user;

-- 对比User实体类，我们需要确保以下列存在：
-- id (主键，自增)
-- username (用户名)
-- password (密码哈希)
-- email (邮箱)
-- phone (手机号)
-- avatar (头像)
-- nickname (昵称)
-- bio (个性签名)
-- points (积分)
-- growth_value (成长值)
-- member_days (会员天数)
-- created_time (创建时间)
-- updated_time (更新时间)

-- 添加缺失的列（如果不存在）
ALTER TABLE tb_user
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS avatar VARCHAR(200),
ADD COLUMN IF NOT EXISTS nickname VARCHAR(50),
ADD COLUMN IF NOT EXISTS bio VARCHAR(200),
ADD COLUMN IF NOT EXISTS points INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS growth_value INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS member_days INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS created_time DATETIME DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- 再次检查修复后的表结构
DESCRIBE tb_user;