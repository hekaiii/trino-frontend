
import axios from 'axios';
import { getS3Schemas, getS3Filesets } from './gravitinoS3Service';

// Cache for catalog information
const catalogCache = new Map();

// 直接连接Gravitino服务器，已解决CORS问题
const GRAVITINO_BASE_URL = process.env.REACT_APP_GRAVITINO_URL || 'http://localhost:8090';  // 使用环境变量或默认本地地址

const gravitinoApi = axios.create({
  baseURL: GRAVITINO_BASE_URL,
  timeout: 15000,
  headers: {
    'Accept': '*/*',
    'Content-Type': 'application/json'
  },
  withCredentials: false,
  proxy: false,
});

// 添加请求拦截器来处理可能的406错误
gravitinoApi.interceptors.request.use(
  (config) => {
    console.log(`Making request to: ${config.baseURL}${config.url}`);
    console.log('Request headers:', config.headers);
    return config;
  },
  (error) => Promise.reject(error)
);

// 添加响应拦截器来处理错误
gravitinoApi.interceptors.response.use(
  (response) => {
    console.log(`Response from ${response.config.url}:`, response.status, response.data);
    return response;
  },
  (error) => {
    console.error('Gravitino API Error:', error);
    console.error('Error details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      headers: error.response?.headers
    });
    
    // 特殊处理406错误
    if (error.response?.status === 406) {
      console.error('406 Not Acceptable error - checking request headers');
      const newError = new Error('服务器不接受请求格式，请检查Accept头设置');
      newError.originalError = error;
      throw newError;
    }
    
    throw error;
  }
);

export const getMetalakes = async () => {
  try {
    const response = await gravitinoApi.get('/api/metalakes');
    return response.data.metalakes || [];
  } catch (error) {
    console.error('Error fetching metalakes:', error);
    throw error;
  }
};

