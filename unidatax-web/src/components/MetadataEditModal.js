import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, message } from 'antd';

const MetadataEditModal = ({ visible, onCancel, onSave, initialData }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && initialData) {
      form.setFieldsValue({
        metadataKey: initialData.metadataKey || '',
        metadataValue: initialData.metadataValue || ''
      });
    } else if (visible) {
      form.resetFields();
    }
  }, [visible, initialData, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      
      // 验证键格式
      const keyPattern = /^[a-zA-Z0-9._\-@[\]]+$/;
      if (!keyPattern.test(values.metadataKey)) {
        message.error('元数据键格式不正确，只能包含字母、数字、点、下划线、中划线、@和方括号');
        return;
      }
      
      setLoading(true);
      await onSave(values);
      form.resetFields();
      onCancel();
    } catch (error) {
      console.error('Validation failed:', error);
      if (error.errorFields) {
        message.error('请检查输入内容');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={initialData?.id ? '编辑元数据' : '添加元数据'}
      visible={visible}
      onOk={handleOk}
      onCancel={onCancel}
      confirmLoading={loading}
      width={600}
      okText="保存"
      cancelText="取消"
    >
      <Form
        form={form}
        layout="vertical"
        autoComplete="off"
      >
        <Form.Item
          name="metadataKey"
          label="元数据键"
          rules={[
            { required: true, message: '请输入元数据键' },
            { max: 500, message: '元数据键最多500个字符' }
          ]}
          extra="支持点分隔格式，如: property.name, database.host"
        >
          <Input 
            placeholder="例如: property.name 或 config.database.host"
            disabled={!!initialData?.id} // 编辑时不允许修改键
          />
        </Form.Item>

        <Form.Item
          name="metadataValue"
          label="元数据值"
          rules={[
            { required: true, message: '请输入元数据值' }
          ]}
        >
          <Input.TextArea 
            placeholder="请输入元数据值"
            rows={4}
            maxLength={5000}
            showCount
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default MetadataEditModal;