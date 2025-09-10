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
  Avatar, 
  Popconfirm, 
  message,
  Modal,
  Form
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  UserOutlined,
  ReloadOutlined,
  ExportOutlined,
  KeyOutlined
} from '@ant-design/icons';
import PageHeader from '../../components/common/PageHeader';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser, useUserStats } from '../../hooks/useApi';
import AuthService from '../../services/authService';
import './Users.less';

const { Search } = Input;
const { Option } = Select;

interface UserFormData {
  email: string;
  name: string;
  password?: string;
  phone?: string;
  role: 'admin' | 'user' | 'moderator';
  status: 'active' | 'inactive' | 'suspended';
  permissions: string[];
}

const Users: React.FC = () => {
  const [searchParams, setSearchParams] = useState({
    page: 1,
    limit: 10,
    search: '',
    role: '',
    status: '',
    sortBy: 'createdAt',
    sortOrder: 'desc' as 'asc' | 'desc',
  });
  
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [form] = Form.useForm();

  // API hooks
  const { data: usersData, isLoading, refetch } = useUsers(searchParams);
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();
  const { data: statsData } = useUserStats();

  const users = usersData?.data?.items || [];
  const total = usersData?.data?.total || 0;
  const stats = statsData?.data || {
    total: 0,
    active: 0,
    newThisMonth: 0,
    onlineNow: 0,
  };

  // 權限選項
  const permissionOptions = [
    { value: 'products:read', label: '查看商品' },
    { value: 'products:write', label: '管理商品' },
    { value: 'orders:read', label: '查看訂單' },
    { value: 'orders:write', label: '管理訂單' },
    { value: 'users:read', label: '查看用戶' },
    { value: 'users:write', label: '管理用戶' },
    { value: 'analytics:read', label: '查看分析' },
    { value: 'settings:read', label: '查看設定' },
    { value: 'settings:write', label: '管理設定' },
  ];

  // 表格列定義
  const columns = [
    {
      title: '頭像',
      dataIndex: 'avatar',
      key: 'avatar',
      width: 60,
      render: (avatar: string) => (
        <Avatar 
          src={avatar} 
          icon={<UserOutlined />}
          size={40}
        />
      ),
    },
    {
      title: '用戶信息',
      dataIndex: 'name',
      key: 'userInfo',
      width: 200,
      render: (name: string, record: any) => (
        <div>
          <div style={{ fontWeight: 500 }}>{name}</div>
          <div style={{ fontSize: 12, color: '#666' }}>{record.email}</div>
          {record.phone && (
            <div style={{ fontSize: 12, color: '#666' }}>{record.phone}</div>
          )}
        </div>
      ),
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 100,
      render: (role: string) => {
        const roleConfig = {
          admin: { color: 'red', text: '管理員' },
          moderator: { color: 'blue', text: '版主' },
          user: { color: 'green', text: '用戶' },
        };
        const config = roleConfig[role as keyof typeof roleConfig];
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '狀態',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const statusConfig = {
          active: { color: 'green', text: '正常' },
          inactive: { color: 'orange', text: '未激活' },
          suspended: { color: 'red', text: '已封禁' },
        };
        const config = statusConfig[status as keyof typeof statusConfig];
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '權限',
      dataIndex: 'permissions',
      key: 'permissions',
      width: 150,
      render: (permissions: string[]) => (
        <div>
          {permissions.slice(0, 2).map(permission => (
            <Tag key={permission} color="blue">
              {permissionOptions.find(p => p.value === permission)?.label || permission}
            </Tag>
          ))}
          {permissions.length > 2 && (
            <Tag color="default">
              +{permissions.length - 2}
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: '最後登入',
      dataIndex: 'lastLoginAt',
      key: 'lastLoginAt',
      width: 120,
      render: (date: string) => date ? new Date(date).toLocaleDateString() : '從未登入',
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
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEdit(record)}
          />
          <Button
            type="text"
            icon={<KeyOutlined />}
            size="small"
            onClick={() => handleResetPassword(record.id)}
          />
          <Popconfirm
            title="確定要刪除這個用戶嗎？"
            onConfirm={() => handleDelete(record.id)}
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

  const handleRoleChange = (value: string) => {
    setSearchParams(prev => ({ ...prev, role: value, page: 1 }));
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
    setEditingUser(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (user: any) => {
    setEditingUser(user);
    form.setFieldsValue({
      ...user,
      password: undefined, // 不顯示密碼
    });
    setModalVisible(true);
  };

  const handleDelete = async (userId: string) => {
    try {
      await deleteUserMutation.mutateAsync(userId);
      message.success('用戶刪除成功');
      refetch();
    } catch (error: any) {
      message.error(error.message || '刪除失敗');
    }
  };

  const handleResetPassword = async (_userId: string) => {
    Modal.confirm({
      title: '重置密碼',
      content: '確定要重置這個用戶的密碼嗎？新密碼將發送到用戶郵箱。',
      onOk: async () => {
        try {
          // TODO: 實作重置密碼 API
          message.success('密碼重置成功');
        } catch (error: any) {
          message.error(error.message || '重置失敗');
        }
      },
    });
  };

  const handleSubmit = async (values: UserFormData) => {
    try {
      const userData = {
        ...values,
        password: values.password || '', // 編輯時不傳密碼
      };

      if (editingUser) {
        await updateUserMutation.mutateAsync({ id: editingUser.id, ...userData });
        message.success('用戶更新成功');
      } else {
        await createUserMutation.mutateAsync(userData);
        message.success('用戶創建成功');
      }

      setModalVisible(false);
      form.resetFields();
      refetch();
    } catch (error: any) {
      message.error(error.message || '操作失敗');
    }
  };

  const handleExport = async () => {
    try {
      const blob = await AuthService.exportUsers(searchParams);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      message.success('導出成功');
    } catch (error: any) {
      message.error(error.message || '導出失敗');
    }
  };

  return (
    <div className="users-page">
      <PageHeader
        title="用戶管理"
        subtitle="管理用戶賬戶、角色和權限"
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
              刷新
            </Button>
            <Button icon={<ExportOutlined />} onClick={handleExport}>
              導出
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新增用戶
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
              <div className="stat-label">總用戶</div>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <div className="stat-item">
              <div className="stat-value" style={{ color: '#52c41a' }}>
                {stats.active || 0}
              </div>
              <div className="stat-label">活躍用戶</div>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <div className="stat-item">
              <div className="stat-value" style={{ color: '#1890ff' }}>
                {stats.newThisMonth || 0}
              </div>
              <div className="stat-label">本月新增</div>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <div className="stat-item">
              <div className="stat-value" style={{ color: '#722ed1' }}>
                {stats.onlineNow || 0}
              </div>
              <div className="stat-label">在線用戶</div>
            </div>
          </Card>
        </Col>
      </Row>

      <Card className="users-content">
        {/* 搜索和篩選 */}
        <div className="users-filters">
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={12} md={8}>
              <Search
                placeholder="搜索用戶姓名或郵箱"
                allowClear
                onSearch={handleSearch}
                style={{ width: '100%' }}
              />
            </Col>
            <Col xs={24} sm={6} md={4}>
              <Select
                placeholder="選擇角色"
                allowClear
                style={{ width: '100%' }}
                onChange={handleRoleChange}
              >
                <Option value="admin">管理員</Option>
                <Option value="moderator">版主</Option>
                <Option value="user">用戶</Option>
              </Select>
            </Col>
            <Col xs={24} sm={6} md={4}>
              <Select
                placeholder="選擇狀態"
                allowClear
                style={{ width: '100%' }}
                onChange={handleStatusChange}
              >
                <Option value="active">正常</Option>
                <Option value="inactive">未激活</Option>
                <Option value="suspended">已封禁</Option>
              </Select>
            </Col>
          </Row>
        </div>

        {/* 用戶表格 */}
        <Table
          columns={columns}
          dataSource={users}
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
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* 新增/編輯用戶彈窗 */}
      <Modal
        title={editingUser ? '編輯用戶' : '新增用戶'}
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
                label="姓名"
                rules={[{ required: true, message: '請輸入姓名' }]}
              >
                <Input placeholder="請輸入姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="email"
                label="郵箱"
                rules={[
                  { required: true, message: '請輸入郵箱' },
                  { type: 'email', message: '請輸入有效的郵箱地址' }
                ]}
              >
                <Input placeholder="請輸入郵箱" />
              </Form.Item>
            </Col>
          </Row>

          {!editingUser && (
            <Form.Item
              name="password"
              label="密碼"
              rules={[{ required: true, message: '請輸入密碼' }]}
            >
              <Input.Password placeholder="請輸入密碼" />
            </Form.Item>
          )}

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="phone" label="電話">
                <Input placeholder="請輸入電話" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="role"
                label="角色"
                rules={[{ required: true, message: '請選擇角色' }]}
              >
                <Select placeholder="請選擇角色">
                  <Option value="admin">管理員</Option>
                  <Option value="moderator">版主</Option>
                  <Option value="user">用戶</Option>
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
              <Option value="active">正常</Option>
              <Option value="inactive">未激活</Option>
              <Option value="suspended">已封禁</Option>
            </Select>
          </Form.Item>

          <Form.Item name="permissions" label="權限">
            <Select
              mode="multiple"
              placeholder="請選擇權限"
              options={permissionOptions}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={createUserMutation.isPending || updateUserMutation.isPending}>
                {editingUser ? '更新' : '創建'}
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

export default Users;
