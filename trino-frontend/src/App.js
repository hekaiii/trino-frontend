import React, { useState, useEffect } from 'react';
import { DatabaseOutlined, SearchOutlined, SunOutlined, MoonOutlined, LogoutOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { Table, Typography, Input, Button, message, Alert, Spin } from 'antd';
import MetadataQuery from './components/MetadataQuery';
import HeterogeneousQuery from './components/HeterogeneousQuery';
import Login from './components/Login';
import { executeQuery } from './services/trinoService';

const { Title, Text } = Typography;
const { TextArea } = Input;

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeFunction, setActiveFunction] = useState('metadata');
  const [selectedTable, setSelectedTable] = useState(null);
  const [currentTask, setCurrentTask] = useState(null);
  const [sql, setSql] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [queryResults, setQueryResults] = useState(null);
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryError, setQueryError] = useState(null);

  useEffect(() => {
    const checkLoginStatus = () => {
      const sessionUser = sessionStorage.getItem('currentUser');
      const sessionToken = sessionStorage.getItem('authToken');
      const sessionTimestamp = sessionStorage.getItem('loginTimestamp');
      
      if (sessionUser && sessionToken && sessionTimestamp) {
        const loginTime = parseInt(sessionTimestamp);
        const currentTime = Date.now();
        const sessionDuration = 24 * 60 * 60 * 1000; // 24小时
        
        if (currentTime - loginTime < sessionDuration) {
          setIsLoggedIn(true);
          setCurrentUser(sessionUser);
        } else {
          clearSession();
        }
      }
    };

    const handleTableSelect = (event) => {
      setSelectedTable(event.detail);
    };

    const handleNewQueryTask = (event) => {
      setCurrentTask(event.detail);
      setSql('');
    };

    checkLoginStatus();
    window.addEventListener('tableSelected', handleTableSelect);
    window.addEventListener('newQueryTask', handleNewQueryTask);

    return () => {
      window.removeEventListener('tableSelected', handleTableSelect);
      window.removeEventListener('newQueryTask', handleNewQueryTask);
    };
  }, []);

  const handleFunctionChange = (functionName) => {
    setActiveFunction(functionName);
  };

  const handleSqlChange = (e) => {
    setSql(e.target.value);
  };

  const handleExecuteQuery = async () => {
    if (!sql.trim()) {
      message.warning('请输入SQL查询语句');
      return;
    }

    setQueryLoading(true);
    setQueryError(null);
    setQueryResults(null);

    try {
      const result = await executeQuery(sql);
      setQueryResults(result);
      message.success('查询执行成功');
    } catch (error) {
      console.error('Query execution failed:', error);
      setQueryError(error.message || '查询执行失败');
      message.error('查询执行失败');
    } finally {
      setQueryLoading(false);
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.body.classList.toggle('dark-mode', !darkMode);
  };

  const clearSession = () => {
    sessionStorage.removeItem('currentUser');
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('loginTimestamp');
    setIsLoggedIn(false);
    setCurrentUser(null);
  };

  const handleLogin = (username) => {
    const authToken = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const timestamp = Date.now().toString();
    
    sessionStorage.setItem('currentUser', username);
    sessionStorage.setItem('authToken', authToken);
    sessionStorage.setItem('loginTimestamp', timestamp);
    
    setIsLoggedIn(true);
    setCurrentUser(username);
  };

  const handleLogout = () => {
    clearSession();
    setActiveFunction('metadata');
    setSelectedTable(null);
    setCurrentTask(null);
    setSql('');
    message.success('已退出登录');
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  const renderTableDetails = () => {
    if (!selectedTable) {
      return (
        <div>
          <Title level={2}>表详情</Title>
          <Text>请从左侧选择表以查看详细信息</Text>
        </div>
      );
    }

    const columns = [
      {
        title: '字段名',
        dataIndex: 'name',
        key: 'name',
      },
      {
        title: '类型',
        dataIndex: 'type',
        key: 'type',
      },
      {
        title: '注释',
        dataIndex: 'comment',
        key: 'comment',
      },
    ];

    const dataSource = selectedTable.details.columns.map((col, index) => ({
      ...col,
      key: index,
    }));

    return (
      <div>
        <Title level={2}>
          {selectedTable.catalog}.{selectedTable.schema}.{selectedTable.table}
        </Title>
        
        <Title level={3}>字段信息</Title>
        <Table 
          dataSource={dataSource} 
          columns={columns} 
          pagination={false}
          size="middle"
        />
        
        <Title level={3} style={{ marginTop: '20px' }}>建表语句</Title>
        <TextArea
          value={selectedTable.details.ddl}
          readOnly
          rows={10}
          style={{ fontFamily: 'monospace' }}
        />
      </div>
    );
  };

  const renderQueryInterface = () => {
    if (!currentTask) {
      return (
        <div>
          <Title level={2}>SQL查询</Title>
          <Text>请创建新的查询任务</Text>
        </div>
      );
    }

    // 处理查询结果显示的列配置
    const getResultColumns = (data) => {
      if (!data || !data.length) return [];
      
      return Object.keys(data[0]).map(key => ({
        title: key,
        dataIndex: key,
        key: key,
        ellipsis: true,
      }));
    };

    return (
      <div>
        <Title level={2}>查询任务: {currentTask.taskName}</Title>
        
        <div style={{ marginBottom: '16px' }}>
          <Title level={3}>SQL编辑器</Title>
          <TextArea
            value={sql}
            onChange={handleSqlChange}
            placeholder="请输入SQL查询语句... 例如: SELECT * FROM hive_matestore.default.mytable_hdfs LIMIT 10"
            rows={12}
            style={{ fontFamily: 'monospace', fontSize: '14px', marginBottom: '8px' }}
          />
          <Button 
            type="primary" 
            icon={<PlayCircleOutlined />}
            onClick={handleExecuteQuery}
            loading={queryLoading}
            size="large"
          >
            执行查询
          </Button>
        </div>

        {/* 错误信息显示 */}
        {queryError && (
          <Alert
            message="查询执行错误"
            description={queryError}
            type="error"
            showIcon
            style={{ marginBottom: '16px' }}
          />
        )}

        {/* 查询结果显示 */}
        {queryLoading && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" />
            <div style={{ marginTop: '16px' }}>
              <Text>正在执行查询...</Text>
            </div>
          </div>
        )}

        {queryResults && !queryLoading && (
          <div>
            <Title level={3}>查询结果</Title>
            {queryResults.columns && queryResults.data ? (
              <Table
                columns={queryResults.columns}
                dataSource={queryResults.data}
                pagination={{ pageSize: 50, showSizeChanger: true }}
                scroll={{ x: true }}
                size="small"
              />
            ) : queryResults.length > 0 ? (
              <Table
                columns={getResultColumns(queryResults)}
                dataSource={queryResults}
                pagination={{ pageSize: 50, showSizeChanger: true }}
                scroll={{ x: true }}
                size="small"
                rowKey={(record, index) => index}
              />
            ) : (
              <Alert
                message="查询成功"
                description="查询执行完成，但没有返回结果数据"
                type="info"
                showIcon
              />
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="app">
      <div className="app-layout">
        <div className="sidebar">
          <div className="function-icons">
            <div 
              className={`function-icon ${activeFunction === 'metadata' ? 'active' : ''}`}
              onClick={() => handleFunctionChange('metadata')}
            >
              <DatabaseOutlined style={{ fontSize: '18px' }} />
              <span>异构数据源</span>
            </div>
            <div 
              className={`function-icon ${activeFunction === 'query' ? 'active' : ''}`}
              onClick={() => handleFunctionChange('query')}
            >
              <SearchOutlined style={{ fontSize: '18px' }} />
              <span>异构查询</span>
            </div>
          </div>
          
          {activeFunction === 'metadata' && (
            <div className="tree-container">
              <MetadataQuery />
            </div>
          )}
          
          {activeFunction === 'query' && (
            <div className="new-query-section">
              <HeterogeneousQuery />
            </div>
          )}
        </div>
        
        <div className="main-content">
          <div className="main-header">
            <div className="header-left">
              <span>欢迎，{currentUser}</span>
            </div>
            <div className="header-right">
              <Button 
                type="text" 
                icon={darkMode ? <SunOutlined /> : <MoonOutlined />} 
                onClick={toggleDarkMode}
                className="theme-toggle"
                size="large"
              />
              <Button 
                type="text" 
                icon={<LogoutOutlined />} 
                onClick={handleLogout}
                className="logout-btn"
                size="large"
                style={{ marginLeft: 8 }}
              >
                退出
              </Button>
            </div>
          </div>
          <div className="main-body">
            {activeFunction === 'metadata' && renderTableDetails()}
            {activeFunction === 'query' && renderQueryInterface()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;