# 购物商场系统部署指南

## 目录

1. [环境要求](#环境要求)
2. [快速开始](#快速开始)
3. [详细部署](#详细部署)
4. [配置说明](#配置说明)
5. [监控和维护](#监控和维护)
6. [故障排除](#故障排除)

## 环境要求

### 系统要求
- **操作系统**: Linux/Windows/macOS
- **内存**: 至少2GB可用内存
- **磁盘空间**: 至少5GB可用空间

### 软件依赖
- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **Git**: 2.0+

### 网络要求
- **端口**: 80 (前端), 8080 (后端API), 3306 (MySQL), 6379 (Redis)
- **域名**: 可选，用于生产环境

## 快速开始

### 使用Docker Compose（推荐）

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd shopping-mall
   ```

2. **配置环境变量**
   ```bash
   cp env.example .env
   # 编辑 .env 文件，修改数据库密码等敏感信息
   ```

3. **启动服务**
   ```bash
   docker-compose up -d
   ```

4. **验证部署**
   ```bash
   # 检查服务状态
   docker-compose ps

   # 查看日志
   docker-compose logs -f

   # 访问应用
   open http://localhost
   ```

### 手动部署

#### 后端部署

1. **配置数据库**
   ```bash
   # 创建数据库
   mysql -u root -p
   CREATE DATABASE shopping_mall CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

2. **编译后端**
   ```bash
   cd backend
   mvn clean package -DskipTests
   ```

3. **运行后端**
   ```bash
   java -jar target/*.jar
   ```

#### 前端部署

1. **构建前端**
   ```bash
   cd frontend
   npm install
   npm run build
   ```

2. **部署静态文件**
   ```bash
   # 使用nginx或其他web服务器提供静态文件服务
   cp -r dist/* /var/www/html/
   ```

## 详细部署

### Docker部署

#### 1. 环境变量配置

创建 `.env` 文件：

```bash
# 数据库配置
DB_HOST=mysql
DB_PORT=3306
DB_NAME=shopping_mall
DB_USERNAME=shopping_user
DB_PASSWORD=your_secure_password
DB_ROOT_PASSWORD=your_root_password

# Redis配置
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# JWT配置
JWT_SECRET=your-256-bit-secret-key-here-change-in-production
JWT_EXPIRATION=86400000

# CORS配置（生产环境指定具体域名）
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Spring配置
SPRING_PROFILES_ACTIVE=docker
JPA_DDL_AUTO=update
JPA_SHOW_SQL=false
```

#### 2. Docker Compose配置

`docker-compose.yml` 已包含完整的服务配置：

- **mysql**: MySQL 8.0 数据库
- **redis**: Redis 7 缓存服务
- **backend**: Spring Boot 后端服务
- **frontend**: Vue.js 前端服务

#### 3. 启动顺序

服务会按照依赖关系自动启动：
1. MySQL 和 Redis 先启动
2. 后端等待数据库就绪后启动
3. 前端最后启动

### 生产环境部署

#### 使用反向代理

推荐使用 Nginx 作为反向代理：

```nginx
# /etc/nginx/sites-available/shopping-mall
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # SSL配置（生产环境必须）
    listen 443 ssl http2;
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header X-Content-Security-Policy "default-src 'self'";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";

    # 前端静态文件
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API代理
    location /api/ {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### SSL证书配置

使用 Let's Encrypt 获取免费SSL证书：

```bash
# 安装certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# 设置自动续期
sudo crontab -e
# 添加：0 12 * * * /usr/bin/certbot renew --quiet
```

## 配置说明

### 后端配置

#### 核心配置

```properties
# 服务器配置
server.port=8080
server.servlet.context-path=/api

# 数据库配置
spring.datasource.url=jdbc:mysql://localhost:3306/shopping_mall
spring.datasource.username=your_username
spring.datasource.password=your_password

# Redis配置
spring.data.redis.host=localhost
spring.data.redis.port=6379
spring.data.redis.password=your_redis_password

# JWT配置
jwt.secret=your-256-bit-secret-key
jwt.expiration=86400000

# 文件上传配置
spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.max-request-size=10MB
```

#### 环境特定配置

- **development**: 开发环境配置
- **production**: 生产环境配置
- **docker**: Docker环境配置

### 前端配置

#### 环境变量

创建 `.env` 文件：

```bash
# API基础URL
VITE_API_BASE_URL=http://localhost:8080/api

# 应用配置
VITE_APP_TITLE=购物商场
VITE_APP_VERSION=1.0.0
```

#### 构建配置

`vite.config.ts` 包含：

- 路径别名配置 (`@` -> `src`)
- 代理配置（开发环境）
- 构建优化配置

## 监控和维护

### 健康检查

#### 应用健康检查

```bash
# 检查后端健康状态
curl http://localhost:8080/api/actuator/health

# 检查前端是否可访问
curl -I http://localhost/
```

#### 数据库监控

```sql
-- 检查连接数
SHOW PROCESSLIST;

-- 检查表状态
SHOW TABLE STATUS;

-- 检查慢查询
SELECT * FROM mysql.slow_log WHERE start_time > DATE_SUB(NOW(), INTERVAL 1 DAY);
```

### 日志管理

#### 查看日志

```bash
# Docker环境
docker-compose logs -f backend
docker-compose logs -f frontend

# 系统日志
tail -f /var/log/nginx/error.log
tail -f /var/log/mysql/error.log
```

#### 日志轮转

配置logrotate：

```bash
# /etc/logrotate.d/shopping-mall
/var/log/shopping-mall/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        systemctl reload shopping-mall
    endscript
}
```

### 备份策略

#### 数据库备份

```bash
# 每日备份脚本
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u root -p shopping_mall > /backup/shopping_mall_$DATE.sql

# 保留7天的备份
find /backup -name "shopping_mall_*.sql" -mtime +7 -delete
```

#### 文件备份

```bash
# 备份用户上传的文件
tar -czf /backup/uploads_$DATE.tar.gz /app/uploads/

# 备份配置文件
cp /app/application.properties /backup/config_$DATE.properties
```

### 性能监控

#### JVM监控

```bash
# 查看JVM内存使用
jstat -gcutil <pid> 1000

# 查看线程状态
jstack <pid>

# 内存dump
jmap -dump:live,format=b,file=heap.bin <pid>
```

#### 系统监控

```bash
# CPU使用率
top -p <pid>

# 内存使用
free -h

# 磁盘使用
df -h

# 网络连接
netstat -tlnp
```

## 故障排除

### 常见问题

#### 1. 数据库连接失败

**症状**: 应用启动失败，日志显示数据库连接错误

**解决**:
```bash
# 检查MySQL是否运行
docker-compose ps mysql

# 检查数据库是否存在
docker-compose exec mysql mysql -u root -p -e "SHOW DATABASES;"

# 检查连接配置
docker-compose logs mysql
```

#### 2. Redis连接失败

**症状**: 缓存功能异常

**解决**:
```bash
# 检查Redis是否运行
docker-compose ps redis

# 测试Redis连接
docker-compose exec redis redis-cli ping
```

#### 3. 前端构建失败

**症状**: npm run build 失败

**解决**:
```bash
# 清理node_modules
rm -rf node_modules package-lock.json

# 重新安装依赖
npm install

# 检查Node.js版本
node --version
npm --version
```

#### 4. 内存不足

**症状**: 应用运行缓慢或崩溃

**解决**:
```bash
# 增加Docker内存限制
docker-compose.yml 中添加：
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M
```

#### 5. 端口冲突

**症状**: 容器启动失败，端口被占用

**解决**:
```bash
# 检查端口占用
netstat -tlnp | grep :8080

# 修改端口映射
docker-compose.yml 中修改：
ports:
  - "8081:8080"  # 宿主机8081映射到容器8080
```

### 紧急恢复

#### 数据恢复

```bash
# 从备份恢复数据库
mysql -u root -p shopping_mall < /backup/shopping_mall_20240101.sql

# 验证数据完整性
mysql -u root -p shopping_mall -e "SELECT COUNT(*) FROM tb_user;"
```

#### 服务重启

```bash
# 重启所有服务
docker-compose down
docker-compose up -d

# 重启单个服务
docker-compose restart backend
```

### 联系支持

如果问题无法解决，请提供以下信息：

1. **错误日志**: `docker-compose logs`
2. **系统信息**: `uname -a`, `docker --version`
3. **配置文件**: 相关的配置文件内容（敏感信息已屏蔽）
4. **重现步骤**: 详细的操作步骤

## 更新部署

### 滚动更新

```bash
# 构建新镜像
docker-compose build --no-cache backend

# 滚动更新
docker-compose up -d backend

# 检查服务健康状态
curl http://localhost:8080/api/actuator/health
```

### 零停机部署

```bash
# 使用蓝绿部署或金丝雀部署策略
# 启动新版本服务
docker-compose up -d --scale backend=2 backend-new

# 逐步切换流量（需要负载均衡器）
# 停止旧版本服务
docker-compose up -d --scale backend=0 backend-old
```

---

最后更新时间：2024年12月
