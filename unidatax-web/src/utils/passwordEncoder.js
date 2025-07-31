/**
 * 密码编码工具类
 * 使用Base64编码结合时间戳和随机数，防止明文传输
 */

/**
 * 编码密码用于传输
 * @param {string} password 原始密码
 * @returns {string} 编码后的密码
 */
export const encodePassword = (password) => {
  try {
    // 获取当前时间戳
    const timestamp = Date.now();
    
    // 生成随机数
    const random = Math.random().toString(36).substring(2, 15);
    
    // 组合数据: password|timestamp|random
    const combined = `${password}|${timestamp}|${random}`;
    
    // Base64编码
    const encoded = btoa(unescape(encodeURIComponent(combined)));
    
    return encoded;
  } catch (error) {
    console.error('密码编码失败:', error);
    // 如果编码失败，返回简单的Base64编码
    return btoa(unescape(encodeURIComponent(password)));
  }
};

/**
 * 解码密码（前端用于调试，正常情况下只有后端使用）
 * @param {string} encodedPassword 编码后的密码
 * @returns {object} 解码结果 {password, timestamp, random}
 */
export const decodePassword = (encodedPassword) => {
  try {
    // Base64解码
    const decoded = decodeURIComponent(escape(atob(encodedPassword)));
    
    // 分割数据
    const parts = decoded.split('|');
    
    if (parts.length >= 3) {
      return {
        password: parts[0],
        timestamp: parseInt(parts[1]),
        random: parts[2]
      };
    } else {
      // 兼容简单编码
      return {
        password: decoded,
        timestamp: null,
        random: null
      };
    }
  } catch (error) {
    console.error('密码解码失败:', error);
    return {
      password: encodedPassword,
      timestamp: null,
      random: null
    };
  }
};