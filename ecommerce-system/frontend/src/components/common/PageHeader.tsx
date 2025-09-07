import React from 'react';
import { Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import './PageHeader.less';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumb?: Array<{
    title: string;
    path?: string;
  }>;
  extra?: React.ReactNode;
  onBack?: () => void;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  breadcrumb,
  extra,
  onBack,
}) => {
  const navigate = useNavigate();

  const handleBreadcrumbClick = (path: string) => {
    navigate(path);
  };

  const breadcrumbItems = breadcrumb?.map((item) => ({
    title: item.path ? (
      <Button
        type="link"
        onClick={() => handleBreadcrumbClick(item.path!)}
        className="breadcrumb-link"
      >
        {item.title}
      </Button>
    ) : (
      item.title
    ),
  }));

  return (
    <div className="page-header">
      <div className="custom-page-header">
        <div className="page-header-content">
          {onBack && (
            <Button type="text" onClick={onBack} className="back-btn">
              ← 返回
            </Button>
          )}
          <div className="page-header-title">
            <h1 className="title">{title}</h1>
            {subtitle && <p className="subtitle">{subtitle}</p>}
          </div>
          {extra && <div className="page-header-extra">{extra}</div>}
        </div>
        {breadcrumbItems && (
          <div className="breadcrumb">
            {breadcrumbItems.map((item, index) => (
              <span key={index} className="breadcrumb-item">
                {item.title}
                {index < breadcrumbItems.length - 1 && <span className="separator">/</span>}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
