import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Tabs, 
  Typography, 
  Space, 
  Button,
  Statistic,
  Progress,
  Alert,
  Spin
} from 'antd';
import { 
  ThunderboltOutlined, 
  HeartOutlined, 
  EyeOutlined,
  BarChartOutlined,
  ReloadOutlined,
  ShoppingCartOutlined,
  StarOutlined,
  RobotOutlined,
  BulbOutlined,
  ExperimentOutlined
} from '@ant-design/icons';
import UnifiedPageLayout from '../../components/common/UnifiedPageLayout';
import RecommendationList from '../../components/recommendation/RecommendationList';
import AiService, { 
  RecommendationItem,
  RecommendationType 
} from '../../services/aiService';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const RecommendationPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // 載入分析數據
  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await AiService.getRecommendationAnalytics();
      setAnalytics(response.data);
    } catch (err: any) {
      setError(err.message || '載入分析數據失敗');
    } finally {
      setLoading(false);
    }
  };

  // 處理推薦項目點擊
  const handleItemClick = (item: RecommendationItem) => {
    console.log('推薦項目點擊:', item);
    // 這裡可以導航到商品詳情頁
  };

  // 處理加入購物車
  const handleAddToCart = (item: RecommendationItem) => {
    console.log('加入購物車:', item);
    // 這裡可以調用購物車 API
  };

  // 處理收藏
  const handleLike = (item: RecommendationItem) => {
    console.log('收藏商品:', item);
    // 這裡可以調用收藏 API
  };

  // 初始載入
  useEffect(() => {
    loadAnalytics();
  }, []);

  // 渲染分析統計
  const renderAnalyticsStats = () => {
    if (!analytics) return null;

    return (
      <Row gutter={16}>
        {analytics.analytics.map((stat: any, index: number) => (
          <Col key={index} span={6}>
            <Card size="small">
              <Statistic
                title={getRecommendationTypeLabel(stat.recommendation_type)}
                value={stat.total_recommendations}
                suffix={`點擊率 ${(stat.click_through_rate * 100).toFixed(1)}%`}
                prefix={getRecommendationTypeIcon(stat.recommendation_type)}
              />
              <Progress
                percent={stat.click_through_rate * 100}
                size="small"
                strokeColor={{
                  '0%': '#108ee9',
                  '100%': '#87d068',
                }}
              />
            </Card>
          </Col>
        ))}
      </Row>
    );
  };

  // 獲取推薦類型標籤
  const getRecommendationTypeLabel = (type: RecommendationType) => {
    const labels = {
      'hybrid': '混合推薦',
      'collaborative': '協同過濾',
      'content_based': '內容基於',
      'trending': '熱門推薦'
    };
    return labels[type] || type;
  };

  // 獲取推薦類型圖標
  const getRecommendationTypeIcon = (type: RecommendationType) => {
    const icons = {
      'hybrid': <ThunderboltOutlined />,
      'collaborative': <HeartOutlined />,
      'content_based': <EyeOutlined />,
      'trending': <BarChartOutlined />
    };
    return icons[type] || <ThunderboltOutlined />;
  };

  // 統計數據配置
  const statsConfig = analytics ? [
    {
      label: '總推薦數',
      value: analytics.total_recommendations || 0,
      icon: <ThunderboltOutlined />,
      color: 'var(--primary-500)'
    },
    {
      label: '平均點擊率',
      value: `${((analytics.average_ctr || 0) * 100).toFixed(1)}%`,
      icon: <EyeOutlined />,
      color: 'var(--success-500)'
    },
    {
      label: 'AI 模型',
      value: analytics.active_models || 0,
      icon: <RobotOutlined />,
      color: 'var(--info-500)'
    },
    {
      label: '推薦準確度',
      value: `${((analytics.accuracy || 0) * 100).toFixed(1)}%`,
      icon: <BulbOutlined />,
      color: 'var(--warning-500)'
    }
  ] : [];

  // 操作按鈕
  const extraActions = (
    <Space>
      <Button icon={<ReloadOutlined />} onClick={loadAnalytics} loading={loading}>
        刷新數據
      </Button>
      <Button type="primary" icon={<ExperimentOutlined />}>
        訓練模型
      </Button>
    </Space>
  );

  return (
    <UnifiedPageLayout
      title="AI 推薦商品"
      subtitle="基於機器學習算法，為您提供個性化商品推薦"
      extra={extraActions}
      stats={statsConfig}
      onRefresh={loadAnalytics}
      loading={loading}
    >
      {error && (
        <Alert
          message="載入失敗"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          action={
            <Button size="small" onClick={loadAnalytics}>
              重試
            </Button>
          }
        />
      )}

      {/* 推薦效果分析 */}
      {analytics && (
        <Card title="推薦效果分析" style={{ marginBottom: 24 }}>
          <Spin spinning={loading}>
            <div>
              {renderAnalyticsStats()}
              
              <div style={{ marginTop: 16 }}>
                <Text type="secondary">
                  分析期間: {analytics.period.start_date || '全部時間'} 至 {analytics.period.end_date || '現在'}
                </Text>
              </div>
            </div>
          </Spin>
        </Card>
      )}

      {/* 推薦內容 */}
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        items={[
          {
            key: 'overview',
            label: (
              <Space>
                <ThunderboltOutlined />
                智能推薦
              </Space>
            ),
            children: (
              <RecommendationList
                itemType="product"
                defaultLimit={8}
                showStats={true}
                onItemClick={handleItemClick}
                onAddToCart={handleAddToCart}
                onLike={handleLike}
              />
            )
          },
          {
            key: 'personalized',
            label: (
              <Space>
                <HeartOutlined />
                個人化推薦
              </Space>
            ),
            children: (
              <RecommendationList
                itemType="product"
                defaultLimit={8}
                showStats={false}
                onItemClick={handleItemClick}
                onAddToCart={handleAddToCart}
                onLike={handleLike}
              />
            )
          },
          {
            key: 'trending',
            label: (
              <Space>
                <BarChartOutlined />
                熱門推薦
              </Space>
            ),
            children: (
              <RecommendationList
                itemType="product"
                defaultLimit={8}
                showStats={false}
                onItemClick={handleItemClick}
                onAddToCart={handleAddToCart}
                onLike={handleLike}
              />
            )
          }
        ]}
      />
    </UnifiedPageLayout>
  );
};

export default RecommendationPage;
