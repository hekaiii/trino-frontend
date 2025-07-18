import React, { useState, useEffect } from 'react';
import { DatabaseOutlined, SearchOutlined } from '@ant-design/icons';
import { Table, Typography, Input } from 'antd';
import MetadataQuery from './components/MetadataQuery';
import HeterogeneousQuery from './components/HeterogeneousQuery';

const { Title, Text } = Typography;
const { TextArea } = Input;

const App = () => {
  const [activeFunction, setActiveFunction] = useState('metadata');
  const [selectedTable, setSelectedTable] = useState(null);
  const [currentTask, setCurrentTask] = useState(null);
  const [sql, setSql] = useState('');

  useEffect(() => {
    const handleTableSelect = (event) => {
      setSelectedTable(event.detail);
    };

    const handleNewQueryTask = (event) => {
      setCurrentTask(event.detail);
      setSql('');
    };

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

    return (
      <div>
        <Title level={2}>查询任务: {currentTask.taskName}</Title>
        <Title level={3}>SQL编辑器</Title>
        <TextArea
          value={sql}
          onChange={handleSqlChange}
          placeholder="请输入SQL查询语句..."
          rows={20}
          style={{ fontFamily: 'monospace', fontSize: '14px' }}
        />
      </div>
    );
  };

  return (
    <div className="app">
      <div className="sidebar">
        <div className="function-icons">
          <div 
            className={`function-icon ${activeFunction === 'metadata' ? 'active' : ''}`}
            onClick={() => handleFunctionChange('metadata')}
          >
            <DatabaseOutlined style={{ fontSize: '18px' }} />
            <span>元数据查询</span>
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
        {activeFunction === 'metadata' && renderTableDetails()}
        {activeFunction === 'query' && renderQueryInterface()}
      </div>
    </div>
  );
};

export default App;