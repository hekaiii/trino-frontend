const { createProxyMiddleware } = require('http-proxy-middleware');

// 开发环境专用代理配置
// 生产环境不使用此文件
module.exports = function(app) {
  
  // 检查是否为开发环境
  if (process.env.NODE_ENV !== 'development') {
    console.log('非开发环境，跳过代理配置');
    return;
  }

  console.log('🔧 开发环境代理配置已启用');

  // 后端Spring Boot API代理
  app.use(
    '/api',
    createProxyMiddleware({
      target: process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080',
      changeOrigin: true,
      secure: false,
      logLevel: 'info', // 改为info减少调试信息
      onProxyReq: function(proxyReq, req, res) {
        console.log(`🔄 代理API请求: ${req.method} ${req.url}`);
      },
      onError: function(err, req, res) {
        console.log('❌ 代理错误:', err.message);
        res.status(500).json({
          error: '后端服务连接失败',
          message: '请确保后端服务已启动'
        });
      }
    })
  );

  // Gravitino API代理（外部系统）
  app.use(
    '/gravitino',
    createProxyMiddleware({
      target: process.env.REACT_APP_GRAVITINO_URL || 'http://10.177.64.21:16001',
      changeOrigin: true,
      secure: false,
      logLevel: 'info',
      pathRewrite: {
        '^/gravitino': '/api',
      },
      onProxyReq: function(proxyReq, req, res) {
        console.log(`🔄 代理Gravitino请求: ${req.method} ${req.url}`);
      },
      onError: function(err, req, res) {
        console.log('❌ Gravitino代理错误:', err.message);
        res.status(503).json({
          error: 'Gravitino服务连接失败',
          message: '外部数据源服务不可用'
        });
      }
    })
  );

  // Trino API代理（外部系统）
  app.use(
    '/trino',
    createProxyMiddleware({
      target: process.env.REACT_APP_TRINO_URL || 'https://trino-http.test.unicom.local:16000',
      changeOrigin: true,
      secure: false,
      logLevel: 'info',
      pathRewrite: {
        '^/trino': '',
      },
      onProxyReq: function(proxyReq, req, res) {
        console.log(`🔄 代理Trino请求: ${req.method} ${req.url}`);
        // 添加Trino认证
        const auth = Buffer.from('admin:rs{=uzW$UZ4v{BR!').toString('base64');
        proxyReq.setHeader('Authorization', `Basic ${auth}`);
        proxyReq.setHeader('X-Trino-User', 'admin');
      },
      onError: function(err, req, res) {
        console.log('❌ Trino代理错误:', err.message);
        res.status(503).json({
          error: 'Trino服务连接失败',
          message: '查询引擎服务不可用'
        });
      }
    })
  );

  console.log('✅ 代理配置完成:');
  console.log('  - /api -> 后端Spring Boot');
  console.log('  - /gravitino -> Gravitino API');
  console.log('  - /trino -> Trino API');
};