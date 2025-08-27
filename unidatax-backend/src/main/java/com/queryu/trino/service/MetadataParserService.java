package com.queryu.trino.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;

/**
 * 元数据解析服务
 */
@Slf4j
@Service
public class MetadataParserService {
    
    private static final ObjectMapper objectMapper = new ObjectMapper();
    private static final int MAX_DEPTH = 10; // 最大解析深度
    private static final int MAX_KEYS = 1000; // 最大键数量
    
    /**
     * 解析文件内容
     */
    public Map<String, String> parseContent(String content, String fileType) {
        if (content == null || content.trim().isEmpty()) {
            throw new IllegalArgumentException("文件内容不能为空");
        }
        
        Map<String, String> result = new HashMap<>();
        
        try {
            if ("JSON".equalsIgnoreCase(fileType)) {
                parseJson(content, result);
            } else if ("XML".equalsIgnoreCase(fileType)) {
                parseXml(content, result);
            } else {
                throw new IllegalArgumentException("不支持的文件类型: " + fileType);
            }
        } catch (Exception e) {
            log.error("解析文件内容失败: {}", e.getMessage());
            throw new RuntimeException("解析文件内容失败: " + e.getMessage());
        }
        
        return result;
    }
    
    /**
     * 解析JSON内容
     */
    private void parseJson(String jsonContent, Map<String, String> result) throws Exception {
        JsonNode rootNode = objectMapper.readTree(jsonContent);
        parseJsonNode(rootNode, "", result, 0);
    }
    
    /**
     * 递归解析JSON节点
     */
    private void parseJsonNode(JsonNode node, String prefix, Map<String, String> result, int depth) {
        if (depth > MAX_DEPTH || result.size() >= MAX_KEYS) {
            return;
        }
        
        if (node.isObject()) {
            Iterator<Map.Entry<String, JsonNode>> fields = node.fields();
            while (fields.hasNext() && result.size() < MAX_KEYS) {
                Map.Entry<String, JsonNode> field = fields.next();
                String key = field.getKey();
                JsonNode value = field.getValue();
                String fullKey = prefix.isEmpty() ? key : prefix + "." + key;
                
                if (value.isValueNode()) {
                    // 叶子节点，直接存储值
                    result.put(fullKey, value.asText());
                } else if (value.isArray()) {
                    // 数组节点，存储数组长度
                    result.put(fullKey + ".length", String.valueOf(value.size()));
                    // 解析数组的第一个元素作为示例
                    if (value.size() > 0 && !value.get(0).isArray()) {
                        parseJsonNode(value.get(0), fullKey + "[0]", result, depth + 1);
                    }
                } else {
                    // 对象节点，递归解析
                    parseJsonNode(value, fullKey, result, depth + 1);
                }
            }
        } else if (node.isArray()) {
            result.put(prefix + ".length", String.valueOf(node.size()));
            if (node.size() > 0 && !node.get(0).isArray()) {
                parseJsonNode(node.get(0), prefix + "[0]", result, depth + 1);
            }
        } else if (node.isValueNode()) {
            result.put(prefix, node.asText());
        }
    }
    
    /**
     * 解析XML内容
     */
    private void parseXml(String xmlContent, Map<String, String> result) throws Exception {
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        // 防止XXE攻击
        factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
        factory.setFeature("http://xml.org/sax/features/external-general-entities", false);
        factory.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
        
        DocumentBuilder builder = factory.newDocumentBuilder();
        Document document = builder.parse(new ByteArrayInputStream(xmlContent.getBytes(StandardCharsets.UTF_8)));
        
        Element root = document.getDocumentElement();
        parseXmlNode(root, "", result, 0);
    }
    
    /**
     * 递归解析XML节点
     */
    private void parseXmlNode(Node node, String prefix, Map<String, String> result, int depth) {
        if (depth > MAX_DEPTH || result.size() >= MAX_KEYS) {
            return;
        }
        
        if (node.getNodeType() != Node.ELEMENT_NODE) {
            return;
        }
        
        Element element = (Element) node;
        String nodeName = element.getNodeName();
        String fullKey = prefix.isEmpty() ? nodeName : prefix + "." + nodeName;
        
        // 获取节点属性
        if (element.hasAttributes()) {
            for (int i = 0; i < element.getAttributes().getLength() && result.size() < MAX_KEYS; i++) {
                Node attr = element.getAttributes().item(i);
                result.put(fullKey + "@" + attr.getNodeName(), attr.getNodeValue());
            }
        }
        
        // 获取子节点
        NodeList children = element.getChildNodes();
        if (children.getLength() == 1 && children.item(0).getNodeType() == Node.TEXT_NODE) {
            // 只有文本内容的节点
            String textContent = children.item(0).getTextContent().trim();
            if (!textContent.isEmpty()) {
                result.put(fullKey, textContent);
            }
        } else {
            // 有子元素的节点
            Map<String, Integer> childCount = new HashMap<>();
            for (int i = 0; i < children.getLength() && result.size() < MAX_KEYS; i++) {
                Node child = children.item(i);
                if (child.getNodeType() == Node.ELEMENT_NODE) {
                    String childName = child.getNodeName();
                    int count = childCount.getOrDefault(childName, 0);
                    childCount.put(childName, count + 1);
                    
                    // 如果有多个同名子节点，添加索引
                    String childPrefix = count > 0 ? fullKey + "." + childName + "[" + count + "]" : fullKey;
                    parseXmlNode(child, childPrefix, result, depth + 1);
                }
            }
        }
    }
    
    /**
     * 验证元数据键的格式
     */
    public static boolean isValidMetadataKey(String key) {
        if (key == null || key.trim().isEmpty()) {
            return false;
        }
        // 允许字母、数字、点、下划线、中划线、@符号（用于XML属性）和方括号（用于数组索引）
        return key.matches("^[a-zA-Z0-9._\\-@\\[\\]]+$");
    }
}