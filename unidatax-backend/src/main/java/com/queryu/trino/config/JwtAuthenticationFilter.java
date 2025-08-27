package com.queryu.trino.config;

import com.queryu.trino.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Arrays;

/**
 * JWT认证过滤器
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    
    private final JwtUtil jwtUtil;
    
    @Override
    protected void doFilterInternal(HttpServletRequest request, 
                                    HttpServletResponse response, 
                                    FilterChain filterChain) throws ServletException, IOException {
        
        String requestURI = request.getRequestURI();
        log.debug("JWT过滤器处理请求: {} {}", request.getMethod(), requestURI);
        
        try {
            String authHeader = request.getHeader("Authorization");
            log.debug("Authorization头: {}", authHeader);
            
            String token = jwtUtil.getTokenFromRequest(request);
            log.debug("提取的token: {}", token != null ? "存在(长度:" + token.length() + ")" : "null");
            
            if (token != null && jwtUtil.validateToken(token)) {
                String username = jwtUtil.getUsernameFromToken(token);
                String role = jwtUtil.getRoleFromToken(token);
                Long userId = jwtUtil.getUserIdFromToken(token);
                
                log.info("JWT token验证成功 - 用户: {}, 角色: {}, ID: {}", username, role, userId);
                
                // 创建认证对象
                UsernamePasswordAuthenticationToken authentication = 
                    new UsernamePasswordAuthenticationToken(
                        username, 
                        null, 
                        Arrays.asList(new SimpleGrantedAuthority("ROLE_" + role.toUpperCase()))
                    );
                
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authentication);
                
                // 将用户信息添加到请求属性中，方便Controller使用
                request.setAttribute("userId", userId);
                request.setAttribute("username", username);
                request.setAttribute("role", role);
            } else {
                log.debug("Token验证失败或token为空");
            }
        } catch (Exception e) {
            log.error("JWT认证过滤器处理异常: {}", e.getMessage(), e);
            SecurityContextHolder.clearContext();
        }
        
        filterChain.doFilter(request, response);
    }
}