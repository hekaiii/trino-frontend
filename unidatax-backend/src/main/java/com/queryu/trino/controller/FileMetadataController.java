package com.queryu.trino.controller;

import com.queryu.trino.dto.ApiResponse;
import com.queryu.trino.entity.FileMetadata;
import com.queryu.trino.service.FileMetadataService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import javax.validation.Valid;
import javax.validation.constraints.NotBlank;
import java.util.List;

/**
 * 文件元数据控制器
 */
@Slf4j
@RestController
@RequestMapping("/api/file-metadata")
@RequiredArgsConstructor
@Validated
@CrossOrigin(origins = "*", maxAge = 3600)
public class FileMetadataController {
    
    private final FileMetadataService fileMetadataService;
    
    /**
     * 自动解析文件元数据请求DTO
     */
    @Data
    public static class ParseMetadataRequest {
        @NotBlank(message = "文件路径不能为空")
        private String filePath;
        
        @NotBlank(message = "文件内容不能为空")
        private String fileContent;
        
        @NotBlank(message = "文件类型不能为空")
        private String fileType;
        
        @NotBlank(message = "Catalog名称不能为空")
        private String catalogName;
        
        private String schemaName;
        
        private String bucketName;
        
        @NotBlank(message = "文件名不能为空")
        private String fileName;
    }
    
    /**
     * 手动添加元数据请求DTO
     */
    @Data
    public static class ManualMetadataRequest {
        @NotBlank(message = "文件路径不能为空")
        private String filePath;
        
        @NotBlank(message = "Catalog名称不能为空")
        private String catalogName;
        
        private String schemaName;
        
        private String bucketName;
        
        @NotBlank(message = "文件名不能为空")
        private String fileName;
        
        @NotBlank(message = "文件类型不能为空")
        private String fileType;
        
        @NotBlank(message = "元数据键不能为空")
        private String metadataKey;
        
        @NotBlank(message = "元数据值不能为空")
        private String metadataValue;
    }
    
    /**
     * 更新元数据请求DTO
     */
    @Data
    public static class UpdateMetadataRequest {
        @NotBlank(message = "元数据值不能为空")
        private String metadataValue;
    }
    
    /**
     * 自动解析文件元数据
     */
    @PostMapping("/parse-auto")
    public ResponseEntity<ApiResponse> parseFileMetadataAuto(@Valid @RequestBody ParseMetadataRequest request,
                                                             HttpServletRequest httpRequest) {
        try {
            Long userId = (Long) httpRequest.getAttribute("userId");
            if (userId == null) {
                userId = 1L; // 默认用户ID
            }
            
            List<FileMetadata> metadataList = fileMetadataService.parseFileMetadata(
                    request.getFilePath(),
                    request.getFileContent(),
                    request.getFileType(),
                    request.getCatalogName(),
                    request.getSchemaName(),
                    request.getBucketName(),
                    request.getFileName(),
                    userId
            );
            
            return ResponseEntity.ok(ApiResponse.success(metadataList));
        } catch (Exception e) {
            log.error("自动解析文件元数据失败: {}", e.getMessage());
            return ResponseEntity.ok(ApiResponse.error("解析失败: " + e.getMessage()));
        }
    }
    
    /**
     * 手动添加元数据
     */
    @PostMapping("/manual")
    public ResponseEntity<ApiResponse> addManualMetadata(@Valid @RequestBody ManualMetadataRequest request,
                                                         HttpServletRequest httpRequest) {
        try {
            Long userId = (Long) httpRequest.getAttribute("userId");
            if (userId == null) {
                userId = 1L; // 默认用户ID
            }
            
            FileMetadata metadata = FileMetadata.builder()
                    .filePath(request.getFilePath())
                    .catalogName(request.getCatalogName())
                    .schemaName(request.getSchemaName())
                    .bucketName(request.getBucketName())
                    .fileName(request.getFileName())
                    .fileType(request.getFileType().toUpperCase())
                    .metadataKey(request.getMetadataKey())
                    .metadataValue(request.getMetadataValue())
                    .userId(userId)
                    .build();
            
            FileMetadata saved = fileMetadataService.addManualMetadata(metadata);
            return ResponseEntity.ok(ApiResponse.success(saved));
        } catch (Exception e) {
            log.error("手动添加元数据失败: {}", e.getMessage());
            return ResponseEntity.ok(ApiResponse.error("添加失败: " + e.getMessage()));
        }
    }
    
    /**
     * 获取文件的所有元数据
     */
    @GetMapping("/file")
    public ResponseEntity<ApiResponse> getFileMetadata(@RequestParam("filePath") String filePath) {
        try {
            List<FileMetadata> metadataList = fileMetadataService.getFileMetadata(filePath);
            return ResponseEntity.ok(ApiResponse.success(metadataList));
        } catch (Exception e) {
            log.error("获取文件元数据失败: {}", e.getMessage());
            return ResponseEntity.ok(ApiResponse.error("获取失败: " + e.getMessage()));
        }
    }
    
    /**
     * 更新元数据
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse> updateMetadata(@PathVariable Long id,
                                                      @Valid @RequestBody UpdateMetadataRequest request,
                                                      HttpServletRequest httpRequest) {
        try {
            Long userId = (Long) httpRequest.getAttribute("userId");
            if (userId == null) {
                userId = 1L; // 默认用户ID
            }
            
            FileMetadata updated = fileMetadataService.updateMetadata(id, request.getMetadataValue(), userId);
            return ResponseEntity.ok(ApiResponse.success(updated));
        } catch (Exception e) {
            log.error("更新元数据失败: {}", e.getMessage());
            return ResponseEntity.ok(ApiResponse.error("更新失败: " + e.getMessage()));
        }
    }
    
    /**
     * 删除单条元数据
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> deleteMetadata(@PathVariable Long id) {
        try {
            boolean success = fileMetadataService.deleteMetadata(id);
            if (success) {
                return ResponseEntity.ok(ApiResponse.success(null));
            } else {
                return ResponseEntity.ok(ApiResponse.error("删除失败"));
            }
        } catch (Exception e) {
            log.error("删除元数据失败: {}", e.getMessage());
            return ResponseEntity.ok(ApiResponse.error("删除失败: " + e.getMessage()));
        }
    }
    
    /**
     * 批量删除元数据
     */
    @DeleteMapping("/batch")
    public ResponseEntity<ApiResponse> deleteMetadataBatch(@RequestBody List<Long> ids) {
        try {
            boolean success = fileMetadataService.deleteMetadataBatch(ids);
            if (success) {
                return ResponseEntity.ok(ApiResponse.success(null));
            } else {
                return ResponseEntity.ok(ApiResponse.error("批量删除失败"));
            }
        } catch (Exception e) {
            log.error("批量删除元数据失败: {}", e.getMessage());
            return ResponseEntity.ok(ApiResponse.error("批量删除失败: " + e.getMessage()));
        }
    }
    
    /**
     * 删除文件的所有元数据
     */
    @DeleteMapping("/file/{filePath}")
    public ResponseEntity<ApiResponse> deleteFileMetadata(@PathVariable String filePath) {
        try {
            int count = fileMetadataService.deleteFileMetadata(filePath);
            return ResponseEntity.ok(ApiResponse.success(count));
        } catch (Exception e) {
            log.error("删除文件元数据失败: {}", e.getMessage());
            return ResponseEntity.ok(ApiResponse.error("删除失败: " + e.getMessage()));
        }
    }
}