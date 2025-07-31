package com.queryu.trino;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.core.env.Environment;
import org.springframework.transaction.annotation.EnableTransactionManagement;

/**
 * UnidataX 后端应用启动类
 * 
 * @author UnidataX Team
 * @version 1.0.0
 */
@SpringBootApplication
@EnableTransactionManagement
public class TrinoBackendApplication {

    public static void main(String[] args) {
        org.springframework.context.ConfigurableApplicationContext context = SpringApplication.run(TrinoBackendApplication.class, args);
        Environment env = context.getEnvironment();
        String port = env.getProperty("server.port", "8080");
        String contextPath = env.getProperty("server.servlet.context-path", "");
        if (contextPath == null || contextPath.isEmpty()) {
            contextPath = "";
        } else if (!contextPath.startsWith("/")) {
            contextPath = "/" + contextPath;
        }
        
        String baseUrl = "http://localhost:" + port + contextPath;
        
        System.out.println("===========================================");
        System.out.println("🚀 UnidataX Backend Started Successfully!");
        System.out.println("📱 Frontend: " + baseUrl);
        System.out.println("🔗 API Base: " + baseUrl + "/api");
        System.out.println("📖 API Docs: " + baseUrl + "/swagger-ui.html");
        System.out.println("===========================================");
    }
}