# AI Search Service 端口配置修復報告

---

**文件版本 (Document Version):** v1.0  
**修復日期 (Fix Date):** 2025-09-07  
**執行時間 (Execution Time):** 約 30 分鐘  
**狀態 (Status):** ✅ **完全成功**

---

## 📋 問題摘要 (Issue Summary)

前端 AI 智能搜尋功能出現 JSON 解析錯誤，錯誤訊息顯示 "Unexpected token '<', "<!DOCTYPE "... is not valid JSON"，導致服務統計無法載入，搜尋功能無法正常使用。

## 🔍 問題分析 (Root Cause Analysis)

### 錯誤現象
```
aiSearchService.ts:157 獲取服務統計錯誤: SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
getServiceStats @ aiSearchService.ts:157
loadServiceStats @ AISearch.tsx:67
```

### 根本原因
1. **端口配置不匹配**: AI Search Service 實際運行在端口 3014，但前端配置期望端口 3015
2. **錯誤的響應類型**: 前端調用 `http://localhost:3015/api/v1/stats` 時，實際訪問的是前端開發服務器
3. **HTML 響應**: 前端開發服務器返回 HTML 頁面（以 `<!DOCTYPE` 開頭），而不是預期的 JSON 數據

### 技術細節
- **AI Search Service 實際端口**: 3014
- **前端配置端口**: 3015 (錯誤)
- **前端開發服務器端口**: 5173 (Vite)
- **錯誤的 API 調用**: `http://localhost:3015/api/v1/stats` → 返回 HTML
- **正確的 API 調用**: `http://localhost:3014/api/v1/stats` → 返回 JSON

## 🔧 解決方案 (Solution Implementation)

### 1. 前端配置修復 ✅

#### 修改文件: `frontend/src/services/aiSearchService.ts`
```typescript
// 修復前
private baseUrl = 'http://localhost:3015/api/v1';

// 修復後  
private baseUrl = 'http://localhost:3014/api/v1';
```

#### 驗證配置: `frontend/src/services/api.ts`
```typescript
const SERVICE_PORTS = {
  // ... 其他服務
  AI_SEARCH: 3014,      // ✅ 已正確配置
  // ... 其他服務
} as const;
```

### 2. 服務狀態驗證 ✅

#### AI Search Service 健康檢查
```bash
curl http://localhost:3014/api/v1/health
# 響應: {"success":true,"message":"AI Search Service is healthy",...}
```

#### 服務統計 API 測試
```bash
curl http://localhost:3014/api/v1/stats
# 響應: {"success":true,"data":{"milvus":{...},"ai_model":{...},...}}
```

#### 搜尋功能測試
```bash
curl -X POST http://localhost:3014/api/v1/search \
  -H "Content-Type: application/json" \
  -d '{"query": "手機", "limit": 5, "threshold": 0.7}'
# 響應: {"success":true,"data":[...],"query":"手機",...}
```

## 📊 測試結果 (Test Results)

### API 端點測試 ✅

| 端點 | 方法 | 狀態 | 響應 |
|------|------|------|------|
| `/api/v1/health` | GET | ✅ 正常 | JSON 健康狀態 |
| `/api/v1/stats` | GET | ✅ 正常 | JSON 服務統計 |
| `/api/v1/search` | POST | ✅ 正常 | JSON 搜尋結果 |
| `/api/v1/suggestions` | GET | ✅ 正常 | JSON 搜尋建議 |

### 前端功能測試 ✅

| 功能 | 狀態 | 說明 |
|------|------|------|
| 服務統計載入 | ✅ 正常 | 成功獲取並顯示統計數據 |
| 搜尋功能 | ✅ 正常 | 語意搜尋正常工作 |
| 搜尋建議 | ✅ 正常 | 建議功能正常（無歷史數據時為空） |
| 錯誤處理 | ✅ 正常 | 錯誤訊息正確顯示 |

## 🚀 解決的關鍵問題

### 1. 端口配置錯誤 ✅
- **問題**: 前端配置的端口與實際服務端口不匹配
- **解決**: 更新 `aiSearchService.ts` 中的 `baseUrl` 配置
- **結果**: API 調用現在指向正確的服務端點

### 2. JSON 解析錯誤 ✅
- **問題**: 前端嘗試解析 HTML 響應為 JSON
- **解決**: 修正 API 端點，確保返回正確的 JSON 數據
- **結果**: 所有 API 調用現在返回正確的 JSON 響應

### 3. 服務統計無法載入 ✅
- **問題**: `getServiceStats()` 方法因端口錯誤而失敗
- **解決**: 修正端口配置，確保能正確調用統計 API
- **結果**: 服務統計現在正常載入和顯示

## 📈 功能驗證

### AI Search Service 功能 ✅
- **語意搜尋**: 支援中文查詢，返回相關商品
- **相似度評分**: 正確計算並顯示商品相似度分數
- **搜尋建議**: 支援基於查詢歷史的建議功能
- **服務統計**: 顯示搜尋次數、索引商品數等統計信息

### 前端整合 ✅
- **React 組件**: AISearch.tsx 正常渲染
- **API 服務**: aiSearchService.ts 正常調用後端
- **錯誤處理**: 適當的錯誤訊息和載入狀態
- **用戶體驗**: 搜尋界面友好，響應及時

## 🔄 相關文件更新

### 已更新的文件
1. ✅ `frontend/src/services/aiSearchService.ts` - 修正 baseUrl 端口
2. ✅ `docs/12_ai_search_service_fix_report.md` - 新增修復報告

### 驗證的文件
1. ✅ `frontend/src/services/api.ts` - 確認端口配置正確
2. ✅ `backend/services/ai-search-service/src/app.py` - 確認服務配置
3. ✅ `backend/services/ai-search-service/src/routers/search_router.py` - 確認 API 路由

## 📚 經驗總結

### 成功因素
1. **快速診斷** - 通過錯誤訊息快速定位問題
2. **系統性檢查** - 檢查服務狀態、端口配置、API 響應
3. **完整測試** - 驗證所有相關功能正常工作
4. **文檔記錄** - 詳細記錄問題和解決過程

### 技術要點
1. **端口管理** - 確保前端配置與後端服務端口一致
2. **API 調試** - 使用 curl 直接測試 API 端點
3. **錯誤分析** - 通過錯誤訊息快速定位根本原因
4. **配置驗證** - 檢查所有相關配置文件的一致性

### 預防措施
1. **端口文檔化** - 維護清晰的服務端口對照表
2. **健康檢查** - 定期檢查所有服務的健康狀態
3. **配置驗證** - 部署前驗證所有配置的一致性
4. **自動化測試** - 建立自動化的 API 測試流程

## 🎉 結論

AI Search Service 端口配置問題已完全解決！前端現在可以正常調用 AI 搜尋服務，所有功能包括服務統計、語意搜尋、搜尋建議都正常工作。

**關鍵成就:**
- ✅ 100% 解決端口配置問題
- ✅ 0 個功能故障
- ✅ 所有 API 端點正常
- ✅ 前端功能完全恢復

**下一步:** 繼續監控 AI Search Service 的運行狀態，確保服務穩定性和性能。

---

**報告生成時間:** 2025-09-07  
**報告版本:** v1.0  
**狀態:** ✅ 完成
