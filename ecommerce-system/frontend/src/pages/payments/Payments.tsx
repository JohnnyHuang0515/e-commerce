import React, { useMemo, useState } from 'react';
import { Button, Card, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Table, Tag, Typography, message } from 'antd';
import { DollarOutlined, DeleteOutlined, PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

import UnifiedPageLayout from '../../components/common/UnifiedPageLayout';
import {
  usePayments,
  usePaymentStats,
  useCreatePayment,
  useUpdatePayment,
  useDeletePayment,
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

interface PaymentFormValues {
  orderId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  currency: string;
  provider?: string;
  transactionId?: string;
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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm] = Form.useForm<PaymentFormValues>();
  const [editForm] = Form.useForm<PaymentFormValues>();
  const [editingPayment, setEditingPayment] = useState<PaymentRecord | null>(null);

  const { data: paymentsResponse, isLoading, refetch } = usePayments(filters);
  const { data: statsResponse } = usePaymentStats();
  const createPaymentMutation = useCreatePayment();
  const updatePaymentMutation = useUpdatePayment();
  const deletePaymentMutation = useDeletePayment();

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
          <Space>
            <Button type="link" onClick={() => setViewingPayment(record)}>
              查看
            </Button>
            <Button
              type="link"
              onClick={() => {
                setEditingPayment(record);
                editForm.setFieldsValue({
                  orderId: record.orderId,
                  amount: Number((record.amount ?? 0) / 100),
                  method: record.method,
                  status: record.status,
                  currency: record.currency,
                  provider: record.provider,
                  transactionId: record.transactionId,
                });
              }}
            >
              編輯
            </Button>
            <Popconfirm
              title="確定要刪除此支付紀錄嗎？"
              okText="刪除"
              cancelText="取消"
              okButtonProps={{ danger: true, loading: deletePaymentMutation.isPending }}
              onConfirm={async () => {
                try {
                  await deletePaymentMutation.mutateAsync(record.id);
                  message.success('支付紀錄已刪除');
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

  async function handleCreateSubmit(values: PaymentFormValues) {
    try {
      await createPaymentMutation.mutateAsync({
        orderId: values.orderId.trim(),
        amount: Math.round(Number(values.amount) * 100),
        method: values.method,
        status: values.status,
        currency: values.currency,
        provider: values.provider?.trim() || undefined,
        transactionId: values.transactionId?.trim() || undefined,
      });
      message.success('新增支付紀錄成功');
      setIsCreateModalOpen(false);
      createForm.resetFields();
      refetch();
    } catch (error) {
      const errorMessage = (error as any)?.response?.data?.message || (error as Error).message || '新增失敗';
      message.error(errorMessage);
    }
  }

  async function handleEditSubmit(values: PaymentFormValues) {
    if (!editingPayment) {
      return;
    }

    try {
      await updatePaymentMutation.mutateAsync({
        paymentId: editingPayment.id,
        payload: {
          amount: Math.round(Number(values.amount) * 100),
          method: values.method,
          status: values.status,
          currency: values.currency,
          provider: values.provider?.trim() || null,
          transactionId: values.transactionId?.trim() || null,
        },
      });

      message.success('更新支付紀錄成功');
      setEditingPayment(null);
      editForm.resetFields();
      refetch();
    } catch (error) {
      const errorMessage = (error as any)?.response?.data?.message || (error as Error).message || '更新失敗';
      message.error(errorMessage);
    }
  }

  return (
    <UnifiedPageLayout
      title="支付紀錄"
      subtitle="檢視近期支付情況與交易狀態"
      stats={statsConfig}
      loading={isLoading}
      extra={
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsCreateModalOpen(true)}>
            新增支付
          </Button>
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

      <Modal
        open={isCreateModalOpen}
        title="新增支付紀錄"
        onCancel={() => {
          setIsCreateModalOpen(false);
          createForm.resetFields();
        }}
        onOk={() => createForm.submit()}
        confirmLoading={createPaymentMutation.isPending}
      >
        <Form<PaymentFormValues>
          layout="vertical"
          form={createForm}
          onFinish={handleCreateSubmit}
          initialValues={{
            currency: 'TWD',
            status: 'pending',
            method: 'credit_card',
          }}
        >
          <Form.Item
            name="orderId"
            label="訂單 ID"
            rules={[{ required: true, message: '請輸入訂單 ID' }]}
          >
            <Input placeholder="請輸入訂單公開 ID" allowClear />
          </Form.Item>
          <Form.Item
            name="amount"
            label="金額"
            rules={[{ required: true, message: '請輸入金額' }]}
          >
            <InputNumber
              min={0.01}
              step={0.01}
              addonAfter="TWD"
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item name="currency" label="幣別" rules={[{ required: true }]}>
            <Input placeholder="如 TWD" maxLength={3} />
          </Form.Item>
          <Form.Item name="method" label="支付方式" rules={[{ required: true }]}>
            <Select>
              {Object.entries(methodLabels).map(([value, label]) => (
                <Option key={value} value={value}>
                  {label}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="status" label="狀態" rules={[{ required: true }]}>
            <Select>
              {Object.entries(statusConfig).map(([value, config]) => (
                <Option key={value} value={value}>
                  {config.text}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="provider" label="支付平台">
            <Input placeholder="如 Stripe" allowClear />
          </Form.Item>
          <Form.Item name="transactionId" label="交易序號">
            <Input placeholder="選填" allowClear />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={Boolean(editingPayment)}
        title="編輯支付紀錄"
        onCancel={() => {
          setEditingPayment(null);
          editForm.resetFields();
        }}
        onOk={() => editForm.submit()}
        confirmLoading={updatePaymentMutation.isPending}
      >
        <Form<PaymentFormValues>
          layout="vertical"
          form={editForm}
          onFinish={handleEditSubmit}
        >
          <Form.Item label="訂單 ID" name="orderId">
            <Input disabled />
          </Form.Item>
          <Form.Item
            name="amount"
            label="金額"
            rules={[{ required: true, message: '請輸入金額' }]}
          >
            <InputNumber min={0.01} step={0.01} addonAfter="TWD" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="currency" label="幣別" rules={[{ required: true }]}>
            <Input placeholder="如 TWD" maxLength={3} />
          </Form.Item>
          <Form.Item name="method" label="支付方式" rules={[{ required: true }]}>
            <Select>
              {Object.entries(methodLabels).map(([value, label]) => (
                <Option key={value} value={value}>
                  {label}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="status" label="狀態" rules={[{ required: true }]}>
            <Select>
              {Object.entries(statusConfig).map(([value, config]) => (
                <Option key={value} value={value}>
                  {config.text}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="provider" label="支付平台">
            <Input placeholder="如 Stripe" allowClear />
          </Form.Item>
          <Form.Item name="transactionId" label="交易序號">
            <Input placeholder="選填" allowClear />
          </Form.Item>
        </Form>
      </Modal>
    </UnifiedPageLayout>
  );
};

export default Payments;
