import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:18082';

const fileMetadataApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 添加请求拦截器，自动添加token
fileMetadataApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 添加响应拦截器
fileMetadataApi.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('File metadata API error:', error);
    if (error.response?.status === 401) {
      // Token过期或无效，可以在这里处理登出逻辑
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    throw error;
  }
);

/**
 * 自动解析文件元数据
 */
export const parseFileMetadataAuto = async (data) => {
  try {
    const response = await fileMetadataApi.post('/api/file-metadata/parse-auto', data);
    return response.data;
  } catch (error) {
    console.error('Parse file metadata failed:', error);
    throw error;
  }
};

/**
 * 手动添加元数据
 */
export const addManualMetadata = async (data) => {
  try {
    const response = await fileMetadataApi.post('/api/file-metadata/manual', data);
    return response.data;
  } catch (error) {
    console.error('Add manual metadata failed:', error);
    throw error;
  }
};

/**
 * 获取文件的所有元数据
 */
export const getFileMetadata = async (filePath) => {
  try {
    const response = await fileMetadataApi.get(`/api/file-metadata/file?filePath=${encodeURIComponent(filePath)}`);
    return response.data;
  } catch (error) {
    console.error('Get file metadata failed:', error);
    throw error;
  }
};

/**
 * 更新元数据
 */
export const updateMetadata = async (id, metadataValue) => {
  try {
    const response = await fileMetadataApi.put(`/api/file-metadata/${id}`, { metadataValue });
    return response.data;
  } catch (error) {
    console.error('Update metadata failed:', error);
    throw error;
  }
};

/**
 * 删除单条元数据
 */
export const deleteMetadata = async (id) => {
  try {
    const response = await fileMetadataApi.delete(`/api/file-metadata/${id}`);
    return response.data;
  } catch (error) {
    console.error('Delete metadata failed:', error);
    throw error;
  }
};

/**
 * 批量删除元数据
 */
export const deleteMetadataBatch = async (ids) => {
  try {
    const response = await fileMetadataApi.delete('/api/file-metadata/batch', { data: ids });
    return response.data;
  } catch (error) {
    console.error('Batch delete metadata failed:', error);
    throw error;
  }
};

/**
 * 删除文件的所有元数据
 */
export const deleteFileMetadata = async (filePath) => {
  try {
    const encodedPath = encodeURIComponent(filePath);
    const response = await fileMetadataApi.delete(`/api/file-metadata/file/${encodedPath}`);
    return response.data;
  } catch (error) {
    console.error('Delete file metadata failed:', error);
    throw error;
  }
};

/**
 * 检测文件类型
 */
export const detectFileType = (fileName) => {
  if (!fileName) return null;
  
  // 去除可能的后缀标记，如 [STANDARD], [REPLICA] 等
  const cleanFileName = fileName.replace(/\s*\[.*?\]\s*$/, '');
  
  const extension = cleanFileName.split('.').pop()?.toLowerCase();
  if (!extension) return null;
  
  if (['json', 'jsonl', 'js'].includes(extension)) {
    return 'JSON';
  } else if (['xml', 'xsd', 'xsl', 'xslt', 'config', 'plist', 'conf', 'properties', 'cfg', 'ini', 'settings'].includes(extension)) {
    return 'XML';
  }
  return null;
};