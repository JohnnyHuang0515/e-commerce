import React, { useState } from 'react';
import { 
  Row, 
  Col, 
  Card, 
  Select, 
  DatePicker, 
  Space, 
  Typography,
  Spin,
  Alert,
  Button
} from 'antd';
import { 
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import { useDashboardAnalytics } from '../../hooks/useApi';
import './Analytics.less';

const { Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const Analytics: React.FC = () => {
  const [period, setPeriod] = useState('7d');
  const [dateRange, setDateRange] = useState<any>(null);

  // API hooks
  const { data: analyticsData, isLoading, error, refetch } = useDashboardAnalytics(period);

  const analytics = analyticsData?.data;

  // 處理函數
  const handlePeriodChange = (value: string) => {
    setPeriod(value);
  };

  const handleDateRangeChange = (dates: any) => {
    setDateRange(dates);
  };

  const handleRefresh = () => {
    refetch();
  };

  return (
    <div className="analytics-page">
      <PageHeader
        title="數據分析"
        subtitle="業務數據分析和趨勢洞察"
        extra={
          <Space>
            <Select
              value={period}
              onChange={handlePeriodChange}
              style={{ width: 120 }}
            >
              <Option value="1d">今天</Option>
              <Option value="7d">近7天</Option>
              <Option value="30d">近30天</Option>
              <Option value="90d">近90天</Option>
              <Option value="custom">自定義</Option>
            </Select>
            {period === 'custom' && (
              <RangePicker
                value={dateRange}
                onChange={handleDateRangeChange}
                placeholder={['開始日期', '結束日期']}
              />
            )}
            <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
              刷新
            </Button>
          </Space>
        }
      />

      {error && (
        <Alert
          message="數據加載失敗"
          description={error.message}
          type="warning"
          showIcon
          closable
          style={{ marginBottom: 24 }}
        />
      )}

      <Spin spinning={isLoading}>
        <div className="analytics-content">
          {/* 關鍵指標 */}
          <Row gutter={[24, 24]} className="metrics-row">
            <Col xs={24} sm={12} lg={6}>
              <StatCard
                title="銷售額"
                value={analytics?.sales?.total || 0}
                prefix="¥"
                trend={analytics?.sales?.trend ? { 
                  value: analytics.sales.trend, 
                  isPositive: analytics.sales.trend > 0 
                } : undefined}
                className="primary"
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <StatCard
                title="訂單數"
                value={analytics?.orders?.total || 0}
                trend={analytics?.orders?.trend ? { 
                  value: analytics.orders.trend, 
                  isPositive: analytics.orders.trend > 0 
                } : undefined}
                className="success"
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <StatCard
                title="用戶數"
                value={analytics?.users?.total || 0}
                trend={analytics?.users?.trend ? { 
                  value: analytics.users.trend, 
                  isPositive: analytics.users.trend > 0 
                } : undefined}
                className="warning"
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <StatCard
                title="商品數"
                value={analytics?.products?.total || 0}
                trend={analytics?.products?.trend ? { 
                  value: analytics.products.trend, 
                  isPositive: analytics.products.trend > 0 
                } : undefined}
                className="error"
              />
            </Col>
          </Row>

          {/* 圖表區域 */}
          <Row gutter={[24, 24]} className="charts-row">
            <Col xs={24} lg={16}>
              <Card 
                title={
                  <Space>
                    <LineChartOutlined />
                    <span>銷售趨勢</span>
                  </Space>
                }
                className="chart-card"
              >
                <div className="chart-placeholder">
                  <div className="chart-icon">
                    <LineChartOutlined style={{ fontSize: 48, color: '#1890ff' }} />
                  </div>
                  <Text type="secondary">銷售趨勢圖表將在此處顯示</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    數據來源：{analytics?.sales?.chartData?.length || 0} 個數據點
                  </Text>
                </div>
              </Card>
            </Col>
            
            <Col xs={24} lg={8}>
              <Card 
                title={
                  <Space>
                    <PieChartOutlined />
                    <span>訂單狀態</span>
                  </Space>
                }
                className="chart-card"
              >
                <div className="chart-placeholder">
                  <div className="chart-icon">
                    <PieChartOutlined style={{ fontSize: 48, color: '#52c41a' }} />
                  </div>
                  <Text type="secondary">訂單狀態分布圖將在此處顯示</Text>
                </div>
              </Card>
            </Col>
          </Row>

          <Row gutter={[24, 24]} className="charts-row">
            <Col xs={24} lg={12}>
              <Card 
                title={
                  <Space>
                    <BarChartOutlined />
                    <span>商品類別分析</span>
                  </Space>
                }
                className="chart-card"
              >
                <div className="chart-placeholder">
                  <div className="chart-icon">
                    <BarChartOutlined style={{ fontSize: 48, color: '#faad14' }} />
                  </div>
                  <Text type="secondary">商品類別分析圖表將在此處顯示</Text>
                </div>
              </Card>
            </Col>
            
            <Col xs={24} lg={12}>
              <Card 
                title={
                  <Space>
                    <LineChartOutlined />
                    <span>用戶增長</span>
                  </Space>
                }
                className="chart-card"
              >
                <div className="chart-placeholder">
                  <div className="chart-icon">
                    <LineChartOutlined style={{ fontSize: 48, color: '#722ed1' }} />
                  </div>
                  <Text type="secondary">用戶增長趨勢圖將在此處顯示</Text>
                </div>
              </Card>
            </Col>
          </Row>

          {/* 數據表格 */}
          <Row gutter={[24, 24]} className="tables-row">
            <Col xs={24} lg={12}>
              <Card title="熱門商品" className="table-card">
                <div className="table-placeholder">
                  <Text type="secondary">熱門商品排行榜將在此處顯示</Text>
                </div>
              </Card>
            </Col>
            
            <Col xs={24} lg={12}>
              <Card title="用戶行為分析" className="table-card">
                <div className="table-placeholder">
                  <Text type="secondary">用戶行為分析數據將在此處顯示</Text>
                </div>
              </Card>
            </Col>
          </Row>
        </div>
      </Spin>
    </div>
  );
};

export default Analytics;
