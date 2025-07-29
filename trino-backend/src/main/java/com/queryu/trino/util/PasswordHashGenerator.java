package com.queryu.trino.util;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/**
 * 密码哈希生成工具
 * 用于生成初始化数据的密码哈希值
 */
public class PasswordHashGenerator {
    
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(12);
        
        // 强密码示例
        String[] passwords = {
            "Admin@2025",  // 管理员密码
            "Test@2025",   // 测试用户密码  
            "Dev@2025"     // 开发用户密码
        };
        
        String[] usernames = {"admin", "test", "developer"};
        
        System.out.println("=== 强密码BCrypt哈希值生成 ===");
        System.out.println();
        
        for (int i = 0; i < passwords.length; i++) {
            String password = passwords[i];
            String username = usernames[i];
            String hash = encoder.encode(password);
            String salt = "secure_salt_" + username + "_2025";
            
            System.out.println("用户: " + username);
            System.out.println("密码: " + password);
            System.out.println("哈希: " + hash);
            System.out.println("盐值: " + salt);
            System.out.println();
            
            // 验证密码
            boolean matches = encoder.matches(password, hash);
            System.out.println("验证结果: " + (matches ? "✓ 正确" : "✗ 错误"));
            System.out.println("----------------------------------------");
        }
        
        System.out.println();
        System.out.println("SQL更新语句:");
        System.out.println();
        
        for (int i = 0; i < passwords.length; i++) {
            String password = passwords[i];
            String username = usernames[i];
            String hash = encoder.encode(password);
            String salt = "secure_salt_" + username + "_2025";
            
            System.out.println("-- 用户: " + username + " / 密码: " + password);
            System.out.println("UPDATE t_user SET ");
            System.out.println("    password = '" + hash + "',");
            System.out.println("    salt = '" + salt + "'");
            System.out.println("WHERE username = '" + username + "';");
            System.out.println();
        }
        
        // 密码强度分析
        System.out.println("=== 密码强度分析 ===");
        for (String password : passwords) {
            System.out.println("密码: " + password);
            System.out.println("长度: " + password.length() + " 字符");
            System.out.println("包含大写字母: " + password.matches(".*[A-Z].*"));
            System.out.println("包含小写字母: " + password.matches(".*[a-z].*"));
            System.out.println("包含数字: " + password.matches(".*[0-9].*"));
            System.out.println("包含特殊字符: " + password.matches(".*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?~`].*"));
            System.out.println("符合强密码要求: ✓");
            System.out.println("----------------------------------------");
        }
    }
}