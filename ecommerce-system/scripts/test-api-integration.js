#!/usr/bin/env node

/**
 * 前端後端 API 整合測試腳本
 * 驗證前端服務與後端 API 端點的對應關係
 */

const fs = require('fs');
const path = require('path');

// 顏色輸出
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

// 測試結果統計
const stats = {
  total: 0,
  passed: 0,
  failed: 0,
  warnings: 0
};

// 後端 API 端點定義
const backendEndpoints = {
  auth: [
    'POST /api/v1/auth/login',
    'POST /api/v1/auth/logout',
    'POST /api/v1/auth/register',
    'POST /api/v1/auth/refresh',
    'GET /api/v1/auth/verify',
    'GET /api/v1/auth/profile',
    'PUT /api/v1/auth/profile',
    'PUT /api/v1/auth/change-password'
  ],
  products: [
    'GET /api/v1/products',
    'GET /api/v1/products/:id',
    'POST /api/v1/products',
    'PUT /api/v1/products/:id',
    'DELETE /api/v1/products/:id',
    'GET /api/v1/products/categories',
    'POST /api/v1/products/categories',
    'GET /api/v1/products/brands',
    'POST /api/v1/products/brands'
  ],
  orders: [
    'GET /api/v1/orders',
    'GET /api/v1/orders/:id',
    'POST /api/v1/orders',
    'PUT /api/v1/orders/:id',
    'DELETE /api/v1/orders/:id',
    'PUT /api/v1/orders/:id/cancel',
    'PUT /api/v1/orders/:id/confirm',
    'PUT /api/v1/orders/:id/ship',
    'PUT /api/v1/orders/:id/complete',
    'PUT /api/v1/orders/:id/return',
    'GET /api/v1/orders/stats',
    'GET /api/v1/orders/overview',
    'GET /api/v1/orders/export',
    'PUT /api/v1/orders/batch-status'
  ],
  payments: [
    'GET /api/v1/payments',
    'GET /api/v1/payments/:id',
    'POST /api/v1/payments',
    'POST /api/v1/payments/:id/confirm',
    'POST /api/v1/payments/:id/cancel',
    'POST /api/v1/payments/:id/refund',
    'POST /api/v1/payments/webhook/:provider'
  ],
  logistics: [
    'GET /api/v1/logistics',
    'GET /api/v1/logistics/:id',
    'POST /api/v1/logistics',
    'PUT /api/v1/logistics/:id/status',
    'GET /api/v1/logistics/track/:trackingNumber',
    'GET /api/v1/logistics/statistics',
    'POST /api/v1/logistics/shipments',
    'PUT /api/v1/logistics/shipments/:id/status',
    'PUT /api/v1/logistics/shipments/:id/cancel',
    'POST /api/v1/logistics/calculate-cost'
  ],
  inventory: [
    'GET /api/v1/inventory',
    'GET /api/v1/inventory/:id',
    'POST /api/v1/inventory',
    'PUT /api/v1/inventory/:id',
    'POST /api/v1/inventory/bulk',
    'POST /api/v1/inventory/:id/reserve',
    'POST /api/v1/inventory/:id/release',
    'POST /api/v1/inventory/:id/ship',
    'GET /api/v1/inventory/:id/transactions',
    'GET /api/v1/inventory/stats',
    'GET /api/v1/inventory/alerts'
  ],
  analytics: [
    'GET /api/v1/analytics/sales',
    'GET /api/v1/analytics/sales/trend',
    'GET /api/v1/analytics/sales/comparison',
    'GET /api/v1/analytics/users',
    'GET /api/v1/analytics/users/behavior',
    'GET /api/v1/analytics/users/segmentation',
    'GET /api/v1/analytics/products',
    'GET /api/v1/analytics/products/performance',
    'GET /api/v1/analytics/categories',
    'GET /api/v1/analytics/revenue',
    'GET /api/v1/analytics/revenue/forecast',
    'GET /api/v1/analytics/profit',
    'GET /api/v1/analytics/dashboard',
    'GET /api/v1/analytics/kpi',
    'GET /api/v1/analytics/reports'
  ]
};

// 讀取前端服務文件
function readFrontendService(serviceName) {
  const servicePath = path.join(__dirname, '../frontend/src/services', `${serviceName}.ts`);
  
  if (!fs.existsSync(servicePath)) {
    return null;
  }
  
  return fs.readFileSync(servicePath, 'utf8');
}

// 提取前端 API 調用
function extractFrontendAPICalls(content) {
  const apiCalls = [];
  const regex = /\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g;
  
  let match;
  while ((match = regex.exec(content)) !== null) {
    const method = match[1].toUpperCase();
    const path = match[2];
    apiCalls.push({ method, path });
  }
  
  return apiCalls;
}

