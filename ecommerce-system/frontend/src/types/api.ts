export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  code?: string;
  timestamp?: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
  code: string;
  timestamp?: string;
  request_id?: string;
  details?: Record<string, unknown>;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  items: T[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  meta?: PaginationMeta;
}

export type PaginatedResponse<T> = ApiResponse<Paginated<T>>;

export interface UserSummary {
  id?: string;
  public_id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  permissions?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface ProductSummary {
  public_id: string;
  name: string;
  description?: string;
  price: number;
  stock_quantity: number;
  status?: number;
  created_at?: string;
  updated_at?: string;
  category?: string;
  brand?: string;
  sku?: string;
  images?: string[];
}

export interface OrderSummary {
  public_id: string;
  status: string;
  total_amount: number;
  currency?: string;
  user_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface InventoryItem {
  product_id: number;
  public_id: string;
  name: string;
  sku: string;
  stock_quantity: number;
  min_stock_level?: number;
  category_name?: string;
  brand?: string;
  status: number;
  last_updated?: string;
}

export interface InventoryStats {
  total_products: number;
  total_stock_value: number;
  low_stock_count: number;
  out_of_stock_count: number;
  category_stats: Array<{
    category_name: string;
    product_count: number;
    total_stock: number;
    low_stock_count: number;
  }>;
}

export interface DashboardOverview {
  summary: {
    totalSales: number;
    totalOrders: number;
    totalUsers: number;
    totalProducts: number;
    averageOrderValue: number;
    conversionRate: number;
  };
  periodData: Array<{
    date: string;
    sales: number;
    orders: number;
    users: number;
  }>;
  growth: {
    salesGrowth: number;
    ordersGrowth: number;
    usersGrowth: number;
  };
  alerts: Array<{ title: string; message: string; severity: string }>;
  systemStatus: {
    services: Array<{
      name: string;
      status: string;
      responseTime: number;
      lastCheck: string;
    }>;
  };
}

export type ProductDetail = ProductSummary & {
  category_id?: string;
  brand_id?: string;
};

export interface OrderItemSummary {
  product_id: string;
  quantity: number;
  price: number;
  total?: number;
  name?: string;
  sku?: string;
}

export type OrderDetail = OrderSummary & {
  items: OrderItemSummary[];
  subtotal?: number;
  tax?: number;
  shipping_cost?: number;
  discount?: number;
  payment_status?: string;
  shipping_method?: string;
  notes?: string;
};
