# 🚀 Trino Frontend 启动指南

## 📋 环境要求
- **Node.js** (v14+)
- **npm** (v6+)

## 🎯 快速启动 (跨平台)

### 1. 安装依赖
```bash
npm install
```

### 2. 选择启动方式

#### **开发模式** (推荐) - 跨平台
```bash
# Windows
npm run dev

# Linux/Mac  
PORT=3008 npm start
```
- ✅ 自动热重载
- ✅ 内置开发代理处理HTTPS证书
- ✅ 访问：http://localhost:3008

#### **生产服务模式** - 跨平台
```bash
npm run serve
```
- ✅ 先构建项目再启动服务器
- ✅ 访问：http://localhost:3001

#### **仅构建项目** - 跨平台
```bash
npm run build
```

#### **代理模式** (包含CORS代理) - 跨平台
```bash
npm run proxy
```
- ✅ 同时启动CORS代理和开发服务器
- ✅ 访问：http://localhost:3008

## 🔑 登录信息
- **用户名**: `test`
- **密码**: `R?p!Ex}p8V`
- **验证码**: 看页面显示（不区分大小写）

## 🌐 API配置
项目连接到：
- **Gravitino API**: `http://10.177.64.21:16001`
- **Trino API**: `https://trino-http.test.unicom.local:16000`

## ⚙️ 环境变量配置

创建 `.env` 文件自定义配置：
```env
# 前端服务端口
PORT=3008

# Trino API配置
REACT_APP_TRINO_BASE_URL=https://trino-http.test.unicom.local:16000
REACT_APP_TRINO_USERNAME=admin
REACT_APP_TRINO_PASSWORD=rs{=uzW$UZ4v{BR!
```

## 📊 可用的npm脚本

| 命令 | 说明 | 平台支持 | 端口 |
|------|------|----------|------|
| `npm run dev` | 开发模式启动 (Windows) | ✅ Windows | 3008 |
| `PORT=3008 npm start` | 开发模式启动 (Linux/Mac) | ✅ Linux/Mac | 3008 |
| `npm run serve` | 生产模式启动 | ✅ 跨平台 | 3001 |
| `npm run build` | 构建项目 | ✅ 跨平台 | - |
| `npm run proxy` | 代理模式启动 | ✅ 跨平台 | 3008 |
| `npm start` | React默认启动 | ✅ 跨平台 | 3000 |

## 🔧 跨平台启动命令总结

### Windows 用户
```cmd
# 开发模式
npm run dev

# 生产模式  
npm run serve

# 代理模式
npm run proxy
```

### Linux/Mac 用户
```bash
# 开发模式
PORT=3008 npm start

# 生产模式
npm run serve

# 代理模式
npm run proxy
```

## 🐛 常见问题

### 端口被占用
修改 `.env` 文件中的端口号，或使用：
```bash
PORT=3009 npm run dev
```

### 依赖安装失败
```bash
npm cache clean --force
rm -rf node_modules package-lock.json  # Linux/Mac
rmdir /s node_modules & del package-lock.json  # Windows
npm install
```

### SSL证书错误
项目已配置开发代理，使用 `npm run dev` 即可自动处理。

## 🎯 推荐工作流

### 开发环境
```bash
git clone <repo>
cd trino-frontend/trino-frontend
npm install
npm run dev
```

### 生产部署
```bash
git clone <repo>
cd trino-frontend/trino-frontend
npm install
npm run serve
```

## 📁 项目结构
```
trino-frontend/
├── src/                    # 源代码
├── public/                 # 静态资源
├── scripts/               # 跨平台脚本
│   └── serve.js          # 生产服务器
├── *.bat                  # Windows专用脚本
├── .env                   # 环境配置
├── package.json           # 项目配置
└── STARTUP.md            # 本文档
```

---

🎉 **开始使用**: `npm run dev` 然后访问 http://localhost:3008