package com.queryu.trino.util;

import cn.hutool.core.util.RandomUtil;
import cn.hutool.crypto.digest.BCrypt;
import lombok.extern.slf4j.Slf4j;

/**
 * 密码工具类 - 提供安全的密码加密和验证功能
 */
@Slf4j
public class PasswordUtil {
    
    /**
     * 盐值长度
     */
    private static final int SALT_LENGTH = 16;
    
    /**
     * BCrypt工作因子(推荐12-15)
     */
    private static final int BCRYPT_WORK_FACTOR = 12;
    
    /**
     * 生成随机盐值
     * 
     * @return 16位随机盐值
     */
    public static String generateSalt() {
        return RandomUtil.randomString(SALT_LENGTH);
    }
    
    /**
     * 加密密码（Base64编码版本）
     * 使用Base64编码密码+盐值，简化存储和传输
     * 
     * @param rawPassword 原始密码
     * @param salt 盐值
     * @return Base64编码后的密码
     */
    public static String encryptPassword(String rawPassword, String salt) {
        if (rawPassword == null || rawPassword.trim().isEmpty()) {
            throw new IllegalArgumentException("密码不能为空");
        }
        
        if (salt == null || salt.trim().isEmpty()) {
            throw new IllegalArgumentException("盐值不能为空");
        }
        
        try {
            // 密码 + 盐值 进行Base64编码
            String saltedPassword = rawPassword + salt;
            String encodedPassword = java.util.Base64.getEncoder().encodeToString(saltedPassword.getBytes("UTF-8"));
            
            log.debug("密码加密成功（Base64编码）");
            return encodedPassword;
            
        } catch (Exception e) {
            log.error("密码加密失败", e);
            throw new RuntimeException("密码加密失败", e);
        }
    }
    
    /**
     * 验证密码（Base64解码验证）
     * 将原始密码加盐后编码，与存储的编码密码比较
     * 
     * @param rawPassword 原始密码
     * @param encodedPassword 数据库中的Base64编码密码
     * @param salt 盐值
     * @return 验证结果
     */
    public static boolean verifyPassword(String rawPassword, String encodedPassword, String salt) {
        if (rawPassword == null || encodedPassword == null || salt == null) {
            return false;
        }
        
        try {
            // 使用相同的方式编码原始密码
            String saltedPassword = rawPassword + salt;
            String expectedEncoded = java.util.Base64.getEncoder().encodeToString(saltedPassword.getBytes("UTF-8"));
            
            // 比较编码后的结果
            boolean isValid = expectedEncoded.equals(encodedPassword);
            
            log.debug("密码验证结果: {}", isValid);
            return isValid;
            
        } catch (Exception e) {
            log.error("密码验证失败", e);
            return false;
        }
    }
    
    /**
     * 生成安全的临时密码
     * 
     * @param length 密码长度(推荐8-16位)
     * @return 临时密码
     */
    public static String generateSecurePassword(int length) {
        if (length < 6 || length > 32) {
            throw new IllegalArgumentException("密码长度必须在6-32位之间");
        }
        
        // 包含大小写字母、数字和特殊字符
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
        return RandomUtil.randomString(chars, length);
    }
    
    /**
     * 检查密码强度
     * 
     * @param password 密码
     * @return 密码强度等级: 0-弱, 1-中, 2-强
     */
    public static int checkPasswordStrength(String password) {
        if (password == null || password.length() < 6) {
            return 0;
        }
        
        int score = 0;
        
        // 长度检查
        if (password.length() >= 8) score++;
        if (password.length() >= 12) score++;
        
        // 复杂度检查
        if (password.matches(".*[a-z].*")) score++; // 包含小写字母
        if (password.matches(".*[A-Z].*")) score++; // 包含大写字母
        if (password.matches(".*[0-9].*")) score++; // 包含数字
        if (password.matches(".*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>/?].*")) score++; // 包含特殊字符
        
        // 评分转换为等级
        if (score <= 2) return 0; // 弱
        if (score <= 4) return 1; // 中
        return 2; // 强
    }
    
    /**
     * 脱敏显示密码(用于日志记录)
     * 
     * @param password 原始密码
     * @return 脱敏后的密码
     */
    public static String maskPassword(String password) {
        if (password == null || password.isEmpty()) {
            return "";
        }
        
        if (password.length() <= 2) {
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < password.length(); i++) {
                sb.append("*");
            }
            return sb.toString();
        }
        
        // 显示前1位和后1位，中间用*替代
        StringBuilder sb = new StringBuilder();
        sb.append(password.charAt(0));
        for (int i = 0; i < password.length() - 2; i++) {
            sb.append("*");
        }
        sb.append(password.charAt(password.length() - 1));
        return sb.toString();
    }
}