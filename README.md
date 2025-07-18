# Trino Frontend

一个基于React的Trino数据库前端查询工具，支持元数据查询和异构查询功能。

## 功能特性

- 🗄️ **元数据查询**: 浏览数据库结构（Catalog、Schema、Table）
- 🔍 **异构查询**: 创建和管理SQL查询任务
- 🌙 **深色模式**: 支持白天/黑夜模式切换
- 💾 **任务保存**: 自动保存查询任务到左侧栏
- 📋 **表详情**: 查看表结构和DDL语句
- 🎨 **响应式设计**: 适配不同屏幕尺寸

## 技术栈

- React 18
- Ant Design 5.8.0
- Babel (浏览器端转换)
- 纯HTML/CSS/JavaScript实现

## 快速开始

1. 克隆项目
```bash
git clone <repository-url>
cd queryu
```

2. 启动本地服务器
```bash
cd trino-frontend
python3 -m http.server 8000
```

3. 在浏览器中访问 `http://localhost:8000`

## 项目结构

```
queryu/
├── trino-frontend/
│   ├── index.html          # 主页面文件
│   ├── package.json        # 项目依赖配置
│   ├── public/
│   │   └── index.html      # 备用页面
│   └── src/                # 源代码目录
│       ├── App.js
│       ├── index.js
│       ├── components/
│       ├── services/
│       └── styles/
├── .gitignore
└── README.md
```

## 主要功能

### 元数据查询
- 树形结构展示数据库层级
- 点击表名查看表结构
- 显示字段类型和注释
- 查看建表DDL语句

### 异构查询
- 创建新的查询任务
- 任务列表管理
- SQL编辑器
- 实时保存查询内容

### 主题切换
- 右上角切换按钮
- 深色/浅色主题
- 全局样式适配

## 开发说明

当前版本使用Mock数据进行演示，如需连接真实的Trino服务，需要：

1. 替换 `trinoService` 中的Mock函数
2. 配置真实的API端点
3. 处理认证和跨域问题

## 贡献

欢迎提交Issue和Pull Request！

## 许可证

MIT License