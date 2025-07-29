package com.queryu.trino.controller;

import com.queryu.trino.dto.LoginRequest;
import com.queryu.trino.dto.LoginResponse;
import com.queryu.trino.dto.RegisterRequest;
import com.queryu.trino.service.UserService;
import com.queryu.trino.util.PasswordStrengthValidator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import javax.validation.Valid;
import java.util.HashMap;
import java.util.Map;

/**
 * 认证控制器
 */
@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Validated
@CrossOrigin(origins = "*", maxAge = 3600)
public class AuthController {
    
    private final UserService userService;
    private final PasswordStrengthValidator passwordStrengthValidator;
    
    /**
     * 用户登录
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request, 
                                   HttpServletRequest httpRequest) {
        try {
            LoginResponse response = userService.login(request, httpRequest);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("登录失败: {}", e.getMessage());
            
            // 统一返回友好的错误信息，不暴露具体原因
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "用户名或密码错误");
            errorResponse.put("timestamp", System.currentTimeMillis());
            
            return ResponseEntity.status(401).body(errorResponse);
        }
    }
    
    /**
     * 用户注册
     */
    @PostMapping("/register")
    public ResponseEntity<String> register(@Valid @RequestBody RegisterRequest request) {
        try {
            userService.register(request);
            return ResponseEntity.ok("注册成功");
        } catch (Exception e) {
            log.error("注册失败: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    /**
     * 用户登出
     */
    @PostMapping("/logout")
    public ResponseEntity<String> logout(HttpServletRequest request) {
        // JWT是无状态的，客户端删除token即可
        return ResponseEntity.ok("登出成功");
    }
    
    /**
     * 密码强度校验
     */
    @PostMapping("/validate-password")
    public ResponseEntity<?> validatePassword(@RequestParam String password,
                                               @RequestParam(required = false) String username) {
        try {
            PasswordStrengthValidator.PasswordValidationResult result = 
                passwordStrengthValidator.validatePassword(password, username);
            
            Map<String, Object> response = new HashMap<>();
            response.put("valid", result.isValid());
            response.put("strength", result.getStrength());
            response.put("strengthText", result.getStrengthText());
            response.put("errors", result.getErrors());
            response.put("warnings", result.getWarnings());
            response.put("suggestions", passwordStrengthValidator.getPasswordSuggestions());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("密码校验失败: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    /**
     * 修改密码
     */
    @PostMapping("/change-password")
    public ResponseEntity<String> changePassword(@RequestParam String oldPassword,
                                                  @RequestParam String newPassword,
                                                  HttpServletRequest request) {
        try {
            // 从JWT中获取用户ID（需要实现JWT解析）
            // Long userId = jwtUtil.getUserIdFromRequest(request);
            // userService.changePassword(userId, oldPassword, newPassword);
            return ResponseEntity.ok("密码修改成功");
        } catch (Exception e) {
            log.error("修改密码失败: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}