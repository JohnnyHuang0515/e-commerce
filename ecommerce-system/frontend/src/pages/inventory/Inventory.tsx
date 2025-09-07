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
  message,
  Popconfirm,
  Tooltip,
  Badge,
  Row,
  Col,
  Alert,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  InboxOutlined,
  WarningOutlined,
  SearchOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { 
  useInventories, 
  useCreateInventory, 
  useUpdateInventory, 
  useDeleteInventory,
  useAdjustStock,
  useLowStockAlerts,
  useOutOfStockAlerts
} from '../../hooks/useApi';
import type { Inventory, InventoryCreateRequest } from '../../services/inventoryService';
import type { ColumnsType } from 'antd/es/table';

const { Option } = Select;

const Inventory: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isAdjustModalVisible, setIsAdjustModalVisible] = useState(false);
  const [editingInventory, setEditingInventory] = useState<Inventory | null>(null);
  const [adjustingInventory, setAdjustingInventory] = useState<Inventory | null>(null);
  const [searchParams, setSearchParams] = useState<any>({});
  const [form] = Form.useForm();
  const [adjustForm] = Form.useForm();

  const { data: inventoriesData, isLoading, refetch } = useInventories(searchParams);
  const { data: lowStockAlerts } = useLowStockAlerts();
  const { data: outOfStockAlerts } = useOutOfStockAlerts();
  const createInventoryMutation = useCreateInventory();
  const updateInventoryMutation = useUpdateInventory();
  const deleteInventoryMutation = useDeleteInventory();
  const adjustStockMutation = useAdjustStock();

  const handleAdd = () => {
    setEditingInventory(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (inventory: Inventory) => {
    setEditingInventory(inventory);
    form.setFieldsValue({
      ...inventory,
      'location.warehouse': inventory.location.warehouse,
      'location.aisle': inventory.location.aisle,
      'location.shelf': inventory.location.shelf,
      'location.bin': inventory.location.bin,
    });
    setIsModalVisible(true);
  };

  const handleAdjustStock = (inventory: Inventory) => {
    setAdjustingInventory(inventory);
    adjustForm.resetFields();
    setIsAdjustModalVisible(true);
  };

  const handleSubmit = async (values: any) => {
    try {
      const inventoryData: InventoryCreateRequest = {
        productId: values.productId,
        sku: values.sku,
        stock: values.stock,
        minStock: values.minStock,
        maxStock: values.maxStock,
        reorderPoint: values.reorderPoint,
        location: {
          warehouse: values['location.warehouse'],
          aisle: values['location.aisle'],
          shelf: values['location.shelf'],
          bin: values['location.bin'],
        },
        cost: values.cost,
        currency: values.currency || 'TWD',
        metadata: values.metadata,
      };

      if (editingInventory) {
        await updateInventoryMutation.mutateAsync({
          inventoryId: editingInventory._id,
          data: inventoryData,
        });
        message.success('庫存更新成功');
      } else {
        await createInventoryMutation.mutateAsync(inventoryData);
        message.success('庫存創建成功');
      }

      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('操作失敗');
    }
  };

  const handleAdjustSubmit = async (values: any) => {
    if (!adjustingInventory) return;

    try {
      await adjustStockMutation.mutateAsync({
        inventoryId: adjustingInventory._id,
        quantity: values.quantity,
        reason: values.reason,
        reference: values.reference,
        metadata: values.metadata,
      });
      message.success('庫存調整成功');
      setIsAdjustModalVisible(false);
      adjustForm.resetFields();
    } catch (error) {
      message.error('庫存調整失敗');
    }
  };

  const handleDelete = async (inventoryId: string) => {
    try {
      await deleteInventoryMutation.mutateAsync(inventoryId);
      message.success('庫存刪除成功');
    } catch (error) {
      message.error('刪除失敗');
    }
  };

  const handleSearch = (values: any) => {
    setSearchParams(values);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'green',
      inactive: 'orange',
      discontinued: 'red',
    };
    return colors[status] || 'default';
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      active: '正常',
      inactive: '停用',
      discontinued: '停產',
    };
    return texts[status] || status;
  };

  const getStockStatus = (inventory: Inventory) => {
    if (inventory.stock === 0) return { status: 'error', text: '缺貨' };
    if (inventory.stock <= inventory.minStock) return { status: 'warning', text: '庫存不足' };
    if (inventory.stock >= inventory.maxStock) return { status: 'success', text: '庫存充足' };
    return { status: 'processing', text: '正常' };
  };

  const columns: ColumnsType<Inventory> = [
    {
      title: '庫存ID',
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
      title: '商品ID',
      dataIndex: 'productId',
      key: 'productId',
      width: 100,
      render: (productId: string) => (
        <Tooltip title={productId}>
          <span style={{ fontFamily: 'monospace' }}>{productId.slice(-8)}</span>
        </Tooltip>
      ),
    },
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
      width: 120,
      render: (sku: string) => (
        <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
          {sku}
        </span>
      ),
    },
    {
      title: '庫存狀態',
      key: 'stockStatus',
      width: 120,
      render: (_, record: Inventory) => {
        const stockStatus = getStockStatus(record);
        return (
          <Badge 
            status={stockStatus.status as any} 
            text={stockStatus.text}
          />
        );
      },
    },
    {
      title: '當前庫存',
      dataIndex: 'stock',
      key: 'stock',
      width: 100,
      render: (stock: number, record: Inventory) => (
        <div>
          <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
            {stock}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            可用: {record.availableStock}
          </div>
        </div>
      ),
    },
    {
      title: '預留庫存',
      dataIndex: 'reservedStock',
      key: 'reservedStock',
      width: 100,
      render: (reservedStock: number) => (
        <span style={{ color: '#ff7875' }}>
          {reservedStock}
        </span>
      ),
    },
    {
      title: '庫存範圍',
      key: 'stockRange',
      width: 120,
      render: (_, record: Inventory) => (
        <div style={{ fontSize: '12px' }}>
          <div>最小: {record.minStock}</div>
          <div>最大: {record.maxStock}</div>
          <div>補貨點: {record.reorderPoint}</div>
        </div>
      ),
    },
    {
      title: '狀態',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      ),
    },
    {
      title: '倉庫位置',
      dataIndex: 'location',
      key: 'location',
      width: 150,
      render: (location: any) => (
        <div>
          <div>{location.warehouse}</div>
          {location.aisle && <div style={{ fontSize: '12px', color: '#666' }}>
            {location.aisle} - {location.shelf} - {location.bin}
          </div>}
        </div>
      ),
    },
    {
      title: '成本',
      dataIndex: 'cost',
      key: 'cost',
      width: 100,
      render: (cost: number, record: Inventory) => (
        <span style={{ fontWeight: 'bold', color: '#52c41a' }}>
          {record.currency} {cost.toFixed(2)}
        </span>
      ),
    },
    {
      title: '最後補貨',
      dataIndex: 'lastRestocked',
      key: 'lastRestocked',
      width: 120,
      render: (date: string) => (
        date ? new Date(date).toLocaleDateString() : '-'
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 180,
      fixed: 'right',
      render: (_, record: Inventory) => (
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
          <Tooltip title="庫存調整">
            <Button
              type="text"
              icon={<InboxOutlined />}
              onClick={() => handleAdjustStock(record)}
            />
          </Tooltip>
          <Popconfirm
            title="確定要刪除這個庫存記錄嗎？"
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
      {/* 警告提示 */}
      {(lowStockAlerts?.data?.length > 0 || outOfStockAlerts?.data?.length > 0) && (
        <div style={{ marginBottom: 16 }}>
          {outOfStockAlerts?.data?.length > 0 && (
            <Alert
              message={`有 ${outOfStockAlerts.data.length} 個商品缺貨`}
              type="error"
              icon={<WarningOutlined />}
              style={{ marginBottom: 8 }}
            />
          )}
          {lowStockAlerts?.data?.length > 0 && (
            <Alert
              message={`有 ${lowStockAlerts.data.length} 個商品庫存不足`}
              type="warning"
              icon={<WarningOutlined />}
            />
          )}
        </div>
      )}

      <Card>
        <div style={{ marginBottom: 16 }}>
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
            >
              新增庫存
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
            <Select placeholder="庫存狀態" allowClear style={{ width: 120 }}>
              <Option value="active">正常</Option>
              <Option value="inactive">停用</Option>
              <Option value="discontinued">停產</Option>
            </Select>
          </Form.Item>
          <Form.Item name="warehouse">
            <Input placeholder="倉庫" style={{ width: 120 }} />
          </Form.Item>
          <Form.Item name="lowStock">
            <Select placeholder="庫存警告" allowClear style={{ width: 120 }}>
              <Option value="true">庫存不足</Option>
              <Option value="false">庫存充足</Option>
            </Select>
          </Form.Item>
          <Form.Item name="outOfStock">
            <Select placeholder="缺貨狀態" allowClear style={{ width: 120 }}>
              <Option value="true">缺貨</Option>
              <Option value="false">有庫存</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
              搜尋
            </Button>
          </Form.Item>
        </Form>

        <Table
          columns={columns}
          dataSource={inventoriesData?.data?.items || []}
          loading={isLoading}
          rowKey="_id"
          scroll={{ x: 1500 }}
          pagination={{
            total: inventoriesData?.data?.total || 0,
            pageSize: inventoriesData?.data?.limit || 10,
            current: inventoriesData?.data?.page || 1,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `第 ${range[0]}-${range[1]} 項，共 ${total} 項`,
          }}
        />
      </Card>

      {/* 新增/編輯庫存 Modal */}
      <Modal
        title={editingInventory ? '編輯庫存' : '新增庫存'}
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
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="productId"
                label="商品ID"
                rules={[{ required: true, message: '請輸入商品ID' }]}
              >
                <Input placeholder="請輸入商品ID" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="sku"
                label="SKU"
                rules={[{ required: true, message: '請輸入SKU' }]}
              >
                <Input placeholder="請輸入SKU" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="stock"
                label="當前庫存"
                rules={[{ required: true, message: '請輸入當前庫存' }]}
              >
                <InputNumber
                  placeholder="請輸入當前庫存"
                  min={0}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="minStock"
                label="最小庫存"
                rules={[{ required: true, message: '請輸入最小庫存' }]}
              >
                <InputNumber
                  placeholder="請輸入最小庫存"
                  min={0}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="maxStock"
                label="最大庫存"
                rules={[{ required: true, message: '請輸入最大庫存' }]}
              >
                <InputNumber
                  placeholder="請輸入最大庫存"
                  min={0}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="reorderPoint"
                label="補貨點"
                rules={[{ required: true, message: '請輸入補貨點' }]}
              >
                <InputNumber
                  placeholder="請輸入補貨點"
                  min={0}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="status"
                label="狀態"
                rules={[{ required: true, message: '請選擇狀態' }]}
              >
                <Select placeholder="請選擇狀態">
                  <Option value="active">正常</Option>
                  <Option value="inactive">停用</Option>
                  <Option value="discontinued">停產</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <div style={{ marginBottom: 16 }}>
            <h4>倉庫位置</h4>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="location.warehouse"
                  label="倉庫"
                  rules={[{ required: true, message: '請輸入倉庫' }]}
                >
                  <Input placeholder="請輸入倉庫" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="location.aisle"
                  label="走道"
                >
                  <Input placeholder="請輸入走道" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="location.shelf"
                  label="貨架"
                >
                  <Input placeholder="請輸入貨架" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="location.bin"
                  label="儲位"
                >
                  <Input placeholder="請輸入儲位" />
                </Form.Item>
              </Col>
            </Row>
          </div>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="cost"
                label="成本"
                rules={[{ required: true, message: '請輸入成本' }]}
              >
                <InputNumber
                  placeholder="請輸入成本"
                  min={0}
                  precision={2}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
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
            </Col>
          </Row>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={createInventoryMutation.isPending || updateInventoryMutation.isPending}>
                {editingInventory ? '更新' : '創建'}
              </Button>
              <Button onClick={() => setIsModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 庫存調整 Modal */}
      <Modal
        title="庫存調整"
        open={isAdjustModalVisible}
        onCancel={() => setIsAdjustModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form
          form={adjustForm}
          layout="vertical"
          onFinish={handleAdjustSubmit}
        >
          <Form.Item
            name="quantity"
            label="調整數量"
            rules={[{ required: true, message: '請輸入調整數量' }]}
          >
            <InputNumber
              placeholder="正數為增加，負數為減少"
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item
            name="reason"
            label="調整原因"
            rules={[{ required: true, message: '請輸入調整原因' }]}
          >
            <Input.TextArea
              placeholder="請輸入調整原因"
              rows={3}
            />
          </Form.Item>
          <Form.Item
            name="reference"
            label="參考單號"
          >
            <Input placeholder="請輸入參考單號（如訂單號、調撥單號等）" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={adjustStockMutation.isPending}>
                確認調整
              </Button>
              <Button onClick={() => setIsAdjustModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Inventory;
