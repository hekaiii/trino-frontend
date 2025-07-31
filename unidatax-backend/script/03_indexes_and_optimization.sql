-- ===================================================================
-- UnidataX Database Optimization Script
-- Version: 1.0
-- Description: 数据库性能优化，添加索引和配置优化
-- Author: System
-- Date: 2025-07-28
-- ===================================================================

USE `unidatax_dev`;

-- ===================================================================
-- 添加额外的复合索引以提升查询性能
-- ===================================================================

-- 用户表优化索引
-- 用于用户登录查询优化
ALTER TABLE `t_user` 
ADD INDEX `idx_username_status` (`username`, `status`);

-- 用于用户角色和状态查询
ALTER TABLE `t_user` 
ADD INDEX `idx_role_status` (`role`, `status`);

-- 用于按创建时间范围查询用户
ALTER TABLE `t_user` 
ADD INDEX `idx_status_create_time` (`status`, `create_time` DESC);

-- 查询任务表优化索引
-- 用于用户任务列表查询（最常用的查询模式）
ALTER TABLE `t_query_task` 
ADD INDEX `idx_user_status_update_time` (`user_id`, `status`, `update_time` DESC);

-- 用于收藏任务查询
ALTER TABLE `t_query_task` 
ADD INDEX `idx_user_favorite_time` (`user_id`, `is_favorite`, `update_time` DESC);

-- 用于按数据源类型查询
ALTER TABLE `t_query_task` 
ADD INDEX `idx_datasource_status` (`datasource_type`, `status`);

-- 用于执行时间范围查询（性能分析）
ALTER TABLE `t_query_task` 
ADD INDEX `idx_execution_time_duration` (`execution_start_time`, `execution_duration`);

-- 用于任务名称模糊搜索优化
ALTER TABLE `t_query_task` 
ADD FULLTEXT INDEX `ft_task_name_desc` (`task_name`, `description`);

-- 任务执行历史表优化索引
-- 用于用户执行历史查询
ALTER TABLE `t_task_execution_history` 
ADD INDEX `idx_user_exec_time` (`user_id`, `execution_start_time` DESC);

-- 用于按执行状态统计
ALTER TABLE `t_task_execution_history` 
ADD INDEX `idx_status_time` (`execution_status`, `execution_start_time`);

-- 用于性能分析查询
ALTER TABLE `t_task_execution_history` 
ADD INDEX `idx_exec_duration` (`execution_duration`, `execution_start_time`);

-- ===================================================================
-- 创建视图以简化常用查询
-- ===================================================================

-- 用户任务统计视图
DROP VIEW IF EXISTS `v_user_task_stats`;
CREATE VIEW `v_user_task_stats` AS
SELECT 
    u.id as user_id,
    u.username,
    u.real_name,
    COUNT(t.id) as total_tasks,
    COUNT(CASE WHEN t.status = 'COMPLETED' THEN 1 END) as completed_tasks,
    COUNT(CASE WHEN t.status = 'RUNNING' THEN 1 END) as running_tasks,
    COUNT(CASE WHEN t.status = 'FAILED' THEN 1 END) as failed_tasks,
    COUNT(CASE WHEN t.is_favorite = 1 THEN 1 END) as favorite_tasks,
    MAX(t.update_time) as last_task_time
FROM t_user u
LEFT JOIN t_query_task t ON u.id = t.user_id
WHERE u.status = 1
GROUP BY u.id, u.username, u.real_name;

-- 任务执行性能视图
DROP VIEW IF EXISTS `v_task_performance`;
CREATE VIEW `v_task_performance` AS
SELECT 
    t.id,
    t.task_name,
    t.user_id,
    u.username,
    t.status,
    t.datasource_type,
    t.execution_duration,
    t.execution_start_time,
    CASE 
        WHEN t.execution_duration < 1000 THEN '快速(<1s)'
        WHEN t.execution_duration < 5000 THEN '中等(1-5s)'
        WHEN t.execution_duration < 30000 THEN '较慢(5-30s)'
        ELSE '缓慢(>30s)'
    END as performance_level,
    t.create_time,
    t.update_time
FROM t_query_task t
JOIN t_user u ON t.user_id = u.id
WHERE t.execution_duration IS NOT NULL;

-- 每日任务执行统计视图
DROP VIEW IF EXISTS `v_daily_execution_stats`;
CREATE VIEW `v_daily_execution_stats` AS
SELECT 
    DATE(execution_start_time) as exec_date,
    COUNT(*) as total_executions,
    COUNT(CASE WHEN execution_status = 'SUCCESS' THEN 1 END) as success_count,
    COUNT(CASE WHEN execution_status = 'FAILED' THEN 1 END) as failed_count,
    AVG(execution_duration) as avg_duration_ms,
    MAX(execution_duration) as max_duration_ms,
    MIN(execution_duration) as min_duration_ms
