# UnidataX 平台 Linux 部署指南

## 环境要求

### 必需软件
- **Java**: 8 或更高版本
- **Maven**: 3.6 或更高版本  
- **Node.js**: 14 或更高版本
- **npm**: 随Node.js安装

### 可选软件
- **MySQL**: 8.0+ (用于数据存储)
- **Redis**: 6.0+ (用于缓存)

## 快速启动

### 1. 一键启动（推荐）
```bash
chmod +x *.sh
./start-all.sh
```

### 2. 分别启动
```bash
# 启动后端
./start-backend.sh

# 启动前端
./start-frontend.sh
```

### 3. 停止服务
```bash
./stop-all.sh
```

## 服务地址

- **前端应用**: http://localhost:13000
- **后端API**: http://localhost:18082
- **健康检查**: http://localhost:18082/actuator/health

## 日志查看

```bash
# 查看后端日志
tail -f logs/backend.log

# 查看前端日志  
tail -f logs/frontend.log
```

## 配置文件

### 后端配置
主要配置文件：`unidatax-backend/src/main/resources/application.yml`

需要修改的配置：
- 数据库连接信息
- Redis连接信息
- 外部API地址

### 前端配置
代理配置：`unidatax-web/src/setupProxy.js`

## 常见问题

### 1. 端口被占用
```bash
# 查看端口占用
netstat -tlnp | grep :18082
netstat -tlnp | grep :13000

# 杀死占用进程
kill -9 <PID>
```

### 2. 权限问题
```bash
# 给脚本执行权限
chmod +x *.sh

# 如果遇到权限问题
sudo chown -R $USER:$USER .
```

### 3. 内存不足
```bash
# 增加Java堆内存
export MAVEN_OPTS="-Xmx2g -Xms1g"
```

### 4. 数据库连接失败
检查 `application.yml` 中的数据库配置：
- 数据库地址
- 用户名密码
- 数据库名称

## 生产环境部署

### 1. 使用systemd服务（推荐）

创建服务文件 `/etc/systemd/system/unidatax-backend.service`:
```ini
[Unit]
Description=UnidataX Backend Service
After=network.target

[Service]
Type=simple
User=unidatax
WorkingDirectory=/opt/unidatax/unidatax-backend
ExecStart=/usr/bin/mvn spring-boot:run
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

创建服务文件 `/etc/systemd/system/unidatax-frontend.service`:
```ini
[Unit]
Description=UnidataX Frontend Service
After=network.target

[Service]
Type=simple
User=unidatax
WorkingDirectory=/opt/unidatax/unidatax-web
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

启动服务：
```bash
sudo systemctl daemon-reload
sudo systemctl enable unidatax-backend
sudo systemctl enable unidatax-frontend
sudo systemctl start unidatax-backend
sudo systemctl start unidatax-frontend
```

### 2. 使用Docker部署

创建 `docker-compose.yml`:
```yaml
version: '3.8'
services:
  backend:
    build: ./unidatax-backend
    ports:
      - "18082:18082"
    environment:
      - SPRING_PROFILES_ACTIVE=prod
    depends_on:
      - mysql
      - redis

  frontend:
    build: ./unidatax-web
    ports:
      - "13000:13000"
    depends_on:
      - backend

  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: your_password
      MYSQL_DATABASE: trino_frontend_dev
    ports:
      - "3306:3306"

  redis:
    image: redis:6.0
    ports:
      - "6379:6379"
```

启动：
```bash
docker-compose up -d
```

## 监控和维护

### 1. 进程监控
```bash
# 查看进程状态
ps aux | grep -E "(java|node)"

# 查看端口监听
netstat -tlnp | grep -E "(18082|13000)"
```

### 2. 日志轮转
配置logrotate：
```bash
sudo vim /etc/logrotate.d/unidatax
```

内容：
```
/opt/unidatax/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 unidatax unidatax
    postrotate
        systemctl reload unidatax-backend
        systemctl reload unidatax-frontend
    endscript
}
```

### 3. 备份
```bash
# 备份数据库
mysqldump -u root -p trino_frontend_dev > backup_$(date +%Y%m%d).sql

# 备份配置文件
tar -czf config_backup_$(date +%Y%m%d).tar.gz unidatax-backend/src/main/resources/
``` 