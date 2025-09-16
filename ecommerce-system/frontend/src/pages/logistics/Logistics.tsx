import React, { useState } from 'react';
import {
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
  Row,
  Col,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SearchOutlined,
  EnvironmentOutlined,
  TruckOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import UnifiedPageLayout from '../../components/common/UnifiedPageLayout';
import { useShipments, useCreateShipment, useUpdateShipment, useDeleteShipment } from '../../hooks/useApi';
import { Shipment, ShipmentCreateRequest } from '../../services/logisticsService';
import type { ColumnsType } from 'antd/es/table';

const { Option } = Select;
const { RangePicker } = DatePicker;

const Logistics: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingShipment, setEditingShipment] = useState<Shipment | null>(null);
  const [searchParams, setSearchParams] = useState<any>({});
  const [form] = Form.useForm();

  const { data: shipmentsData, isLoading, refetch } = useShipments(searchParams);
  const createShipmentMutation = useCreateShipment();
  const updateShipmentMutation = useUpdateShipment();
  const deleteShipmentMutation = useDeleteShipment();

  const handleAdd = () => {
    setEditingShipment(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (shipment: Shipment) => {
    setEditingShipment(shipment);
    form.setFieldsValue({
      ...shipment,
      'origin.name': shipment.origin.name,
      'origin.address': shipment.origin.address,
      'origin.city': shipment.origin.city,
      'origin.state': shipment.origin.state,
      'origin.zipCode': shipment.origin.zipCode,
      'origin.country': shipment.origin.country,
      'origin.phone': shipment.origin.phone,
      'destination.name': shipment.destination.name,
      'destination.address': shipment.destination.address,
      'destination.city': shipment.destination.city,
      'destination.state': shipment.destination.state,
      'destination.zipCode': shipment.destination.zipCode,
      'destination.country': shipment.destination.country,
      'destination.phone': shipment.destination.phone,
      'packageInfo.weight': shipment.packageInfo.weight,
      'packageInfo.dimensions.length': shipment.packageInfo.dimensions.length,
      'packageInfo.dimensions.width': shipment.packageInfo.dimensions.width,
      'packageInfo.dimensions.height': shipment.packageInfo.dimensions.height,
      'packageInfo.description': shipment.packageInfo.description,
    });
    setIsModalVisible(true);
  };

  const handleSubmit = async (values: any) => {
    try {
      const shipmentData: ShipmentCreateRequest = {
        orderId: values.orderId,
        userId: values.userId,
        shippingMethod: values.shippingMethod,
        provider: values.provider,
        origin: {
          name: values['origin.name'],
          address: values['origin.address'],
          city: values['origin.city'],
          state: values['origin.state'],
          zipCode: values['origin.zipCode'],
          country: values['origin.country'],
          phone: values['origin.phone'],
        },
        destination: {
          name: values['destination.name'],
          address: values['destination.address'],
          city: values['destination.city'],
          state: values['destination.state'],
          zipCode: values['destination.zipCode'],
          country: values['destination.country'],
          phone: values['destination.phone'],
        },
        packageInfo: {
          weight: values['packageInfo.weight'],
          dimensions: {
            length: values['packageInfo.dimensions.length'],
            width: values['packageInfo.dimensions.width'],
            height: values['packageInfo.dimensions.height'],
          },
          description: values['packageInfo.description'],
        },
        metadata: values.metadata,
      };

      if (editingShipment) {
        await updateShipmentMutation.mutateAsync({
          shipmentId: editingShipment._id,
          data: shipmentData,
        });
        message.success('物流更新成功');
      } else {
        await createShipmentMutation.mutateAsync(shipmentData);
        message.success('物流創建成功');
      }

      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('操作失敗');
    }
  };

  const handleDelete = async (shipmentId: string) => {
    try {
      await deleteShipmentMutation.mutateAsync(shipmentId);
      message.success('物流刪除成功');
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
      shipped: 'cyan',
      in_transit: 'purple',
      delivered: 'green',
      failed: 'red',
      returned: 'gray',
    };
    return colors[status] || 'default';
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      pending: '待處理',
      processing: '處理中',
      shipped: '已出貨',
      in_transit: '運送中',
      delivered: '已送達',
      failed: '配送失敗',
      returned: '已退回',
    };
    return texts[status] || status;
  };

  const getProviderText = (provider: string) => {
    const providerTexts: Record<string, string> = {
      black_cat: '黑貓宅急便',
      hsinchu: '新竹物流',
      sf_express: '順豐速運',
      post_office: '郵局',
      custom: '自營物流',
    };
    return providerTexts[provider] || provider;
  };

  const columns: ColumnsType<Shipment> = [
    {
      title: '物流ID',
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
      title: '追蹤號碼',
      dataIndex: 'trackingNumber',
      key: 'trackingNumber',
      width: 120,
      render: (trackingNumber: string) => (
        trackingNumber ? (
          <Tooltip title={trackingNumber}>
            <span style={{ fontFamily: 'monospace', color: '#1890ff' }}>
              {trackingNumber.slice(-8)}
            </span>
          </Tooltip>
        ) : '-'
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
      title: '配送方式',
      dataIndex: 'shippingMethod',
      key: 'shippingMethod',
      width: 100,
      render: (method: string) => {
        const methodTexts: Record<string, string> = {
          standard: '標準配送',
          express: '快速配送',
          overnight: '隔日配送',
          pickup: '自取',
        };
        return methodTexts[method] || method;
      },
    },
    {
      title: '物流商',
      dataIndex: 'provider',
      key: 'provider',
      width: 120,
      render: (provider: string) => getProviderText(provider),
    },
    {
      title: '目的地',
      dataIndex: 'destination',
      key: 'destination',
      width: 150,
      render: (destination: any) => (
        <div>
          <div>{destination.name}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {destination.city}, {destination.state}
          </div>
        </div>
      ),
    },
    {
      title: '包裹重量',
      dataIndex: 'packageInfo',
      key: 'packageInfo',
      width: 100,
      render: (packageInfo: any) => `${packageInfo.weight}kg`,
    },
    {
      title: '費用',
      dataIndex: 'cost',
      key: 'cost',
      width: 100,
      render: (cost: number, record: Shipment) => (
        <span style={{ fontWeight: 'bold', color: '#1890ff' }}>
          {record.currency} {cost.toFixed(2)}
        </span>
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
      render: (_, record: Shipment) => (
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
          {record.trackingNumber && (
            <Tooltip title="追蹤">
              <Button
                type="text"
                icon={<EnvironmentOutlined />}
                onClick={() => {
                  // 這裡可以打開追蹤詳情
                  message.info('追蹤功能開發中');
                }}
              />
            </Tooltip>
          )}
          <Popconfirm
            title="確定要刪除這個物流記錄嗎？"
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

  // 統計數據配置
  const shipments = shipmentsData?.data?.items || [];
  const statsConfig = [
    {
      label: '總物流',
      value: shipments.length,
      icon: <TruckOutlined />,
      color: 'var(--text-primary)'
    },
    {
      label: '進行中',
      value: shipments.filter(s => s.status === 'in_transit').length,
      icon: <ClockCircleOutlined />,
      color: 'var(--warning-500)'
    },
    {
      label: '已送達',
      value: shipments.filter(s => s.status === 'delivered').length,
      icon: <CheckCircleOutlined />,
      color: 'var(--success-500)'
    },
    {
      label: '異常',
      value: shipments.filter(s => s.status === 'exception').length,
      icon: <ExclamationCircleOutlined />,
      color: 'var(--error-500)'
    }
  ];

  // 操作按鈕
  const extraActions = (
    <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
      新增物流
    </Button>
  );

  return (
    <UnifiedPageLayout
      title="物流管理"
      subtitle="管理訂單物流和配送狀態"
      extra={extraActions}
      stats={statsConfig}
      onRefresh={() => refetch()}
      loading={isLoading}
    >

        <Form
          layout="inline"
          onFinish={handleSearch}
          style={{ marginBottom: 16 }}
        >
          <Form.Item name="status">
            <Select placeholder="物流狀態" allowClear style={{ width: 120 }}>
              <Option value="pending">待處理</Option>
              <Option value="processing">處理中</Option>
              <Option value="shipped">已出貨</Option>
              <Option value="in_transit">運送中</Option>
              <Option value="delivered">已送達</Option>
              <Option value="failed">配送失敗</Option>
              <Option value="returned">已退回</Option>
            </Select>
          </Form.Item>
          <Form.Item name="provider">
            <Select placeholder="物流商" allowClear style={{ width: 120 }}>
              <Option value="black_cat">黑貓宅急便</Option>
              <Option value="hsinchu">新竹物流</Option>
              <Option value="sf_express">順豐速運</Option>
              <Option value="post_office">郵局</Option>
              <Option value="custom">自營物流</Option>
            </Select>
          </Form.Item>
          <Form.Item name="shippingMethod">
            <Select placeholder="配送方式" allowClear style={{ width: 120 }}>
              <Option value="standard">標準配送</Option>
              <Option value="express">快速配送</Option>
              <Option value="overnight">隔日配送</Option>
              <Option value="pickup">自取</Option>
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
          dataSource={shipmentsData?.data?.items || []}
          loading={isLoading}
          rowKey="_id"
          scroll={{ x: 1400 }}
          pagination={{
            total: shipmentsData?.data?.total || 0,
            pageSize: shipmentsData?.data?.limit || 10,
            current: shipmentsData?.data?.page || 1,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `第 ${range[0]}-${range[1]} 項，共 ${total} 項`,
          }}
        />

      {/* 新增/編輯物流 Modal */}
      <Modal
        title={editingShipment ? '編輯物流' : '新增物流'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="orderId"
                label="訂單ID"
                rules={[{ required: true, message: '請輸入訂單ID' }]}
              >
                <Input placeholder="請輸入訂單ID" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="userId"
                label="用戶ID"
                rules={[{ required: true, message: '請輸入用戶ID' }]}
              >
                <Input placeholder="請輸入用戶ID" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="shippingMethod"
                label="配送方式"
                rules={[{ required: true, message: '請選擇配送方式' }]}
              >
                <Select placeholder="請選擇配送方式">
                  <Option value="standard">標準配送</Option>
                  <Option value="express">快速配送</Option>
                  <Option value="overnight">隔日配送</Option>
                  <Option value="pickup">自取</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="provider"
                label="物流商"
                rules={[{ required: true, message: '請選擇物流商' }]}
              >
                <Select placeholder="請選擇物流商">
                  <Option value="black_cat">黑貓宅急便</Option>
                  <Option value="hsinchu">新竹物流</Option>
                  <Option value="sf_express">順豐速運</Option>
                  <Option value="post_office">郵局</Option>
                  <Option value="custom">自營物流</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <div style={{ marginBottom: 16 }}>
            <h4>寄件地址</h4>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="origin.name"
                  label="寄件人姓名"
                  rules={[{ required: true, message: '請輸入寄件人姓名' }]}
                >
                  <Input placeholder="請輸入寄件人姓名" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="origin.phone"
                  label="寄件人電話"
                >
                  <Input placeholder="請輸入寄件人電話" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item
              name="origin.address"
              label="寄件地址"
              rules={[{ required: true, message: '請輸入寄件地址' }]}
            >
              <Input placeholder="請輸入寄件地址" />
            </Form.Item>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="origin.city"
                  label="城市"
                  rules={[{ required: true, message: '請輸入城市' }]}
                >
                  <Input placeholder="請輸入城市" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="origin.state"
                  label="州/省"
                  rules={[{ required: true, message: '請輸入州/省' }]}
                >
                  <Input placeholder="請輸入州/省" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="origin.zipCode"
                  label="郵遞區號"
                  rules={[{ required: true, message: '請輸入郵遞區號' }]}
                >
                  <Input placeholder="請輸入郵遞區號" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item
              name="origin.country"
              label="國家"
              rules={[{ required: true, message: '請輸入國家' }]}
            >
              <Input placeholder="請輸入國家" />
            </Form.Item>
          </div>

          <div style={{ marginBottom: 16 }}>
            <h4>收件地址</h4>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="destination.name"
                  label="收件人姓名"
                  rules={[{ required: true, message: '請輸入收件人姓名' }]}
                >
                  <Input placeholder="請輸入收件人姓名" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="destination.phone"
                  label="收件人電話"
                >
                  <Input placeholder="請輸入收件人電話" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item
              name="destination.address"
              label="收件地址"
              rules={[{ required: true, message: '請輸入收件地址' }]}
            >
              <Input placeholder="請輸入收件地址" />
            </Form.Item>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="destination.city"
                  label="城市"
                  rules={[{ required: true, message: '請輸入城市' }]}
                >
                  <Input placeholder="請輸入城市" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="destination.state"
                  label="州/省"
                  rules={[{ required: true, message: '請輸入州/省' }]}
                >
                  <Input placeholder="請輸入州/省" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="destination.zipCode"
                  label="郵遞區號"
                  rules={[{ required: true, message: '請輸入郵遞區號' }]}
                >
                  <Input placeholder="請輸入郵遞區號" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item
              name="destination.country"
              label="國家"
              rules={[{ required: true, message: '請輸入國家' }]}
            >
              <Input placeholder="請輸入國家" />
            </Form.Item>
          </div>

          <div style={{ marginBottom: 16 }}>
            <h4>包裹資訊</h4>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="packageInfo.weight"
                  label="重量 (kg)"
                  rules={[{ required: true, message: '請輸入重量' }]}
                >
                  <InputNumber
                    placeholder="請輸入重量"
                    min={0}
                    precision={2}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="packageInfo.dimensions.length"
                  label="長度 (cm)"
                  rules={[{ required: true, message: '請輸入長度' }]}
                >
                  <InputNumber
                    placeholder="請輸入長度"
                    min={0}
                    precision={1}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="packageInfo.dimensions.width"
                  label="寬度 (cm)"
                  rules={[{ required: true, message: '請輸入寬度' }]}
                >
                  <InputNumber
                    placeholder="請輸入寬度"
                    min={0}
                    precision={1}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="packageInfo.dimensions.height"
                  label="高度 (cm)"
                  rules={[{ required: true, message: '請輸入高度' }]}
                >
                  <InputNumber
                    placeholder="請輸入高度"
                    min={0}
                    precision={1}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="packageInfo.description"
                  label="包裹描述"
                >
                  <Input placeholder="請輸入包裹描述" />
                </Form.Item>
              </Col>
            </Row>
          </div>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={createShipmentMutation.isPending || updateShipmentMutation.isPending}>
                {editingShipment ? '更新' : '創建'}
              </Button>
              <Button onClick={() => setIsModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </UnifiedPageLayout>
  );
};

export default Logistics;
