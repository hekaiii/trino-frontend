package com.queryu.trino.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.queryu.trino.entity.FileMetadata;
import com.queryu.trino.mapper.FileMetadataMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 文件元数据服务实现类
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FileMetadataService extends ServiceImpl<FileMetadataMapper, FileMetadata> {
    
    private final FileMetadataMapper fileMetadataMapper;
    private final MetadataParserService metadataParserService;
    
    /**
     * 自动解析文件元数据
     */
    @Transactional
    public List<FileMetadata> parseFileMetadata(String filePath, String fileContent, String fileType,
                                                String catalogName, String schemaName, String bucketName,
                                                String fileName, Long userId) {
        try {
            // 解析文件内容
            Map<String, String> metadataMap = metadataParserService.parseContent(fileContent, fileType);
            
            // 删除该文件的旧自动解析元数据
            LambdaQueryWrapper<FileMetadata> deleteWrapper = new LambdaQueryWrapper<>();
            deleteWrapper.eq(FileMetadata::getFilePath, filePath)
                        .eq(FileMetadata::getExtractionType, "AUTO");
            this.remove(deleteWrapper);
            
            // 创建新的元数据记录
            List<FileMetadata> metadataList = new ArrayList<>();
            for (Map.Entry<String, String> entry : metadataMap.entrySet()) {
                FileMetadata metadata = FileMetadata.builder()
                        .filePath(filePath)
                        .catalogName(catalogName)
                        .schemaName(schemaName)
                        .bucketName(bucketName)
                        .fileName(fileName)
                        .fileType(fileType.toUpperCase())
                        .metadataKey(entry.getKey())
                        .metadataValue(entry.getValue())
                        .extractionType("AUTO")
                        .userId(userId)
                        .createTime(LocalDateTime.now())
                        .updateTime(LocalDateTime.now())
                        .build();
                metadataList.add(metadata);
            }
            
            // 批量保存
            if (!metadataList.isEmpty()) {
                this.saveBatch(metadataList);
            }
            
            return metadataList;
        } catch (Exception e) {
            log.error("解析文件元数据失败: {}", e.getMessage());
            throw new RuntimeException("解析文件元数据失败: " + e.getMessage());
        }
    }
    
    /**
     * 手动添加元数据
     */
    @Transactional
    public FileMetadata addManualMetadata(FileMetadata metadata) {
        metadata.setExtractionType("MANUAL");
        metadata.setCreateTime(LocalDateTime.now());
        metadata.setUpdateTime(LocalDateTime.now());
        
        // 检查是否已存在相同的key
        LambdaQueryWrapper<FileMetadata> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(FileMetadata::getFilePath, metadata.getFilePath())
                   .eq(FileMetadata::getMetadataKey, metadata.getMetadataKey());
        
        FileMetadata existing = this.getOne(queryWrapper);
        if (existing != null) {
            // 更新现有记录
            existing.setMetadataValue(metadata.getMetadataValue());
            existing.setExtractionType("MANUAL");
            existing.setUpdateTime(LocalDateTime.now());
            existing.setUserId(metadata.getUserId());
            this.updateById(existing);
            return existing;
        } else {
            // 创建新记录
            this.save(metadata);
            return metadata;
        }
    }
    
    /**
     * 获取文件的所有元数据
     */
    public List<FileMetadata> getFileMetadata(String filePath) {
        return fileMetadataMapper.selectByFilePath(filePath);
    }
    
    /**
     * 更新元数据
     */
    @Transactional
    public FileMetadata updateMetadata(Long id, String metadataValue, Long userId) {
        FileMetadata metadata = this.getById(id);
        if (metadata == null) {
            throw new RuntimeException("元数据不存在");
        }
        
        metadata.setMetadataValue(metadataValue);
        metadata.setUpdateTime(LocalDateTime.now());
        metadata.setUserId(userId);
        this.updateById(metadata);
        
        return metadata;
    }
    
    /**
     * 删除单条元数据
     */
    @Transactional
    public boolean deleteMetadata(Long id) {
        return this.removeById(id);
    }
    
    /**
     * 删除文件的所有元数据
     */
    @Transactional
    public int deleteFileMetadata(String filePath) {
        return fileMetadataMapper.deleteByFilePath(filePath);
    }
    
    /**
     * 批量删除元数据
     */
    @Transactional
    public boolean deleteMetadataBatch(List<Long> ids) {
        return this.removeByIds(ids);
    }
}