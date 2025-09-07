# 🎨 設計系統 (Design System)

## 📋 概述

本設計系統定義電商系統管理後台的視覺設計規範，確保產品的一致性和可維護性。

## 🎨 視覺設計原則

### 1. 簡潔性 (Simplicity)
- 清晰的視覺層次
- 減少不必要的裝飾
- 專注於功能性

### 2. 一致性 (Consistency)
- 統一的設計語言
- 一致的交互模式
- 標準化的組件

### 3. 可訪問性 (Accessibility)
- 符合 WCAG 2.1 標準
- 支持鍵盤導航
- 適當的顏色對比度

### 4. 響應式 (Responsive)
- 適配多種設備
- 流暢的布局變化
- 觸控友好的交互

## 🌈 色彩系統

### 主色調 (Primary Colors)
```css
/* 品牌藍色 */
--primary-50: #e6f7ff;
--primary-100: #bae7ff;
--primary-200: #91d5ff;
--primary-300: #69c0ff;
--primary-400: #40a9ff;
--primary-500: #1890ff;  /* 主色 */
--primary-600: #096dd9;
--primary-700: #0050b3;
--primary-800: #003a8c;
--primary-900: #002766;
```

### 語義色彩 (Semantic Colors)
```css
/* 成功色 */
--success-50: #f6ffed;
--success-100: #d9f7be;
--success-500: #52c41a;  /* 成功 */
--success-700: #389e0d;

/* 警告色 */
--warning-50: #fffbe6;
--warning-100: #fff1b8;
--warning-500: #faad14;  /* 警告 */
--warning-700: #d48806;

/* 錯誤色 */
--error-50: #fff2f0;
--error-100: #ffccc7;
--error-500: #ff4d4f;    /* 錯誤 */
--error-700: #cf1322;

/* 信息色 */
--info-50: #e6f7ff;
--info-100: #bae7ff;
--info-500: #1890ff;     /* 信息 */
--info-700: #096dd9;
```

### 中性色 (Neutral Colors)
```css
/* 文字顏色 */
--text-primary: rgba(0, 0, 0, 0.85);      /* 主要文字 */
--text-secondary: rgba(0, 0, 0, 0.45);    /* 次要文字 */
--text-disabled: rgba(0, 0, 0, 0.25);      /* 禁用文字 */
--text-inverse: rgba(255, 255, 255, 0.85); /* 反色文字 */

/* 背景顏色 */
--bg-primary: #ffffff;    /* 主背景 */
--bg-secondary: #fafafa; /* 次背景 */
--bg-tertiary: #f0f0f0;  /* 第三背景 */
--bg-overlay: rgba(0, 0, 0, 0.45); /* 遮罩背景 */

/* 邊框顏色 */
--border-primary: #d9d9d9;   /* 主邊框 */
--border-secondary: #f0f0f0; /* 次邊框 */
--border-light: #f5f5f5;     /* 淺邊框 */
```

## 📝 字體系統

### 字體家族
```css
--font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 
               'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 
               'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 
               'Noto Color Emoji';
--font-family-code: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, 
                    Courier, monospace;
```

### 字體大小
```css
--font-size-xs: 12px;    /* 超小文字 */
--font-size-sm: 14px;    /* 小文字 */
--font-size-base: 16px;  /* 基礎文字 */
--font-size-lg: 18px;    /* 大文字 */
--font-size-xl: 20px;    /* 超大文字 */
--font-size-xxl: 24px;   /* 標題文字 */
--font-size-xxxl: 32px;  /* 大標題 */
```

### 字體權重
```css
--font-weight-light: 300;     /* 細體 */
--font-weight-normal: 400;    /* 正常 */
--font-weight-medium: 500;    /* 中等 */
--font-weight-semibold: 600;  /* 半粗 */
--font-weight-bold: 700;      /* 粗體 */
```

### 行高
```css
--line-height-tight: 1.25;   /* 緊湊行高 */
--line-height-normal: 1.5;    /* 正常行高 */
--line-height-relaxed: 1.75;  /* 寬鬆行高 */
```

## 📏 間距系統

