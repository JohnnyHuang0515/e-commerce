import React, { useMemo, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  message,
} from 'antd';
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  InboxOutlined,
  ReloadOutlined,
  SearchOutlined,
  ShopOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

import UnifiedPageLayout from '../../components/common/UnifiedPageLayout';
import {
  useAdjustStock,
  useInventories,
  useInventoryStats,
  useLowStockAlerts,
  useOutOfStockAlerts,
} from '../../hooks/useInventory';
import type { InventoryItem } from '../../types/api';
import type { InventoryListParams } from '../../services/inventoryService';

import './Inventory.less';

interface InventorySearchForm {
  search?: string;
  lowStock?: 'true' | 'false';
}

interface InventoryAdjustForm {
  adjustment: number;
  reason: string;
  notes?: string;
}

const { Option } = Select;

const Inventory: React.FC = () => {
  const [searchParams, setSearchParams] = useState<InventoryListParams>({ page: 1, limit: 10 });
  const [isAdjustModalVisible, setIsAdjustModalVisible] = useState(false);
  const [adjustingInventory, setAdjustingInventory] = useState<InventoryItem | null>(null);
  const [searchForm] = Form.useForm<InventorySearchForm>();
  const [adjustForm] = Form.useForm<InventoryAdjustForm>();

  const { data: inventoryResponse, isLoading, refetch } = useInventories(searchParams);
  const { data: lowStockAlerts } = useLowStockAlerts();
  const { data: outOfStockAlerts } = useOutOfStockAlerts();
  const { data: inventoryStats } = useInventoryStats();
  const adjustStockMutation = useAdjustStock();

  const inventoryData = inventoryResponse?.data;
  const lowStockItems = lowStockAlerts?.data ?? [];
  const outOfStockItems = outOfStockAlerts?.data ?? [];
  const stats = inventoryStats?.data;

  const handleView = (inventory: InventoryItem) => {
    Modal.info({
      title: `庫存詳情 - ${inventory.name}`,
      width: 600,
      content: (
        <div style={{ marginTop: 16 }}>
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="商品 ID" span={2}>
              <span style={{ fontFamily: 'monospace' }}>{inventory.public_id || inventory.product_id}</span>
            </Descriptions.Item>
            <Descriptions.Item label="SKU">{inventory.sku}</Descriptions.Item>
            <Descriptions.Item label="分類">{inventory.category_name || '未分類'}</Descriptions.Item>
            <Descriptions.Item label="品牌">{inventory.brand || '未設定'}</Descriptions.Item>
            <Descriptions.Item label="庫存數量">
              <Badge
                status={inventory.stock_quantity === 0 ? 'error' : inventory.stock_quantity <= 5 ? 'warning' : 'success'}
                text={`${inventory.stock_quantity}`}
              />
            </Descriptions.Item>
            <Descriptions.Item label="最小庫存">{inventory.min_stock_level ?? '-'}</Descriptions.Item>
            <Descriptions.Item label="商品狀態">
              <Tag color={inventory.status === 1 ? 'green' : 'red'}>
                {inventory.status === 1 ? '上架' : '下架'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="最後更新">
              {inventory.last_updated ? new Date(inventory.last_updated).toLocaleString() : '無記錄'}
            </Descriptions.Item>
          </Descriptions>
        </div>
      ),
    });
  };

  const handleAdjustStock = (inventory: InventoryItem) => {
    setAdjustingInventory(inventory);
    adjustForm.resetFields();
    setIsAdjustModalVisible(true);
  };

  const handleAdjustSubmit = async (values: InventoryAdjustForm) => {
    if (!adjustingInventory) return;

    try {
      await adjustStockMutation.mutateAsync({
        productId: adjustingInventory.public_id,
        data: {
          adjustment: values.adjustment,
          reason: values.reason,
          notes: values.notes,
        },
      });

      message.success('庫存調整成功');
      setIsAdjustModalVisible(false);
      setAdjustingInventory(null);
      adjustForm.resetFields();
    } catch (error) {
      const errorMessage = (error as any)?.response?.data?.message || (error as Error).message || '庫存調整失敗';
      message.error(errorMessage);
    }
  };

  const handleSearch = (values: InventorySearchForm) => {
    const nextParams: InventoryListParams = {
      page: 1,
      limit: searchParams.limit,
      search: values.search?.trim() || undefined,
    };

    if (values.lowStock === 'true') {
      nextParams.low_stock = true;
    } else if (values.lowStock === 'false') {
      nextParams.low_stock = false;
    }

    setSearchParams(nextParams);
  };

  const handleTableChange = (pagination: any) => {
    setSearchParams((prev) => ({
      ...prev,
      page: pagination.current,
      limit: pagination.pageSize,
    }));
  };

  const columns: ColumnsType<InventoryItem> = useMemo(
    () => [
      {
        title: '商品名稱',
        dataIndex: 'name',
        key: 'name',
        render: (text: string, record) => (
          <Space direction="vertical" size={0}>
            <span style={{ fontWeight: 600 }}>{text}</span>
            <span style={{ fontSize: 12, color: '#b0b0b0' }}>SKU: {record.sku}</span>
          </Space>
        ),
      },
      {
        title: '分類',
        dataIndex: 'category_name',
        key: 'category_name',
        width: 140,
        render: (value: string) => <Tag color="blue">{value || '未分類'}</Tag>,
      },
      {
        title: '品牌',
        dataIndex: 'brand',
        key: 'brand',
        width: 120,
        render: (value: string | number) => <Tag color="purple">{value || '未設定'}</Tag>,
      },
      {
        title: '庫存數量',
        dataIndex: 'stock_quantity',
        key: 'stock_quantity',
        width: 140,
        render: (stock: number) => {
          let color = '#52c41a';
          let statusText = '庫存正常';

          if (stock === 0) {
            color = '#ff4d4f';
            statusText = '缺貨';
          } else if (stock <= 5) {
            color = '#ff4d4f';
            statusText = '庫存不足';
          } else if (stock <= 10) {
            color = '#faad14';
            statusText = '庫存偏低';
          }

          return (
            <Space direction="vertical" size={0}>
              <span style={{ fontSize: 18, fontWeight: 600, color }}>{stock}</span>
              <span style={{ fontSize: 12, color }}>{statusText}</span>
            </Space>
          );
        },
      },
      {
        title: '狀態',
        dataIndex: 'status',
        key: 'status',
        width: 100,
        render: (status: number) => (
          <Tag color={status === 1 ? 'green' : 'red'}>{status === 1 ? '上架' : '下架'}</Tag>
        ),
      },
      {
        title: '最後更新',
        dataIndex: 'last_updated',
        key: 'last_updated',
        width: 160,
        render: (value?: string) => (value ? new Date(value).toLocaleString() : '-')
      },
      {
        title: '操作',
        key: 'actions',
        width: 140,
        fixed: 'right',
        render: (_, record) => (
          <Space size="middle">
            <Tooltip title="查看詳情">
              <Button type="text" icon={<EyeOutlined />} onClick={() => handleView(record)} />
            </Tooltip>
            <Tooltip title="庫存調整">
              <Button type="text" icon={<InboxOutlined />} onClick={() => handleAdjustStock(record)} />
            </Tooltip>
          </Space>
        ),
      },
    ],
    []
  );

  const statsConfig = useMemo(
    () => [
      {
        label: '總商品數',
        value: stats?.total_products ?? inventoryData?.total ?? 0,
        icon: <ShopOutlined />,
        color: 'var(--primary-500)',
      },
      {
        label: '缺貨商品',
        value: stats?.out_of_stock_count ?? outOfStockItems.length,
        icon: <ExclamationCircleOutlined />,
        color: 'var(--error-500)',
      },
      {
        label: '庫存不足',
        value: stats?.low_stock_count ?? lowStockItems.length,
        icon: <WarningOutlined />,
        color: 'var(--warning-500)',
      },
      {
        label: '庫存正常',
        value:
          (stats?.total_products ?? inventoryData?.total ?? 0) -
          (stats?.out_of_stock_count ?? outOfStockItems.length) -
          (stats?.low_stock_count ?? lowStockItems.length),
        icon: <CheckCircleOutlined />,
        color: 'var(--success-500)',
      },
    ],
    [inventoryData?.total, lowStockItems.length, outOfStockItems.length, stats]
  );

  const extraActions = (
    <Space>
      <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
        重新整理
      </Button>
    </Space>
  );

  const filtersContent = (
    <Form<InventorySearchForm> layout="inline" form={searchForm} onFinish={handleSearch}>
      <Form.Item name="search">
        <Input placeholder="搜尋商品名稱或 SKU" style={{ width: 220 }} allowClear />
      </Form.Item>
      <Form.Item name="lowStock">
        <Select placeholder="庫存狀態" allowClear style={{ width: 150 }}>
          <Option value="true">僅顯示低庫存</Option>
          <Option value="false">僅顯示正常庫存</Option>
        </Select>
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
          搜尋
        </Button>
      </Form.Item>
    </Form>
  );

  return (
    <UnifiedPageLayout
      title="庫存管理"
      subtitle="查看並調整商品庫存，掌握低庫存與缺貨狀態"
      extra={extraActions}
      stats={statsConfig}
      filters={filtersContent}
      onRefresh={() => refetch()}
      loading={isLoading}
    >
      {(lowStockItems.length > 0 || outOfStockItems.length > 0) && (
        <div style={{ marginBottom: 16 }}>
          {outOfStockItems.length > 0 && (
            <Alert
              message={`有 ${outOfStockItems.length} 個商品缺貨`}
              type="error"
              icon={<WarningOutlined />}
              style={{ marginBottom: 8 }}
              showIcon
            />
          )}
          {lowStockItems.length > 0 && (
            <Alert
              message={`有 ${lowStockItems.length} 個商品庫存不足`}
              type="warning"
              icon={<WarningOutlined />}
              showIcon
            />
          )}
        </div>
      )}

      <Card bodyStyle={{ padding: 0 }} bordered={false} className="dark-card">
        <Table<InventoryItem>
          columns={columns}
          dataSource={inventoryData?.items ?? []}
          loading={isLoading}
          rowKey={(record) => record.public_id || String(record.product_id)}
          onChange={handleTableChange}
          pagination={{
            total: inventoryData?.total ?? 0,
            pageSize: inventoryData?.limit ?? searchParams.limit ?? 10,
            current: inventoryData?.page ?? searchParams.page ?? 1,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 項，共 ${total} 項`,
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      <Modal
        open={isAdjustModalVisible}
        title={adjustingInventory ? `調整庫存 - ${adjustingInventory.name}` : '調整庫存'}
        onCancel={() => {
          setIsAdjustModalVisible(false);
          setAdjustingInventory(null);
        }}
        onOk={() => adjustForm.submit()}
        okText="確認調整"
        cancelText="取消"
        confirmLoading={adjustStockMutation.isPending}
      >
        <Form<InventoryAdjustForm> form={adjustForm} layout="vertical" onFinish={handleAdjustSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="adjustment"
                label="調整數量"
                rules={[{ required: true, message: '請輸入調整數量' }]}
              >
                <InputNumber style={{ width: '100%' }} min={-1000} max={1000} placeholder="可輸入正負數" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="reason"
                label="調整原因"
                rules={[{ required: true, message: '請選擇調整原因' }]}
              >
                <Select placeholder="選擇原因">
                  <Option value="purchase">進貨調整</Option>
                  <Option value="manual_correction">手動校正</Option>
                  <Option value="return">退貨入庫</Option>
                  <Option value="damage">損壞報廢</Option>
                  <Option value="inventory_check">盤點調整</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="notes" label="備註">
            <Input.TextArea rows={3} placeholder="可補充更多調整說明" />
          </Form.Item>
        </Form>
      </Modal>
    </UnifiedPageLayout>
  );
};

export default Inventory;
