# 🎨 前端開發指南 (Frontend Development Guide)

## 📋 概述

本指南定義電商系統管理後台的前端開發規範，包含技術選型、設計系統、組件規範、開發流程等。

## 🏗️ 技術選型

### 核心框架
- **React 18+** - 主要前端框架
- **TypeScript 5+** - 類型安全
- **Vite 5+** - 構建工具

### UI 框架
- **Ant Design 5+** - 企業級 UI 組件庫
- **@ant-design/icons** - 圖標庫
- **@ant-design/charts** - 圖表庫

### 狀態管理
- **Redux Toolkit** - 全局狀態管理
- **React Query** - 服務器狀態管理

### 路由管理
- **React Router 6+** - 路由管理

### 樣式方案
- **CSS Modules** - 模組化樣式
- **Less** - CSS 預處理器
- **Tailwind CSS** - 原子化 CSS (可選)

### 開發工具
- **ESLint** - 代碼檢查
- **Prettier** - 代碼格式化
- **Husky** - Git Hooks
- **Commitlint** - 提交信息規範

## 🎨 設計系統

### 色彩系統

#### 主色調
```css
:root {
  /* 主色調 - 藍色系 */
  --primary-color: #1890ff;
  --primary-color-hover: #40a9ff;
  --primary-color-active: #096dd9;
  --primary-color-outline: rgba(24, 144, 255, 0.2);
  
  /* 輔助色調 */
  --success-color: #52c41a;
  --warning-color: #faad14;
  --error-color: #ff4d4f;
  --info-color: #1890ff;
}
```

#### 中性色
```css
:root {
  /* 文字顏色 */
  --text-color: rgba(0, 0, 0, 0.85);
  --text-color-secondary: rgba(0, 0, 0, 0.45);
  --text-color-disabled: rgba(0, 0, 0, 0.25);
  
  /* 背景顏色 */
  --bg-color: #ffffff;
  --bg-color-light: #fafafa;
  --bg-color-dark: #f0f0f0;
  
  /* 邊框顏色 */
  --border-color: #d9d9d9;
  --border-color-light: #f0f0f0;
  --border-color-dark: #bfbfbf;
}
```

### 字體系統

#### 字體大小
```css
:root {
  --font-size-xs: 12px;
  --font-size-sm: 14px;
  --font-size-base: 16px;
  --font-size-lg: 18px;
  --font-size-xl: 20px;
  --font-size-xxl: 24px;
  --font-size-xxxl: 32px;
}
```

#### 字體權重
```css
:root {
  --font-weight-light: 300;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
}
```

### 間距系統

#### 基礎間距
```css
:root {
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  --spacing-xxl: 48px;
  --spacing-xxxl: 64px;
}
```

#### 組件間距
```css
:root {
  /* 頁面間距 */
  --page-padding: 24px;
  --section-padding: 16px;
  
  /* 組件間距 */
  --component-margin: 16px;
  --component-padding: 16px;
  
  /* 表單間距 */
  --form-item-margin: 16px;
  --form-label-margin: 8px;
}
```

### 陰影系統
```css
:root {
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}
```

## 🧩 組件規範

### 基礎組件

#### 按鈕 (Button)
```typescript
interface ButtonProps {
  type?: 'primary' | 'default' | 'dashed' | 'link' | 'text';
  size?: 'large' | 'middle' | 'small';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
}

// 使用範例
<Button type="primary" size="middle" icon={<PlusOutlined />}>
  新增用戶
</Button>
```

#### 表單 (Form)
```typescript
interface FormProps {
  layout?: 'horizontal' | 'vertical' | 'inline';
  size?: 'large' | 'middle' | 'small';
  labelCol?: { span: number };
  wrapperCol?: { span: number };
  children: React.ReactNode;
}

// 使用範例
<Form layout="horizontal" labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
  <Form.Item label="用戶名" name="username" rules={[{ required: true }]}>
    <Input placeholder="請輸入用戶名" />
  </Form.Item>
</Form>
```

#### 表格 (Table)
```typescript
interface TableProps<T> {
  columns: ColumnType<T>[];
  dataSource: T[];
  loading?: boolean;
  pagination?: PaginationProps | false;
  rowKey: string | ((record: T) => string);
}

// 使用範例
<Table
  columns={userColumns}
  dataSource={users}
  loading={loading}
  pagination={{ pageSize: 10 }}
  rowKey="id"
/>
```