### 基礎間距
```css
--spacing-0: 0px;
--spacing-1: 4px;
--spacing-2: 8px;
--spacing-3: 12px;
--spacing-4: 16px;
--spacing-5: 20px;
--spacing-6: 24px;
--spacing-8: 32px;
--spacing-10: 40px;
--spacing-12: 48px;
--spacing-16: 64px;
--spacing-20: 80px;
--spacing-24: 96px;
```

### 組件間距
```css
/* 頁面間距 */
--page-padding: 24px;
--section-padding: 16px;
--card-padding: 24px;

/* 表單間距 */
--form-item-margin: 16px;
--form-label-margin: 8px;
--input-padding: 8px 12px;

/* 按鈕間距 */
--button-padding-sm: 4px 8px;
--button-padding-md: 8px 16px;
--button-padding-lg: 12px 24px;
```

## 🎭 陰影系統

### 陰影層級
```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 
             0 2px 4px -1px rgba(0, 0, 0, 0.06);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 
             0 4px 6px -2px rgba(0, 0, 0, 0.05);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 
             0 10px 10px -5px rgba(0, 0, 0, 0.04);
--shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
```

## 🔲 圓角系統

```css
--radius-none: 0px;
--radius-sm: 2px;
--radius-md: 4px;
--radius-lg: 6px;
--radius-xl: 8px;
--radius-2xl: 12px;
--radius-full: 9999px;
```

## 🧩 組件設計

### 按鈕 (Button)

#### 主要按鈕
```css
.button-primary {
  background: var(--primary-500);
  color: white;
  border: 1px solid var(--primary-500);
  border-radius: var(--radius-md);
  padding: var(--button-padding-md);
  font-weight: var(--font-weight-medium);
  transition: all 0.2s ease;
}

.button-primary:hover {
  background: var(--primary-600);
  border-color: var(--primary-600);
  box-shadow: var(--shadow-md);
}
```

#### 次要按鈕
```css
.button-secondary {
  background: white;
  color: var(--text-primary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  padding: var(--button-padding-md);
  font-weight: var(--font-weight-normal);
  transition: all 0.2s ease;
}

.button-secondary:hover {
  border-color: var(--primary-500);
  color: var(--primary-500);
}
```

### 卡片 (Card)
```css
.card {
  background: var(--bg-primary);
  border: 1px solid var(--border-secondary);
  border-radius: var(--radius-lg);
  padding: var(--card-padding);
  box-shadow: var(--shadow-sm);
  transition: box-shadow 0.2s ease;
}

.card:hover {
  box-shadow: var(--shadow-md);
}

.card-header {
  border-bottom: 1px solid var(--border-secondary);
  padding-bottom: var(--spacing-4);
  margin-bottom: var(--spacing-4);
}

.card-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0;
}
```

### 表單 (Form)
```css
.form-item {
  margin-bottom: var(--form-item-margin);
}

.form-label {
  display: block;
  margin-bottom: var(--form-label-margin);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.form-input {
  width: 100%;
  padding: var(--input-padding);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  transition: border-color 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: var(--primary-500);
  box-shadow: 0 0 0 2px var(--primary-100);
}

.form-error {
  color: var(--error-500);
  font-size: var(--font-size-sm);
  margin-top: var(--spacing-1);
}
```

### 表格 (Table)
```css
.table {
  width: 100%;
  border-collapse: collapse;
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.table-header {
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-secondary);
}

.table-header th {
  padding: var(--spacing-4);
  text-align: left;
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.table-body tr {
  border-bottom: 1px solid var(--border-light);
}

.table-body tr:hover {
  background: var(--bg-secondary);
}

.table-body td {
  padding: var(--spacing-4);
  color: var(--text-primary);
}
```

## 📱 響應式設計

### 斷點系統
```css
/* 手機 */
@media (max-width: 767px) {
  .container {
    padding: var(--spacing-4);
  }
  
  .card {
    padding: var(--spacing-4);
  }
  
  .table-responsive {
    overflow-x: auto;
  }
}

/* 平板 */
@media (min-width: 768px) and (max-width: 1023px) {
  .container {
    padding: var(--spacing-6);
  }
  
  .card {
    padding: var(--spacing-6);
  }
}

/* 桌面 */
@media (min-width: 1024px) {
  .container {
    padding: var(--spacing-8);
  }
  
  .card {
    padding: var(--spacing-8);
  }
}

/* 大桌面 */
@media (min-width: 1440px) {
  .container {
    max-width: 1200px;
    margin: 0 auto;
  }
}
```

