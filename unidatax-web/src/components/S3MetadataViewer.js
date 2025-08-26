import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Space, 
  Typography, 
  Alert,
  Descriptions,
  Tabs,
  Statistic,
  Row,
  Col,
  Tag,
  Divider,
  message
} from 'antd';
import {
  CloudOutlined,
  FileOutlined,
  FolderOutlined,
  DatabaseOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import S3FileViewer from './S3FileViewer';
import { getS3Config, testS3Connection } from '../services/gravitinoS3Service';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const S3MetadataViewer = ({ catalog, schema, fileset, metalake = 'test' }) => {
  const [s3Config, setS3Config] = useState(null);
  // const [loading, setLoading] = useState(false); // 暂未使用
  const [activeTab, setActiveTab] = useState('files');
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [testingConnection, setTestingConnection] = useState(false);

  useEffect(() => {
    // 获取S3配置
    const config = getS3Config(catalog);
    if (config) {
      setS3Config(config);
    } else {
      message.error('无法获取S3配置信息');
    }
  }, [catalog]);

  // 测试S3连接
  const handleTestConnection = async () => {
    if (!s3Config) {
      message.error('S3配置不可用');
      return;
    }

    setTestingConnection(true);
    try {
      const result = await testS3Connection(s3Config);
      if (result.connected) {
        setConnectionStatus('connected');
        message.success('S3连接测试成功');
      } else {
        setConnectionStatus('failed');
        message.error('S3连接测试失败');
      }
    } catch (error) {
      setConnectionStatus('failed');
      console.error('Connection test failed:', error);
      message.error(`连接测试失败: ${error.message}`);
    } finally {
      setTestingConnection(false);
    }
  };

  // 渲染元数据信息
  const renderMetadata = () => {
    if (!s3Config) {
      return (
        <Alert
          message="配置信息不可用"
          description="无法获取S3连接配置信息"
          type="error"
          showIcon
        />
      );
    }

    return (
      <Card>
        <Descriptions title="S3 数据源信息" bordered column={2}>
          <Descriptions.Item label="Catalog" span={1}>
            <Space>
              <CloudOutlined style={{ color: '#FF9900' }} />
              <Text strong>{catalog}</Text>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Schema" span={1}>
            <Space>
              <FolderOutlined />
              <Text>{schema}</Text>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Fileset" span={2}>
            <Space>
              <FileOutlined />
              <Text>{fileset}</Text>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="存储桶" span={1}>
            <Tag color="blue">{s3Config.bucketName}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="区域" span={1}>
            <Tag color="green">{s3Config.region}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Endpoint" span={2}>
            <Text code>{s3Config.endpoint}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="基础路径" span={2}>
            <Text code>{s3Config.prefix || '/'}</Text>
          </Descriptions.Item>
        </Descriptions>

        <Divider />

        <Title level={4}>连接信息</Title>
        <Row gutter={16} style={{ marginBottom: '16px' }}>
          <Col span={24}>
            <Button 
              type="primary" 
              onClick={handleTestConnection}
              loading={testingConnection}
              icon={<DatabaseOutlined />}
            >
              测试连接
            </Button>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={8}>
            <Card>
              <Statistic
                title="连接状态"
                value={
                  connectionStatus === 'connected' ? '已连接' :
                  connectionStatus === 'failed' ? '连接失败' : '未测试'
                }
                valueStyle={{ 
                  color: connectionStatus === 'connected' ? '#3f8600' : 
                         connectionStatus === 'failed' ? '#cf1322' : '#666' 
                }}
                prefix={<CloudOutlined />}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="存储类型"
                value="S3兼容"
                prefix={<DatabaseOutlined />}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="访问方式"
                value="API"
                prefix={<InfoCircleOutlined />}
              />
            </Card>
          </Col>
        </Row>

        <Divider />

        <Title level={4}>访问权限</Title>
        <Descriptions bordered size="small">
          <Descriptions.Item label="Access Key ID" span={3}>
            <Text code>{s3Config.accessKeyId ? `${s3Config.accessKeyId.substring(0, 4)}****` : '未配置'}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="权限级别" span={3}>
            <Tag color="green">读写权限</Tag>
          </Descriptions.Item>
        </Descriptions>
      </Card>
    );
  };

  // 渲染Schema信息
  const renderSchemaInfo = () => {
    return (
      <Card>
        <Title level={4}>Schema 结构信息</Title>
        <Descriptions bordered column={1}>
          <Descriptions.Item label="Schema 名称">
            {schema}
          </Descriptions.Item>
          <Descriptions.Item label="所属 Catalog">
            {catalog}
          </Descriptions.Item>
          <Descriptions.Item label="Fileset 名称">
            {fileset}
          </Descriptions.Item>
          <Descriptions.Item label="存储格式">
            <Space>
              <Tag>Parquet</Tag>
              <Tag>CSV</Tag>
              <Tag>JSON</Tag>
              <Tag>ORC</Tag>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="路径模式">
            <Text code>{`s3://${s3Config?.bucketName}/${schema}/${fileset}/`}</Text>
          </Descriptions.Item>
        </Descriptions>

        <Divider />

        <Title level={4}>数据统计</Title>
        <Row gutter={16}>
          <Col span={6}>
            <Statistic title="文件总数" value={0} suffix="个" />
          </Col>
          <Col span={6}>
            <Statistic title="总大小" value={0} suffix="MB" />
          </Col>
          <Col span={6}>
            <Statistic title="最后更新" value="--" />
          </Col>
          <Col span={6}>
            <Statistic title="分区数" value={0} suffix="个" />
          </Col>
        </Row>
      </Card>
    );
  };

  if (!s3Config) {
    return (
      <Alert
        message="S3配置加载中"
        description="正在获取S3连接配置..."
        type="info"
        showIcon
      />
    );
  }

  return (
    <div style={{ height: '100%', overflow: 'auto' }}>
      <Card>
        <Title level={3}>
          <CloudOutlined style={{ color: '#FF9900', marginRight: '8px' }} />
          S3 数据源: {catalog}
        </Title>
        
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="文件浏览" key="files">
            <S3FileViewer
              catalog={catalog}
              schema={schema}
              fileset={fileset}
              s3Config={s3Config}
              metalake={metalake}
            />
          </TabPane>
          
          <TabPane tab="元数据信息" key="metadata">
            {renderMetadata()}
          </TabPane>
          
          <TabPane tab="Schema信息" key="schema">
            {renderSchemaInfo()}
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default S3MetadataViewer;