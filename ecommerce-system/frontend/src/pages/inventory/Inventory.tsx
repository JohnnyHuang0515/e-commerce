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
  Descriptions,
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
import './Inventory.less';

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

  const handleView = (inventory: Inventory) => {
    const stock = inventory.stock_quantity || 0;
    let stockStatus = '正常';
    let stockColor = '#52c41a';
    
    if (stock === 0) {
      stockStatus = '缺貨';
      stockColor = '#ff4d4f';
    } else if (stock <= 5) {
      stockStatus = '庫存不足';
      stockColor = '#ff4d4f';
    } else if (stock <= 10) {
      stockStatus = '庫存偏低';
      stockColor = '#faad14';
    }

    Modal.info({
      title: (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ color: '#fff' }}>庫存詳情</span>
          <Tag color={inventory.status === 1 ? 'green' : 'red'}>
            {inventory.status === 1 ? '上架' : '下架'}
          </Tag>
        </div>
      ),
      width: 700,
      className: 'dark-modal',
      styles: {
        body: {
          backgroundColor: '#1f1f1f',
          color: '#fff'
        },
        header: {
          backgroundColor: '#2d2d2d',
          borderBottom: '1px solid #404040',
          color: '#fff'
        },
        mask: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)'
        },
        content: {
          backgroundColor: '#1f1f1f',
          border: '1px solid #404040',
          borderRadius: '8px'
        }
      },
      content: (
        <div style={{ padding: '8px 0', backgroundColor: '#1f1f1f', color: '#fff' }}>
          {/* 商品基本信息 */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ margin: '0 0 16px 0', color: '#a0a0a0', fontSize: '16px', fontWeight: '500' }}>
              📦 商品信息
            </h4>
            <Descriptions 
              column={2} 
              size="small"
              labelStyle={{ color: '#b0b0b0', fontSize: '14px' }}
              contentStyle={{ color: '#fff', fontSize: '14px' }}
            >
              <Descriptions.Item label="商品名稱" span={2}>
                <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{inventory.name}</span>
              </Descriptions.Item>
              <Descriptions.Item label="商品ID">
                <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{inventory.product_id}</span>
              </Descriptions.Item>
              <Descriptions.Item label="SKU">
                <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{inventory.sku}</span>
              </Descriptions.Item>
              <Descriptions.Item label="分類">
                <Tag color="blue">{inventory.category_name}</Tag>
              </Descriptions.Item>
            </Descriptions>
          </div>

          {/* 庫存信息 - 緊湊設計 */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ margin: '0 0 16px 0', color: '#a0a0a0', fontSize: '16px', fontWeight: '500' }}>
              📊 庫存信息
            </h4>
            
            <Row gutter={[16, 16]}>
              {/* 當前庫存 - 主要信息 */}
              <Col span={16}>
                <div style={{ 
                  padding: '16px', 
                  backgroundColor: '#2d2d2d', 
                  borderRadius: '8px',
                  border: `2px solid ${stockColor}`,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '12px', color: '#b0b0b0', marginBottom: '4px' }}>
                        當前庫存
                      </div>
                      <div style={{ 
                        fontSize: '24px', 
                        fontWeight: 'bold', 
                        color: stockColor,
                        marginBottom: '4px'
                      }}>
                        {stock}
                      </div>
                      <div style={{ 
                        fontSize: '12px', 
                        color: stockColor,
                        fontWeight: '500'
                      }}>
                        {stockStatus}
                      </div>
                    </div>
                    <div style={{ 
                      fontSize: '32px', 
                      color: stockColor,
                      opacity: 0.3
                    }}>
                      📦
                    </div>
                  </div>
                </div>
              </Col>
              
              {/* 最小庫存閾值 */}
              <Col span={8}>
                <div style={{ 
                  padding: '16px', 
                  backgroundColor: '#2d2d2d', 
                  borderRadius: '8px',
                  border: '1px solid #404040',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '12px', color: '#b0b0b0', marginBottom: '8px' }}>
                    最小庫存閾值
                  </div>
                  <div style={{ 
                    fontSize: '20px', 
                    fontWeight: 'bold', 
                    color: '#fff',
                    marginBottom: '4px'
                  }}>
                    {inventory.min_stock_level || 10}
                  </div>
                  <div style={{ fontSize: '10px', color: '#666' }}>
                    低於此值將警告
                  </div>
                </div>
              </Col>
            </Row>
          </div>

          {/* 其他信息 */}
          <div>
            <h4 style={{ margin: '0 0 16px 0', color: '#a0a0a0', fontSize: '16px', fontWeight: '500' }}>
              ℹ️ 其他信息
            </h4>
            <Descriptions 
              column={2} 
              size="small"
              labelStyle={{ color: '#b0b0b0', fontSize: '14px' }}
              contentStyle={{ color: '#fff', fontSize: '14px' }}
            >
              <Descriptions.Item label="最後更新">
                <span style={{ fontWeight: '500' }}>
                  {inventory.last_updated ? new Date(inventory.last_updated).toLocaleString() : '無記錄'}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="商品狀態">
                <Tag color={inventory.status === 1 ? 'green' : 'red'}>
                  {inventory.status === 1 ? '上架中' : '已下架'}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
          </div>
        </div>
      ),
    });
  };

  const handleEdit = (inventory: Inventory) => {
    setEditingInventory(inventory);
    form.setFieldsValue({
      ...inventory,
      'location.warehouse': inventory.location?.warehouse || '',
      'location.aisle': inventory.location?.aisle || '',
      'location.shelf': inventory.location?.shelf || '',
      'location.bin': inventory.location?.bin || '',
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

  const handleTableChange = (pagination: any) => {
    setSearchParams(prev => ({
      ...prev,
      page: pagination.current,
      limit: pagination.pageSize,
    }));
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

  const columns: ColumnsType<any> = [
    {
      title: '商品ID',
      dataIndex: 'product_id',
      key: 'product_id',
      width: 100,
      render: (productId: string) => (
        <Tooltip title={productId}>
          <span style={{ fontFamily: 'monospace' }}>{productId}</span>
        </Tooltip>
      ),
    },
    {
      title: '商品信息',
      key: 'productInfo',
      width: 200,
      render: (_, record: any) => (
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
            {record.name}
          </div>
          <div style={{ 
            fontSize: '12px', 
            color: '#b0b0b0', 
            fontFamily: 'monospace',
            backgroundColor: 'rgba(45, 45, 45, 0.8)',
            border: '1px solid #404040',
            padding: '2px 6px',
            borderRadius: '4px',
            display: 'inline-block'
          }}>
            SKU: {record.sku}
          </div>
        </div>
      ),
    },
    {
      title: '分類',
      dataIndex: 'category_name',
      key: 'category_name',
      width: 120,
      render: (categoryName: string) => (
        <Tag color="blue">{categoryName}</Tag>
      ),
    },
    {
      title: '當前庫存',
      dataIndex: 'stock_quantity',
      key: 'stock_quantity',
      width: 120,
      render: (stock: number) => {
        let color = '#52c41a'; // 綠色 - 正常
        let statusText = '';
        
        if (stock === 0) {
          color = '#ff4d4f'; // 紅色 - 缺貨
          statusText = ' (缺貨)';
        } else if (stock <= 5) {
          color = '#ff4d4f'; // 紅色 - 庫存不足
          statusText = ' (不足)';
        } else if (stock <= 10) {
          color = '#faad14'; // 橙色 - 庫存偏低
          statusText = ' (偏低)';
        }
        
        return (
          <div style={{ 
            fontWeight: 'bold', 
            fontSize: '16px', 
            color: color,
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <span>{stock}</span>
            {statusText && (
              <span style={{ 
                fontSize: '12px', 
                fontWeight: 'normal',
                color: color
              }}>
                {statusText}
              </span>
            )}
          </div>
        );
      },
    },
    {
      title: '狀態',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: number) => (
        <Tag color={status === 1 ? 'green' : 'red'}>
          {status === 1 ? '上架' : '下架'}
        </Tag>
      ),
    },
    {
      title: '最後更新',
      dataIndex: 'last_updated',
      key: 'last_updated',
      width: 120,
      render: (date: string) => (
        date ? new Date(date).toLocaleDateString() : '-'
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record: any) => (
        <Space size="small">
          <Tooltip title="查看詳情">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleView(record)}
            />
          </Tooltip>
          <Tooltip title="庫存調整">
            <Button
              type="text"
              icon={<InboxOutlined />}
              onClick={() => handleAdjustStock(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)',
      padding: '24px'
    }}>
      {/* 頁面標題 */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#fff' }}>庫存管理</h2>
        <p style={{ margin: '8px 0 0 0', color: '#b0b0b0', fontSize: '14px' }}>
          查看和管理商品庫存狀態、庫存數量及庫存警告
        </p>
      </div>

      {/* 警告提示 */}
      {(lowStockAlerts?.data?.length > 0 || outOfStockAlerts?.data?.length > 0) && (
        <div style={{ marginBottom: 16 }}>
          {outOfStockAlerts?.data?.length > 0 && (
            <Alert
              message={`有 ${outOfStockAlerts.data.length} 個商品缺貨`}
              type="error"
              icon={<WarningOutlined />}
              style={{ 
                marginBottom: 8,
                backgroundColor: 'rgba(255, 77, 79, 0.1)',
                border: '1px solid #ff4d4f',
                borderRadius: '6px'
              }}
              className="dark-alert"
            />
          )}
          {lowStockAlerts?.data?.length > 0 && (
            <Alert
              message={`有 ${lowStockAlerts.data.length} 個商品庫存不足`}
              type="warning"
              icon={<WarningOutlined />}
              style={{ 
                backgroundColor: 'rgba(250, 173, 20, 0.1)',
                border: '1px solid #faad14',
                borderRadius: '6px'
              }}
              className="dark-alert"
            />
          )}
        </div>
      )}

      <Card 
        style={{ 
          backgroundColor: 'rgba(45, 45, 45, 0.8)',
          border: '1px solid #404040',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(10px)'
        }}
        bodyStyle={{ 
          backgroundColor: 'transparent',
          padding: '24px'
        }}
      >
        <div style={{ marginBottom: 16 }}>
          <Space>
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
          <Form.Item name="search">
            <Input placeholder="搜尋商品名稱或SKU" style={{ width: 200 }} />
          </Form.Item>
          <Form.Item name="lowStock">
            <Select placeholder="庫存狀態" allowClear style={{ width: 120 }}>
              <Option value="true">庫存不足</Option>
              <Option value="false">庫存充足</Option>
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
          rowKey="public_id"
          onChange={handleTableChange}
          style={{
            backgroundColor: 'transparent'
          }}
          className="dark-table"
          pagination={{
            total: inventoriesData?.data?.total || 0,
            pageSize: inventoriesData?.data?.limit || 10,
            current: inventoriesData?.data?.page || 1,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `第 ${range[0]}-${range[1]} 項，共 ${total} 項`,
            itemRender: (current, type, originalElement) => {
              if (type === 'prev') {
                return <Button style={{ color: '#fff', borderColor: '#404040' }}>上一頁</Button>;
              }
              if (type === 'next') {
                return <Button style={{ color: '#fff', borderColor: '#404040' }}>下一頁</Button>;
              }
              return originalElement;
            }
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
