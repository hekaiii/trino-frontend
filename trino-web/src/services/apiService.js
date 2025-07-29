import axios from 'axios';

// 后端API基础URL
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/api';

// 创建axios实例
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// 请求拦截器 - 添加token
apiClient.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理错误
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // token过期或无效，清除session并跳转登录
      sessionStorage.clear();
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

// 认证相关API
export const authApi = {
  // 用户登录
  login: async (loginData) => {
    const response = await apiClient.post('/auth/login', loginData);
    return response.data;
  },

  // 用户注册
  register: async (registerData) => {
    const response = await apiClient.post('/auth/register', registerData);
    return response.data;
  },

  // 用户登出
  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },

  // 密码强度校验
  validatePassword: async (password, username = null) => {
    const params = { password };
    if (username) params.username = username;
    
    const response = await apiClient.post('/auth/validate-password', null, { params });
    return response.data;
  },

  // 修改密码
  changePassword: async (oldPassword, newPassword) => {
    const response = await apiClient.post('/auth/change-password', null, {
      params: { oldPassword, newPassword }
    });
    return response.data;
  }
};

// 任务相关API
export const taskApi = {
  // 创建任务
  createTask: async (taskData) => {
    const response = await apiClient.post('/tasks', taskData);
    return response.data;
  },

  // 更新任务
  updateTask: async (taskId, taskData) => {
    const response = await apiClient.put(`/tasks/${taskId}`, taskData);
    return response.data;
  },

  // 删除任务
  deleteTask: async (taskId) => {
    const response = await apiClient.delete(`/tasks/${taskId}`);
    return response.data;
  },

  // 获取任务详情
  getTask: async (taskId) => {
    const response = await apiClient.get(`/tasks/${taskId}`);
    return response.data;
  },

  // 分页查询用户任务
  getUserTasks: async (current = 1, size = 10, status = null, taskName = null) => {
    const params = { current, size };
    if (status) params.status = status;
    if (taskName) params.taskName = taskName;
    
    const response = await apiClient.get('/tasks', { params });
    return response.data;
  },

  // 执行任务
  executeTask: async (taskId) => {
    const response = await apiClient.post(`/tasks/${taskId}/execute`);
    return response.data;
  },

  // 收藏/取消收藏任务
  toggleFavorite: async (taskId, favorite) => {
    const response = await apiClient.post(`/tasks/${taskId}/favorite`, null, {
      params: { favorite }
    });
    return response.data;
  },

  // 获取收藏的任务
  getFavoriteTasks: async () => {
    const response = await apiClient.get('/tasks/favorites');
    return response.data;
  }
};

export default apiClient;