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
  Switch,
  message,
  Popconfirm,
  Tabs,
  Row,
  Col,
  Statistic,
  Typography,
  Divider,
  Tooltip,
  Badge,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  SafetyOutlined,
  SettingOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import {
  usePermissions,
  useCreatePermission,
  useUpdatePermission,
  useDeletePermission,
  useRoles,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
  useAssignPermissionsToRole,
  useUserRoles,
  useAssignUserRole,
  useRemoveUserRole,
  usePermissionStats,
  useInitializeDefaultData,
} from '../../hooks/useApi';
import type { Permission, Role, UserRole } from '../../services/permissionService';
import './Permissions.less';

const { Title, Text } = Typography;
const { Option } = Select;

const Permissions: React.FC = () => {
  const [activeTab, setActiveTab] = useState('permissions');
  const [permissionModalVisible, setPermissionModalVisible] = useState(false);
  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const [userRoleModalVisible, setUserRoleModalVisible] = useState(false);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [permissionForm] = Form.useForm();
  const [roleForm] = Form.useForm();
  const [userRoleForm] = Form.useForm();

  // 權限相關 hooks
  const { data: permissionsData, isLoading: permissionsLoading } = usePermissions();
  const { data: rolesData, isLoading: rolesLoading } = useRoles();
  const { data: userRolesData, isLoading: userRolesLoading } = useUserRoles();
  const { data: statsData, isLoading: statsLoading } = usePermissionStats();

  const createPermissionMutation = useCreatePermission();
  const updatePermissionMutation = useUpdatePermission();
  const deletePermissionMutation = useDeletePermission();
  const createRoleMutation = useCreateRole();
  const updateRoleMutation = useUpdateRole();
  const deleteRoleMutation = useDeleteRole();
  const assignPermissionsMutation = useAssignPermissionsToRole();
  const assignUserRoleMutation = useAssignUserRole();
  const removeUserRoleMutation = useRemoveUserRole();
  const initializeDataMutation = useInitializeDefaultData();

  // Tabs items 配置
  const tabItems = [
    {
      key: 'permissions',
      label: '權限管理',
      children: (
        <Table
          columns={permissionColumns}
          dataSource={permissionsData?.data || []}
          loading={permissionsLoading}
          rowKey="_id"
          pagination={{
            total: permissionsData?.total || 0,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 條記錄`,
          }}
        />
      ),
    },
    {
      key: 'roles',
      label: '角色管理',
      children: (
        <Table
          columns={roleColumns}
          dataSource={rolesData?.data || []}
          loading={rolesLoading}
          rowKey="_id"
          pagination={{
            total: rolesData?.total || 0,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 條記錄`,
          }}
        />
      ),
    },
    {
      key: 'user-roles',
      label: '用戶角色',
      children: (
        <Table
          columns={userRoleColumns}
          dataSource={userRolesData?.data || []}
          loading={userRolesLoading}
          rowKey="_id"
          pagination={{
            total: userRolesData?.total || 0,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 條記錄`,
          }}
        />
      ),
    },
  ];

  // 權限表格列定義
  const permissionColumns = [
    {
      title: '權限名稱',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => (
        <Space>
          <SafetyOutlined />
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '模組',
      dataIndex: 'module',
      key: 'module',
      render: (module: string) => (
        <Tag color="blue">{module}</Tag>
      ),
    },
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      render: (action: string) => (
        <Tag color="green">{action}</Tag>
      ),
    },
    {
      title: '分類',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => (
        <Tag color="purple">{category}</Tag>
      ),
    },
    {
      title: '狀態',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Badge status={isActive ? 'success' : 'error'} text={isActive ? '啟用' : '停用'} />
      ),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: Permission) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditPermission(record)}
          >
            編輯
          </Button>
          <Popconfirm
            title="確定要刪除這個權限嗎？"
            onConfirm={() => handleDeletePermission(record._id)}
            okText="確定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              刪除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 角色表格列定義
  const roleColumns = [
    {
      title: '角色名稱',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => (
        <Space>
          <UserOutlined />
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '權限數量',
      dataIndex: 'permissions',
      key: 'permissions',
      render: (permissions: Permission[]) => (
        <Badge count={permissions?.length || 0} showZero color="blue" />
      ),
    },
    {
      title: '狀態',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Badge status={isActive ? 'success' : 'error'} text={isActive ? '啟用' : '停用'} />
      ),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: Role) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditRole(record)}
          >
            編輯
          </Button>
          <Button
            type="link"
            icon={<SettingOutlined />}
            onClick={() => handleManagePermissions(record)}
          >
            權限管理
          </Button>
          <Popconfirm
            title="確定要刪除這個角色嗎？"
            onConfirm={() => handleDeleteRole(record._id)}
            okText="確定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              刪除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 用戶角色表格列定義
  const userRoleColumns = [
    {
      title: '用戶ID',
      dataIndex: 'userId',
      key: 'userId',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: Role) => (
        <Tag color="blue">{role?.name}</Tag>
      ),
    },
    {
      title: '分配者',
      dataIndex: 'assignedBy',
      key: 'assignedBy',
    },
    {
      title: '過期時間',
      dataIndex: 'expiresAt',
      key: 'expiresAt',
      render: (expiresAt: string) => (
        expiresAt ? new Date(expiresAt).toLocaleDateString() : '永不過期'
      ),
    },
    {
      title: '狀態',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Badge status={isActive ? 'success' : 'error'} text={isActive ? '啟用' : '停用'} />
      ),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: UserRole) => (
        <Space>
          <Popconfirm
            title="確定要移除這個角色分配嗎？"
            onConfirm={() => handleRemoveUserRole(record._id)}
            okText="確定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              移除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 處理權限相關操作
  const handleCreatePermission = () => {
    setEditingPermission(null);
    permissionForm.resetFields();
    setPermissionModalVisible(true);
  };

  const handleEditPermission = (permission: Permission) => {
    setEditingPermission(permission);
    permissionForm.setFieldsValue(permission);
    setPermissionModalVisible(true);
  };

  const handleDeletePermission = async (id: string) => {
    try {
      await deletePermissionMutation.mutateAsync(id);
      message.success('權限刪除成功');
    } catch (error) {
      message.error('權限刪除失敗');
    }
  };

  const handlePermissionSubmit = async (values: any) => {
    try {
      if (editingPermission) {
        await updatePermissionMutation.mutateAsync({
          id: editingPermission._id,
          permission: values,
        });
        message.success('權限更新成功');
      } else {
        await createPermissionMutation.mutateAsync(values);
        message.success('權限創建成功');
      }
      setPermissionModalVisible(false);
    } catch (error) {
      message.error('操作失敗');
    }
  };

  // 處理角色相關操作
  const handleCreateRole = () => {
    setEditingRole(null);
    roleForm.resetFields();
    setRoleModalVisible(true);
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    roleForm.setFieldsValue(role);
    setRoleModalVisible(true);
  };

  const handleDeleteRole = async (id: string) => {
    try {
      await deleteRoleMutation.mutateAsync(id);
      message.success('角色刪除成功');
    } catch (error) {
      message.error('角色刪除失敗');
    }
  };

  const handleRoleSubmit = async (values: any) => {
    try {
      if (editingRole) {
        await updateRoleMutation.mutateAsync({
          id: editingRole._id,
          role: values,
        });
        message.success('角色更新成功');
      } else {
        await createRoleMutation.mutateAsync(values);
        message.success('角色創建成功');
      }
      setRoleModalVisible(false);
    } catch (error) {
      message.error('操作失敗');
    }
  };

  const handleManagePermissions = (role: Role) => {
    // TODO: 實現權限管理功能
    message.info('權限管理功能開發中...');
  };

  // 處理用戶角色相關操作
  const handleCreateUserRole = () => {
    userRoleForm.resetFields();
    setUserRoleModalVisible(true);
  };

  const handleRemoveUserRole = async (id: string) => {
    try {
      await removeUserRoleMutation.mutateAsync(id);
      message.success('角色分配移除成功');
    } catch (error) {
      message.error('操作失敗');
    }
  };

  const handleUserRoleSubmit = async (values: any) => {
    try {
      await assignUserRoleMutation.mutateAsync(values);
      message.success('角色分配成功');
      setUserRoleModalVisible(false);
    } catch (error) {
      message.error('操作失敗');
    }
  };

  // 初始化默認數據
  const handleInitializeData = async () => {
    try {
      await initializeDataMutation.mutateAsync();
      message.success('默認數據初始化成功');
    } catch (error) {
      message.error('初始化失敗');
    }
  };

  return (
    <div className="permissions-page">
      <div className="page-header">
        <Title level={2}>
          <SafetyOutlined /> 權限管理
        </Title>
        <Text type="secondary">
          管理系統權限、角色和用戶權限分配
        </Text>
      </div>

      {/* 統計卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="總權限數"
              value={statsData?.totalPermissions || 0}
              prefix={<SafetyOutlined />}
              loading={statsLoading}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="總角色數"
              value={statsData?.totalRoles || 0}
              prefix={<UserOutlined />}
              loading={statsLoading}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="用戶角色分配"
              value={statsData?.totalUserRoles || 0}
              prefix={<SettingOutlined />}
              loading={statsLoading}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="活躍權限"
              value={statsData?.permissionsByModule ? Object.keys(statsData.permissionsByModule).length : 0}
              prefix={<InfoCircleOutlined />}
              loading={statsLoading}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <div className="table-header">
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreatePermission}
            >
              新增權限
            </Button>
            <Button
              icon={<PlusOutlined />}
              onClick={handleCreateRole}
            >
              新增角色
            </Button>
            <Button
              icon={<PlusOutlined />}
              onClick={handleCreateUserRole}
            >
              分配角色
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleInitializeData}
              loading={initializeDataMutation.isPending}
            >
              初始化數據
            </Button>
          </Space>
        </div>

        <Divider />

        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      </Card>

      {/* 權限編輯彈窗 */}
      <Modal
        title={editingPermission ? '編輯權限' : '新增權限'}
        open={permissionModalVisible}
        onCancel={() => setPermissionModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={permissionForm}
          layout="vertical"
          onFinish={handlePermissionSubmit}
        >
          <Form.Item
            name="name"
            label="權限名稱"
            rules={[{ required: true, message: '請輸入權限名稱' }]}
          >
            <Input placeholder="例如: users:read" />
          </Form.Item>

          <Form.Item
            name="description"
            label="描述"
          >
            <Input.TextArea rows={3} placeholder="權限描述" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="module"
                label="模組"
                rules={[{ required: true, message: '請選擇模組' }]}
              >
                <Select placeholder="選擇模組">
                  <Option value="users">用戶管理</Option>
                  <Option value="products">商品管理</Option>
                  <Option value="orders">訂單管理</Option>
                  <Option value="analytics">數據分析</Option>
                  <Option value="settings">系統設定</Option>
                  <Option value="permissions">權限管理</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="action"
                label="操作"
                rules={[{ required: true, message: '請選擇操作' }]}
              >
                <Select placeholder="選擇操作">
                  <Option value="read">讀取</Option>
                  <Option value="write">寫入</Option>
                  <Option value="delete">刪除</Option>
                  <Option value="manage">管理</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="category"
            label="分類"
          >
            <Input placeholder="權限分類" />
          </Form.Item>

          <Form.Item
            name="isActive"
            label="狀態"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch checkedChildren="啟用" unCheckedChildren="停用" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={createPermissionMutation.isPending || updatePermissionMutation.isPending}>
                {editingPermission ? '更新' : '創建'}
              </Button>
              <Button onClick={() => setPermissionModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 角色編輯彈窗 */}
      <Modal
        title={editingRole ? '編輯角色' : '新增角色'}
        open={roleModalVisible}
        onCancel={() => setRoleModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={roleForm}
          layout="vertical"
          onFinish={handleRoleSubmit}
        >
          <Form.Item
            name="name"
            label="角色名稱"
            rules={[{ required: true, message: '請輸入角色名稱' }]}
          >
            <Input placeholder="例如: admin, manager, staff" />
          </Form.Item>

          <Form.Item
            name="description"
            label="描述"
          >
            <Input.TextArea rows={3} placeholder="角色描述" />
          </Form.Item>

          <Form.Item
            name="isActive"
            label="狀態"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch checkedChildren="啟用" unCheckedChildren="停用" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={createRoleMutation.isPending || updateRoleMutation.isPending}>
                {editingRole ? '更新' : '創建'}
              </Button>
              <Button onClick={() => setRoleModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 用戶角色分配彈窗 */}
      <Modal
        title="分配角色"
        open={userRoleModalVisible}
        onCancel={() => setUserRoleModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form
          form={userRoleForm}
          layout="vertical"
          onFinish={handleUserRoleSubmit}
        >
          <Form.Item
            name="userId"
            label="用戶ID"
            rules={[{ required: true, message: '請輸入用戶ID' }]}
          >
            <Input placeholder="用戶ID" />
          </Form.Item>

          <Form.Item
            name="roleId"
            label="角色"
            rules={[{ required: true, message: '請選擇角色' }]}
          >
            <Select placeholder="選擇角色">
              {rolesData?.data?.map((role) => (
                <Option key={role._id} value={role._id}>
                  {role.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="expiresAt"
            label="過期時間"
          >
            <Input placeholder="YYYY-MM-DD (可選)" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={assignUserRoleMutation.isPending}>
                分配
              </Button>
              <Button onClick={() => setUserRoleModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Permissions;
