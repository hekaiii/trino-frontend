package com.queryu.trino.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.queryu.trino.dto.LoginRequest;
import com.queryu.trino.dto.LoginResponse;
import com.queryu.trino.dto.RegisterRequest;
import com.queryu.trino.entity.User;
import com.queryu.trino.mapper.UserMapper;
import com.queryu.trino.util.JwtUtil;
import com.queryu.trino.util.PasswordUtil;
import com.queryu.trino.util.PasswordStrengthValidator;
import com.queryu.trino.util.PasswordTransferEncoder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.util.Optional;

/**
 * 用户服务类
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {
    
    private final UserMapper userMapper;
    private final JwtUtil jwtUtil;
    private final PasswordStrengthValidator passwordStrengthValidator;
    private final PasswordTransferEncoder passwordTransferEncoder;
    
    /**
     * 用户登录
     */
    @Transactional
    public LoginResponse login(LoginRequest request, HttpServletRequest httpRequest) {
        log.info("用户登录尝试: {}", request.getUsername());
        
        // 查询用户
        User user = userMapper.selectByUsername(request.getUsername());
        if (user == null) {
            throw new RuntimeException("用户名或密码错误");
        }
        
        // 检查用户状态
        if (!User.UserStatus.ENABLED.getCode().equals(user.getStatus())) {
            throw new RuntimeException("用户已被禁用");
        }
        
        // 解码前端传输的编码密码
        String decodedPassword = passwordTransferEncoder.decodePassword(request.getPassword());
        log.debug("密码解码完成，开始验证用户: {}", request.getUsername());
        
        // 验证密码
        if (!PasswordUtil.verifyPassword(decodedPassword, user.getPassword(), user.getSalt())) {
            log.warn("用户登录失败，密码错误: {}", request.getUsername());
            throw new RuntimeException("用户名或密码错误");
        }
        
        // 更新最后登录信息
        user.setLastLoginTime(LocalDateTime.now());
        user.setLastLoginIp(getClientIpAddress(httpRequest));
        userMapper.updateById(user);
        
        // 生成JWT token
        String token = jwtUtil.generateToken(user.getUsername(), user.getId(), user.getRole().getCode());
        
        log.info("用户登录成功: {}", request.getUsername());
        return LoginResponse.builder()
                .token(token)
                .userId(user.getId())
                .username(user.getUsername())
                .realName(user.getRealName())
                .email(user.getEmail())
                .role(user.getRole().getCode())
                .lastLoginTime(user.getLastLoginTime())
                .build();
    }
    
    /**
     * 用户注册
     */
    @Transactional
    public void register(RegisterRequest request) {
        log.info("用户注册: {}", request.getUsername());
        
        // 检查用户名是否已存在
        if (userMapper.existsByUsername(request.getUsername())) {
            throw new RuntimeException("用户名已存在");
        }
        
        // 检查邮箱是否已存在
        if (request.getEmail() != null && userMapper.existsByEmail(request.getEmail())) {
            throw new RuntimeException("邮箱已被注册");
        }
        
        // 解码前端传输的编码密码
        String decodedPassword = passwordTransferEncoder.decodePassword(request.getPassword());
        
        // 密码强度校验
        PasswordStrengthValidator.PasswordValidationResult passwordResult = 
            passwordStrengthValidator.validatePassword(decodedPassword, request.getUsername());
        
        if (!passwordResult.isValid()) {
            String errorMessage = "密码强度不符合要求: " + String.join("; ", passwordResult.getErrors());
            throw new RuntimeException(errorMessage);
        }
        
        // 记录密码强度警告（如果有）
        if (passwordResult.hasWarnings()) {
            log.warn("用户{}注册时密码存在安全风险: {}", request.getUsername(), 
                String.join("; ", passwordResult.getWarnings()));
        }
        
        log.info("用户{}密码强度: {} ({}分)", request.getUsername(), 
            passwordResult.getStrengthText(), passwordResult.getStrength());
        
        // 生成盐值和加密密码
        String salt = PasswordUtil.generateSalt();
        String encryptedPassword = PasswordUtil.encryptPassword(decodedPassword, salt);
        
        // 创建用户
        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(encryptedPassword);
        user.setSalt(salt);
        user.setEmail(request.getEmail());
        user.setRealName(request.getRealName());
        user.setPhone(request.getPhone());
        user.setRole(User.UserRole.USER);
        user.setStatus(User.UserStatus.ENABLED.getCode());
        
        userMapper.insert(user);
        log.info("用户注册成功: {}", request.getUsername());
    }
    
    /**
     * 根据用户名查询用户
     */
    public Optional<User> findByUsername(String username) {
        User user = userMapper.selectByUsername(username);
        return Optional.ofNullable(user);
    }
    
    /**
     * 根据ID查询用户
     */
    public Optional<User> findById(Long id) {
        User user = userMapper.selectById(id);
        return Optional.ofNullable(user);
    }
    
    /**
     * 修改密码
     */
    @Transactional
    public void changePassword(Long userId, String oldPassword, String newPassword) {
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new RuntimeException("用户不存在");
        }
        
        // 解码旧密码和新密码
        String decodedOldPassword = passwordTransferEncoder.decodePassword(oldPassword);
        String decodedNewPassword = passwordTransferEncoder.decodePassword(newPassword);
        
        // 验证旧密码
        if (!PasswordUtil.verifyPassword(decodedOldPassword, user.getPassword(), user.getSalt())) {
            throw new RuntimeException("原密码错误");
        }
        
        // 新密码强度校验
        PasswordStrengthValidator.PasswordValidationResult passwordResult = 
            passwordStrengthValidator.validatePassword(decodedNewPassword, user.getUsername());
        
        if (!passwordResult.isValid()) {
            String errorMessage = "新密码强度不符合要求: " + String.join("; ", passwordResult.getErrors());
            throw new RuntimeException(errorMessage);
        }
        
        // 检查新密码是否与旧密码相同
        if (PasswordUtil.verifyPassword(decodedNewPassword, user.getPassword(), user.getSalt())) {
            throw new RuntimeException("新密码不能与旧密码相同");
        }
        
        // 记录密码强度信息
        log.info("用户{}修改密码，新密码强度: {} ({}分)", user.getUsername(), 
            passwordResult.getStrengthText(), passwordResult.getStrength());
        
        // 生成新的盐值和加密新密码
        String newSalt = PasswordUtil.generateSalt();
        String newEncryptedPassword = PasswordUtil.encryptPassword(decodedNewPassword, newSalt);
        
        user.setPassword(newEncryptedPassword);
        user.setSalt(newSalt);
        userMapper.updateById(user);
        
        log.info("用户修改密码成功: {}", user.getUsername());
    }
    
    /**
     * 获取客户端IP地址
     */
    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty() && !"unknown".equalsIgnoreCase(xForwardedFor)) {
            return xForwardedFor.split(",")[0].trim();
        }
        
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty() && !"unknown".equalsIgnoreCase(xRealIp)) {
            return xRealIp;
        }
        
        return request.getRemoteAddr();
    }
}