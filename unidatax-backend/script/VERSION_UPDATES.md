# UnidataX 版本更新 SQL 记录

此文档记录每次版本更新需要执行的数据库脚本。

## 版本更新记录

### v1.1.0 - 文件元数据解析功能 (2025-08-27)

**功能描述：**
- 新增JSON/XML文件元数据解析功能
- 支持自动解析和手动定义文件元数据
- 提供元数据管理界面

**数据库变更：**

#### 1. 新增表：t_file_metadata
```sql
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
    INDEX `idx_file_path` (`file_path`(255)),
    INDEX `idx_catalog_schema` (`catalog_name`, `schema_name`),
    INDEX `idx_metadata_key` (`metadata_key`(255)),
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_file_name` (`file_name`),
    
    -- 唯一约束：同一文件的同一元数据键只能有一个值
    UNIQUE KEY `uk_file_metadata` (`file_path`(255), `metadata_key`(255)),
    
    -- 外键约束
    CONSTRAINT `fk_file_metadata_user` FOREIGN KEY (`user_id`) REFERENCES `t_user`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB 
  DEFAULT CHARSET=utf8mb4 
  COLLATE=utf8mb4_unicode_ci 
  COMMENT='文件元数据表，存储JSON/XML文件的解析元数据信息';
```

**执行脚本：**
```bash
# 连接数据库
mysql -h 10.177.86.13 -P 3307 -u sjzl50 -p'fe$R$5mtIh4Evl*%' unidatax_dev

# 或者直接执行
mysql -h 10.177.86.13 -P 3307 -u sjzl50 -p'fe$R$5mtIh4Evl*%' unidatax_dev < 04_file_metadata.sql
```

**验证脚本：**
```sql
-- 检查表是否创建成功
SHOW TABLES LIKE 't_file_metadata';

-- 查看表结构
DESCRIBE t_file_metadata;

-- 检查索引
SHOW INDEX FROM t_file_metadata;
```

**新增API接口：**
- POST `/api/file-metadata/parse-auto` - 自动解析文件元数据
- POST `/api/file-metadata/manual` - 手动添加元数据  
- GET `/api/file-metadata/file/{filePath}` - 获取文件元数据
- PUT `/api/file-metadata/{id}` - 更新元数据
- DELETE `/api/file-metadata/{id}` - 删除单条元数据
- DELETE `/api/file-metadata/batch` - 批量删除元数据
- DELETE `/api/file-metadata/file/{filePath}` - 删除文件所有元数据

**前端新增组件：**
- FileMetadataModal.js - 文件元数据管理弹窗
- MetadataEditModal.js - 元数据编辑弹窗  
- fileMetadataService.js - 元数据API服务

**注意事项：**
1. 索引长度限制：file_path和metadata_key字段的索引长度限制为255字符
2. 外键约束：依赖t_user表，确保用户表已存在
3. 字符集：使用utf8mb4以支持完整的Unicode字符
4. 安全性：MetadataParserService已实现XXE攻击防护

---

### 升级说明

#### 从 v1.0.0 升级到 v1.1.0
1. 备份数据库
2. 执行 `04_file_metadata.sql` 脚本
3. 重新部署后端服务
4. 重新部署前端服务
5. 验证新功能是否正常工作

#### 回滚说明
如需回滚，执行以下脚本：
```sql
DROP TABLE IF EXISTS `t_file_metadata`;
```