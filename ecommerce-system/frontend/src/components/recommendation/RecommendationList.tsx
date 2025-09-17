import React from 'react';
import { Row, Col, Empty, Spin, Tabs } from 'antd';

import RecommendationCard from './RecommendationCard';
import {
  useRecommendations,
  usePopularRecommendations,
  type RecommendationItem,
} from '../../hooks/useRecommendations';

const { TabPane } = Tabs;

interface RecommendationListProps {
  limit?: number;
  categoryId?: string;
  onViewItem?: (item: RecommendationItem) => void;
  onAddToCart?: (item: RecommendationItem) => void;
  onLike?: (item: RecommendationItem) => void;
}

const RecommendationList: React.FC<RecommendationListProps> = ({
  limit = 8,
  categoryId,
  onViewItem,
  onAddToCart,
  onLike,
}) => {
  const { data: recommendedData, isLoading: recommendationsLoading } = useRecommendations({ limit, category_id: categoryId });
  const { data: popularData, isLoading: popularLoading } = usePopularRecommendations({ limit, category_id: categoryId });

  const recommendations = recommendedData?.data ?? [];
  const popular = popularData?.data ?? [];

  const renderItems = (items: RecommendationItem[], loading: boolean) => {
    if (loading) {
      return (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <Spin />
        </div>
      );
    }

    if (items.length === 0) {
      return <Empty description="目前沒有推薦資料" style={{ padding: '48px 0' }} />;
    }

    return (
      <Row gutter={[16, 16]}>
        {items.map((item) => (
          <Col key={item.id} xs={24} sm={12} md={8} lg={6}>
            <RecommendationCard
              item={item}
              onView={onViewItem}
              onAddToCart={onAddToCart}
              onLike={onLike}
            />
          </Col>
        ))}
      </Row>
    );
  };

  return (
    <Tabs defaultActiveKey="personalized" destroyInactiveTabPane>
      <TabPane tab="為你推薦" key="personalized">
        {renderItems(recommendations, recommendationsLoading)}
      </TabPane>
      <TabPane tab="熱門推薦" key="popular">
        {renderItems(popular, popularLoading)}
      </TabPane>
    </Tabs>
  );
};

export default RecommendationList;
