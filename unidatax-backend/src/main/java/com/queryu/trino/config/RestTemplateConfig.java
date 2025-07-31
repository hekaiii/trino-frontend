package com.queryu.trino.config;

import org.apache.http.conn.ssl.NoopHostnameVerifier;
import org.apache.http.conn.ssl.SSLConnectionSocketFactory;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.ssl.SSLContextBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

import javax.net.ssl.SSLContext;

/**
 * RestTemplate配置类
 * 用于Trino HTTP客户端，支持HTTPS自签名证书
 */
@Configuration
public class RestTemplateConfig {

    @Bean
    public RestTemplate restTemplate() {
        try {
            // 创建忽略SSL证书验证的SSLContext
            SSLContext sslContext = SSLContextBuilder.create()
                    .loadTrustMaterial((certificate, authType) -> true) // 信任所有证书
                    .build();

            // 创建SSLConnectionSocketFactory
            SSLConnectionSocketFactory sslConnectionSocketFactory = new SSLConnectionSocketFactory(
                    sslContext,
                    NoopHostnameVerifier.INSTANCE // 忽略主机名验证
            );

            // 创建HttpClient
            CloseableHttpClient httpClient = HttpClients.custom()
                    .setSSLSocketFactory(sslConnectionSocketFactory)
                    .build();

            // 创建HttpComponentsClientHttpRequestFactory
            HttpComponentsClientHttpRequestFactory factory = new HttpComponentsClientHttpRequestFactory();
            factory.setHttpClient(httpClient);
            factory.setConnectTimeout(30000); // 连接超时30秒
            factory.setReadTimeout(60000);    // 读取超时60秒

            return new RestTemplate(factory);
            
        } catch (Exception e) {
            throw new RuntimeException("Failed to create RestTemplate", e);
        }
    }
}