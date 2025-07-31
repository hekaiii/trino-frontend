-- 创建数据库
CREATE DATABASE IF NOT EXISTS trino_frontend_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE trino_frontend_dev;

-- 用户表
CREATE TABLE IF NOT EXISTS t_user (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '用户ID',
    username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
    password VARCHAR(255) NOT NULL COMMENT '密码(加密存储)',
    salt VARCHAR(32) COMMENT '盐值',
    email VARCHAR(100) UNIQUE COMMENT '邮箱',
    real_name VARCHAR(50) COMMENT '真实姓名',
    phone VARCHAR(20) COMMENT '手机号',
    status TINYINT NOT NULL DEFAULT 1 COMMENT '用户状态: 0-禁用, 1-正常',
    role VARCHAR(20) NOT NULL DEFAULT 'USER' COMMENT '角色: USER-普通用户, ADMIN-管理员',
    last_login_time DATETIME COMMENT '最后登录时间',
    last_login_ip VARCHAR(50) COMMENT '最后登录IP',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    created_by BIGINT COMMENT '创建者ID',
    updated_by BIGINT COMMENT '更新者ID',
    remark VARCHAR(500) COMMENT '备注',
    KEY idx_username (username),
    KEY idx_email (email),
    KEY idx_status (status),
    KEY idx_create_time (create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 查询任务表
CREATE TABLE IF NOT EXISTS t_query_task (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '任务ID',
    task_name VARCHAR(100) NOT NULL COMMENT '任务名称',
    sql_content TEXT COMMENT 'SQL查询语句',
    description VARCHAR(500) COMMENT '任务描述',
    user_id BIGINT NOT NULL COMMENT '所属用户ID',
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' COMMENT '任务状态: DRAFT-草稿, SAVED-已保存, RUNNING-运行中, COMPLETED-已完成, FAILED-失败',
    datasource_type VARCHAR(20) COMMENT '数据源类型: GRAVITINO, TRINO, MIXED',
    target_catalog VARCHAR(100) COMMENT '目标catalog',
    target_schema VARCHAR(100) COMMENT '目标schema',
    target_table VARCHAR(100) COMMENT '目标表名',
    execution_result TEXT COMMENT '执行结果(JSON格式)',
    error_message TEXT COMMENT '执行错误信息',
    execution_start_time DATETIME COMMENT '执行开始时间',
    execution_end_time DATETIME COMMENT '执行结束时间',
    execution_duration BIGINT COMMENT '执行耗时(毫秒)',
    is_favorite TINYINT NOT NULL DEFAULT 0 COMMENT '是否收藏: 0-否, 1-是',
    tags VARCHAR(200) COMMENT '标签(用逗号分隔)',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    created_by BIGINT COMMENT '创建者ID',
    updated_by BIGINT COMMENT '更新者ID',
    remark VARCHAR(500) COMMENT '备注',
    KEY idx_user_id (user_id),
    KEY idx_task_name (task_name),
    KEY idx_status (status),
    KEY idx_create_time (create_time),
    KEY idx_execution_start_time (execution_start_time),
    CONSTRAINT fk_query_task_user FOREIGN KEY (user_id) REFERENCES t_user(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='查询任务表';

-- 插入默认管理员用户
INSERT INTO t_user (username, password, salt, email, real_name, role, status, remark) 
VALUES ('admin', '$2a$12$4e8U9.fFM8fCU8U9.fFM8eO8U9.fFM8fCU8U9.fFM8fCU8U9.fFM8e', 'defaultSalt12345', 'admin@queryu.com', '系统管理员', 'ADMIN', 1, '系统默认管理员账户')
ON DUPLICATE KEY UPDATE username = username;

-- 插入测试用户
INSERT INTO t_user (username, password, salt, email, real_name, role, status, remark) 
VALUES ('test', '$2a$12$testPasswordHash123456789012345678901234567890123456789', 'testSalt1234567', 'test@queryu.com', '测试用户', 'USER', 1, '测试用户账户')
ON DUPLICATE KEY UPDATE username = username;