# S3 数据源集成测试指南

## 概述
本文档说明如何测试 trino-frontend 项目与 gravitino 项目的 S3 数据源集成功能。

## 前置条件

### 1. 启动 Gravitino 后端服务
```bash
cd D:\4work\workCode\cyd\gravitino
npm run dev
# 或
python app.py
```
确保服务运行在 http://localhost:8090

### 2. 启动 MinIO (S3兼容存储)
如果没有真实的S3环境，可以使用MinIO进行测试：

```bash
# 下载并运行MinIO
docker run -p 9000:9000 -p 9001:9001 \
  -e "MINIO_ROOT_USER=minioadmin" \
  -e "MINIO_ROOT_PASSWORD=minioadmin" \
  quay.io/minio/minio server /data --console-address ":9001"
```

访问 http://localhost:9001 使用 minioadmin/minioadmin 登录MinIO控制台

### 3. 配置S3数据源

#### 在 MinIO 中创建测试数据：
1. 创建bucket: `test-bucket`
2. 创建目录结构:
   - `schema1/`
     - `fileset1/`
       - `data.parquet`
       - `data.csv`
     - `fileset2/`
       - `report.json`
   - `schema2/`
     - `fileset3/`
       - `log.txt`

#### 配置文件更新
修改 `src/config/s3Config.js` 中的S3配置：

```javascript
's3_by_gravitino': {
  endpoint: 'http://localhost:9000',  // MinIO endpoint
  accessKeyId: 'minioadmin',
  secretAccessKey: 'minioadmin',
  region: 'us-east-1',
  bucketName: 'test-bucket',
  prefix: ''
}
```

## 测试步骤

### 1. 启动前端应用
```bash
cd D:\4work\front\queryu\trino-frontend\unidatax-web
npm start
```

### 2. 登录系统
使用测试账号登录系统

### 3. 测试S3数据源展示

#### 3.1 元数据树形展示
1. 点击左侧"异构数据源管理"
2. 在树形结构中查找S3类型的catalog（如 `s3_by_gravitino`）
3. 展开catalog查看schemas列表
4. 展开schema查看filesets列表

#### 3.2 S3文件浏览
1. 点击某个fileset节点
2. 右侧应显示S3文件浏览器界面
3. 测试功能：
   - 文件列表展示
   - 文件夹导航
   - 面包屑导航
   - 文件预览（点击预览按钮）
   - 刷新功能

#### 3.3 元数据信息查看
1. 在S3文件浏览器界面，切换到"元数据信息"标签
2. 查看S3连接配置信息
3. 查看存储桶、区域、endpoint等信息

#### 3.4 Schema信息查看
1. 切换到"Schema信息"标签
2. 查看schema结构和统计信息

## 验证点

### 功能验证
- [ ] S3 catalog能够正确识别（图标显示为云图标）
- [ ] Schemas能够正确加载和显示
- [ ] Filesets能够正确加载和显示
- [ ] 文件列表能够正确显示
- [ ] 文件夹能够正确导航
- [ ] 文件预览功能正常
- [ ] 面包屑导航功能正常
- [ ] 刷新功能正常

### 界面验证
- [ ] S3类型数据源显示特殊图标
- [ ] 文件浏览器界面布局正确
- [ ] 统计信息显示正确
- [ ] 错误提示友好清晰

### 集成验证
- [ ] 与gravitino后端API通信正常
- [ ] S3专用API调用正常
- [ ] 错误处理机制正常

## 常见问题

### 1. 无法连接到S3
- 检查endpoint配置是否正确
- 检查accessKeyId和secretAccessKey是否正确
- 检查网络连接

### 2. 无法看到S3文件
- 检查bucket名称是否正确
- 检查文件路径前缀是否正确
- 检查S3权限配置

### 3. API调用失败
- 检查gravitino后端服务是否运行
- 检查API端口是否正确（默认8090）
- 查看浏览器控制台错误信息

## 调试技巧

### 开启调试日志
在浏览器控制台执行：
```javascript
localStorage.setItem('debug', 'true');
```

### 查看网络请求
1. 打开浏览器开发者工具
2. 切换到Network标签
3. 过滤XHR请求
4. 查看S3相关API调用

### 查看组件状态
使用React Developer Tools扩展查看组件props和state

## 后续优化建议

1. **性能优化**
   - 实现文件列表分页
   - 添加文件搜索功能
   - 实现懒加载

2. **功能增强**
   - 支持文件上传
   - 支持文件下载
   - 支持文件删除
   - 支持创建文件夹

3. **用户体验**
   - 添加文件类型图标
   - 支持文件排序
   - 添加文件筛选
   - 支持多选操作

4. **安全性**
   - 实现权限控制
   - 添加操作审计
   - 敏感信息加密