# Trino Frontend

一个基于 React 的前端项目，用于对接 Trino 服务，实现异构数据源查询功能。

## 功能特性

- **元数据查询**: 展示 Trino 服务中已注册的 catalog 信息，支持树状结构浏览
- **异构查询**: 支持创建查询任务，提供 SQL 编辑器进行查询操作
- **响应式布局**: 左侧栏占屏幕 1/5，右侧内容区占 4/5

## 项目结构

```
trino-frontend/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── MetadataQuery.js    # 元数据查询组件
│   │   └── HeterogeneousQuery.js # 异构查询组件
│   ├── services/
│   │   └── trinoService.js     # Trino API 服务
│   ├── styles/
│   │   └── index.css           # 样式文件
│   ├── App.js                  # 主应用组件
│   └── index.js                # 入口文件
├── package.json
└── README.md
```

## 安装和运行

1. 安装依赖：
```bash
npm install
```

2. 配置环境变量：
```bash
cp .env.example .env
```

3. 启动开发服务器：
```bash
npm start
```

## 环境配置

在 `.env` 文件中配置后端 API 地址：

```
REACT_APP_API_BASE_URL=http://localhost:8080
```

## 后端 API 接口

项目需要后端提供以下 API 接口：

- `GET /api/catalogs` - 获取所有 catalog
- `GET /api/catalogs/{catalog}/schemas` - 获取指定 catalog 的 schema
- `GET /api/catalogs/{catalog}/schemas/{schema}/tables` - 获取指定 schema 的表
- `GET /api/catalogs/{catalog}/schemas/{schema}/tables/{table}` - 获取表详情
- `POST /api/query` - 执行 SQL 查询

## 技术栈

- React 18
- Ant Design (UI 组件库)
- Axios (HTTP 客户端)
- CSS3 (样式)

## 使用说明

1. **元数据查询**：点击左侧的"元数据查询"图标，在树状结构中浏览 catalog、schema 和表，点击表名可在右侧查看表详情
2. **异构查询**：点击左侧的"异构查询"图标，点击"新建查询任务"按钮创建查询任务，在右侧 SQL 编辑器中编写查询语句