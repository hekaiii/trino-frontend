import React, { useState, useEffect, useRef } from 'react';
import { Form, Input, Button, Card, message, Space } from 'antd';
import { UserOutlined, LockOutlined, SafetyOutlined } from '@ant-design/icons';
import { generateCaptcha, drawCaptcha } from '../utils/captcha';
import { authApi } from '../services/apiService';
import { encodePassword } from '../utils/passwordEncoder';
import Register from './Register';

const Login = ({ onLogin }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [captchaText, setCaptchaText] = useState('');
  const [showRegister, setShowRegister] = useState(false);
  const canvasRef = useRef(null);


  useEffect(() => {
    refreshCaptcha();
  }, []);

  const refreshCaptcha = () => {
    const newCaptcha = generateCaptcha();
    setCaptchaText(newCaptcha);
    
    if (canvasRef.current) {
      drawCaptcha(canvasRef.current, newCaptcha);
    }
  };

  const validateCaptcha = (inputValue) => {
    if (!inputValue) return false;
    return inputValue.toLowerCase() === captchaText.toLowerCase();
  };

  const onFinish = async (values) => {
    setLoading(true);
    
    try {
      const { username, password, captcha } = values;
      
      if (!validateCaptcha(captcha)) {
        message.error('验证码错误，请重新输入');
        refreshCaptcha();
        form.setFieldValue('captcha', '');
        setLoading(false);
        return;
      }

      // 编码密码防止明文传输
      const encodedPassword = encodePassword(password);
      
      // 调用后端登录API
      const loginResponse = await authApi.login({
        username,
        password: encodedPassword,
        rememberMe: false
      });

      // 保存登录信息到sessionStorage
      sessionStorage.setItem('authToken', loginResponse.token);
      sessionStorage.setItem('userId', loginResponse.userId.toString());
      sessionStorage.setItem('currentUser', loginResponse.username);
      sessionStorage.setItem('userRole', loginResponse.role);
      sessionStorage.setItem('loginTimestamp', Date.now().toString());

      message.success('登录成功！');
      
      setTimeout(() => {
        onLogin(loginResponse.username);
      }, 1000);
      
    } catch (error) {
      console.error('Login failed:', error);
      let errorMessage = '登录失败，请重试';
      
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
      refreshCaptcha();
      form.setFieldValue('captcha', '');
      setLoading(false);
    }
  };

  const handleRegisterSuccess = (username) => {
    setShowRegister(false);
    // 可以预填用户名
    form.setFieldValue('username', username);
    message.success('注册成功！请登录');
  };

  const handleBackToLogin = () => {
    setShowRegister(false);
  };

  // 如果显示注册页面
  if (showRegister) {
    return (
      <Register 
        onRegisterSuccess={handleRegisterSuccess}
        onBackToLogin={handleBackToLogin}
      />
    );
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <Card
        title="系统登录"
        style={{
          width: 400,
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
          name="login"
          onFinish={onFinish}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="username"
            label="账号"
            rules={[
              { required: true, message: '请输入账号!' }
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="请输入账号"
              autoComplete="username"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            rules={[
              { required: true, message: '请输入密码!' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请输入密码"
              autoComplete="current-password"
            />
          </Form.Item>

          <Form.Item
            name="captcha"
            label="验证码"
            rules={[
              { required: true, message: '请输入验证码!' },
              { len: 4, message: '验证码必须是4位字符!' }
            ]}
          >
            <Space.Compact style={{ display: 'flex' }}>
              <Input
                prefix={<SafetyOutlined />}
                placeholder="请输入验证码"
                maxLength={4}
                style={{ flex: 1 }}
              />
              <div style={{ display: 'flex', alignItems: 'center', marginLeft: 8 }}>
                <canvas
                  ref={canvasRef}
                  width={100}
                  height={40}
                  style={{
                    border: '1px solid #d9d9d9',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                  onClick={refreshCaptcha}
                />
                <Button
                  type="link"
                  onClick={refreshCaptcha}
                  style={{ padding: '0 8px', fontSize: '12px' }}
                >
                  刷新
                </Button>
              </div>
            </Space.Compact>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{ height: 45 }}
            >
              登录
            </Button>
          </Form.Item>
        </Form>

        <div style={{ marginTop: 16, textAlign: 'center', fontSize: '12px', color: '#666' }}>
          <div>点击验证码图片可刷新</div>
          <div>验证码不区分大小写</div>
        </div>
      </Card>
    </div>
  );
};

export default Login;