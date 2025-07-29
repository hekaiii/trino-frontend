package com.queryu.trino.util;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

/**
 * 密码强度校验工具类
 * 实现密码复杂度检查，防止弱口令
 */
@Component
public class PasswordStrengthValidator {
    
    // 密码最小长度
    private static final int MIN_LENGTH = 8;
    
    // 密码最大长度
    private static final int MAX_LENGTH = 50;
    
    // 各种字符类型的正则表达式
    private static final Pattern LOWERCASE_PATTERN = Pattern.compile("[a-z]");
    private static final Pattern UPPERCASE_PATTERN = Pattern.compile("[A-Z]");
    private static final Pattern DIGIT_PATTERN = Pattern.compile("[0-9]");
    private static final Pattern SPECIAL_CHAR_PATTERN = Pattern.compile("[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?~`]");
    
    // 常见弱密码列表
    private static final String[] WEAK_PASSWORDS = {
        "123456", "password", "123456789", "12345678", "12345", "1234567", "1234567890",
        "qwerty", "abc123", "111111", "123123", "admin", "letmein", "welcome", "monkey",
        "dragon", "pass", "master", "hello", "freedom", "whatever", "qazwsx", "trustno1",
        "jordan", "harley", "1234", "robert", "matthew", "jordan23", "1000", "test",
        "administrator", "root", "guest", "user", "demo", "sample", "default"
    };
    
    // 常见用户名模式（不应作为密码）
    private static final String[] COMMON_USERNAMES = {
        "admin", "administrator", "root", "user", "guest", "test", "demo", "sample"
    };
    
    /**
     * 验证密码强度
     * @param password 密码
     * @param username 用户名（可选，用于检查密码是否包含用户名）
     * @return 验证结果
     */
    public PasswordValidationResult validatePassword(String password, String username) {
        List<String> errors = new ArrayList<>();
        List<String> warnings = new ArrayList<>();
        
        if (password == null || password.isEmpty()) {
            errors.add("密码不能为空");
            return new PasswordValidationResult(false, 0, errors, warnings);
        }
        
        // 长度检查
        if (password.length() < MIN_LENGTH) {
            errors.add("密码长度至少需要" + MIN_LENGTH + "位字符");
        }
        
        if (password.length() > MAX_LENGTH) {
            errors.add("密码长度不能超过" + MAX_LENGTH + "位字符");
        }
        
        // 字符类型检查
        int typeCount = 0;
        List<String> missingTypes = new ArrayList<>();
        
        if (!LOWERCASE_PATTERN.matcher(password).find()) {
            missingTypes.add("小写字母");
        } else {
            typeCount++;
        }
        
        if (!UPPERCASE_PATTERN.matcher(password).find()) {
            missingTypes.add("大写字母");
        } else {
            typeCount++;
        }
        
        if (!DIGIT_PATTERN.matcher(password).find()) {
            missingTypes.add("数字");
        } else {
            typeCount++;
        }
        
        if (!SPECIAL_CHAR_PATTERN.matcher(password).find()) {
            missingTypes.add("特殊字符");
        } else {
            typeCount++;
        }
        
        // 至少需要3种字符类型
        if (typeCount < 3) {
            errors.add("密码必须包含至少3种字符类型，缺少: " + String.join("、", missingTypes));
        }
        
        // 检查是否为常见弱密码
        String lowerPassword = password.toLowerCase();
        for (String weakPassword : WEAK_PASSWORDS) {
            if (lowerPassword.equals(weakPassword) || lowerPassword.contains(weakPassword)) {
                errors.add("密码过于简单，请使用更复杂的密码");
                break;
            }
        }
        
        // 检查是否包含用户名
        if (username != null && !username.isEmpty()) {
            String lowerUsername = username.toLowerCase();
            if (lowerPassword.contains(lowerUsername) || lowerUsername.contains(lowerPassword)) {
                errors.add("密码不能包含用户名信息");
            }
        }
        
        // 检查连续字符
        if (hasConsecutiveChars(password)) {
            warnings.add("密码包含连续字符，建议避免使用");
        }
        
        // 检查重复字符
        if (hasRepeatingChars(password)) {
            warnings.add("密码包含重复字符，建议使用更多样化的字符");
        }
        
        // 检查键盘模式
        if (hasKeyboardPattern(password)) {
            warnings.add("密码包含键盘模式，建议使用更随机的组合");
        }
        
        // 计算密码强度分数
        int strength = calculatePasswordStrength(password, typeCount);
        
        boolean isValid = errors.isEmpty();
        
        return new PasswordValidationResult(isValid, strength, errors, warnings);
    }
    
