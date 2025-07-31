import React, { useState, useEffect } from 'react';
import { DatabaseOutlined, SearchOutlined, SunOutlined, MoonOutlined, LogoutOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { Table, Typography, Input, Button, message, Alert, Spin } from 'antd';
import MetadataQuery from './components/MetadataQuery';
import HeterogeneousQuery from './components/HeterogeneousQuery';
import Login from './components/Login';
import { taskApi, authApi } from './services/apiService';
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
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [executing, setExecuting] = useState(false);

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
      const newTask = event.detail;
      setCurrentTask(newTask);
      setSql(newTask.sqlContent || '');
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

    if (!currentTask) {
      message.warning('请先创建查询任务');
      return;
    }

    setExecuting(true);
    setQueryError(null);
    setQueryResults(null);

    try {
      // 首先保存SQL到任务
      await taskApi.updateTask(currentTask.id, {
        ...currentTask,
        sqlContent: sql,
        status: 'RUNNING'
      });

      // 直接调用Trino API执行查询
      const queryResult = await executeQuery(sql);
      
      // 更新任务状态为完成
      const updatedTask = await taskApi.updateTask(currentTask.id, {
        ...currentTask,
        sqlContent: sql,
        status: 'SUCCESS'
      });
      setCurrentTask(updatedTask);
      
      // 设置查询结果
      setQueryResults(queryResult);
      
      message.success('查询执行成功');
    } catch (error) {
      console.error('Query execution failed:', error);
      let errorMessage = '查询执行失败';
      
      if (error.message) {
        errorMessage = error.message;
      }
      
      // 更新任务状态为失败
      try {
        await taskApi.updateTask(currentTask.id, {
          ...currentTask,
          sqlContent: sql,
          status: 'FAILED'
        });
      } catch (updateError) {
        console.error('Update task status failed:', updateError);
      }
      
      setQueryError(errorMessage);
      message.error('查询执行失败: ' + errorMessage);
    } finally {
      setExecuting(false);
    }
  };

  // 保存任务
  const handleSaveTask = async () => {
    if (!currentTask) {
      message.warning('请先创建查询任务');
      return;
    }

    setSaving(true);
    try {
      // 调用后端API保存任务
      const updatedTask = await taskApi.updateTask(currentTask.id, {
        ...currentTask,
        sqlContent: sql,
        status: 'SAVED'
      });
      
      setCurrentTask(updatedTask);
      message.success('任务保存成功');
    } catch (error) {
      console.error('Save task failed:', error);
      let errorMessage = '保存任务失败';
      
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
    } finally {
      setSaving(false);
    }
  };

  // 删除任务
  const handleDeleteTask = async () => {
    if (!currentTask) {
      message.warning('请先创建查询任务');
      return;
    }

    setDeleting(true);
    try {
      // 调用后端API删除任务
      await taskApi.deleteTask(currentTask.id);
      
      message.success('任务删除成功');
      setCurrentTask(null);
      setSql('');
      setQueryResults(null);
      setQueryError(null);
    } catch (error) {
      console.error('Delete task failed:', error);
      let errorMessage = '删除任务失败';
      
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
    } finally {
      setDeleting(false);
    }
  };

  // 清空SQL
  const handleClearSql = () => {
    setSql('');
    setQueryResults(null);
    setQueryError(null);
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
    setIsLoggedIn(true);
    setCurrentUser(username);
  };

  const handleLogout = async () => {
    try {
      // 调用后端登出API
      await authApi.logout();
    } catch (error) {
      console.error('Logout API failed:', error);
      // 即使API失败也要清除本地session
    }
    
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <Title level={3} style={{ margin: 0 }}>SQL编辑器</Title>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button 
                type="primary" 
                onClick={handleSaveTask}
                loading={saving}
              >
                保存任务
              </Button>
              <Button 
                danger 
                onClick={handleDeleteTask}
                loading={deleting}
              >
                删除任务
              </Button>
            </div>
          </div>
          
          <TextArea
            value={sql}
            onChange={handleSqlChange}
            placeholder="请输入SQL查询语句... 例如: SELECT * FROM hive_matestore.default.mytable_hdfs LIMIT 10"
            rows={12}
            style={{ fontFamily: 'monospace', fontSize: '14px', marginBottom: '8px' }}
          />
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button 
              type="primary" 
              icon={<PlayCircleOutlined />}
              onClick={handleExecuteQuery}
              loading={executing}
              size="large"
            >
              执行查询
            </Button>
            <Button 
              onClick={handleClearSql}
              size="large"
            >
              清空
            </Button>
          </div>
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
        {executing && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" />
            <div style={{ marginTop: '16px' }}>
              <Text>正在执行查询...</Text>
            </div>
          </div>
        )}

        {queryResults && !executing && (
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
              <span>异构数据源管理</span>
            </div>
            <div 
              className={`function-icon ${activeFunction === 'query' ? 'active' : ''}`}
              onClick={() => handleFunctionChange('query')}
            >
              <SearchOutlined style={{ fontSize: '18px' }} />
              <span>异构数据源协同处理</span>
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