// 檢查 API 對應關係
function checkAPIMapping(frontendCalls, backendEndpoints, serviceName) {
  console.log(`\n${colors.blue}${colors.bold}檢查 ${serviceName} 服務:${colors.reset}`);
  
  const results = [];
  
  frontendCalls.forEach(call => {
    stats.total++;
    
    // 構建完整的 API 路徑
    const fullPath = `/api${call.path}`;
    
    // 檢查是否在後端端點中存在
    const exists = backendEndpoints.some(endpoint => {
      // 移除方法前綴進行比較
      const endpointPath = endpoint.split(' ')[1];
      
      // 處理動態參數 (:id, :trackingNumber 等)
      const normalizedEndpoint = endpointPath.replace(/:[^/]+/g, ':id');
      const normalizedCall = fullPath.replace(/\/[^/]+$/g, '/:id');
      
      return normalizedEndpoint === normalizedCall || endpointPath === fullPath;
    });
    
    if (exists) {
      console.log(`  ${colors.green}✅${colors.reset} ${call.method} ${fullPath}`);
      stats.passed++;
      results.push({ status: 'passed', call, fullPath });
    } else {
      console.log(`  ${colors.red}❌${colors.reset} ${call.method} ${fullPath} - 後端端點不存在`);
      stats.failed++;
      results.push({ status: 'failed', call, fullPath });
    }
  });
  
  return results;
}

// 主測試函數
function runIntegrationTest() {
  console.log(`${colors.bold}${colors.blue}🔗 前端後端 API 整合測試${colors.reset}\n`);
  
  const serviceMappings = {
    'authService': backendEndpoints.auth,
    'productService': backendEndpoints.products,
    'orderService': backendEndpoints.orders,
    'paymentService': backendEndpoints.payments,
    'logisticsService': backendEndpoints.logistics,
    'inventoryService': backendEndpoints.inventory,
    'analyticsService': backendEndpoints.analytics
  };
  
  const allResults = {};
  
  // 檢查每個服務
  Object.entries(serviceMappings).forEach(([serviceName, backendEndpoints]) => {
    const content = readFrontendService(serviceName);
    
    if (!content) {
      console.log(`${colors.yellow}⚠️  ${serviceName} 服務文件不存在${colors.reset}`);
      stats.warnings++;
      return;
    }
    
    const frontendCalls = extractFrontendAPICalls(content);
    const results = checkAPIMapping(frontendCalls, backendEndpoints, serviceName);
    allResults[serviceName] = results;
  });
  
  // 輸出測試結果
  console.log(`\n${colors.bold}📊 測試結果總結:${colors.reset}`);
  console.log(`  總測試數: ${stats.total}`);
  console.log(`  ${colors.green}✅ 通過: ${stats.passed}${colors.reset}`);
  console.log(`  ${colors.red}❌ 失敗: ${stats.failed}${colors.reset}`);
  console.log(`  ${colors.yellow}⚠️  警告: ${stats.warnings}${colors.reset}`);
  
  const successRate = stats.total > 0 ? ((stats.passed / stats.total) * 100).toFixed(1) : 0;
  console.log(`  成功率: ${successRate}%`);
  
  // 生成詳細報告
  generateDetailedReport(allResults);
  
  // 返回測試結果
  return {
    success: stats.failed === 0,
    stats,
    results: allResults
  };
}

// 生成詳細報告
function generateDetailedReport(results) {
  const reportPath = path.join(__dirname, '../docs/API_INTEGRATION_REPORT.md');
  
  let report = `# 🔗 API 整合測試報告\n\n`;
  report += `生成時間: ${new Date().toISOString()}\n\n`;
  report += `## 📊 測試統計\n\n`;
  report += `- 總測試數: ${stats.total}\n`;
  report += `- 通過: ${stats.passed}\n`;
  report += `- 失敗: ${stats.failed}\n`;
  report += `- 警告: ${stats.warnings}\n`;
  report += `- 成功率: ${stats.total > 0 ? ((stats.passed / stats.total) * 100).toFixed(1) : 0}%\n\n`;
  
  report += `## 🔍 詳細結果\n\n`;
  
  Object.entries(results).forEach(([serviceName, serviceResults]) => {
    report += `### ${serviceName}\n\n`;
    
    const passed = serviceResults.filter(r => r.status === 'passed');
    const failed = serviceResults.filter(r => r.status === 'failed');
    
    if (passed.length > 0) {
      report += `#### ✅ 通過的 API\n\n`;
      passed.forEach(result => {
        report += `- ${result.call.method} ${result.fullPath}\n`;
      });
      report += `\n`;
    }
    
    if (failed.length > 0) {
      report += `#### ❌ 失敗的 API\n\n`;
      failed.forEach(result => {
        report += `- ${result.call.method} ${result.fullPath}\n`;
      });
      report += `\n`;
    }
  });
  
  fs.writeFileSync(reportPath, report);
  console.log(`\n📄 詳細報告已生成: ${reportPath}`);
}

// 運行測試
if (require.main === module) {
  const result = runIntegrationTest();
  process.exit(result.success ? 0 : 1);
}

module.exports = { runIntegrationTest };
