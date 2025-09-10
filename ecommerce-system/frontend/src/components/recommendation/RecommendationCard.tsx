import React from 'react';
import { Card, Badge, Tag, Typography, Space, Tooltip, Button } from 'antd';
import { 
  ShoppingCartOutlined, 
  HeartOutlined, 
  EyeOutlined,
  StarOutlined,
  InfoCircleOutlined 
} from '@ant-design/icons';
import { RecommendationItem } from '../../services/recommendationService';

const { Text, Title } = Typography;

interface RecommendationCardProps {
  item: RecommendationItem;
  onAddToCart?: (item: RecommendationItem) => void;
  onLike?: (item: RecommendationItem) => void;
  onView?: (item: RecommendationItem) => void;
  onRecordClick?: (item: RecommendationItem) => void;
  showActions?: boolean;
  size?: 'small' | 'default' | 'large';
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({
  item,
  onAddToCart,
  onLike,
  onView,
  onRecordClick,
  showActions = true,
  size = 'default'
}) => {
  const handleCardClick = () => {
    onRecordClick?.(item);
    onView?.(item);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart?.(item);
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    onLike?.(item);
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return '#52c41a';
    if (score >= 0.6) return '#faad14';
    if (score >= 0.4) return '#fa8c16';
    return '#f5222d';
  };

  const getScoreText = (score: number) => {
    if (score >= 0.8) return '高匹配';
    if (score >= 0.6) return '中匹配';
    if (score >= 0.4) return '低匹配';
    return '較低匹配';
  };

  const cardStyle = {
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    height: size === 'small' ? '200px' : size === 'large' ? '300px' : '250px'
  };

  const imageStyle = {
    width: '100%',
    height: size === 'small' ? '80px' : size === 'large' ? '150px' : '120px',
    objectFit: 'cover' as const,
    borderRadius: '6px'
  };

  return (
    <Card
      hoverable
      style={cardStyle}
      onClick={handleCardClick}
      cover={
        <div style={{ padding: '12px' }}>
          <img
            alt={item.title}
            src={item.metadata.image || '/api/placeholder/200/150'}
            style={imageStyle}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/api/placeholder/200/150';
            }}
          />
        </div>
      }
      actions={
        showActions ? [
          <Tooltip title="查看詳情" key="view">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              onClick={handleCardClick}
            />
          </Tooltip>,
          <Tooltip title="加入購物車" key="cart">
            <Button 
              type="text" 
              icon={<ShoppingCartOutlined />} 
              onClick={handleAddToCart}
            />
          </Tooltip>,
          <Tooltip title="加入收藏" key="like">
            <Button 
              type="text" 
              icon={<HeartOutlined />} 
              onClick={handleLike}
            />
          </Tooltip>
        ] : undefined
      }
    >
      <Card.Meta
        title={
          <div>
            <Title level={size === 'small' ? 5 : 4} style={{ margin: 0, marginBottom: 4 }}>
              {item.title}
            </Title>
            <Space size="small">
              <Badge
                count={`${(item.score * 100).toFixed(0)}%`}
                style={{ backgroundColor: getScoreColor(item.score) }}
              />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {getScoreText(item.score)}
              </Text>
            </Space>
          </div>
        }
        description={
          <div>
            <Text 
              type="secondary" 
              style={{ 
                fontSize: size === 'small' ? '12px' : '14px',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}
            >
              {item.description}
            </Text>
            
            {item.metadata.price && (
              <div style={{ marginTop: 8 }}>
                <Text strong style={{ fontSize: size === 'small' ? '14px' : '16px', color: '#f5222d' }}>
                  NT$ {item.metadata.price.toLocaleString()}
                </Text>
              </div>
            )}
            
            <div style={{ marginTop: 8 }}>
              <Space wrap size="small">
                {item.metadata.categories?.slice(0, 2).map((category, index) => (
                  <Tag key={index} color="blue" style={{ fontSize: '10px' }}>
                    {category}
                  </Tag>
                ))}
                {item.metadata.brand && (
                  <Tag color="green" style={{ fontSize: '10px' }}>
                    {item.metadata.brand}
                  </Tag>
                )}
              </Space>
            </div>
            
            <div style={{ marginTop: 8 }}>
              <Tooltip title={item.reason}>
                <Space size="small">
                  <InfoCircleOutlined style={{ fontSize: '12px', color: '#1890ff' }} />
                  <Text type="secondary" style={{ fontSize: '11px' }}>
                    {item.reason}
                  </Text>
                </Space>
              </Tooltip>
            </div>
          </div>
        }
      />
    </Card>
  );
};

export default RecommendationCard;
