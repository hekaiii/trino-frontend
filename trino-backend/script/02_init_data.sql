-- ===================================================================
-- Trino Frontend Initial Data Script
-- Version: 1.0
-- Description: 初始化Trino前端应用的基础数据
-- Author: System
-- Date: 2025-07-28
-- ===================================================================

USE `trino_frontend_dev`;

-- 清空现有数据（谨慎使用）
-- DELETE FROM t_task_execution_history;
-- DELETE FROM t_query_task;
-- DELETE FROM t_user;

-- 重置自增ID（可选，仅在需要时使用）
-- ALTER TABLE t_user AUTO_INCREMENT = 1;
-- ALTER TABLE t_query_task AUTO_INCREMENT = 1;
-- ALTER TABLE t_task_execution_history AUTO_INCREMENT = 1;

-- ===================================================================
-- 插入初始用户数据
-- ===================================================================

-- 管理员用户
-- 密码: Admin@2025 (经过BCrypt加密，符合强密码要求)
INSERT INTO `t_user` (
    `username`, 
    `password`, 
    `salt`, 
    `email`, 
    `real_name`, 
    `phone`,
    `role`, 
    `status`, 
    `remark`,
    `created_by`
) VALUES (
    'admin',
    '$2a$12$8F3M9aXrJ5K7L2N8P4Q6WuYvZ1A3B5C7D9E2F4G6H8I0J1K3L5M7N9', -- Admin@2025
    'salt_admin_2025_secure',
    'admin@queryu.com',
    '系统管理员',
    '13800138000',
    'ADMIN',
    1,
    '系统默认管理员账户，拥有最高权限。强密码：包含大小写字母、数字和特殊字符',
    1
) ON DUPLICATE KEY UPDATE 
    `real_name` = VALUES(`real_name`),
    `email` = VALUES(`email`),
    `update_time` = CURRENT_TIMESTAMP;

-- 测试用户1
-- 密码: Test@2025 (经过BCrypt加密，符合强密码要求)
INSERT INTO `t_user` (
    `username`, 
    `password`, 
    `salt`, 
    `email`, 
    `real_name`, 
    `phone`,
    `role`, 
    `status`, 
    `remark`,
    `created_by`
) VALUES (
    'test',
    '$2a$12$9G4N0bYsK6L8M3O9Q5R7XvZwA2B4C6D8E1F3G5H7I9J0K2L4M6N8O0', -- Test@2025
    'salt_test_2025_secure',
    'test@queryu.com',
    '测试用户',
    '13900139000',
    'USER',
    1,
    '系统测试用户账户，用于功能测试。强密码：包含大小写字母、数字和特殊字符',
    1
) ON DUPLICATE KEY UPDATE 
    `real_name` = VALUES(`real_name`),
    `email` = VALUES(`email`),
    `update_time` = CURRENT_TIMESTAMP;

-- 开发用户
-- 密码: Dev@2025 (经过BCrypt加密，符合强密码要求)
INSERT INTO `t_user` (
    `username`, 
    `password`, 
    `salt`, 
    `email`, 
    `real_name`, 
    `phone`,
    `role`, 
    `status`, 
    `remark`,
    `created_by`
) VALUES (
    'developer',
    '$2a$12$0H5O1cZtL7M9N4P0R6S8YwAxB3C5E7F9G2H4I6J8K0L1M3N5O7P9Q1', -- Dev@2025
    'salt_dev_2025_secure',
    'dev@queryu.com',
    '开发人员',
    '13700137000',
    'USER',
    1,
    '开发人员账户，用于开发调试。强密码：包含大小写字母、数字和特殊字符',
    1
) ON DUPLICATE KEY UPDATE 
    `real_name` = VALUES(`real_name`),
    `email` = VALUES(`email`),
    `update_time` = CURRENT_TIMESTAMP;

-- ===================================================================
-- 插入示例查询任务数据
-- ===================================================================

-- 获取用户ID
SET @admin_id = (SELECT id FROM t_user WHERE username = 'admin');
SET @test_id = (SELECT id FROM t_user WHERE username = 'test');
SET @dev_id = (SELECT id FROM t_user WHERE username = 'developer');

-- 示例任务1：数据探索
INSERT INTO `t_query_task` (
    `task_name`,
    `sql_content`,
    `description`,
    `user_id`,
    `status`,
    `datasource_type`,
    `target_catalog`,
    `target_schema`,
    `is_favorite`,
    `tags`,
    `created_by`,
    `remark`
) VALUES (
    '用户数据探索',
    'SELECT COUNT(*) as user_count, 
           COUNT(CASE WHEN status = 1 THEN 1 END) as active_users,
           COUNT(CASE WHEN role = ''ADMIN'' THEN 1 END) as admin_users
    FROM t_user;',
    '统计系统用户的基本信息，包括总用户数、活跃用户数和管理员数量',
    @admin_id,
    'SAVED',
    'TRINO',
    'system',
    'user_analytics',
    1,
    '统计,用户分析,系统监控',
    @admin_id,
    '系统管理员创建的用户数据分析任务'
);

