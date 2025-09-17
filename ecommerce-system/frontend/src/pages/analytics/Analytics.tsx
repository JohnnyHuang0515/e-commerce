import React from 'react';
import { Card, Col, Row } from 'antd';
import {
  Area,
  Column,
} from '@ant-design/charts';
import { DollarOutlined, ShoppingOutlined, TeamOutlined, PercentageOutlined } from '@ant-design/icons';

import UnifiedPageLayout from '../../components/common/UnifiedPageLayout';
import { useAnalyticsDashboard } from '../../hooks/useAnalytics';

const Analytics: React.FC = () => {
  const { data: dashboardResponse, isLoading, refetch } = useAnalyticsDashboard();
  const dashboard = dashboardResponse?.data;

  const statsConfig = [
    {
      label: '本期營收',
      value: dashboard ? `NT$ ${dashboard.summary.revenue.toLocaleString()}` : '—',
      icon: <DollarOutlined />,
      color: 'var(--primary-500)',
    },
    {
      label: '訂單數',
      value: dashboard?.summary.orders ?? '—',
      icon: <ShoppingOutlined />,
      color: 'var(--info-500)',
    },
    {
      label: '活躍客戶',
      value: dashboard?.summary.customers ?? '—',
      icon: <TeamOutlined />,
      color: 'var(--success-500)',
    },
    {
      label: '轉換率',
      value: dashboard ? `${(dashboard.summary.conversionRate * 100).toFixed(2)}%` : '—',
      icon: <PercentageOutlined />,
      color: 'var(--warning-500)',
    },
  ];

  const salesTrendConfig = {
    data: dashboard?.salesTrend ?? [],
    xField: 'date',
    yField: 'sales',
    smooth: true,
    areaStyle: { fillOpacity: 0.15 },
  };

  const topProductConfig = {
    data: dashboard?.topProducts ?? [],
    xField: 'name',
    yField: 'sales',
    tooltip: {
      formatter: (datum: { name: string; sales: number; percentage: number }) => ({
        name: datum.name,
        value: `NT$ ${datum.sales.toLocaleString()} (${(datum.percentage * 100).toFixed(1)}%)`,
      }),
    },
  };

  return (
    <UnifiedPageLayout
      title="營運分析"
      subtitle="掌握銷售趨勢與熱門商品"
      stats={statsConfig}
      loading={isLoading}
      extra={<a onClick={() => refetch()}>重新整理</a>}
    >
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title="銷售趨勢" bordered={false}>
            <Area {...salesTrendConfig} height={260} />
          </Card>
        </Col>
        <Col span={24}>
          <Card title="熱銷商品" bordered={false}>
            <Column {...topProductConfig} height={260} />
          </Card>
        </Col>
      </Row>
    </UnifiedPageLayout>
  );
};

export default Analytics;
