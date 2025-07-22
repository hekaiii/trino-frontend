import React, { useState, useEffect, useRef } from 'react';
import { Form, Input, Button, Card, message, Space } from 'antd';
import { UserOutlined, LockOutlined, SafetyOutlined } from '@ant-design/icons';
import { generateCaptcha, drawCaptcha } from '../utils/captcha';

const Login = ({ onLogin }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [captchaText, setCaptchaText] = useState('');
  const canvasRef = useRef(null);

  const hardcodedCredentials = {
    username: 'test',
    password: 'R?p!Ex}p8V'
  };

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

      if (username !== hardcodedCredentials.username || password !== hardcodedCredentials.password) {
        message.error('用户名或密码错误');
        refreshCaptcha();
        form.setFieldValue('captcha', '');
        setLoading(false);
        return;
      }

      message.success('登录成功！');
      
      setTimeout(() => {
        onLogin(username);
      }, 1000);
      
    } catch (error) {
      message.error('登录失败，请重试');
      refreshCaptcha();
      form.setFieldValue('captcha', '');
      setLoading(false);
    }
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