import React, { ReactNode } from 'react';
import { Card } from 'antd';

interface GlassCardProps {
  children: ReactNode;
  title?: string;
  className?: string;
  style?: React.CSSProperties;
  hoverable?: boolean;
  bordered?: boolean;
}

const GlassCard: React.FC<GlassCardProps> = ({
  children,
  title,
  className = '',
  style = {},
  hoverable = true,
  bordered = false
}) => {
  const glassStyle: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.3s ease',
    ...style
  };

  return (
    <Card
      title={title}
      className={`glass-card ${className}`}
      style={glassStyle}
      hoverable={hoverable}
      bordered={bordered}
    >
      {children}
    </Card>
  );
};

export default GlassCard;
