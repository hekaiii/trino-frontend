package com.queryu.trino.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.queryu.trino.entity.QueryTask;
import com.queryu.trino.service.QueryTaskService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import javax.validation.Valid;
import java.util.List;

/**
 * 查询任务控制器
 */
@Slf4j
@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
@Validated
@CrossOrigin(origins = "*", maxAge = 3600)
public class QueryTaskController {
    
    private final QueryTaskService queryTaskService;
    
    /**
     * 创建任务
     */
    @PostMapping
    public ResponseEntity<QueryTask> createTask(@Valid @RequestBody QueryTask task,
                                                HttpServletRequest request) {
        try {
            // 从请求属性中获取用户ID（由JWT过滤器设置）
            Long userId = (Long) request.getAttribute("userId");
            if (userId != null) {
                task.setUserId(userId);
            }
            QueryTask createdTask = queryTaskService.createTask(task);
            return ResponseEntity.ok(createdTask);
        } catch (Exception e) {
            log.error("创建任务失败: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * 更新任务
     */
    @PutMapping("/{id}")
    public ResponseEntity<QueryTask> updateTask(@PathVariable Long id,
                                                @Valid @RequestBody QueryTask task,
                                                HttpServletRequest request) {
        try {
            // 从JWT中获取用户ID
            // Long userId = jwtUtil.getUserIdFromRequest(request);
            task.setId(id);
            QueryTask updatedTask = queryTaskService.updateTask(task);
            return ResponseEntity.ok(updatedTask);
        } catch (Exception e) {
            log.error("更新任务失败: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * 删除任务
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteTask(@PathVariable Long id,
                                             HttpServletRequest request) {
        try {
            // 从JWT中获取用户ID
            // Long userId = jwtUtil.getUserIdFromRequest(request);
            queryTaskService.deleteTask(id);
            return ResponseEntity.ok("任务删除成功");
        } catch (Exception e) {
            log.error("删除任务失败: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    /**
     * 获取任务详情
     */
    @GetMapping("/{id}")
    public ResponseEntity<QueryTask> getTask(@PathVariable Long id,
                                             HttpServletRequest request) {
        try {
            QueryTask task = queryTaskService.getTaskById(id);
            return ResponseEntity.ok(task);
        } catch (Exception e) {
            log.error("获取任务失败: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * 分页查询用户任务
     */
    @GetMapping
    public ResponseEntity<IPage<QueryTask>> getUserTasks(@RequestParam(defaultValue = "1") int current,
                                                         @RequestParam(defaultValue = "10") int size,
                                                         @RequestParam(required = false) String status,
                                                         @RequestParam(required = false) String taskName,
                                                         HttpServletRequest request) {
        try {
            // 从请求属性中获取用户ID（由JWT过滤器设置）
            Long userId = (Long) request.getAttribute("userId");
            if (userId == null) {
                userId = 1L; // fallback，正常情况下不应该为null
            }
            
            Page<QueryTask> page = new Page<>(current, size);
            IPage<QueryTask> result = queryTaskService.getUserTasks(userId, page, status, taskName);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("查询用户任务失败: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * 执行任务
     */
    @PostMapping("/{id}/execute")
    public ResponseEntity<String> executeTask(@PathVariable Long id,
                                              HttpServletRequest request) {
        try {
            // 从JWT中获取用户ID
            // Long userId = jwtUtil.getUserIdFromRequest(request);
            queryTaskService.executeTask(id);
            return ResponseEntity.ok("任务执行成功");
        } catch (Exception e) {
            log.error("执行任务失败: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    /**
     * 收藏/取消收藏任务
     */
    @PostMapping("/{id}/favorite")
    public ResponseEntity<String> toggleFavorite(@PathVariable Long id,
                                                  @RequestParam boolean favorite,
                                                  HttpServletRequest request) {
        try {
            queryTaskService.toggleFavorite(id, favorite);
            return ResponseEntity.ok(favorite ? "收藏成功" : "取消收藏成功");
        } catch (Exception e) {
            log.error("收藏操作失败: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    /**
     * 获取用户收藏的任务
     */
    @GetMapping("/favorites")
    public ResponseEntity<List<QueryTask>> getFavoriteTasks(HttpServletRequest request) {
        try {
            // 从请求属性中获取用户ID（由JWT过滤器设置）
            Long userId = (Long) request.getAttribute("userId");
            if (userId == null) {
                userId = 1L; // fallback，正常情况下不应该为null
            }
            
            List<QueryTask> tasks = queryTaskService.getFavoriteTasks(userId);
            return ResponseEntity.ok(tasks);
        } catch (Exception e) {
            log.error("获取收藏任务失败: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}