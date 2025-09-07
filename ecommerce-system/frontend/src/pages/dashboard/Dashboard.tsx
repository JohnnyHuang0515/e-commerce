import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Typography, Spin, Alert, Button } from 'antd';
import { 
  ShoppingOutlined, 
  FileTextOutlined, 
  UserOutlined, 
  DollarOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import DashboardService, { OverviewData } from '../../services/dashboardService';
import './Dashboard.less';

const { Text } = Typography;


const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overviewData, setOverviewData] = useState<OverviewData | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await DashboardService.getOverview();
      
      if (response.success) {
        setOverviewData(response.data);
      } else {
        setError(response.message || '獲取數據失敗');
      }
    } catch (err: any) {
      console.error('獲取儀表板數據失敗:', err);
      setError(err.message || '網絡連接失敗');
      
      // 使用模擬數據作為後備
      setOverviewData({
        summary: {
          totalSales: 125000,
          totalOrders: 1250,
          totalUsers: 850,
          totalProducts: 120,
          averageOrderValue: 100,
          conversionRate: 3.2,
        },
        periodData: [],
        growth: {
          salesGrowth: 12.5,
          ordersGrowth: 8.3,
          usersGrowth: 15.2,
        },
        alerts: [],
        systemStatus: {
          services: []
        }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const statCards = overviewData ? [
    {
      title: '總銷售額',
      value: overviewData.summary.totalSales,
      prefix: <DollarOutlined />,
      suffix: '元',
      trend: { value: overviewData.growth.salesGrowth, isPositive: overviewData.growth.salesGrowth > 0 },
      className: 'primary',
    },
    {
      title: '總訂單數',
      value: overviewData.summary.totalOrders,
      prefix: <FileTextOutlined />,
      trend: { value: overviewData.growth.ordersGrowth, isPositive: overviewData.growth.ordersGrowth > 0 },
      className: 'success',
    },
    {
      title: '總用戶數',
      value: overviewData.summary.totalUsers,
      prefix: <UserOutlined />,
      trend: { value: overviewData.growth.usersGrowth, isPositive: overviewData.growth.usersGrowth > 0 },
      className: 'warning',
    },
    {
      title: '商品總數',
      value: overviewData.summary.totalProducts,
      prefix: <ShoppingOutlined />,
      className: 'error',
    },
  ] : [];

  return (
    <div className="dashboard-page">
      <PageHeader
        title="儀表板"
        subtitle="電商系統總覽與關鍵指標"
        extra={
          <Button 
            icon={<ReloadOutlined />} 
            onClick={fetchDashboardData}
            loading={loading}
          >
            刷新數據
          </Button>
        }
      />

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
        <div className="dashboard-content">
          {/* 統計卡片 */}
          <Row gutter={[24, 24]} className="stats-row">
            {statCards.map((card, index) => (
              <Col xs={24} sm={12} lg={6} key={index}>
                <StatCard
                  title={card.title}
                  value={card.value}
                  prefix={card.prefix}
                  suffix={card.suffix}
                  trend={card.trend}
                  loading={loading}
                  className={card.className}
                />
              </Col>
            ))}
          </Row>

          {/* 圖表區域 */}
          <Row gutter={[24, 24]} className="charts-row">
            <Col xs={24} lg={16}>
              <Card title="銷售趨勢" className="chart-card">
                <div className="chart-placeholder">
                  <Text type="secondary">圖表將在此處顯示</Text>
                </div>
              </Card>
            </Col>
            
            <Col xs={24} lg={8}>
              <Card title="訂單狀態" className="chart-card">
                <div className="chart-placeholder">
                  <Text type="secondary">圖表將在此處顯示</Text>
                </div>
              </Card>
            </Col>
          </Row>

          {/* 最近活動 */}
          <Row gutter={[24, 24]} className="activity-row">
            <Col xs={24} lg={12}>
              <Card title="最近訂單" className="activity-card">
                <div className="activity-placeholder">
                  <Text type="secondary">最近訂單列表將在此處顯示</Text>
                </div>
              </Card>
            </Col>
            
            <Col xs={24} lg={12}>
              <Card title="系統通知" className="activity-card">
                <div className="activity-placeholder">
                  <Text type="secondary">系統通知將在此處顯示</Text>
                </div>
              </Card>
            </Col>
          </Row>
        </div>
      </Spin>
    </div>
  );
};

export default Dashboard;
