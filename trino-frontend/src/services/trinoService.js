import axios from 'axios';
import { getCatalogs as getGravitinoCatalogs, getSchemas as getGravitinoSchemas, getTables as getGravitinoTables, getTableDetails as getGravitinoTableDetails } from './gravitinoService';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

const trinoApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 使用Gravitino服务获取catalog数据
export const getCatalogs = async () => {
  return await getGravitinoCatalogs();
};

// 使用Gravitino服务获取schemas数据
export const getSchemas = async (catalogName) => {
  return await getGravitinoSchemas(catalogName);
};

// 使用Gravitino服务获取tables数据
export const getTables = async (catalogName, schemaName) => {
  return await getGravitinoTables(catalogName, schemaName);
};

// 使用Gravitino服务获取表详情数据
export const getTableDetails = async (catalogName, schemaName, tableName) => {
  return await getGravitinoTableDetails(catalogName, schemaName, tableName);
};

export const executeQuery = async (sql) => {
  try {
    const response = await trinoApi.post('/api/query', { sql });
    return response.data;
  } catch (error) {
    console.error('Error executing query:', error);
    throw error;
  }
};

export default trinoApi;