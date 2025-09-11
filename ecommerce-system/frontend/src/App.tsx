import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider, theme as antdTheme, App as AntdApp } from 'antd';
import zhTW from 'antd/locale/zh_TW';

// 導入全新的主題系統
import { useTheme } from './hooks/useTheme';

import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';
import AdminPage from './pages/admin';

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
import RecommendationPage from './pages/recommendation/RecommendationPage';
import LogManagement from './pages/logs/LogManagement';
import UtilityManagement from './pages/utility/UtilityManagement';
import NotificationsPage from './pages/notifications/NotificationsPage';

// 將全局樣式移動到底部，確保最高優先級
import './styles/global.less';

const queryClient = new QueryClient();

const AppContent: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <ConfigProvider
      locale={zhTW}
      theme={{
        algorithm: theme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 6,
        },
      }}
    >
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/admin" replace />} />
              <Route path="admin" element={<AdminPage />} />
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
              <Route path="recommendations" element={<RecommendationPage />} />
              <Route path="logs" element={<LogManagement />} />
              <Route path="utility" element={<UtilityManagement />} />
              <Route path="notifications" element={<NotificationsPage />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </ConfigProvider>
  );
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AntdApp>
        <AppContent />
      </AntdApp>
    </QueryClientProvider>
  );
};

export default App;
