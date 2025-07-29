package com.queryu.trino.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import javax.validation.constraints.Email;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;
import java.time.LocalDateTime;

/**
 * 用户实体类
 */
@Data
@EqualsAndHashCode(callSuper = false)
@TableName("t_user")
public class User {
    
    @TableId(type = IdType.AUTO)
    private Long id;
    
    /**
     * 用户名
     */
    @NotBlank(message = "用户名不能为空")
    @Size(min = 3, max = 50, message = "用户名长度必须在3-50个字符之间")
    @TableField("username")
    private String username;
    
    /**
     * 密码(加密存储)
     */
    @NotBlank(message = "密码不能为空")
    @TableField("password")
    private String password;
    
    /**
     * 盐值(用于密码加密)
     */
    @TableField("salt")
    private String salt;
    
    /**
     * 邮箱
     */
    @Email(message = "邮箱格式不正确")
    @TableField("email")
    private String email;
    
    /**
     * 真实姓名
     */
    @Size(max = 50, message = "真实姓名长度不能超过50个字符")
    @TableField("real_name")
    private String realName;
    
    /**
     * 手机号
     */
    @Size(max = 20, message = "手机号长度不能超过20个字符")
    @TableField("phone")
    private String phone;
    
    /**
     * 用户状态: 0-禁用, 1-正常
     */
    @TableField("status")
    private Integer status = 1;
    
    /**
     * 角色: USER-普通用户, ADMIN-管理员
     */
    @TableField("role")
    private UserRole role = UserRole.USER;
    
    /**
     * 最后登录时间
     */
    @TableField("last_login_time")
    private LocalDateTime lastLoginTime;
    
    /**
     * 最后登录IP
     */
    @TableField("last_login_ip")
    private String lastLoginIp;
    
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
     * 用户角色枚举
     */
    public enum UserRole {
        USER("USER", "普通用户"),
        ADMIN("ADMIN", "管理员");
        
        private final String code;
        private final String desc;
        
        UserRole(String code, String desc) {
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
     * 用户状态枚举
     */
    public enum UserStatus {
        DISABLED(0, "禁用"),
        ENABLED(1, "正常");
        
        private final Integer code;
        private final String desc;
        
        UserStatus(Integer code, String desc) {
            this.code = code;
            this.desc = desc;
        }
        
        public Integer getCode() {
            return code;
        }
        
        public String getDesc() {
            return desc;
        }
    }
}