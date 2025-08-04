/**
 * 前端日志工具类
 * 支持按日期分类的日志文件，自动清理30天前的日志
 */

class Logger {
    constructor() {
        this.logLevel = process.env.NODE_ENV === 'production' ? 'INFO' : 'DEBUG';
        this.logLevels = {
            DEBUG: 0,
            INFO: 1,
            WARN: 2,
            ERROR: 3
        };
        
        // 创建日志目录
        this.createLogDirectories();
        
        // 清理旧日志
        this.cleanOldLogs();
    }

    /**
     * 创建日志目录
     */
    createLogDirectories() {
        try {
            // 在浏览器环境中，我们使用localStorage来模拟文件系统
            if (typeof window !== 'undefined') {
                if (!localStorage.getItem('frontend_logs_initialized')) {
                    localStorage.setItem('frontend_logs_initialized', 'true');
                    localStorage.setItem('frontend_logs_created_date', new Date().toISOString());
                }
            }
        } catch (error) {
            console.error('Failed to create log directories:', error);
        }
    }

    /**
     * 清理30天前的日志
     */
    cleanOldLogs() {
        try {
            if (typeof window !== 'undefined') {
                const createdDate = localStorage.getItem('frontend_logs_created_date');
                if (createdDate) {
                    const created = new Date(createdDate);
                    const now = new Date();
                    const daysDiff = (now - created) / (1000 * 60 * 60 * 24);
                    
                    // 如果超过30天，清理所有日志
                    if (daysDiff > 30) {
                        this.clearAllLogs();
                        localStorage.setItem('frontend_logs_created_date', now.toISOString());
                    }
                }
            }
        } catch (error) {
            console.error('Failed to clean old logs:', error);
        }
    }

    /**
     * 清理所有日志
     */
    clearAllLogs() {
        try {
            if (typeof window !== 'undefined') {
                const keys = Object.keys(localStorage);
                keys.forEach(key => {
                    if (key.startsWith('frontend_log_')) {
                        localStorage.removeItem(key);
                    }
                });
            }
        } catch (error) {
            console.error('Failed to clear logs:', error);
        }
    }

    /**
     * 获取当前日期字符串
     */
    getCurrentDate() {
        const now = new Date();
        return now.toISOString().split('T')[0]; // YYYY-MM-DD
    }

    /**
     * 获取当前时间字符串
     */
    getCurrentTime() {
        const now = new Date();
        return now.toISOString().replace('T', ' ').substring(0, 23); // YYYY-MM-DD HH:mm:ss.SSS
    }

    /**
     * 写入日志到localStorage
     */
    writeLog(level, message, data = null) {
        try {
            if (typeof window !== 'undefined') {
                const date = this.getCurrentDate();
                const time = this.getCurrentTime();
                const logKey = `frontend_log_${date}`;
                
                // 获取现有日志
                let logs = [];
                const existingLogs = localStorage.getItem(logKey);
                if (existingLogs) {
                    try {
                        logs = JSON.parse(existingLogs);
                    } catch (e) {
                        logs = [];
                    }
                }
                
                // 创建日志条目
                const logEntry = {
                    timestamp: time,
                    level: level,
                    message: message,
                    data: data
                };
                
                // 添加日志条目
                logs.push(logEntry);
                
                // 限制日志条数（最多1000条）
                if (logs.length > 1000) {
                    logs = logs.slice(-1000);
                }
                
                // 保存到localStorage
                localStorage.setItem(logKey, JSON.stringify(logs));
            }
        } catch (error) {
            console.error('Failed to write log:', error);
        }
    }

    /**
     * 检查是否应该记录该级别的日志
     */
    shouldLog(level) {
        return this.logLevels[level] >= this.logLevels[this.logLevel];
    }

    /**
     * 调试日志
     */
    debug(message, data = null) {
        if (this.shouldLog('DEBUG')) {
            console.debug(`[DEBUG] ${message}`, data);
            this.writeLog('DEBUG', message, data);
        }
    }

    /**
     * 信息日志
     */
    info(message, data = null) {
        if (this.shouldLog('INFO')) {
            console.info(`[INFO] ${message}`, data);
            this.writeLog('INFO', message, data);
        }
    }

    /**
     * 警告日志
     */
    warn(message, data = null) {
        if (this.shouldLog('WARN')) {
            console.warn(`[WARN] ${message}`, data);
            this.writeLog('WARN', message, data);
        }
    }

    /**
     * 错误日志
     */
    error(message, data = null) {
        if (this.shouldLog('ERROR')) {
            console.error(`[ERROR] ${message}`, data);
            this.writeLog('ERROR', message, data);
        }
    }

    /**
     * 获取指定日期的日志
     */
    getLogs(date = null) {
        try {
            if (typeof window !== 'undefined') {
                const targetDate = date || this.getCurrentDate();
                const logKey = `frontend_log_${targetDate}`;
                const logs = localStorage.getItem(logKey);
                return logs ? JSON.parse(logs) : [];
            }
            return [];
        } catch (error) {
            console.error('Failed to get logs:', error);
            return [];
        }
    }

    /**
     * 获取所有日志
     */
    getAllLogs() {
        try {
            if (typeof window !== 'undefined') {
                const keys = Object.keys(localStorage);
                const logKeys = keys.filter(key => key.startsWith('frontend_log_'));
                const allLogs = [];
                
                logKeys.forEach(key => {
                    const logs = localStorage.getItem(key);
                    if (logs) {
                        try {
                            const parsedLogs = JSON.parse(logs);
                            allLogs.push(...parsedLogs);
                        } catch (e) {
                            // 忽略解析错误的日志
                        }
                    }
                });
                
                // 按时间排序
                return allLogs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            }
            return [];
        } catch (error) {
            console.error('Failed to get all logs:', error);
            return [];
        }
    }

    /**
     * 导出日志
     */
    exportLogs(date = null) {
        try {
            const logs = date ? this.getLogs(date) : this.getAllLogs();
            const logText = logs.map(log => 
                `${log.timestamp} [${log.level}] ${log.message}${log.data ? ' ' + JSON.stringify(log.data) : ''}`
            ).join('\n');
            
            // 创建下载链接
            const blob = new Blob([logText], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `frontend-logs-${date || 'all'}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to export logs:', error);
        }
    }
}

// 创建全局日志实例
const logger = new Logger();

export default logger; 
