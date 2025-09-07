import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider, theme as antdTheme } from 'antd';
import zhTW from 'antd/locale/zh_TW';

// 導入全新的主題系統
import { useTheme } from './hooks/useTheme';
import { ThemeToggleButton } from './components/ThemeToggleButton';

import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';

// 導入頁面組件
import Products from './pages/products/Products';
import Orders from './pages/orders/Orders';
import Users from './pages/users/Users';
import Analytics from './pages/analytics/Analytics';
import Settings from './pages/settings/Settings';
import Payments from './pages/payments/Payments';
import Logistics from './pages/logistics/Logistics';
import Inventory from './pages/inventory/Inventory';
import Permissions from './pages/permissions/Permissions';
import AISearch from './pages/search/AISearch';
import LogManagement from './pages/logs/LogManagement';
import NotificationManagement from './pages/notifications/NotificationManagement';
import UtilityManagement from './pages/utility/UtilityManagement';

// 將全局樣式移動到底部，確保最高優先級
import './styles/global.less';

const queryClient = new QueryClient();

const App: React.FC = () => {
  // 使用我們重構後的 useTheme Hook
  const { theme, toggleTheme } = useTheme();

  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider
        locale={zhTW}
        theme={{
          // 根據我們的 theme 狀態，動態切換 antd 的主題演算法
          algorithm: theme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
          token: {
            // antd 的 token 變數會自動適應演算法的變化
            // 我們也可以在這裡覆寫特定 token
            colorPrimary: '#1890ff', // 這裡的色碼會被 antd 演算法處理
            borderRadius: 6,
          },
        }}
      >
        <AuthProvider>
          {/* 主題切換按鈕，現在由可靠的控制器驅動 */}
          <ThemeToggleButton theme={theme} onClick={toggleTheme} />
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="products" element={<Products />} />
                <Route path="orders" element={<Orders />} />
                <Route path="users" element={<Users />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="settings" element={<Settings />} />
                <Route path="payments" element={<Payments />} />
                <Route path="logistics" element={<Logistics />} />
                <Route path="inventory" element={<Inventory />} />
        <Route path="permissions" element={<Permissions />} />
        <Route path="ai-search" element={<AISearch />} />
        <Route path="logs" element={<LogManagement />} />
        <Route path="notifications" element={<NotificationManagement />} />
        <Route path="utility" element={<UtilityManagement />} />
              </Route>
            </Routes>
          </Router>
        </AuthProvider>
      </ConfigProvider>
    </QueryClientProvider>
  );
};

export default App;
