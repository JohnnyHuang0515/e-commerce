import React, { useState, useEffect, useCallback } from 'react';
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
  DatePicker,
  Row,
  Col,
  Statistic,
  Badge,
  Tooltip,
  Popconfirm,
  message,
  Typography,
  Divider,
  Alert,
  Spin,
  Empty,
  Tabs
} from 'antd';
import {
  BellOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SendOutlined,
  EyeOutlined,
  FilterOutlined,
  ReloadOutlined,
  MailOutlined,
  MessageOutlined,
  PhoneOutlined,
  NotificationOutlined
} from '@ant-design/icons';
import { useNotifications, useCreateNotification, useUpdateNotification, useDeleteNotification, useSendNotification } from '../../hooks/useApi';
import { Notification, NotificationCreateRequest, NotificationUpdateRequest } from '../../services/notificationService';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

const NotificationsPage: React.FC = () => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingNotification, setEditingNotification] = useState<Notification | null>(null);
  const [form] = Form.useForm();
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    dateRange: null as any
  });

  // API hooks
  const { data: notificationsData, isLoading, refetch } = useNotifications({
    status: filters.status,
    type: filters.type,
    startDate: filters.dateRange?.[0]?.format('YYYY-MM-DD'),
    endDate: filters.dateRange?.[1]?.format('YYYY-MM-DD')
  });

  const createNotificationMutation = useCreateNotification();
  const updateNotificationMutation = useUpdateNotification();
  const deleteNotificationMutation = useDeleteNotification();
  const sendNotificationMutation = useSendNotification();

  const notifications = notificationsData?.data?.notifications || [];
  const pagination = notificationsData?.data?.pagination;

  // 統計數據
  const stats = {
    total: notifications.length,
    unread: notifications.filter(n => n.status === 'unread').length,
    sent: notifications.filter(n => n.status === 'sent').length,
    failed: notifications.filter(n => n.status === 'failed').length
  };

  // 表格列定義
  const columns: ColumnsType<Notification> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      render: (text) => <Text code>{text.slice(0, 8)}</Text>
    },
    {
      title: '標題',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{text}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.type === 'email' && <MailOutlined />}
            {record.type === 'sms' && <PhoneOutlined />}
            {record.type === 'push' && <NotificationOutlined />}
            {record.type === 'in_app' && <MessageOutlined />}
            {' '}{record.type.toUpperCase()}
          </Text>
        </Space>
      )
    },
    {
      title: '接收者',
      dataIndex: 'recipients',
      key: 'recipients',
      render: (recipients) => (
        <Space>
          {recipients?.slice(0, 2).map((recipient: any, index: number) => (
            <Tag key={index} color="blue">{recipient.name || recipient.email}</Tag>
          ))}
          {recipients?.length > 2 && (
            <Tag color="default">+{recipients.length - 2}</Tag>
          )}
        </Space>
      )
    },
    {
      title: '狀態',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusConfig = {
          draft: { color: 'default', text: '草稿' },
          scheduled: { color: 'orange', text: '已排程' },
          sent: { color: 'green', text: '已發送' },
          failed: { color: 'red', text: '發送失敗' },
          unread: { color: 'blue', text: '未讀' },
          read: { color: 'default', text: '已讀' }
        };
        const config = statusConfig[status as keyof typeof statusConfig] || { color: 'default', text: status };
        return <Tag color={config.color}>{config.text}</Tag>;
      }
    },
    {
      title: '發送時間',
      dataIndex: 'sentAt',
      key: 'sentAt',
      render: (sentAt) => sentAt ? new Date(sentAt).toLocaleString() : '-'
    },
    {
      title: '創建時間',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (createdAt) => new Date(createdAt).toLocaleString()
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space>
          <Tooltip title="查看詳情">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleView(record)}
            />
          </Tooltip>
          <Tooltip title="編輯">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          {record.status === 'draft' && (
            <Tooltip title="發送">
              <Button
                type="text"
                icon={<SendOutlined />}
                onClick={() => handleSend(record.id)}
              />
            </Tooltip>
          )}
          <Popconfirm
            title="確定要刪除這個通知嗎？"
            onConfirm={() => handleDelete(record.id)}
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
      )
    }
  ];

  // 事件處理函數
  const handleCreate = () => {
    setEditingNotification(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (notification: Notification) => {
    setEditingNotification(notification);
    form.setFieldsValue({
      ...notification,
      scheduledAt: notification.scheduledAt ? new Date(notification.scheduledAt) : null
    });
    setIsModalVisible(true);
  };

  const handleView = (notification: Notification) => {
    Modal.info({
      title: notification.title,
      content: (
        <div>
          <p><strong>內容:</strong></p>
          <p>{notification.content}</p>
          <Divider />
          <p><strong>類型:</strong> {notification.type}</p>
          <p><strong>狀態:</strong> {notification.status}</p>
          <p><strong>接收者:</strong></p>
          <ul>
            {notification.recipients?.map((recipient: any, index: number) => (
              <li key={index}>{recipient.name || recipient.email}</li>
            ))}
          </ul>
        </div>
      ),
      width: 600
    });
  };

  const handleSend = async (notificationId: string) => {
    try {
      await sendNotificationMutation.mutateAsync(notificationId);
      message.success('通知發送成功');
      refetch();
    } catch (error) {
      message.error('通知發送失敗');
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      await deleteNotificationMutation.mutateAsync(notificationId);
      message.success('通知刪除成功');
      refetch();
    } catch (error) {
      message.error('通知刪除失敗');
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingNotification) {
        await updateNotificationMutation.mutateAsync({
          id: editingNotification.id,
          ...values
        });
        message.success('通知更新成功');
      } else {
        await createNotificationMutation.mutateAsync(values);
        message.success('通知創建成功');
      }
      
      setIsModalVisible(false);
      refetch();
    } catch (error) {
      message.error('操作失敗');
    }
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleRefresh = () => {
    refetch();
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>
          <BellOutlined style={{ marginRight: '8px' }} />
          通知管理
        </Title>
        <Text type="secondary">管理系統通知、郵件和推送消息</Text>
      </div>

      {/* 統計卡片 */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="總通知數"
              value={stats.total}
              prefix={<BellOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="未讀通知"
              value={stats.unread}
              prefix={<Badge count={stats.unread} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已發送"
              value={stats.sent}
              prefix={<SendOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="發送失敗"
              value={stats.failed}
              prefix={<NotificationOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 主要內容 */}
      <Card>
        <div style={{ marginBottom: '16px' }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Space>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleCreate}
                >
                  新建通知
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={handleRefresh}
                >
                  刷新
                </Button>
              </Space>
            </Col>
            <Col>
              <Space>
                <Select
                  placeholder="狀態篩選"
                  style={{ width: 120 }}
                  value={filters.status}
                  onChange={(value) => handleFilterChange('status', value)}
                  allowClear
                >
                  <Option value="draft">草稿</Option>
                  <Option value="scheduled">已排程</Option>
                  <Option value="sent">已發送</Option>
                  <Option value="failed">發送失敗</Option>
                </Select>
                <Select
                  placeholder="類型篩選"
                  style={{ width: 120 }}
                  value={filters.type}
                  onChange={(value) => handleFilterChange('type', value)}
                  allowClear
                >
                  <Option value="email">郵件</Option>
                  <Option value="sms">簡訊</Option>
                  <Option value="push">推送</Option>
                  <Option value="in_app">站內信</Option>
                </Select>
                <RangePicker
                  placeholder={['開始日期', '結束日期']}
                  value={filters.dateRange}
                  onChange={(dates) => handleFilterChange('dateRange', dates)}
                />
              </Space>
            </Col>
          </Row>
        </div>

        <Spin spinning={isLoading}>
          <Table
            columns={columns}
            dataSource={notifications}
            rowKey="id"
            rowSelection={rowSelection}
            pagination={{
              current: pagination?.page || 1,
              pageSize: pagination?.limit || 10,
              total: pagination?.total || 0,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `第 ${range[0]}-${range[1]} 條，共 ${total} 條`
            }}
            locale={{
              emptyText: <Empty description="暫無通知數據" />
            }}
          />
        </Spin>
      </Card>

      {/* 創建/編輯通知模態框 */}
      <Modal
        title={editingNotification ? '編輯通知' : '新建通知'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
        width={800}
        confirmLoading={createNotificationMutation.isPending || updateNotificationMutation.isPending}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            type: 'email',
            status: 'draft'
          }}
        >
          <Tabs defaultActiveKey="basic">
            <TabPane tab="基本信息" key="basic">
              <Form.Item
                name="title"
                label="通知標題"
                rules={[{ required: true, message: '請輸入通知標題' }]}
              >
                <Input placeholder="請輸入通知標題" />
              </Form.Item>

              <Form.Item
                name="content"
                label="通知內容"
                rules={[{ required: true, message: '請輸入通知內容' }]}
              >
                <TextArea
                  rows={4}
                  placeholder="請輸入通知內容"
                />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="type"
                    label="通知類型"
                    rules={[{ required: true, message: '請選擇通知類型' }]}
                  >
                    <Select>
                      <Option value="email">郵件通知</Option>
                      <Option value="sms">簡訊通知</Option>
                      <Option value="push">推送通知</Option>
                      <Option value="in_app">站內通知</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="status"
                    label="通知狀態"
                    rules={[{ required: true, message: '請選擇通知狀態' }]}
                  >
                    <Select>
                      <Option value="draft">草稿</Option>
                      <Option value="scheduled">已排程</Option>
                      <Option value="sent">已發送</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="scheduledAt"
                label="排程時間"
              >
                <DatePicker
                  showTime
                  style={{ width: '100%' }}
                  placeholder="選擇排程時間（可選）"
                />
              </Form.Item>
            </TabPane>

            <TabPane tab="接收者" key="recipients">
              <Alert
                message="接收者配置"
                description="請在後續版本中實現接收者選擇功能"
                type="info"
                showIcon
                style={{ marginBottom: '16px' }}
              />
              <Form.Item
                name="recipients"
                label="接收者列表"
              >
                <TextArea
                  rows={3}
                  placeholder="請輸入接收者信息（JSON 格式）"
                />
              </Form.Item>
            </TabPane>
          </Tabs>
        </Form>
      </Modal>
    </div>
  );
};

export default NotificationsPage;