### 業務組件

#### 數據卡片 (StatCard)
```typescript
interface StatCardProps {
  title: string;
  value: number | string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  trend?: {
    value: number;
    type: 'up' | 'down' | 'stable';
  };
  color?: string;
}

// 使用範例
<StatCard
  title="總銷售額"
  value={1500000}
  prefix="NT$"
  trend={{ value: 15.5, type: 'up' }}
  color="#1890ff"
/>
```

#### 圖表組件 (Chart)
```typescript
interface ChartProps {
  type: 'line' | 'bar' | 'pie' | 'area';
  data: any[];
  config?: any;
  height?: number;
}

// 使用範例
<Chart
  type="line"
  data={salesData}
  config={chartConfig}
  height={300}
/>
```

## 📱 響應式設計

### 斷點系統
```css
/* 手機 */
@media (max-width: 767px) {
  .container {
    padding: 16px;
  }
}

/* 平板 */
@media (min-width: 768px) and (max-width: 1023px) {
  .container {
    padding: 24px;
  }
}

/* 桌面 */
@media (min-width: 1024px) {
  .container {
    padding: 32px;
  }
}
```

### 布局適配
```typescript
// 響應式布局組件
const ResponsiveLayout: React.FC = ({ children }) => {
  const { xs, sm, md, lg, xl } = useBreakpoint();
  
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={24} md={12} lg={8} xl={6}>
        {children}
      </Col>
    </Row>
  );
};
```

## 🏗️ 頁面結構

### 管理後台布局
```typescript
// 主布局組件
const AdminLayout: React.FC = ({ children }) => {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 側邊欄 */}
      <Sider width={200} theme="light">
        <Logo />
        <Menu mode="inline" items={menuItems} />
      </Sider>
      
      {/* 主內容區 */}
      <Layout>
        {/* 頂部導航 */}
        <Header style={{ background: '#fff', padding: '0 24px' }}>
          <HeaderContent />
        </Header>
        
        {/* 內容區域 */}
        <Content style={{ margin: '24px', background: '#fff' }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};
```

### 頁面組件結構
```typescript
// 頁面組件範例
const UserManagementPage: React.FC = () => {
  return (
    <PageContainer>
      {/* 頁面標題 */}
      <PageHeader title="用戶管理" />
      
      {/* 搜索區域 */}
      <SearchForm />
      
      {/* 操作按鈕 */}
      <ActionBar>
        <Button type="primary" icon={<PlusOutlined />}>
          新增用戶
        </Button>
      </ActionBar>
      
      {/* 數據表格 */}
      <UserTable />
      
      {/* 分頁 */}
      <Pagination />
    </PageContainer>
  );
};
```

### API 對應表

