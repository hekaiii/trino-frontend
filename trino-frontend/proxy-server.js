const http = require('http');
const https = require('https');
const url = require('url');

const GRAVITINO_HOST = '10.177.64.21';
const GRAVITINO_PORT = 16001;
const PROXY_PORT = 3002;

const server = http.createServer((req, res) => {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  // 处理预检请求
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // 只处理/api路径的请求
  if (!req.url.startsWith('/api')) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }
  
  console.log('Proxying request:', req.method, req.url);
  
  // 构建目标URL
  const targetUrl = `http://${GRAVITINO_HOST}:${GRAVITINO_PORT}${req.url}`;
  const parsedUrl = url.parse(targetUrl);
  
  const options = {
    hostname: parsedUrl.hostname,
    port: parsedUrl.port,
    path: parsedUrl.path,
    method: req.method,
    timeout: 5000, // 5秒超时
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'CORS-Proxy-Server'
    }
  };
  
  const proxyReq = http.request(options, (proxyRes) => {
    console.log('Proxy response status:', proxyRes.statusCode);
    
    // 复制响应头，添加CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Content-Type', 'application/json');
    
    // 只复制必要的头
    if (proxyRes.headers['content-type']) {
      res.setHeader('Content-Type', proxyRes.headers['content-type']);
    }
    if (proxyRes.headers['content-length']) {
      res.setHeader('Content-Length', proxyRes.headers['content-length']);
    }
    
    res.writeHead(proxyRes.statusCode);
    proxyRes.pipe(res);
  });
  
  // 设置超时
  proxyReq.setTimeout(5000, () => {
    console.error('Proxy request timeout');
    proxyReq.destroy();
    if (!res.headersSent) {
      res.writeHead(504);
      res.end('Gateway Timeout');
    }
  });
  
  proxyReq.on('error', (err) => {
    console.error('Proxy request error:', err);
    if (!res.headersSent) {
      res.writeHead(500);
      res.end(JSON.stringify({error: 'Proxy error: ' + err.message}));
    }
  });
  
  // 处理GET请求，不需要转发请求体
  if (req.method === 'GET') {
    proxyReq.end();
  } else {
    req.pipe(proxyReq);
  }
});

server.listen(PROXY_PORT, '0.0.0.0', () => {
  console.log(`CORS Proxy server running on http://0.0.0.0:${PROXY_PORT}`);
  console.log(`Proxying requests to http://${GRAVITINO_HOST}:${GRAVITINO_PORT}`);
});