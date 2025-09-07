# 🔐 權限系統設計文檔 (Permission System Design)

---

**文件版本**: v1.0  
**最後更新**: 2025-09-06  
**設計師**: AI Assistant  
**狀態**: 設計中  

---

## 📋 目錄

1. [設計概述](#1-設計概述)
2. [角色定義](#2-角色定義)
3. [權限點設計](#3-權限點設計)
4. [權限映射](#4-權限映射)
5. [API 設計](#5-api-設計)
6. [實現計劃](#6-實現計劃)

---

## 1. 設計概述

### 1.1 設計目標
基於使用者故事和業務需求，建立細粒度的權限控制系統，確保不同角色只能訪問其職責範圍內的功能。

### 1.2 設計原則
- **最小權限原則**: 用戶只獲得完成工作所需的最小權限
- **角色分離**: 不同角色職責明確分離
- **動態權限**: 支持運行時權限檢查和更新
- **可擴展性**: 易於添加新角色和權限點

---

## 2. 角色定義

### 2.1 核心角色

| 角色 | 代碼 | 描述 | 主要職責 |
|------|------|------|----------|
| **系統管理員** | `ADMIN` | 系統最高權限 | 系統配置、用戶管理、安全控制 |
| **商家管理員** | `MERCHANT` | 商家後台管理 | 商品管理、訂單處理、營運分析 |
| **商家員工** | `STAFF` | 商家一般員工 | 商品查看、訂單處理、基礎操作 |
| **終端客戶** | `CUSTOMER` | 購物用戶 | 商品瀏覽、下單購買、個人管理 |
| **訪客** | `GUEST` | 未登入用戶 | 商品瀏覽、搜尋 |

### 2.2 角色層級關係

```
ADMIN (系統管理員)
├── 擁有所有權限
└── 可以管理其他角色

MERCHANT (商家管理員)
├── 管理自己的商品和訂單
├── 查看營運分析
└── 管理 STAFF 角色

STAFF (商家員工)
├── 查看和處理訂單
├── 管理商品庫存
└── 基礎營運操作

CUSTOMER (客戶)
├── 瀏覽商品
├── 下單購買
└── 管理個人資料

GUEST (訪客)
└── 僅能瀏覽公開商品
```

---

## 3. 權限點設計

### 3.1 權限命名規範

格式: `{模組}:{操作}`

- **模組**: 功能模組 (users, products, orders, analytics, system)
- **操作**: 具體操作 (read, write, delete, manage, analyze)

### 3.2 完整權限列表

#### 3.2.1 用戶管理權限
```javascript
const USER_PERMISSIONS = {
  'users:read': '查看用戶列表',
  'users:write': '編輯用戶資料',
  'users:delete': '刪除用戶',
  'users:manage': '管理用戶角色',
  'users:analyze': '分析用戶行為'
};
```

#### 3.2.2 商品管理權限
```javascript
const PRODUCT_PERMISSIONS = {
  'products:read': '查看商品',
  'products:write': '編輯商品',
  'products:delete': '刪除商品',
  'products:manage': '管理商品分類',
  'products:publish': '發布/下架商品',
  'products:analyze': '商品分析'
};
```

#### 3.2.3 訂單管理權限
```javascript
const ORDER_PERMISSIONS = {
  'orders:read': '查看訂單',
  'orders:write': '編輯訂單',
  'orders:delete': '刪除訂單',
  'orders:process': '處理訂單',
  'orders:refund': '處理退款',
  'orders:analyze': '訂單分析'
};
```

#### 3.2.4 營運分析權限
```javascript
const ANALYTICS_PERMISSIONS = {
  'analytics:read': '查看分析報告',
  'analytics:dashboard': '查看儀表板',
  'analytics:export': '導出分析數據',
  'analytics:reports': '生成報告',
  'analytics:forecast': '查看預測分析'
};
```

#### 3.2.5 系統管理權限
```javascript
const SYSTEM_PERMISSIONS = {
  'system:settings': '系統設定',
  'system:logs': '查看系統日誌',
  'system:backup': '備份管理',
  'system:monitor': '系統監控',
  'system:alerts': '告警管理',
  'system:maintenance': '系統維護'
};
```

#### 3.2.6 支付物流權限
```javascript
const PAYMENT_LOGISTICS_PERMISSIONS = {
  'payments:read': '查看支付記錄',
  'payments:process': '處理支付',
  'payments:refund': '處理退款',
  'logistics:read': '查看物流信息',
  'logistics:manage': '管理物流',
  'inventory:read': '查看庫存',
  'inventory:manage': '管理庫存'
};
```

---

## 4. 權限映射

### 4.1 角色權限分配

```javascript
const ROLE_PERMISSIONS = {
  'ADMIN': [
    // 所有權限
    '*'
  ],
  
  'MERCHANT': [
    // 商品管理
    'products:read', 'products:write', 'products:delete', 'products:manage', 'products:publish', 'products:analyze',
    
    // 訂單管理
    'orders:read', 'orders:write', 'orders:process', 'orders:refund', 'orders:analyze',
    
    // 營運分析
    'analytics:read', 'analytics:dashboard', 'analytics:export', 'analytics:reports',
    
    // 支付物流
    'payments:read', 'payments:process', 'payments:refund',
    'logistics:read', 'logistics:manage',
    'inventory:read', 'inventory:manage',
    
    // 員工管理
    'users:read', 'users:write'
  ],
  
  'STAFF': [
    // 商品查看
    'products:read', 'products:write',
    
    // 訂單處理
    'orders:read', 'orders:write', 'orders:process',
    
    // 基礎分析
    'analytics:read', 'analytics:dashboard',
    
    // 支付物流
    'payments:read', 'payments:process',
    'logistics:read',
    'inventory:read', 'inventory:manage'
  ],
  
  'CUSTOMER': [
    // 商品瀏覽
    'products:read',
    
    // 訂單操作
    'orders:read', 'orders:write',
    
    // 個人資料
    'users:read', 'users:write'
  ],
  
  'GUEST': [
    // 僅商品瀏覽
    'products:read'
  ]
};
```

### 4.2 權限檢查邏輯

```javascript
// 權限檢查函數
function hasPermission(userRole, requiredPermission) {
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  
  // 檢查是否有萬用權限
  if (rolePermissions.includes('*')) {
    return true;
  }
  
  // 檢查具體權限
  return rolePermissions.includes(requiredPermission);
}

// 權限檢查中間件
function requirePermission(permission) {
  return (req, res, next) => {
    const userRole = req.user?.role;
    
    if (!hasPermission(userRole, permission)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: '權限不足',
          required: permission,
          current: userRole
        }
      });
    }
    
    next();
  };
}
```

---

## 5. API 設計

### 5.1 Permission Service API

#### 5.1.1 權限檢查
```http
POST /api/v1/permissions/check
Authorization: Bearer {token}
Content-Type: application/json

{
  "permission": "products:write",
  "resource": "product_123"
}
```

#### 5.1.2 獲取用戶權限
```http
GET /api/v1/permissions/user/{userId}
Authorization: Bearer {token}
```

#### 5.1.3 獲取角色權限
```http
GET /api/v1/permissions/role/{role}
Authorization: Bearer {token}
```

#### 5.1.4 更新角色權限
```http
PUT /api/v1/permissions/role/{role}
Authorization: Bearer {token}
Content-Type: application/json

{
  "permissions": ["products:read", "products:write"]
}
```

### 5.2 權限管理界面 API

#### 5.2.1 權限列表
```http
GET /api/v1/permissions/list
Authorization: Bearer {token}
```

#### 5.2.2 角色管理
```http
GET /api/v1/permissions/roles
POST /api/v1/permissions/roles
PUT /api/v1/permissions/roles/{roleId}
DELETE /api/v1/permissions/roles/{roleId}
```

---

## 6. 實現計劃

### 6.1 第一階段：基礎權限服務 (2天)
- [ ] 創建 Permission Service 專案結構
- [ ] 實現權限檢查 API
- [ ] 實現角色權限映射
- [ ] 基礎測試

### 6.2 第二階段：整合現有服務 (2天)
- [ ] 更新 Auth Service 權限檢查
- [ ] 更新所有服務的權限中間件
- [ ] 實現細粒度權限控制
- [ ] 整合測試

### 6.3 第三階段：前端權限管理 (2天)
- [ ] 創建權限管理頁面
- [ ] 實現角色管理界面
- [ ] 實現動態菜單控制
- [ ] 用戶體驗優化

### 6.4 第四階段：高級功能 (1天)
- [ ] 實現資源級權限控制
- [ ] 實現權限繼承
- [ ] 實現權限審計日誌
- [ ] 性能優化

---

## 7. 技術實現

### 7.1 數據庫設計

```javascript
// 角色表
const RoleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  displayName: { type: String, required: true },
  description: String,
  permissions: [{ type: String }],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// 用戶角色關聯表
const UserRoleSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  roleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', required: true },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedAt: { type: Date, default: Date.now },
  expiresAt: Date
});
```

### 7.2 權限檢查服務

```javascript
class PermissionService {
  async checkPermission(userId, permission, resource = null) {
    const user = await this.getUserWithRoles(userId);
    const userPermissions = await this.getUserPermissions(user);
    
    return this.hasPermission(userPermissions, permission, resource);
  }
  
  async getUserPermissions(user) {
    const roles = await Role.find({ _id: { $in: user.roles } });
    const permissions = new Set();
    
    roles.forEach(role => {
      role.permissions.forEach(permission => {
        permissions.add(permission);
      });
    });
    
    return Array.from(permissions);
  }
  
  hasPermission(userPermissions, requiredPermission, resource) {
    // 檢查萬用權限
    if (userPermissions.includes('*')) {
      return true;
    }
    
    // 檢查具體權限
    return userPermissions.includes(requiredPermission);
  }
}
```

---

## 8. 安全考量

### 8.1 權限驗證
- 所有 API 端點都必須進行權限檢查
- 權限檢查在服務層和控制器層都要實現
- 前端權限控制僅為用戶體驗，後端驗證為安全核心

### 8.2 權限審計
- 記錄所有權限相關操作
- 實現權限變更日誌
- 定期審計權限分配

### 8.3 權限最小化
- 新用戶默認最小權限
- 定期清理無用權限
- 實現權限過期機制

---

**最後更新**: 2025-09-06  
**狀態**: 設計完成，準備實現  
**下一步**: 開始 Permission Service 開發
