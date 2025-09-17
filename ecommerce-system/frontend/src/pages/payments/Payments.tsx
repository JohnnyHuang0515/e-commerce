import React, { useMemo, useState } from 'react';
import { Button, Card, Form, Input, Modal, Select, Space, Table, Tag, Typography } from 'antd';
import { DollarOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

import UnifiedPageLayout from '../../components/common/UnifiedPageLayout';
import {
  usePayments,
  usePaymentStats,
  type PaymentListParams,
} from '../../hooks/usePayments';
import type { PaymentRecord, PaymentStatus, PaymentMethod } from '../../services/paymentService';

const { Option } = Select;
const { Text } = Typography;

interface PaymentFilterForm {
  orderId?: string;
  userId?: string;
  status?: PaymentStatus;
  method?: PaymentMethod;
}

const statusConfig: Record<PaymentStatus, { color: string; text: string }> = {
  pending: { color: 'orange', text: '待處理' },
  processing: { color: 'blue', text: '處理中' },
  completed: { color: 'green', text: '已完成' },
  failed: { color: 'red', text: '失敗' },
  cancelled: { color: 'default', text: '已取消' },
  refunded: { color: 'purple', text: '已退款' },
};

const methodLabels: Record<PaymentMethod, string> = {
  credit_card: '信用卡',
  paypal: 'PayPal',
  line_pay: 'LINE Pay',
  bank_transfer: '銀行轉帳',
  cash_on_delivery: '貨到付款',
};

const Payments: React.FC = () => {
  const [filters, setFilters] = useState<PaymentListParams>({ page: 1, limit: 10 });
  const [filterForm] = Form.useForm<PaymentFilterForm>();
  const [viewingPayment, setViewingPayment] = useState<PaymentRecord | null>(null);

  const { data: paymentsResponse, isLoading, refetch } = usePayments(filters);
  const { data: statsResponse } = usePaymentStats();

  const payments = paymentsResponse?.data.items ?? [];
  const pagination = paymentsResponse?.data;
  const stats = statsResponse?.data;

  const columns: ColumnsType<PaymentRecord> = useMemo(
    () => [
      {
        title: '支付 ID',
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
        title: '金額',
        dataIndex: 'amount',
        key: 'amount',
        width: 120,
        render: (amount: number, record) => (
          <Text strong>
            {record.currency} {(amount / 100).toFixed(2)}
          </Text>
        ),
      },
      {
        title: '支付方式',
        dataIndex: 'method',
        key: 'method',
        width: 140,
        render: (method: PaymentMethod) => <Tag color="blue">{methodLabels[method]}</Tag>,
      },
      {
        title: '狀態',
        dataIndex: 'status',
        key: 'status',
        width: 140,
        render: (status: PaymentStatus) => (
          <Tag color={statusConfig[status].color}>{statusConfig[status].text}</Tag>
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
        title: '操作',
        key: 'actions',
        width: 100,
        render: (_, record) => (
          <Button type="link" onClick={() => setViewingPayment(record)}>
            查看
          </Button>
        ),
      },
    ],
    []
  );

  const statsConfig = [
    {
      label: '支付總筆數',
      value: stats?.total ?? payments.length,
      icon: <DollarOutlined />,
      color: 'var(--primary-500)',
    },
    {
      label: '完成支付',
      value: stats?.completed ?? payments.filter((item) => item.status === 'completed').length,
      icon: <DollarOutlined />,
      color: 'var(--success-500)',
    },
    {
      label: '待處理',
      value: stats?.pending ?? payments.filter((item) => item.status === 'pending').length,
      icon: <DollarOutlined />,
      color: 'var(--warning-500)',
    },
    {
      label: '已退款',
      value: stats?.refunded ?? payments.filter((item) => item.status === 'refunded').length,
      icon: <DollarOutlined />,
      color: 'var(--info-500)',
    },
  ];

  function handleFilterSubmit(values: PaymentFilterForm) {
    setFilters((prev) => ({
      ...prev,
      page: 1,
      orderId: values.orderId?.trim() || undefined,
      userId: values.userId?.trim() || undefined,
      status: values.status || undefined,
      method: values.method || undefined,
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
      title="支付紀錄"
      subtitle="檢視近期支付情況與交易狀態"
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
        <Form<PaymentFilterForm>
          layout="inline"
          form={filterForm}
          onFinish={handleFilterSubmit}
          style={{ display: 'flex', gap: 12 }}
        >
          <Form.Item name="orderId">
            <Input placeholder="訂單 ID" allowClear style={{ width: 160 }} />
          </Form.Item>
          <Form.Item name="userId">
            <Input placeholder="用戶 ID" allowClear style={{ width: 160 }} />
          </Form.Item>
          <Form.Item name="status">
            <Select placeholder="狀態" allowClear style={{ width: 160 }}>
              {Object.entries(statusConfig).map(([value, config]) => (
                <Option key={value} value={value}>
                  {config.text}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="method">
            <Select placeholder="支付方式" allowClear style={{ width: 160 }}>
              {Object.entries(methodLabels).map(([value, label]) => (
                <Option key={value} value={value}>
                  {label}
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
        <Table<PaymentRecord>
          rowKey={(record) => record.id}
          columns={columns}
          dataSource={payments}
          loading={isLoading}
          pagination={{
            total: pagination?.total ?? payments.length,
            pageSize: pagination?.limit ?? filters.limit ?? 10,
            current: pagination?.page ?? filters.page ?? 1,
            onChange: handleTableChange,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
        />
      </Card>

      <Modal
        open={Boolean(viewingPayment)}
        title="支付詳情"
        onCancel={() => setViewingPayment(null)}
        footer={null}
      >
        {viewingPayment && (
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <div>
              <Text type="secondary">支付 ID</Text>
              <div><Text code>{viewingPayment.id}</Text></div>
            </div>
            <div>
              <Text type="secondary">訂單 ID</Text>
              <div><Text code>{viewingPayment.orderId}</Text></div>
            </div>
            <div>
              <Text type="secondary">用戶 ID</Text>
              <div><Text code>{viewingPayment.userId}</Text></div>
            </div>
            <div>
              <Text type="secondary">金額</Text>
              <div>
                <Text strong>
                  {viewingPayment.currency} {(viewingPayment.amount / 100).toFixed(2)}
                </Text>
              </div>
            </div>
            <div>
              <Text type="secondary">支付方式</Text>
              <Tag color="blue">{methodLabels[viewingPayment.method]}</Tag>
            </div>
            <div>
              <Text type="secondary">狀態</Text>
              <Tag color={statusConfig[viewingPayment.status].color}>
                {statusConfig[viewingPayment.status].text}
              </Tag>
            </div>
            {viewingPayment.provider && (
              <div>
                <Text type="secondary">支付平台</Text>
                <div>{viewingPayment.provider}</div>
              </div>
            )}
            {viewingPayment.transactionId && (
              <div>
                <Text type="secondary">交易序號</Text>
                <div><Text code>{viewingPayment.transactionId}</Text></div>
              </div>
            )}
            <div>
              <Text type="secondary">建立時間</Text>
              <div>{new Date(viewingPayment.createdAt).toLocaleString()}</div>
            </div>
            <div>
              <Text type="secondary">更新時間</Text>
              <div>{new Date(viewingPayment.updatedAt).toLocaleString()}</div>
            </div>
          </Space>
        )}
      </Modal>
    </UnifiedPageLayout>
  );
};

export default Payments;
