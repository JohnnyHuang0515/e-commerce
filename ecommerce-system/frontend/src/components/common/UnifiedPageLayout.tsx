import React from 'react';
import { Row, Col, Card, Space, Button } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import './UnifiedPageLayout.less';

interface UnifiedPageLayoutProps {
  title: string;
  subtitle?: string;
  extra?: React.ReactNode;
  stats?: Array<{
    label: string;
    value: string | number;
    color?: string;
    icon?: React.ReactNode;
  }>;
  filters?: React.ReactNode;
  children: React.ReactNode;
  onRefresh?: () => void;
  loading?: boolean;
}

const UnifiedPageLayout: React.FC<UnifiedPageLayoutProps> = ({
  title,
  subtitle,
  extra,
  stats = [],
  filters,
  children,
  onRefresh,
  loading = false,
}) => {
  return (
    <div className="unified-page-layout">
      {/* 頁面標題區域 */}
      <div className="page-header-section">
        <div className="page-title-area">
          <h2 className="page-title">{title}</h2>
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </div>
        <div className="page-actions">
          <Space>
            {onRefresh && (
              <Button 
                icon={<ReloadOutlined />} 
                onClick={onRefresh}
                loading={loading}
                className="refresh-btn"
              >
                刷新
              </Button>
            )}
            {extra}
          </Space>
        </div>
      </div>

      {/* 統計卡片區域 */}
      {stats.length > 0 && (
        <Row gutter={[16, 16]} className="stats-section">
          {stats.map((stat, index) => (
            <Col xs={12} sm={6} key={index}>
              <Card size="small" className="stat-card">
                <div className="stat-content">
                  {stat.icon && <div className="stat-icon">{stat.icon}</div>}
                  <div className="stat-info">
                    <div 
                      className="stat-value"
                      style={{ color: stat.color || 'var(--text-primary)' }}
                    >
                      {stat.value}
                    </div>
                    <div className="stat-label">{stat.label}</div>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* 主要內容區域 */}
      <Card className="main-content-card">
        {/* 篩選區域 */}
        {filters && (
          <div className="filters-section">
            {filters}
          </div>
        )}

        {/* 內容區域 */}
        <div className="content-section">
          {children}
        </div>
      </Card>
    </div>
  );
};

export default UnifiedPageLayout;
