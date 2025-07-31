# Trino Frontend Database Scripts

这个目录包含了Trino前端应用的数据库初始化和管理脚本。

## 脚本说明

### 1. `01_create_database.sql` - 数据库结构创建
**用途**: 创建数据库和所有必需的表结构
**包含内容**:
- 数据库创建 (`trino_frontend_dev`)
- 用户表 (`t_user`) - 存储用户信息和认证数据
- 查询任务表 (`t_query_task`) - 存储SQL查询任务
- 任务执行历史表 (`t_task_execution_history`) - 审计和历史记录
- 基础索引和外键约束

**执行顺序**: 第一个执行

### 2. `02_init_data.sql` - 初始数据插入
**用途**: 插入系统初始数据和测试数据
**包含内容**:
- 默认用户账号（admin, test, developer）
- 示例查询任务
- 模拟执行历史数据
- 数据验证查询

**测试账号信息（强密码）**:
```
管理员: admin / Admin@2025 (ADMIN角色)
测试用户: test / Test@2025 (USER角色)  
开发用户: developer / Dev@2025 (USER角色)
```

**密码安全特性**:
- ✅ 长度9位，满足最小8位要求
- ✅ 包含大写字母、小写字母、数字、特殊字符(@)  
- ✅ 避免常见弱密码模式
- ✅ 不包含用户名信息
- ✅ 通过后端密码强度校验

**执行顺序**: 第二个执行

### 3. `03_indexes_and_optimization.sql` - 性能优化
**用途**: 数据库性能优化和监控
**包含内容**:
- 复合索引优化
- 常用查询视图
- 数据清理存储过程
- 系统日志表
- 性能监控查询

**执行顺序**: 第三个执行

## 快速开始

### 方式一：使用MySQL命令行
```bash
# 1. 连接到MySQL
mysql -u admin -p -h localhost -P 3306

# 2. 按顺序执行脚本
source /path/to/01_create_database.sql
source /path/to/02_init_data.sql
source /path/to/03_indexes_and_optimization.sql
```

### 方式二：使用MySQL Workbench
1. 打开MySQL Workbench
2. 连接到数据库服务器
3. 依次打开并执行三个SQL文件

### 方式三：批量执行脚本
```bash
#!/bin/bash
MYSQL_USER="admin"
MYSQL_PASSWORD="hekaig24"
MYSQL_HOST="localhost"
MYSQL_PORT="3306"

# 执行所有脚本
for script in 01_create_database.sql 02_init_data.sql 03_indexes_and_optimization.sql; do
    echo "Executing $script..."
    mysql -u${MYSQL_USER} -p${MYSQL_PASSWORD} -h${MYSQL_HOST} -P${MYSQL_PORT} < $script
    if [ $? -eq 0 ]; then
        echo "$script executed successfully"
    else
        echo "Error executing $script"
        exit 1
    fi
done
echo "All scripts executed successfully!"
```

## 数据库配置

### 应用配置文件更新
执行脚本后，需要确保后端应用的数据库配置正确：

```yaml
# application.yml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/trino_frontend_dev?useUnicode=true&characterEncoding=utf8mb4&useSSL=false&serverTimezone=Asia/Shanghai
    username: admin
    password: hekaig24
    driver-class-name: com.mysql.cj.jdbc.Driver
```

## 表结构说明

### t_user (用户表)
- 存储用户基本信息、认证数据
- 支持角色权限管理 (USER/ADMIN)
- 记录登录历史信息

### t_query_task (查询任务表)  
- 存储用户创建的SQL查询任务
- 支持多种状态管理 (DRAFT/SAVED/RUNNING/COMPLETED/FAILED)
- 记录执行结果和性能指标
- 支持收藏和标签功能

### t_task_execution_history (执行历史表)
- 记录所有任务执行的详细历史
- 用于审计和性能分析
- 支持按时间范围清理历史数据

## 维护操作

### 清理历史数据
```sql
-- 清理90天前的执行历史
CALL sp_cleanup_execution_history(90);
```

### 性能监控
```sql
-- 查看表大小
SELECT table_name, ROUND(((data_length + index_length) / 1024 / 1024), 2) AS "Size(MB)"
FROM information_schema.tables 
WHERE table_schema = 'trino_frontend_dev'
ORDER BY (data_length + index_length) DESC;

-- 查看慢查询
SELECT * FROM v_task_performance 
WHERE performance_level = '缓慢(>30s)'
ORDER BY execution_duration DESC;
```

### 备份和恢复
```bash
# 备份数据库
mysqldump -u admin -p --single-transaction --routines --triggers trino_frontend_dev > backup_$(date +%Y%m%d_%H%M%S).sql

# 恢复数据库
mysql -u admin -p trino_frontend_dev < backup_file.sql
```

## 注意事项

1. **生产环境**: 
   - 修改默认密码
   - 调整数据库参数
   - 设置定期备份

2. **权限安全**:
   - 创建专用数据库用户
   - 限制数据库连接权限
   - 启用SSL连接

3. **性能优化**:
   - 定期清理历史数据
   - 监控慢查询日志
   - 根据使用情况调整索引

4. **扩展性**:
   - 考虑分库分表策略
   - 设置读写分离
   - 配置连接池参数

## 故障排除

### 常见问题

1. **编码问题**: 确保数据库、表、字段都使用utf8mb4编码
2. **时区问题**: 在连接字符串中指定serverTimezone参数
3. **连接超时**: 调整wait_timeout和interactive_timeout参数
4. **内存不足**: 适当调整innodb_buffer_pool_size参数

### 联系支持
如有问题，请检查：
- MySQL服务状态
- 数据库连接参数
- 用户权限设置
- 错误日志信息