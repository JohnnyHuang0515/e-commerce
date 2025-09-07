import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// API 基礎配置
const API_BASE_URL = 'http://localhost';
const API_TIMEOUT = 10000;

// 服務端口配置
const SERVICE_PORTS = {
  PRODUCT: 3001,        // ✅ 正確
  USER: 3002,           // ✅ 正確
  ORDER: 3003,          // ✅ 正確
  AUTH: 3005,           // ✅ 修正：原3001→3005
  ANALYTICS: 3006,      // ✅ 正確
  SETTINGS: 3007,       // ✅ 正確
  MINIO: 3008,          // ✅ 正確
  PAYMENT: 3009,        // ✅ 正確
  LOGISTICS: 3010,      // ✅ 正確
  DASHBOARD: 3011,      // ✅ 正確
  INVENTORY: 3012,      // ✅ 正確
  PERMISSION: 3013,     // ✅ 正確
  AI_SEARCH: 3014,      // ✅ 修正：原3015→3014
  LOG: 3018,            // ✅ 正確
  NOTIFICATION: 3017,   // ✅ 正確
  UTILITY: 3019,        // ✅ 正確
} as const;

// 創建 API 實例
const createApiInstance = (baseURL: string): AxiosInstance => {
  const instance = axios.create({
    baseURL,
    timeout: API_TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // 請求攔截器
  instance.interceptors.request.use(
    (config) => {
      // 添加認證 token
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // 添加請求 ID 用於追蹤
      config.headers['X-Request-ID'] = Date.now().toString();
      
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    },
    (error) => {
      console.error('❌ Request Error:', error);
      return Promise.reject(error);
    }
  );

  // 響應攔截器
  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      console.log(`✅ API Response: ${response.status} ${response.config.url}`);
      return response;
    },
    (error) => {
      console.error('❌ Response Error:', error.response?.status, error.response?.data);
      
      // 處理認證錯誤
      if (error.response?.status === 401) {
        localStorage.removeItem('auth_token');
        window.location.href = '/login';
      }
      
      return Promise.reject(error);
    }
  );

  return instance;
};

// 各服務 API 實例
export const productApi = createApiInstance(`${API_BASE_URL}:${SERVICE_PORTS.PRODUCT}/api/v1`);
export const userApi = createApiInstance(`${API_BASE_URL}:${SERVICE_PORTS.USER}/api/v1`);
export const orderApi = createApiInstance(`${API_BASE_URL}:${SERVICE_PORTS.ORDER}/api/v1`);
export const authApi = createApiInstance(`${API_BASE_URL}:${SERVICE_PORTS.AUTH}/api/v1`);
export const analyticsApi = createApiInstance(`${API_BASE_URL}:${SERVICE_PORTS.ANALYTICS}/api/v1`);
export const settingsApi = createApiInstance(`${API_BASE_URL}:${SERVICE_PORTS.SETTINGS}/api/v1`);
export const minioApi = createApiInstance(`${API_BASE_URL}:${SERVICE_PORTS.MINIO}/api/v1`);
export const paymentApi = createApiInstance(`${API_BASE_URL}:${SERVICE_PORTS.PAYMENT}/api/v1`);
export const logisticsApi = createApiInstance(`${API_BASE_URL}:${SERVICE_PORTS.LOGISTICS}/api/v1/logistics`);
export const inventoryApi = createApiInstance(`${API_BASE_URL}:${SERVICE_PORTS.INVENTORY}/api/v1`);
export const permissionApi = createApiInstance(`${API_BASE_URL}:${SERVICE_PORTS.PERMISSION}/api/v1`);
export const aiSearchApi = createApiInstance(`${API_BASE_URL}:${SERVICE_PORTS.AI_SEARCH}/api/v1`);
export const logApi = createApiInstance(`${API_BASE_URL}:${SERVICE_PORTS.LOG}/api/v1`);
export const notificationApi = createApiInstance(`${API_BASE_URL}:${SERVICE_PORTS.NOTIFICATION}/api/v1`);
export const utilityApi = createApiInstance(`${API_BASE_URL}:${SERVICE_PORTS.UTILITY}/api/v1`);
export const dashboardApi = createApiInstance(`${API_BASE_URL}:${SERVICE_PORTS.DASHBOARD}/api/v1`);

// 通用 API 響應類型
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

// 分頁響應類型
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// 通用 API 方法
export class ApiService {
  static async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await dashboardApi.get(url, config);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  static async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await dashboardApi.post(url, data, config);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  static async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await dashboardApi.put(url, data, config);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  static async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await dashboardApi.delete(url, config);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  private static handleError(error: any): Error {
    if (error.response) {
      // 服務器響應錯誤
      const message = error.response.data?.message || error.response.data?.error || '服務器錯誤';
      return new Error(message);
    } else if (error.request) {
      // 網絡錯誤
      return new Error('網絡連接失敗，請檢查網絡設置');
    } else {
      // 其他錯誤
      return new Error(error.message || '未知錯誤');
    }
  }
}

// 健康檢查
export const checkServiceHealth = async (): Promise<Record<string, boolean>> => {
  const services = [
    { name: 'product', api: productApi },
    { name: 'user', api: userApi },
    { name: 'order', api: orderApi },
    { name: 'auth', api: authApi },
    { name: 'analytics', api: analyticsApi },
    { name: 'settings', api: settingsApi },
    { name: 'minio', api: minioApi },
    { name: 'payment', api: paymentApi },
    { name: 'logistics', api: logisticsApi },
    { name: 'inventory', api: inventoryApi },
    { name: 'permission', api: permissionApi },
    { name: 'ai-search', api: aiSearchApi },
  { name: 'log', api: logApi },
  { name: 'notification', api: notificationApi },
  { name: 'utility', api: utilityApi },
  { name: 'dashboard', api: dashboardApi },
  ];

  const healthStatus: Record<string, boolean> = {};

  await Promise.allSettled(
    services.map(async (service) => {
      try {
        await service.api.get('/health', { timeout: 3000 });
        healthStatus[service.name] = true;
      } catch {
        healthStatus[service.name] = false;
      }
    })
  );

  return healthStatus;
};

// 導出通用 API 實例 (用於向後兼容)
export const api = permissionApi;

export default ApiService;
