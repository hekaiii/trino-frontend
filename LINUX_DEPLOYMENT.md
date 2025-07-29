# Trino Frontend Linux 部署指南

## 系统要求

### 基础环境
- **操作系统**: CentOS 7+, Ubuntu 18.04+, RHEL 7+, 或其他主流Linux发行版
- **CPU**: 2核心以上
- **内存**: 2GB以上可用内存
- **磁盘**: 5GB以上可用空间
- **网络**: 能够访问MySQL数据库

### 软件依赖
```bash
# Java 8 或更高版本
java -version

# MySQL 5.7 或更高版本
mysql --version

# 可选: unzip (用于解压分发包)
unzip -v
```

## 安装步骤

### 1. 创建应用用户和目录
```bash
# 创建专用用户 (推荐)
sudo useradd -m -s /bin/bash trino
sudo passwd trino

# 创建应用目录
sudo mkdir -p /opt/trino-frontend
sudo chown trino:trino /opt/trino-frontend

# 切换到应用用户
su - trino
```

### 2. 安装Java环境
```bash
# CentOS/RHEL
sudo yum install -y java-1.8.0-openjdk java-1.8.0-openjdk-devel

# Ubuntu/Debian  
sudo apt update
sudo apt install -y openjdk-8-jdk

# 验证安装
java -version
javac -version

# 设置JAVA_HOME (可选，建议添加到 ~/.bashrc)
export JAVA_HOME=/usr/lib/jvm/java-1.8.0-openjdk
echo 'export JAVA_HOME=/usr/lib/jvm/java-1.8.0-openjdk' >> ~/.bashrc
```

### 3. 安装和配置MySQL
```bash
# CentOS/RHEL 7
sudo yum install -y mysql-server mysql
sudo systemctl start mysqld
sudo systemctl enable mysqld

# Ubuntu/Debian
sudo apt install -y mysql-server mysql-client
sudo systemctl start mysql
sudo systemctl enable mysql

# 安全配置
sudo mysql_secure_installation

# 创建数据库和用户
mysql -u root -p
```

```sql
-- 在MySQL命令行中执行
CREATE DATABASE trino_frontend_prod DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'trino_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON trino_frontend_prod.* TO 'trino_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 4. 部署应用
```bash
# 切换到应用用户
su - trino
cd /opt/trino-frontend

# 上传并解压分发包
# 方法1: 使用scp从本地上传
# scp trino-frontend-1.0.0.zip trino@your-server:/opt/trino-frontend/

# 方法2: 使用wget从远程下载
# wget http://your-server/trino-frontend-1.0.0.zip

# 解压
unzip trino-frontend-1.0.0.zip
cd trino-frontend-1.0.0

# 设置执行权限
chmod +x bin/trino-service.sh
```

### 5. 配置应用
```bash
# 编辑生产环境配置
vi config/application-prod.yml
```

修改以下配置项：
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/trino_frontend_prod?useUnicode=true&characterEncoding=utf8&zeroDateTimeBehavior=convertToNull&useSSL=false&serverTimezone=Asia/Shanghai&allowPublicKeyRetrieval=true
    username: trino_user
    password: your_secure_password

server:
  port: 8080

app:
  jwt:
    secret: your_jwt_secret_key_at_least_64_characters_long_for_production_environment
```

### 6. 初始化数据库
```bash
# 执行数据库脚本
mysql -u trino_user -p trino_frontend_prod < script/01_create_database.sql
mysql -u trino_user -p trino_frontend_prod < script/02_init_data.sql  
mysql -u trino_user -p trino_frontend_prod < script/03_indexes_and_optimization.sql

# 验证数据库初始化
mysql -u trino_user -p trino_frontend_prod -e "SHOW TABLES;"
```

### 7. 启动应用
```bash
# 启动服务
./bin/trino-service.sh start

# 查看状态
./bin/trino-service.sh status

# 查看日志
./bin/trino-service.sh logs
# 或者
tail -f logs/trino-frontend.log
```

### 8. 验证部署
```bash
# 检查端口是否监听
netstat -tlnp | grep :8080
# 或
ss -tlnp | grep :8080

# 测试API接口
curl -X GET http://localhost:8080/actuator/health

# 测试登录接口
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"QWRtaW5AMjAyNXwxNzU5MDQyMTU2MjU5fDkzbGVhMXQyZXNobGo=","rememberMe":false}'
```

## 防火墙配置

### CentOS/RHEL (firewalld)
```bash
# 开放应用端口
sudo firewall-cmd --permanent --add-port=8080/tcp
sudo firewall-cmd --reload

# 查看开放的端口
sudo firewall-cmd --list-ports
```

### Ubuntu (ufw)
```bash
# 开放应用端口
sudo ufw allow 8080/tcp
sudo ufw reload

# 查看防火墙状态
sudo ufw status
```

## 系统服务配置 (可选)

### 创建systemd服务
```bash
# 创建服务文件
sudo vi /etc/systemd/system/trino-frontend.service
```

```ini
[Unit]
Description=Trino Frontend Application
After=network.target mysql.service

[Service]
Type=forking
User=trino
Group=trino
WorkingDirectory=/opt/trino-frontend/trino-frontend-1.0.0
ExecStart=/opt/trino-frontend/trino-frontend-1.0.0/bin/trino-service.sh start
ExecStop=/opt/trino-frontend/trino-frontend-1.0.0/bin/trino-service.sh stop
ExecReload=/opt/trino-frontend/trino-frontend-1.0.0/bin/trino-service.sh restart
PIDFile=/opt/trino-frontend/trino-frontend-1.0.0/trino-frontend.pid
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# 重载systemd配置
sudo systemctl daemon-reload

# 启用服务
sudo systemctl enable trino-frontend

# 启动服务
sudo systemctl start trino-frontend

# 查看状态
sudo systemctl status trino-frontend
```