| 頁面 | 對應 API 服務 | 主要端點 | 狀態 |
|------|---------------|----------|------|
| **認證頁面** |
| LoginPage | Auth Service | `POST /api/v1/auth/login` | ✅ 已實作 |
| ProfilePage | Auth Service | `GET /api/v1/auth/profile` | ✅ 已實作 |
| PasswordPage | Auth Service | `PUT /api/v1/auth/password` | ✅ 已實作 |
| **儀表板頁面** |
| OverviewPage | Dashboard Service | `GET /api/v1/dashboard/overview` | 🎨 設計完成 |
| RealtimePage | Dashboard Service | `GET /api/v1/dashboard/realtime` | 🎨 設計完成 |
| AnalyticsPage | Dashboard Service | `GET /api/v1/dashboard/analytics` | 🎨 設計完成 |
| **用戶管理頁面** |
| UserListPage | User Service | `GET /api/v1/users` | ✅ 已實作 |
| UserDetailPage | User Service | `GET /api/v1/users/{userId}` | ✅ 已實作 |
| UserCreatePage | User Service | `POST /api/v1/users` | ✅ 已實作 |
| UserAnalyticsPage | User Service | `GET /api/v1/users/overview` | ✅ 已實作 |
| **商品管理頁面** |
| ProductListPage | Product Service | `GET /api/v1/products` | ✅ 已實作 |
| ProductDetailPage | Product Service | `GET /api/v1/products/{id}` | ✅ 已實作 |
| ProductCreatePage | Product Service | `POST /api/v1/products` | ✅ 已實作 |
| CategoryPage | Product Service | `GET /api/v1/categories` | ✅ 已實作 |
| **訂單管理頁面** |
| OrderListPage | Order Service | `GET /api/v1/orders` | ✅ 已實作 |
| OrderDetailPage | Order Service | `GET /api/v1/orders/{orderId}` | ✅ 已實作 |
| OrderCreatePage | Order Service | `POST /api/v1/orders` | ✅ 已實作 |
| OrderStatusPage | Order Service | `PUT /api/v1/orders/{orderId}/status` | ✅ 已實作 |
| **營運分析頁面** |
| SalesPage | Analytics Service | `GET /api/v1/analytics/sales` | ✅ 已實作 |
| UserAnalyticsPage | Analytics Service | `GET /api/v1/analytics/users` | ✅ 已實作 |
| ProductAnalyticsPage | Analytics Service | `GET /api/v1/analytics/products` | ✅ 已實作 |
| RevenuePage | Analytics Service | `GET /api/v1/analytics/revenue` | ✅ 已實作 |
| **系統設定頁面** |
| GeneralPage | Settings Service | `GET /api/v1/settings` | ✅ 已實作 |
| PaymentPage | Settings Service | `GET /api/v1/settings/payment` | ✅ 已實作 |
| ShippingPage | Settings Service | `GET /api/v1/settings/shipping` | ✅ 已實作 |
| SecurityPage | Settings Service | `GET /api/v1/settings/security` | ✅ 已實作 |
| **搜尋推薦頁面** |
| ProductSearchPage | Search Service | `GET /api/v1/search/products` | 🚧 計劃中 |
| UserSearchPage | Search Service | `GET /api/v1/search/users` | 🚧 計劃中 |
| OrderSearchPage | Search Service | `GET /api/v1/search/orders` | 🚧 計劃中 |
| **日誌管理頁面** |
| UserLogPage | Log Service | `GET /api/v1/logs/user-actions` | 🚧 計劃中 |
| ApiLogPage | Log Service | `GET /api/v1/logs/api-access` | 🚧 計劃中 |
| ErrorLogPage | Log Service | `GET /api/v1/logs/errors` | 🚧 計劃中 |
| **通知管理頁面** |
| NotificationListPage | Notification Service | `GET /api/v1/notifications` | 🚧 計劃中 |
| NotificationCreatePage | Notification Service | `POST /api/v1/notifications` | 🚧 計劃中 |

**狀態說明**:
- ✅ 已實作 - API 服務已完成並運行中
- 🎨 設計完成 - 設計文檔已完成，準備實作
- 🚧 計劃中 - 尚未開始實作
- ⏸️ 後續實作 - 暫時跳過，優先完成核心功能

## 🔧 開發規範

### 文件命名
```
src/
├── components/          # 組件目錄
│   ├── common/         # 通用組件
│   │   ├── Button/
│   │   │   ├── index.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── Button.module.css
│   │   │   └── Button.test.tsx
│   │   └── Table/
│   ├── business/       # 業務組件
│   │   ├── UserCard/
│   │   └── OrderList/
│   └── layout/         # 布局組件
│       ├── Header/
│       ├── Sidebar/
│       └── Footer/
├── pages/              # 頁面目錄
│   ├── dashboard/
│   ├── user/
│   ├── product/
│   └── order/
├── services/           # API 服務
├── store/              # 狀態管理
├── utils/              # 工具函數
└── types/              # 類型定義
```

### 組件開發規範
```typescript
// 1. 使用 TypeScript
interface ComponentProps {
  title: string;
  data: any[];
  loading?: boolean;
  onAction?: (id: string) => void;
}

// 2. 使用函數組件 + Hooks
const MyComponent: React.FC<ComponentProps> = ({
  title,
  data,
  loading = false,
  onAction
}) => {
  const [state, setState] = useState();
  
  useEffect(() => {
    // 副作用處理
  }, []);
  
  return (
    <div className={styles.container}>
      <h2>{title}</h2>
      {/* 組件內容 */}
    </div>
  );
};

// 3. 導出組件
export default MyComponent;
```

