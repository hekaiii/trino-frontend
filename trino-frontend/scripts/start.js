#!/usr/bin/env node

const { execSync } = require('child_process');

// 设置环境变量
process.env.PORT = process.env.PORT || '3008';

console.log('🚀 Starting Trino Frontend in development mode...');
console.log(`📡 Port: ${process.env.PORT}`);
console.log('🔧 Mode: Development with hot reload');
console.log('🛡️ HTTPS proxy: Enabled for self-signed certificates');
console.log('');

try {
  // 根据平台确定命令
  const isWindows = process.platform === 'win32';
  const reactScriptsPath = require.resolve('react-scripts/bin/react-scripts.js');
  
  console.log('Starting React development server...');
  
  // 直接运行 react-scripts
  execSync(`node "${reactScriptsPath}" start`, {
    stdio: 'inherit',
    env: {
      ...process.env,
      PORT: process.env.PORT
    }
  });
  
} catch (error) {
  console.error('❌ Failed to start development server:', error.message);
  process.exit(1);
}