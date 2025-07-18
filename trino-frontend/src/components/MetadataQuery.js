import React, { useState, useEffect } from 'react';
import { Tree, Spin, message } from 'antd';
import { DatabaseOutlined, TableOutlined, FolderOutlined } from '@ant-design/icons';
import { getCatalogs, getSchemas, getTables, getTableDetails } from '../services/trinoService';

const MetadataQuery = () => {
  const [treeData, setTreeData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedKeys, setExpandedKeys] = useState([]);
  const [selectedKeys, setSelectedKeys] = useState([]);

  useEffect(() => {
    loadCatalogs();
  }, []);

  const loadCatalogs = async () => {
    setLoading(true);
    try {
      const catalogs = await getCatalogs();
      const catalogNodes = catalogs.map(catalog => ({
        title: catalog,
        key: `catalog-${catalog}`,
        icon: <DatabaseOutlined />,
        children: [],
        isLeaf: false,
        type: 'catalog'
      }));
      setTreeData(catalogNodes);
    } catch (error) {
      message.error('加载Catalog失败');
    } finally {
      setLoading(false);
    }
  };

  const loadSchemas = async (catalogName) => {
    try {
      const schemas = await getSchemas(catalogName);
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
      message.error(`加载Schema失败: ${catalogName}`);
      return [];
    }
  };

  const loadTables = async (catalogName, schemaName) => {
    try {
      const tables = await getTables(catalogName, schemaName);
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
      message.error(`加载Table失败: ${catalogName}.${schemaName}`);
      return [];
    }
  };

  const onLoadData = async (treeNode) => {
    const { key, type, catalogName, schemaName } = treeNode;
    
    if (type === 'catalog') {
      const schemas = await loadSchemas(catalogName || treeNode.title);
      return updateTreeData(treeData, key, schemas);
    } else if (type === 'schema') {
      const tables = await loadTables(catalogName, schemaName);
      return updateTreeData(treeData, key, tables);
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
          selectedNode.tableName
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
        message.error('加载表详情失败');
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