    /**
     * 计算密码强度分数（0-100）
     */
    private int calculatePasswordStrength(String password, int typeCount) {
        int score = 0;
        
        // 长度分数 (0-25分)
        int length = password.length();
        if (length >= 12) {
            score += 25;
        } else if (length >= 10) {
            score += 20;
        } else if (length >= 8) {
            score += 15;
        } else {
            score += length * 2;
        }
        
        // 字符类型分数 (0-40分)
        score += typeCount * 10;
        
        // 字符多样性分数 (0-20分)
        long uniqueChars = password.chars().distinct().count();
        score += Math.min(20, (int)(uniqueChars * 2));
        
        // 复杂度奖励分数 (0-15分)
        if (!hasConsecutiveChars(password)) score += 5;
        if (!hasRepeatingChars(password)) score += 5;
        if (!hasKeyboardPattern(password)) score += 5;
        
        return Math.min(100, score);
    }
    
    /**
     * 检查是否有连续字符（如abc, 123）
     */
    private boolean hasConsecutiveChars(String password) {
        for (int i = 0; i < password.length() - 2; i++) {
            char c1 = password.charAt(i);
            char c2 = password.charAt(i + 1);
            char c3 = password.charAt(i + 2);
            
            if (c2 == c1 + 1 && c3 == c2 + 1) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * 检查是否有重复字符（如aaa, 111）
     */
    private boolean hasRepeatingChars(String password) {
        for (int i = 0; i < password.length() - 2; i++) {
            char c1 = password.charAt(i);
            char c2 = password.charAt(i + 1);
            char c3 = password.charAt(i + 2);
            
            if (c1 == c2 && c2 == c3) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * 检查是否有键盘模式（如qwerty, asdf）
     */
    private boolean hasKeyboardPattern(String password) {
        String[] keyboardRows = {
            "qwertyuiop",
            "asdfghjkl",
            "zxcvbnm",
            "1234567890"
        };
        
        String lowerPassword = password.toLowerCase();
        
        for (String row : keyboardRows) {
            for (int i = 0; i <= row.length() - 4; i++) {
                String pattern = row.substring(i, i + 4);
                if (lowerPassword.contains(pattern)) {
                    return true;
                }
            }
        }
        return false;
    }
    
    /**
     * 生成强密码建议
     */
    public List<String> getPasswordSuggestions() {
        List<String> suggestions = new ArrayList<>();
        suggestions.add("密码长度至少8位，建议12位以上");
        suggestions.add("包含大写字母(A-Z)、小写字母(a-z)、数字(0-9)和特殊字符");
        suggestions.add("避免使用个人信息（姓名、生日、电话等）");
        suggestions.add("避免使用常见密码（123456、password等）");
        suggestions.add("避免使用连续字符（abc、123）或重复字符（aaa、111）");
        suggestions.add("定期更换密码，不要在多个系统中使用相同密码");
        return suggestions;
    }
    
    /**
     * 密码验证结果类
     */
    public static class PasswordValidationResult {
        private final boolean valid;
        private final int strength;
        private final List<String> errors;
        private final List<String> warnings;
        
        public PasswordValidationResult(boolean valid, int strength, List<String> errors, List<String> warnings) {
            this.valid = valid;
            this.strength = strength;
            this.errors = errors;
            this.warnings = warnings;
        }
        
        public boolean isValid() {
            return valid;
        }
        
        public int getStrength() {
            return strength;
        }
        
        public String getStrengthText() {
            if (strength >= 80) return "强";
            if (strength >= 60) return "中等";
            if (strength >= 40) return "较弱";
            return "弱";
        }
        
        public List<String> getErrors() {
            return errors;
        }
        
        public List<String> getWarnings() {
            return warnings;
        }
        
        public boolean hasErrors() {
            return !errors.isEmpty();
        }
        
        public boolean hasWarnings() {
            return !warnings.isEmpty();
        }
    }
}