package com.queryu.trino.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;
import java.time.LocalDateTime;

/**
 * 查询任务实体类
 */
@Data
@EqualsAndHashCode(callSuper = false)
@TableName("t_query_task")
public class QueryTask {
    
    @TableId(type = IdType.AUTO)
    private Long id;
    
    /**
     * 任务名称
     */
    @NotBlank(message = "任务名称不能为空")
    @Size(min = 1, max = 100, message = "任务名称长度必须在1-100个字符之间")
    @TableField("task_name")
    private String taskName;
    
    /**
     * SQL查询语句
     */
    @TableField("sql_content")
    private String sqlContent;
    
    /**
     * 任务描述
     */
    @Size(max = 500, message = "任务描述长度不能超过500个字符")
    @TableField("description")
    private String description;
    
    /**
     * 所属用户ID
     */
    @NotNull(message = "用户ID不能为空")
    @TableField("user_id")
    private Long userId;
    
    
    /**
     * 任务状态: DRAFT-草稿, SAVED-已保存, RUNNING-运行中, COMPLETED-已完成, FAILED-失败
     */
    @TableField("status")
    private TaskStatus status = TaskStatus.DRAFT;
    
    /**
     * 数据源类型: GRAVITINO, TRINO, MIXED
     */
    @TableField("datasource_type")
    private DatasourceType datasourceType;
    
    /**
     * 目标catalog
     */
    @TableField("target_catalog")
    private String targetCatalog;
    
    /**
     * 目标schema
     */
    @TableField("target_schema")
    private String targetSchema;
    
    /**
     * 目标表名
     */
    @TableField("target_table")
    private String targetTable;
    
    /**
     * 执行结果(JSON格式)
     */
    @TableField("execution_result")
    private String executionResult;
    
    /**
     * 执行错误信息
     */
    @TableField("error_message")
    private String errorMessage;
    
    /**
     * 执行开始时间
     */
    @TableField("execution_start_time")
    private LocalDateTime executionStartTime;
    
    /**
     * 执行结束时间
     */
    @TableField("execution_end_time")
    private LocalDateTime executionEndTime;
    
    /**
     * 执行耗时(毫秒)
     */
    @TableField("execution_duration")
    private Long executionDuration;
    
    /**
     * 是否收藏: 0-否, 1-是
     */
    @TableField("is_favorite")
    private Integer isFavorite = 0;
    
    /**
     * 标签(用逗号分隔)
     */
    @TableField("tags")
    private String tags;
    
    /**
     * 创建时间
     */
    @TableField(value = "create_time", fill = FieldFill.INSERT)
    private LocalDateTime createTime;
    
    /**
     * 更新时间
     */
    @TableField(value = "update_time", fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
    
    /**
     * 创建者ID
     */
    @TableField("created_by")
    private Long createdBy;
    
    /**
     * 更新者ID
     */
    @TableField("updated_by")
    private Long updatedBy;
    
    /**
     * 备注
     */
    @TableField("remark")
    private String remark;
    
    /**
     * 任务状态枚举
     */
    public enum TaskStatus {
        DRAFT("DRAFT", "草稿"),
        SAVED("SAVED", "已保存"),
        RUNNING("RUNNING", "运行中"),
        COMPLETED("COMPLETED", "已完成"),
        FAILED("FAILED", "失败");
        
        private final String code;
        private final String desc;
        
        TaskStatus(String code, String desc) {
            this.code = code;
            this.desc = desc;
        }
        
        public String getCode() {
            return code;
        }
        
        public String getDesc() {
            return desc;
        }
    }
    
    /**
     * 数据源类型枚举
     */
    public enum DatasourceType {
        GRAVITINO("GRAVITINO", "Gravitino数据源"),
        TRINO("TRINO", "Trino数据源"),
        MIXED("MIXED", "混合数据源");
        
        private final String code;
        private final String desc;
        
        DatasourceType(String code, String desc) {
            this.code = code;
            this.desc = desc;
        }
        
        public String getCode() {
            return code;
        }
        
        public String getDesc() {
            return desc;
        }
    }
}