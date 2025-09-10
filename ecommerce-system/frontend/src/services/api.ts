import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// API 基礎配置 - 通過 Nginx 代理連接到後端服務
const API_BASE_URL = 'http://localhost:8080';
const API_TIMEOUT = 10000;

// 統一 API 路徑配置
const API_PATHS = {
  AUTH: '/api/v1/auth',
  USERS: '/api/v1/users',
  PRODUCTS: '/api/v1/products',
  CATEGORIES: '/api/v1/products/categories',
  BRANDS: '/api/v1/products/brands',
  ORDERS: '/api/v1/orders',
  AI: '/api/v1/ai',
  SYSTEM: '/api/v1/system',
  ANALYTICS: '/api/v1/analytics',
  DASHBOARD: '/api/v1/dashboard',
  INVENTORY: '/api/v1/inventory',
  LOGS: '/api/v1/logs',
  NOTIFICATIONS: '/api/v1/notifications',
  UTILITY: '/api/v1/utility',
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
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      config.headers['X-Request-ID'] = Date.now().toString();
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
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
export const authApi = createApiInstance(API_BASE_URL); // Base path is /api/v1/auth
export const productApi = createApiInstance(API_BASE_URL); // Base path is /api/v1/products
export const categoryApi = createApiInstance(API_BASE_URL); // Base path is /api/v1/products/categories
export const brandApi = createApiInstance(API_BASE_URL); // Base path is /api/v1/products/brands
export const orderApi = createApiInstance(API_BASE_URL); // Base path is /api/v1/orders
export const aiApi = createApiInstance(API_BASE_URL); // Base path is /api/v1/ai
export const systemApi = createApiInstance(API_BASE_URL); // Base path is /api/v1/system
export const analyticsApi = createApiInstance(API_BASE_URL); // Base path is /api/v1/analytics
export const dashboardApi = createApiInstance(API_BASE_URL); // Base path is /api/v1/dashboard
export const inventoryApi = createApiInstance(API_BASE_URL); // Base path is /api/v1/inventory
export const logApi = createApiInstance(API_BASE_URL); // Base path is /api/v1/logs
export const notificationApi = createApiInstance(API_BASE_URL); // Base path is /api/v1/notifications
export const utilityApi = createApiInstance(API_BASE_URL); // Base path is /api/v1/utility
export const userApi = createApiInstance(API_BASE_URL); // Base path is /api/v1/users

// 兼容舊版 Service 的別名
export const permissionApi = authApi; // Permission management is in auth service
export const paymentApi = orderApi; // Payment is in order service
export const logisticsApi = orderApi; // Logistics is in order service
export const imageApi = productApi; // Image upload is in product service

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