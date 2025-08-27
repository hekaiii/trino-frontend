package com.queryu.trino.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

/**
 * Spring Security 配置
 */
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig extends WebSecurityConfigurerAdapter {
    
    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http
            // 禁用CSRF（对于API来说通常不需要）
            .csrf().disable()
            
            // 配置CORS
            .cors().configurationSource(corsConfigurationSource())
            
            .and()
            
            // 配置session管理为无状态（使用JWT）
            .sessionManagement()
            .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            
            .and()
            
            // 配置URL访问权限
            .authorizeRequests()
                // 允许认证相关端点无需验证
                .antMatchers("/api/auth/**").permitAll()
                // 允许健康检查端点
                .antMatchers("/actuator/health/**").permitAll()
                // 允许静态资源和主页
                .antMatchers("/", "/static/**", "/*.js", "/*.css", "/*.html", "/favicon.ico").permitAll()
                // 文件元数据API允许无认证访问
                .antMatchers("/api/file-metadata/**").permitAll()
                // 其他所有请求需要认证
                .anyRequest().authenticated()
            
            .and()
            
            // 禁用默认登录页面
            .formLogin().disable()
            
            // 禁用HTTP Basic认证
            .httpBasic().disable()
            
            // 添加JWT认证过滤器
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
    }

    /**
     * CORS配置
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // 允许的源
        configuration.setAllowedOriginPatterns(Arrays.asList("*"));
        
        // 允许的HTTP方法
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        
        // 允许的请求头
        configuration.setAllowedHeaders(Arrays.asList("*"));
        
        // 允许发送认证信息（如cookies）
        configuration.setAllowCredentials(true);
        
        // 预检请求的缓存时间
        configuration.setMaxAge(3600L);
        
        // 应用到所有路径
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        
        return source;
    }

    /**
     * 密码编码器
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}