package com.queryu.trino.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.queryu.trino.entity.QueryTask;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 查询任务Mapper接口
 */
@Mapper
public interface QueryTaskMapper extends BaseMapper<QueryTask> {
    
    /**
     * 根据用户ID查询任务列表
     */
    @Select("SELECT * FROM t_query_task WHERE user_id = #{userId} ORDER BY create_time DESC")
    List<QueryTask> selectByUserIdOrderByCreateTimeDesc(@Param("userId") Long userId);
    
    /**
     * 根据用户ID分页查询任务
     */
    @Select("SELECT * FROM t_query_task WHERE user_id = #{userId} ORDER BY create_time DESC")
    IPage<QueryTask> selectByUserIdOrderByCreateTimeDesc(@Param("userId") Long userId, Page<QueryTask> page);
    
    /**
     * 根据用户ID和状态查询任务
     */
    @Select("SELECT * FROM t_query_task WHERE user_id = #{userId} AND status = #{status} ORDER BY create_time DESC")
    List<QueryTask> selectByUserIdAndStatus(@Param("userId") Long userId, @Param("status") String status);
    
    /**
     * 根据用户ID和收藏状态查询任务
     */
    @Select("SELECT * FROM t_query_task WHERE user_id = #{userId} AND is_favorite = #{isFavorite} ORDER BY create_time DESC")
    List<QueryTask> selectByUserIdAndIsFavorite(@Param("userId") Long userId, @Param("isFavorite") Integer isFavorite);
    
    /**
     * 根据任务名称模糊查询用户的任务
     */
    @Select("SELECT * FROM t_query_task WHERE user_id = #{userId} AND task_name LIKE CONCAT('%', #{taskName}, '%') ORDER BY create_time DESC")
    List<QueryTask> selectByUserIdAndTaskNameContaining(@Param("userId") Long userId, @Param("taskName") String taskName);
    
    /**
     * 查询用户指定时间范围内的任务
     */
    @Select("SELECT * FROM t_query_task WHERE user_id = #{userId} AND create_time BETWEEN #{startTime} AND #{endTime} ORDER BY create_time DESC")
    List<QueryTask> selectByUserIdAndCreateTimeBetween(@Param("userId") Long userId, 
                                                       @Param("startTime") LocalDateTime startTime, 
                                                       @Param("endTime") LocalDateTime endTime);
    
    /**
     * 统计用户任务数量
     */
    @Select("SELECT COUNT(*) FROM t_query_task WHERE user_id = #{userId}")
    Long countByUserId(@Param("userId") Long userId);
    
    /**
     * 统计用户各状态任务数量
     */
    @Select("SELECT COUNT(*) FROM t_query_task WHERE user_id = #{userId} AND status = #{status}")
    Long countByUserIdAndStatus(@Param("userId") Long userId, @Param("status") String status);
    
    /**
     * 查询用户最近执行的任务
     */
    @Select("SELECT * FROM t_query_task WHERE user_id = #{userId} AND execution_start_time IS NOT NULL ORDER BY execution_start_time DESC LIMIT #{limit}")
    List<QueryTask> selectRecentExecutedTasks(@Param("userId") Long userId, @Param("limit") Integer limit);
    
    /**
     * 查询执行失败的任务
     */
    @Select("SELECT * FROM t_query_task WHERE user_id = #{userId} AND status = 'FAILED' ORDER BY update_time DESC")
    List<QueryTask> selectFailedTasks(@Param("userId") Long userId);
    
    /**
     * 查询长时间运行的任务
     */
    @Select("SELECT * FROM t_query_task WHERE status = 'RUNNING' AND execution_start_time < #{timeThreshold}")
    List<QueryTask> selectLongRunningTasks(@Param("timeThreshold") LocalDateTime timeThreshold);
    
    /**
     * 根据数据源类型查询任务
     */
    @Select("SELECT * FROM t_query_task WHERE user_id = #{userId} AND datasource_type = #{datasourceType} ORDER BY create_time DESC")
    List<QueryTask> selectByUserIdAndDatasourceType(@Param("userId") Long userId, @Param("datasourceType") String datasourceType);
    
    /**
     * 批量更新任务状态
     */
    @Update("<script>" +
            "UPDATE t_query_task SET status = #{status} WHERE user_id = #{userId} AND id IN " +
            "<foreach collection='taskIds' item='id' open='(' separator=',' close=')'>" +
            "#{id}" +
            "</foreach>" +
            "</script>")
    int updateStatusBatch(@Param("taskIds") List<Long> taskIds, 
                         @Param("status") String status, 
                         @Param("userId") Long userId);
    
    /**
     * 查询包含指定SQL关键词的任务
     */
    @Select("SELECT * FROM t_query_task WHERE user_id = #{userId} AND sql_content LIKE CONCAT('%', #{keyword}, '%') ORDER BY create_time DESC")
    List<QueryTask> selectBySqlContentContaining(@Param("userId") Long userId, @Param("keyword") String keyword);
    
    /**
     * 查询执行时间超过指定阈值的任务
     */
    @Select("SELECT * FROM t_query_task WHERE user_id = #{userId} AND execution_duration > #{duration} ORDER BY execution_duration DESC")
    List<QueryTask> selectByExecutionDurationGreaterThan(@Param("userId") Long userId, @Param("duration") Long duration);
}