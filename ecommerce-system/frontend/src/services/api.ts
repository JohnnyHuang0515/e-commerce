import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// API 基礎配置 - 直接連接到新的統一 Node.js API 服務
const API_BASE_URL = 'http://localhost:8000/api';
const API_TIMEOUT = 30000; // 增加到 30 秒

// 統一 API 路徑配置 - 對應新的後端 API 架構
const API_PATHS = {
  AUTH: '/v1/auth',
  USERS: '/v1/users',
  PRODUCTS: '/v1/products',
  CATEGORIES: '/v1/products/categories',
  ORDERS: '/v1/orders',
  CART: '/v1/cart',                    // 新增購物車 API
  RECOMMENDATIONS: '/v1/recommendations', // 新增推薦系統 API
  ANALYTICS: '/v1/analytics',           // 分析報表 API
  DASHBOARD: '/v1/dashboard',           // 儀表板 API
  SYSTEM: '/v1/system',
  LOGS: '/v1/logs',
  NOTIFICATIONS: '/v1/notifications',
  UTILITY: '/v1/utility',
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
        localStorage.removeItem('user_info');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

// 各服務 API 實例 - 對應新的統一後端 API
export const authApi = createApiInstance(API_BASE_URL); // Base path is /api/v1/auth
export const userApi = createApiInstance(API_BASE_URL); // Base path is /api/v1/users
export const productApi = createApiInstance(API_BASE_URL); // Base path is /api/v1/products
export const categoryApi = createApiInstance(API_BASE_URL); // Base path is /api/v1/products/categories
export const brandApi = createApiInstance(API_BASE_URL); // Base path is /api/v1/products/brands
export const orderApi = createApiInstance(API_BASE_URL); // Base path is /api/v1/orders
export const cartApi = createApiInstance(API_BASE_URL); // Base path is /api/v1/cart
export const recommendationApi = createApiInstance(API_BASE_URL); // Base path is /api/v1/recommendations
export const analyticsApi = createApiInstance(API_BASE_URL); // Base path is /api/v1/analytics
export const dashboardApi = createApiInstance(API_BASE_URL); // Base path is /api/v1/dashboard
export const systemApi = createApiInstance(API_BASE_URL); // Base path is /api/v1/system
export const logApi = createApiInstance(API_BASE_URL); // Base path is /api/v1/logs
export const notificationApi = createApiInstance(API_BASE_URL); // Base path is /api/v1/notifications
export const utilityApi = createApiInstance(API_BASE_URL); // Base path is /api/v1/utility

// 兼容舊版 Service 的別名 - 保持向後兼容
export const permissionApi = authApi; // Permission management is in auth service
export const paymentApi = orderApi; // Payment is part of order service
export const logisticsApi = orderApi; // Logistics is in order service
export const imageApi = productApi; // Image upload is in product service
export const inventoryApi = productApi; // Inventory is part of product service
export const aiApi = recommendationApi; // AI services are in recommendation service

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

// Dashboard 圖表數據類型
export interface DailySalesData {
  date: string;
  sales: number;
  orders: number;
  users: number;
}

export interface OrderStatusData {
  status: string;
  count: number;
  amount: number;
  color: string;
}

export interface PopularProduct {
  id: string;
  name: string;
  image: string;
  price: number;
  salesCount: number;
  totalQuantity: number;
  totalSales: number;
  growth: number;
}

// Dashboard API 函數
export const getDailySalesData = async (period: string = 'month'): Promise<ApiResponse<DailySalesData[]>> => {
  const response = await dashboardApi.get(`/v1/dashboard/daily-sales?period=${period}`);
  return response.data;
};

export const getOrderStatusData = async (): Promise<ApiResponse<OrderStatusData[]>> => {
  const response = await dashboardApi.get('/v1/dashboard/order-status');
  return response.data;
};

export const getPopularProductsData = async (limit: number = 10): Promise<ApiResponse<PopularProduct[]>> => {
  const response = await dashboardApi.get(`/v1/dashboard/popular-products?limit=${limit}`);
  return response.data;
};