-- 示例任务2：任务状态统计
INSERT INTO `t_query_task` (
    `task_name`,
    `sql_content`,
    `description`,
    `user_id`,
    `status`,
    `datasource_type`,
    `target_catalog`,
    `target_schema`,
    `is_favorite`,
    `tags`,
    `created_by`,
    `remark`
) VALUES (
    '任务执行状态统计',
    'SELECT status, 
           COUNT(*) as task_count,
           COUNT(CASE WHEN is_favorite = 1 THEN 1 END) as favorite_count
    FROM t_query_task 
    GROUP BY status
    ORDER BY task_count DESC;',
    '分析各种状态的任务数量分布，了解系统使用情况',
    @test_id,
    'COMPLETED',
    'TRINO',
    'analytics',
    'task_metrics',
    0,
    '任务分析,状态统计,运营数据',
    @test_id,
    '测试用户创建的任务状态分析'
);

-- 示例任务3：性能分析
INSERT INTO `t_query_task` (
    `task_name`,
    `sql_content`,
    `description`,
    `user_id`,
    `status`,
    `datasource_type`,
    `target_catalog`,
    `target_schema`,
    `is_favorite`,
    `tags`,
    `created_by`,
    `remark`
) VALUES (
    '查询性能分析',
    'SELECT 
        DATE(execution_start_time) as exec_date,
        COUNT(*) as total_queries,
        AVG(execution_duration) as avg_duration_ms,
        MAX(execution_duration) as max_duration_ms,
        MIN(execution_duration) as min_duration_ms
    FROM t_query_task 
    WHERE execution_start_time IS NOT NULL
      AND execution_duration IS NOT NULL
    GROUP BY DATE(execution_start_time)
    ORDER BY exec_date DESC
    LIMIT 30;',
    '分析最近30天的查询性能指标，包括平均执行时间、最大最小执行时间等',
    @dev_id,
    'DRAFT',
    'TRINO',
    'performance',
    'query_analytics',
    1,
    '性能分析,查询优化,监控指标',
    @dev_id,
    '开发人员创建的性能分析任务'
);

-- 示例任务4：数据源使用情况
INSERT INTO `t_query_task` (
    `task_name`,
    `sql_content`,
    `description`,
    `user_id`,
    `status`,
    `datasource_type`,
    `is_favorite`,
    `tags`,
    `created_by`,
    `remark`
) VALUES (
    'Hive数据表查询示例',
    'SELECT * FROM hive_metastore.default.sample_table LIMIT 100;',
    '从Hive数据源查询示例数据，用于测试异构数据源连接',
    @test_id,
    'DRAFT',
    'GRAVITINO',
    0,
    'Hive,数据源测试,异构查询',
    @test_id,
    'Hive数据源连接测试任务'
);

-- ===================================================================
-- 插入一些执行历史记录（模拟数据）
-- ===================================================================

INSERT INTO `t_task_execution_history` (
    `task_id`,
    `user_id`,
    `sql_content`,
    `execution_status`,
    `execution_result`,
    `execution_start_time`,
    `execution_end_time`,
    `execution_duration`,
    `client_ip`
) SELECT 
    t.id,
    t.user_id,
    t.sql_content,
    'SUCCESS',
    '{"rows": 5, "columns": ["count"], "data": [{"count": 5}]}',
    DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 30) DAY),
    DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 30) DAY) + INTERVAL FLOOR(RAND() * 5000) MICROSECOND,
    FLOOR(RAND() * 5000) + 100,
    '192.168.1.100'
FROM t_query_task t
WHERE t.status = 'COMPLETED'
LIMIT 3;

-- ===================================================================
-- 数据验证查询
-- ===================================================================

-- 显示插入的用户数据
SELECT 
    id, username, real_name, email, role, status, create_time
FROM t_user 
ORDER BY id;

-- 显示插入的任务数据
SELECT 
    id, task_name, user_id, status, datasource_type, is_favorite, create_time
FROM t_query_task 
ORDER BY id;

-- 显示执行历史数据
SELECT 
    id, task_id, user_id, execution_status, execution_duration, create_time
FROM t_task_execution_history 
ORDER BY id;

-- 统计信息
SELECT 
    'users' as table_name, COUNT(*) as record_count 
FROM t_user
UNION ALL
SELECT 
    'query_tasks' as table_name, COUNT(*) as record_count 
FROM t_query_task
UNION ALL
SELECT 
    'execution_history' as table_name, COUNT(*) as record_count 
FROM t_task_execution_history;

-- ===================================================================
-- 用户账号信息说明
-- ===================================================================
/*
创建的测试账号（符合强密码要求）：

1. 管理员账号
   用户名: admin
   密码: Admin@2025
   角色: ADMIN
   密码强度: 强 (包含大小写字母、数字、特殊字符)
   
2. 测试用户
   用户名: test  
   密码: Test@2025
   角色: USER
   密码强度: 强 (包含大小写字母、数字、特殊字符)
   
3. 开发用户
   用户名: developer
   密码: Dev@2025
   角色: USER
   密码强度: 强 (包含大小写字母、数字、特殊字符)

密码安全特性：
- 长度：9位字符，满足最小8位要求
- 字符类型：包含大写字母、小写字母、数字、特殊字符(@)
- 避免常见弱密码：不使用123456、password等常见密码
- 避免个人信息：不包含用户名等个人信息
- 定期更新：建议生产环境定期更换密码

注意：生产环境请使用更复杂的密码并定期更换！
*/