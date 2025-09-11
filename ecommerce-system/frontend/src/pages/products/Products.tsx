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
  Image, 
  Popconfirm, 
  message,
  Modal,
  Form,
  InputNumber
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import PageHeader from '../../components/common/PageHeader';
import ImageUpload from '../../components/common/ImageUpload';
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from '../../hooks/useApi';
import { useCategories } from '../../hooks/useCategories';
import { Image as ImageType } from '../../services/imageService';
import './Products.less';

const { Search } = Input;
const { Option } = Select;

interface ProductFormData {
  name: string;
  description: string;
  price: number;
  categoryId: string;
  stock: number;
  status: 'active' | 'inactive';
  attributes?: Record<string, any>;
  images?: string[];
  category?: string;
  brand?: string;
  sku?: string;
}

const Products: React.FC = () => {
  const [searchParams, setSearchParams] = useState({
    page: 1,
    limit: 10,
    search: '',
    category: '',
    status: '',
    sortBy: 'createdAt',
    sortOrder: 'desc' as 'asc' | 'desc',
  });
  
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [productImages, setProductImages] = useState<ImageType[]>([]);
  const [form] = Form.useForm();

  // API hooks
  const { data: productsData, isLoading, refetch } = useProducts(searchParams);
  const { data: categoriesData } = useCategories();
  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();
  const deleteProductMutation = useDeleteProduct();

  const products = productsData?.data?.items || [];
  const total = productsData?.data?.total || 0;
  const categories = categoriesData?.data || [];

  // 表格列定義
  const columns = [
    {
      title: '商品名稱',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
      render: (text: string, record: any) => (
        <div>
          <div style={{ fontWeight: 500 }}>{text}</div>
          <div style={{ fontSize: 12, color: '#666' }}>SKU: {record.sku}</div>
        </div>
      ),
    },
    {
      title: '圖片',
      dataIndex: 'images',
      key: 'images',
      width: 80,
      render: (images: string[]) => (
        <div className="product-images">
          {images && images.length > 0 ? (
            <Image
              src={images[0]}
              alt="商品圖片"
              width={40}
              height={40}
              style={{ objectFit: 'cover', borderRadius: 4 }}
              fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN"
            />
          ) : (
            <div style={{ 
              width: 40, 
              height: 40, 
              backgroundColor: '#f5f5f5', 
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              color: '#999'
            }}>
              無圖
            </div>
          )}
        </div>
      ),
    },
    {
      title: '分類',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (category: string) => (
        <Tag color="blue">{category}</Tag>
      ),
    },
    {
      title: '品牌',
      dataIndex: 'brand',
      key: 'brand',
      width: 100,
    },
    {
      title: '價格',
      dataIndex: 'price',
      key: 'price',
      width: 120,
      render: (price: number, record: any) => (
        <div>
          <div style={{ fontWeight: 500 }}>{price}</div>
          {record.originalPrice && record.originalPrice > price && (
            <div style={{ fontSize: 12, color: '#999', textDecoration: 'line-through' }}>
              {record.originalPrice}
            </div>
          )}
        </div>
      ),
    },
    {
      title: '庫存',
      dataIndex: 'stock',
      key: 'stock',
      width: 80,
      render: (stock: number) => (
        <Tag color={stock > 10 ? 'green' : stock > 0 ? 'orange' : 'red'}>
          {stock}
        </Tag>
      ),
    },
    {
      title: '狀態',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const statusConfig = {
          active: { color: 'green', text: '上架' },
          inactive: { color: 'red', text: '下架' },
          draft: { color: 'orange', text: '草稿' },
        };
        const config = statusConfig[status as keyof typeof statusConfig];
        if (!config) {
          return <Tag>{status || '未知狀態'}</Tag>;
        }
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
      width: 150,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EyeOutlined />}
            size="small"
            onClick={() => handleView(record)}
          />
          <Button
            type="text"
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="確定要刪除這個商品嗎？"
            onConfirm={() => handleDelete(record._id || record.id)}
            okText="確定"
            cancelText="取消"
          >
            <Button
              type="text"
              icon={<DeleteOutlined />}
              size="small"
              danger
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 處理函數
  const handleSearch = (value: string) => {
    setSearchParams(prev => ({ ...prev, search: value, page: 1 }));
  };

  const handleCategoryChange = (value: string) => {
    setSearchParams(prev => ({ ...prev, category: value, page: 1 }));
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

  const handleAdd = () => {
    setEditingProduct(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    
    // 找到對應的分類 ID
    const categoryId = categories.find(cat => cat.name === product.category)?._id;
    
    form.setFieldsValue({
      ...product,
      tags: product.tags?.join(',') || '',
      categoryId: categoryId || product.categoryId || product.category,
    });
    setModalVisible(true);
  };

  const handleView = (product: any) => {
    Modal.info({
      title: '商品詳情',
      width: 600,
      content: (
        <div>
          <p><strong>商品名稱:</strong> {product.name}</p>
          <p><strong>描述:</strong> {product.description}</p>
          <p><strong>價格:</strong> {product.price}</p>
          <p><strong>分類:</strong> {product.category}</p>
          <p><strong>品牌:</strong> {product.brand}</p>
          <p><strong>SKU:</strong> {product.sku}</p>
          <p><strong>庫存:</strong> {product.stock}</p>
          <p><strong>狀態:</strong> {product.status}</p>
        </div>
      ),
    });
  };

  const handleDelete = async (productId: string) => {
    try {
      await deleteProductMutation.mutateAsync(productId);
      message.success('商品刪除成功');
      refetch();
    } catch (error: any) {
      message.error(error.message || '刪除失敗');
    }
  };

  const handleSubmit = async (values: ProductFormData) => {
    try {
      // 提取圖片 URL
      const imageUrls = productImages.map(img => img.url);
      
      // 找到選中的分類
      const selectedCategory = categories.find(cat => cat._id === values.categoryId);
      
      const productData = {
        ...values,
        attributes: values.attributes || {},
        images: imageUrls,
        category: selectedCategory?.name || '未分類',
        brand: values.brand || 'Default Brand',
        sku: `SKU-${Date.now()}`,
      };

      if (editingProduct) {
        // 使用 _id 或 id，確保有正確的 ID
        const productId = editingProduct._id || editingProduct.id;
        if (!productId) {
          message.error('商品 ID 不存在');
          return;
        }
        await updateProductMutation.mutateAsync({ id: productId, ...productData });
        message.success('商品更新成功');
      } else {
        await createProductMutation.mutateAsync(productData);
        message.success('商品創建成功');
      }

      setModalVisible(false);
      form.resetFields();
      setProductImages([]);
      refetch();
    } catch (error: any) {
      message.error(error.message || '操作失敗');
    }
  };

  return (
    <div className="products-page">
      <PageHeader
        title="商品管理"
        subtitle="管理商品信息、庫存和狀態"
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
              刷新
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新增商品
            </Button>
          </Space>
        }
      />

      <Card className="products-content">
        {/* 搜索和篩選 */}
        <div className="products-filters">
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={12} md={8}>
              <Search
                placeholder="搜索商品名稱或SKU"
                allowClear
                onSearch={handleSearch}
                style={{ width: '100%' }}
              />
            </Col>
            <Col xs={24} sm={6} md={4}>
              <Select
                placeholder="選擇分類"
                allowClear
                style={{ width: '100%' }}
                onChange={handleCategoryChange}
              >
                <Option value="electronics">電子產品</Option>
                <Option value="clothing">服裝</Option>
                <Option value="books">圖書</Option>
                <Option value="home">家居</Option>
              </Select>
            </Col>
            <Col xs={24} sm={6} md={4}>
              <Select
                placeholder="選擇狀態"
                allowClear
                style={{ width: '100%' }}
                onChange={handleStatusChange}
              >
                <Option value="active">上架</Option>
                <Option value="inactive">下架</Option>
                <Option value="draft">草稿</Option>
              </Select>
            </Col>
          </Row>
        </div>

        {/* 商品表格 */}
        <Table
          columns={columns}
          dataSource={products}
          loading={isLoading}
          rowKey="_id"
          pagination={{
            current: searchParams.page,
            pageSize: searchParams.limit,
            total: total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 條，共 ${total} 條`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* 新增/編輯商品彈窗 */}
      <Modal
        title={editingProduct ? '編輯商品' : '新增商品'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
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
                name="name"
                label="商品名稱"
                rules={[{ required: true, message: '請輸入商品名稱' }]}
              >
                <Input placeholder="請輸入商品名稱" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="stock"
                label="庫存"
                rules={[{ required: true, message: '請輸入庫存' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="庫存"
                  min={0}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="商品描述"
            rules={[{ required: true, message: '請輸入商品描述' }]}
          >
            <Input.TextArea rows={3} placeholder="請輸入商品描述" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="price"
                label="售價"
                rules={[{ required: true, message: '請輸入售價' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="售價"
                  min={0}
                  precision={2}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="originalPrice" label="原價">
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="原價"
                  min={0}
                  precision={2}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="brand" label="品牌">
                <Input placeholder="品牌" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="categoryId"
                label="分類"
                rules={[{ required: true, message: '請選擇分類' }]}
              >
                <Select placeholder="請選擇分類">
                  {categories.map((category) => (
                    <Option key={category._id} value={category._id}>
                      {category.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="status"
            label="狀態"
            rules={[{ required: true, message: '請選擇狀態' }]}
          >
            <Select placeholder="請選擇狀態">
              <Option value="active">上架</Option>
              <Option value="inactive">下架</Option>
            </Select>
          </Form.Item>

          <Form.Item label="商品圖片">
            <ImageUpload
              entityType="product"
              entityId={editingProduct?._id || editingProduct?.id || 'new'}
              images={productImages}
              maxCount={5}
              onChange={setProductImages}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={createProductMutation.isPending || updateProductMutation.isPending}>
                {editingProduct ? '更新' : '創建'}
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

export default Products;
