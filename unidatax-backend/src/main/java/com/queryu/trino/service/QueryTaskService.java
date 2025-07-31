package com.queryu.trino.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.queryu.trino.entity.QueryTask;
import com.queryu.trino.mapper.QueryTaskMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 查询任务服务类
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class QueryTaskService {
    
    private final QueryTaskMapper queryTaskMapper;
    // TrinoService和ObjectMapper已移除 - 查询执行由前端直接调用Trino API完成
    
    /**
     * 创建任务
     */
    @Transactional
    public QueryTask createTask(QueryTask task) {
        log.info("创建查询任务: {}", task.getTaskName());
        
        // 设置默认值
        if (task.getStatus() == null) {
            task.setStatus(QueryTask.TaskStatus.DRAFT);
        }
        if (task.getIsFavorite() == null) {
            task.setIsFavorite(0);
        }
        
        queryTaskMapper.insert(task);
        log.info("查询任务创建成功，ID: {}", task.getId());
        return task;
    }
    
    /**
     * 更新任务
     */
    @Transactional
    public QueryTask updateTask(QueryTask task) {
        log.info("更新查询任务: {}", task.getId());
        
        QueryTask existingTask = queryTaskMapper.selectById(task.getId());
        if (existingTask == null) {
            throw new RuntimeException("任务不存在");
        }
        
        queryTaskMapper.updateById(task);
        log.info("查询任务更新成功: {}", task.getId());
        return queryTaskMapper.selectById(task.getId());
    }
    
    /**
     * 删除任务
     */
    @Transactional
    public void deleteTask(Long taskId) {
        log.info("删除查询任务: {}", taskId);
        
        QueryTask task = queryTaskMapper.selectById(taskId);
        if (task == null) {
            throw new RuntimeException("任务不存在");
        }
        
        queryTaskMapper.deleteById(taskId);
        log.info("查询任务删除成功: {}", taskId);
    }
    
    /**
     * 根据ID获取任务
     */
    public QueryTask getTaskById(Long taskId) {
        QueryTask task = queryTaskMapper.selectById(taskId);
        if (task == null) {
            throw new RuntimeException("任务不存在");
        }
        return task;
    }
    
    /**
     * 分页查询用户任务
     */
    public IPage<QueryTask> getUserTasks(Long userId, Page<QueryTask> page, String status, String taskName) {
        QueryWrapper<QueryTask> wrapper = new QueryWrapper<>();
        wrapper.eq("user_id", userId);
        
        if (StringUtils.hasText(status)) {
            wrapper.eq("status", status);
        }
        
        if (StringUtils.hasText(taskName)) {
            wrapper.like("task_name", taskName);
        }
        
        wrapper.orderByDesc("create_time");
        
        return queryTaskMapper.selectPage(page, wrapper);
    }
    
    /**
     * 获取用户所有任务
     */
    public List<QueryTask> getAllUserTasks(Long userId) {
        QueryWrapper<QueryTask> wrapper = new QueryWrapper<>();
        wrapper.eq("user_id", userId)
                .orderByDesc("create_time");
        
        return queryTaskMapper.selectList(wrapper);
    }
    
    /**
     * 获取用户收藏的任务
     */
    public List<QueryTask> getFavoriteTasks(Long userId) {
        QueryWrapper<QueryTask> wrapper = new QueryWrapper<>();
        wrapper.eq("user_id", userId)
                .eq("is_favorite", true)
                .orderByDesc("create_time");
        
        return queryTaskMapper.selectList(wrapper);
    }
    
    /**
     * 收藏/取消收藏任务
     */
    @Transactional
    public void toggleFavorite(Long taskId, boolean favorite) {
        log.info("{}任务: {}", favorite ? "收藏" : "取消收藏", taskId);
        
        QueryTask task = queryTaskMapper.selectById(taskId);
        if (task == null) {
            throw new RuntimeException("任务不存在");
        }
        
        task.setIsFavorite(favorite ? 1 : 0);
        queryTaskMapper.updateById(task);
        
        log.info("任务收藏状态更新成功: {} -> {}", taskId, favorite);
    }
    
    /**
     * 执行任务
     */
    @Transactional
    // executeTask方法已移除 - 查询执行由前端直接调用Trino API完成
    
    // executeSQL方法已移除 - 查询执行由前端直接调用Trino API完成
    
    /**
     * 根据状态统计任务数量
     */
    public long countTasksByStatus(Long userId, QueryTask.TaskStatus status) {
        QueryWrapper<QueryTask> wrapper = new QueryWrapper<>();
        wrapper.eq("user_id", userId)
                .eq("status", status);
        
        return queryTaskMapper.selectCount(wrapper);
    }
    
    /**
     * 获取用户最近的任务
     */
    public List<QueryTask> getRecentTasks(Long userId, int limit) {
        QueryWrapper<QueryTask> wrapper = new QueryWrapper<>();
        wrapper.eq("user_id", userId)
                .orderByDesc("create_time")
                .last("LIMIT " + limit);
        
        return queryTaskMapper.selectList(wrapper);
    }
}