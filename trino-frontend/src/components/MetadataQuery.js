import React, { useState, useEffect } from 'react';
import { Tree, Spin, message } from 'antd';
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

const MetadataQuery = () => {
  const [treeData, setTreeData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedKeys, setExpandedKeys] = useState([]);
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [currentMetalake, setCurrentMetalake] = useState('test');

  // 获取数据源类型对应的图标
  const getDataSourceIcon = (catalogName) => {
    const iconMap = {
      'mysql': <DatabaseOutlined style={{ color: '#00758F' }} />,
      'postgresql': <DatabaseOutlined style={{ color: '#336791' }} />,
      'oracle': <DatabaseOutlined style={{ color: '#F80000' }} />,
      'sqlserver': <DatabaseOutlined style={{ color: '#CC2927' }} />,
      'mongodb': <FileOutlined style={{ color: '#4DB33D' }} />,
      'elasticsearch': <SearchOutlined style={{ color: '#005571' }} />,
      'redis': <ThunderboltOutlined style={{ color: '#DC382D' }} />,
      'kafka': <ApartmentOutlined style={{ color: '#231F20' }} />,
      'hdfs': <HddOutlined style={{ color: '#FF6900' }} />,
      's3': <CloudOutlined style={{ color: '#FF9900' }} />,
      'hive': <ClusterOutlined style={{ color: '#FDEE21' }} />,
      'system': <SettingOutlined style={{ color: '#722ED1' }} />,
      'information_schema': <InfoCircleOutlined style={{ color: '#1890FF' }} />
    };
    return iconMap[catalogName] || <DatabaseOutlined />;
  };

  useEffect(() => {
    loadCatalogs();
  }, []);

  const loadCatalogs = async () => {
    setLoading(true);
    try {
      const catalogs = await getCatalogs(currentMetalake);
      const catalogNodes = catalogs.map(catalog => ({
        title: catalog,
        key: `catalog-${catalog}`,
        icon: getDataSourceIcon(catalog),
        children: [],
        isLeaf: false,
        type: 'catalog'
      }));
      setTreeData(catalogNodes);
    } catch (error) {
      console.error('Error loading catalogs:', error);
      message.error(`加载Catalog失败: ${error.message}`);
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
      message.error(`加载Schema失败: ${catalogName} - ${error.message}`);
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
      message.error(`加载Table失败: ${catalogName}.${schemaName} - ${error.message}`);
      return [];
    }
  };

  const onLoadData = async (treeNode) => {
    const { key, type, catalogName, schemaName } = treeNode;
    
    if (type === 'catalog') {
      const schemas = await loadSchemas(catalogName || treeNode.title);
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
    if (selectedNode.type === 'table') {
      try {
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
            details: tableDetails
          }
        });
        window.dispatchEvent(event);
      } catch (error) {
        console.error('Error loading table details:', error);
        message.error(`加载表详情失败: ${error.message}`);
      }
    }
    
    setSelectedKeys(keys);
  };

  const onExpand = (keys) => {
    setExpandedKeys(keys);
  };

  if (loading) {
    return <Spin />;
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