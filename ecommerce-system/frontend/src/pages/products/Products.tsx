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
  Tooltip,
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

  // 處理產品數據，映射字段名稱
  const rawProducts = productsData?.data?.items || [];
  const products = rawProducts.map((product: any) => ({
    ...product,
    stock: product.stock_quantity || product.stock || 0,
    category: product.category_name || product.category || '未分類',
    createdAt: product.created_at || product.createdAt,
    images: product.images || [],
    // 轉換狀態：1=active, 0=inactive
    status: product.status === 1 ? 'active' : product.status === 0 ? 'inactive' : product.status
  }));
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
              backgroundColor: 'rgba(45, 45, 45, 0.8)', 
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              color: '#999',
              border: '1px solid #404040'
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
        <Tag 
          style={{ 
            backgroundColor: 'rgba(24, 144, 255, 0.2)',
            borderColor: '#1890ff',
            color: '#1890ff'
          }}
        >
          {category}
        </Tag>
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
        <Tag 
          color={stock > 10 ? 'green' : stock > 0 ? 'orange' : 'red'}
          style={{ 
            backgroundColor: stock > 10 ? 'rgba(82, 196, 26, 0.2)' : 
                           stock > 0 ? 'rgba(250, 173, 20, 0.2)' : 
                           'rgba(255, 77, 79, 0.2)',
            borderColor: stock > 10 ? '#52c41a' : 
                        stock > 0 ? '#faad14' : 
                        '#ff4d4f',
            color: stock > 10 ? '#52c41a' : 
                   stock > 0 ? '#faad14' : 
                   '#ff4d4f'
          }}
        >
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
          active: { color: '#52c41a', bgColor: 'rgba(82, 196, 26, 0.2)', text: '上架' },
          inactive: { color: '#ff4d4f', bgColor: 'rgba(255, 77, 79, 0.2)', text: '下架' },
          draft: { color: '#faad14', bgColor: 'rgba(250, 173, 20, 0.2)', text: '草稿' },
        };
        const config = statusConfig[status as keyof typeof statusConfig];
        if (!config) {
          return (
            <Tag style={{ 
              backgroundColor: 'rgba(45, 45, 45, 0.8)',
              borderColor: '#404040',
              color: '#fff'
            }}>
              {status || '未知狀態'}
            </Tag>
          );
        }
        return (
          <Tag 
            style={{ 
              backgroundColor: config.bgColor,
              borderColor: config.color,
              color: config.color
            }}
          >
            {config.text}
          </Tag>
        );
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
          <Tooltip title="查看詳情">
            <Button
              type="text"
              icon={<EyeOutlined />}
              size="small"
              onClick={() => handleView(record)}
              style={{ color: '#fff' }}
            />
          </Tooltip>
          <Tooltip title="編輯商品">
            <Button
              type="text"
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleEdit(record)}
              style={{ color: '#fff' }}
            />
          </Tooltip>
          <Popconfirm
            title="確定要刪除這個商品嗎？"
            onConfirm={() => handleDelete(record.public_id)}
            okText="確定"
            cancelText="取消"
          >
            <Tooltip title="刪除商品">
              <Button
                type="text"
                icon={<DeleteOutlined />}
                size="small"
                danger
                style={{ color: '#ff4d4f' }}
              />
            </Tooltip>
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
      title: (
        <div style={{ color: '#fff', fontSize: '18px', fontWeight: 'bold' }}>
          商品詳情
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
        <div style={{ color: '#fff' }}>
          {/* 商品圖片區域 */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            {product.images && product.images.length > 0 ? (
              <Image
                src={product.images[0]}
                alt="商品圖片"
                width={200}
                height={200}
                style={{ 
                  objectFit: 'cover', 
                  borderRadius: 8,
                  border: '2px solid #404040'
                }}
                fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN"
              />
            ) : (
              <div style={{ 
                width: 200, 
                height: 200, 
                backgroundColor: 'rgba(45, 45, 45, 0.8)', 
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
                color: '#999',
                border: '2px solid #404040',
                margin: '0 auto'
              }}>
                無商品圖片
              </div>
            )}
          </div>

          {/* 商品基本信息 */}
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ color: '#fff', marginBottom: 16, fontSize: '16px', fontWeight: 'bold' }}>
              📋 商品信息
            </h3>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <div style={{ 
                  backgroundColor: 'rgba(45, 45, 45, 0.8)',
                  padding: 16,
                  borderRadius: 8,
                  border: '1px solid #404040',
                  marginBottom: 12
                }}>
                  <div style={{ color: '#b0b0b0', fontSize: 12, marginBottom: 4 }}>商品名稱</div>
                  <div style={{ color: '#fff', fontSize: 14, fontWeight: 'bold' }}>{product.name}</div>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ 
                  backgroundColor: 'rgba(45, 45, 45, 0.8)',
                  padding: 16,
                  borderRadius: 8,
                  border: '1px solid #404040',
                  marginBottom: 12
                }}>
                  <div style={{ color: '#b0b0b0', fontSize: 12, marginBottom: 4 }}>SKU</div>
                  <div style={{ color: '#fff', fontSize: 14, fontWeight: 'bold' }}>{product.sku}</div>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ 
                  backgroundColor: 'rgba(45, 45, 45, 0.8)',
                  padding: 16,
                  borderRadius: 8,
                  border: '1px solid #404040',
                  marginBottom: 12
                }}>
                  <div style={{ color: '#b0b0b0', fontSize: 12, marginBottom: 4 }}>分類</div>
                  <div style={{ color: '#fff', fontSize: 14, fontWeight: 'bold' }}>{product.category}</div>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ 
                  backgroundColor: 'rgba(45, 45, 45, 0.8)',
                  padding: 16,
                  borderRadius: 8,
                  border: '1px solid #404040',
                  marginBottom: 12
                }}>
                  <div style={{ color: '#b0b0b0', fontSize: 12, marginBottom: 4 }}>品牌</div>
                  <div style={{ color: '#fff', fontSize: 14, fontWeight: 'bold' }}>{product.brand || '未設定'}</div>
                </div>
              </Col>
            </Row>
          </div>

          {/* 價格和庫存信息 */}
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ color: '#fff', marginBottom: 16, fontSize: '16px', fontWeight: 'bold' }}>
              💰 價格與庫存
            </h3>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <div style={{ 
                  backgroundColor: 'rgba(24, 144, 255, 0.1)',
                  padding: 20,
                  borderRadius: 8,
                  border: '2px solid #1890ff',
                  textAlign: 'center'
                }}>
                  <div style={{ color: '#1890ff', fontSize: 12, marginBottom: 8 }}>💰 商品價格</div>
                  <div style={{ color: '#1890ff', fontSize: 24, fontWeight: 'bold' }}>${product.price}</div>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ 
                  backgroundColor: product.stock > 10 ? 'rgba(82, 196, 26, 0.1)' : 
                                 product.stock > 0 ? 'rgba(250, 173, 20, 0.1)' : 
                                 'rgba(255, 77, 79, 0.1)',
                  padding: 20,
                  borderRadius: 8,
                  border: `2px solid ${product.stock > 10 ? '#52c41a' : 
                                          product.stock > 0 ? '#faad14' : 
                                          '#ff4d4f'}`,
                  textAlign: 'center'
                }}>
                  <div style={{ 
                    color: product.stock > 10 ? '#52c41a' : 
                           product.stock > 0 ? '#faad14' : 
                           '#ff4d4f', 
                    fontSize: 12, 
                    marginBottom: 8 
                  }}>
                    📦 當前庫存
                  </div>
                  <div style={{ 
                    color: product.stock > 10 ? '#52c41a' : 
                           product.stock > 0 ? '#faad14' : 
                           '#ff4d4f', 
                    fontSize: 24, 
                    fontWeight: 'bold' 
                  }}>
                    {product.stock}
                  </div>
                </div>
              </Col>
            </Row>
          </div>

          {/* 其他信息 */}
          <div>
            <h3 style={{ color: '#fff', marginBottom: 16, fontSize: '16px', fontWeight: 'bold' }}>
              ℹ️ 其他信息
            </h3>
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <div style={{ 
                  backgroundColor: 'rgba(45, 45, 45, 0.8)',
                  padding: 16,
                  borderRadius: 8,
                  border: '1px solid #404040',
                  marginBottom: 12
                }}>
                  <div style={{ color: '#b0b0b0', fontSize: 12, marginBottom: 4 }}>商品描述</div>
                  <div style={{ color: '#fff', fontSize: 14, lineHeight: 1.5 }}>
                    {product.description || '暫無描述'}
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ 
                  backgroundColor: 'rgba(45, 45, 45, 0.8)',
                  padding: 16,
                  borderRadius: 8,
                  border: '1px solid #404040',
                  marginBottom: 12
                }}>
                  <div style={{ color: '#b0b0b0', fontSize: 12, marginBottom: 4 }}>商品狀態</div>
                  <Tag 
                    style={{ 
                      backgroundColor: product.status === 'active' ? 'rgba(82, 196, 26, 0.2)' : 
                                       product.status === 'inactive' ? 'rgba(255, 77, 79, 0.2)' : 
                                       'rgba(250, 173, 20, 0.2)',
                      borderColor: product.status === 'active' ? '#52c41a' : 
                                  product.status === 'inactive' ? '#ff4d4f' : 
                                  '#faad14',
                      color: product.status === 'active' ? '#52c41a' : 
                             product.status === 'inactive' ? '#ff4d4f' : 
                             '#faad14'
                    }}
                  >
                    {product.status === 'active' ? '上架' : 
                     product.status === 'inactive' ? '下架' : 
                     product.status === 'draft' ? '草稿' : product.status}
                  </Tag>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ 
                  backgroundColor: 'rgba(45, 45, 45, 0.8)',
                  padding: 16,
                  borderRadius: 8,
                  border: '1px solid #404040',
                  marginBottom: 12
                }}>
                  <div style={{ color: '#b0b0b0', fontSize: 12, marginBottom: 4 }}>創建時間</div>
                  <div style={{ color: '#fff', fontSize: 14 }}>
                    {product.createdAt ? new Date(product.createdAt).toLocaleString() : '未知'}
                  </div>
                </div>
              </Col>
            </Row>
          </div>
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
        // 使用 public_id 作為商品 ID
        const productId = editingProduct.public_id;
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
    <div 
      className="products-page"
      style={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)',
        padding: '24px'
      }}
    >
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#fff' }}>商品列表</h2>
        <p style={{ margin: '8px 0 0 0', color: '#b0b0b0', fontSize: '14px' }}>
          查看和管理商品信息、庫存和狀態
        </p>
        <div style={{ marginTop: 16 }}>
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={() => refetch()}
              style={{ color: '#fff', borderColor: '#404040' }}
            >
              刷新
            </Button>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={handleAdd}
              style={{ backgroundColor: '#1890ff', borderColor: '#1890ff' }}
            >
              新增商品
            </Button>
          </Space>
        </div>
      </div>

      <Card 
        className="products-content"
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
        {/* 搜索和篩選 */}
        <div className="products-filters" style={{ marginBottom: 24 }}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={12} md={8}>
              <Search
                placeholder="搜索商品名稱或SKU"
                allowClear
                onSearch={handleSearch}
                style={{ 
                  width: '100%',
                  backgroundColor: 'rgba(45, 45, 45, 0.8)',
                  borderColor: '#404040'
                }}
                className="dark-search"
              />
            </Col>
            <Col xs={24} sm={6} md={4}>
              <Select
                placeholder="選擇分類"
                allowClear
                style={{ 
                  width: '100%',
                  backgroundColor: 'rgba(45, 45, 45, 0.8)',
                  borderColor: '#404040'
                }}
                className="dark-select"
                onChange={handleCategoryChange}
              >
                {categories.map((category) => (
                  <Option key={category._id || category.category_id} value={category._id || category.category_id}>
                    {category.name}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={6} md={4}>
              <Select
                placeholder="選擇狀態"
                allowClear
                style={{ 
                  width: '100%',
                  backgroundColor: 'rgba(45, 45, 45, 0.8)',
                  borderColor: '#404040'
                }}
                className="dark-select"
                onChange={handleStatusChange}
              >
                <Option key="active" value="active">上架</Option>
                <Option key="inactive" value="inactive">下架</Option>
                <Option key="draft" value="draft">草稿</Option>
              </Select>
            </Col>
          </Row>
        </div>

        {/* 商品表格 */}
        <Table
          columns={columns}
          dataSource={products}
          loading={isLoading}
          rowKey="public_id"
          style={{
            backgroundColor: 'transparent'
          }}
          className="dark-table"
          pagination={{
            current: searchParams.page,
            pageSize: searchParams.limit,
            total: total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 條，共 ${total} 條`,
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
        className="dark-modal"
        styles={{
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
        }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="dark-form"
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
                    <Option key={category._id || category.category_id} value={category._id || category.category_id}>
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
              <Option key="active" value="active">上架</Option>
              <Option key="inactive" value="inactive">下架</Option>
            </Select>
          </Form.Item>

          <Form.Item label="商品圖片">
            <ImageUpload
              entityType="product"
              entityId={editingProduct?.public_id || 'new'}
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
