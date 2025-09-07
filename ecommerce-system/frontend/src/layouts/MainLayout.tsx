import React, { useState } from 'react';
import { Layout, Menu, Button, Avatar, Dropdown, Space, Typography } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  ShoppingOutlined,
  FileTextOutlined,
  UserOutlined,
  BarChartOutlined,
  SettingOutlined,
  LogoutOutlined,
  BellOutlined,
  DollarOutlined,
  TruckOutlined,
  InboxOutlined,
  SafetyOutlined,
  ThunderboltOutlined,
  BugOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './MainLayout.less';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  // 選單項目
  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '儀表板',
    },
    {
      key: '/products',
      icon: <ShoppingOutlined />,
      label: '商品管理',
    },
    {
      key: '/orders',
      icon: <FileTextOutlined />,
      label: '訂單管理',
    },
    {
      key: '/users',
      icon: <UserOutlined />,
      label: '用戶管理',
    },
    {
      key: '/analytics',
      icon: <BarChartOutlined />,
      label: '數據分析',
    },
    {
      key: '/payments',
      icon: <DollarOutlined />,
      label: '支付管理',
    },
    {
      key: '/logistics',
      icon: <TruckOutlined />,
      label: '物流管理',
    },
    {
      key: '/inventory',
      icon: <InboxOutlined />,
      label: '庫存管理',
    },
    {
      key: '/permissions',
      icon: <SafetyOutlined />,
      label: '權限管理',
    },
    {
      key: '/ai-search',
      icon: <ThunderboltOutlined />,
      label: 'AI智能搜尋',
    },
    {
      key: '/logs',
      icon: <BugOutlined />,
      label: '日誌管理',
    },
    {
      key: '/notifications',
      icon: <BellOutlined />,
      label: '通知管理',
    },
    {
      key: '/utility',
      icon: <ToolOutlined />,
      label: '工具管理',
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: '系統設定',
    },
  ];

  // 用戶下拉選單
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '個人資料',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '設定',
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '登出',
      danger: true,
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  const handleUserMenuClick = ({ key }: { key: string }) => {
    if (key === 'logout') {
      logout();
      navigate('/login');
    } else {
      console.log('用戶選單點擊:', key);
    }
  };

  return (
    <Layout className="main-layout">
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        className="main-sider"
        width={240}
        collapsedWidth={80}
      >
        <div className="logo">
          <ShoppingOutlined className="logo-icon" />
          {!collapsed && <span className="logo-text">電商管理系統</span>}
        </div>
        
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          className="main-menu"
        />
      </Sider>
      
      <Layout className="main-content">
        <Header className="main-header">
          <div className="header-left">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              className="collapse-btn"
            />
          </div>
          
          <div className="header-right">
            <Space size="middle">
              <Button
                type="text"
                icon={<BellOutlined />}
                className="notification-btn"
              />
              
              <Dropdown
                menu={{
                  items: userMenuItems,
                  onClick: handleUserMenuClick,
                }}
                placement="bottomRight"
                arrow
              >
                <div className="user-info">
                  <Avatar 
                    size="small" 
                    icon={<UserOutlined />}
                    className="user-avatar"
                  />
                  <div className="user-details">
                    <Text strong>{user?.username || '管理員'}</Text>
                    <Text type="secondary" className="user-role">{user?.role || '系統管理員'}</Text>
                  </div>
                </div>
              </Dropdown>
            </Space>
          </div>
        </Header>
        
        <Content className="main-content-body">
          <div className="content-wrapper">
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