### 網格系統
```css
.grid {
  display: grid;
  gap: var(--spacing-4);
}

.grid-1 { grid-template-columns: repeat(1, 1fr); }
.grid-2 { grid-template-columns: repeat(2, 1fr); }
.grid-3 { grid-template-columns: repeat(3, 1fr); }
.grid-4 { grid-template-columns: repeat(4, 1fr); }

@media (max-width: 767px) {
  .grid-2, .grid-3, .grid-4 {
    grid-template-columns: repeat(1, 1fr);
  }
}

@media (min-width: 768px) and (max-width: 1023px) {
  .grid-3, .grid-4 {
    grid-template-columns: repeat(2, 1fr);
  }
}
```

## 🎯 交互設計

### 載入狀態
```css
.loading {
  opacity: 0.6;
  pointer-events: none;
}

.loading-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid var(--border-primary);
  border-top: 2px solid var(--primary-500);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

### 過渡動畫
```css
.transition-fast {
  transition: all 0.15s ease;
}

.transition-normal {
  transition: all 0.2s ease;
}

.transition-slow {
  transition: all 0.3s ease;
}

/* 淡入動畫 */
.fade-in {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 滑入動畫 */
.slide-in {
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
```

## 🎨 圖標系統

### 圖標大小
```css
.icon-xs { width: 12px; height: 12px; }
.icon-sm { width: 16px; height: 16px; }
.icon-md { width: 20px; height: 20px; }
.icon-lg { width: 24px; height: 24px; }
.icon-xl { width: 32px; height: 32px; }
```

### 圖標顏色
```css
.icon-primary { color: var(--primary-500); }
.icon-success { color: var(--success-500); }
.icon-warning { color: var(--warning-500); }
.icon-error { color: var(--error-500); }
.icon-muted { color: var(--text-secondary); }
```

## 📊 數據可視化

### 圖表顏色
```css
.chart-colors {
  --chart-color-1: #1890ff;
  --chart-color-2: #52c41a;
  --chart-color-3: #faad14;
  --chart-color-4: #ff4d4f;
  --chart-color-5: #722ed1;
  --chart-color-6: #13c2c2;
  --chart-color-7: #eb2f96;
  --chart-color-8: #fa8c16;
}
```

### 圖表樣式
```css
.chart-container {
  background: var(--bg-primary);
  border: 1px solid var(--border-secondary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-6);
  box-shadow: var(--shadow-sm);
}

.chart-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin-bottom: var(--spacing-4);
}

.chart-legend {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-3);
  margin-top: var(--spacing-4);
}

.chart-legend-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}
```

## 🔧 實作指南

### CSS 變量使用
```css
/* 在組件中使用設計系統變量 */
.my-component {
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  padding: var(--spacing-4);
  color: var(--text-primary);
  font-size: var(--font-size-base);
  box-shadow: var(--shadow-sm);
}
```

### 組件組合
```css
/* 組合多個設計系統元素 */
.stat-card {
  /* 卡片基礎樣式 */
  background: var(--bg-primary);
  border: 1px solid var(--border-secondary);
  border-radius: var(--radius-lg);
  padding: var(--card-padding);
  box-shadow: var(--shadow-sm);
  
  /* 內容布局 */
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.stat-card-header {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  font-weight: var(--font-weight-medium);
}

.stat-card-value {
  font-size: var(--font-size-xxl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
}

.stat-card-trend {
  font-size: var(--font-size-sm);
  color: var(--success-500);
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
}
```

## 📋 檢查清單

### 設計一致性
- [ ] 使用統一的色彩系統
- [ ] 遵循字體規範
- [ ] 保持一致的間距
- [ ] 使用標準的圓角值
- [ ] 應用適當的陰影

### 可訪問性
- [ ] 顏色對比度符合 WCAG 標準
- [ ] 支持鍵盤導航
- [ ] 提供適當的焦點指示
- [ ] 使用語義化的 HTML 結構
- [ ] 提供替代文本

### 響應式設計
- [ ] 適配不同屏幕尺寸
- [ ] 觸控友好的交互元素
- [ ] 合理的內容布局
- [ ] 優化的載入性能
- [ ] 流暢的動畫效果
