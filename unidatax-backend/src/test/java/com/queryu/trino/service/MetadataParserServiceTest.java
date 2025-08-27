package com.queryu.trino.service;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * MetadataParserService 单元测试
 */
@SpringBootTest
public class MetadataParserServiceTest {
    
    private final MetadataParserService metadataParserService = new MetadataParserService();
    
    @Test
    public void testParseJsonContent() {
        // 测试JSON解析
        String jsonContent = "{" +
            "\"name\": \"test-config\"," +
            "\"database\": {" +
                "\"host\": \"localhost\"," +
                "\"port\": 3306," +
                "\"config\": {" +
                    "\"timeout\": 30," +
                    "\"maxConnections\": 100" +
                "}" +
            "}," +
            "\"features\": [\"feature1\", \"feature2\"]" +
        "}";
        
        Map<String, String> result = metadataParserService.parseContent(jsonContent, "JSON");
        
        // 验证解析结果
        assertNotNull(result);
        assertTrue(result.size() > 0);
        
        // 验证基本键值对
        assertEquals("test-config", result.get("name"));
        assertEquals("localhost", result.get("database.host"));
        assertEquals("3306", result.get("database.port"));
        assertEquals("30", result.get("database.config.timeout"));
        assertEquals("100", result.get("database.config.maxConnections"));
        
        // 验证数组处理
        assertEquals("2", result.get("features.length"));
        assertEquals("feature1", result.get("features[0]"));
        
        System.out.println("JSON解析结果: " + result);
    }
    
    @Test
    public void testParseXmlContent() {
        // 测试XML解析
        String xmlContent = "<configuration>" +
            "<property>" +
                "<name>fs.azure.user.agent.prefix</name>" +
                "<value>User-Agent: APN/1.0 Hortonworks/1.0 HDP/</value>" +
            "</property>" +
            "<property>" +
                "<name>database.host</name>" +
                "<value>localhost</value>" +
            "</property>" +
            "<settings>" +
                "<timeout>30</timeout>" +
                "<maxConnections>100</maxConnections>" +
            "</settings>" +
        "</configuration>";
        
        Map<String, String> result = metadataParserService.parseContent(xmlContent, "XML");
        
        // 验证解析结果
        assertNotNull(result);
        assertTrue(result.size() > 0);
        
        // 验证XML解析结果
        assertTrue(result.containsKey("configuration.property.name"));
        assertTrue(result.containsKey("configuration.property.value"));
        assertTrue(result.containsKey("configuration.settings.timeout"));
        assertTrue(result.containsKey("configuration.settings.maxConnections"));
        
        System.out.println("XML解析结果: " + result);
    }
    
    @Test
    public void testParseSimpleXml() {
        // 测试简单XML
        String simpleXml = "<property>" +
            "<name>test.key</name>" +
            "<value>test.value</value>" +
        "</property>";
        
        Map<String, String> result = metadataParserService.parseContent(simpleXml, "XML");
        
        assertNotNull(result);
        assertEquals("test.key", result.get("property.name"));
        assertEquals("test.value", result.get("property.value"));
        
        System.out.println("简单XML解析结果: " + result);
    }
    
    @Test
    public void testParseInvalidContent() {
        // 测试无效内容
        assertThrows(RuntimeException.class, () -> {
            metadataParserService.parseContent("invalid json content", "JSON");
        });
        
        assertThrows(RuntimeException.class, () -> {
            metadataParserService.parseContent("invalid xml content", "XML");
        });
    }
    
    @Test
    public void testUnsupportedFileType() {
        // 测试不支持的文件类型
        assertThrows(RuntimeException.class, () -> {
            metadataParserService.parseContent("some content", "UNSUPPORTED");
        });
    }
    
    @Test
    public void testEmptyContent() {
        // 测试空内容
        assertThrows(IllegalArgumentException.class, () -> {
            metadataParserService.parseContent("", "JSON");
        });
        
        assertThrows(IllegalArgumentException.class, () -> {
            metadataParserService.parseContent(null, "XML");
        });
    }
}