## 日志管理

### 日志文件位置
```bash
# 主日志文件
tail -f /opt/trino-frontend/trino-frontend-1.0.0/logs/trino-frontend.log

# 错误日志
tail -f /opt/trino-frontend/trino-frontend-1.0.0/logs/trino-frontend-error.log

# 访问日志
tail -f /opt/trino-frontend/trino-frontend-1.0.0/logs/trino-frontend-access.log
```

### 日志轮转配置
```bash
# 创建logrotate配置
sudo vi /etc/logrotate.d/trino-frontend
```

```
/opt/trino-frontend/trino-frontend-1.0.0/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    copytruncate
    su trino trino
}
```

## 性能优化

### JVM参数调优
```bash
# 编辑启动脚本
vi bin/trino-service.sh

# 修改JAVA_OPTS参数
JAVA_OPTS="-Xms1024m -Xmx2048m -server -XX:+UseG1GC -XX:MaxGCPauseMillis=200 -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=logs/ -Djava.awt.headless=true"
```

### 系统参数优化
```bash
# 增加文件描述符限制
echo "trino soft nofile 65536" | sudo tee -a /etc/security/limits.conf
echo "trino hard nofile 65536" | sudo tee -a /etc/security/limits.conf

# 优化网络参数
echo "net.core.somaxconn = 1024" | sudo tee -a /etc/sysctl.conf
echo "net.ipv4.tcp_max_syn_backlog = 1024" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

## 监控配置

### 使用Prometheus监控
```bash
# 应用已内置Prometheus端点
curl http://localhost:8080/actuator/prometheus

# 配置Prometheus收集指标
# 在prometheus.yml中添加：
```

```yaml
scrape_configs:
  - job_name: 'trino-frontend'
    static_configs:
      - targets: ['localhost:8080']
    metrics_path: '/actuator/prometheus'
    scrape_interval: 15s
```

## 反向代理配置 (可选)

### Nginx配置
```bash
# 安装Nginx
sudo yum install -y nginx  # CentOS/RHEL
# 或
sudo apt install -y nginx  # Ubuntu/Debian

# 配置虚拟主机
sudo vi /etc/nginx/conf.d/trino-frontend.conf
```

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 支持WebSocket (如果需要)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
    
    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        proxy_pass http://127.0.0.1:8080;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
# 测试配置
sudo nginx -t

# 启动Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

## 故障排除

### 常见问题及解决方案

1. **端口被占用**
```bash
# 查看端口占用
netstat -tlnp | grep :8080
# 或
lsof -i :8080

# 杀死占用进程
sudo kill -9 <PID>
```

2. **Java未找到**
```bash
# 检查Java安装
which java
java -version

# 设置JAVA_HOME
export JAVA_HOME=$(readlink -f /usr/bin/java | sed "s:bin/java::")
```

3. **数据库连接失败**
```bash
# 测试数据库连接
mysql -u trino_user -p -h localhost trino_frontend_prod

# 检查MySQL服务状态
sudo systemctl status mysql
# 或
sudo systemctl status mysqld
```

4. **权限问题**
```bash
# 检查文件权限
ls -la /opt/trino-frontend/
sudo chown -R trino:trino /opt/trino-frontend/

# 检查执行权限
chmod +x bin/trino-service.sh
```

5. **内存不足**
```bash
# 查看内存使用情况
free -h
top -p $(pgrep -f trino-backend)

# 调整JVM内存参数
# 编辑 bin/trino-service.sh 中的 JAVA_OPTS
```

## 安全建议

1. **数据库安全**
   - 使用强密码
   - 限制数据库用户权限
   - 定期备份数据库

2. **应用安全**
   - 修改默认管理员密码
   - 使用HTTPS (配置SSL证书)
   - 定期更新依赖包

3. **系统安全**
   - 及时更新系统补丁
   - 配置防火墙
   - 使用非root用户运行应用

4. **网络安全**
   - 限制不必要的端口访问
   - 使用VPN或内网访问
   - 配置访问控制列表

## 备份与恢复

### 数据库备份
```bash
# 创建备份脚本
vi /opt/trino-frontend/backup.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/opt/trino-frontend/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="trino_frontend_prod"
DB_USER="trino_user"

mkdir -p $BACKUP_DIR

# 数据库备份
mysqldump -u $DB_USER -p $DB_NAME > $BACKUP_DIR/db_backup_$DATE.sql

# 配置文件备份
tar -czf $BACKUP_DIR/config_backup_$DATE.tar.gz -C /opt/trino-frontend/trino-frontend-1.0.0 config/

# 清理旧备份 (保留30天)
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "Backup completed: $DATE"
```

```bash
# 设置执行权限
chmod +x /opt/trino-frontend/backup.sh

# 设置定时备份 (每天凌晨2点)
crontab -e
# 添加以下行：
# 0 2 * * * /opt/trino-frontend/backup.sh >> /opt/trino-frontend/backup.log 2>&1
```

---

按照以上步骤，您的Trino Frontend应用就可以在Linux环境中稳定运行了。记得根据实际环境调整配置参数。