// 调用真实Gravitino API获取catalogs
export const getCatalogs = async (metaLakeName = 'test') => {
  try {
    console.log(`Fetching catalogs from Gravitino API for metalake: ${metaLakeName}`);
    
    // 首先获取catalog列表
    let listResponse;
    try {
      // 首先尝试正常的请求
      listResponse = await gravitinoApi.get(`/api/metalakes/${metaLakeName}/catalogs`);
    } catch (error) {
      if (error.response?.status === 406) {
        console.log('Got 406 error, trying with different Accept header...');
        // 如果出现406错误，尝试使用不同的Accept头
        listResponse = await gravitinoApi.get(`/api/metalakes/${metaLakeName}/catalogs`, {
          headers: {
            'Accept': '*/*',
            'Content-Type': 'application/json'
          }
        });
      } else {
        throw error;
      }
    }
    
    console.log('Gravitino catalogs response:', listResponse.data);
    
    if (listResponse.data && listResponse.data.code === 0) {
      let catalogNames = [];
      
      // 处理catalogs数组格式
      if (listResponse.data.catalogs && Array.isArray(listResponse.data.catalogs)) {
        catalogNames = listResponse.data.catalogs.map(catalog => catalog.name);
      }
      // 处理identifiers数组格式 (新的API格式)
      else if (listResponse.data.identifiers && Array.isArray(listResponse.data.identifiers)) {
        catalogNames = listResponse.data.identifiers.map(identifier => identifier.name);
      }
      
      // 获取每个catalog的详细信息
      const catalogsWithDetails = await Promise.all(
        catalogNames.map(async (catalogName) => {
          try {
            const details = await getCatalogInfo(catalogName, metaLakeName);
            return {
              name: catalogName,
              type: details?.type || 'unknown',
              provider: details?.provider || 'unknown',
              properties: details?.properties || {}
            };
          } catch (error) {
            console.warn(`Failed to get details for catalog ${catalogName}:`, error);
            // 如果获取详情失败，返回基本信息
            return {
              name: catalogName,
              type: 'unknown',
              provider: 'unknown',
              properties: {}
            };
          }
        })
      );
      
      console.log('Processed catalogs with details:', catalogsWithDetails);
      return catalogsWithDetails;
    } else {
      console.warn('Unexpected catalogs API response format:', listResponse.data);
      // 如果API响应格式不对，抛出错误而不是返回fallback数据
      throw new Error('Gravitino服务返回了无效的数据格式，请检查服务配置');
    }
  } catch (error) {
    console.error('Error fetching catalogs from Gravitino:', error);
    console.error('Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    
    // 根据错误类型提供友好的错误信息
    let friendlyMessage = '无法连接到Gravitino服务';
    
    if (error.response) {
      // 服务器响应了错误状态码
      const status = error.response.status;
      if (status === 404) {
        friendlyMessage = `Metalake "${metaLakeName}" 不存在，请检查配置`;
      } else if (status >= 500) {
        friendlyMessage = 'Gravitino服务器内部错误，请联系管理员';
      } else if (status === 403) {
        friendlyMessage = '没有权限访问Gravitino服务，请检查认证信息';
      } else if (status === 406) {
        friendlyMessage = 'Gravitino服务不接受请求格式，请检查API版本兼容性';
      } else {
        friendlyMessage = `Gravitino服务错误 (${status}): ${error.response.statusText}`;
      }
    } else if (error.request) {
      // 请求已发出但没有收到响应
      friendlyMessage = 'Gravitino服务无响应，请检查网络连接和服务地址 (http://10.177.64.21:16001)';
    } else {
      // 设置请求时出现问题
      friendlyMessage = `请求配置错误: ${error.message}`;
    }
    
    // 抛出友好的错误信息
    throw new Error(friendlyMessage);
  }
};


export const getSchemas = async (catalogName, metaLakeName = 'test') => {
  try {
    console.log(`Fetching schemas for catalog: ${catalogName} from Gravitino API`);
    
    // 先获取catalog详情以判断是否为S3类型
    const catalogInfo = await getCatalogInfo(catalogName, metaLakeName);
    const isS3 = catalogInfo?.type === 'fileset' && 
                 (catalogInfo?.provider === 's3' || 
                  (catalogInfo?.provider === 'hadoop' && catalogInfo?.properties?.['filesystem-providers'] === 's3') ||
                  catalogInfo?.properties?.['s3-endpoint'] !== undefined);
    
    // 检查是否为S3类型的catalog，使用S3专门的API
    if (isS3) {
      console.log(`S3 catalog detected: ${catalogName}, using S3 schemas API`);
      
      // 从catalog属性中提取S3配置
      const { extractS3ConfigFromCatalog } = await import('../config/s3Config');
      const s3Config = extractS3ConfigFromCatalog(catalogInfo);
      
      if (!s3Config || !s3Config.bucketName) {
        console.warn(`Invalid S3 configuration for catalog: ${catalogName}, missing bucket name`);
        return ['bucket'];
      }
      
      console.log(`Using S3 config:`, s3Config);
      
      try {
        // 调用S3专门的schemas API
        const schemas = await getS3Schemas(catalogName, s3Config, metaLakeName);
        return schemas.length > 0 ? schemas : ['bucket'];
      } catch (s3Error) {
        console.error('Error fetching S3 schemas:', s3Error);
        // 如果S3 API不可用或失败，返回默认的bucket schema
        console.warn(`S3 API not available for catalog ${catalogName}, using default bucket schema`);
        return ['bucket'];
      }
    }
    
    let response;
    try {
      // 首先尝试正常的请求
      response = await gravitinoApi.get(`/api/metalakes/${metaLakeName}/catalogs/${catalogName}/schemas`);
    } catch (error) {
      if (error.response?.status === 405 || error.response?.data?.message?.includes('Catalog does not support schema operations')) {
        console.log(`Got 405 or unsupported operation for catalog ${catalogName}, likely S3 type`);
        // 如果出现405错误或不支持schema操作，可能是S3类型catalog，返回默认bucket
        return ['bucket'];
      } else if (error.response?.status === 406) {
        console.log('Got 406 error, trying with different Accept header...');
        // 如果出现406错误，尝试使用不同的Accept头
        response = await gravitinoApi.get(`/api/metalakes/${metaLakeName}/catalogs/${catalogName}/schemas`, {
          headers: {
            'Accept': '*/*',
            'Content-Type': 'application/json'
          }
        });
      } else {
        throw error;
      }
    }
    
    console.log('Gravitino schemas response:', response.data);
    
    if (response.data && response.data.code === 0) {
      let schemas = [];
      
      // 处理schemas数组格式
      if (response.data.schemas && Array.isArray(response.data.schemas)) {
        schemas = response.data.schemas.map(schema => schema.name);
      }
      // 处理identifiers数组格式 (新的API格式)
      else if (response.data.identifiers && Array.isArray(response.data.identifiers)) {
        schemas = response.data.identifiers.map(identifier => identifier.name);
      }
      
      console.log('Processed schemas:', schemas);
      return schemas;
    } else {
      console.warn('Unexpected schemas API response format:', response.data);
      return [];
    }
  } catch (error) {
    console.error('Error fetching schemas from Gravitino:', error);
    console.error('Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    
    // 特殊处理405错误，可能是S3类型catalog
    if (error.response?.status === 405) {
      console.log(`405 error for catalog ${catalogName}, treating as S3 type`);
      return ['bucket'];
    }
    
    // 根据错误类型提供友好的错误信息
    let friendlyMessage = `获取Catalog "${catalogName}" 的Schema列表失败`;
    
    if (error.response) {
      const status = error.response.status;
      if (status === 404) {
        friendlyMessage = `Catalog "${catalogName}" 不存在或无可用Schema`;
      } else if (status >= 500) {
        friendlyMessage = 'Gravitino服务器内部错误，请联系管理员';
      } else if (status === 403) {
        friendlyMessage = `没有权限访问Catalog "${catalogName}" 的Schema信息`;
      }
    } else if (error.request) {
      friendlyMessage = 'Gravitino服务无响应，请检查网络连接';
    }
    
    throw new Error(friendlyMessage);
  }
};

export const getTables = async (catalogName, schemaName, metaLakeName = 'test') => {
  try {
    console.log(`Fetching tables for catalog: ${catalogName}, schema: ${schemaName} from Gravitino API`);
    
    // 先获取catalog详情以判断是否为S3类型
    const catalogInfo = await getCatalogInfo(catalogName, metaLakeName);
    const isS3 = catalogInfo?.type === 'fileset' && 
                 (catalogInfo?.provider === 's3' || 
                  (catalogInfo?.provider === 'hadoop' && catalogInfo?.properties?.['filesystem-providers'] === 's3') ||
                  catalogInfo?.properties?.['s3-endpoint'] !== undefined);
    
    // 检查是否为S3类型的catalog，使用S3专门的filesets API
    if (isS3) {
      console.log(`S3 catalog detected: ${catalogName}, using S3 filesets API`);
      
      // 从catalog属性中提取S3配置
      const { extractS3ConfigFromCatalog } = await import('../config/s3Config');
      const s3Config = extractS3ConfigFromCatalog(catalogInfo);
      
      if (!s3Config || !s3Config.bucketName) {
        console.warn(`Invalid S3 configuration for catalog: ${catalogName}, missing bucket name`);
        return [];
      }
      
      console.log(`Using S3 config for filesets:`, s3Config);
      
      try {
        // 调用S3专门的filesets API
        const filesets = await getS3Filesets(catalogName, schemaName, s3Config, metaLakeName);
        console.log('Processed S3 filesets:', filesets);
        return filesets;
      } catch (s3Error) {
        console.error('Error fetching S3 filesets:', s3Error);
        console.warn(`S3 API not available for catalog ${catalogName}, returning empty filesets`);
        return [];
      }
    }
    
    let response;
    try {
      // 首先尝试正常的请求
      response = await gravitinoApi.get(`/api/metalakes/${metaLakeName}/catalogs/${catalogName}/schemas/${schemaName}/tables`);
    } catch (error) {
      if (error.response?.status === 405 || error.response?.data?.message?.includes('Catalog does not support')) {
        console.log(`Got 405 or unsupported operation for catalog ${catalogName}, likely S3 type`);
        // 如果出现405错误或不支持操作，可能是S3类型catalog，返回空数组
        return [];
      } else if (error.response?.status === 406) {
        console.log('Got 406 error, trying with different Accept header...');
        // 如果出现406错误，尝试使用不同的Accept头
        response = await gravitinoApi.get(`/api/metalakes/${metaLakeName}/catalogs/${catalogName}/schemas/${schemaName}/tables`, {
          headers: {
            'Accept': '*/*',
            'Content-Type': 'application/json'
          }
        });
      } else {
        throw error;
      }
    }
    
    console.log('Gravitino tables response:', response.data);
    
    if (response.data && response.data.code === 0) {
      let tables = [];
      
      // 处理tables数组格式
      if (response.data.tables && Array.isArray(response.data.tables)) {
        tables = response.data.tables.map(table => table.name);
      }
      // 处理identifiers数组格式 (新的API格式)
      else if (response.data.identifiers && Array.isArray(response.data.identifiers)) {
        tables = response.data.identifiers.map(identifier => identifier.name);
      }
      
      console.log('Processed tables:', tables);
      return tables;
    } else {
      console.warn('Unexpected tables API response format:', response.data);
      return [];
    }
  } catch (error) {
    console.error('Error fetching tables from Gravitino:', error);
    console.error('Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    
    // 特殊处理405错误，可能是S3类型catalog
    if (error.response?.status === 405) {
      console.log(`405 error for catalog ${catalogName}, returning empty array`);
      return [];
    }
    
    // 根据错误类型提供友好的错误信息
    let friendlyMessage = `获取Schema "${catalogName}.${schemaName}" 的表列表失败`;
    
    if (error.response) {
      const status = error.response.status;
      if (status === 404) {
        friendlyMessage = `Schema "${catalogName}.${schemaName}" 不存在或无可用表`;
      } else if (status >= 500) {
        friendlyMessage = 'Gravitino服务器内部错误，请联系管理员';
      } else if (status === 403) {
        friendlyMessage = `没有权限访问Schema "${catalogName}.${schemaName}" 的表信息`;
      }
    } else if (error.request) {
      friendlyMessage = 'Gravitino服务无响应，请检查网络连接';
    }
    
    throw new Error(friendlyMessage);
  }
};

export const getTableDetails = async (catalogName, schemaName, tableName, metaLakeName = 'test') => {
  try {
    console.log(`Fetching table details for: ${catalogName}.${schemaName}.${tableName} from Gravitino API`);
    const response = await gravitinoApi.get(`/api/metalakes/${metaLakeName}/catalogs/${catalogName}/schemas/${schemaName}/tables/${tableName}`);
    console.log('Gravitino table details response:', response.data);
    
    let tableInfo;
    if (response.data && response.data.code === 0 && response.data.table) {
      tableInfo = response.data.table;
    } else if (response.data && response.data.table) {
      tableInfo = response.data.table;
    } else {
      throw new Error('表信息不存在或格式不正确');
    }

    // 解析列信息
    const columns = tableInfo.columns?.map(column => ({
      name: column.name,
      type: column.dataType || column.type,
      comment: column.comment || ''
    })) || [];

    const ddl = generateDDL(catalogName, schemaName, tableName, columns, tableInfo.properties || {});

    return {
      columns,
      ddl,
      properties: tableInfo.properties || {},
      partitioning: tableInfo.partitioning || [],
      distribution: tableInfo.distribution || null,
      sortOrders: tableInfo.sortOrders || [],
      indexes: tableInfo.indexes || []
    };
  } catch (error) {
    console.error('Error fetching table details from Gravitino:', error);
    console.error('Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    
    // 抛出友好的错误信息而不是返回mock数据
    let friendlyMessage = `获取表 ${catalogName}.${schemaName}.${tableName} 详情失败`;
    
    if (error.response) {
      const status = error.response.status;
      if (status === 404) {
        friendlyMessage = `表 ${catalogName}.${schemaName}.${tableName} 不存在`;
      } else if (status >= 500) {
        friendlyMessage = 'Gravitino服务器内部错误，请联系管理员';
      } else if (status === 403) {
        friendlyMessage = `没有权限访问表 ${catalogName}.${schemaName}.${tableName}`;
      }
    } else if (error.request) {
      friendlyMessage = 'Gravitino服务无响应，请检查网络连接';
    }
    
    throw new Error(friendlyMessage);
  }
};

const generateDDL = (catalogName, schemaName, tableName, columns, properties = {}) => {
  const columnDefinitions = columns.map(col => {
    let definition = `  ${col.name} ${col.type}`;
    if (col.comment) {
      definition += ` COMMENT '${col.comment}'`;
    }
    return definition;
  }).join(',\n');

  let ddl = `CREATE TABLE ${catalogName}.${schemaName}.${tableName} (
${columnDefinitions}
)`;

  // 添加properties信息
  if (properties && Object.keys(properties).length > 0) {
    const propertiesLines = Object.entries(properties).map(([key, value]) => {
      return `  '${key}' = '${value}'`;
    }).join(',\n');
    
    ddl += `\nWITH (\n${propertiesLines}\n)`;
  }

  ddl += ';';
  
  return ddl;
};

export const getCatalogInfo = async (catalogName, metaLakeName = 'test') => {
  try {
    // Check cache first
    const cacheKey = `${metaLakeName}:${catalogName}`;
    if (catalogCache.has(cacheKey)) {
      console.log(`Using cached catalog info for ${catalogName}`);
      return catalogCache.get(cacheKey);
    }
    
    const response = await gravitinoApi.get(`/api/metalakes/${metaLakeName}/catalogs/${catalogName}`);
    const catalogInfo = response.data.catalog;
    
    // Cache the catalog info
    catalogCache.set(cacheKey, catalogInfo);
    
    return catalogInfo;
  } catch (error) {
    console.error('Error fetching catalog info:', error);
    throw error;
  }
};

// Get catalog type (provider) information
export const getCatalogType = async (catalogName, metaLakeName = 'test') => {
  try {
    const catalogInfo = await getCatalogInfo(catalogName, metaLakeName);
    return {
      type: catalogInfo?.type || 'unknown',
      provider: catalogInfo?.provider || 'unknown',
      isS3: catalogInfo?.type === 'fileset' && 
            (catalogInfo?.provider === 's3' || 
             (catalogInfo?.provider === 'hadoop' && catalogInfo?.properties?.['filesystem-providers'] === 's3')),
      properties: catalogInfo?.properties || {}
    };
  } catch (error) {
    console.error(`Error getting catalog type for ${catalogName}:`, error);
    return {
      type: 'unknown',
      provider: 'unknown',
      isS3: false,
      properties: {}
    };
  }
};

export const getSchemaInfo = async (catalogName, schemaName, metaLakeName = 'test') => {
  try {
    const response = await gravitinoApi.get(`/api/metalakes/${metaLakeName}/catalogs/${catalogName}/schemas/${schemaName}`);
    return response.data.schema;
  } catch (error) {
    console.error('Error fetching schema info:', error);
    throw error;
  }
};

export default gravitinoApi;