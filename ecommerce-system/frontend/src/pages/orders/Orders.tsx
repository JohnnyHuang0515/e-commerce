import React, { useState } from 'react';
import { 
  Row, 
  Col, 
  Card, 
  Table, 
  Button, 
  Input, 
  Select, 
  Space, 
  Tag, 
  Popconfirm, 
  message,
  Modal,
  Descriptions,
  Badge,
  Form
} from 'antd';
import { 
  EyeOutlined, 
  CheckOutlined,
  TruckOutlined,
  CloseOutlined,
  ReloadOutlined,
  ExportOutlined,
  PlusOutlined
} from '@ant-design/icons';
import PageHeader from '../../components/common/PageHeader';
import { useOrders, useCreateOrder, useUpdateOrder, useOrderStats } from '../../hooks/useApi';
import OrderService from '../../services/orderService';
import './Orders.less';

const { Search } = Input;
const { Option } = Select;

const Orders: React.FC = () => {
  const [searchParams, setSearchParams] = useState({
    page: 1,
    limit: 10,
    search: '',
    status: '',
    dateFrom: '',
    dateTo: '',
    sortBy: 'createdAt',
    sortOrder: 'desc' as 'asc' | 'desc',
  });
  
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [form] = Form.useForm();

  // API hooks
  const { data: ordersData, isLoading, refetch } = useOrders(searchParams);
  const createOrderMutation = useCreateOrder();
  const updateOrderMutation = useUpdateOrder();
  const { data: statsData } = useOrderStats();

  const orders = ordersData?.data?.items || [];
  const total = ordersData?.data?.total || 0;
  const stats = statsData?.data || {
    total: 0,
    pending: 0,
    shipped: 0,
    totalRevenue: 0,
  };

  // 表格列定義
  const columns = [
    {
      title: '訂單號',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      width: 120,
      render: (orderNumber: string) => (
        <span style={{ fontFamily: 'monospace', fontWeight: 500 }}>
          {orderNumber}
        </span>
      ),
    },
    {
      title: '客戶信息',
      dataIndex: 'userId',
      key: 'customer',
      width: 150,
      render: (userId: string, record: any) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.shipping?.address?.name || '未知客戶'}</div>
          <div style={{ fontSize: 12, color: '#666' }}>ID: {userId}</div>
        </div>
      ),
    },
    {
      title: '商品數量',
      dataIndex: 'items',
      key: 'itemCount',
      width: 80,
      render: (items: any[]) => (
        <Badge count={items?.length || 0} showZero color="#1890ff" />
      ),
    },
    {
      title: '訂單金額',
      dataIndex: 'total',
      key: 'total',
      width: 120,
      render: (total: number) => (
        <span style={{ fontWeight: 500, color: '#1890ff' }}>
          {total.toFixed(2)}
        </span>
      ),
    },
    {
      title: '支付狀態',
      dataIndex: ['payment', 'status'],
      key: 'paymentStatus',
      width: 100,
      render: (status: string) => {
        const statusConfig = {
          pending: { color: 'orange', text: '待支付' },
          paid: { color: 'green', text: '已支付' },
          failed: { color: 'red', text: '支付失敗' },
          refunded: { color: 'blue', text: '已退款' },
        };
        const config = statusConfig[status as keyof typeof statusConfig];
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '訂單狀態',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const statusConfig = {
          pending: { color: 'orange', text: '待確認' },
          confirmed: { color: 'blue', text: '已確認' },
          processing: { color: 'purple', text: '處理中' },
          shipped: { color: 'cyan', text: '已發貨' },
          delivered: { color: 'green', text: '已送達' },
          cancelled: { color: 'red', text: '已取消' },
          returned: { color: 'volcano', text: '已退貨' },
        };
        const config = statusConfig[status as keyof typeof statusConfig];
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '創建時間',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EyeOutlined />}
            size="small"
            onClick={() => handleViewDetail(record)}
          />
          {record.status === 'pending' && (
            <Popconfirm
              title="確定要確認這個訂單嗎？"
              onConfirm={() => handleConfirmOrder(record.id)}
              okText="確定"
              cancelText="取消"
            >
              <Button
                type="text"
                icon={<CheckOutlined />}
                size="small"
                style={{ color: '#52c41a' }}
              />
            </Popconfirm>
          )}
          {record.status === 'confirmed' && (
            <Popconfirm
              title="確定要發貨嗎？"
              onConfirm={() => handleShipOrder(record.id)}
              okText="確定"
              cancelText="取消"
            >
              <Button
                type="text"
                icon={<TruckOutlined />}
                size="small"
                style={{ color: '#1890ff' }}
              />
            </Popconfirm>
          )}
          {['pending', 'confirmed'].includes(record.status) && (
            <Popconfirm
              title="確定要取消這個訂單嗎？"
              onConfirm={() => handleCancelOrder(record.id)}
              okText="確定"
              cancelText="取消"
            >
              <Button
                type="text"
                icon={<CloseOutlined />}
                size="small"
                danger
              />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  // 處理函數
  const handleSearch = (value: string) => {
    setSearchParams(prev => ({ ...prev, search: value, page: 1 }));
  };

  const handleStatusChange = (value: string) => {
    setSearchParams(prev => ({ ...prev, status: value, page: 1 }));
  };

  const handleTableChange = (pagination: any, _filters: any, sorter: any) => {
    setSearchParams(prev => ({
      ...prev,
      page: pagination.current,
      limit: pagination.pageSize,
      sortBy: sorter.field || 'createdAt',
      sortOrder: sorter.order === 'ascend' ? 'asc' : 'desc',
    }));
  };

  const handleViewDetail = (order: any) => {
    setSelectedOrder(order);
    setDetailModalVisible(true);
  };

  const handleConfirmOrder = async (orderId: string) => {
    try {
      await updateOrderMutation.mutateAsync({ orderId, status: 'confirmed' });
      message.success('訂單確認成功');
      refetch();
    } catch (error: any) {
      message.error(error.message || '操作失敗');
    }
  };

  const handleShipOrder = async (orderId: string) => {
    try {
      const trackingNumber = `TRK${Date.now()}`;
      await updateOrderMutation.mutateAsync({ 
        orderId, 
        status: 'shipped',
        shipping: { trackingNumber }
      });
      message.success('訂單發貨成功');
      refetch();
    } catch (error: any) {
      message.error(error.message || '操作失敗');
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      await updateOrderMutation.mutateAsync({ orderId, status: 'cancelled' });
      message.success('訂單取消成功');
      refetch();
    } catch (error: any) {
      message.error(error.message || '操作失敗');
    }
  };

  const handleExport = async () => {
    try {
      const blob = await OrderService.exportOrders(searchParams);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orders-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      message.success('導出成功');
    } catch (error: any) {
      message.error(error.message || '導出失敗');
    }
  };

  const handleCreateOrder = async (values: any) => {
    try {
      await createOrderMutation.mutateAsync(values);
      message.success('訂單創建成功');
      setModalVisible(false);
      form.resetFields();
      refetch();
    } catch (error: any) {
      message.error(error.message || '創建失敗');
    }
  };

  return (
    <div className="orders-page">
      <PageHeader
        title="訂單管理"
        subtitle="管理訂單狀態和物流信息"
        extra={
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
              新增訂單
            </Button>
            <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
              刷新
            </Button>
            <Button icon={<ExportOutlined />} onClick={handleExport}>
              導出
            </Button>
          </Space>
        }
      />

      {/* 統計卡片 */}
      <Row gutter={[16, 16]} className="stats-row">
        <Col xs={12} sm={6}>
          <Card size="small">
            <div className="stat-item">
              <div className="stat-value">{stats.total || 0}</div>
              <div className="stat-label">總訂單</div>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <div className="stat-item">
              <div className="stat-value" style={{ color: '#52c41a' }}>
                {stats.pending || 0}
              </div>
              <div className="stat-label">待處理</div>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <div className="stat-item">
              <div className="stat-value" style={{ color: '#1890ff' }}>
                {stats.shipped || 0}
              </div>
              <div className="stat-label">已發貨</div>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <div className="stat-item">
              <div className="stat-value" style={{ color: '#722ed1' }}>
                {(stats.totalRevenue || 0).toLocaleString()}
              </div>
              <div className="stat-label">總收入</div>
            </div>
          </Card>
        </Col>
      </Row>

      <Card className="orders-content">
        {/* 搜索和篩選 */}
        <div className="orders-filters">
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={12} md={8}>
              <Search
                placeholder="搜索訂單號或客戶信息"
                allowClear
                onSearch={handleSearch}
                style={{ width: '100%' }}
              />
            </Col>
            <Col xs={24} sm={6} md={4}>
              <Select
                placeholder="選擇狀態"
                allowClear
                style={{ width: '100%' }}
                onChange={handleStatusChange}
              >
                <Option value="pending">待確認</Option>
                <Option value="confirmed">已確認</Option>
                <Option value="processing">處理中</Option>
                <Option value="shipped">已發貨</Option>
                <Option value="delivered">已送達</Option>
                <Option value="cancelled">已取消</Option>
                <Option value="returned">已退貨</Option>
              </Select>
            </Col>
          </Row>
        </div>

        {/* 訂單表格 */}
        <Table
          columns={columns}
          dataSource={orders}
          loading={isLoading}
          rowKey="id"
          pagination={{
            current: searchParams.page,
            pageSize: searchParams.limit,
            total: total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 條，共 ${total} 條`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* 訂單詳情彈窗 */}
      <Modal
        title="訂單詳情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedOrder && (
          <div>
            <Descriptions title="基本信息" bordered column={2}>
              <Descriptions.Item label="訂單號">
                {selectedOrder.orderNumber}
              </Descriptions.Item>
              <Descriptions.Item label="創建時間">
                {new Date(selectedOrder.createdAt).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="訂單狀態">
                <Tag color="blue">{selectedOrder.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="支付狀態">
                <Tag color="green">{selectedOrder.payment?.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="訂單金額" span={2}>
                <span style={{ fontSize: 18, fontWeight: 'bold', color: '#1890ff' }}>
                  {selectedOrder.total.toFixed(2)}
                </span>
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: 24 }}>
              <h4>收貨信息</h4>
              <Descriptions bordered column={2}>
                <Descriptions.Item label="收貨人">
                  {selectedOrder.shipping?.address?.name}
                </Descriptions.Item>
                <Descriptions.Item label="電話">
                  {selectedOrder.shipping?.address?.phone}
                </Descriptions.Item>
                <Descriptions.Item label="地址" span={2}>
                  {selectedOrder.shipping?.address?.address}
                </Descriptions.Item>
                <Descriptions.Item label="城市">
                  {selectedOrder.shipping?.address?.city}
                </Descriptions.Item>
                <Descriptions.Item label="郵編">
                  {selectedOrder.shipping?.address?.postalCode}
                </Descriptions.Item>
              </Descriptions>
            </div>

            <div style={{ marginTop: 24 }}>
              <h4>商品清單</h4>
              <Table
                dataSource={selectedOrder.items}
                columns={[
                  { title: '商品名稱', dataIndex: 'productName', key: 'productName' },
                  { title: 'SKU', dataIndex: 'sku', key: 'sku' },
                  { title: '數量', dataIndex: 'quantity', key: 'quantity' },
                  { title: '單價', dataIndex: 'price', key: 'price', render: (price) => `${price}` },
                  { title: '小計', dataIndex: 'total', key: 'total', render: (total) => `${total}` },
                ]}
                pagination={false}
                size="small"
              />
            </div>
          </div>
        )}
      </Modal>

      {/* 新增訂單彈窗 */}
      <Modal
        title="新增訂單"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateOrder}
        >
          <Form.Item
            name="customerName"
            label="客戶姓名"
            rules={[{ required: true, message: '請輸入客戶姓名' }]}
          >
            <Input placeholder="請輸入客戶姓名" />
          </Form.Item>

          <Form.Item
            name="customerEmail"
            label="客戶郵箱"
            rules={[
              { required: true, message: '請輸入客戶郵箱' },
              { type: 'email', message: '請輸入有效的郵箱地址' }
            ]}
          >
            <Input placeholder="請輸入客戶郵箱" />
          </Form.Item>

          <Form.Item
            name="customerPhone"
            label="客戶電話"
            rules={[{ required: true, message: '請輸入客戶電話' }]}
          >
            <Input placeholder="請輸入客戶電話" />
          </Form.Item>

          <Form.Item
            name="shippingAddress"
            label="收貨地址"
            rules={[{ required: true, message: '請輸入收貨地址' }]}
          >
            <Input.TextArea rows={3} placeholder="請輸入收貨地址" />
          </Form.Item>

          <Form.Item
            name="paymentMethod"
            label="支付方式"
            rules={[{ required: true, message: '請選擇支付方式' }]}
          >
            <Select placeholder="請選擇支付方式">
              <Option value="credit_card">信用卡</Option>
              <Option value="debit_card">借記卡</Option>
              <Option value="paypal">PayPal</Option>
              <Option value="bank_transfer">銀行轉帳</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="status"
            label="訂單狀態"
            rules={[{ required: true, message: '請選擇訂單狀態' }]}
          >
            <Select placeholder="請選擇訂單狀態">
              <Option value="pending">待確認</Option>
              <Option value="confirmed">已確認</Option>
              <Option value="processing">處理中</Option>
              <Option value="shipped">已發貨</Option>
              <Option value="delivered">已送達</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={createOrderMutation.isPending}>
                創建訂單
              </Button>
              <Button onClick={() => setModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Orders;