### 樣式開發規範
```css
/* 使用 CSS Modules */
.container {
  padding: var(--spacing-md);
  background: var(--bg-color);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  box-shadow: var(--shadow-sm);
}

/* 響應式設計 */
@media (max-width: 767px) {
  .container {
    padding: var(--spacing-sm);
  }
}

/* 狀態樣式 */
.container:hover {
  box-shadow: var(--shadow-md);
}

.container:active {
  transform: translateY(1px);
}
```

## 🚀 開發流程

### 1. 環境設置
```bash
# 安裝依賴
npm install

# 啟動開發服務器
npm run dev

# 構建生產版本
npm run build

# 運行測試
npm run test
```

### 2. 開發流程
1. **創建功能分支**
   ```bash
   git checkout -b feature/user-management
   ```

2. **開發組件**
   - 創建組件文件
   - 編寫 TypeScript 類型
   - 實作組件邏輯
   - 添加樣式

3. **編寫測試**
   ```typescript
   describe('UserCard', () => {
     it('should render user information', () => {
       // 測試邏輯
     });
   });
   ```

4. **代碼檢查**
   ```bash
   npm run lint
   npm run type-check
   ```

5. **提交代碼**
   ```bash
   git add .
   git commit -m "feat: add user management page"
   ```

### 3. 代碼質量
- **ESLint**: 代碼風格檢查
- **Prettier**: 代碼格式化
- **TypeScript**: 類型檢查
- **Jest**: 單元測試
- **Cypress**: E2E 測試

## 📊 性能優化

### 1. 代碼分割
```typescript
// 路由級代碼分割
const Dashboard = lazy(() => import('./pages/Dashboard'));
const UserManagement = lazy(() => import('./pages/UserManagement'));

// 組件級代碼分割
const Chart = lazy(() => import('./components/Chart'));
```

### 2. 圖片優化
```typescript
// 使用 WebP 格式
<img src="image.webp" alt="description" />

// 懶加載
<img src="image.jpg" loading="lazy" alt="description" />
```

### 3. 緩存策略
```typescript
// API 緩存
const { data } = useQuery(['users'], fetchUsers, {
  staleTime: 5 * 60 * 1000, // 5分鐘
  cacheTime: 10 * 60 * 1000, // 10分鐘
});
```

## 🔒 安全規範

### 1. XSS 防護
```typescript
// 使用 React 的內建 XSS 防護
const content = userInput; // React 會自動轉義
return <div>{content}</div>;
```

### 2. CSRF 防護
```typescript
// API 請求添加 CSRF Token
const api = axios.create({
  headers: {
    'X-CSRF-Token': getCsrfToken(),
  },
});
```

### 3. 輸入驗證
```typescript
// 使用 Zod 進行輸入驗證
const userSchema = z.object({
  username: z.string().min(3).max(20),
  email: z.string().email(),
  age: z.number().min(18).max(100),
});
```

## 📚 文檔規範

### 1. 組件文檔
```typescript
/**
 * 用戶卡片組件
 * 
 * @param {string} title - 卡片標題
 * @param {User[]} data - 用戶數據
 * @param {boolean} loading - 載入狀態
 * @param {Function} onAction - 操作回調
 * 
 * @example
 * ```tsx
 * <UserCard
 *   title="用戶列表"
 *   data={users}
 *   loading={false}
 *   onAction={(id) => console.log(id)}
 * />
 * ```
 */
```

### 2. API 文檔
```typescript
/**
 * 獲取用戶列表
 * 
 * @param {GetUsersParams} params - 查詢參數
 * @returns {Promise<User[]>} 用戶列表
 * 
 * @example
 * ```typescript
 * const users = await getUsers({
 *   page: 1,
 *   limit: 10,
 *   search: 'john'
 * });
 * ```
 */
```

## 🎯 下一步計劃

### 第一階段 (1-2 天)
- [ ] 建立專案結構
- [ ] 配置開發環境
- [ ] 建立基礎組件

### 第二階段 (3-4 天)
- [ ] 實作頁面布局
- [ ] 建立路由系統
- [ ] 整合 API 服務

### 第三階段 (5-6 天)
- [ ] 實作業務頁面
- [ ] 添加圖表組件
- [ ] 優化用戶體驗

### 第四階段 (7-8 天)
- [ ] 性能優化
- [ ] 測試驗證
- [ ] 文檔完善
