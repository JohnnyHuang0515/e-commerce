import React from 'react';
import { Card, Space, Typography, Button } from 'antd';
import { EyeOutlined, HeartOutlined, ShoppingCartOutlined } from '@ant-design/icons';

import type { RecommendationItem } from '../../hooks/useRecommendations';

const { Text, Title } = Typography;

interface RecommendationCardProps {
  item: RecommendationItem;
  onAddToCart?: (item: RecommendationItem) => void;
  onLike?: (item: RecommendationItem) => void;
  onView?: (item: RecommendationItem) => void;
  showActions?: boolean;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({
  item,
  onAddToCart,
  onLike,
  onView,
  showActions = true,
}) => {
  const handleView = () => onView?.(item);
  const handleAddToCart = () => onAddToCart?.(item);
  const handleLike = () => onLike?.(item);

  return (
    <Card
      hoverable
      onClick={handleView}
      style={{ height: '100%' }}
      actions={
        showActions
          ? [
              <Button type="text" icon={<EyeOutlined />} onClick={(event) => { event.stopPropagation(); handleView(); }} key="view" />,
              <Button type="text" icon={<ShoppingCartOutlined />} onClick={(event) => { event.stopPropagation(); handleAddToCart(); }} key="cart" />,
              <Button type="text" icon={<HeartOutlined />} onClick={(event) => { event.stopPropagation(); handleLike(); }} key="like" />,
            ]
          : undefined
      }
    >
      <Space direction="vertical" size={8} style={{ width: '100%' }}>
        <Title level={4} style={{ marginBottom: 0 }}>
          {item.name}
        </Title>
        {item.price !== undefined && (
          <Text strong style={{ color: '#f5222d' }}>
            NT$ {item.price.toLocaleString()}
          </Text>
        )}
        {item.description && (
          <Text type="secondary" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {item.description}
          </Text>
        )}
      </Space>
    </Card>
  );
};

export default RecommendationCard;
