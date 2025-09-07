# API 設計規範 (API Design Specification) - 電商系統

---

**文件版本 (Document Version):** v1.1.0

**最後更新 (Last Updated):** 2025-01-03

**主要作者/設計師 (Lead Author/Designer):** 電商系統 API 設計師

**審核者 (Reviewers):** API 設計委員會、架構團隊、前端開發團隊

**狀態 (Status):** 設計中 (In Design)

**相關 SD 文檔:** [03_system_design_document.md](./03_system_design_document.md)

**OpenAPI/Swagger 定義文件:** `openapi.yaml`

---

## 目錄 (Table of Contents)

1. [引言 (Introduction)](#1-引言-introduction)
2. [通用設計約定 (General Design Conventions)](#2-通用設計約定-general-design-conventions)
3. [認證與授權 (Authentication and Authorization)](#3-認證與授權-authentication-and-authorization)
4. [錯誤處理 (Error Handling)](#4-錯誤處理-error-handling)
5. [速率限制與配額 (Rate Limiting and Quotas)](#5-速率限制與配額-rate-limiting-and-quotas)
6. [API 端點詳述 (API Endpoint Definitions)](#6-api-端點詳述-api-endpoint-definitions)
7. [資料模型/Schema 定義 (Data Models / Schema Definitions)](#7-資料模型schema-定義-data-models--schema-definitions)
8. [安全性考量 (Security Considerations)](#8-安全性考量-security-considerations)
9. [向後兼容性與棄用策略 (Backward Compatibility and Deprecation Policy)](#9-向後兼容性與棄用策略-backward-compatibility-and-deprecation-policy)
10. [附錄 (Appendices)](#10-附錄-appendices)

---

## 1. 引言 (Introduction)

### 1.1 目的 (Purpose)
*   為電商系統的 RESTful API 提供統一、明確的接口契約，確保前端應用、移動端和第三方系統能夠正確地與後端服務進行交互

### 1.2 目標讀者 (Target Audience)
*   前端開發者、移動端開發者、第三方整合開發者、API 實現者、測試工程師、技術文件撰寫者

### 1.3 API 風格與原則 (API Style and Principles)
*   **RESTful 架構風格:** 遵循 REST 成熟度模型 Level 2，使用 HTTP 動詞和狀態碼
*   **設計原則:**
    *   資源導向設計，使用名詞複數形式的 URI
    *   無狀態通信，每個請求包含完整的上下文資訊
    *   統一介面，使用標準的 HTTP 方法
    *   可快取性，適當使用 HTTP 快取機制
    *   分層系統，支持負載均衡和快取代理
    *   AI 驅動，提供智能化的搜尋和推薦功能

---

## 2. 通用設計約定 (General Design Conventions)

### 2.1 基本 URL (Base URL)
*   **生產環境 (Production):** `https://api.ecommerce.com/v1`
*   **預備環境 (Staging):** `https://staging-api.ecommerce.com/v1`
*   **開發環境 (Development):** `http://localhost:8080/api/v1`

### 2.2 版本控制 (Versioning)
*   **策略:** URL 路徑版本控制 (例如：`/v1/`, `/v2/`)
*   **當前版本:** `v1`
*   **版本升級策略:** 當 API 發生不兼容變更時，發布新版本並保持舊版本至少 6 個月

### 2.3 請求格式 (Request Formats)
*   **主要格式:** `application/json` (UTF-8 編碼)
*   **其他支持格式:** `multipart/form-data` (用於文件上傳)
*   **Content-Type Header:** 客戶端發送請求時，若有請求體，必須包含正確的 `Content-Type` header

### 2.4 回應格式 (Response Formats)
*   **主要格式:** `application/json` (UTF-8 編碼)
*   **通用回應結構:**
    ```json
    {
      "data": { /* 實際數據對象或列表 */ },
      "meta": { /* 元數據，如分頁信息、請求 ID 等 */ }
    }
    ```

### 2.5 日期與時間格式 (Date and Time Formats)
*   **標準格式:** ISO 8601 格式 `YYYY-MM-DDTHH:mm:ss.sssZ` (UTC 時間)
*   **時區處理:** 所有 API 交換的時間數據都使用 UTC 時間

### 2.6 命名約定 (Naming Conventions)
*   **資源路徑 (Resource Paths):** 小寫，多個單詞用連字符連接，名詞複數形式 (例如：`/products`, `/order-items`)
*   **查詢參數 (Query Parameters):** snake_case (例如：`page_size`, `sort_by`)
*   **JSON 欄位 (JSON Fields):** camelCase (例如：`productId`, `createdAt`)
*   **HTTP Headers (自定義):** `X-Ecommerce-*` 格式

### 2.7 分頁 (Pagination)
*   **策略:** 基於偏移量/限制 (Offset/Limit-based) 分頁
*   **查詢參數:**
    *   `page`: 頁碼，從 1 開始 (預設值: 1)
    *   `page_size`: 每頁項目數 (預設值: 20，最大值: 100)
*   **回應中的分頁信息:**
    ```json
    "meta": {
      "pagination": {
        "totalItems": 120,
        "totalPages": 6,
        "currentPage": 1,
        "pageSize": 20,
        "hasNext": true,
        "hasPrevious": false
      }
    }
    ```

### 2.8 排序 (Sorting)
*   **查詢參數:** `sort_by`
*   **格式:** `sort_by=field_name` (升序預設), `sort_by=-field_name` (降序)
*   **多欄位排序:** `sort_by=field1,-field2` (逗號分隔)
*   **可排序欄位:** `id`, `name`, `price`, `createdAt`, `updatedAt`

### 2.9 過濾 (Filtering)
*   **策略:** 直接使用欄位名作為查詢參數
*   **範例:** `/products?category_id=1&status=active&price_min=100&price_max=1000`
*   **支持的過濾操作符:**
    *   等於: `field=value`
    *   大於: `field_gt=value`
    *   小於: `field_lt=value`
    *   包含: `field_in=value1,value2`
    *   模糊搜尋: `field_like=value`

### 2.10 部分回應與欄位選擇 (Partial Responses and Field Selection)
*   **查詢參數:** `fields`
*   **格式:** `fields=id,name,price` (逗號分隔的欄位列表)
*   **目的:** 減少網路傳輸量，提升性能

---

## 3. 認證與授權 (Authentication and Authorization)

### 3.1 認證機制 (Authentication Mechanism)
*   **OAuth 2.0 (Bearer Token):** 客戶端需在 `Authorization` header 中提供 `Bearer <access_token>`
*   **JWT Token 格式:** 使用 JWT (JSON Web Token) 作為 Access Token
*   **Token 獲取方式:** 通過 `/auth/login` 端點獲取
*   **Token 有效期:** 24 小時
*   **Token 刷新機制:** 使用 Refresh Token 進行無感刷新

### 3.2 授權模型/範圍 (Authorization Model/Scopes)
*   **基於角色的訪問控制 (RBAC):**
    *   `ADMIN`: 系統管理員，擁有所有權限
    *   `MERCHANT`: 商家，可以管理自己的商品和訂單
    *   `CUSTOMER`: 客戶，可以瀏覽商品、下單、管理個人資料
    *   `GUEST`: 訪客，只能瀏覽公開商品資訊
*   **權限檢查:** 每個 API 端點都會檢查用戶角色和權限
*   **授權失敗回應:** 返回 `403 Forbidden` 狀態碼

---

## 4. 錯誤處理 (Error Handling)

### 4.1 標準錯誤回應格式 (Standard Error Response Format)
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "請求資料驗證失敗",
    "details": [
      {
        "field": "price",
        "code": "INVALID_VALUE",
        "message": "價格必須大於 0"
      }
    ],
    "traceId": "550e8400-e29b-41d4-a716-446655440000",
    "timestamp": "2025-01-03T10:00:00.000Z"
  }
}
```

### 4.2 通用 HTTP 狀態碼使用 (Common HTTP Status Codes)
*   **2xx - 成功 (Success):**
    *   `200 OK`: 請求成功，適用於 GET, PUT, PATCH
    *   `201 Created`: 資源創建成功，適用於 POST，回應包含 `Location` header
    *   `204 No Content`: 請求成功但無回應內容，適用於 DELETE
*   **4xx - 客戶端錯誤 (Client Errors):**
    *   `400 Bad Request`: 請求格式錯誤或參數無效
    *   `401 Unauthorized`: 未認證或認證失敗
    *   `403 Forbidden`: 已認證但無權限訪問
    *   `404 Not Found`: 請求的資源不存在
    *   `409 Conflict`: 資源衝突，如重複創建
    *   `422 Unprocessable Entity`: 請求格式正確但業務邏輯驗證失敗
    *   `429 Too Many Requests`: 請求頻率超過限制
*   **5xx - 伺服器錯誤 (Server Errors):**
    *   `500 Internal Server Error`: 伺服器內部錯誤
    *   `503 Service Unavailable`: 服務暫時不可用

---

## 5. 速率限制與配額 (Rate Limiting and Quotas)
*   **限制策略:** 基於用戶 ID 和 IP 地址的組合限制
*   **限制閾值:**
    *   認證用戶: 每分鐘 1000 次請求
    *   未認證用戶: 每分鐘 100 次請求
    *   管理員用戶: 每分鐘 5000 次請求
    *   AI 服務: 每分鐘 100 次請求 (高計算成本)
*   **超出限制回應:** HTTP 429 Too Many Requests
*   **相關 Headers:**
    *   `X-RateLimit-Limit`: 當前時間窗口內的總請求數限制
    *   `X-RateLimit-Remaining`: 當前時間窗口內剩餘的請求數
    *   `X-RateLimit-Reset`: 當前時間窗口重置的 Unix 時間戳
    *   `Retry-After`: 建議客戶端重試的秒數

---

## 6. API 端點詳述 (API Endpoint Definitions)

### 6.1 資源：商品 (Products)

#### 6.1.1 `GET /products`
*   **描述:** 獲取商品列表，支持分頁、排序和過濾
*   **認證/授權:** 公開 API，無需認證
*   **查詢參數 (Query Parameters):**
    *   `page`: 頁碼 (預設: 1)
    *   `page_size`: 每頁項目數 (預設: 20, 最大: 100)
    *   `sort_by`: 排序欄位 (可選值: `id`, `name`, `price`, `createdAt`)
    *   `category_id`: 商品分類 ID
    *   `status`: 商品狀態 (可選值: `active`, `inactive`)
    *   `price_min`: 最低價格
    *   `price_max`: 最高價格
    *   `search`: 商品名稱搜尋關鍵字
    *   `fields`: 返回欄位選擇
*   **成功回應 (200 OK):**
    ```json
    {
      "data": [
        {
          "id": 1001,
          "name": "iPhone 15 Pro",
          "description": "最新款 iPhone",
          "price": 35900.00,
          "categoryId": 1,
          "sku": "IPH15PRO001",
          "status": "active",
          "attributes": {
            "color": "深空黑色",
            "storage": "256GB"
          },
          "imageUrls": [
            "https://cdn.example.com/products/1001/image1.jpg"
          ],
          "createdAt": "2025-01-03T10:00:00.000Z",
          "updatedAt": "2025-01-03T10:00:00.000Z"
        }
      ],
      "meta": {
        "pagination": {
          "totalItems": 120,
          "totalPages": 6,
          "currentPage": 1,
          "pageSize": 20,
          "hasNext": true,
          "hasPrevious": false
        }
      }
    }
    ```
*   **錯誤回應:**
    *   `400 Bad Request`: 查詢參數格式錯誤

#### 6.1.2 `POST /products`
*   **描述:** 創建新商品
*   **認證/授權:** 需要 `ADMIN` 或 `MERCHANT` 角色
*   **請求體:**
    ```json
    {
      "name": "iPhone 15 Pro",
      "description": "最新款 iPhone",
      "price": 35900.00,
      "categoryId": 1,
      "sku": "IPH15PRO001",
      "attributes": {
        "color": "深空黑色",
        "storage": "256GB",
        "warranty": "1年"
      },
      "imageUrls": [
        "https://cdn.example.com/products/temp/image1.jpg"
      ]
    }
    ```
*   **資料驗證規則:**
    *   `name`: 必填，長度 1-100 字符
    *   `price`: 必填，必須大於 0
    *   `categoryId`: 必填，必須是有效的分類 ID
    *   `sku`: 必填，必須唯一，長度 1-50 字符
*   **成功回應 (201 Created):**
    *   **Headers:** `Location: /products/1001`
    *   **回應體:** 新創建的商品完整資訊
*   **錯誤回應:**
    *   `400 Bad Request`: 請求資料驗證失敗
    *   `401 Unauthorized`: 未認證
    *   `403 Forbidden`: 無權限創建商品
    *   `409 Conflict`: SKU 已存在

#### 6.1.3 `GET /products/{id}`
*   **描述:** 獲取指定 ID 的商品詳情
*   **認證/授權:** 公開 API，無需認證
*   **路徑參數 (Path Parameters):**
    *   `id`: 商品 ID (Long 類型)
*   **查詢參數:**
    *   `fields`: 返回欄位選擇
*   **成功回應 (200 OK):** 單個商品的完整資訊
*   **錯誤回應:**
    *   `404 Not Found`: 商品不存在

#### 6.1.4 `PUT /products/{id}`
*   **描述:** 完整更新指定 ID 的商品
*   **認證/授權:** 需要 `ADMIN` 角色或商品所有者
*   **路徑參數:** `id` - 商品 ID
*   **請求體:** 商品的完整資訊 (與 POST 格式相同)
*   **成功回應 (200 OK):** 更新後的商品資訊
*   **冪等性:** 此操作為冪等
*   **錯誤回應:**
    *   `400 Bad Request`: 請求資料驗證失敗
    *   `401 Unauthorized`: 未認證
    *   `403 Forbidden`: 無權限更新商品
    *   `404 Not Found`: 商品不存在

#### 6.1.5 `PATCH /products/{id}`
*   **描述:** 部分更新指定 ID 的商品
*   **認證/授權:** 需要 `ADMIN` 角色或商品所有者
*   **路徑參數:** `id` - 商品 ID
*   **請求體:** 只包含要修改的欄位
    ```json
    {
      "price": 33900.00,
      "status": "inactive"
    }
    ```
*   **成功回應 (200 OK):** 更新後的商品資訊
*   **冪等性:** 此操作為冪等

#### 6.1.6 `DELETE /products/{id}`
*   **描述:** 刪除指定 ID 的商品 (軟刪除)
*   **認證/授權:** 需要 `ADMIN` 角色
*   **路徑參數:** `id` - 商品 ID
*   **成功回應 (204 No Content):** 無回應內容
*   **冪等性:** 此操作為冪等
*   **錯誤回應:**
    *   `401 Unauthorized`: 未認證
    *   `403 Forbidden`: 無權限刪除商品
    *   `404 Not Found`: 商品不存在

### 6.2 資源：訂單 (Orders)

#### 6.2.1 `GET /orders`
*   **描述:** 獲取訂單列表
*   **認證/授權:** 需要認證，用戶只能查看自己的訂單，管理員可以查看所有訂單
*   **查詢參數:**
    *   `page`, `page_size`: 分頁參數
    *   `sort_by`: 排序 (可選值: `id`, `createdAt`, `totalAmount`)
    *   `status`: 訂單狀態過濾
    *   `date_from`, `date_to`: 日期範圍過濾
*   **成功回應 (200 OK):** 訂單列表和分頁資訊

#### 6.2.2 `POST /orders`
*   **描述:** 創建新訂單
*   **認證/授權:** 需要 `CUSTOMER` 角色
*   **請求體:**
    ```json
    {
      "items": [
        {
          "productId": 1001,
          "quantity": 1,
          "unitPrice": 35900.00
        }
      ],
      "shippingAddress": {
        "street": "台北市信義區信義路五段7號",
        "city": "台北市",
        "postalCode": "110",
        "country": "台灣",
        "recipientName": "王小明",
        "recipientPhone": "0912345678"
      },
      "paymentMethod": "credit_card"
    }
    ```
*   **成功回應 (201 Created):** 新創建的訂單資訊
*   **錯誤回應:**
    *   `400 Bad Request`: 請求資料驗證失敗
    *   `422 Unprocessable Entity`: 庫存不足或商品不可用

#### 6.2.3 `GET /orders/{id}`
*   **描述:** 獲取指定訂單詳情
*   **認證/授權:** 訂單所有者或管理員
*   **成功回應 (200 OK):** 訂單詳細資訊，包含訂單項目

#### 6.2.4 `PATCH /orders/{id}/status`
*   **描述:** 更新訂單狀態
*   **認證/授權:** 需要 `ADMIN` 或 `MERCHANT` 角色
*   **請求體:**
    ```json
    {
      "status": "shipped",
      "trackingNumber": "1234567890"
    }
    ```
*   **成功回應 (200 OK):** 更新後的訂單資訊

### 6.3 資源：用戶 (Users)

#### 6.3.1 `POST /users/register`
*   **描述:** 用戶註冊
*   **認證/授權:** 公開 API
*   **請求體:**
    ```json
    {
      "username": "john_doe",
      "email": "john@example.com",
      "password": "SecurePassword123!",
      "phone": "0912345678",
      "firstName": "John",
      "lastName": "Doe"
    }
    ```
*   **成功回應 (201 Created):** 用戶資訊 (不包含密碼)

#### 6.3.2 `POST /auth/login`
*   **描述:** 用戶登入
*   **認證/授權:** 公開 API
*   **請求體:**
    ```json
    {
      "username": "john_doe",
      "password": "SecurePassword123!"
    }
    ```
*   **成功回應 (200 OK):**
    ```json
    {
      "data": {
        "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "tokenType": "Bearer",
        "expiresIn": 86400,
        "user": {
          "id": 1001,
          "username": "john_doe",
          "email": "john@example.com",
          "role": "CUSTOMER"
        }
      }
    }
    ```

#### 6.3.3 `GET /users/profile`
*   **描述:** 獲取當前用戶個人資料
*   **認證/授權:** 需要認證
*   **成功回應 (200 OK):** 用戶完整個人資料

#### 6.3.4 `PATCH /users/profile`
*   **描述:** 更新當前用戶個人資料
*   **認證/授權:** 需要認證
*   **請求體:** 要更新的欄位
*   **成功回應 (200 OK):** 更新後的用戶資料

### 6.4 資源：AI 搜尋 (AI Search)

#### 6.4.1 `POST /search/semantic`
*   **描述:** 語意搜尋商品
*   **認證/授權:** 公開 API
*   **請求體:**
    ```json
    {
      "query": "我想要一台拍照很好的手機",
      "filters": {
        "categoryId": 1,
        "priceRange": {
          "min": 10000,
          "max": 50000
        },
        "brand": ["Apple", "Samsung"]
      },
      "limit": 20,
      "includeExplanation": true
    }
    ```
*   **成功回應 (200 OK):**
    ```json
    {
      "data": {
        "results": [
          {
            "productId": 1001,
            "name": "iPhone 15 Pro",
            "price": 35900.00,
            "relevanceScore": 0.95,
            "explanation": "符合拍照需求，具備專業攝影功能",
            "matchedFeatures": ["相機", "拍照", "攝影"]
          }
        ],
        "totalCount": 5,
        "searchTime": 150,
        "modelVersion": "v1.2.0"
      }
    }
    ```
*   **錯誤回應:**
    *   `400 Bad Request`: 查詢格式錯誤
    *   `503 Service Unavailable`: AI 服務暫時不可用

#### 6.4.2 `GET /search/suggestions`
*   **描述:** 獲取搜尋建議
*   **認證/授權:** 公開 API
*   **查詢參數:**
    *   `query`: 部分查詢文字
    *   `limit`: 建議數量 (預設: 10)
*   **成功回應 (200 OK):**
    ```json
    {
      "data": {
        "suggestions": [
          "iPhone 15 Pro",
          "iPhone 15 Pro Max",
          "iPhone 14 Pro"
        ],
        "categories": [
          {"id": 1, "name": "手機"},
          {"id": 2, "name": "平板"}
        ]
      }
    }
    ```

### 6.5 資源：AI 推薦 (AI Recommendations)

#### 6.5.1 `GET /recommendations/personalized`
*   **描述:** 獲取個人化推薦
*   **認證/授權:** 需要認證
*   **查詢參數:**
    *   `limit`: 推薦數量 (預設: 10)
    *   `categoryId`: 限制特定分類
    *   `excludePurchased`: 是否排除已購買商品 (預設: true)
*   **成功回應 (200 OK):**
    ```json
    {
      "data": {
        "recommendations": [
          {
            "productId": 1001,
            "name": "iPhone 15 Pro",
            "price": 35900.00,
            "confidence": 0.88,
            "reason": "基於您的瀏覽歷史",
            "algorithm": "collaborative_filtering"
          }
        ],
        "totalCount": 10,
        "modelVersion": "v1.1.0"
      }
    }
    ```

#### 6.5.2 `GET /recommendations/similar/{productId}`
*   **描述:** 獲取相似商品推薦
*   **認證/授權:** 公開 API
*   **路徑參數:** `productId` - 商品 ID
*   **查詢參數:**
    *   `limit`: 推薦數量 (預設: 5)
*   **成功回應 (200 OK):** 相似商品列表

#### 6.5.3 `POST /recommendations/feedback`
*   **描述:** 提交推薦反饋
*   **認證/授權:** 需要認證
*   **請求體:**
    ```json
    {
      "recommendationId": "rec_123",
      "action": "click", // "click", "purchase", "ignore"
      "productId": 1001,
      "timestamp": "2025-01-03T10:00:00.000Z"
    }
    ```
*   **成功回應 (200 OK):** 反饋提交成功

### 6.6 資源：AI 分析 (AI Analytics)

#### 6.6.1 `GET /analytics/inventory-prediction/{productId}`
*   **描述:** 獲取庫存預測
*   **認證/授權:** 需要 `ADMIN` 或 `MERCHANT` 角色
*   **路徑參數:** `productId` - 商品 ID
*   **查詢參數:**
    *   `timeframe`: 預測時間範圍 (預設: "month")
*   **成功回應 (200 OK):**
    ```json
    {
      "data": {
        "productId": 1001,
        "currentStock": 50,
        "predictedDemand": {
          "nextWeek": 25,
          "nextMonth": 100,
          "nextQuarter": 300
        },
        "recommendedAction": "INCREASE_STOCK",
        "confidence": 0.85,
        "factors": ["季節性需求", "歷史銷售趨勢"],
        "modelVersion": "v1.0.0"
      }
    }
    ```

#### 6.6.2 `GET /analytics/sales-forecast`
*   **描述:** 獲取銷售預測
*   **認證/授權:** 需要 `ADMIN` 角色
*   **查詢參數:**
    *   `timeframe`: 預測時間範圍
    *   `categoryId`: 商品分類 ID
*   **成功回應 (200 OK):** 銷售預測數據

#### 6.6.3 `GET /analytics/anomalies`
*   **描述:** 獲取異常檢測結果
*   **認證/授權:** 需要 `ADMIN` 角色
*   **查詢參數:**
    *   `type`: 異常類型 (預設: "all")
    *   `severity`: 嚴重程度
*   **成功回應 (200 OK):**
    ```json
    {
      "data": {
        "anomalies": [
          {
            "id": "anom_123",
            "type": "SALES_SPIKE",
            "severity": "HIGH",
            "description": "商品 1001 銷售異常增長",
            "detectedAt": "2025-01-03T10:00:00.000Z",
            "confidence": 0.92
          }
        ],
        "totalCount": 5
      }
    }
    ```

---

## 7. 資料模型/Schema 定義 (Data Models / Schema Definitions)

### 7.1 `ProductSchema`
```json
{
  "id": "string (ObjectId)",
  "name": "string (1-100 characters)",
  "description": "string (optional)",
  "price": "number (decimal, > 0)",
  "categoryId": "string (ObjectId)",
  "sku": "string (1-50 characters, unique)",
  "status": "string (enum: active, inactive, deleted)",
  "attributes": "object (key-value pairs)",
  "imageUrls": "array of strings (URLs)",
  "embedding": "array of numbers (optional, AI search vector)",
  "createdAt": "string (ISO 8601 datetime)",
  "updatedAt": "string (ISO 8601 datetime)"
}
```

### 7.2 `ProductCreateSchema`
```json
{
  "name": "string (required, 1-100 characters)",
  "description": "string (optional)",
  "price": "number (required, decimal, > 0)",
  "categoryId": "string (required, ObjectId)",
  "sku": "string (required, 1-50 characters, unique)",
  "attributes": "object (optional, key-value pairs)",
  "imageUrls": "array of strings (optional, URLs)"
}
```

### 7.3 `OrderSchema`
```json
{
  "id": "integer (int64)",
  "customerId": "integer (int64)",
  "status": "string (enum: pending, paid, processing, shipped, delivered, completed, cancelled)",
  "totalAmount": "number (decimal, >= 0)",
  "paymentId": "integer (int64, optional)",
  "shippingAddress": "AddressSchema",
  "items": "array of OrderItemSchema",
  "createdAt": "string (ISO 8601 datetime)",
  "updatedAt": "string (ISO 8601 datetime)"
}
```

### 7.4 `OrderItemSchema`
```json
{
  "id": "integer (int64)",
  "productId": "integer (int64)",
  "productName": "string",
  "quantity": "integer (> 0)",
  "unitPrice": "number (decimal, > 0)",
  "totalPrice": "number (decimal, > 0)"
}
```

### 7.5 `UserSchema`
```json
{
  "id": "integer (int64)",
  "username": "string (unique)",
  "email": "string (email format, unique)",
  "phone": "string (optional)",
  "firstName": "string",
  "lastName": "string",
  "role": "string (enum: ADMIN, MERCHANT, CUSTOMER)",
  "membershipLevel": "string (enum: BRONZE, SILVER, GOLD, PLATINUM)",
  "points": "integer (>= 0)",
  "addresses": "array of AddressSchema",
  "createdAt": "string (ISO 8601 datetime)",
  "updatedAt": "string (ISO 8601 datetime)"
}
```

### 7.6 `AddressSchema`
```json
{
  "id": "integer (int64, optional)",
  "street": "string (required)",
  "city": "string (required)",
  "state": "string (optional)",
  "postalCode": "string (required)",
  "country": "string (required)",
  "recipientName": "string (required)",
  "recipientPhone": "string (required)",
  "isDefault": "boolean (default: false)"
}
```

### 7.7 `SearchRequestSchema`
```json
{
  "query": "string (required, 1-500 characters)",
  "filters": {
    "categoryId": "string (ObjectId, optional)",
    "priceRange": {
      "min": "number (optional)",
      "max": "number (optional)"
    },
    "brand": "array of strings (optional)",
    "attributes": "object (optional)"
  },
  "limit": "integer (1-100, default: 20)",
  "includeExplanation": "boolean (default: false)"
}
```

### 7.8 `SearchResultSchema`
```json
{
  "productId": "string (ObjectId)",
  "name": "string",
  "price": "number",
  "relevanceScore": "number (0-1)",
  "explanation": "string (optional)",
  "matchedFeatures": "array of strings (optional)"
}
```

### 7.9 `RecommendationSchema`
```json
{
  "productId": "string (ObjectId)",
  "name": "string",
  "price": "number",
  "confidence": "number (0-1)",
  "reason": "string",
  "algorithm": "string (enum: collaborative_filtering, content_based, hybrid)"
}
```

### 7.10 `AnalyticsPredictionSchema`
```json
{
  "productId": "string (ObjectId)",
  "currentStock": "integer",
  "predictedDemand": {
    "nextWeek": "integer",
    "nextMonth": "integer",
    "nextQuarter": "integer"
  },
  "recommendedAction": "string (enum: INCREASE_STOCK, DECREASE_STOCK, MAINTAIN)",
  "confidence": "number (0-1)",
  "factors": "array of strings",
  "modelVersion": "string"
}
```

---

## 8. 安全性考量 (Security Considerations)

*   **輸入驗證 (Input Validation):** 所有用戶輸入都經過嚴格驗證，防止 XSS、SQL Injection 等攻擊
*   **輸出編碼 (Output Encoding):** 所有輸出數據都進行適當編碼，防止 XSS 攻擊
*   **敏感數據處理:** 密碼使用 BCrypt 加密，不在 API 回應中返回敏感資訊
*   **HTTPS 強制:** 生產環境強制使用 HTTPS
*   **CORS 配置:** 適當配置 CORS 策略，限制跨域訪問
*   **API 安全標頭:** 設置適當的安全標頭 (CSP, HSTS, X-Frame-Options 等)
*   **AI 安全:** 模型輸入驗證、對抗攻擊防護、模型版本管理

---

## 9. 向後兼容性與棄用策略 (Backward Compatibility and Deprecation Policy)

*   **向後兼容性承諾:** API v1 版本保證向後兼容，允許的變更包括：
    *   新增可選欄位
    *   新增新的 API 端點
    *   新增新的查詢參數
*   **不允許的變更:**
    *   刪除或重命名現有欄位
    *   修改現有欄位的資料類型
    *   修改現有端點的行為
*   **API 版本棄用策略:**
    *   提前 6 個月通知棄用計劃
    *   通過郵件、文檔和 API 回應標頭通知
    *   提供遷移指南和工具
    *   棄用的 API 返回 `Sunset` 標頭指示停用日期

---

## 10. 附錄 (Appendices)

### 10.1 請求/回應範例 (Request/Response Examples)

#### 商品搜尋範例
**請求:**
```bash
curl -X GET "https://api.ecommerce.com/v1/products?search=iPhone&category_id=1&price_min=30000&sort_by=-price&page=1&page_size=10" \
  -H "Accept: application/json"
```

**回應:**
```json
{
  "data": [
    {
      "id": 1001,
      "name": "iPhone 15 Pro Max",
      "price": 42900.00,
      "categoryId": 1,
      "status": "active"
    }
  ],
  "meta": {
    "pagination": {
      "totalItems": 5,
      "totalPages": 1,
      "currentPage": 1,
      "pageSize": 10,
      "hasNext": false,
      "hasPrevious": false
    }
  }
}
```

#### 語意搜尋範例
**請求:**
```bash
curl -X POST "https://api.ecommerce.com/v1/search/semantic" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "我想要一台拍照很好的手機",
    "filters": {
      "priceRange": {
        "min": 20000,
        "max": 50000
      }
    },
    "limit": 5
  }'
```

**回應:**
```json
{
  "data": {
    "results": [
      {
        "productId": 1001,
        "name": "iPhone 15 Pro",
        "price": 35900.00,
        "relevanceScore": 0.95,
        "explanation": "符合拍照需求，具備專業攝影功能",
        "matchedFeatures": ["相機", "拍照", "攝影"]
      }
    ],
    "totalCount": 3,
    "searchTime": 150,
    "modelVersion": "v1.2.0"
  }
}
```

#### 創建訂單範例
**請求:**
```bash
curl -X POST "https://api.ecommerce.com/v1/orders" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "productId": 1001,
        "quantity": 1,
        "unitPrice": 35900.00
      }
    ],
    "shippingAddress": {
      "street": "台北市信義區信義路五段7號",
      "city": "台北市",
      "postalCode": "110",
      "country": "台灣",
      "recipientName": "王小明",
      "recipientPhone": "0912345678"
    }
  }'
```

**成功回應:**
```json
{
  "data": {
    "id": 2001,
    "customerId": 1001,
    "status": "pending",
    "totalAmount": 35900.00,
    "items": [
      {
        "id": 3001,
        "productId": 1001,
        "productName": "iPhone 15 Pro",
        "quantity": 1,
        "unitPrice": 35900.00,
        "totalPrice": 35900.00
      }
    ],
    "shippingAddress": {
      "street": "台北市信義區信義路五段7號",
      "city": "台北市",
      "postalCode": "110",
      "country": "台灣",
      "recipientName": "王小明",
      "recipientPhone": "0912345678"
    },
    "createdAt": "2025-01-03T10:30:00.000Z",
    "updatedAt": "2025-01-03T10:30:00.000Z"
  }
}
```

---
**文件審核記錄 (Review History):**

| 日期 | 審核人 | 版本 | 變更摘要/主要反饋 |
| :--------- | :--------- | :--- | :---------------------------------- |
| 2025-01-03 | API 設計師 | v1.0 | 初稿提交，涵蓋核心 API 設計 |
| 2025-01-03 | API 設計師 | v1.1 | 更新為 Node.js 技術棧，新增 AI 服務 API 設計 |