import React, { useMemo } from 'react';
import { Card, List, Space, Table, Tag, Typography } from 'antd';
import {
  useCurrentPermissions,
  usePermissionCatalog,
  usePermissionStats,
  useRoleCatalog,
  type PermissionDefinition,
  type RoleDefinition,
} from '../../hooks/usePermissions';
import UnifiedPageLayout from '../../components/common/UnifiedPageLayout';

const { Paragraph, Text } = Typography;

const Permissions: React.FC = () => {
  const { data: roleResponse, isLoading: roleLoading } = useRoleCatalog();
  const { data: permissionResponse, isLoading: permissionLoading } = usePermissionCatalog();
  const { data: statsResponse } = usePermissionStats();
  const { data: currentPermissionsResponse } = useCurrentPermissions();

  const roles = roleResponse?.data.roles ?? [];
  const permissions = permissionResponse?.data.permissions ?? [];
  const stats = statsResponse?.data;
  const currentPermissions = currentPermissionsResponse?.data.permissions ?? [];

  const roleColumns = useMemo(
    () => [
      {
        title: '角色名稱',
        dataIndex: 'name',
        key: 'name',
        render: (value: string, record: RoleDefinition) => (
          <Space direction="vertical" size={0}>
            <Text strong>{value}</Text>
            <Text type="secondary">{record.description}</Text>
          </Space>
        ),
      },
      {
        title: '權限數量',
        dataIndex: 'permissions',
        key: 'permissions',
        width: 140,
        render: (value: RoleDefinition['permissions']) => <Tag color="blue">{value.length}</Tag>,
      },
      {
        title: '系統角色',
        dataIndex: 'isSystem',
        key: 'isSystem',
        width: 120,
        render: (isSystem?: boolean) => (isSystem ? <Tag color="purple">系統</Tag> : <Tag>自訂</Tag>),
      },
      {
        title: '權限列表',
        dataIndex: 'permissions',
        key: 'permissionList',
        render: (value: RoleDefinition['permissions']) => (
          <Space size={[6, 6]} wrap>
            {value.map((permission) => (
              <Tag key={permission} color="green">
                {permission}
              </Tag>
            ))}
          </Space>
        ),
      },
    ],
    []
  );

  const permissionColumns = useMemo(
    () => [
      {
        title: '權限代碼',
        dataIndex: 'key',
        key: 'key',
        width: 220,
        render: (value: string) => <Text code>{value}</Text>,
      },
      {
        title: '權限名稱',
        dataIndex: 'name',
        key: 'name',
      },
      {
        title: '模組',
        dataIndex: 'module',
        key: 'module',
        width: 140,
        render: (value: string) => <Tag color="blue">{value}</Tag>,
      },
      {
        title: '操作',
        dataIndex: 'action',
        key: 'action',
        width: 100,
        render: (value: string) => <Tag color="cyan">{value}</Tag>,
      },
      {
        title: '類別',
        dataIndex: 'category',
        key: 'category',
        width: 120,
        render: (value: PermissionDefinition['category']) => {
          const colorMap: Record<PermissionDefinition['category'], string> = {
            basic: 'green',
            advanced: 'orange',
            admin: 'purple',
            system: 'red',
          };
          return <Tag color={colorMap[value] || 'default'}>{value}</Tag>;
        },
      },
      {
        title: '描述',
        dataIndex: 'description',
        key: 'description',
      },
    ],
    []
  );

  const statsConfig = [
    {
      label: '權限總數',
      value: stats?.totalPermissions ?? permissions.length,
      icon: '🔐',
      color: 'var(--primary-500)',
    },
    {
      label: '角色總數',
      value: stats?.totalRoles ?? roles.length,
      icon: '👥',
      color: 'var(--success-500)',
    },
    {
      label: '系統內建角色',
      value: stats?.systemRoles ?? roles.filter((role) => role.isSystem).length,
      icon: '🛡️',
      color: 'var(--warning-500)',
    },
    {
      label: '擁有權限',
      value: currentPermissions.length,
      icon: '✅',
      color: 'var(--info-500)',
    },
  ];

  const moduleDistribution = Object.entries(stats?.modules ?? {}).map(([module, count]) => ({ module, count }));

  return (
    <UnifiedPageLayout
      title="權限與角色概覽"
      subtitle="檢視系統預設角色與權限配置"
      stats={statsConfig}
      loading={roleLoading || permissionLoading}
    >
      <Space direction="vertical" size={24} style={{ width: '100%' }}>
        <Card title="我的權限" bordered={false}>
          {currentPermissions.length === 0 ? (
            <Paragraph type="secondary">尚未取得權限資訊，請稍後重試。</Paragraph>
          ) : (
            <List
              grid={{ gutter: 12, column: 4 }}
              dataSource={currentPermissions}
              renderItem={(permission) => (
                <List.Item>
                  <Tag color="green" style={{ padding: '6px 12px' }}>
                    {permission}
                  </Tag>
                </List.Item>
              )}
            />
          )}
        </Card>

        <Card title="角色清單" bordered={false}>
          <Table<RoleDefinition>
            rowKey={(record) => record.key}
            columns={roleColumns}
            dataSource={roles}
            pagination={false}
            loading={roleLoading}
          />
        </Card>

        <Card title="權限對照表" bordered={false}>
          <Table<PermissionDefinition>
            rowKey={(record) => record.key}
            columns={permissionColumns}
            dataSource={permissions}
            loading={permissionLoading}
            pagination={false}
          />
        </Card>

        {moduleDistribution.length > 0 && (
          <Card title="權限分布" bordered={false}>
            <List
              dataSource={moduleDistribution}
              renderItem={({ module, count }) => (
                <List.Item>
                  <Space>
                    <Tag color="blue">{module}</Tag>
                    <Text>{count} 項權限</Text>
                  </Space>
                </List.Item>
              )}
            />
          </Card>
        )}
      </Space>
    </UnifiedPageLayout>
  );
};

export default Permissions;
