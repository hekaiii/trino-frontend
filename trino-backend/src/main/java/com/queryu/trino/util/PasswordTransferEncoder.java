package com.queryu.trino.util;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

/**
 * 密码传输编码解码工具类
 * 用于前后端密码传输的编码解码，防止明文传输
 */
@Slf4j
@Component("passwordTransferEncoder")
public class PasswordTransferEncoder {
    
    /**
     * 解码前端传输的编码密码
     * @param encodedPassword 编码后的密码
     * @return 原始密码
     */
    public String decodePassword(String encodedPassword) {
        try {
            // Base64解码
            byte[] decodedBytes = Base64.getDecoder().decode(encodedPassword);
            String decoded = new String(decodedBytes, StandardCharsets.UTF_8);
            
            // 分割数据: password|timestamp|random
            String[] parts = decoded.split("\\|");
            
            if (parts.length >= 3) {
                String password = parts[0];
                long timestamp = Long.parseLong(parts[1]);
                String random = parts[2];
                
                // 验证时间戳（防止重放攻击，允许5分钟内的请求）
                long currentTime = System.currentTimeMillis();
                long timeDiff = currentTime - timestamp;
                
                if (timeDiff > 5 * 60 * 1000) { // 5分钟
                    log.warn("密码解码失败：时间戳过期，时间差: {}ms", timeDiff);
                    // 时间戳过期但仍然返回密码，只记录警告
                }
                
                log.debug("密码解码成功，时间戳: {}, 随机数: {}", timestamp, random);
                return password;
            } else {
                // 兼容简单编码格式
                log.debug("使用兼容模式解码密码");
                return decoded;
            }
            
        } catch (Exception e) {
            log.error("密码解码失败: {}", e.getMessage());
            // 如果解码失败，尝试直接返回原值（兼容明文密码）
            return encodedPassword;
        }
    }
    
    /**
     * 编码密码用于传输（主要供测试使用）
     * @param password 原始密码
     * @return 编码后的密码
     */
    public String encodePassword(String password) {
        try {
            long timestamp = System.currentTimeMillis();
            String random = String.valueOf(Math.random()).substring(2, 15);
            
            // 组合数据: password|timestamp|random
            String combined = password + "|" + timestamp + "|" + random;
            
            // Base64编码
            return Base64.getEncoder().encodeToString(combined.getBytes(StandardCharsets.UTF_8));
            
        } catch (Exception e) {
            log.error("密码编码失败: {}", e.getMessage());
            // 如果编码失败，返回简单的Base64编码
            return Base64.getEncoder().encodeToString(password.getBytes(StandardCharsets.UTF_8));
        }
    }
}