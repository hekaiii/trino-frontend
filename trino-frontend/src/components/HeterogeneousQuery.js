import React, { useState } from 'react';
import { Button, Modal, Form, Input, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

const HeterogeneousQuery = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      
      const event = new CustomEvent('newQueryTask', {
        detail: {
          taskName: values.taskName
        }
      });
      window.dispatchEvent(event);
      
      setIsModalVisible(false);
      form.resetFields();
      message.success('新查询任务创建成功');
    } catch (error) {
      message.error('请填写任务名称');
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  return (
    <>
      <Button 
        type="primary" 
        icon={<PlusOutlined />} 
        onClick={showModal}
        style={{ width: '100%' }}
      >
        新建查询任务
      </Button>
      
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
        </Form>
      </Modal>
    </>
  );
};

export default HeterogeneousQuery;