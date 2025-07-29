package com.queryu.trino;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.transaction.annotation.EnableTransactionManagement;

/**
 * Trino Frontend 后端应用启动类
 * 
 * @author QueryU Team
 * @version 1.0.0
 */
@SpringBootApplication
@EnableTransactionManagement
public class TrinoBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(TrinoBackendApplication.class, args);
        System.out.println("===========================================");
        System.out.println("🚀 Trino Frontend Backend Started Successfully!");
        System.out.println("📱 Frontend: http://localhost:8080");
        System.out.println("🔗 API Base: http://localhost:8080/api");
        System.out.println("📖 API Docs: http://localhost:8080/swagger-ui.html");
        System.out.println("===========================================");
    }
}