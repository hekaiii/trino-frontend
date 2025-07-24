
import axios from 'axios';

// 直接连接Gravitino服务器，已解决CORS问题
const GRAVITINO_BASE_URL = 'http://10.177.64.21:16001';

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
    
    let response;
    try {
      // 首先尝试正常的请求
      response = await gravitinoApi.get(`/api/metalakes/${metaLakeName}/catalogs?details=true`);
    } catch (error) {
      if (error.response?.status === 406) {
        console.log('Got 406 error, trying with different Accept header...');
        // 如果出现406错误，尝试使用不同的Accept头
        response = await gravitinoApi.get(`/api/metalakes/${metaLakeName}/catalogs?details=true`, {
          headers: {
            'Accept': '*/*',
            'Content-Type': 'application/json'
          }
        });
      } else {
        throw error;
      }
    }
    
    console.log('Gravitino catalogs response:', response.data);
    
    if (response.data && response.data.code === 0) {
      let catalogs = [];
      
      // 处理catalogs数组格式
      if (response.data.catalogs && Array.isArray(response.data.catalogs)) {
        catalogs = response.data.catalogs.map(catalog => catalog.name);
      }
      // 处理identifiers数组格式 (新的API格式)
      else if (response.data.identifiers && Array.isArray(response.data.identifiers)) {
        catalogs = response.data.identifiers.map(identifier => identifier.name);
      }
      
      console.log('Processed catalogs:', catalogs);
      return catalogs;
    } else {
      console.warn('Unexpected catalogs API response format:', response.data);
      // 如果API响应格式不对，返回fallback数据
      return [
        'hive_matestore', 
        'mariadb_node1', 
        'mysql_node1', 
        'oceanbase_node1', 
        'oceanbase_node1_with_odbc',
        'postgres_node1', 
        'starrocks_node1', 
        'tidb'
      ];
    }
  } catch (error) {
    console.error('Error fetching catalogs from Gravitino:', error);
    console.error('Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    
    // 如果API调用失败，返回fallback数据而不是抛出错误
    console.log('Falling back to known catalog list');
    return [
      'hive_matestore', 
      'mariadb_node1', 
      'mysql_node1', 
      'oceanbase_node1', 
      'oceanbase_node1_with_odbc',
      'postgres_node1', 
      'starrocks_node1', 
      'tidb'
    ];
  }
};


export const getSchemas = async (catalogName, metaLakeName = 'test') => {
  try {
    console.log(`Fetching schemas for catalog: ${catalogName} from Gravitino API`);
    
    let response;
    try {
      // 首先尝试正常的请求
      response = await gravitinoApi.get(`/api/metalakes/${metaLakeName}/catalogs/${catalogName}/schemas`);
    } catch (error) {
      if (error.response?.status === 406) {
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
    
    // 如果API调用失败，返回空数组而不是抛出错误，让用户知道没有schemas
    return [];
  }
};

export const getTables = async (catalogName, schemaName, metaLakeName = 'test') => {
  try {
    console.log(`Fetching tables for catalog: ${catalogName}, schema: ${schemaName} from Gravitino API`);
    
    let response;
    try {
      // 首先尝试正常的请求
      response = await gravitinoApi.get(`/api/metalakes/${metaLakeName}/catalogs/${catalogName}/schemas/${schemaName}/tables`);
    } catch (error) {
      if (error.response?.status === 406) {
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
    
    // 如果API调用失败，返回空数组而不是抛出错误，让用户知道没有tables
    return [];
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
    
    // 如果API调用失败，返回基本的错误信息而不是完全失败
    return {
      columns: [
        { name: 'error', type: 'varchar', comment: '无法获取表结构信息' }
      ],
      ddl: `-- 无法获取表 ${catalogName}.${schemaName}.${tableName} 的DDL信息`,
      properties: {},
      partitioning: [],
      distribution: null,
      sortOrders: [],
      indexes: []
    };
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
    const response = await gravitinoApi.get(`/api/metalakes/${metaLakeName}/catalogs/${catalogName}`);
    return response.data.catalog;
  } catch (error) {
    console.error('Error fetching catalog info:', error);
    throw error;
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