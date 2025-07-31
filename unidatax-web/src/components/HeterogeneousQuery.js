import React, { useState, useEffect } from 'react';
import { Button, Modal, Form, Input, message, List, Typography, Space, Tag, Tooltip, Spin } from 'antd';
import { PlusOutlined, EditOutlined, PlayCircleOutlined, DeleteOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { taskApi } from '../services/apiService';

const { Text, Title } = Typography;

const HeterogeneousQuery = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadTasks();
  }, [currentPage]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const response = await taskApi.getUserTasks(currentPage, 10);
      setTasks(response.records || []);
      setTotal(response.total || 0);
    } catch (error) {
      console.error('获取任务列表失败:', error);
      message.error('获取任务列表失败');
    } finally {
      setLoading(false);
    }
  };

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      
      // 调用后端API创建任务
      const userId = sessionStorage.getItem('userId');
      const newTask = await taskApi.createTask({
        taskName: values.taskName,
        description: values.description || '',
        userId: parseInt(userId),
        status: 'DRAFT',
        datasourceType: 'TRINO'
      });
      
      const event = new CustomEvent('newQueryTask', {
        detail: newTask
      });
      window.dispatchEvent(event);
      
      setIsModalVisible(false);
      form.resetFields();
      message.success('新查询任务创建成功');
      
      // 重新加载任务列表
      loadTasks();
    } catch (error) {
      console.error('Create task failed:', error);
      let errorMessage = '创建任务失败';
      
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      message.error(errorMessage);
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleTaskClick = (task) => {
    // 触发事件，让主界面切换到该任务
    const event = new CustomEvent('newQueryTask', {
      detail: task
    });
    window.dispatchEvent(event);
  };

  const handleDeleteTask = async (taskId, taskName) => {
    try {
      await taskApi.deleteTask(taskId);
      message.success(`任务 "${taskName}" 删除成功`);
      loadTasks(); // 重新加载列表
    } catch (error) {
      console.error('删除任务失败:', error);
      message.error('删除任务失败');
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      'DRAFT': { color: 'default', text: '草稿' },
      'SAVED': { color: 'blue', text: '已保存' },
      'RUNNING': { color: 'processing', text: '运行中' },
      'COMPLETED': { color: 'success', text: '已完成' },
      'FAILED': { color: 'error', text: '失败' }
    };
    
    const config = statusMap[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN');
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Button 
        type="primary" 
        icon={<PlusOutlined />} 
        onClick={showModal}
        style={{ width: '100%', marginBottom: '16px' }}
      >
        新建查询任务
      </Button>
      
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <Title level={4} style={{ margin: '0 0 12px 0' }}>查询任务列表</Title>
        
        <Spin spinning={loading}>
          <List
            size="small"
            dataSource={tasks}
            pagination={{
              current: currentPage,
              total: total,
              pageSize: 10,
              size: 'small',
              showSizeChanger: false,
              onChange: (page) => setCurrentPage(page),
            }}
            renderItem={task => (
              <List.Item
                style={{ 
                  padding: '8px 0',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  margin: '2px 0'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                onClick={() => handleTaskClick(task)}
                actions={[
                  <Tooltip title="删除任务">
                    <Button 
                      type="text" 
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTask(task.id, task.taskName);
                      }}
                      danger
                    />
                  </Tooltip>
                ]}
              >
                <List.Item.Meta
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Text strong style={{ fontSize: '13px' }} ellipsis={{ tooltip: task.taskName }}>
                        {task.taskName}
                      </Text>
                      {getStatusTag(task.status)}
                    </div>
                  }
                  description={
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      <div style={{ marginBottom: '2px' }}>
                        <ClockCircleOutlined style={{ marginRight: '4px' }} />
                        {formatDate(task.updateTime)}
                      </div>
                      {task.description && (
                        <Text ellipsis={{ tooltip: task.description }} style={{ fontSize: '12px' }}>
                          {task.description}
                        </Text>
                      )}
                    </div>
                  }
                />
              </List.Item>
            )}
            locale={{ emptyText: '暂无查询任务' }}
          />
        </Spin>
      </div>
      
      <Modal
        title="新建查询任务"
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        okText="创建"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="任务名称"
            name="taskName"
            rules={[{ required: true, message: '请输入任务名称' }]}
          >
            <Input placeholder="请输入任务名称" />
          </Form.Item>
          <Form.Item
            label="任务描述"
            name="description"
          >
            <Input.TextArea 
              placeholder="请输入任务描述（可选）" 
              rows={3}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default HeterogeneousQuery;