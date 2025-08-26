// 测试S3 API调用
async function testS3API() {
  const catalogName = 'test01';
  const metaLakeName = 'test';
  
  // 1. 获取catalog详情
  const catalogResponse = await fetch(`http://10.177.64.21:16001/api/metalakes/${metaLakeName}/catalogs/${catalogName}`, {
    headers: { 'Accept': '*/*' }
  });
  const catalogData = await catalogResponse.json();
  console.log('Catalog Info:', catalogData.catalog);
  
  // 2. 提取S3配置
  const properties = catalogData.catalog.properties;
  const location = properties['location'] || '';
  let bucketName = '';
  
  if (location.startsWith('s3://')) {
    const pathWithoutProtocol = location.replace('s3://', '');
    const parts = pathWithoutProtocol.split('/');
    bucketName = parts[0];
  }
  
  const s3Config = {
    endpoint: properties['s3-endpoint'],
    accessKeyId: properties['s3-access-key-id'],
    secretAccessKey: properties['s3-secret-access-key'],
    region: properties['s3-region'],
    bucketName: bucketName
  };
  
  console.log('Extracted S3 Config:', s3Config);
  
  // 3. 测试S3 schemas API
  const queryParams = new URLSearchParams({
    endpoint: s3Config.endpoint,
    access_key_id: s3Config.accessKeyId,
    secret_access_key: s3Config.secretAccessKey,
    region: s3Config.region,
    prefix: ''
  });
  
  const schemasUrl = `http://10.177.64.21:16001/api/v1/s3/files/${s3Config.bucketName}/schemas?${queryParams}`;
  console.log('S3 Schemas URL:', schemasUrl);
  
  const schemasResponse = await fetch(schemasUrl);
  console.log('Schemas Response Status:', schemasResponse.status);
  
  if (schemasResponse.ok) {
    const schemasData = await schemasResponse.json();
    console.log('S3 Schemas:', schemasData);
  } else {
    console.error('Failed to fetch S3 schemas:', schemasResponse.statusText);
  }
}

testS3API().catch(console.error);