FROM t_task_execution_history
WHERE execution_start_time >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
GROUP BY DATE(execution_start_time)
ORDER BY exec_date DESC;

-- ===================================================================
-- 创建存储过程用于数据清理
-- ===================================================================

-- 清理执行历史数据的存储过程
DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_cleanup_execution_history`$$

CREATE PROCEDURE `sp_cleanup_execution_history`(
    IN days_to_keep INT DEFAULT 90
)
BEGIN
    DECLARE deleted_count INT DEFAULT 0;
    DECLARE exit handler for sqlexception
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- 删除指定天数之前的执行历史记录
    DELETE FROM t_task_execution_history 
    WHERE create_time < DATE_SUB(CURDATE(), INTERVAL days_to_keep DAY);
    
    SET deleted_count = ROW_COUNT();
    
    -- 记录清理日志
    INSERT INTO t_system_log (
        log_type, 
        log_message, 
        create_time
    ) VALUES (
        'DATA_CLEANUP',
        CONCAT('清理了 ', deleted_count, ' 条执行历史记录，保留最近 ', days_to_keep, ' 天的数据'),
        NOW()
    ) ON DUPLICATE KEY UPDATE log_message = VALUES(log_message);
    
    COMMIT;
    
    SELECT CONCAT('成功清理 ', deleted_count, ' 条历史记录') as result;
END$$

DELIMITER ;

-- ===================================================================
-- 创建系统日志表（用于记录清理操作等）
-- ===================================================================

DROP TABLE IF EXISTS `t_system_log`;
CREATE TABLE `t_system_log` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '日志ID',
    `log_type` VARCHAR(50) NOT NULL COMMENT '日志类型',
    `log_message` TEXT COMMENT '日志消息',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    
    INDEX `idx_log_type` (`log_type`),
    INDEX `idx_create_time` (`create_time`)
) ENGINE=InnoDB 
  DEFAULT CHARSET=utf8mb4 
  COLLATE=utf8mb4_unicode_ci 
  COMMENT='系统日志表';

-- ===================================================================
-- 数据库参数优化建议（需要DBA权限执行）
-- ===================================================================

/*
-- 以下参数需要在MySQL配置文件(my.cnf)中设置，或通过DBA执行

-- InnoDB缓冲池大小（建议设置为系统内存的70-80%）
SET GLOBAL innodb_buffer_pool_size = 1073741824; -- 1GB

-- 查询缓存设置
SET GLOBAL query_cache_type = ON;
SET GLOBAL query_cache_size = 268435456; -- 256MB

-- 连接数设置
SET GLOBAL max_connections = 200;

-- 临时表大小
SET GLOBAL tmp_table_size = 67108864; -- 64MB
SET GLOBAL max_heap_table_size = 67108864; -- 64MB

-- 慢查询日志
SET GLOBAL slow_query_log = ON;
SET GLOBAL long_query_time = 2; -- 记录执行时间超过2秒的查询

-- 二进制日志设置（用于主从复制）
SET GLOBAL binlog_format = 'ROW';
SET GLOBAL expire_logs_days = 7;
*/

-- ===================================================================
-- 性能监控查询
-- ===================================================================

-- 查看表大小和索引使用情况
SELECT 
    table_name,
    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS "Size(MB)",
    ROUND((data_length / 1024 / 1024), 2) AS "Data(MB)",
    ROUND((index_length / 1024 / 1024), 2) AS "Index(MB)",
    table_rows
FROM information_schema.tables 
WHERE table_schema = 'trino_frontend_dev'
ORDER BY (data_length + index_length) DESC;

-- 显示所有创建的索引
SELECT 
    table_name,
    index_name,
    column_name,
    index_type,
    non_unique
FROM information_schema.statistics 
WHERE table_schema = 'trino_frontend_dev'
ORDER BY table_name, index_name, seq_in_index;

-- 显示创建的视图
SELECT 
    table_name as view_name,
    table_comment as view_comment
FROM information_schema.tables 
WHERE table_schema = 'trino_frontend_dev' 
  AND table_type = 'VIEW'
ORDER BY table_name;

-- ===================================================================
-- 完成提示
-- ===================================================================

SELECT 'Database optimization completed successfully!' as status,
       'Indexes, views, and procedures have been created.' as message,
       NOW() as completion_time;