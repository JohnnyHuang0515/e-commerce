import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Select, 
  Button, 
  Space, 
  Typography, 
  Spin, 
  Alert,
  Empty,
  Tabs,
  Statistic,
  Tooltip
} from 'antd';
import { 
  ReloadOutlined, 
  ThunderboltOutlined, 
  HeartOutlined,
  ShoppingCartOutlined,
  EyeOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import RecommendationCard from './RecommendationCard';
import AiService, { 
  RecommendationItem, 
  RecommendationType 
} from '../../services/aiService';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

interface RecommendationListProps {
  userId?: string;
  itemType?: string;
  defaultLimit?: number;
  showStats?: boolean;
  showTabs?: boolean;
  onItemClick?: (item: RecommendationItem) => void;
  onAddToCart?: (item: RecommendationItem) => void;
  onLike?: (item: RecommendationItem) => void;
}

const RecommendationList: React.FC<RecommendationListProps> = ({
  userId,
  itemType = 'product',
  defaultLimit = 8,
  showStats = true,
  showTabs = true,
  onItemClick,
  onAddToCart,
  onLike
}) => {
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendationType, setRecommendationType] = useState<RecommendationType>('hybrid');
  const [limit, setLimit] = useState(defaultLimit);
  const [stats, setStats] = useState<any>(null);

  // 載入推薦數據
  const loadRecommendations = async (type: RecommendationType = recommendationType) => {
    setLoading(true);
    setError(null);
    
    try {
      let response;
      
      switch (type) {
        case 'personalized':
          response = await AiService.getPersonalizedRecommendations({
            limit,
            item_type: itemType
          });
          break;
        case 'trending':
          response = await AiService.getTrendingItems({
            limit,
            period: 'week'
          });
          break;
        default:
          response = await AiService.getRecommendations({
            type,
            limit,
            item_type: itemType
          });
      }
      
      setRecommendations(response.data.recommendations);
    } catch (err: any) {
      setError(err.message || '載入推薦失敗');
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  // 載入統計數據
  const loadStats = async () => {
    try {
      const response = await AiService.getRecommendationStats();
      setStats(response.data);
    } catch (err) {
      console.error('載入統計數據失敗:', err);
    }
  };

  // 記錄點擊
  const handleRecordClick = async (item: RecommendationItem) => {
    try {
      await AiService.recordRecommendationClick({
        item_id: item.item_id,
        recommendation_type: recommendationType,
        score: item.score
      });
    } catch (err) {
      console.error('記錄點擊失敗:', err);
    }
  };

  // 處理項目點擊
  const handleItemClick = (item: RecommendationItem) => {
    handleRecordClick(item);
    onItemClick?.(item);
  };

  // 處理加入購物車
  const handleAddToCart = (item: RecommendationItem) => {
    handleRecordClick(item);
    onAddToCart?.(item);
  };

  // 處理收藏
  const handleLike = (item: RecommendationItem) => {
    handleRecordClick(item);
    onLike?.(item);
  };

  // 初始載入
  useEffect(() => {
    loadRecommendations();
    if (showStats) {
      loadStats();
    }
  }, [limit]);

  // 推薦類型變更
  const handleTypeChange = (type: RecommendationType) => {
    setRecommendationType(type);
    loadRecommendations(type);
  };

  // 重新載入
  const handleRefresh = () => {
    loadRecommendations();
    if (showStats) {
      loadStats();
    }
  };

  // 推薦類型選項
  const recommendationTypes = [
    { value: 'hybrid', label: '混合推薦', icon: <ThunderboltOutlined /> },
    { value: 'collaborative', label: '協同過濾', icon: <HeartOutlined /> },
    { value: 'content_based', label: '內容基於', icon: <EyeOutlined /> },
    { value: 'trending', label: '熱門推薦', icon: <BarChartOutlined /> }
  ];

  return (
    <div className="recommendation-list">
      {/* 統計數據 */}
      {showStats && stats && (
        <Card style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={6}>
              <Statistic
                title="總推薦數"
                value={stats.total_recommendations}
                prefix={<ThunderboltOutlined />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="總點擊數"
                value={stats.total_clicks}
                prefix={<EyeOutlined />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="點擊率"
                value={(stats.click_through_rate * 100).toFixed(2)}
                suffix="%"
                prefix={<BarChartOutlined />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="推薦類型"
                value={stats.recommendation_types.length}
                prefix={<HeartOutlined />}
              />
            </Col>
          </Row>
        </Card>
      )}

      {/* 控制面板 */}
      <Card style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Title level={4} style={{ margin: 0 }}>
                智能推薦
              </Title>
              <Text type="secondary">
                為您推薦 {recommendations.length} 個商品
              </Text>
            </Space>
          </Col>
          <Col>
            <Space>
              <Select
                value={recommendationType}
                onChange={handleTypeChange}
                style={{ width: 120 }}
                size="small"
              >
                {recommendationTypes.map(type => (
                  <Option key={type.value} value={type.value}>
                    <Space>
                      {type.icon}
                      {type.label}
                    </Space>
                  </Option>
                ))}
              </Select>
              
              <Select
                value={limit}
                onChange={setLimit}
                style={{ width: 80 }}
                size="small"
              >
                <Option value={4}>4</Option>
                <Option value={8}>8</Option>
                <Option value={12}>12</Option>
                <Option value={16}>16</Option>
              </Select>
              
              <Tooltip title="重新載入推薦">
                <Button
                  icon={<ReloadOutlined />}
                  onClick={handleRefresh}
                  loading={loading}
                  size="small"
                />
              </Tooltip>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 推薦內容 */}
      <Card>
        <Spin spinning={loading}>
          {error && (
            <Alert
              message="載入失敗"
              description={error}
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
              action={
                <Button size="small" onClick={handleRefresh}>
                  重試
                </Button>
              }
            />
          )}
          
          {!loading && !error && recommendations.length === 0 && (
            <Empty
              description="暫無推薦商品"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          )}
          
          {recommendations.length > 0 && (
            <Row gutter={[16, 16]}>
              {recommendations.map((item) => (
                <Col key={item.item_id} xs={24} sm={12} md={8} lg={6}>
                  <RecommendationCard
                    item={item}
                    onView={handleItemClick}
                    onAddToCart={handleAddToCart}
                    onLike={handleLike}
                    onRecordClick={handleRecordClick}
                    size="default"
                  />
                </Col>
              ))}
            </Row>
          )}
        </Spin>
      </Card>
    </div>
  );
};

export default RecommendationList;
