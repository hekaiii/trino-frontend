import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

const trinoApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getCatalogs = async () => {
  try {
    const response = await trinoApi.get('/api/catalogs');
    return response.data;
  } catch (error) {
    console.error('Error fetching catalogs:', error);
    return ['information_schema', 'system', 'hive', 'mysql'];
  }
};

export const getSchemas = async (catalogName) => {
  try {
    const response = await trinoApi.get(`/api/catalogs/${catalogName}/schemas`);
    return response.data;
  } catch (error) {
    console.error('Error fetching schemas:', error);
    return ['default', 'information_schema'];
  }
};

export const getTables = async (catalogName, schemaName) => {
  try {
    const response = await trinoApi.get(`/api/catalogs/${catalogName}/schemas/${schemaName}/tables`);
    return response.data;
  } catch (error) {
    console.error('Error fetching tables:', error);
    return ['table1', 'table2', 'table3'];
  }
};

export const getTableDetails = async (catalogName, schemaName, tableName) => {
  try {
    const response = await trinoApi.get(`/api/catalogs/${catalogName}/schemas/${schemaName}/tables/${tableName}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching table details:', error);
    return {
      columns: [
        { name: 'id', type: 'bigint', comment: '主键' },
        { name: 'name', type: 'varchar', comment: '名称' },
        { name: 'created_at', type: 'timestamp', comment: '创建时间' }
      ],
      ddl: `CREATE TABLE ${catalogName}.${schemaName}.${tableName} (
  id bigint,
  name varchar,
  created_at timestamp
);`
    };
  }
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