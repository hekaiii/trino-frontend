# UnidataX 平台日志配置说明

## 概述

UnidataX 平台采用分类日志管理，将后端和前端日志分别存储，支持按日期自动归档和30天自动清理。

## 日志结构

```
logs/
├── backend/                    # 后端日志目录
│   ├── backend.log            # 后端应用日志（当前）
│   ├── backend.2025-07-31.0.gz # 后端应用日志（归档）
│   ├── backend-error.log      # 后端错误日志（当前）
│   ├── backend-error.2025-07-31.0.gz # 后端错误日志（归档）
│   ├── access.log             # 访问日志（当前）
│   └── access.2025-07-31.0.gz # 访问日志（归档）
└── frontend/                   # 前端日志目录
    └── frontend.log           # 前端服务日志
```

## 后端日志配置

### 日志文件说明

1. **backend.log** - 后端应用主日志
   - 记录所有应用级别的日志信息
   - 按日期自动归档：`backend.YYYY-MM-DD.N.gz`
   - 单个文件最大50MB
   - 保留30天

2. **backend-error.log** - 后端错误日志
   - 仅记录ERROR级别的日志
   - 按日期自动归档：`backend-error.YYYY-MM-DD.N.gz`
   - 单个文件最大50MB
   - 保留30天

3. **access.log** - 访问日志
   - 记录HTTP请求访问信息
   - 按日期自动归档：`access.YYYY-MM-DD.N.gz`
   - 单个文件最大100MB
   - 保留30天

### 配置位置

- **Logback配置**: `src/main/resources/logback-spring.xml`
- **应用配置**: `src/main/resources/application.yml`

### 日志级别

- **开发环境**: DEBUG
- **生产环境**: INFO

## 前端日志配置

### 浏览器端日志

前端使用自定义日志工具类 (`src/utils/logger.js`)，支持：

1. **localStorage存储** - 按日期分类存储
2. **自动清理** - 30天自动清理
3. **日志导出** - 支持导出为文本文件
4. **日志级别** - DEBUG/INFO/WARN/ERROR

### 服务端日志

前端HTTP服务器日志存储在 `logs/frontend/frontend.log`

## 日志管理命令

### 查看日志

```bash
# 查看后端日志
tail -f logs/backend/backend.log
tail -f logs/backend/backend-error.log
tail -f logs/backend/access.log

# 查看前端日志
tail -f logs/frontend/frontend.log
```

### 日志清理

```bash
# 查看日志统计
./bin/clean-logs.sh -s

# 清理所有30天前的日志
./bin/clean-logs.sh

# 仅清理后端日志
./bin/clean-logs.sh -b

# 仅清理前端日志
./bin/clean-logs.sh -f

# 强制清理所有日志（危险操作）
./bin/clean-logs.sh -F
```

### 日志导出

```bash
# 导出后端日志
find logs/backend -name "*.log" -exec cp {} ./ \;

# 前端日志导出（在浏览器控制台）
logger.exportLogs()  // 导出所有日志
logger.exportLogs('2025-07-31')  // 导出指定日期日志
```

## 日志轮转策略

### 后端日志轮转

1. **按大小轮转**: 单个文件达到最大大小时自动轮转
2. **按时间轮转**: 每天0点自动轮转
3. **压缩归档**: 轮转后的文件自动压缩为.gz格式
4. **自动清理**: 30天前的归档文件自动删除

### 前端日志轮转

1. **localStorage限制**: 每个日期最多1000条日志
2. **自动清理**: 30天自动清理所有日志
3. **内存管理**: 超出限制时自动删除最旧的日志

## 监控和维护

### 日志监控

```bash
# 查看日志文件大小
du -sh logs/backend/
du -sh logs/frontend/

# 查看日志文件数量
find logs/backend -type f | wc -l
find logs/frontend -type f | wc -l
```

### 性能优化

1. **日志级别调整**: 生产环境使用INFO级别
2. **定期清理**: 建议每周执行一次日志清理
3. **磁盘监控**: 定期检查日志目录磁盘使用情况

### 故障排除

1. **日志文件过大**: 检查是否有异常大量日志输出
2. **磁盘空间不足**: 执行日志清理命令
3. **日志丢失**: 检查logback配置和文件权限

## 最佳实践

1. **合理设置日志级别**: 开发环境DEBUG，生产环境INFO
2. **定期清理日志**: 建议设置定时任务每周清理
3. **监控日志大小**: 定期检查日志文件大小和数量
4. **备份重要日志**: 重要操作前备份相关日志
5. **日志分析**: 定期分析错误日志，及时发现问题

## 配置示例

### 自定义日志级别

在 `application.yml` 中：

```yaml
logging:
  level:
    com.queryu: INFO
    org.springframework.web: WARN
    com.queryu.trino.mapper: DEBUG
```

### 自定义日志路径

在启动脚本中设置环境变量：

```bash
export LOG_PATH=/var/log/unidatax
./bin/start.sh
```

### 定时清理任务

添加到crontab：

```bash
# 每周日凌晨2点清理日志
0 2 * * 0 /path/to/unidatax/bin/clean-logs.sh
``` 