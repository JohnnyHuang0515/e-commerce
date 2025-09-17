import React, { useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
} from 'antd';
import {
  BellOutlined,
  MailOutlined,
  MessageOutlined,
  NotificationOutlined,
  PhoneOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

import UnifiedPageLayout from '../../components/common/UnifiedPageLayout';
import {
  useNotifications,
  useNotificationStats,
  type Notification,
  type NotificationListParams,
} from '../../hooks/useNotifications';

const { Option } = Select;

interface NotificationFilterForm {
  search?: string;
  status?: string;
  type?: string;
}

const channelIconMap: Record<string, React.ReactNode> = {
  email: <MailOutlined />,
  sms: <PhoneOutlined />,
  push: <NotificationOutlined />,
  in_app: <MessageOutlined />,
  system: <BellOutlined />,
};

const NotificationsPage: React.FC = () => {
  const [filters, setFilters] = useState<NotificationListParams>({ page: 1, limit: 10 });
  const [filterForm] = Form.useForm<NotificationFilterForm>();

  const { data: notificationsResponse, isLoading, refetch } = useNotifications(filters);
  const { data: statsResponse } = useNotificationStats();

  const notifications = notificationsResponse?.data.items ?? [];
  const pagination = notificationsResponse?.data;
  const stats = statsResponse?.data;

  const columns: ColumnsType<Notification> = useMemo(
    () => [
      {
        title: '標題',
        dataIndex: 'title',
        key: 'title',
        render: (value: string, record) => (
          <Space direction="vertical" size={0}>
            <span style={{ fontWeight: 600 }}>{value}</span>
            <span style={{ fontSize: 12, color: '#888' }}>
              {channelIconMap[record.type]}
              <span style={{ marginLeft: 6 }}>{record.type.toUpperCase()}</span>
            </span>
          </Space>
        ),
      },
      {
        title: '狀態',
        dataIndex: 'status',
        key: 'status',
        width: 120,
        render: (status: Notification['status']) => {
          const config: Record<Notification['status'], { color: string; text: string }> = {
            draft: { color: 'default', text: '草稿' },
            scheduled: { color: 'orange', text: '已排程' },
            sent: { color: 'green', text: '已發送' },
            failed: { color: 'red', text: '發送失敗' },
            read: { color: 'blue', text: '已讀' },
            unread: { color: 'purple', text: '未讀' },
          };
          const item = config[status] ?? { color: 'default', text: status };
          return <Tag color={item.color}>{item.text}</Tag>;
        },
      },
      {
        title: '接收者',
        dataIndex: 'recipients',
        key: 'recipients',
        render: (recipients: Notification['recipients']) => (
          <Space size={[4, 4]} wrap>
            {recipients.map((recipient) => (
              <Tag key={recipient.id} color="blue">
                {recipient.name || recipient.email || recipient.phone || recipient.id}
              </Tag>
            ))}
          </Space>
        ),
      },
      {
        title: '建立時間',
        dataIndex: 'createdAt',
        key: 'createdAt',
        width: 180,
        render: (value: string) => new Date(value).toLocaleString(),
      },
      {
        title: '發送時間',
        dataIndex: 'sentAt',
        key: 'sentAt',
        width: 180,
        render: (value?: string) => (value ? new Date(value).toLocaleString() : '—'),
      },
      {
        title: '操作',
        key: 'actions',
        width: 120,
        render: (_, record) => (
          <Button type="link" onClick={() => handleView(record)}>
            查看
          </Button>
        ),
      },
    ],
    []
  );

  const statsConfig = useMemo(
    () => [
      {
        label: '通知總數',
        value: stats?.total ?? notifications.length,
        icon: <BellOutlined />,
        color: 'var(--primary-500)',
      },
      {
        label: '已發送',
        value: stats?.sent ?? notifications.filter((item) => item.status === 'sent').length,
        icon: <MailOutlined />,
        color: 'var(--success-500)',
      },
      {
        label: '未讀',
        value: stats?.unread ?? notifications.filter((item) => item.status === 'unread').length,
        icon: <NotificationOutlined />,
        color: 'var(--warning-500)',
      },
      {
        label: '發送失敗',
        value: stats?.failed ?? notifications.filter((item) => item.status === 'failed').length,
        icon: <PhoneOutlined />,
        color: 'var(--error-500)',
      },
    ],
    [notifications, stats]
  );

  const filtersContent = (
    <Form<NotificationFilterForm>
      layout="inline"
      form={filterForm}
      onFinish={handleFilterSubmit}
      style={{ display: 'flex', gap: 12 }}
    >
      <Form.Item name="search">
        <Input allowClear placeholder="搜尋標題或內容" style={{ width: 220 }} />
      </Form.Item>
      <Form.Item name="status">
        <Select allowClear placeholder="狀態" style={{ width: 160 }}>
          <Option value="sent">已發送</Option>
          <Option value="failed">發送失敗</Option>
          <Option value="read">已讀</Option>
          <Option value="unread">未讀</Option>
          <Option value="draft">草稿</Option>
        </Select>
      </Form.Item>
      <Form.Item name="type">
        <Select allowClear placeholder="通知類型" style={{ width: 160 }}>
          <Option value="email">Email</Option>
          <Option value="sms">SMS</Option>
          <Option value="push">推播</Option>
          <Option value="in_app">站內通知</Option>
          <Option value="system">系統</Option>
        </Select>
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
          篩選
        </Button>
      </Form.Item>
    </Form>
  );

  const extraActions = (
    <Space>
      <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
        重新整理
      </Button>
    </Space>
  );

  function handleFilterSubmit(values: NotificationFilterForm) {
    setFilters((prev) => ({
      ...prev,
      page: 1,
      search: values.search?.trim() || undefined,
      status: (values.status as Notification['status']) || undefined,
      type: (values.type as Notification['type']) || undefined,
    }));
  }

  function handleChangePage(page: number, pageSize?: number) {
    setFilters((prev) => ({
      ...prev,
      page,
      limit: pageSize ?? prev.limit,
    }));
  }

  function handleView(notification: Notification) {
    Modal.info({
      title: notification.title,
      width: 600,
      content: (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <strong>內容</strong>
            <Card size="small" style={{ marginTop: 8 }}>
              {notification.content}
            </Card>
          </div>
          <div>
            <strong>接收者</strong>
            <Space size={[6, 6]} wrap style={{ marginTop: 8 }}>
              {notification.recipients.map((recipient) => (
                <Tag key={recipient.id} color="blue">
                  {recipient.name || recipient.email || recipient.phone || recipient.id}
                </Tag>
              ))}
            </Space>
          </div>
          <div>
            <strong>時間資訊</strong>
            <Space direction="vertical" size={4} style={{ marginTop: 8 }}>
              <span>建立：{new Date(notification.createdAt).toLocaleString()}</span>
              <span>發送：{notification.sentAt ? new Date(notification.sentAt).toLocaleString() : '—'}</span>
            </Space>
          </div>
        </Space>
      ),
    });
  }

  return (
    <UnifiedPageLayout
      title="通知中心"
      subtitle="查看近期發送的系統通知與行銷訊息"
      extra={extraActions}
      stats={statsConfig}
      filters={filtersContent}
      onRefresh={() => refetch()}
      loading={isLoading}
    >
      <Card bordered={false}>
        {notifications.length === 0 && !isLoading ? (
          <Alert
            type="info"
            showIcon
            message="目前沒有符合條件的通知"
            description="調整篩選條件或稍後再試"
          />
        ) : (
          <Table<Notification>
            rowKey={(record) => record.id}
            columns={columns}
            dataSource={notifications}
            loading={isLoading}
            pagination={{
              total: pagination?.total ?? notifications.length,
              pageSize: pagination?.limit ?? filters.limit ?? 10,
              current: pagination?.page ?? filters.page ?? 1,
              onChange: handleChangePage,
              showSizeChanger: true,
              showQuickJumper: true,
            }}
          />
        )}
      </Card>
    </UnifiedPageLayout>
  );
};

export default NotificationsPage;
