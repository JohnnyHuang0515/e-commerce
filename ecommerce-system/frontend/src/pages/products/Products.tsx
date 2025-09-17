import React, { useMemo, useState } from 'react';
import { Button, Card, Form, Input, Select, Space, Table, Tag, Typography } from 'antd';
import { ReloadOutlined, SearchOutlined, ShoppingOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

import UnifiedPageLayout from '../../components/common/UnifiedPageLayout';
import { useProducts, useProductStats, type ProductListParams } from '../../hooks/useProducts';
import type { ProductRecord, ProductStatus } from '../../services/productService';
import './Products.less';

const { Option } = Select;
const { Text } = Typography;

interface ProductFilterForm {
  search?: string;
  category?: string;
  status?: ProductStatus;
}

const statusLabels: Record<ProductStatus, { text: string; color: string }> = {
  active: { text: '上架', color: 'green' },
  inactive: { text: '下架', color: 'red' },
};

const Products: React.FC = () => {
  const [filters, setFilters] = useState<ProductListParams>({ page: 1, limit: 10 });
  const [filterForm] = Form.useForm<ProductFilterForm>();

  const { data: productsResponse, isLoading, refetch } = useProducts(filters);
  const { data: statsResponse } = useProductStats();

  const products = productsResponse?.data.items ?? [];
  const pagination = productsResponse?.data;
  const stats = statsResponse?.data;

  const columns: ColumnsType<ProductRecord> = useMemo(
    () => [
      {
        title: '商品名稱',
        dataIndex: 'name',
        key: 'name',
        render: (value: string, record) => (
          <Space direction="vertical" size={0}>
            <Text strong>{value}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              SKU：{record.sku}
            </Text>
          </Space>
        ),
      },
      {
        title: '分類',
        dataIndex: 'category',
        key: 'category',
        width: 160,
        render: (value?: string) => (value ? <Tag color="blue">{value}</Tag> : '—'),
      },
      {
        title: '價格',
        dataIndex: 'price',
        key: 'price',
        width: 120,
        render: (price: number) => <Text strong>NT$ {price.toLocaleString()}</Text>,
      },
      {
        title: '庫存',
        dataIndex: 'stock',
        key: 'stock',
        width: 120,
        render: (stock: number) => {
          const color = stock === 0 ? 'red' : stock < 10 ? 'orange' : 'green';
          return <Tag color={color}>{stock}</Tag>;
        },
      },
      {
        title: '狀態',
        dataIndex: 'status',
        key: 'status',
        width: 120,
        render: (status: ProductStatus) => (
          <Tag color={statusLabels[status].color}>{statusLabels[status].text}</Tag>
        ),
      },
      {
        title: '建立時間',
        dataIndex: 'createdAt',
        key: 'createdAt',
        width: 180,
        render: (value: string) => new Date(value).toLocaleString(),
      },
      {
        title: '更新時間',
        dataIndex: 'updatedAt',
        key: 'updatedAt',
        width: 180,
        render: (value: string) => new Date(value).toLocaleString(),
      },
    ],
    []
  );

  const statsConfig = [
    {
      label: '商品總數',
      value: stats?.total ?? products.length,
      icon: <ShoppingOutlined />,
      color: 'var(--primary-500)',
    },
    {
      label: '已上架',
      value: stats?.active ?? products.filter((item) => item.status === 'active').length,
      icon: <ShoppingOutlined />,
      color: 'var(--success-500)',
    },
    {
      label: '下架中',
      value: stats?.inactive ?? products.filter((item) => item.status === 'inactive').length,
      icon: <ShoppingOutlined />,
      color: 'var(--warning-500)',
    },
    {
      label: '庫存偏低',
      value: stats?.lowStock ?? products.filter((item) => item.stock > 0 && item.stock < 10).length,
      icon: <ShoppingOutlined />,
      color: 'var(--error-500)',
    },
  ];

  function handleFilterSubmit(values: ProductFilterForm) {
    setFilters((prev) => ({
      ...prev,
      page: 1,
      search: values.search?.trim() || undefined,
      category: values.category || undefined,
      status: values.status || undefined,
    }));
  }

  function handleTableChange(page: number, pageSize?: number) {
    setFilters((prev) => ({
      ...prev,
      page,
      limit: pageSize ?? prev.limit,
    }));
  }

  return (
    <UnifiedPageLayout
      title="商品列表"
      subtitle="管理與檢視商品資訊"
      stats={statsConfig}
      loading={isLoading}
      extra={
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
            重新整理
          </Button>
        </Space>
      }
      filters={
        <Form<ProductFilterForm>
          layout="inline"
          form={filterForm}
          onFinish={handleFilterSubmit}
          style={{ display: 'flex', gap: 12 }}
        >
          <Form.Item name="search">
            <Input placeholder="搜尋名稱或 SKU" allowClear style={{ width: 200 }} />
          </Form.Item>
          <Form.Item name="category">
            <Select placeholder="分類" allowClear style={{ width: 160 }}>
              <Option value="音訊設備">音訊設備</Option>
              <Option value="穿戴裝置">穿戴裝置</Option>
              <Option value="充電配件">充電配件</Option>
            </Select>
          </Form.Item>
          <Form.Item name="status">
            <Select placeholder="狀態" allowClear style={{ width: 160 }}>
              {Object.entries(statusLabels).map(([value, config]) => (
                <Option key={value} value={value}>
                  {config.text}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
              篩選
            </Button>
          </Form.Item>
        </Form>
      }
    >
      <Card bordered={false}>
        <Table<ProductRecord>
          rowKey={(record) => record.id}
          columns={columns}
          dataSource={products}
          loading={isLoading}
          pagination={{
            total: pagination?.total ?? products.length,
            pageSize: pagination?.limit ?? filters.limit ?? 10,
            current: pagination?.page ?? filters.page ?? 1,
            onChange: handleTableChange,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
        />
      </Card>
    </UnifiedPageLayout>
  );
};

export default Products;
