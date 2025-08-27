package com.queryu.trino.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 文件元数据实体类
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@TableName("t_file_metadata")
public class FileMetadata implements Serializable {
    
    private static final long serialVersionUID = 1L;
    
    @TableId(type = IdType.AUTO)
    private Long id;
    
    @TableField("file_path")
    private String filePath;
    
    @TableField("catalog_name")
    private String catalogName;
    
    @TableField("schema_name")
    private String schemaName;
    
    @TableField("bucket_name")
    private String bucketName;
    
    @TableField("file_name")
    private String fileName;
    
    @TableField("file_type")
    private String fileType;
    
    @TableField("metadata_key")
    private String metadataKey;
    
    @TableField("metadata_value")
    private String metadataValue;
    
    @TableField("extraction_type")
    private String extractionType;
    
    @TableField("user_id")
    private Long userId;
    
    @TableField(value = "create_time", fill = FieldFill.INSERT)
    private LocalDateTime createTime;
    
    @TableField(value = "update_time", fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}