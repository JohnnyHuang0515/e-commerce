import React from 'react';
import { Card, Statistic, Space, Typography } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import './StatCard.less';

const { Text } = Typography;

interface StatCardProps {
  title: string;
  value: number | string;
  prefix?: React.ReactNode;
  suffix?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  loading?: boolean;
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  prefix,
  suffix,
  trend,
  loading = false,
  className = '',
}) => {
  return (
    <Card 
      className={`stat-card ${className}`}
      loading={loading}
      hoverable
    >
      <div className="stat-card-content">
        <div className="stat-card-header">
          <Text type="secondary" className="stat-title">
            {title}
          </Text>
        </div>
        
        <div className="stat-card-body">
          <Statistic
            value={value}
            prefix={prefix}
            suffix={suffix}
            valueStyle={{ 
              fontSize: '24px', 
              fontWeight: 600,
              color: 'var(--text-primary)'
            }}
          />
        </div>
        
        {trend && (
          <div className="stat-card-footer">
            <Space size="small">
              {trend.isPositive ? (
                <ArrowUpOutlined className="trend-icon trend-up" />
              ) : (
                <ArrowDownOutlined className="trend-icon trend-down" />
              )}
              <Text 
                className={`trend-text ${trend.isPositive ? 'trend-up' : 'trend-down'}`}
              >
                {Math.abs(trend.value)}%
              </Text>
              <Text type="secondary" className="trend-label">
                較上期
              </Text>
            </Space>
          </div>
        )}
      </div>
    </Card>
  );
};

export default StatCard;
