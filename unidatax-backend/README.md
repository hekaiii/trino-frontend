# UnidataX Backend

UnidataX 平台后端服务，基于 Spring Boot 构建。

## 快速开始

### 启动服务
```bash
# 启动所有服务
./bin/start.sh

# 停止所有服务
./bin/stop.sh

# 查看服务状态
./bin/status.sh

# 重启服务
./bin/restart.sh
```

### 服务地址
- **后端API**: http://localhost:18082
- **健康检查**: http://localhost:18082/actuator/health
- **前端应用**: http://localhost:13000

## 开发环境

### 环境要求
- Java 8+
- Maven 3.6+
- MySQL 8.0+
- Redis 6.0+

### 本地开发
```bash
# 编译项目
mvn clean compile

# 运行测试
mvn test

# 启动开发服务器
mvn spring-boot:run
```

## 部署

### 打包
```bash
# 打包为可执行JAR
mvn clean package

# 打包为分发包（包含前端）
mvn clean package assembly:single
```

### 生产部署
```bash
# 解压分发包
tar -xzf target/unidatax-backend-distribution.zip

# 进入目录
cd unidatax-1.0.0

# 启动服务
./bin/start.sh
```

## 配置

主要配置文件：`config/application.yml`

### 数据库配置
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/trino_frontend_dev
    username: root
    password: your_password
```

### Redis配置
```yaml
spring:
  redis:
    host: localhost
    port: 6379
```

## 监控

### 健康检查
```bash
curl http://localhost:18082/actuator/health
```

### 日志查看
```bash
# 后端日志
tail -f logs/backend/backend.log
tail -f logs/backend/backend-error.log
tail -f logs/backend/access.log

# 前端日志
tail -f logs/frontend/frontend.log

# 查看日志统计
./bin/clean-logs.sh -s

# 清理30天前的日志
./bin/clean-logs.sh
```

## 故障排除

### 常见问题

1. **端口被占用**
   ```bash
   # 查看端口占用
   netstat -tlnp | grep :18082
   
   # 杀死占用进程
   kill -9 <PID>
   ```

2. **数据库连接失败**
   - 检查数据库服务是否启动
   - 验证数据库连接配置
   - 确认数据库用户权限

3. **内存不足**
   ```bash
   # 增加Java堆内存
   export JAVA_OPTS="-Xmx2g -Xms1g"
   ```

## 许可证

MIT License 