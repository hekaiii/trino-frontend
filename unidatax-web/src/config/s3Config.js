// S3数据源配置
// 这里配置各个S3类型catalog对应的连接信息

export const s3Configurations = {
  // test01 S3配置 (S3类型catalog的配置信息)
  // 这些参数会作为请求参数传递给Gravitino的S3 API
  'test01': {
    endpoint: 'http://10.177.64.211',  // S3服务端点
    accessKeyId: 'ALN8OVAFV4404Z0J7YU1',  // S3访问密钥
    secretAccessKey: 'KZA19vD4TY3OOR0v9PUQRS3nSohmxvQAzrR3TYBK',  // S3密钥
    region: 'hhht-hqc',
    bucketName: 'shishi-bucket',
    prefix: 'fileresource'
  },
  
  // 示例S3配置
  's3_by_gravitino': {
    endpoint: 'http://localhost:9000',  // MinIO或S3 endpoint
    accessKeyId: 'minioadmin',
    secretAccessKey: 'minioadmin', 
    region: 'us-east-1',
    bucketName: 'test-bucket',
    prefix: ''
  },
  
  's3_catalog': {
    endpoint: 'http://localhost:9000',
    accessKeyId: 'minioadmin',
    secretAccessKey: 'minioadmin',
    region: 'us-east-1', 
    bucketName: 'gravitino-bucket',
    prefix: ''
  },

  // AWS S3配置示例
  'aws_s3_catalog': {
    endpoint: 'https://s3.amazonaws.com',
    accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY || '',
    region: 'us-west-2',
    bucketName: 'my-aws-bucket',
    prefix: 'data/'
  },

  // 阿里云OSS配置示例
  'oss_catalog': {
    endpoint: 'https://oss-cn-hangzhou.aliyuncs.com',
    accessKeyId: process.env.REACT_APP_OSS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.REACT_APP_OSS_SECRET_ACCESS_KEY || '',
    region: 'oss-cn-hangzhou',
    bucketName: 'my-oss-bucket',
    prefix: ''
  }
};

// 判断catalog是否为S3类型
export const isS3Catalog = (catalogName) => {
  if (!catalogName) return false;
  
  const catalogNameLower = catalogName.toLowerCase();
  
  // 检查是否在配置中
  if (s3Configurations[catalogName]) {
    return true;
  }
  
  // 基于名称模式判断
  const s3Patterns = [
    's3',
    'aws',
    'minio', 
    'oss',
    'cos',  // 腾讯云对象存储
    'obs',  // 华为云对象存储
    'object_storage',
    'bucket',
    'test01' // 添加test01作为S3类型识别
  ];
  
  return s3Patterns.some(pattern => catalogNameLower.includes(pattern));
};

// 获取S3配置
export const getS3Config = (catalogName) => {
  // 首先检查是否在配置中
  if (s3Configurations[catalogName]) {
    return s3Configurations[catalogName];
  }
  
  // 如果不在配置中，返回null
  // 实际使用时应该从后端API获取配置
  return null;
};

// 从catalog属性中提取S3配置
export const extractS3ConfigFromCatalog = (catalog) => {
  if (!catalog || !catalog.properties) {
    return null;
  }
  
  const properties = catalog.properties;
  const location = properties['location'] || '';
  
  // 解析location以提取bucket和路径
  let bucketName = '';
  let basePath = '';
  
  if (location.startsWith('s3://')) {
    const pathWithoutProtocol = location.replace('s3://', '');
    const parts = pathWithoutProtocol.split('/');
    bucketName = parts[0] || '';
    basePath = parts.slice(1).join('/').replace(/\/$/, '');
  }
  
  return {
    endpoint: properties['s3-endpoint'] || properties['endpoint'] || '',
    accessKeyId: properties['s3-access-key-id'] || properties['access-key-id'] || '',
    secretAccessKey: properties['s3-secret-access-key'] || properties['secret-access-key'] || '',
    region: properties['s3-region'] || properties['region'] || 'us-east-1',
    bucketName: bucketName,
    prefix: basePath
  };
};