import React, { useMemo, useState } from 'react';
import { Avatar, Button, Card, Form, Select, Space, Table, Tag, Typography } from 'antd';
import { ReloadOutlined, SearchOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

import UnifiedPageLayout from '../../components/common/UnifiedPageLayout';
import { useUsers, useUserStats, type UserListParams } from '../../hooks/useUsers';
import type { UserRecord, UserRole, UserStatus } from '../../services/userService';
import './Users.less';

const { Option } = Select;
const { Text } = Typography;

interface UserFilterForm {
  role?: UserRole;
  status?: UserStatus;
}

const roleLabels: Record<UserRole, { text: string; color: string }> = {
  admin: { text: '系統管理員', color: 'red' },
  manager: { text: '營運經理', color: 'blue' },
  staff: { text: '一般員工', color: 'purple' },
  member: { text: '普通會員', color: 'green' },
};

const statusLabels: Record<UserStatus, { text: string; color: string }> = {
  active: { text: '正常', color: 'green' },
  inactive: { text: '未啟用', color: 'orange' },
  suspended: { text: '已停權', color: 'red' },
};

const Users: React.FC = () => {
  const [filters, setFilters] = useState<UserListParams>({ page: 1, limit: 10 });
  const [filterForm] = Form.useForm<UserFilterForm>();

  const { data: usersResponse, isLoading, refetch } = useUsers(filters);
  const { data: statsResponse } = useUserStats();

  const users = usersResponse?.data.items ?? [];
  const pagination = usersResponse?.data;
  const stats = statsResponse?.data;

  const columns: ColumnsType<UserRecord> = useMemo(
    () => [
      {
        title: '用戶',
        dataIndex: 'name',
        key: 'name',
        render: (_: string, record: UserRecord) => (
          <Space>
            <Avatar icon={<UserOutlined />} size="large" />
            <div>
              <div style={{ fontWeight: 500 }}>{record.name}</div>
              <Text type="secondary">{record.email}</Text>
            </div>
          </Space>
        ),
      },
      {
        title: '角色',
        dataIndex: 'role',
        key: 'role',
        width: 140,
        render: (role: UserRole) => <Tag color={roleLabels[role].color}>{roleLabels[role].text}</Tag>,
      },
      {
        title: '狀態',
        dataIndex: 'status',
        key: 'status',
        width: 120,
        render: (status: UserStatus) => <Tag color={statusLabels[status].color}>{statusLabels[status].text}</Tag>,
      },
      {
        title: '電話',
        dataIndex: 'phone',
        key: 'phone',
        width: 160,
        render: (value?: string) => value ?? '—',
      },
      {
        title: '城市',
        dataIndex: 'city',
        key: 'city',
        width: 140,
        render: (value?: string) => value ?? '—',
      },
      {
        title: '建立時間',
        dataIndex: 'createdAt',
        key: 'createdAt',
        width: 180,
        render: (value: string) => new Date(value).toLocaleString(),
      },
      {
        title: '最後登入',
        dataIndex: 'lastLoginAt',
        key: 'lastLoginAt',
        width: 180,
        render: (value?: string) => (value ? new Date(value).toLocaleString() : '—'),
      },
      {
        title: '權限',
        dataIndex: 'permissions',
        key: 'permissions',
        render: (permissions: string[] = []) => (
          <Space size={[4, 4]} wrap>
            {permissions.slice(0, 3).map((permission) => (
              <Tag key={permission} color="blue">
                {permission}
              </Tag>
            ))}
            {permissions.length > 3 && <Tag color="default">+{permissions.length - 3}</Tag>}
          </Space>
        ),
      },
    ],
    []
  );

  const statsConfig = [
    {
      label: '總用戶數',
      value: stats?.total ?? users.length,
      icon: <TeamOutlined />,
      color: 'var(--primary-500)',
    },
    {
      label: '啟用中',
      value: stats?.active ?? users.filter((user) => user.status === 'active').length,
      icon: <TeamOutlined />,
      color: 'var(--success-500)',
    },
    {
      label: '停權中',
      value: stats?.suspended ?? users.filter((user) => user.status === 'suspended').length,
      icon: <TeamOutlined />,
      color: 'var(--warning-500)',
    },
    {
      label: '本月新增',
      value: stats?.newThisMonth ?? 0,
      icon: <TeamOutlined />,
      color: 'var(--info-500)',
    },
  ];

  function handleFilterSubmit(values: UserFilterForm) {
    setFilters((prev) => ({
      ...prev,
      page: 1,
      role: values.role || undefined,
      status: values.status || undefined,
    }));
  }

  function handleTableChange(page: number, pageSize?: number) {
    setFilters((prev) => ({
      ...prev,
      page,
      limit: pageSize ?? prev.limit,
    }));
  }

  return (
    <UnifiedPageLayout
      title="用戶管理"
      subtitle="檢視用戶列表與基本資訊"
      stats={statsConfig}
      loading={isLoading}
      extra={
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
            重新整理
          </Button>
        </Space>
      }
      filters={
        <Form<UserFilterForm>
          layout="inline"
          form={filterForm}
          onFinish={handleFilterSubmit}
          style={{ display: 'flex', gap: 12 }}
        >
          <Form.Item name="role">
            <Select placeholder="角色" allowClear style={{ width: 160 }}>
              {Object.entries(roleLabels).map(([value, config]) => (
                <Option key={value} value={value}>
                  {config.text}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="status">
            <Select placeholder="狀態" allowClear style={{ width: 160 }}>
              {Object.entries(statusLabels).map(([value, config]) => (
                <Option key={value} value={value}>
                  {config.text}
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
        <Table<UserRecord>
          rowKey={(record) => record.id}
          columns={columns}
          dataSource={users}
          loading={isLoading}
          pagination={{
            total: pagination?.total ?? users.length,
            pageSize: pagination?.limit ?? filters.limit ?? 10,
            current: pagination?.page ?? filters.page ?? 1,
            onChange: handleTableChange,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
        />
      </Card>
    </UnifiedPageLayout>
  );
};

export default Users;
