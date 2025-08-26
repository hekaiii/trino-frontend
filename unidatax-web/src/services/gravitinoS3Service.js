import axios from 'axios';
import { s3Configurations, extractS3ConfigFromCatalog } from '../config/s3Config';

// Gravitino S3 专用服务 - 使用正确的地址
const GRAVITINO_BASE_URL = process.env.REACT_APP_GRAVITINO_URL || 'http://10.177.64.21:16001';

const gravitinoS3Api = axios.create({
  baseURL: GRAVITINO_BASE_URL,
  timeout: 15000,
  headers: {
    'Accept': '*/*',
    'Content-Type': 'application/json'
  },
  withCredentials: false,
  proxy: false,
});

// 请求拦截器
gravitinoS3Api.interceptors.request.use(
  (config) => {
    console.log(`S3 API request: ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器
gravitinoS3Api.interceptors.response.use(
  (response) => {
    console.log(`S3 API response from ${response.config.url}:`, response.status, response.data);
    return response;
  },
  (error) => {
    console.error('Gravitino S3 API Error:', error);
    throw error;
  }
);

// S3连接测试
export const testS3Connection = async (s3Config) => {
  try {
    const response = await gravitinoS3Api.post('/api/s3/connect', {
      endpoint: s3Config.endpoint,
      accessKeyId: s3Config.accessKeyId,
      secretAccessKey: s3Config.secretAccessKey,
      region: s3Config.region,
      bucketName: s3Config.bucketName
    });
    
    return response.data.connected || false;
  } catch (error) {
    console.error('S3 connection test failed:', error);
    throw new Error(`S3连接测试失败: ${error.message}`);
  }
};

// 获取S3 buckets列表
export const getS3Buckets = async (s3Config) => {
  try {
    const response = await gravitinoS3Api.get('/api/s3/buckets', {
      params: {
        endpoint: s3Config.endpoint,
        access_key_id: s3Config.accessKeyId,
        secret_access_key: s3Config.secretAccessKey,
        region: s3Config.region
      }
    });
    
    return response.data.buckets || [];
  } catch (error) {
    console.error('Failed to get S3 buckets:', error);
    throw new Error(`获取S3存储桶失败: ${error.message}`);
  }
};

// 获取S3 schemas（目录结构中的第一层）
export const getS3Schemas = async (catalogName, s3Config, metaLakeName = 'test') => {
  try {
    const response = await gravitinoS3Api.get(`/api/s3/files/${s3Config.bucketName}`, {
      params: {
        endpoint: s3Config.endpoint,
        access_key_id: s3Config.accessKeyId,
        secret_access_key: s3Config.secretAccessKey,
        region: s3Config.region,
        prefix: s3Config.prefix || 'fileresource',
        recursive: true,
        _t: Date.now()
      }
    });
    
    // 从files响应中提取第一层目录作为schemas
    const files = response.data.files || [];
    const schemas = files
      .filter(file => file.isDirectory || file.name.endsWith('/'))
      .map(file => file.name.replace(/\/$/, ''))
      .filter(name => name.length > 0);
    
    return schemas.length > 0 ? schemas : ['bucket'];
  } catch (error) {
    console.error('Failed to get S3 schemas:', error);
    // 如果S3 API不可用，返回默认的bucket作为schema
    if (error.response?.status === 404) {
      console.warn('S3 API not available, using default bucket schema');
      return ['bucket'];
    }
    throw new Error(`获取S3 Schema列表失败: ${error.message}`);
  }
};

// 获取S3 filesets（相当于表的概念）
export const getS3Filesets = async (catalogName, schemaName, s3Config, metaLakeName = 'test') => {
  try {
    // 直接使用s3Config中的prefix，不要拼接schema
    const response = await gravitinoS3Api.get(`/api/s3/files/${s3Config.bucketName}`, {
      params: {
        endpoint: s3Config.endpoint,
        access_key_id: s3Config.accessKeyId,
        secret_access_key: s3Config.secretAccessKey,
        region: s3Config.region,
        prefix: s3Config.prefix || 'fileresource',
        recursive: true,
        _t: Date.now()
      }
    });
    
    // 从files响应中提取文件和目录作为filesets
    const files = response.data.files || [];
    const filesets = files.map(file => {
      // 直接使用文件名
      return file.name;
    }).filter(name => name && name.length > 0);
    
    return filesets;
  } catch (error) {
    console.error('Failed to get S3 filesets:', error);
    throw new Error(`获取S3 Fileset列表失败: ${error.message}`);
  }
};

// 获取S3文件列表 - 只返回文件，不返回目录
export const getS3Files = async (catalogName, schemaName, filesetName, s3Config, subPath = '', recursive = true) => {
  try {
    const response = await gravitinoS3Api.get(`/api/s3/files/${s3Config.bucketName}`, {
      params: {
        endpoint: s3Config.endpoint,
        access_key_id: s3Config.accessKeyId,
        secret_access_key: s3Config.secretAccessKey,
        region: s3Config.region,
        prefix: s3Config.prefix || 'fileresource',
        sub_path: subPath,
        recursive: recursive,
        _t: Date.now()
      }
    });
    
    if (response.data && response.data.files) {
      // 只返回文件，过滤掉目录
      const processedFiles = response.data.files
        .filter(file => !file.isDirectory && !file.name.endsWith('/')) // 只要文件
        .map(file => ({
          ...file,
          // 提取存储类别信息
          storageClass: file.name.match(/\[([^\]]+)\]$/) ? file.name.match(/\[([^\]]+)\]$/)[1] : 'STANDARD',
          // 清理文件名
          displayName: file.name.replace(/\s*\[[^\]]+\]$/, ''),
          // 标记为文件
          isFolder: false
        }));
      
      return { files: processedFiles };
    }
    
    return { files: [] };
  } catch (error) {
    console.error('Failed to get S3 files:', error);
    throw new Error(`获取S3文件列表失败: ${error.message}`);
  }
};

// 创建S3 Fileset
export const createS3Fileset = async (bucketName, schema, filesetName, s3Config) => {
  try {
    const response = await gravitinoS3Api.post(`/api/s3/files/${bucketName}/filesets`, {
      schema: schema,
      filesetName: filesetName
    }, {
      params: {
        endpoint: s3Config.endpoint,
        access_key_id: s3Config.accessKeyId,
        secret_access_key: s3Config.secretAccessKey,
        region: s3Config.region
      }
    });
    
    return {
      created: response.data.created || false,
      name: response.data.name || filesetName
    };
  } catch (error) {
    console.error('Failed to create S3 fileset:', error);
    throw new Error(`创建Fileset失败: ${error.message}`);
  }
};

// S3文件预览
export const previewS3File = async (bucketName, filePath, s3Config) => {
  try {
    const response = await gravitinoS3Api.post(`/api/s3/files/${bucketName}/preview`, {
      endpoint: s3Config.endpoint,
      access_key_id: s3Config.accessKeyId,
      secret_access_key: s3Config.secretAccessKey,
      region: s3Config.region,
      file_path: filePath
    });
    
    return {
      previewable: response.data.previewable || false,
      content: response.data.content || '',
      message: response.data.message || '',
      fileSize: response.data.fileSize || 0
    };
  } catch (error) {
    console.error('Failed to preview S3 file:', error);
    throw new Error(`文件预览失败: ${error.message}`);
  }
};

// Cache for catalog type information
const catalogTypeCache = new Map();

// 检查catalog是否为S3类型 - 使用API-based detection
export const isS3Catalog = async (catalogName, metaLakeName = 'test') => {
  // Check cache first
  const cacheKey = `${metaLakeName}:${catalogName}:isS3`;
  if (catalogTypeCache.has(cacheKey)) {
    return catalogTypeCache.get(cacheKey);
  }
  
  try {
    // Import getCatalogInfo dynamically to avoid circular dependency
    const { getCatalogInfo } = await import('./gravitinoService');
    const catalogInfo = await getCatalogInfo(catalogName, metaLakeName);
    
    // Check if it's an S3 catalog based on type and provider
    const isS3 = catalogInfo?.type === 'fileset' && 
                 (catalogInfo?.provider === 's3' || 
                  (catalogInfo?.provider === 'hadoop' && catalogInfo?.properties?.['filesystem-providers'] === 's3') ||
                  catalogInfo?.properties?.['s3-endpoint'] !== undefined);
    
    // Cache the result
    catalogTypeCache.set(cacheKey, isS3);
    
    return isS3;
  } catch (error) {
    console.warn(`Failed to determine if ${catalogName} is S3 catalog, falling back to name pattern:`, error);
    
    // Fallback to name pattern matching if API fails
    const s3Patterns = ['s3', '_s3', 's3_', 'aws-s3', 'minio', 'oss', 'test01'];
    const isS3 = s3Patterns.some(pattern => 
      catalogName.toLowerCase().includes(pattern)
    );
    
    catalogTypeCache.set(cacheKey, isS3);
    return isS3;
  }
};

// Synchronous version for backward compatibility (uses name patterns only)
export const isS3CatalogSync = (catalogName) => {
  // Check cache first
  const cacheKey = `sync:${catalogName}:isS3`;
  if (catalogTypeCache.has(cacheKey)) {
    return catalogTypeCache.get(cacheKey);
  }
  
  // Based on catalog name patterns
  const s3Patterns = ['s3', '_s3', 's3_', 'aws-s3', 'minio', 'oss', 'test01'];
  const isS3 = s3Patterns.some(pattern => 
    catalogName.toLowerCase().includes(pattern)
  );
  
  catalogTypeCache.set(cacheKey, isS3);
  return isS3;
};

// 从catalog的属性中提取S3配置
export const getS3Config = async (catalog, metaLakeName = 'test') => {
  // 如果catalog是字符串，首先尝试从静态配置获取
  if (typeof catalog === 'string') {
    // 首先检查静态配置
    if (s3Configurations[catalog]) {
      return s3Configurations[catalog];
    }
    
    try {
      // Import getCatalogInfo dynamically to avoid circular dependency
      const { getCatalogInfo } = await import('./gravitinoService');
      const catalogInfo = await getCatalogInfo(catalog, metaLakeName);
      
      // 检查是否为S3类型
      const isS3 = catalogInfo?.type === 'fileset' && 
                   (catalogInfo?.provider === 's3' || 
                    (catalogInfo?.provider === 'hadoop' && catalogInfo?.properties?.['filesystem-providers'] === 's3') ||
                    catalogInfo?.properties?.['s3-endpoint'] !== undefined);
      
      if (!isS3) {
        return null;
      }
      
      // 从catalog属性中提取S3配置
      return extractS3ConfigFromCatalog(catalogInfo);
    } catch (error) {
      console.warn(`Failed to get S3 config for catalog ${catalog}:`, error);
      return null;
    }
  }
  
  // 如果catalog是对象，从其属性中提取S3配置
  return extractS3ConfigFromCatalog(catalog);
};

// 同步版本的getS3Config，用于向后兼容
export const getS3ConfigSync = (catalogName) => {
  // 从静态配置中获取
  return s3Configurations[catalogName] || null;
};

export default gravitinoS3Api;