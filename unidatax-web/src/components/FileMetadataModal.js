import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  Table,
  Button,
  Space,
  message,
  Spin,
  Tag,
  Popconfirm,
  Alert,
  Empty,
  Input,
  Row,
  Col
} from 'antd';
import {
  PlusOutlined,
  ReloadOutlined,
  EditOutlined,
  DeleteOutlined,
  FileSearchOutlined,
  SearchOutlined,
  DatabaseOutlined
} from '@ant-design/icons';
import MetadataEditModal from './MetadataEditModal';
import {
  getFileMetadata,
  parseFileMetadataAuto,
  addManualMetadata,
  updateMetadata,
  deleteMetadata,
  deleteMetadataBatch,
  detectFileType
} from '../services/fileMetadataService';
import { previewS3File } from '../services/gravitinoS3Service';

const FileMetadataModal = ({ visible, onCancel, file, s3Config }) => {
  const [metadataList, setMetadataList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingMetadata, setEditingMetadata] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filteredList, setFilteredList] = useState([]);
  const [parseLoading, setParseLoading] = useState(false);

  // 加载元数据
  const loadMetadata = useCallback(async () => {
    if (!file?.path) return;
    
    setLoading(true);
    try {
      const response = await getFileMetadata(file.path);
      if (response.code === 200 && response.data) {
        setMetadataList(response.data);
        setFilteredList(response.data);
      } else {
        setMetadataList([]);
        setFilteredList([]);
      }
    } catch (error) {
      console.error('Failed to load metadata:', error);
      // 只有在真正网络错误时才显示错误信息
      if (error.response?.status >= 500) {
        message.error('加载元数据失败');
      }
      setMetadataList([]);
      setFilteredList([]);
    } finally {
      setLoading(false);
    }
  }, [file]);

  // 初始加载
  useEffect(() => {
    if (visible && file) {
      loadMetadata();
      setSearchKeyword('');
    }
  }, [visible, file, loadMetadata]);

  // 自然排序函数
  const naturalSort = (a, b) => {
    const keyA = a.metadataKey;
    const keyB = b.metadataKey;
    
    // 提取数字和非数字部分进行比较
    const regex = /(\d+)|(\D+)/g;
    const partsA = keyA.match(regex) || [];
    const partsB = keyB.match(regex) || [];
    
    for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
      const partA = partsA[i] || '';
      const partB = partsB[i] || '';
      
      // 如果两部分都是数字，按数字比较
      if (/^\d+$/.test(partA) && /^\d+$/.test(partB)) {
        const numA = parseInt(partA, 10);
        const numB = parseInt(partB, 10);
        if (numA !== numB) return numA - numB;
      } else {
        // 否则按字符串比较
        if (partA < partB) return -1;
        if (partA > partB) return 1;
      }
    }
    
    return 0;
  };

  // 搜索过滤
  useEffect(() => {
    let list = [...metadataList];
    
    // 先进行排序
    list.sort(naturalSort);
    
    // 再进行过滤
    if (!searchKeyword.trim()) {
      setFilteredList(list);
    } else {
      const keyword = searchKeyword.toLowerCase();
      const filtered = list.filter(item =>
        item.metadataKey.toLowerCase().includes(keyword) ||
        (item.metadataValue && item.metadataValue.toLowerCase().includes(keyword))
      );
      setFilteredList(filtered);
    }
  }, [searchKeyword, metadataList]);

  // 自动解析
  const handleAutoParse = async () => {
    if (!file) return;
    
    const fileName = file.name || file.displayName;
    console.log('文件名:', fileName);
    
    let fileType = detectFileType(fileName);
    console.log('检测到的文件类型:', fileType);
    
    // 如果无法从扩展名检测到类型，尝试从内容检测
    if (!fileType) {
      const confirm = await new Promise((resolve) => {
        Modal.confirm({
          title: '文件类型检测',
          content: `文件名: ${fileName}\n无法从文件扩展名确定类型，是否尝试解析？系统将尝试按JSON格式解析，如果失败会尝试XML格式。`,
          onOk: () => resolve(true),
          onCancel: () => resolve(false),
        });
      });
      
      if (!confirm) return;
      fileType = 'JSON'; // 默认尝试JSON
    }
    
    setParseLoading(true);
    try {
      // 获取文件内容
      const filePath = file.path.replace(`s3://${s3Config.bucketName}/`, '');
      const preview = await previewS3File(s3Config.bucketName, filePath, s3Config);
      
      if (!preview.content) {
        message.error('无法获取文件内容');
        return;
      }
      
      // 调用解析接口，如果失败且是未知类型，尝试另一种格式
      let response;
      try {
        response = await parseFileMetadataAuto({
          filePath: file.path,
          fileContent: preview.content,
          fileType: fileType,
          catalogName: s3Config.catalogName || 'default',
          schemaName: s3Config.schemaName || null,
          bucketName: s3Config.bucketName,
          fileName: file.name || file.displayName
        });
      } catch (firstError) {
        // 如果第一次解析失败，且原来不是明确检测的类型，尝试另一种格式
        if (!detectFileType(file.name || file.displayName)) {
          const alternativeType = fileType === 'JSON' ? 'XML' : 'JSON';
          console.log(`第一次解析失败，尝试${alternativeType}格式`);
          
          try {
            response = await parseFileMetadataAuto({
              filePath: file.path,
              fileContent: preview.content,
              fileType: alternativeType,
              catalogName: s3Config.catalogName || 'default',
              schemaName: s3Config.schemaName || null,
              bucketName: s3Config.bucketName,
              fileName: file.name || file.displayName
            });
          } catch (secondError) {
            throw firstError; // 如果两种格式都失败，抛出第一次的错误
          }
        } else {
          throw firstError;
        }
      }
      
      if (response?.code === 200) {
        message.success(`成功解析 ${response.data?.length || 0} 条元数据`);
        loadMetadata();
      } else {
        message.error(response?.message || '解析失败');
      }
    } catch (error) {
      console.error('Auto parse failed:', error);
      // 根据错误类型提供更友好的提示
      if (error.message?.includes('不支持的文件类型')) {
        message.error('该文件格式不支持自动解析，您可以尝试手动定义元数据');
      } else if (error.message?.includes('解析文件内容失败')) {
        message.error('文件内容格式有误，请检查文件是否为有效的JSON或XML格式');
      } else {
        message.error('自动解析失败: ' + (error.message || '未知错误'));
      }
    } finally {
      setParseLoading(false);
    }
  };

  // 手动添加
  const handleManualAdd = () => {
    setEditingMetadata(null);
    setEditModalVisible(true);
  };

  // 编辑
  const handleEdit = (record) => {
    setEditingMetadata(record);
    setEditModalVisible(true);
  };

  // 保存（添加或更新）
  const handleSave = async (values) => {
    if (!file) return;
    
    try {
      if (editingMetadata?.id) {
        // 更新
        const response = await updateMetadata(editingMetadata.id, values.metadataValue);
        if (response.code === 200) {
          message.success('更新成功');
          loadMetadata();
        } else {
          message.error(response.message || '更新失败');
        }
      } else {
        // 添加
        const response = await addManualMetadata({
          filePath: file.path,
          catalogName: s3Config.catalogName || 'default',
          schemaName: s3Config.schemaName || null,
          bucketName: s3Config.bucketName,
          fileName: file.name || file.displayName,
          fileType: detectFileType(file.name || file.displayName) || 'UNKNOWN',
          metadataKey: values.metadataKey,
          metadataValue: values.metadataValue
        });
        
        if (response.code === 200) {
          message.success('添加成功');
          loadMetadata();
        } else {
          message.error(response.message || '添加失败');
        }
      }
      setEditModalVisible(false);
    } catch (error) {
      console.error('Save metadata failed:', error);
      message.error('保存失败: ' + (error.message || '未知错误'));
    }
  };

  // 删除单条
  const handleDelete = async (id) => {
    try {
      const response = await deleteMetadata(id);
      if (response.code === 200) {
        message.success('删除成功');
        loadMetadata();
      } else {
        message.error(response.message || '删除失败');
      }
    } catch (error) {
      console.error('Delete metadata failed:', error);
      message.error('删除失败');
    }
  };

  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要删除的元数据');
      return;
    }
    
    try {
      const response = await deleteMetadataBatch(selectedRowKeys);
      if (response.code === 200) {
        message.success(`成功删除 ${selectedRowKeys.length} 条元数据`);
        setSelectedRowKeys([]);
        loadMetadata();
      } else {
        message.error(response.message || '批量删除失败');
      }
    } catch (error) {
      console.error('Batch delete failed:', error);
      message.error('批量删除失败');
    }
  };

  // 表格列定义
  const columns = [
    {
      title: '元数据键',
      dataIndex: 'metadataKey',
      key: 'metadataKey',
      width: '35%',
      ellipsis: true,
      render: (text) => (
        <span style={{ fontFamily: 'monospace', fontSize: '13px' }}>
          {text}
        </span>
      )
    },
    {
      title: '元数据值',
      dataIndex: 'metadataValue',
      key: 'metadataValue',
      width: '40%',
      ellipsis: true,
      render: (text) => (
        <span style={{ fontSize: '13px' }}>
          {text || <span style={{ color: '#ccc' }}>空值</span>}
        </span>
      )
    },
    {
      title: '类型',
      dataIndex: 'extractionType',
      key: 'extractionType',
      width: '10%',
      render: (type) => (
        <Tag color={type === 'AUTO' ? 'blue' : 'green'} size="small">
          {type === 'AUTO' ? '自动' : '手动'}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'actions',
      width: '15%',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这条元数据吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
  };

  return (
    <>
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DatabaseOutlined />
            <span>文件元数据管理</span>
            {file && (
              <Tag color="blue" style={{ marginLeft: '8px' }}>
                {file.displayName || file.name}
              </Tag>
            )}
          </div>
        }
        visible={visible}
        onCancel={onCancel}
        width="90%"
        style={{ top: 20 }}
        footer={[
          <Button key="close" onClick={onCancel}>
            关闭
          </Button>
        ]}
      >
        {/* 工具栏 */}
        <div style={{ marginBottom: '16px' }}>
          <Row gutter={16} align="middle">
            <Col flex="auto">
              <Space>
                <Button
                  type="primary"
                  icon={<FileSearchOutlined />}
                  onClick={handleAutoParse}
                  loading={parseLoading}
                  disabled={!file}
                  title={
                    !file ? '请选择文件' :
                    !detectFileType(file?.name || file?.displayName) ? '该文件类型可能不支持自动解析，但您可以尝试' :
                    '自动解析JSON/XML文件内容为元数据'
                  }
                >
                  自动解析当前文件
                </Button>
                <Button
                  icon={<PlusOutlined />}
                  onClick={handleManualAdd}
                >
                  手动定义元数据
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={loadMetadata}
                  loading={loading}
                >
                  刷新
                </Button>
                {selectedRowKeys.length > 0 && (
                  <Popconfirm
                    title={`确定要删除选中的 ${selectedRowKeys.length} 条元数据吗？`}
                    onConfirm={handleBatchDelete}
                    okText="确定"
                    cancelText="取消"
                  >
                    <Button danger icon={<DeleteOutlined />}>
                      批量删除 ({selectedRowKeys.length})
                    </Button>
                  </Popconfirm>
                )}
              </Space>
            </Col>
            <Col>
              <Input
                prefix={<SearchOutlined />}
                placeholder="搜索元数据键或值"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                style={{ width: 250 }}
                allowClear
              />
            </Col>
          </Row>
        </div>

        {/* 提示信息 */}
        {file && !detectFileType(file?.name || file?.displayName) && (
          <Alert
            message="智能解析提示"
            description="系统无法从文件扩展名确定类型，但您仍可以尝试自动解析（将智能检测JSON/XML格式）或手动定义元数据。"
            type="info"
            showIcon
            style={{ marginBottom: '16px' }}
          />
        )}

        {/* 数据表格 */}
        <Spin spinning={loading || parseLoading}>
          <Table
            rowSelection={rowSelection}
            columns={columns}
            dataSource={filteredList}
            rowKey="id"
            pagination={{
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条记录`,
              pageSize: 10,
              size: 'small'
            }}
            scroll={{ y: 400 }}
            size="small"
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    searchKeyword
                      ? `未找到包含"${searchKeyword}"的元数据`
                      : '暂无元数据'
                  }
                >
                  {!searchKeyword && (
                    <Space>
                      <Button
                        type="primary"
                        size="small"
                        onClick={handleAutoParse}
                        disabled={!file || !detectFileType(file?.name || file?.displayName)}
                      >
                        自动解析
                      </Button>
                      <Button size="small" onClick={handleManualAdd}>
                        手动添加
                      </Button>
                    </Space>
                  )}
                </Empty>
              )
            }}
          />
        </Spin>
      </Modal>

      {/* 编辑弹窗 */}
      <MetadataEditModal
        visible={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        onSave={handleSave}
        initialData={editingMetadata}
      />
    </>
  );
};

export default FileMetadataModal;