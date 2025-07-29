-- ===================================================================
-- Trino Frontend Database Schema Creation Script
-- Version: 1.0
-- Description: 创建Trino前端应用所需的数据库和表结构
-- Author: System
-- Date: 2025-07-28
-- ===================================================================

-- 创建数据库
CREATE DATABASE IF NOT EXISTS `trino_frontend_dev` 
    CHARACTER SET utf8mb4 
    COLLATE utf8mb4_unicode_ci
    COMMENT 'Trino前端开发环境数据库';

-- 使用数据库
USE `trino_frontend_dev`;

-- 设置事务隔离级别
SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED;

-- 创建用户表
DROP TABLE IF EXISTS `t_user`;
CREATE TABLE `t_user` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '用户ID，主键自增',
    `username` VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名，登录账号，唯一',
    `password` VARCHAR(255) NOT NULL COMMENT '密码，BCrypt加密存储',
    `salt` VARCHAR(32) NOT NULL COMMENT '密码盐值，用于增强安全性',
    `email` VARCHAR(100) UNIQUE COMMENT '用户邮箱，唯一，可用于找回密码',
    `real_name` VARCHAR(50) COMMENT '用户真实姓名',
    `phone` VARCHAR(20) COMMENT '手机号码',
    `status` TINYINT NOT NULL DEFAULT 1 COMMENT '用户状态: 0-禁用, 1-正常',
    `role` VARCHAR(20) NOT NULL DEFAULT 'USER' COMMENT '用户角色: USER-普通用户, ADMIN-管理员',
    `last_login_time` DATETIME COMMENT '最后登录时间',
    `last_login_ip` VARCHAR(50) COMMENT '最后登录IP地址',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `created_by` BIGINT COMMENT '创建者用户ID',
    `updated_by` BIGINT COMMENT '最后更新者用户ID',
    `remark` VARCHAR(500) COMMENT '备注信息',
    
    -- 索引
    INDEX `idx_username` (`username`),
    INDEX `idx_email` (`email`),
    INDEX `idx_status` (`status`),
    INDEX `idx_role` (`role`),
    INDEX `idx_create_time` (`create_time`),
    INDEX `idx_last_login_time` (`last_login_time`)
) ENGINE=InnoDB 
  DEFAULT CHARSET=utf8mb4 
  COLLATE=utf8mb4_unicode_ci 
  COMMENT='用户信息表，存储系统用户的基本信息和认证数据';

-- 创建查询任务表
DROP TABLE IF EXISTS `t_query_task`;
CREATE TABLE `t_query_task` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '任务ID，主键自增',
    `task_name` VARCHAR(100) NOT NULL COMMENT '任务名称，用户自定义',
    `sql_content` TEXT COMMENT 'SQL查询语句内容',
    `description` VARCHAR(500) COMMENT '任务描述信息',
    `user_id` BIGINT NOT NULL COMMENT '所属用户ID，关联t_user表',
    `status` VARCHAR(20) NOT NULL DEFAULT 'DRAFT' COMMENT '任务状态: DRAFT-草稿, SAVED-已保存, RUNNING-运行中, COMPLETED-已完成, FAILED-失败',
    `datasource_type` VARCHAR(20) COMMENT '数据源类型: GRAVITINO-Gravitino数据源, TRINO-Trino数据源, MIXED-混合数据源',
    `target_catalog` VARCHAR(100) COMMENT '目标数据目录(catalog)',
    `target_schema` VARCHAR(100) COMMENT '目标数据库/模式(schema)',
    `target_table` VARCHAR(100) COMMENT '目标表名',
    `execution_result` LONGTEXT COMMENT '执行结果，JSON格式存储查询结果数据',
    `error_message` TEXT COMMENT '执行错误信息，记录失败原因',
    `execution_start_time` DATETIME COMMENT '执行开始时间',
    `execution_end_time` DATETIME COMMENT '执行结束时间',
    `execution_duration` BIGINT COMMENT '执行耗时，单位毫秒',
    `is_favorite` TINYINT NOT NULL DEFAULT 0 COMMENT '是否收藏: 0-否, 1-是',
    `tags` VARCHAR(200) COMMENT '任务标签，用逗号分隔多个标签',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `created_by` BIGINT COMMENT '创建者用户ID',
    `updated_by` BIGINT COMMENT '最后更新者用户ID',
    `remark` VARCHAR(500) COMMENT '备注信息',
    
    -- 索引
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_task_name` (`task_name`),
    INDEX `idx_status` (`status`),
    INDEX `idx_datasource_type` (`datasource_type`),
    INDEX `idx_create_time` (`create_time`),
    INDEX `idx_execution_start_time` (`execution_start_time`),
    INDEX `idx_is_favorite` (`is_favorite`),
    INDEX `idx_user_status` (`user_id`, `status`),
    INDEX `idx_user_create_time` (`user_id`, `create_time` DESC),
    
    -- 外键约束
    CONSTRAINT `fk_query_task_user` FOREIGN KEY (`user_id`) REFERENCES `t_user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB 
  DEFAULT CHARSET=utf8mb4 
  COLLATE=utf8mb4_unicode_ci 
  COMMENT='查询任务表，存储用户创建的SQL查询任务和执行结果';

-- 创建任务执行历史表（可选，用于审计）
DROP TABLE IF EXISTS `t_task_execution_history`;
CREATE TABLE `t_task_execution_history` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '历史记录ID',
    `task_id` BIGINT NOT NULL COMMENT '关联的任务ID',
    `user_id` BIGINT NOT NULL COMMENT '执行用户ID',
    `sql_content` TEXT COMMENT '执行时的SQL内容快照',
    `execution_status` VARCHAR(20) NOT NULL COMMENT '执行状态: SUCCESS-成功, FAILED-失败, CANCELLED-取消',
    `execution_result` LONGTEXT COMMENT '执行结果JSON',
    `error_message` TEXT COMMENT '错误信息',
    `execution_start_time` DATETIME NOT NULL COMMENT '执行开始时间',
    `execution_end_time` DATETIME COMMENT '执行结束时间',
    `execution_duration` BIGINT COMMENT '执行耗时(毫秒)',
    `client_ip` VARCHAR(50) COMMENT '客户端IP地址',
    `user_agent` VARCHAR(500) COMMENT '用户代理信息',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录创建时间',
    
    -- 索引
    INDEX `idx_task_id` (`task_id`),
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_execution_status` (`execution_status`),
    INDEX `idx_execution_start_time` (`execution_start_time`),
    INDEX `idx_create_time` (`create_time`),
    INDEX `idx_task_user_time` (`task_id`, `user_id`, `execution_start_time` DESC),
    
    -- 外键约束
    CONSTRAINT `fk_task_history_task` FOREIGN KEY (`task_id`) REFERENCES `t_query_task`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_task_history_user` FOREIGN KEY (`user_id`) REFERENCES `t_user`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB 
  DEFAULT CHARSET=utf8mb4 
  COLLATE=utf8mb4_unicode_ci 
  COMMENT='任务执行历史表，记录所有任务执行的详细历史信息，用于审计和统计';

-- 显示创建结果
SHOW TABLES;