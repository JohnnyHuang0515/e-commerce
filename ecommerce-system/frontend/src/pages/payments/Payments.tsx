import React, { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  DatePicker,
  message,
  Popconfirm,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  UndoOutlined,
  SearchOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { usePayments, useCreatePayment, useUpdatePayment, useDeletePayment, useRefundPayment } from '../../hooks/useApi';
import { Payment, PaymentCreateRequest } from '../../services/paymentService';
import type { ColumnsType } from 'antd/es/table';

const { Option } = Select;
const { RangePicker } = DatePicker;

const Payments: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [isRefundModalVisible, setIsRefundModalVisible] = useState(false);
  const [refundPayment, setRefundPayment] = useState<Payment | null>(null);
  const [searchParams, setSearchParams] = useState<any>({});
  const [form] = Form.useForm();
  const [refundForm] = Form.useForm();

  const { data: paymentsData, isLoading, refetch } = usePayments(searchParams);
  const createPaymentMutation = useCreatePayment();
  const updatePaymentMutation = useUpdatePayment();
  const deletePaymentMutation = useDeletePayment();
  const refundPaymentMutation = useRefundPayment();

  const handleAdd = () => {
    setEditingPayment(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (payment: Payment) => {
    setEditingPayment(payment);
    form.setFieldsValue({
      ...payment,
      amount: payment.amount / 100, // 轉換為元
    });
    setIsModalVisible(true);
  };

  const handleRefund = (payment: Payment) => {
    setRefundPayment(payment);
    refundForm.resetFields();
    setIsRefundModalVisible(true);
  };

  const handleSubmit = async (values: any) => {
    try {
      const paymentData: PaymentCreateRequest = {
        orderId: values.orderId,
        userId: values.userId,
        amount: Math.round(values.amount * 100), // 轉換為分
        currency: values.currency || 'TWD',
        paymentMethod: values.paymentMethod,
        paymentProvider: values.paymentProvider,
        metadata: values.metadata,
      };

      if (editingPayment) {
        await updatePaymentMutation.mutateAsync({
          paymentId: editingPayment._id,
          data: paymentData,
        });
        message.success('支付更新成功');
      } else {
        await createPaymentMutation.mutateAsync(paymentData);
        message.success('支付創建成功');
      }

      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('操作失敗');
    }
  };

  const handleRefundSubmit = async (values: any) => {
    if (!refundPayment) return;

    try {
      await refundPaymentMutation.mutateAsync({
        paymentId: refundPayment._id,
        amount: Math.round(values.amount * 100),
        reason: values.reason,
        metadata: values.metadata,
      });
      message.success('退款成功');
      setIsRefundModalVisible(false);
      refundForm.resetFields();
    } catch (error) {
      message.error('退款失敗');
    }
  };

  const handleDelete = async (paymentId: string) => {
    try {
      await deletePaymentMutation.mutateAsync(paymentId);
      message.success('支付刪除成功');
    } catch (error) {
      message.error('刪除失敗');
    }
  };

  const handleSearch = (values: any) => {
    setSearchParams({
      ...values,
      startDate: values.dateRange?.[0]?.format('YYYY-MM-DD'),
      endDate: values.dateRange?.[1]?.format('YYYY-MM-DD'),
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'orange',
      processing: 'blue',
      completed: 'green',
      failed: 'red',
      cancelled: 'gray',
      refunded: 'purple',
    };
    return colors[status] || 'default';
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      pending: '待處理',
      processing: '處理中',
      completed: '已完成',
      failed: '失敗',
      cancelled: '已取消',
      refunded: '已退款',
    };
    return texts[status] || status;
  };

  const columns: ColumnsType<Payment> = [
    {
      title: '支付ID',
      dataIndex: '_id',
      key: '_id',
      width: 100,
      render: (id: string) => (
        <Tooltip title={id}>
          <span style={{ fontFamily: 'monospace' }}>{id.slice(-8)}</span>
        </Tooltip>
      ),
    },
    {
      title: '訂單ID',
      dataIndex: 'orderId',
      key: 'orderId',
      width: 100,
      render: (orderId: string) => (
        <Tooltip title={orderId}>
          <span style={{ fontFamily: 'monospace' }}>{orderId.slice(-8)}</span>
        </Tooltip>
      ),
    },
    {
      title: '用戶ID',
      dataIndex: 'userId',
      key: 'userId',
      width: 100,
      render: (userId: string) => (
        <Tooltip title={userId}>
          <span style={{ fontFamily: 'monospace' }}>{userId.slice(-8)}</span>
        </Tooltip>
      ),
    },
    {
      title: '金額',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (amount: number, record: Payment) => (
        <span style={{ fontWeight: 'bold', color: '#1890ff' }}>
          {record.currency} {(amount / 100).toFixed(2)}
        </span>
      ),
    },
    {
      title: '狀態',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      ),
    },
    {
      title: '支付方式',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      width: 120,
      render: (method: string) => {
        const methodTexts: Record<string, string> = {
          credit_card: '信用卡',
          debit_card: '簽帳卡',
          paypal: 'PayPal',
          line_pay: 'Line Pay',
          bank_transfer: '銀行轉帳',
        };
        return methodTexts[method] || method;
      },
    },
    {
      title: '支付商',
      dataIndex: 'paymentProvider',
      key: 'paymentProvider',
      width: 100,
      render: (provider: string) => {
        const providerTexts: Record<string, string> = {
          stripe: 'Stripe',
          paypal: 'PayPal',
          line_pay: 'Line Pay',
          bank: '銀行',
        };
        return providerTexts[provider] || provider;
      },
    },
    {
      title: '交易ID',
      dataIndex: 'transactionId',
      key: 'transactionId',
      width: 120,
      render: (transactionId: string) => (
        transactionId ? (
          <Tooltip title={transactionId}>
            <span style={{ fontFamily: 'monospace' }}>{transactionId.slice(-8)}</span>
          </Tooltip>
        ) : '-'
      ),
    },
    {
      title: '創建時間',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      fixed: 'right',
      render: (_, record: Payment) => (
        <Space size="small">
          <Tooltip title="查看詳情">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="編輯">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          {record.status === 'completed' && (
            <Tooltip title="退款">
              <Button
                type="text"
                icon={<UndoOutlined />}
                onClick={() => handleRefund(record)}
              />
            </Tooltip>
          )}
          <Popconfirm
            title="確定要刪除這個支付記錄嗎？"
            onConfirm={() => handleDelete(record._id)}
            okText="確定"
            cancelText="取消"
          >
            <Tooltip title="刪除">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card>
        <div style={{ marginBottom: 16 }}>
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
            >
              新增支付
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => refetch()}
            >
              刷新
            </Button>
          </Space>
        </div>

        <Form
          layout="inline"
          onFinish={handleSearch}
          style={{ marginBottom: 16 }}
        >
          <Form.Item name="status">
            <Select placeholder="支付狀態" allowClear style={{ width: 120 }}>
              <Option value="pending">待處理</Option>
              <Option value="processing">處理中</Option>
              <Option value="completed">已完成</Option>
              <Option value="failed">失敗</Option>
              <Option value="cancelled">已取消</Option>
              <Option value="refunded">已退款</Option>
            </Select>
          </Form.Item>
          <Form.Item name="paymentMethod">
            <Select placeholder="支付方式" allowClear style={{ width: 120 }}>
              <Option value="credit_card">信用卡</Option>
              <Option value="debit_card">簽帳卡</Option>
              <Option value="paypal">PayPal</Option>
              <Option value="line_pay">Line Pay</Option>
              <Option value="bank_transfer">銀行轉帳</Option>
            </Select>
          </Form.Item>
          <Form.Item name="paymentProvider">
            <Select placeholder="支付商" allowClear style={{ width: 120 }}>
              <Option value="stripe">Stripe</Option>
              <Option value="paypal">PayPal</Option>
              <Option value="line_pay">Line Pay</Option>
              <Option value="bank">銀行</Option>
            </Select>
          </Form.Item>
          <Form.Item name="dateRange">
            <RangePicker />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
              搜尋
            </Button>
          </Form.Item>
        </Form>

        <Table
          columns={columns}
          dataSource={paymentsData?.data?.items || []}
          loading={isLoading}
          rowKey="_id"
          scroll={{ x: 1200 }}
          pagination={{
            total: paymentsData?.data?.total || 0,
            pageSize: paymentsData?.data?.limit || 10,
            current: paymentsData?.data?.page || 1,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `第 ${range[0]}-${range[1]} 項，共 ${total} 項`,
          }}
        />
      </Card>

      {/* 新增/編輯支付 Modal */}
      <Modal
        title={editingPayment ? '編輯支付' : '新增支付'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="orderId"
            label="訂單ID"
            rules={[{ required: true, message: '請輸入訂單ID' }]}
          >
            <Input placeholder="請輸入訂單ID" />
          </Form.Item>
          <Form.Item
            name="userId"
            label="用戶ID"
            rules={[{ required: true, message: '請輸入用戶ID' }]}
          >
            <Input placeholder="請輸入用戶ID" />
          </Form.Item>
          <Form.Item
            name="amount"
            label="金額"
            rules={[{ required: true, message: '請輸入金額' }]}
          >
            <InputNumber
              placeholder="請輸入金額"
              min={0}
              precision={2}
              style={{ width: '100%' }}
              addonAfter="元"
            />
          </Form.Item>
          <Form.Item
            name="currency"
            label="貨幣"
            initialValue="TWD"
          >
            <Select>
              <Option value="TWD">台幣 (TWD)</Option>
              <Option value="USD">美元 (USD)</Option>
              <Option value="EUR">歐元 (EUR)</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="paymentMethod"
            label="支付方式"
            rules={[{ required: true, message: '請選擇支付方式' }]}
          >
            <Select placeholder="請選擇支付方式">
              <Option value="credit_card">信用卡</Option>
              <Option value="debit_card">簽帳卡</Option>
              <Option value="paypal">PayPal</Option>
              <Option value="line_pay">Line Pay</Option>
              <Option value="bank_transfer">銀行轉帳</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="paymentProvider"
            label="支付商"
            rules={[{ required: true, message: '請選擇支付商' }]}
          >
            <Select placeholder="請選擇支付商">
              <Option value="stripe">Stripe</Option>
              <Option value="paypal">PayPal</Option>
              <Option value="line_pay">Line Pay</Option>
              <Option value="bank">銀行</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={createPaymentMutation.isPending || updatePaymentMutation.isPending}>
                {editingPayment ? '更新' : '創建'}
              </Button>
              <Button onClick={() => setIsModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 退款 Modal */}
      <Modal
        title="退款"
        open={isRefundModalVisible}
        onCancel={() => setIsRefundModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form
          form={refundForm}
          layout="vertical"
          onFinish={handleRefundSubmit}
        >
          <Form.Item
            name="amount"
            label="退款金額"
            rules={[{ required: true, message: '請輸入退款金額' }]}
          >
            <InputNumber
              placeholder="請輸入退款金額"
              min={0}
              max={refundPayment ? refundPayment.amount / 100 : undefined}
              precision={2}
              style={{ width: '100%' }}
              addonAfter="元"
            />
          </Form.Item>
          <Form.Item
            name="reason"
            label="退款原因"
            rules={[{ required: true, message: '請輸入退款原因' }]}
          >
            <Input.TextArea
              placeholder="請輸入退款原因"
              rows={3}
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={refundPaymentMutation.isPending}>
                確認退款
              </Button>
              <Button onClick={() => setIsRefundModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Payments;
