package com.queryu.trino.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.concurrent.TimeUnit;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import org.springframework.boot.web.client.RestTemplateBuilder;
import java.time.Duration;

/**
 * Trino查询服务
 */
@Slf4j
@Service
public class TrinoService {

    @Value("${app.external.trino.url:https://trino-http.test.unicom.local:16000}")
    private String trinoBaseUrl;

    @Value("${app.external.trino.username:admin}")
    private String trinoUsername;

    @Value("${app.external.trino.password:rs{=uzW$UZ4v{BR!}")
    private String trinoPassword;

    @Value("${app.external.trino.timeout:60000}")
    private Long trinoTimeout;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public TrinoService(RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }
    
    /**
     * 创建带Basic认证的RestTemplate
     */
    private RestTemplate createAuthenticatedRestTemplate() {
        return new RestTemplateBuilder()
                .basicAuthentication(trinoUsername, trinoPassword)
                .setConnectTimeout(Duration.ofMillis(30000))
                .setReadTimeout(Duration.ofMillis(60000))
                .requestFactory(() -> restTemplate.getRequestFactory()) // 使用相同的SSL配置
                .build();
    }

    /**
     * 执行SQL查询
     */
    public Map<String, Object> executeQuery(String sql) {
        log.info("开始执行Trino查询: {} (服务地址: {})", sql, trinoBaseUrl);
        
        // 创建带Basic认证的RestTemplate
        RestTemplate authRestTemplate = createAuthenticatedRestTemplate();
        
        try {
            // 第一步：提交SQL语句到Trino
            String statementUrl = trinoBaseUrl + "/v1/statement";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.TEXT_PLAIN);
            headers.set("X-Trino-User", trinoUsername);
            // Basic Auth已经通过RestTemplate设置，不需要手动添加
            
            HttpEntity<String> entity = new HttpEntity<>(sql, headers);
            
            log.info("提交SQL到Trino: {} (用户: {})", statementUrl, trinoUsername);
            ResponseEntity<String> response = authRestTemplate.postForEntity(statementUrl, entity, String.class);
            
            if (response.getStatusCode() != HttpStatus.OK) {
                throw new RuntimeException("Trino查询提交失败: " + response.getStatusCode());
            }
            
            JsonNode currentData = objectMapper.readTree(response.getBody());
            log.info("Trino初始响应状态: {}", currentData.path("stats").path("state").asText());
            
            // 第二步：循环获取查询结果
            List<List<Object>> allResults = new ArrayList<>();
            int maxRetries = 100;
            int retryCount = 0;
            
            while (currentData.has("nextUri") && retryCount < maxRetries) {
                String nextUri = currentData.get("nextUri").asText();
                String state = currentData.path("stats").path("state").asText();
                
                log.info("获取下一批结果 (尝试 {}/{}): 状态={}", retryCount + 1, maxRetries, state);
                
                // 根据查询状态调整等待时间
                if ("QUEUED".equals(state) || "PLANNING".equals(state)) {
                    Thread.sleep(500);
                } else if ("RUNNING".equals(state)) {
                    Thread.sleep(200);
                }
                
                try {
                    HttpHeaders nextHeaders = new HttpHeaders();
                    nextHeaders.set("X-Trino-User", trinoUsername);
                    // Basic Auth已经通过RestTemplate设置，不需要手动添加
                    
                    HttpEntity<Void> nextEntity = new HttpEntity<>(nextHeaders);
                    
                    ResponseEntity<String> nextResponse = authRestTemplate.exchange(
                        nextUri, HttpMethod.GET, nextEntity, String.class
                    );
                    
                    if (nextResponse.getStatusCode() != HttpStatus.OK) {
                        throw new RuntimeException("获取查询结果失败: " + nextResponse.getStatusCode());
                    }
                    
                    currentData = objectMapper.readTree(nextResponse.getBody());
                    
                    // 收集数据
                    if (currentData.has("data") && currentData.get("data").isArray()) {
                        JsonNode dataArray = currentData.get("data");
                        for (JsonNode row : dataArray) {
                            List<Object> rowData = new ArrayList<>();
                            for (JsonNode cell : row) {
                                rowData.add(cell.isNull() ? null : cell.asText());
                            }
                            allResults.add(rowData);
                        }
                        log.info("新增 {} 行数据，总计: {} 行", dataArray.size(), allResults.size());
                    }
                    
                    // 检查查询状态
                    String newState = currentData.path("stats").path("state").asText();
                    if ("FAILED".equals(newState)) {
                        String errorMessage = currentData.path("error").path("message").asText("Query execution failed");
                        throw new RuntimeException("Trino查询失败: " + errorMessage);
                    }
                    
                    if ("FINISHED".equals(newState)) {
                        log.info("查询执行完成");
                        break;
                    }
                    
                } catch (Exception e) {
                    log.error("获取查询结果时出错: {}", e.getMessage());
                    if (e.getMessage().contains("Connection") || e.getMessage().contains("timeout")) {
                        Thread.sleep(1000);
                        retryCount++;
                        continue;
                    }
                    throw e;
                }
                
                retryCount++;
            }
            
            if (retryCount >= maxRetries) {
                log.warn("达到最大重试次数限制");
            }
            
            // 第三步：构造返回结果
            Map<String, Object> result = new HashMap<>();
            result.put("queryId", currentData.path("id").asText());
            result.put("state", currentData.path("stats").path("state").asText());
            
            // 处理列信息
            List<Map<String, String>> columns = new ArrayList<>();
            if (currentData.has("columns")) {
                for (JsonNode column : currentData.get("columns")) {
                    Map<String, String> col = new HashMap<>();
                    col.put("name", column.path("name").asText());
                    col.put("type", column.path("type").asText());
                    columns.add(col);
                }
            }
            result.put("columns", columns);
            result.put("data", allResults);
            
            // 统计信息
            Map<String, Object> stats = new HashMap<>();
            JsonNode statsNode = currentData.path("stats");
            stats.put("state", statsNode.path("state").asText());
            stats.put("totalRows", allResults.size());
            stats.put("executionTimeMillis", statsNode.path("elapsedTimeMillis").asLong());
            result.put("stats", stats);
            
            log.info("查询执行成功: 返回 {} 行数据", allResults.size());
            return result;
            
        } catch (Exception e) {
            log.error("Trino查询执行失败: {}", e.getMessage(), e);
            throw new RuntimeException("查询执行失败: " + e.getMessage(), e);
        }
    }
}