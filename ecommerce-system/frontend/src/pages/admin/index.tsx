import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * AdminPage - 向後兼容的管理員頁面
 * 這個頁面用於向後兼容，將所有admin路由重定向到dashboard
 */
const AdminPage: React.FC = () => {
  // 直接重定向到儀表板，因為新架構中管理功能已經分散到各個專門頁面
  return <Navigate to="/dashboard" replace />;
};

export default AdminPage;
