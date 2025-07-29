# 🚀 Trino Frontend Platform

基于 **Spring Boot** 和 **React** 的Trino异构数据查询平台，提供统一的数据查询和管理界面。

## 📋 项目概述

这是一个前后端分离的全栈项目，专为Trino数据查询场景设计：

- **前端**: React + Ant Design，提供直观的用户界面
- **后端**: Spring Boot + JPA，提供REST API和数据持久化
- **数据库**: MySQL，存储用户信息和查询任务
- **集成**: Maven构建，支持前后端一体化部署

## 🏗️ 项目结构

```
trino-frontend-platform/
├── README.md                    # 项目说明文档
├── pom.xml                      # 父级Maven配置
├── .gitignore                   # Git忽略文件
├── docs/                        # 项目文档目录
├── scripts/                     # 构建和部署脚本
├── trino-backend/              # 后端Spring Boot模块
│   ├── pom.xml                 # 后端Maven配置
│   └── src/
│       ├── main/java/com/queryu/trino/
│       │   ├── TrinoBackendApplication.java
│       │   ├── controller/      # REST API控制器
│       │   ├── service/         # 业务逻辑层
│       │   ├── repository/      # 数据访问层
│       │   ├── entity/          # JPA实体类
│       │   ├── dto/             # 数据传输对象
│       │   ├── config/          # 配置类
│       │   ├── security/        # 安全配置
│       │   ├── util/            # 工具类
│       │   └── exception/       # 异常处理
│       └── main/resources/
│           ├── application.yml          # 主配置文件
│           ├── application-dev.yml      # 开发环境配置
│           ├── application-prod.yml     # 生产环境配置
│           └── static/                  # 前端构建文件部署位置
└── trino-web/                  # 前端React模块
    ├── package.json            # Node.js依赖配置
    ├── public/                 # 静态资源
    └── src/                    # React源码
        ├── components/         # React组件
        ├── services/           # API服务
        ├── utils/              # 工具函数
        ├── styles/             # 样式文件
        ├── App.js              # 主应用组件
        └── index.js            # 入口文件
```

## 🚀 快速开始

### 📋 环境要求

- **Java**: 8+
- **Node.js**: 16+
- **Maven**: 3.6+
- **MySQL**: 5.7+

### 🔧 开发环境启动

#### 1. 数据库准备
```sql
-- 创建数据库
CREATE DATABASE trino_frontend_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建用户并授权
CREATE USER 'admin'@'localhost' IDENTIFIED BY 'hekaig24';
GRANT ALL PRIVILEGES ON trino_frontend_dev.* TO 'admin'@'localhost';
FLUSH PRIVILEGES;
```

#### 2. 后端启动
```bash
# 进入项目根目录
cd trino-frontend-platform

# 启动后端服务(开发模式，跳过前端构建)
mvn clean spring-boot:run -pl trino-backend -am -Pdev

# 或者直接在trino-backend目录启动
cd trino-backend
mvn spring-boot:run
```

#### 3. 前端启动(开发模式)
```bash
# 进入前端目录
cd trino-web

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

#### 4. 访问应用
- **前端开发服务器**: http://localhost:3008
- **后端API服务**: http://localhost:8080
- **API文档**: http://localhost:8080/swagger-ui.html

### 🏭 生产环境部署

```bash
# 完整构建(包含前端)
mvn clean package -Pprod

# 运行打包后的JAR文件
java -jar trino-backend/target/trino-backend-1.0.0.jar

# 应用访问地址: http://localhost:8080
```

## 🔑 核心功能

### 👤 用户管理
- ✅ 用户注册/登录
- ✅ JWT认证和会话管理
- ✅ 密码安全加密(BCrypt + 盐值)
- ✅ 权限控制和用户隔离

### 📊 查询任务管理
- ✅ 创建和管理SQL查询任务
- ✅ 实时保存和编辑SQL内容
- ✅ 任务执行状态跟踪
- ✅ 查询历史记录
- ✅ 任务收藏和分类

### 🔌 数据源集成
- ✅ Gravitino API集成
- ✅ Trino查询引擎集成
- ✅ 元数据浏览和管理
- ✅ 跨数据源异构查询

## 🛠️ 技术栈

### 后端技术
- **Spring Boot 2.7.18**: Web框架
- **Spring Security**: 认证和授权
- **Spring Data JPA**: 数据访问层
- **MySQL**: 关系型数据库
- **JWT**: 无状态认证
- **Hutool**: Java工具库
- **Lombok**: 代码生成

### 前端技术
- **React 18**: 用户界面框架
- **Ant Design**: UI组件库
- **Axios**: HTTP客户端
- **CSS3**: 样式和动画

### 构建工具
- **Maven**: 后端构建和依赖管理
- **npm**: 前端包管理
- **frontend-maven-plugin**: 前后端构建集成

## 📚 API文档

### 认证接口
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/logout` - 用户登出
- `GET /api/auth/me` - 获取当前用户信息

### 任务管理接口
- `GET /api/tasks` - 获取用户任务列表
- `POST /api/tasks` - 创建新任务
- `PUT /api/tasks/{id}` - 更新任务
- `DELETE /api/tasks/{id}` - 删除任务
- `PUT /api/tasks/{id}/sql` - 保存SQL内容
- `POST /api/tasks/{id}/execute` - 执行SQL查询

## 🔧 配置说明

### 数据库配置
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/trino_frontend_dev
    username: admin
    password: hekaig24
    driver-class-name: com.mysql.cj.jdbc.Driver
```

### 外部API配置
```yaml
app:
  external:
    gravitino:
      url: http://10.177.64.21:16001
    trino:
      url: https://trino-http.test.unicom.local:16000
      username: admin
      password: rs{=uzW$UZ4v{BR!
```

## 🐛 常见问题

### 1. 端口冲突
如果8080端口被占用，可以在`application.yml`中修改：
```yaml
server:
  port: 8081
```

### 2. 数据库连接失败
检查MySQL服务是否启动，用户权限是否正确配置。

### 3. 前端代理问题
开发环境下，前端通过`src/setupProxy.js`代理后端API请求。

## 📝 开发指南

### 添加新的API接口
1. 在`entity`包中定义实体类
2. 在`repository`包中创建数据访问接口
3. 在`service`包中实现业务逻辑
4. 在`controller`包中创建REST控制器
5. 在`dto`包中定义请求/响应对象

### 前端组件开发
1. 在`src/components`中创建React组件
2. 在`src/services`中封装API调用
3. 使用Ant Design组件库保持UI一致性

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支: `git checkout -b feature/new-feature`
3. 提交变更: `git commit -am 'Add some feature'`
4. 推送分支: `git push origin feature/new-feature`
5. 提交Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 联系我们

- 项目维护者: QueryU Team
- 邮箱: support@queryu.com
- 项目地址: [GitHub Repository]

---

⭐ 如果这个项目对您有帮助，请给我们一个星标！