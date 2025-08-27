import React, { useState, useEffect, useCallback } from 'react';
import { 
  Table, 
  Spin, 
  message, 
  Empty, 
  Alert, 
  Button, 
  Card, 
  Row, 
  Col, 
  Tag,
  Modal,
  Typography,
  Input,
  Space
} from 'antd';
import { 
  FileOutlined, 
  ReloadOutlined,
  InfoCircleOutlined,
  EyeOutlined,
  SearchOutlined,
  DatabaseOutlined
} from '@ant-design/icons';
import { getS3Files, previewS3File } from '../services/gravitinoS3Service';
import FileMetadataModal from './FileMetadataModal';

const { Text } = Typography;

const S3FileViewer = ({ catalog, schema, fileset, s3Config, metalake = 'test' }) => {
  const [files, setFiles] = useState([]);
  const [filteredFiles, setFilteredFiles] = useState([]); // 过滤后的文件列表
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState(''); // 搜索关键字
  const [metadataModalVisible, setMetadataModalVisible] = useState(false);
  const [selectedFileForMetadata, setSelectedFileForMetadata] = useState(null);

  // 加载文件列表 - 直接加载所有文件
  const loadFiles = useCallback(async () => {
    if (!s3Config) {
      setError('S3配置不可用');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await getS3Files(catalog, schema, fileset, s3Config, '', true);
      
      if (response && response.files) {
        // 文件已经在getS3Files中过滤和处理过了
        const processedFiles = response.files.map(file => ({
          ...file,
          key: file.path || file.name
        }));

        // 按文件名排序
        processedFiles.sort((a, b) => {
          return (a.displayName || a.name).localeCompare(b.displayName || b.name);
        });

        setFiles(processedFiles);
        setFilteredFiles(processedFiles); // 同时设置过滤列表
      } else {
        setFiles([]);
        setFilteredFiles([]);
      }
    } catch (err) {
      console.error('Failed to load S3 files:', err);
      setError(err.message || 'Failed to load files');
      setFiles([]);
      setFilteredFiles([]);
    } finally {
      setLoading(false);
    }
  }, [catalog, schema, fileset, s3Config]);

  // 搜索过滤功能
  const handleSearch = useCallback((keyword) => {
    setSearchKeyword(keyword);
    if (!keyword.trim()) {
      setFilteredFiles(files);
    } else {
      const filtered = files.filter(file => 
        (file.displayName || file.name).toLowerCase().includes(keyword.toLowerCase())
      );
      setFilteredFiles(filtered);
    }
  }, [files]);

  // 当原始文件列表变化时，重新应用搜索过滤
  useEffect(() => {
    handleSearch(searchKeyword);
  }, [files, searchKeyword, handleSearch]);

  // 初始加载 - 只要有catalog、schema和s3Config就加载
  useEffect(() => {
    console.log('S3FileViewer useEffect triggered:', { catalog, schema, fileset, s3Config });
    if (catalog && schema && s3Config) {
      console.log('Loading S3 files...');
      loadFiles();
    }
  }, [catalog, schema, s3Config, loadFiles]);

  // 删除文件夹导航功能，只显示文件列表

  // 文件预览
  const handlePreview = async (file) => {
    if (file.isFolder) return;

    setPreviewLoading(true);
    setPreviewVisible(true);
    setSelectedFile(file);

    try {
      const filePath = file.path.replace(`s3://${s3Config.bucketName}/`, '');
      const preview = await previewS3File(s3Config.bucketName, filePath, s3Config);
      
      setPreviewContent(preview.content);
      
      if (!preview.previewable) {
        message.warning(preview.message);
      }
    } catch (error) {
      console.error('Preview error:', error);
      message.error(`文件预览失败: ${error.message}`);
      setPreviewContent('');
    } finally {
      setPreviewLoading(false);
    }
  };

  // 查看元数据
  const handleViewMetadata = (file) => {
    // 添加s3Config信息到file对象
    const fileWithConfig = {
      ...file,
      s3Config: {
        ...s3Config,
        catalogName: catalog,
        schemaName: schema
      }
    };
    setSelectedFileForMetadata(fileWithConfig);
    setMetadataModalVisible(true);
  };

  // 格式化文件大小
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 格式化时间
  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    return new Date(timestamp).toLocaleString();
  };

  // 表格列定义
  const columns = [
    {
      title: '名称',
      dataIndex: 'displayName',
      key: 'name',
      render: (text, record) => (
        <div 
          style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <FileOutlined style={{ color: '#666' }} />
          <Text>{text || record.name}</Text>
        </div>
      )
    },
    {
      title: '大小',
      dataIndex: 'size',
      key: 'size',
      render: (size, record) => record.isFolder ? '-' : formatFileSize(size || 0)
    },
    {
      title: '修改时间',
      dataIndex: 'modificationTime',
      key: 'modified',
      render: (time) => formatDate(time)
    },
    {
      title: '存储类型',
      dataIndex: 'storageClass',
      key: 'storageClass',
      render: (storageClass, record) => {
        if (record.isFolder) return '-';
        
        const color = storageClass === 'STANDARD' ? 'blue' : 
                     storageClass === 'GLACIER' ? 'purple' : 'orange';
        
        return <Tag color={color}>{storageClass || 'STANDARD'}</Tag>;
      }
    },
    {
      title: '操作',
      key: 'actions',
      width: 180,
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="link" 
            size="small" 
            icon={<EyeOutlined />}
            onClick={() => handlePreview(record)}
          >
            预览
          </Button>
          <Button 
            type="link" 
            size="small" 
            icon={<DatabaseOutlined />}
            onClick={() => handleViewMetadata(record)}
          >
            查看元数据
          </Button>
        </Space>
      )
    }
  ];

  if (!s3Config) {
    return (
      <Alert
        message="S3配置不可用"
        description="无法获取S3连接配置信息，请检查catalog配置。"
        type="error"
        showIcon
      />
    );
  }

  return (
    <div>
      <Card style={{ margin: '0', borderRadius: '6px' }} bodyStyle={{ padding: '16px' }}>
        {/* 紧凑的头部信息 */}
        <Row justify="space-between" align="middle" style={{ marginBottom: '12px', padding: '8px 0' }}>
          <Col flex="auto">
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
              <Text type="secondary" style={{ fontSize: '13px' }}>
                路径：{catalog}.{schema}.
              </Text>
              <Text strong style={{ fontSize: '13px' }}>
                文件总数: <span style={{ color: '#52c41a' }}>{filteredFiles.length}</span>
                {searchKeyword && <span style={{ color: '#999' }}>/{files.length}</span>}
              </Text>
              <Text strong style={{ fontSize: '13px' }}>
                总大小: <span style={{ color: '#1890ff' }}>{formatFileSize(files.reduce((sum, f) => sum + (f.size || 0), 0))}</span>
              </Text>
              <Text strong style={{ fontSize: '13px' }}>
                存储桶: <span style={{ color: '#666' }}>{s3Config.bucketName}</span>
              </Text>
            </div>
          </Col>
          <Col>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Input
                placeholder="搜索文件名"
                prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                value={searchKeyword}
                onChange={(e) => handleSearch(e.target.value)}
                style={{ width: '200px' }}
                size="small"
                allowClear
              />
              <Button 
                icon={<ReloadOutlined />} 
                onClick={() => loadFiles()}
                loading={loading}
                size="small"
              >
                刷新
              </Button>
            </div>
          </Col>
        </Row>

        {/* 错误信息 */}
        {error && (
          <Alert
            message="加载失败"
            description={error}
            type="error"
            showIcon
            style={{ marginBottom: '16px' }}
            action={
              <Button size="small" danger onClick={() => loadFiles()}>
                重试
              </Button>
            }
          />
        )}

        {/* 文件列表 */}
        <Table
          columns={columns}
          dataSource={filteredFiles}
          loading={loading}
          pagination={{
            showSizeChanger: false,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录${searchKeyword ? ` (已过滤)` : ''}`,
            pageSize: 25,
            size: 'small'
          }}
          locale={{
            emptyText: (
              <Empty 
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={searchKeyword ? `未找到包含"${searchKeyword}"的文件` : "暂无文件数据"}
              />
            )
          }}
          scroll={{ x: true, y: 'calc(100vh - 360px)' }}
          size="small"
        />
      </Card>

      {/* 文件预览Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px' }}>
            <EyeOutlined />
            <span>文件预览</span>
          </div>
        }
        visible={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={[
          <Button key="close" onClick={() => setPreviewVisible(false)} size="small">
            关闭
          </Button>
        ]}
        width="85%"
        style={{ top: 30 }}
        bodyStyle={{ maxHeight: '75vh', overflow: 'auto', padding: '16px' }}
      >
        {selectedFile && (
          <div style={{ marginBottom: '12px' }}>
            {/* 紧凑的文件信息 */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '20px', 
              flexWrap: 'wrap',
              padding: '8px 12px',
              backgroundColor: '#f5f5f5',
              borderRadius: '6px',
              fontSize: '13px'
            }}>
              <Text strong>
                文件名: <span style={{ color: '#1890ff' }}>{selectedFile.displayName || selectedFile.name}</span>
              </Text>
              <Text strong>
                大小: <span style={{ color: '#52c41a' }}>{formatFileSize(selectedFile.size || 0)}</span>
              </Text>
              <Text strong>
                修改时间: <span style={{ color: '#666' }}>{formatDate(selectedFile.modificationTime)}</span>
              </Text>
              <Text strong>
                存储类型: <Tag color="blue" size="small">{selectedFile.storageClass || 'STANDARD'}</Tag>
              </Text>
            </div>
          </div>
        )}
        
        <Spin spinning={previewLoading} size="small">
          {previewContent ? (
            <div style={{
              backgroundColor: '#fafafa',
              border: '1px solid #e8e8e8',
              borderRadius: '6px',
              overflow: 'hidden'
            }}>
              <div style={{
                padding: '8px 12px',
                backgroundColor: '#f0f0f0',
                borderBottom: '1px solid #e8e8e8',
                fontSize: '12px',
                color: '#666'
              }}>
                文件内容预览
              </div>
              <pre style={{ 
                whiteSpace: 'pre-wrap', 
                maxHeight: '400px', 
                overflow: 'auto',
                backgroundColor: '#ffffff',
                padding: '12px',
                margin: '0',
                fontSize: '13px',
                lineHeight: '1.5',
                fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace'
              }}>
                {previewContent}
              </pre>
            </div>
          ) : (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px 20px',
              backgroundColor: '#fafafa',
              borderRadius: '6px',
              border: '1px dashed #d9d9d9'
            }}>
              <InfoCircleOutlined style={{ fontSize: '48px', color: '#bbb' }} />
              <p style={{ marginTop: '12px', color: '#999', fontSize: '14px', marginBottom: '4px' }}>
                {previewLoading ? '正在加载预览...' : '此文件类型暂不支持预览'}
              </p>
              {!previewLoading && selectedFile && (
                <p style={{ color: '#bbb', fontSize: '12px', margin: '0' }}>
                  文件类型：{selectedFile.name?.split('.').pop()?.toUpperCase() || '未知'}
                </p>
              )}
            </div>
          )}
        </Spin>
      </Modal>

      {/* 文件元数据Modal */}
      <FileMetadataModal
        visible={metadataModalVisible}
        onCancel={() => {
          setMetadataModalVisible(false);
          setSelectedFileForMetadata(null);
        }}
        file={selectedFileForMetadata}
        s3Config={{
          ...s3Config,
          catalogName: catalog,
          schemaName: schema
        }}
      />
    </div>
  );
};

export default S3FileViewer;