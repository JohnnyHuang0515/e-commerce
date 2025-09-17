import React, { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import { DeleteOutlined, EnvironmentOutlined, PlusOutlined, ReloadOutlined, SearchOutlined, TruckOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

import UnifiedPageLayout from '../../components/common/UnifiedPageLayout';
import {
  useShipments,
  useLogisticsStats,
  useCreateShipment,
  useUpdateShipment,
  useDeleteShipment,
  type LogisticsListParams,
} from '../../hooks/useLogistics';
import type { ShipmentRecord, ShipmentStatus } from '../../services/logisticsService';

const { Option } = Select;
const { Text } = Typography;

interface LogisticsFilterForm {
  status?: ShipmentStatus;
  provider?: string;
  method?: string;
}

interface ShipmentFormValues {
  orderId: string;
  status: ShipmentStatus;
  provider?: string;
  method?: string;
  trackingNumber?: string;
  destinationName?: string;
  destinationCity?: string;
  destinationDistrict?: string;
  destinationAddress?: string;
  estimatedDelivery?: dayjs.Dayjs;
}

const statusLabels: Record<ShipmentStatus, { text: string; color: string }> = {
  pending: { text: '待處理', color: 'orange' },
  processing: { text: '處理中', color: 'blue' },
  in_transit: { text: '運送中', color: 'purple' },
  out_for_delivery: { text: '配送中', color: 'cyan' },
  delivered: { text: '已送達', color: 'green' },
  failed: { text: '配送失敗', color: 'red' },
  returned: { text: '已退回', color: 'default' },
  cancelled: { text: '已取消', color: 'default' },
};

const Logistics: React.FC = () => {
  const [filters, setFilters] = useState<LogisticsListParams>({ page: 1, limit: 10 });
  const [filterForm] = Form.useForm<LogisticsFilterForm>();
  const [viewingShipment, setViewingShipment] = useState<ShipmentRecord | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm] = Form.useForm<ShipmentFormValues>();
  const [editForm] = Form.useForm<ShipmentFormValues>();
  const [editingShipment, setEditingShipment] = useState<ShipmentRecord | null>(null);

  const { data: shipmentsResponse, isLoading, refetch } = useShipments(filters);
  const { data: statsResponse } = useLogisticsStats();
  const createShipmentMutation = useCreateShipment();
  const updateShipmentMutation = useUpdateShipment();
  const deleteShipmentMutation = useDeleteShipment();

  const shipments = shipmentsResponse?.data.items ?? [];
  const pagination = shipmentsResponse?.data;
  const stats = statsResponse?.data;

  const columns: ColumnsType<ShipmentRecord> = useMemo(
    () => [
      {
        title: '物流 ID',
        dataIndex: 'id',
        key: 'id',
        width: 160,
        render: (id: string) => <Text code>{id}</Text>,
      },
      {
        title: '訂單 ID',
        dataIndex: 'orderId',
        key: 'orderId',
        width: 140,
        render: (value: string) => <Text code>{value}</Text>,
      },
      {
        title: '用戶 ID',
        dataIndex: 'userId',
        key: 'userId',
        width: 140,
        render: (value: string) => <Text code>{value}</Text>,
      },
      {
        title: '物流商',
        dataIndex: 'provider',
        key: 'provider',
        width: 160,
      },
      {
        title: '配送方式',
        dataIndex: 'method',
        key: 'method',
        width: 140,
      },
      {
        title: '狀態',
        dataIndex: 'status',
        key: 'status',
        width: 140,
        render: (status: ShipmentStatus) => (
          <Tag color={statusLabels[status].color}>{statusLabels[status].text}</Tag>
        ),
      },
      {
        title: '目的地',
        dataIndex: 'destination',
        key: 'destination',
        render: (destination: ShipmentRecord['destination']) => (
          <div>
            <div>{destination.name}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {destination.city} {destination.district} {destination.address}
            </Text>
          </div>
        ),
      },
      {
        title: '更新時間',
        dataIndex: 'updatedAt',
        key: 'updatedAt',
        width: 180,
        render: (value: string) => new Date(value).toLocaleString(),
      },
      {
        title: '操作',
        key: 'actions',
        width: 100,
        render: (_, record) => (
          <Space>
            <Button type="link" onClick={() => setViewingShipment(record)}>
              查看
            </Button>
            <Button
              type="link"
              onClick={() => {
                setEditingShipment(record);
                editForm.setFieldsValue({
                  orderId: record.orderId,
                  status: record.status,
                  provider: record.provider,
                  method: record.method,
                  trackingNumber: record.trackingNumber,
                  destinationName: record.destination?.name,
                  destinationCity: record.destination?.city,
                  destinationDistrict: record.destination?.district,
                  destinationAddress: record.destination?.address,
                  estimatedDelivery: record.estimatedDelivery ? dayjs(record.estimatedDelivery) : undefined,
                });
              }}
            >
              編輯
            </Button>
            <Popconfirm
              title="確定要刪除此物流紀錄嗎？"
              okText="刪除"
              cancelText="取消"
              okButtonProps={{ danger: true, loading: deleteShipmentMutation.isPending }}
              onConfirm={async () => {
                try {
                  await deleteShipmentMutation.mutateAsync(record.id);
                  message.success('物流紀錄已刪除');
                  refetch();
                } catch (error) {
                  const errorMessage = (error as any)?.response?.data?.message || (error as Error).message || '刪除失敗';
                  message.error(errorMessage);
                }
              }}
            >
              <Button type="link" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        ),
      },
    ],
    []
  );

  const statsConfig = [
    {
      label: '物流任務',
      value: stats?.total ?? shipments.length,
      icon: <TruckOutlined />,
      color: 'var(--primary-500)',
    },
    {
      label: '運送中',
      value: stats?.inTransit ?? shipments.filter((item) => item.status === 'in_transit').length,
      icon: <EnvironmentOutlined />,
      color: 'var(--info-500)',
    },
    {
      label: '已送達',
      value: stats?.delivered ?? shipments.filter((item) => item.status === 'delivered').length,
      icon: <EnvironmentOutlined />,
      color: 'var(--success-500)',
    },
    {
      label: '待處理',
      value: stats?.pending ?? shipments.filter((item) => item.status === 'pending').length,
      icon: <EnvironmentOutlined />,
      color: 'var(--warning-500)',
    },
  ];

  function handleFilterSubmit(values: LogisticsFilterForm) {
    setFilters((prev) => ({
      ...prev,
      page: 1,
      status: values.status || undefined,
      provider: values.provider?.trim() || undefined,
      method: values.method?.trim() || undefined,
    }));
  }

  function handleTableChange(page: number, pageSize?: number) {
    setFilters((prev) => ({
      ...prev,
      page,
      limit: pageSize ?? prev.limit,
    }));
  }

  function normalizeDestination(values: ShipmentFormValues, mode: 'create' | 'update') {
    const formatValue = (input?: string) => {
      const trimmed = input?.trim();
      if (!trimmed) {
        return mode === 'update' ? null : undefined;
      }
      return trimmed;
    };

    const destination = {
      name: formatValue(values.destinationName),
      city: formatValue(values.destinationCity),
      district: formatValue(values.destinationDistrict),
      address: formatValue(values.destinationAddress),
    };

    const hasValue = Object.values(destination).some((value) => value && value !== null);

    if (!hasValue && mode === 'create') {
      return undefined;
    }

    if (!hasValue && mode === 'update') {
      return {
        name: null,
        city: null,
        district: null,
        address: null,
      };
    }

    return destination;
  }

  async function handleCreateSubmit(values: ShipmentFormValues) {
    try {
      await createShipmentMutation.mutateAsync({
        orderId: values.orderId.trim(),
        status: values.status,
        provider: values.provider?.trim() || undefined,
        method: values.method?.trim() || undefined,
        trackingNumber: values.trackingNumber?.trim() || undefined,
        destination: normalizeDestination(values, 'create'),
        estimatedDelivery: values.estimatedDelivery?.toISOString(),
      });
      message.success('新增物流紀錄成功');
      setIsCreateModalOpen(false);
      createForm.resetFields();
      refetch();
    } catch (error) {
      const errorMessage = (error as any)?.response?.data?.message || (error as Error).message || '新增失敗';
      message.error(errorMessage);
    }
  }

  async function handleEditSubmit(values: ShipmentFormValues) {
    if (!editingShipment) {
      return;
    }

    try {
      await updateShipmentMutation.mutateAsync({
        shipmentId: editingShipment.id,
        payload: {
          status: values.status,
          provider: values.provider?.trim() || null,
          method: values.method?.trim() || null,
          trackingNumber: values.trackingNumber?.trim() || null,
          destination: normalizeDestination(values, 'update'),
          estimatedDelivery: values.estimatedDelivery ? values.estimatedDelivery.toISOString() : null,
        },
      });

      message.success('更新物流紀錄成功');
      setEditingShipment(null);
      editForm.resetFields();
      refetch();
    } catch (error) {
      const errorMessage = (error as any)?.response?.data?.message || (error as Error).message || '更新失敗';
      message.error(errorMessage);
    }
  }

  return (
    <UnifiedPageLayout
      title="物流配送"
      subtitle="掌握訂單配送進度與物流狀態"
      stats={statsConfig}
      loading={isLoading}
      extra={
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsCreateModalOpen(true)}>
            新增物流
          </Button>
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
            重新整理
          </Button>
        </Space>
      }
      filters={
        <Form<LogisticsFilterForm>
          layout="inline"
          form={filterForm}
          onFinish={handleFilterSubmit}
          style={{ display: 'flex', gap: 12 }}
        >
          <Form.Item name="status">
            <Select placeholder="配送狀態" allowClear style={{ width: 180 }}>
              {Object.entries(statusLabels).map(([value, config]) => (
                <Option key={value} value={value}>
                  {config.text}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="provider">
            <Select placeholder="物流商" allowClear style={{ width: 180 }}>
              <Option value="黑貓宅急便">黑貓宅急便</Option>
              <Option value="新竹物流">新竹物流</Option>
              <Option value="順豐速運">順豐速運</Option>
            </Select>
          </Form.Item>
          <Form.Item name="method">
            <Select placeholder="配送方式" allowClear style={{ width: 180 }}>
              <Option value="宅配">宅配</Option>
              <Option value="超商取貨">超商取貨</Option>
              <Option value="郵局">郵寄</Option>
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
        <Table<ShipmentRecord>
          rowKey={(record) => record.id}
          columns={columns}
          dataSource={shipments}
          loading={isLoading}
          pagination={{
            total: pagination?.total ?? shipments.length,
            pageSize: pagination?.limit ?? filters.limit ?? 10,
            current: pagination?.page ?? filters.page ?? 1,
            onChange: handleTableChange,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
        />
      </Card>

      <Modal
        open={Boolean(viewingShipment)}
        title="物流詳情"
        onCancel={() => setViewingShipment(null)}
        footer={null}
      >
        {viewingShipment && (
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <div>
              <Text type="secondary">物流 ID</Text>
              <div><Text code>{viewingShipment.id}</Text></div>
            </div>
            <div>
              <Text type="secondary">訂單 ID</Text>
              <div><Text code>{viewingShipment.orderId}</Text></div>
            </div>
            <div>
              <Text type="secondary">用戶 ID</Text>
              <div><Text code>{viewingShipment.userId}</Text></div>
            </div>
            <div>
              <Text type="secondary">物流商</Text>
              <div>{viewingShipment.provider}</div>
            </div>
            <div>
              <Text type="secondary">配送方式</Text>
              <div>{viewingShipment.method}</div>
            </div>
            <div>
              <Text type="secondary">狀態</Text>
              <Tag color={statusLabels[viewingShipment.status].color}>
                {statusLabels[viewingShipment.status].text}
              </Tag>
            </div>
            {viewingShipment.trackingNumber && (
              <div>
                <Text type="secondary">追蹤編號</Text>
                <div><Text code>{viewingShipment.trackingNumber}</Text></div>
              </div>
            )}
            {viewingShipment.estimatedDelivery && (
              <div>
                <Text type="secondary">預計送達</Text>
                <div>{new Date(viewingShipment.estimatedDelivery).toLocaleString()}</div>
              </div>
            )}
            <div>
              <Text type="secondary">目的地</Text>
              <div>
                {viewingShipment.destination.name}
                <div style={{ fontSize: 12 }}>
                  {viewingShipment.destination.city} {viewingShipment.destination.district}{' '}
                  {viewingShipment.destination.address}
                </div>
              </div>
            </div>
            <div>
              <Text type="secondary">建立時間</Text>
              <div>{new Date(viewingShipment.createdAt).toLocaleString()}</div>
            </div>
            <div>
              <Text type="secondary">更新時間</Text>
              <div>{new Date(viewingShipment.updatedAt).toLocaleString()}</div>
            </div>
          </Space>
        )}
      </Modal>

      <Modal
        open={isCreateModalOpen}
        title="新增物流紀錄"
        onCancel={() => {
          setIsCreateModalOpen(false);
          createForm.resetFields();
        }}
        onOk={() => createForm.submit()}
        confirmLoading={createShipmentMutation.isPending}
      >
        <Form<ShipmentFormValues>
          layout="vertical"
          form={createForm}
          onFinish={handleCreateSubmit}
          initialValues={{
            status: 'pending',
          }}
        >
          <Form.Item name="orderId" label="訂單 ID" rules={[{ required: true, message: '請輸入訂單 ID' }]}>
            <Input placeholder="請輸入訂單公開 ID" allowClear />
          </Form.Item>
          <Form.Item name="status" label="狀態" rules={[{ required: true, message: '請選擇狀態' }]}>
            <Select>
              {Object.entries(statusLabels).map(([value, config]) => (
                <Option key={value} value={value}>
                  {config.text}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="provider" label="物流商">
            <Input placeholder="如 黑貓宅急便" allowClear />
          </Form.Item>
          <Form.Item name="method" label="配送方式">
            <Input placeholder="如 宅配" allowClear />
          </Form.Item>
          <Form.Item name="trackingNumber" label="追蹤編號">
            <Input placeholder="選填" allowClear />
          </Form.Item>
          <Form.Item name="destinationName" label="收件人">
            <Input allowClear />
          </Form.Item>
          <Form.Item name="destinationCity" label="城市">
            <Input allowClear />
          </Form.Item>
          <Form.Item name="destinationDistrict" label="行政區">
            <Input allowClear />
          </Form.Item>
          <Form.Item name="destinationAddress" label="地址">
            <Input allowClear />
          </Form.Item>
          <Form.Item name="estimatedDelivery" label="預計送達">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={Boolean(editingShipment)}
        title="編輯物流紀錄"
        onCancel={() => {
          setEditingShipment(null);
          editForm.resetFields();
        }}
        onOk={() => editForm.submit()}
        confirmLoading={updateShipmentMutation.isPending}
      >
        <Form<ShipmentFormValues> layout="vertical" form={editForm} onFinish={handleEditSubmit}>
          <Form.Item name="orderId" label="訂單 ID">
            <Input disabled />
          </Form.Item>
          <Form.Item name="status" label="狀態" rules={[{ required: true, message: '請選擇狀態' }]}>
            <Select>
              {Object.entries(statusLabels).map(([value, config]) => (
                <Option key={value} value={value}>
                  {config.text}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="provider" label="物流商">
            <Input allowClear />
          </Form.Item>
          <Form.Item name="method" label="配送方式">
            <Input allowClear />
          </Form.Item>
          <Form.Item name="trackingNumber" label="追蹤編號">
            <Input allowClear />
          </Form.Item>
          <Form.Item name="destinationName" label="收件人">
            <Input allowClear />
          </Form.Item>
          <Form.Item name="destinationCity" label="城市">
            <Input allowClear />
          </Form.Item>
          <Form.Item name="destinationDistrict" label="行政區">
            <Input allowClear />
          </Form.Item>
          <Form.Item name="destinationAddress" label="地址">
            <Input allowClear />
          </Form.Item>
          <Form.Item name="estimatedDelivery" label="預計送達">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </UnifiedPageLayout>
  );
};

export default Logistics;
