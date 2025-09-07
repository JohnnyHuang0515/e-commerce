import React, { useState, useEffect } from 'react';
import {
  Card,
  Input,
  Button,
  Table,
  Tag,
  Space,
  Row,
  Col,
  Statistic,
  Alert,
  Spin,
  Typography,
  Divider,
  Tooltip,
  Badge,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  ThunderboltOutlined,
  DatabaseOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { aiSearchService, SearchRequest, SearchResult, SearchSuggestion, ServiceStats } from '../../services/aiSearchService';
import PageHeader from '../../components/common/PageHeader';

const { Search } = Input;
const { Title, Text } = Typography;

const AISearch: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [serviceStats, setServiceStats] = useState<ServiceStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSearchTime, setLastSearchTime] = useState<number>(0);

  // 搜尋參數
  const [searchParams, setSearchParams] = useState({
    limit: 20,
    threshold: 0.7,
  });

  // 載入服務統計
  useEffect(() => {
    loadServiceStats();
  }, []);

  // 載入搜尋建議
  useEffect(() => {
    if (searchQuery.length > 2) {
      loadSuggestions();
    } else {
      setSuggestions([]);
    }
  }, [searchQuery]);

  const loadServiceStats = async () => {
    setStatsLoading(true);
    try {
      const stats = await aiSearchService.getServiceStats();
      setServiceStats(stats);
    } catch (error) {
      console.error('載入服務統計失敗:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const loadSuggestions = async () => {
    setSuggestionsLoading(true);
    try {
      const response = await aiSearchService.getSearchSuggestions(searchQuery, 5);
      setSuggestions(response.data);
    } catch (error) {
      console.error('載入搜尋建議失敗:', error);
    } finally {
      setSuggestionsLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    const startTime = Date.now();

    try {
      const request: SearchRequest = {
        query: query.trim(),
        limit: searchParams.limit,
        threshold: searchParams.threshold,
      };

      const response = await aiSearchService.searchProducts(request);
      setSearchResults(response.data);
      setLastSearchTime(Date.now() - startTime);
    } catch (error: any) {
      setError(error.message || '搜尋失敗');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    handleSearch(suggestion);
  };

  const refreshStats = () => {
    loadServiceStats();
  };

  // 表格欄位定義
  const columns = [
    {
      title: '商品ID',
      dataIndex: 'product_id',
      key: 'product_id',
      width: 120,
      render: (id: string) => (
        <Text code>{id}</Text>
      ),
    },
    {
      title: '商品名稱',
      dataIndex: ['metadata', 'name'],
      key: 'name',
      ellipsis: true,
    },
    {
      title: '價格',
      dataIndex: ['metadata', 'price'],
      key: 'price',
      width: 100,
      render: (price: number) => (
        <Text strong>NT$ {price.toLocaleString()}</Text>
      ),
    },
    {
      title: '分類',
      dataIndex: ['metadata', 'category'],
      key: 'category',
      width: 120,
      render: (category: string) => (
        <Tag color="blue">{category}</Tag>
      ),
    },
    {
      title: '品牌',
      dataIndex: ['metadata', 'brand'],
      key: 'brand',
      width: 100,
      render: (brand: string) => (
        <Tag color="green">{brand}</Tag>
      ),
    },
    {
      title: '相似度分數',
      dataIndex: 'score',
      key: 'score',
      width: 120,
      render: (score: number) => (
        <Badge
          count={`${(score * 100).toFixed(1)}%`}
          style={{
            backgroundColor: score > 0.8 ? '#52c41a' : score > 0.6 ? '#faad14' : '#f5222d',
          }}
        />
      ),
    },
  ];

  return (
    <div className="ai-search-page">
      <PageHeader
        title="AI智能搜尋"
        subtitle="使用語意搜尋技術，提供更精準的商品搜尋結果"
        icon={<ThunderboltOutlined />}
      />

      {/* 服務統計 */}
      <Card title="服務統計" style={{ marginBottom: 24 }}>
        <Spin spinning={statsLoading}>
          <Row gutter={16}>
            <Col span={6}>
              <Statistic
                title="總搜尋次數"
                value={serviceStats?.data?.total_searches || 0}
                prefix={<SearchOutlined />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="已索引商品"
                value={serviceStats?.data?.total_products_indexed || 0}
                prefix={<DatabaseOutlined />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="平均回應時間"
                value={serviceStats?.data?.average_response_time || 0}
                suffix="ms"
                prefix={<ClockCircleOutlined />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="快取命中率"
                value={serviceStats?.data?.cache_hit_rate || 0}
                suffix="%"
                prefix={<ThunderboltOutlined />}
              />
            </Col>
          </Row>
          <div style={{ marginTop: 16, textAlign: 'right' }}>
            <Button
              icon={<ReloadOutlined />}
              onClick={refreshStats}
              loading={statsLoading}
            >
              重新整理統計
            </Button>
          </div>
        </Spin>
      </Card>

      {/* 搜尋區域 */}
      <Card title="智能搜尋" style={{ marginBottom: 24 }}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Row gutter={16}>
            <Col span={16}>
              <Search
                placeholder="輸入商品名稱、描述或相關關鍵字..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onSearch={handleSearch}
                loading={loading}
                size="large"
                enterButton={
                  <Button type="primary" icon={<SearchOutlined />} loading={loading}>
                    智能搜尋
                  </Button>
                }
              />
            </Col>
            <Col span={8}>
              <Space>
                <Tooltip title="搜尋結果數量限制">
                  <Input
                    placeholder="結果數量"
                    value={searchParams.limit}
                    onChange={(e) => setSearchParams(prev => ({ ...prev, limit: parseInt(e.target.value) || 20 }))}
                    style={{ width: 100 }}
                  />
                </Tooltip>
                <Tooltip title="相似度閾值 (0.0-1.0)">
                  <Input
                    placeholder="閾值"
                    value={searchParams.threshold}
                    onChange={(e) => setSearchParams(prev => ({ ...prev, threshold: parseFloat(e.target.value) || 0.7 }))}
                    style={{ width: 100 }}
                  />
                </Tooltip>
              </Space>
            </Col>
          </Row>

          {/* 搜尋建議 */}
          {suggestions.length > 0 && (
            <div>
              <Text type="secondary">搜尋建議:</Text>
              <Space wrap style={{ marginTop: 8 }}>
                {suggestions.map((suggestion, index) => (
                  <Button
                    key={index}
                    size="small"
                    type="dashed"
                    loading={suggestionsLoading}
                    onClick={() => handleSuggestionClick(suggestion.query)}
                  >
                    {suggestion.query} ({suggestion.count})
                  </Button>
                ))}
              </Space>
            </div>
          )}

          {/* 錯誤提示 */}
          {error && (
            <Alert
              message="搜尋錯誤"
              description={error}
              type="error"
              showIcon
              closable
              onClose={() => setError(null)}
            />
          )}
        </Space>
      </Card>

      {/* 搜尋結果 */}
      <Card
        title={
          <Space>
            <span>搜尋結果</span>
            {lastSearchTime > 0 && (
              <Tag color="blue" icon={<ClockCircleOutlined />}>
                回應時間: {lastSearchTime}ms
              </Tag>
            )}
            {searchResults.length > 0 && (
              <Tag color="green">
                找到 {searchResults.length} 個結果
              </Tag>
            )}
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={searchResults}
          rowKey="product_id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 個結果`,
          }}
          locale={{
            emptyText: searchQuery ? '沒有找到相關商品' : '請輸入搜尋關鍵字',
          }}
        />
      </Card>
    </div>
  );
};

export default AISearch;
