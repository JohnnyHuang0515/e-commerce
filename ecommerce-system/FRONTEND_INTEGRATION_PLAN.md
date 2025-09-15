# 前端整合計劃

## 🎯 整合目標

將現有的管理員後台前端與新建立的統一 Node.js API 系統進行整合，確保所有功能正常運作。

## 📊 現狀分析

### ✅ 已實現的管理員後台
- **技術棧**: React + TypeScript + Ant Design + Vite
- **狀態管理**: Redux Toolkit + React Query
- **API 層**: Axios + 統一攔截器
- **頁面**: 17 個功能模組完整實現

### 🔗 API 對應關係

| 前端模組 | 後端 API | 整合狀態 | 備註 |
|---------|----------|----------|------|
| **認證系統** | `/api/v1/auth/*` | ✅ 完全對應 | 6 個端點 |
| **用戶管理** | `/api/v1/users/*` | ✅ 完全對應 | 7 個端點 |
| **商品管理** | `/api/v1/products/*` | ✅ 完全對應 | 7 個端點 |
| **訂單管理** | `/api/v1/orders/*` | ✅ 完全對應 | 6 個端點 |
| **購物車** | `/api/v1/cart/*` | ⚠️ 需要新增 | 7 個端點 |
| **推薦系統** | `/api/v1/recommendations/*` | ✅ 完全對應 | 4 個端點 |

## 🔧 整合步驟

### 階段 1: API 配置更新
1. **更新 API 基礎 URL**
   - 從 `http://localhost:8080/api` 更新為 `http://localhost:8000/api`
   - 確保通過 Nginx 代理或直接連接

2. **新增購物車 API 支援**
   - 在 `services/api.ts` 中新增 `cartApi` 實例
   - 添加購物車相關的 API 路徑

3. **更新 API 路徑配置**
   - 確保所有 API 路徑與後端一致
   - 添加新的端點支援

### 階段 2: 功能模組整合
1. **認證系統整合**
   - 登入/登出功能
   - JWT 令牌管理
   - 權限檢查

2. **用戶管理整合**
   - 用戶 CRUD 操作
   - 角色分配
   - 權限管理

3. **商品管理整合**
   - 商品 CRUD 操作
   - 分類管理
   - 圖片上傳

4. **訂單管理整合**
   - 訂單列表和詳情
   - 狀態更新
   - 統計報表

5. **推薦系統整合**
   - 推薦商品管理
   - 相似商品
   - 熱門商品

### 階段 3: 新增功能
1. **購物車管理**
   - 購物車頁面
   - 商品增刪改
   - 數量同步

2. **儀表板數據**
   - 營業數據統計
   - 熱銷商品分析
   - AI 分析報告

## 🛠️ 技術實現

### API 服務更新
```typescript
// 新增購物車 API
export const cartApi = createApiInstance(API_BASE_URL);

// 更新 API 路徑
const API_PATHS = {
  AUTH: '/v1/auth',
  USERS: '/v1/users',
  PRODUCTS: '/v1/products',
  ORDERS: '/v1/orders',
  CART: '/v1/cart',        // 新增
  RECOMMENDATIONS: '/v1/recommendations', // 新增
  // ... 其他路徑
};
```

### 認證整合
```typescript
// 更新認證攔截器
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  }
);
```

### 錯誤處理
```typescript
// 統一錯誤處理
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 重新導向到登入頁面
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

## 📋 測試計劃

### 1. 功能測試
- [ ] 認證系統測試
- [ ] 用戶管理測試
- [ ] 商品管理測試
- [ ] 訂單管理測試
- [ ] 購物車功能測試
- [ ] 推薦系統測試

### 2. 整合測試
- [ ] API 連接測試
- [ ] 權限控制測試
- [ ] 錯誤處理測試
- [ ] 性能測試

### 3. 用戶體驗測試
- [ ] 頁面載入速度
- [ ] 操作響應時間
- [ ] 錯誤提示友好性
- [ ] 移動端適配

## 🎯 預期成果

1. **完整的管理員後台**
   - 所有功能模組正常運作
   - 與後端 API 完全整合
   - 權限控制正常

2. **良好的用戶體驗**
   - 快速響應
   - 友好的錯誤提示
   - 直觀的操作界面

3. **可擴展的架構**
   - 易於添加新功能
   - 模組化設計
   - 統一的 API 管理

## 📅 時間規劃

- **階段 1**: 1-2 天 (API 配置更新)
- **階段 2**: 3-4 天 (功能模組整合)
- **階段 3**: 2-3 天 (新增功能)
- **測試**: 1-2 天 (功能測試)

**總計**: 7-11 天

## 🚀 下一步行動

1. **立即開始**: 更新 API 配置
2. **優先處理**: 認證系統整合
3. **重點關注**: 購物車功能新增
4. **持續測試**: 每個階段完成後進行測試
