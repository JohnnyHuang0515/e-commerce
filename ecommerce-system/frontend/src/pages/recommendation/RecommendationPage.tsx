import React from 'react';
import { Button, Card, Space, message } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';

import RecommendationList from '../../components/recommendation/RecommendationList';
import {
  useRecommendations,
  useRefreshRecommendations,
} from '../../hooks/useRecommendations';
import UnifiedPageLayout from '../../components/common/UnifiedPageLayout';

const RecommendationPage: React.FC = () => {
  const { data: recommendationsData, isLoading } = useRecommendations({ limit: 8 });
  const refreshMutation = useRefreshRecommendations();

  const recommendations = recommendationsData?.data ?? [];

  const statsConfig = [
    {
      label: '推薦數量',
      value: recommendations.length,
      icon: '✨',
      color: 'var(--primary-500)',
    },
  ];

  const handleRefresh = async () => {
    try {
      const result = await refreshMutation.mutateAsync();
      message.success(result.data?.message ?? '已刷新推薦資料');
    } catch (error) {
      const errorMessage = (error as Error).message ?? '刷新推薦失敗';
      message.error(errorMessage);
    }
  };

  return (
    <UnifiedPageLayout
      title="商品推薦"
      subtitle="根據使用者行為與熱度推薦可能感興趣的商品"
      stats={statsConfig}
      loading={isLoading}
      extra={
        <Space>
          <Button icon={<ReloadOutlined />} loading={refreshMutation.isPending} onClick={handleRefresh}>
            重新整理
          </Button>
        </Space>
      }
    >
      <Card bordered={false}>
        <RecommendationList
          limit={8}
          onViewItem={(item) => message.info(`查看 ${item.name}`)}
          onAddToCart={(item) => message.success(`已將 ${item.name} 加入購物車`)}
          onLike={(item) => message.success(`已加入收藏：${item.name}`)}
        />
      </Card>
    </UnifiedPageLayout>
  );
};

export default RecommendationPage;
