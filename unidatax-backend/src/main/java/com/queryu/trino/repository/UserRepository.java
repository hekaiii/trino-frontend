package com.queryu.trino.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.queryu.trino.entity.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 用户数据访问层
 */
@Mapper
public interface UserRepository extends BaseMapper<User> {
    
    /**
     * 根据用户名查询用户
     */
    @Select("SELECT * FROM t_user WHERE username = #{username}")
    User findByUsername(@Param("username") String username);
    
    /**
     * 根据邮箱查询用户
     */
    @Select("SELECT * FROM t_user WHERE email = #{email}")
    User findByEmail(@Param("email") String email);
    
    /**
     * 检查用户名是否存在
     */
    @Select("SELECT COUNT(*) FROM t_user WHERE username = #{username}")
    int existsByUsername(@Param("username") String username);
    
    /**
     * 检查邮箱是否存在
     */
    @Select("SELECT COUNT(*) FROM t_user WHERE email = #{email}")
    int existsByEmail(@Param("email") String email);
    
    /**
     * 根据状态查询用户列表
     */
    @Select("SELECT * FROM t_user WHERE status = #{status}")
    List<User> findByStatus(@Param("status") Integer status);
    
    /**
     * 根据角色查询用户列表
     */
    @Select("SELECT * FROM t_user WHERE role = #{role}")
    List<User> findByRole(@Param("role") String role);
    
    /**
     * 查询指定时间后登录的用户
     */
    @Select("SELECT * FROM t_user WHERE last_login_time >= #{loginTime}")
    List<User> findUsersLoggedInAfter(@Param("loginTime") LocalDateTime loginTime);
    
    /**
     * 根据用户名模糊查询
     */
    @Select("SELECT * FROM t_user WHERE username LIKE CONCAT('%', #{keyword}, '%') OR real_name LIKE CONCAT('%', #{keyword}, '%') OR email LIKE CONCAT('%', #{keyword}, '%')")
    List<User> findByKeyword(@Param("keyword") String keyword);
    
    /**
     * 统计用户数量
     */
    @Select("SELECT COUNT(*) FROM t_user WHERE status = #{status}")
    Long countByStatus(@Param("status") Integer status);
    
    /**
     * 查询最近注册的用户
     */
    @Select("SELECT * FROM t_user WHERE create_time >= #{createTime} ORDER BY create_time DESC")
    List<User> findRecentUsers(@Param("createTime") LocalDateTime createTime);
}