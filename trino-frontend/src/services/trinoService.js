import axios from 'axios';
import { getCatalogs as getGravitinoCatalogs, getSchemas as getGravitinoSchemas, getTables as getGravitinoTables, getTableDetails as getGravitinoTableDetails } from './gravitinoService';

// 使用本地代理来处理HTTPS自签证书问题
const TRINO_BASE_URL = '/trino'; // 使用开发代理
const TRINO_USERNAME = process.env.REACT_APP_TRINO_USERNAME || 'admin';
const TRINO_PASSWORD = process.env.REACT_APP_TRINO_PASSWORD || 'rs{=uzW$UZ4v{BR!';

const trinoApi = axios.create({
  baseURL: TRINO_BASE_URL,
  timeout: 30000, // 增加超时时间，因为SQL查询可能需要更长时间
  headers: {
    'Content-Type': 'application/json',
    'X-Trino-User': TRINO_USERNAME,
  }
  // 不需要auth配置，代理会处理认证
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

// 辅助函数：等待指定毫秒数
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 根据您的Java代码模式实现的Trino查询执行
export const executeQuery = async (sql) => {
  try {
    console.log('Executing SQL:', sql);
    
    // 第一步：提交SQL语句到Trino
    const statementResponse = await trinoApi.post('/v1/statement', sql, {
      headers: {
        'Content-Type': 'text/plain', // Trino Statement API接受纯文本SQL
        'X-Trino-User': TRINO_USERNAME,
      }
    });
    
    console.log('Statement response:', statementResponse.data);
    
    let currentData = statementResponse.data;
    let allResults = [];
    let maxRetries = 100; // 最大重试次数，防止无限循环
    let retryCount = 0;
    
    // 第二步：循环获取查询结果，直到没有nextUri或查询完成
    while (currentData.nextUri && retryCount < maxRetries) {
      console.log(`Fetching next results (attempt ${retryCount + 1}):`, currentData.nextUri);
      console.log('Current query state:', currentData.stats?.state);
      
      // 如果查询还在排队或运行中，稍等一下再请求
      if (currentData.stats?.state === 'QUEUED' || currentData.stats?.state === 'PLANNING') {
        await sleep(500); // 等待500ms
      } else if (currentData.stats?.state === 'RUNNING') {
        await sleep(200); // 运行中时等待更短时间
      }
      
      try {
        // 将HTTPS URL转换为代理URL
        const proxyUrl = currentData.nextUri.replace('https://trino-http.test.unicom.local:16000', '/trino');
        console.log('Using proxy URL:', proxyUrl);
        
        const nextResponse = await axios.get(proxyUrl, {
          timeout: 30000,
          headers: {
            'X-Trino-User': TRINO_USERNAME,
          }
        });
        
        currentData = nextResponse.data;
        console.log('Response data:', {
          state: currentData.stats?.state,
          hasData: !!currentData.data,
          dataLength: currentData.data ? currentData.data.length : 0,
          hasNextUri: !!currentData.nextUri
        });
        
        // 收集数据
        if (currentData.data && currentData.data.length > 0) {
          allResults = allResults.concat(currentData.data);
          console.log('Added', currentData.data.length, 'rows. Total:', allResults.length);
        }
        
        // 检查查询状态
        if (currentData.stats?.state === 'FAILED') {
          console.error('Query failed:', currentData.error);
          throw new Error(currentData.error?.message || 'Query execution failed');
        }
        
        // 如果查询完成且有columns信息，即使没有nextUri也要返回结果  
        if (currentData.stats?.state === 'FINISHED') {
          console.log('Query finished successfully');
          break;
        }
        
        retryCount++;
        
      } catch (error) {
        console.error('Error fetching next results:', error);
        // 对于网络错误，尝试重试
        if (error.code === 'ECONNRESET' || error.code === 'ECONNREFUSED') {
          console.log('Network error, retrying...');
          await sleep(1000);
          retryCount++;
          continue;
        }
        break;
      }
    }
    
    if (retryCount >= maxRetries) {
      console.warn('Reached maximum retry limit');
    }
    
    // 第三步：处理最终结果
    // 转换columns格式为前端需要的Table格式
    const tableColumns = currentData.columns ? currentData.columns.map(col => ({
      title: col.name,
      dataIndex: col.name,
      key: col.name,
      ellipsis: true,
    })) : [];
    
    // 转换data格式为前端需要的对象数组格式
    const tableData = allResults.map((row, index) => {
      const rowObj = { key: index };
      if (currentData.columns) {
        currentData.columns.forEach((col, colIndex) => {
          rowObj[col.name] = row[colIndex];
        });
      }
      return rowObj;
    });
    
    const finalResult = {
      id: currentData.id,
      infoUri: currentData.infoUri,
      columns: tableColumns,
      data: tableData,
      stats: currentData.stats,
      state: currentData.stats?.state || 'UNKNOWN',
      // 保留原始数据以备调试
      originalColumns: currentData.columns,
      originalData: allResults
    };
    
    console.log('Final query result:', {
      id: finalResult.id,
      state: finalResult.state,
      columnsCount: finalResult.columns.length,
      rowsCount: finalResult.data.length,
      sampleData: finalResult.data.slice(0, 2) // 显示前2行作为样本
    });
    
    return finalResult;
    
  } catch (error) {
    console.error('Error executing Trino query:', error);
    console.error('Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      statusText: error.response?.statusText
    });
    
    // 提供更详细的错误信息
    let errorMessage = 'SQL查询执行失败';
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.response?.status === 401) {
      errorMessage = 'Trino认证失败，请检查用户名和密码';
    } else if (error.response?.status === 404) {
      errorMessage = 'Trino服务地址不正确或服务不可用';
    } else if (error.code === 'ECONNREFUSED') {
      errorMessage = '无法连接到Trino服务器，请检查网络连接';
    }
    
    throw new Error(errorMessage);
  }
};

export default trinoApi;