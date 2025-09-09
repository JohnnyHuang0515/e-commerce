import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// API 基礎配置 - 統一通過 Nginx 代理
const API_BASE_URL = 'http://localhost';
const API_TIMEOUT = 10000;

// 新的統一 API 路徑配置
const API_PATHS = {
  AUTH: '/api/v1/auth',
  PRODUCTS: '/api/v1/products',
  ORDERS: '/api/v1/orders',
  AI: '/api/v1/ai',
  SYSTEM: '/api/v1/system',
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

// 各服務 API 實例 - 統一通過 Nginx 代理
export const authApi = createApiInstance(`${API_BASE_URL}${API_PATHS.AUTH}`);
export const productApi = createApiInstance(`${API_BASE_URL}${API_PATHS.PRODUCTS}`);
export const orderApi = createApiInstance(`${API_BASE_URL}${API_PATHS.ORDERS}`);
export const aiApi = createApiInstance(`${API_BASE_URL}${API_PATHS.AI}`);
export const systemApi = createApiInstance(`${API_BASE_URL}${API_PATHS.SYSTEM}`);

// 向後兼容的別名 (逐步遷移)
export const userApi = authApi;           // 用戶管理併入 AUTH-SERVICE
export const permissionApi = authApi;     // 權限管理併入 AUTH-SERVICE
export const analyticsApi = aiApi;        // 分析功能併入 AI-SERVICE
export const settingsApi = systemApi;     // 系統設定併入 SYSTEM-SERVICE
export const minioApi = productApi;       // 檔案管理併入 PRODUCT-SERVICE
export const paymentApi = orderApi;       // 支付功能併入 ORDER-SERVICE
export const logisticsApi = orderApi;     // 物流功能併入 ORDER-SERVICE
export const inventoryApi = productApi;   // 庫存管理併入 PRODUCT-SERVICE
export const aiSearchApi = aiApi;         // AI 搜尋併入 AI-SERVICE
export const logApi = systemApi;          // 日誌管理併入 SYSTEM-SERVICE
export const notificationApi = systemApi; // 通知管理併入 SYSTEM-SERVICE
export const utilityApi = systemApi;      // 工具功能併入 SYSTEM-SERVICE
export const dashboardApi = systemApi;    // 儀表板併入 SYSTEM-SERVICE

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
