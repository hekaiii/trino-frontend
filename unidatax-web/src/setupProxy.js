const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // 后端Spring Boot API代理
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:18082',
      changeOrigin: true,
      secure: false,
      logLevel: 'debug',
      onProxyReq: function(proxyReq, req, res) {
        console.log('Proxying backend API request:', req.method, req.url);
        // 添加CORS头
        proxyReq.setHeader('Access-Control-Allow-Origin', '*');
        proxyReq.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        proxyReq.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      },
      onProxyRes: function(proxyRes, req, res) {
        console.log('Backend API response:', proxyRes.statusCode);
        // 设置响应CORS头
        proxyRes.headers['Access-Control-Allow-Origin'] = '*';
        proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
        proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
      }
    })
  );

  // Trino API代理 - 解决HTTPS自签证书问题
  app.use(
    '/trino',
    createProxyMiddleware({
      target: 'https://trino-http.test.unicom.local:16000',
      changeOrigin: true,
      secure: false, // 忽略SSL证书验证
      logLevel: 'debug',
      pathRewrite: {
        '^/trino': '', // 移除/trino前缀
      },
      onProxyReq: function(proxyReq, req, res) {
        console.log('Proxying Trino request:', req.method, req.url);
        // 添加Basic Auth - 写死账号密码 admin/rs{=uzW$UZ4v{BR!
        const auth = Buffer.from('admin:rs{=uzW$UZ4v{BR!').toString('base64');
        proxyReq.setHeader('Authorization', `Basic ${auth}`);
        proxyReq.setHeader('X-Trino-User', 'admin');
      },
      onProxyRes: function(proxyRes, req, res) {
        console.log('Trino response:', proxyRes.statusCode);
        // 设置响应CORS头
        proxyRes.headers['Access-Control-Allow-Origin'] = '*';
        proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
        proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Trino-User';
      }
    })
  );
};