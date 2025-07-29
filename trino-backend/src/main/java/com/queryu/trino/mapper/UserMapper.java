package com.queryu.trino.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.queryu.trino.entity.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 用户Mapper接口
 */
@Mapper
public interface UserMapper extends BaseMapper<User> {
    
    /**
     * 根据用户名查询用户
     */
    @Select("SELECT * FROM t_user WHERE username = #{username} AND status = 1")
    User selectByUsername(@Param("username") String username);
    
    /**
     * 根据邮箱查询用户
     */
    @Select("SELECT * FROM t_user WHERE email = #{email} AND status = 1")
    User selectByEmail(@Param("email") String email);
    
    /**
     * 检查用户名是否存在
     */
    @Select("SELECT COUNT(*) > 0 FROM t_user WHERE username = #{username}")
    boolean existsByUsername(@Param("username") String username);
    
    /**
     * 检查邮箱是否存在
     */
    @Select("SELECT COUNT(*) > 0 FROM t_user WHERE email = #{email}")
    boolean existsByEmail(@Param("email") String email);
    
    /**
     * 根据状态查询用户列表
     */
    @Select("SELECT * FROM t_user WHERE status = #{status} ORDER BY create_time DESC")
    List<User> selectByStatus(@Param("status") Integer status);
    
    /**
     * 根据角色查询用户列表
     */
    @Select("SELECT * FROM t_user WHERE role = #{role} AND status = 1 ORDER BY create_time DESC")
    List<User> selectByRole(@Param("role") String role);
    
    /**
     * 查询指定时间后登录的用户
     */
    @Select("SELECT * FROM t_user WHERE last_login_time >= #{loginTime} ORDER BY last_login_time DESC")
    List<User> selectUsersLoggedInAfter(@Param("loginTime") LocalDateTime loginTime);
    
    /**
     * 根据关键词模糊查询用户
     */
    @Select("SELECT * FROM t_user WHERE (username LIKE CONCAT('%', #{keyword}, '%') OR real_name LIKE CONCAT('%', #{keyword}, '%') OR email LIKE CONCAT('%', #{keyword}, '%')) AND status = 1 ORDER BY create_time DESC")
    List<User> selectByKeyword(@Param("keyword") String keyword);
    
    /**
     * 统计指定状态的用户数量
     */
    @Select("SELECT COUNT(*) FROM t_user WHERE status = #{status}")
    Long countByStatus(@Param("status") Integer status);
    
    /**
     * 查询最近注册的用户
     */
    @Select("SELECT * FROM t_user WHERE create_time >= #{createTime} ORDER BY create_time DESC")
    List<User> selectRecentUsers(@Param("createTime") LocalDateTime createTime);
}