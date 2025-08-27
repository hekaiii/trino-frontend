-- ===================================================================
-- File Metadata Table Creation Script
-- Version: 1.0
-- Description: 创建文件元数据表，用于存储JSON/XML文件的解析元数据
-- Date: 2025-08-27
-- ===================================================================

USE `unidatax_dev`;

-- 创建文件元数据表
DROP TABLE IF EXISTS `t_file_metadata`;
CREATE TABLE `t_file_metadata` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    `file_path` VARCHAR(500) NOT NULL COMMENT '文件路径（S3路径）',
    `catalog_name` VARCHAR(100) NOT NULL COMMENT 'catalog名称',
    `schema_name` VARCHAR(100) COMMENT 'schema名称',
    `bucket_name` VARCHAR(100) COMMENT 'S3桶名称',
    `file_name` VARCHAR(255) NOT NULL COMMENT '文件名',
    `file_type` VARCHAR(20) NOT NULL COMMENT '文件类型：JSON/XML',
    `metadata_key` VARCHAR(500) NOT NULL COMMENT '元数据键（如property.name）',
    `metadata_value` TEXT COMMENT '元数据值',
    `extraction_type` VARCHAR(20) NOT NULL DEFAULT 'AUTO' COMMENT '提取类型：AUTO-自动解析，MANUAL-手动定义',
    `user_id` BIGINT NOT NULL COMMENT '创建用户ID',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    -- 索引
    INDEX `idx_file_path` (`file_path`),
    INDEX `idx_catalog_schema` (`catalog_name`, `schema_name`),
    INDEX `idx_metadata_key` (`metadata_key`),
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_file_name` (`file_name`),
    
    -- 唯一约束：同一文件的同一元数据键只能有一个值
    UNIQUE KEY `uk_file_metadata` (`file_path`, `metadata_key`),
    
    -- 外键约束
    CONSTRAINT `fk_file_metadata_user` FOREIGN KEY (`user_id`) REFERENCES `t_user`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB 
  DEFAULT CHARSET=utf8mb4 
  COLLATE=utf8mb4_unicode_ci 
  COMMENT='文件元数据表，存储JSON/XML文件的解析元数据信息';

-- 显示创建结果
SHOW TABLES LIKE 't_file_metadata';