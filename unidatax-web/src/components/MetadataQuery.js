import React, { useState, useEffect } from 'react';
import { Tree, Spin, message, Empty, Alert, Button } from 'antd';
import { 
  DatabaseOutlined, 
  TableOutlined, 
  FolderOutlined,
  CloudOutlined,
  HddOutlined,
  SearchOutlined,
  InfoCircleOutlined,
  SettingOutlined,
  FileOutlined,
  ThunderboltOutlined,
  ApartmentOutlined,
  ClusterOutlined
} from '@ant-design/icons';
import { getCatalogs, getSchemas, getTables, getTableDetails } from '../services/gravitinoService';
import { getS3ConfigSync } from '../services/gravitinoS3Service';
import { extractS3ConfigFromCatalog } from '../config/s3Config';

const MetadataQuery = () => {
  const [treeData, setTreeData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedKeys, setExpandedKeys] = useState([]);
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [currentMetalake, setCurrentMetalake] = useState('test');
  const [error, setError] = useState(null);

  // 查找catalog节点的辅助函数
  const findCatalogNode = (nodes, catalogName) => {
    for (const node of nodes) {
      if (node.type === 'catalog' && node.catalogName === catalogName) {
        return node;
      }
      if (node.children && node.children.length > 0) {
        const found = findCatalogNode(node.children, catalogName);
        if (found) return found;
      }
    }
    return null;
  };

  // 获取数据源类型对应的图标 - 基于provider类型
  const getDataSourceIcon = (provider, isS3 = false) => {
    // 首先检查是否为S3类型
    if (isS3) {
      return <CloudOutlined style={{ color: '#FF9900' }} />;
    }
    
    const iconMap = {
      'jdbc-mysql': <DatabaseOutlined style={{ color: '#00758F' }} />,
      'jdbc-postgresql': <DatabaseOutlined style={{ color: '#336791' }} />,
      'jdbc-oracle': <DatabaseOutlined style={{ color: '#F80000' }} />,
      'jdbc-sqlserver': <DatabaseOutlined style={{ color: '#CC2927' }} />,
      'jdbc-mariadb': <DatabaseOutlined style={{ color: '#003545' }} />,
      'jdbc-oceanbase': <DatabaseOutlined style={{ color: '#0089FF' }} />,
      'jdbc-tidb': <DatabaseOutlined style={{ color: '#FF6B00' }} />,
      'jdbc-starrocks': <DatabaseOutlined style={{ color: '#5A3FFF' }} />,
      'mongodb': <FileOutlined style={{ color: '#4DB33D' }} />,
      'elasticsearch': <SearchOutlined style={{ color: '#005571' }} />,
      'redis': <ThunderboltOutlined style={{ color: '#DC382D' }} />,
      'kafka': <ApartmentOutlined style={{ color: '#231F20' }} />,
      'hdfs': <HddOutlined style={{ color: '#FF6900' }} />,
      'hadoop': <HddOutlined style={{ color: '#FF6900' }} />,
      's3': <CloudOutlined style={{ color: '#FF9900' }} />,
      'hive': <ClusterOutlined style={{ color: '#FDEE21' }} />,
      'iceberg': <DatabaseOutlined style={{ color: '#3498DB' }} />,
      'hudi': <DatabaseOutlined style={{ color: '#FFA500' }} />,
      'system': <SettingOutlined style={{ color: '#722ED1' }} />,
      'information_schema': <InfoCircleOutlined style={{ color: '#1890FF' }} />
    };
    return iconMap[provider] || <DatabaseOutlined />;
  };

  useEffect(() => {
    loadCatalogs();
  }, []);

  // 获取provider类型的显示名称
  const getProviderDisplayName = (provider) => {
    const providerMap = {
      's3': 'S3',
      'hadoop': 'Hadoop/S3',
      'jdbc-mysql': 'MySQL',
      'jdbc-postgresql': 'PostgreSQL',
      'jdbc-oracle': 'Oracle',
      'jdbc-sqlserver': 'SQL Server',
      'mongodb': 'MongoDB',
      'elasticsearch': 'ElasticSearch',
      'redis': 'Redis',
      'kafka': 'Kafka',
      'hdfs': 'HDFS',
      'hive': 'Hive',
      'iceberg': 'Iceberg',
      'hudi': 'Hudi',
      'jdbc-mariadb': 'MariaDB',
      'jdbc-oceanbase': 'OceanBase',
      'jdbc-tidb': 'TiDB',
      'jdbc-starrocks': 'StarRocks'
    };
    return providerMap[provider] || provider;
  };

  const loadCatalogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const catalogs = await getCatalogs(currentMetalake);
      const catalogNodes = catalogs.map(catalog => {
        // catalog现在是一个对象，包含name, type, provider等信息
        const catalogName = typeof catalog === 'string' ? catalog : catalog.name;
        const provider = typeof catalog === 'object' ? catalog.provider : 'unknown';
        const catalogType = typeof catalog === 'object' ? catalog.type : 'unknown';
        
        // 判断是否为S3类型
        const isS3 = catalogType === 'fileset' && 
                     (provider === 's3' || 
                      (provider === 'hadoop' && catalog.properties?.['filesystem-providers'] === 's3') ||
                      catalog.properties?.['s3-endpoint'] !== undefined);
        
        // Debug信息 - 检查test01的类型识别
        if (catalogName === 'test01') {
          console.log('test01 catalog info:', {
            catalogName,
            catalogType,
            provider,
            isS3,
            properties: catalog.properties
          });
        }
        
        // 生成显示标题，包含类型信息
        const displayTitle = `${catalogName} [${getProviderDisplayName(provider)}]`;
        
        return {
          title: displayTitle,
          key: `catalog-${catalogName}`,
          icon: getDataSourceIcon(provider, isS3),
          children: [],
          isLeaf: isS3, // S3类型的catalog是叶子节点，不显示展开箭头
          type: 'catalog',
          catalogName: catalogName,  // 保存原始catalog名称
          provider: provider,
          catalogType: catalogType,
          isS3: isS3,
          properties: catalog.properties || {}
        };
      });
      setTreeData(catalogNodes);
    } catch (error) {
      console.error('Error loading catalogs:', error);
      setError(error.message);
      setTreeData([]);
      // 不再显示message.error，改为在界面中显示错误信息
    } finally {
      setLoading(false);
    }
  };

  const loadSchemas = async (catalogName) => {
    try {
      const schemas = await getSchemas(catalogName, currentMetalake);
      return schemas.map(schema => ({
        title: schema,
        key: `schema-${catalogName}-${schema}`,
        icon: <FolderOutlined />,
        children: [],
        isLeaf: false,
        type: 'schema',
        catalogName,
        schemaName: schema
      }));
    } catch (error) {
      console.error('Error loading schemas:', error);
      message.error(`${error.message}`);
      return [];
    }
  };

  const loadTables = async (catalogName, schemaName) => {
    try {
      const tables = await getTables(catalogName, schemaName, currentMetalake);
      return tables.map(table => ({
        title: table,
        key: `table-${catalogName}-${schemaName}-${table}`,
        icon: <TableOutlined />,
        isLeaf: true,
        type: 'table',
        catalogName,
        schemaName,
        tableName: table
      }));
    } catch (error) {
      console.error('Error loading tables:', error);
      message.error(`${error.message}`);
      return [];
    }
  };

  const onLoadData = async (treeNode) => {
    const { key, type, catalogName, schemaName, isS3 } = treeNode;
    
    // 如果是S3类型的catalog，不加载子项目，直接在右侧显示详情
    if (type === 'catalog' && isS3) {
      return; // 不加载子项目
    }
    
    if (type === 'catalog') {
      // 使用catalogName属性而不是title
      const schemas = await loadSchemas(catalogName);
      const newTreeData = updateTreeData(treeData, key, schemas);
      setTreeData(newTreeData);
    } else if (type === 'schema') {
      const tables = await loadTables(catalogName, schemaName);
      const newTreeData = updateTreeData(treeData, key, tables);
      setTreeData(newTreeData);
    }
  };

  const updateTreeData = (list, key, children) => {
    return list.map(node => {
      if (node.key === key) {
        return { ...node, children };
      }
      if (node.children) {
        return { ...node, children: updateTreeData(node.children, key, children) };
      }
      return node;
    });
  };

  const onSelect = async (keys, info) => {
    if (keys.length === 0) return;
    
    const selectedNode = info.node;
    console.log('Selected node:', selectedNode);
    
    // 如果点击的是S3类型的catalog，直接显示S3详情
    if (selectedNode.type === 'catalog' && selectedNode.isS3) {
      console.log('S3 catalog selected, showing S3 details');
      
      const s3Config = selectedNode.properties ? extractS3ConfigFromCatalog({
        name: selectedNode.catalogName,
        properties: selectedNode.properties
      }) : getS3ConfigSync(selectedNode.catalogName);
      
      const event = new CustomEvent('filesetSelected', {
        detail: {
          catalog: selectedNode.catalogName,
          schema: 'fileresource', // 使用默认schema
          fileset: '', // 根目录
          isS3: true,
          s3Config: s3Config
        }
      });
      window.dispatchEvent(event);
      return;
    }
    
    if (selectedNode.type === 'table') {
      try {
        // 检查是否为S3类型的catalog - 使用节点上的isS3标记
        const catalogName = selectedNode.catalogName;
        // 向上查找catalog节点获取isS3标记
        const catalogNode = findCatalogNode(treeData, catalogName);
        console.log('Found catalog node:', catalogNode);
        
        if (catalogNode?.isS3) {
          // 对于S3类型，发送fileset选中事件而不是table事件
          // 从catalog节点获取S3配置
          const s3Config = catalogNode?.properties ? extractS3ConfigFromCatalog({
            name: catalogName,
            properties: catalogNode.properties
          }) : getS3ConfigSync(catalogName);
          
          const event = new CustomEvent('filesetSelected', {
            detail: {
              catalog: selectedNode.catalogName,
              schema: selectedNode.schemaName,
              fileset: selectedNode.tableName, // 对于S3，这里是fileset名称
              isS3: true,
              s3Config: s3Config
            }
          });
          window.dispatchEvent(event);
        } else {
          // 传统表格处理
          const tableDetails = await getTableDetails(
            selectedNode.catalogName,
            selectedNode.schemaName,
            selectedNode.tableName,
            currentMetalake
          );
          
          const event = new CustomEvent('tableSelected', {
            detail: {
              catalog: selectedNode.catalogName,
              schema: selectedNode.schemaName,
              table: selectedNode.tableName,
              details: tableDetails,
              isS3: false
            }
          });
          window.dispatchEvent(event);
        }
      } catch (error) {
        console.error('Error loading details:', error);
        message.error(`加载详情失败: ${error.message}`);
      }
    }
    
    setSelectedKeys(keys);
  };

  const onExpand = (keys) => {
    setExpandedKeys(keys);
  };

  if (loading) {
    return <Spin tip="正在加载数据源信息..." />;
  }

  if (error) {
    return (
      <div style={{ padding: '20px' }}>
        <Alert
          message="数据源连接失败"
          description={error}
          type="error"
          showIcon
          action={
            <Button 
              size="small" 
              danger 
              onClick={loadCatalogs}
            >
              重试连接
            </Button>
          }
        />
        <Empty 
          style={{ marginTop: '20px' }}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="无法获取数据源信息，请检查Gravitino服务状态"
        />
      </div>
    );
  }

  if (treeData.length === 0) {
    return (
      <Empty 
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="暂无可用的数据源"
      />
    );
  }

  return (
    <Tree
      showIcon
      loadData={onLoadData}
      treeData={treeData}
      onSelect={onSelect}
      onExpand={onExpand}
      expandedKeys={expandedKeys}
      selectedKeys={selectedKeys}
    />
  );
};

export default MetadataQuery;