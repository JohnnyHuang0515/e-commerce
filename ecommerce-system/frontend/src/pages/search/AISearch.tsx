import React, { useEffect, useState } from 'react';
import { Button, Card, Col, Input, Row, Space, Statistic, Table, Tag, Typography, message } from 'antd';
import { ThunderboltOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

import UnifiedPageLayout from '../../components/common/UnifiedPageLayout';
import AiService, {
  type SearchRequest,
  type SearchResult,
  type SearchSuggestion,
  type ServiceStatsData,
} from '../../services/aiService';

const { Search } = Input;
const { Text } = Typography;

const AISearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [stats, setStats] = useState<ServiceStatsData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    AiService.getServiceStats()
      .then((response) => setStats(response.data))
      .catch(() => undefined);
  }, []);

  const columns: ColumnsType<SearchResult> = [
    {
      title: '商品 ID',
      dataIndex: 'product_id',
      key: 'product_id',
      width: 160,
      render: (value: string) => <Text code>{value}</Text>,
    },
    {
      title: '商品名稱',
      dataIndex: ['metadata', 'name'],
      key: 'name',
    },
    {
      title: '分類',
      dataIndex: ['metadata', 'category'],
      key: 'category',
      width: 160,
      render: (value?: string) => (value ? <Tag color="blue">{value}</Tag> : '—'),
    },
    {
      title: '價格',
      dataIndex: ['metadata', 'price'],
      key: 'price',
      width: 120,
      render: (value?: number) => (value !== undefined ? `NT$ ${value.toLocaleString()}` : '—'),
    },
    {
      title: '匹配度',
      dataIndex: 'score',
      key: 'score',
      width: 140,
      render: (score: number) => (
        <Tag color={score > 0.8 ? 'green' : score > 0.6 ? 'orange' : 'red'}>
          {(score * 100).toFixed(1)}%
        </Tag>
      ),
    },
  ];

  const handleSearch = async (value: string) => {
    if (!value.trim()) return;

    setLoading(true);
    setQuery(value);
    try {
      const request: SearchRequest = {
        query: value.trim(),
        limit: 10,
      };

      const response = await AiService.search(request);
      setResults(response.data);

      const suggestionResponse = await AiService.getSearchSuggestions(value, 5);
      setSuggestions(suggestionResponse.data);
    } catch (error) {
      message.error((error as Error).message || '搜尋失敗');
    } finally {
      setLoading(false);
    }
  };

  const statsConfig = [
    {
      label: '總搜尋次數',
      value: stats?.total_searches ?? 0,
      icon: <ThunderboltOutlined />,
      color: 'var(--primary-500)',
    },
    {
      label: '成功率',
      value: `${((stats?.success_rate ?? 0) * 100).toFixed(1)}%`,
      icon: <ThunderboltOutlined />,
      color: 'var(--success-500)',
    },
    {
      label: '平均延遲 (ms)',
      value: stats?.average_latency ?? 0,
      icon: <ThunderboltOutlined />,
      color: 'var(--info-500)',
    },
  ];

  return (
    <UnifiedPageLayout
      title="AI 搜尋"
      subtitle="使用語意搜尋快速取得商品建議"
      stats={statsConfig}
      loading={loading}
      extra={<Button icon={<ReloadOutlined />} onClick={() => stats && setStats({ ...stats })}>重新整理</Button>}
    >
      <Card bordered={false} style={{ marginBottom: 16 }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Search
            placeholder="輸入關鍵字，例如：藍牙耳機"
            enterButton={<SearchOutlined />}
            size="large"
            onSearch={handleSearch}
            loading={loading}
          />
          {suggestions.length > 0 && (
            <Space size={[8, 8]} wrap>
              <Text type="secondary">推薦搜尋：</Text>
              {suggestions.map((suggestion) => (
                <Tag key={suggestion.text} onClick={() => handleSearch(suggestion.text)} style={{ cursor: 'pointer' }}>
                  {suggestion.text}
                </Tag>
              ))}
            </Space>
          )}
        </Space>
      </Card>

      <Card title={query ? `搜尋結果 - ${query}` : '搜尋結果'} bordered={false}>
        <Table<SearchResult>
          rowKey={(record) => record.product_id}
          columns={columns}
          dataSource={results}
          loading={loading}
          pagination={false}
        />
        {results.length === 0 && !loading && (
          <Text type="secondary">尚未有搜尋結果，輸入關鍵字後開始搜尋。</Text>
        )}
      </Card>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={24} md={12}>
          <Card title="服務概況" bordered={false}>
            <Row gutter={16}>
              <Col span={12}>
                <Statistic title="總搜尋次數" value={stats?.total_searches ?? 0} />
              </Col>
              <Col span={12}>
                <Statistic title="平均延遲 (ms)" value={stats?.average_latency ?? 0} />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </UnifiedPageLayout>
  );
};

export default AISearch;
