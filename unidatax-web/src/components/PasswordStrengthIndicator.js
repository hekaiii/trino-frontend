import React, { useState, useEffect, useCallback } from 'react';
import { Progress, Alert, List, Typography } from 'antd';
import { CheckCircleFilled, ExclamationCircleFilled, CloseCircleFilled } from '@ant-design/icons';
import { authApi } from '../services/apiService';
// 简单的防抖函数实现
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

const { Text } = Typography;

const PasswordStrengthIndicator = ({ 
  password, 
  username = null, 
  showSuggestions = true, 
  showDetails = true,
  style = {} 
}) => {
  const [validationResult, setValidationResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // 防抖的密码校验函数
  const debouncedValidatePassword = useCallback(
    debounce(async (pwd, user) => {
      if (!pwd || pwd.length === 0) {
        setValidationResult(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const result = await authApi.validatePassword(pwd, user);
        setValidationResult(result);
      } catch (error) {
        console.error('Password validation failed:', error);
        setValidationResult(null);
      } finally {
        setLoading(false);
      }
    }, 500),
    []
  );

  // 当密码或用户名变化时触发校验
  useEffect(() => {
    debouncedValidatePassword(password, username);
    return () => {
      debouncedValidatePassword.cancel();
    };
  }, [password, username, debouncedValidatePassword]);

  // 获取强度颜色
  const getStrengthColor = (strength) => {
    if (strength >= 80) return '#52c41a'; // 绿色 - 强
    if (strength >= 60) return '#faad14'; // 橙色 - 中等
    if (strength >= 40) return '#fa8c16'; // 深橙色 - 较弱
    return '#f5222d'; // 红色 - 弱
  };

  // 获取强度文本颜色
  const getStrengthTextColor = (strength) => {
    if (strength >= 80) return '#389e0d';
    if (strength >= 60) return '#d48806';
    if (strength >= 40) return '#d4380d';
    return '#cf1322';
  };

  if (!password || password.length === 0) {
    return null;
  }

  return (
    <div style={{ marginTop: '8px', ...style }}>
      {/* 密码强度进度条 */}
      {validationResult && (
        <div style={{ marginBottom: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <Text style={{ fontSize: '12px', color: '#666' }}>密码强度</Text>
            <Text 
              style={{ 
                fontSize: '12px', 
                fontWeight: 'bold',
                color: getStrengthTextColor(validationResult.strength)
              }}
            >
              {validationResult.strengthText} ({validationResult.strength}分)
            </Text>
          </div>
          <Progress
            percent={validationResult.strength}
            strokeColor={getStrengthColor(validationResult.strength)}
            trailColor="#f0f0f0"
            strokeWidth={6}
            showInfo={false}
            style={{ marginBottom: '8px' }}
          />
        </div>
      )}

      {/* 错误信息 */}
      {validationResult && validationResult.errors && validationResult.errors.length > 0 && (
        <Alert
          message="密码不符合要求"
          type="error"
          showIcon
          style={{ marginBottom: '8px', fontSize: '12px' }}
          description={
            <List
              size="small"
              dataSource={validationResult.errors}
              renderItem={(item) => (
                <List.Item style={{ padding: '2px 0', border: 'none' }}>
                  <CloseCircleFilled style={{ color: '#f5222d', marginRight: '4px' }} />
                  <Text style={{ fontSize: '12px' }}>{item}</Text>
                </List.Item>
              )}
            />
          }
        />
      )}

      {/* 警告信息 */}
      {validationResult && validationResult.warnings && validationResult.warnings.length > 0 && (
        <Alert
          message="密码安全建议"
          type="warning"
          showIcon
          style={{ marginBottom: '8px', fontSize: '12px' }}
          description={
            <List
              size="small"
              dataSource={validationResult.warnings}
              renderItem={(item) => (
                <List.Item style={{ padding: '2px 0', border: 'none' }}>
                  <ExclamationCircleFilled style={{ color: '#faad14', marginRight: '4px' }} />
                  <Text style={{ fontSize: '12px' }}>{item}</Text>
                </List.Item>
              )}
            />
          }
        />
      )}

      {/* 成功信息 */}
      {validationResult && validationResult.valid && validationResult.strength >= 60 && (
        <Alert
          message="密码强度良好"
          type="success"
          showIcon
          style={{ marginBottom: '8px', fontSize: '12px' }}
        />
      )}

      {/* 密码建议（可选显示） */}
      {showSuggestions && validationResult && validationResult.suggestions && showDetails && (
        <Alert
          message="密码安全建议"
          type="info"
          showIcon
          style={{ marginBottom: '8px', fontSize: '12px' }}
          description={
            <List
              size="small"
              dataSource={validationResult.suggestions}
              renderItem={(item) => (
                <List.Item style={{ padding: '2px 0', border: 'none' }}>
                  <CheckCircleFilled style={{ color: '#1890ff', marginRight: '4px' }} />
                  <Text style={{ fontSize: '12px' }}>{item}</Text>
                </List.Item>
              )}
            />
          }
        />
      )}

      {/* 详细要求说明 */}
      {showDetails && (!validationResult || !validationResult.valid) && (
        <div style={{ marginTop: '8px' }}>
          <Text style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>
            密码要求：
          </Text>
          <List
            size="small"
            dataSource={[
              '长度至少8位字符',
              '包含至少3种字符类型（大写字母、小写字母、数字、特殊字符）',
              '避免使用常见弱密码和个人信息',
              '不包含连续或重复字符'
            ]}
            renderItem={(item) => (
              <List.Item style={{ padding: '1px 0', border: 'none' }}>
                <Text style={{ fontSize: '11px', color: '#999' }}>• {item}</Text>
              </List.Item>
            )}
          />
        </div>
      )}

      {loading && (
        <Text style={{ fontSize: '12px', color: '#1890ff' }}>检查密码强度中...</Text>
      )}
    </div>
  );
};

export default PasswordStrengthIndicator;