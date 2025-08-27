package com.queryu.trino.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.queryu.trino.entity.FileMetadata;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 文件元数据Mapper接口
 */
@Mapper
public interface FileMetadataMapper extends BaseMapper<FileMetadata> {
    
    /**
     * 根据文件路径查询所有元数据
     */
    @Select("SELECT * FROM t_file_metadata WHERE file_path = #{filePath} ORDER BY metadata_key")
    List<FileMetadata> selectByFilePath(@Param("filePath") String filePath);
    
    /**
     * 根据catalog和schema查询元数据
     */
    @Select("SELECT * FROM t_file_metadata WHERE catalog_name = #{catalogName} " +
            "AND (schema_name = #{schemaName} OR schema_name IS NULL) ORDER BY file_path, metadata_key")
    List<FileMetadata> selectByCatalogAndSchema(@Param("catalogName") String catalogName, 
                                                @Param("schemaName") String schemaName);
    
    /**
     * 删除文件的所有元数据
     */
    @Select("DELETE FROM t_file_metadata WHERE file_path = #{filePath}")
    int deleteByFilePath(@Param("filePath") String filePath);
}