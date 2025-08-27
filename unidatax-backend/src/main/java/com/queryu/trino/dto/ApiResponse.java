package com.queryu.trino.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 统一API响应格式
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApiResponse<T> {
    
    /**
     * 响应码: 200-成功, 其他-失败
     */
    private Integer code;
    
    /**
     * 响应消息
     */
    private String message;
    
    /**
     * 响应数据
     */
    private T data;
    
    /**
     * 时间戳
     */
    private Long timestamp;
    
    /**
     * 成功响应
     */
    public static <T> ApiResponse<T> success(T data, String message) {
        return ApiResponse.<T>builder()
                .code(200)
                .message(message)
                .data(data)
                .timestamp(System.currentTimeMillis())
                .build();
    }
    
    /**
     * 成功响应(无消息)
     */
    public static <T> ApiResponse<T> success(T data) {
        return success(data, "操作成功");
    }
    
    /**
     * 成功响应(只有消息)
     */
    public static ApiResponse<Object> successMessage(String message) {
        return ApiResponse.builder()
                .code(200)
                .message(message)
                .data(null)
                .timestamp(System.currentTimeMillis())
                .build();
    }
    
    /**
     * 失败响应
     */
    public static <T> ApiResponse<T> error(String message) {
        return ApiResponse.<T>builder()
                .code(500)
                .message(message)
                .data(null)
                .timestamp(System.currentTimeMillis())
                .build();
    }
    
    /**
     * 失败响应(自定义错误码)
     */
    public static <T> ApiResponse<T> error(Integer code, String message) {
        return ApiResponse.<T>builder()
                .code(code)
                .message(message)
                .data(null)
                .timestamp(System.currentTimeMillis())
                .build();
    }
    
    /**
     * 判断是否成功
     */
    public boolean isSuccess() {
        return code != null && code == 200;
    }
}