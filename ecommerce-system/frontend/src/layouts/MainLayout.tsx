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
  HeartOutlined,
  BugOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../hooks/useTheme';
import { HeaderThemeToggle } from '../components/HeaderThemeToggle';
import './MainLayout.less';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // 選單項目 - 按照前端架構規劃重新組織
  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '儀表板',
    },
    {
      key: 'product-management',
      icon: <ShoppingOutlined />,
      label: '商品管理',
      children: [
        {
          key: '/products',
          label: '商品列表',
        },
        {
          key: '/inventory',
          label: '庫存管理',
        },
      ],
    },
    {
      key: 'order-management',
      icon: <FileTextOutlined />,
      label: '訂單管理',
      children: [
        {
          key: '/orders',
          label: '訂單清單',
        },
        {
          key: '/logistics',
          label: '物流管理',
        },
        {
          key: '/payments',
          label: '支付管理',
        },
      ],
    },
    {
      key: 'user-management',
      icon: <UserOutlined />,
      label: '用戶管理',
      children: [
        {
          key: '/users',
          label: '使用者列表',
        },
        {
          key: '/permissions',
          label: '權限設定',
        },
      ],
    },
    {
      key: 'marketing-management',
      icon: <HeartOutlined />,
      label: '行銷管理',
      children: [
        {
          key: '/recommendations',
          label: '推薦商品配置',
        },
      ],
    },
    {
      key: 'ai-system',
      icon: <ThunderboltOutlined />,
      label: 'AI 系統',
      children: [
        {
          key: '/ai-search',
          label: 'AI 智能搜尋',
        },
        {
          key: '/analytics',
          label: 'AI 分析報告',
        },
      ],
    },
    {
      key: 'system-management',
      icon: <SettingOutlined />,
      label: '系統管理',
      children: [
        {
          key: '/logs',
          label: '日誌管理',
        },
        {
          key: '/notifications',
          label: '通知管理',
        },
        {
          key: '/utility',
          label: '工具管理',
        },
        {
          key: '/settings',
          label: '系統設定',
        },
      ],
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
          defaultOpenKeys={['product-management', 'order-management', 'user-management']}
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
              
              <HeaderThemeToggle theme={theme} onClick={toggleTheme} />
              
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
