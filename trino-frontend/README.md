# Trino Frontend

基于React的Trino查询前端界面，支持异构数据源管理和协同处理。

## 🚀 快速开始

### 安装依赖
```bash
npm install
```

### 启动项目

**Windows:**
```cmd
npm run dev
```

**Linux/Mac:**
```bash
PORT=3008 npm start
```

访问：http://localhost:3008

### 登录信息
- 用户名: `test`
- 密码: `R?p!Ex}p8V`
- 验证码: 看页面显示

## 🎯 主要功能

- ✅ 异构数据源管理 - 元数据查询和树状结构浏览
- ✅ SQL查询执行 - 支持Trino Statement API异步查询
- ✅ 查询结果表格展示 - 支持分页和列排序
- ✅ HTTPS自签证书支持 - 内置开发代理处理SSL问题
- ✅ 跨平台部署支持 - Windows/Linux/Mac

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

## 📁 其他启动方式

```bash
# 构建项目
npm run build

# 生产模式服务器  
npm run serve

# 带CORS代理模式
npm run proxy
```

## 🔧 配置

项目连接到：
- **Gravitino API**: `http://10.177.64.21:16001`
- **Trino API**: `https://trino-http.test.unicom.local:16000`

环境变量配置 (`.env`):
```env
PORT=3008
REACT_APP_TRINO_BASE_URL=https://trino-http.test.unicom.local:16000
REACT_APP_TRINO_USERNAME=admin
REACT_APP_TRINO_PASSWORD=rs{=uzW$UZ4v{BR!
```

## 🛠️ 技术栈

- **前端**: React 18 + Ant Design + Axios
- **构建**: Create React App + Webpack
- **代理**: http-proxy-middleware (开发环境)
- **部署**: Node.js HTTP Server (生产环境)

## 📖 使用说明

1. **元数据查询**: 点击左侧图标浏览catalog/schema/table结构
2. **SQL查询**: 创建查询任务，在编辑器中执行SQL语句
3. **结果展示**: 支持表格分页展示查询结果

详细启动说明请查看 [STARTUP.md](./STARTUP.md)