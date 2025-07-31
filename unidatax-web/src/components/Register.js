import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Space } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined, UserSwitchOutlined } from '@ant-design/icons';
import { authApi } from '../services/apiService';
import { encodePassword } from '../utils/passwordEncoder';
import PasswordStrengthIndicator from './PasswordStrengthIndicator';

const Register = ({ onRegisterSuccess, onBackToLogin }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [passwordValue, setPasswordValue] = useState('');
  const [usernameValue, setUsernameValue] = useState('');

  const onFinish = async (values) => {
    setLoading(true);
    
    try {
      // 先验证密码强度
      const passwordValidation = await authApi.validatePassword(values.password, values.username);
      
      if (!passwordValidation.valid) {
        message.error('密码强度不符合要求，请根据提示修改密码');
        setLoading(false);
        return;
      }

      // 检查确认密码
      if (values.password !== values.confirmPassword) {
        message.error('两次输入的密码不一致');
        setLoading(false);
        return;
      }

      // 编码密码防止明文传输
      const encodedPassword = encodePassword(values.password);
      
      // 调用注册API  
      await authApi.register({
        username: values.username,
        password: encodedPassword,
        email: values.email,
        realName: values.realName,
        phone: values.phone
      });

      message.success('注册成功！请使用新账号登录');
      
      // 重置表单
      form.resetFields();
      setPasswordValue('');
      setUsernameValue('');
      
      // 回调通知注册成功
      if (onRegisterSuccess) {
        onRegisterSuccess(values.username);
      }
      
    } catch (error) {
      console.error('Registration failed:', error);
      const errorMessage = error.response?.data || error.message || '注册失败，请重试';
      message.error(errorMessage);
      setLoading(false);
    }
  };

  const handlePasswordChange = (e) => {
    setPasswordValue(e.target.value);
  };

  const handleUsernameChange = (e) => {
    setUsernameValue(e.target.value);
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <Card
        title="用户注册"
        style={{
          width: 480,
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
        }}
        headStyle={{
          textAlign: 'center',
          fontSize: '24px',
          fontWeight: 'bold'
        }}
      >
        <Form
          form={form}
          name="register"
          onFinish={onFinish}
          layout="vertical"
          size="large"
          scrollToFirstError
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[
              { required: true, message: '请输入用户名!' },
              { min: 3, message: '用户名至少3个字符' },
              { max: 50, message: '用户名不能超过50个字符' },
              { pattern: /^[a-zA-Z0-9_-]+$/, message: '用户名只能包含字母、数字、下划线和连字符' }
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="请输入用户名（3-50个字符）"
              onChange={handleUsernameChange}
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            rules={[
              { required: true, message: '请输入密码!' },
              { min: 8, message: '密码至少8个字符' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请输入密码（至少8位，包含多种字符类型）"
              onChange={handlePasswordChange}
            />
          </Form.Item>

          {/* 密码强度指示器 */}
          <PasswordStrengthIndicator 
            password={passwordValue} 
            username={usernameValue}
            showSuggestions={true}
            showDetails={true}
          />

          <Form.Item
            name="confirmPassword"
            label="确认密码"
            dependencies={['password']}
            rules={[
              { required: true, message: '请确认密码!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致!'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请再次输入密码"
            />
          </Form.Item>

          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { type: 'email', message: '请输入有效的邮箱地址!' }
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="请输入邮箱地址（可选）"
            />
          </Form.Item>

          <Form.Item
            name="realName"
            label="真实姓名"
            rules={[
              { max: 50, message: '姓名不能超过50个字符' }
            ]}
          >
            <Input
              prefix={<UserSwitchOutlined />}
              placeholder="请输入真实姓名（可选）"
            />
          </Form.Item>

          <Form.Item
            name="phone"
            label="手机号码"
            rules={[
              { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号码' }
            ]}
          >
            <Input
              prefix={<PhoneOutlined />}
              placeholder="请输入手机号码（可选）"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Button onClick={onBackToLogin}>
                返回登录
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                style={{ minWidth: '120px' }}
              >
                注册账号
              </Button>
            </Space>
          </Form.Item>
        </Form>

        <div style={{ marginTop: 16, textAlign: 'center', fontSize: '12px', color: '#666' }}>
          <div>注册即表示您同意我们的用户协议和隐私政策</div>
        </div>
      </Card>
    </div>
  );
};

export default Register;