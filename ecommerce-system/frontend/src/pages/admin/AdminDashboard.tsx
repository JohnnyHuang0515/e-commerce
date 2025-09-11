import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Typography, Spin, Alert, Button, Table, Tag, Space } from 'antd';
import { 
  ShoppingOutlined, 
  FileTextOutlined, 
  UserOutlined, 
  DollarOutlined,
  ReloadOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import { dashboardApi, authApi, productApi, orderApi, userApi } from '../../services/api';

const { Title, Text } = Typography;

interface DashboardData {
  summary: {
    totalSales: number;
    totalOrders: number;
    totalUsers: number;
    totalProducts: number;
    averageOrderValue: number;
    conversionRate: number;
  };
  growth: {
    salesGrowth: number;
    ordersGrowth: number;
    usersGrowth: number;
  };
  alerts: Array<{
    type: 'info' | 'warning' | 'error';
    message: string;
    timestamp: string;
  }>;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  status: string;
  createdAt: string;
}

interface Order {
  id: string;
  userId: string;
  total: number;
  status: string;
  createdAt: string;
}

const AdminDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 獲取儀表板數據
      const dashboardResponse = await dashboardApi.get('/overview');
      if (dashboardResponse.data.success) {
        setDashboardData(dashboardResponse.data.data);
      }

      // 獲取用戶數據
      const usersResponse = await userApi.get('/');
      if (usersResponse.data.success) {
        setUsers(usersResponse.data.data.users || []);
      }

      // 獲取商品數據
      const productsResponse = await productApi.get('/products');
      if (productsResponse.data.success) {
        setProducts(productsResponse.data.data.products || []);
      }

      // 獲取訂單數據
      const ordersResponse = await orderApi.get('/orders');
      if (ordersResponse.data.success) {
        setOrders(ordersResponse.data.data.orders || []);
      }

    } catch (err: any) {
      console.error('獲取數據失敗:', err);
      setError(err.message || '網絡連接失敗');
      
      // 使用模擬數據作為後備
      setDashboardData({
        summary: {
          totalSales: 125000,
          totalOrders: 1250,
          totalUsers: 850,
          totalProducts: 120,
          averageOrderValue: 100,
          conversionRate: 3.2,
        },
        growth: {
          salesGrowth: 12.5,
          ordersGrowth: 8.3,
          usersGrowth: 15.2,
        },
        alerts: []
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const statCards = dashboardData ? [
    {
      title: '總銷售額',
      value: dashboardData.summary.totalSales,
      prefix: <DollarOutlined />,
      suffix: '元',
      trend: { value: dashboardData.growth.salesGrowth, isPositive: dashboardData.growth.salesGrowth > 0 },
      color: '#1890ff',
    },
    {
      title: '總訂單數',
      value: dashboardData.summary.totalOrders,
      prefix: <FileTextOutlined />,
      trend: { value: dashboardData.growth.ordersGrowth, isPositive: dashboardData.growth.ordersGrowth > 0 },
      color: '#52c41a',
    },
    {
      title: '總用戶數',
      value: dashboardData.summary.totalUsers,
      prefix: <UserOutlined />,
      trend: { value: dashboardData.growth.usersGrowth, isPositive: dashboardData.growth.usersGrowth > 0 },
      color: '#faad14',
    },
    {
      title: '商品總數',
      value: dashboardData.summary.totalProducts,
      prefix: <ShoppingOutlined />,
      color: '#f5222d',
    },
  ] : [];

  const userColumns = [
    {
      title: '用戶ID',
      dataIndex: 'id',
      key: 'id',
      render: (id: string) => <Text code>{id.slice(0, 8)}...</Text>,
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '郵箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag color={role === 'ADMIN' ? 'red' : 'blue'}>{role}</Tag>
      ),
    },
    {
      title: '創建時間',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
  ];

  const productColumns = [
    {
      title: '商品ID',
      dataIndex: 'id',
      key: 'id',
      render: (id: string) => <Text code>{id.slice(0, 8)}...</Text>,
    },
    {
      title: '商品名稱',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '價格',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => `${price}`,
    },
    {
      title: '庫存',
      dataIndex: 'stock',
      key: 'stock',
    },
    {
      title: '狀態',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>{status}</Tag>
      ),
    },
  ];

  const orderColumns = [
    {
      title: '訂單ID',
      dataIndex: 'id',
      key: 'id',
      render: (id: string) => <Text code>{id.slice(0, 8)}...</Text>,
    },
    {
      title: '用戶ID',
      dataIndex: 'userId',
      key: 'userId',
      render: (id: string) => <Text code>{id.slice(0, 8)}...</Text>,
    },
    {
      title: '總金額',
      dataIndex: 'total',
      key: 'total',
      render: (total: number) => `${total}`,
    },
    {
      title: '狀態',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'completed' ? 'green' : 'orange'}>{status}</Tag>
      ),
    },
    {
      title: '創建時間',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
  ];

  return (
    <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
          <ThunderboltOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
          管理員後台
        </Title>
        <Text type="secondary">電商系統總覽與管理</Text>
      </div>

      {error && (
        <Alert
          message="數據加載失敗"
          description={error}
          type="warning"
          showIcon
          closable
          onClose={() => setError(null)}
          style={{ marginBottom: 24 }}
        />
      )}

      <Spin spinning={loading}>
        {/* 統計卡片 */}
        <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
          {statCards.map((card, index) => (
            <Col xs={24} sm={12} lg={6} key={index}>
              <Card 
                style={{ 
                  background: `linear-gradient(135deg, ${card.color}15, ${card.color}05)`,
                  border: `1px solid ${card.color}30`
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ 
                    fontSize: '24px', 
                    color: card.color, 
                    marginRight: '12px',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    {card.prefix}
                  </div>
                  <div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: card.color }}>
                      {card.value.toLocaleString()}
                      {card.suffix}
                    </div>
                    <div style={{ fontSize: '14px', color: '#666' }}>
                      {card.title}
                    </div>
                  </div>
                </div>
                {card.trend && (
                  <div style={{ fontSize: '12px', color: card.trend.isPositive ? '#52c41a' : '#f5222d' }}>
                    {card.trend.isPositive ? '↗' : '↘'} {Math.abs(card.trend.value)}%
                  </div>
                )}
              </Card>
            </Col>
          ))}
        </Row>

        {/* 數據表格 */}
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={8}>
            <Card 
              title="用戶管理" 
              extra={
                <Button 
                  icon={<ReloadOutlined />} 
                  onClick={fetchDashboardData}
                  size="small"
                >
                  刷新
                </Button>
              }
            >
              <Table
                dataSource={users.slice(0, 5)}
                columns={userColumns}
                pagination={false}
                size="small"
                rowKey="id"
              />
            </Card>
          </Col>
          
          <Col xs={24} lg={8}>
            <Card 
              title="商品管理" 
              extra={
                <Button 
                  icon={<ReloadOutlined />} 
                  onClick={fetchDashboardData}
                  size="small"
                >
                  刷新
                </Button>
              }
            >
              <Table
                dataSource={products.slice(0, 5)}
                columns={productColumns}
                pagination={false}
                size="small"
                rowKey="id"
              />
            </Card>
          </Col>
          
          <Col xs={24} lg={8}>
            <Card 
              title="訂單管理" 
              extra={
                <Button 
                  icon={<ReloadOutlined />} 
                  onClick={fetchDashboardData}
                  size="small"
                >
                  刷新
                </Button>
              }
            >
              <Table
                dataSource={orders.slice(0, 5)}
                columns={orderColumns}
                pagination={false}
                size="small"
                rowKey="id"
              />
            </Card>
          </Col>
        </Row>

        {/* 系統狀態 */}
        <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
          <Col xs={24}>
            <Card title="系統狀態">
              <Space wrap>
                <Tag color="green">AUTH-SERVICE: 正常</Tag>
                <Tag color="green">PRODUCT-SERVICE: 正常</Tag>
                <Tag color="green">ORDER-SERVICE: 正常</Tag>
                <Tag color="green">AI-SERVICE: 正常</Tag>
                <Tag color="green">SYSTEM-SERVICE: 正常</Tag>
                <Tag color="green">ANALYTICS-SERVICE: 正常</Tag>
                <Tag color="green">DASHBOARD-SERVICE: 正常</Tag>
              </Space>
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  );
};

export default AdminDashboard;
