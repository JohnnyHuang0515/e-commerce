import React, { useState, useEffect } from 'react';
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
  message,
  Tabs,
  Statistic,
  Row,
  Col,
  Popconfirm,
  Tooltip,
  Badge,
  Divider
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SendOutlined,
  EyeOutlined,
  ReloadOutlined,
  BellOutlined,
  MailOutlined,
  MessageOutlined,
  NotificationOutlined,
  SettingOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService, NotificationTemplate, Notification, NotificationStats, CreateTemplateRequest, SendNotificationRequest } from '../../services/notificationService';
import dayjs from 'dayjs';

// TabPane 已棄用，使用 items 屬性
const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

const NotificationManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('templates');
  const [templateModalVisible, setTemplateModalVisible] = useState(false);
  const [sendModalVisible, setSendModalVisible] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null);
  const [templateForm] = Form.useForm();
  const [sendForm] = Form.useForm();
  const queryClient = useQueryClient();

  // 模板查詢
  const { data: templatesData, isLoading: templatesLoading, refetch: refetchTemplates } = useQuery({
    queryKey: ['notification-templates'],
    queryFn: () => notificationService.getTemplates({ page: 1, limit: 100 }),
  });

  // 通知查詢
  const { data: notificationsData, isLoading: notificationsLoading, refetch: refetchNotifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationService.getNotifications({ page: 1, limit: 100 }),
  });

  // 統計查詢
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['notification-stats'],
    queryFn: () => notificationService.getStats(),
  });

  // 創建模板
  const createTemplateMutation = useMutation({
    mutationFn: (data: CreateTemplateRequest) => notificationService.createTemplate(data),
    onSuccess: () => {
      message.success('模板創建成功');
      setTemplateModalVisible(false);
      templateForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ['notification-templates'] });
    },
    onError: (error: any) => {
      message.error(`創建失敗: ${error.response?.data?.message || error.message}`);
    },
  });

  // 更新模板
  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateTemplateRequest> }) => 
      notificationService.updateTemplate(id, data),
    onSuccess: () => {
      message.success('模板更新成功');
      setTemplateModalVisible(false);
      setEditingTemplate(null);
      templateForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ['notification-templates'] });
    },
    onError: (error: any) => {
      message.error(`更新失敗: ${error.response?.data?.message || error.message}`);
    },
  });

  // 刪除模板
  const deleteTemplateMutation = useMutation({
    mutationFn: (id: string) => notificationService.deleteTemplate(id),
    onSuccess: () => {
      message.success('模板刪除成功');
      queryClient.invalidateQueries({ queryKey: ['notification-templates'] });
    },
    onError: (error: any) => {
      message.error(`刪除失敗: ${error.response?.data?.message || error.message}`);
    },
  });

  // 發送通知
  const sendNotificationMutation = useMutation({
    mutationFn: (data: SendNotificationRequest) => notificationService.sendNotification(data),
    onSuccess: () => {
      message.success('通知發送成功');
      setSendModalVisible(false);
      sendForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-stats'] });
    },
    onError: (error: any) => {
      message.error(`發送失敗: ${error.response?.data?.message || error.message}`);
    },
  });

  // 標記已讀
  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onSuccess: () => {
      message.success('通知已標記為已讀');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error: any) => {
      message.error(`操作失敗: ${error.response?.data?.message || error.message}`);
    },
  });

  // 處理待發送通知
  const processPendingMutation = useMutation({
    mutationFn: () => notificationService.processPendingNotifications(50),
    onSuccess: (data) => {
      message.success(`處理了 ${data.data.length} 個待發送通知`);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-stats'] });
    },
    onError: (error: any) => {
      message.error(`處理失敗: ${error.response?.data?.message || error.message}`);
    },
  });

  // 重試失敗通知
  const retryFailedMutation = useMutation({
    mutationFn: () => notificationService.retryFailedNotifications(20),
    onSuccess: (data) => {
      message.success(`重試了 ${data.data.length} 個失敗通知`);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-stats'] });
    },
    onError: (error: any) => {
      message.error(`重試失敗: ${error.response?.data?.message || error.message}`);
    },
  });

  // Tabs items 配置
  const tabItems = [
    {
      key: 'templates',
      label: '模板管理',
      children: (
        <Table
          columns={templateColumns}
          dataSource={templatesData?.data || []}
          loading={templatesLoading}
          rowKey="id"
          pagination={{
            total: templatesData?.pagination?.total || 0,
            pageSize: templatesData?.pagination?.limit || 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 條記錄`,
          }}
        />
      ),
    },
    {
      key: 'notifications',
      label: '通知記錄',
      children: (
        <Table
          columns={notificationColumns}
          dataSource={notificationsData?.data || []}
          loading={notificationsLoading}
          rowKey="id"
          pagination={{
            total: notificationsData?.pagination?.total || 0,
            pageSize: notificationsData?.pagination?.limit || 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 條記錄`,
          }}
        />
      ),
    },
    {
      key: 'stats',
      label: '統計分析',
      children: (
        <Row gutter={16}>
          <Col span={6}>
            <Card>
              <Statistic
                title="總發送"
                value={statsData?.data?.totalSent || 0}
                prefix={<SendOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="已送達"
                value={statsData?.data?.totalDelivered || 0}
                prefix={<MailOutlined />}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="已讀"
                value={statsData?.data?.totalRead || 0}
                prefix={<EyeOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="失敗"
                value={statsData?.data?.totalFailed || 0}
                prefix={<CloseCircleOutlined />}
                valueStyle={{ color: '#cf1322' }}
              />
            </Card>
          </Col>
        </Row>
      ),
    },
  ];

  // 處理模板提交
  const handleTemplateSubmit = (values: any) => {
    if (editingTemplate) {
      updateTemplateMutation.mutate({ id: editingTemplate.id, data: values });
    } else {
      createTemplateMutation.mutate(values);
    }
  };

  // 處理發送通知
  const handleSendNotification = (values: any) => {
    if (!selectedTemplate) return;
    
    const sendData: SendNotificationRequest = {
      templateId: selectedTemplate.id,
      recipientId: values.recipientId,
      recipientType: values.recipientType,
      recipientEmail: values.recipientEmail,
      recipientPhone: values.recipientPhone,
      variables: values.variables || {},
      scheduledAt: values.scheduledAt?.format('YYYY-MM-DD HH:mm:ss'),
    };
    
    sendNotificationMutation.mutate(sendData);
  };

  // 打開編輯模板
  const handleEditTemplate = (template: NotificationTemplate) => {
    setEditingTemplate(template);
    templateForm.setFieldsValue({
      ...template,
      variables: template.variables || []
    });
    setTemplateModalVisible(true);
  };

  // 打開發送通知
  const handleOpenSendModal = (template: NotificationTemplate) => {
    setSelectedTemplate(template);
    sendForm.resetFields();
    setSendModalVisible(true);
  };

  // 獲取狀態顏色
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'orange',
      sent: 'blue',
      delivered: 'green',
      failed: 'red',
      read: 'purple',
      unread: 'default',
    };
    return colors[status] || 'default';
  };

  // 獲取類型圖標
  const getTypeIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      email: <MailOutlined />,
      sms: <MessageOutlined />,
      push: <NotificationOutlined />,
      in_app: <BellOutlined />,
      system: <SettingOutlined />,
    };
    return icons[type] || <BellOutlined />;
  };

  // 模板列定義
  const templateColumns = [
    {
      title: '模板名稱',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <strong>{text}</strong>,
    },
    {
      title: '標題',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '類型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag icon={getTypeIcon(type)} color="blue">
          {type.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: '類別',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => (
        <Tag color="green">{category.toUpperCase()}</Tag>
      ),
    },
    {
      title: '狀態',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? '啟用' : '停用'}
        </Tag>
      ),
    },
    {
      title: '創建時間',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: NotificationTemplate) => (
        <Space>
          <Tooltip title="發送通知">
            <Button
              type="primary"
              icon={<SendOutlined />}
              size="small"
              onClick={() => handleOpenSendModal(record)}
            />
          </Tooltip>
          <Tooltip title="編輯">
            <Button
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleEditTemplate(record)}
            />
          </Tooltip>
          <Popconfirm
            title="確定要刪除這個模板嗎？"
            onConfirm={() => deleteTemplateMutation.mutate(record.id)}
            okText="確定"
            cancelText="取消"
          >
            <Tooltip title="刪除">
              <Button
                danger
                icon={<DeleteOutlined />}
                size="small"
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 通知列定義
  const notificationColumns = [
    {
      title: '標題',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: Notification) => (
        <Space>
          <span>{text}</span>
          {record.status === 'unread' && <Badge status="processing" />}
        </Space>
      ),
    },
    {
      title: '接收者',
      dataIndex: 'recipientId',
      key: 'recipientId',
      render: (recipientId: string, record: Notification) => (
        <Space direction="vertical" size={0}>
          <span>{recipientId}</span>
          <Tag size="small">{record.recipientType}</Tag>
        </Space>
      ),
    },
    {
      title: '類型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag icon={getTypeIcon(type)} color="blue">
          {type.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: '狀態',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: '發送時間',
      dataIndex: 'sentAt',
      key: 'sentAt',
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD HH:mm:ss') : '-',
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: Notification) => (
        <Space>
          <Tooltip title="查看詳情">
            <Button
              icon={<EyeOutlined />}
              size="small"
              onClick={() => {
                Modal.info({
                  title: '通知詳情',
                  content: (
                    <div>
                      <p><strong>標題:</strong> {record.title}</p>
                      <p><strong>內容:</strong> {record.content}</p>
                      <p><strong>狀態:</strong> {record.status}</p>
                      <p><strong>發送時間:</strong> {record.sentAt ? dayjs(record.sentAt).format('YYYY-MM-DD HH:mm:ss') : '-'}</p>
                    </div>
                  ),
                });
              }}
            />
          </Tooltip>
          {record.status === 'unread' && (
            <Tooltip title="標記已讀">
              <Button
                type="primary"
                size="small"
                onClick={() => markAsReadMutation.mutate(record.id)}
              >
                已讀
              </Button>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card title="通知管理" extra={
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingTemplate(null);
              templateForm.resetFields();
              setTemplateModalVisible(true);
            }}
          >
            創建模板
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              refetchTemplates();
              refetchNotifications();
            }}
          >
            刷新
          </Button>
        </Space>
      }>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
          <TabPane tab="模板管理" key="templates">
            <Table
              columns={templateColumns}
              dataSource={templatesData?.data || []}
              loading={templatesLoading}
              rowKey="id"
              pagination={{
                total: templatesData?.pagination?.total || 0,
                pageSize: templatesData?.pagination?.limit || 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 條記錄`,
              }}
            />
          </TabPane>
          
          <TabPane tab="通知記錄" key="notifications">
            <Table
              columns={notificationColumns}
              dataSource={notificationsData?.data || []}
              loading={notificationsLoading}
              rowKey="id"
              pagination={{
                total: notificationsData?.pagination?.total || 0,
                pageSize: notificationsData?.pagination?.limit || 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 條記錄`,
              }}
            />
          </TabPane>
          
          <TabPane tab="統計分析" key="stats">
            <Row gutter={16}>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="總發送"
                    value={statsData?.data?.totalSent || 0}
                    prefix={<SendOutlined />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="已送達"
                    value={statsData?.data?.totalDelivered || 0}
                    prefix={<MailOutlined />}
                    valueStyle={{ color: '#3f8600' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="已讀"
                    value={statsData?.data?.totalRead || 0}
                    prefix={<EyeOutlined />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="失敗"
                    value={statsData?.data?.totalFailed || 0}
                    prefix={<ReloadOutlined />}
                    valueStyle={{ color: '#cf1322' }}
                  />
                </Card>
              </Col>
            </Row>
            
            <Divider />
            
            <Row gutter={16}>
              <Col span={12}>
                <Card title="按類型統計" size="small">
                  {statsData?.data?.byType && Object.entries(statsData.data.byType).map(([type, stats]) => (
                    <div key={type} style={{ marginBottom: '8px' }}>
                      <Tag icon={getTypeIcon(type)}>{type.toUpperCase()}</Tag>
                      <span>發送: {stats.sent} | 送達: {stats.delivered} | 已讀: {stats.read} | 失敗: {stats.failed}</span>
                    </div>
                  ))}
                </Card>
              </Col>
              <Col span={12}>
                <Card title="按類別統計" size="small">
                  {statsData?.data?.byCategory && Object.entries(statsData.data.byCategory).map(([category, stats]) => (
                    <div key={category} style={{ marginBottom: '8px' }}>
                      <Tag color="green">{category.toUpperCase()}</Tag>
                      <span>發送: {stats.sent} | 送達: {stats.delivered} | 已讀: {stats.read} | 失敗: {stats.failed}</span>
                    </div>
                  ))}
                </Card>
              </Col>
            </Row>
            
            <Divider />
            
            <Space>
              <Button
                type="primary"
                icon={<ReloadOutlined />}
                onClick={() => processPendingMutation.mutate()}
                loading={processPendingMutation.isPending}
              >
                處理待發送通知
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => retryFailedMutation.mutate()}
                loading={retryFailedMutation.isPending}
              >
                重試失敗通知
              </Button>
            </Space>
          </TabPane>
        </Tabs>
      </Card>

      {/* 模板編輯/創建模態框 */}
      <Modal
        title={editingTemplate ? '編輯模板' : '創建模板'}
        open={templateModalVisible}
        onCancel={() => {
          setTemplateModalVisible(false);
          setEditingTemplate(null);
          templateForm.resetFields();
        }}
        onOk={() => templateForm.submit()}
        confirmLoading={createTemplateMutation.isPending || updateTemplateMutation.isPending}
        width={800}
      >
        <Form
          form={templateForm}
          layout="vertical"
          onFinish={handleTemplateSubmit}
        >
          <Form.Item
            name="name"
            label="模板名稱"
            rules={[{ required: true, message: '請輸入模板名稱' }]}
          >
            <Input placeholder="例如: order-confirmation" />
          </Form.Item>
          
          <Form.Item
            name="title"
            label="通知標題"
            rules={[{ required: true, message: '請輸入通知標題' }]}
          >
            <Input placeholder="例如: 訂單確認通知" />
          </Form.Item>
          
          <Form.Item
            name="content"
            label="通知內容"
            rules={[{ required: true, message: '請輸入通知內容' }]}
          >
            <TextArea rows={4} placeholder="例如: 親愛的 {{customerName}}，您的訂單 {{orderId}} 已確認..." />
          </Form.Item>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="type"
                label="通知類型"
                rules={[{ required: true, message: '請選擇通知類型' }]}
              >
                <Select placeholder="選擇通知類型">
                  <Option value="email">郵件</Option>
                  <Option value="sms">簡訊</Option>
                  <Option value="push">推播</Option>
                  <Option value="in_app">應用內</Option>
                  <Option value="system">系統</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="category"
                label="通知類別"
                rules={[{ required: true, message: '請選擇通知類別' }]}
              >
                <Select placeholder="選擇通知類別">
                  <Option value="order">訂單</Option>
                  <Option value="payment">支付</Option>
                  <Option value="user">用戶</Option>
                  <Option value="system">系統</Option>
                  <Option value="promotion">促銷</Option>
                  <Option value="security">安全</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            name="isActive"
            label="啟用狀態"
            valuePropName="checked"
          >
            <Select placeholder="選擇啟用狀態">
              <Option value={true}>啟用</Option>
              <Option value={false}>停用</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 發送通知模態框 */}
      <Modal
        title="發送通知"
        open={sendModalVisible}
        onCancel={() => {
          setSendModalVisible(false);
          setSelectedTemplate(null);
          sendForm.resetFields();
        }}
        onOk={() => sendForm.submit()}
        confirmLoading={sendNotificationMutation.isPending}
        width={600}
      >
        {selectedTemplate && (
          <div style={{ marginBottom: '16px' }}>
            <p><strong>模板:</strong> {selectedTemplate.name}</p>
            <p><strong>標題:</strong> {selectedTemplate.title}</p>
            <p><strong>內容:</strong> {selectedTemplate.content}</p>
          </div>
        )}
        
        <Form
          form={sendForm}
          layout="vertical"
          onFinish={handleSendNotification}
        >
          <Form.Item
            name="recipientId"
            label="接收者ID"
            rules={[{ required: true, message: '請輸入接收者ID' }]}
          >
            <Input placeholder="例如: user123" />
          </Form.Item>
          
          <Form.Item
            name="recipientType"
            label="接收者類型"
            rules={[{ required: true, message: '請選擇接收者類型' }]}
          >
            <Select placeholder="選擇接收者類型">
              <Option value="user">用戶</Option>
              <Option value="admin">管理員</Option>
              <Option value="system">系統</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="recipientEmail"
            label="接收者郵箱"
          >
            <Input placeholder="例如: user@example.com" />
          </Form.Item>
          
          <Form.Item
            name="recipientPhone"
            label="接收者電話"
          >
            <Input placeholder="例如: +886912345678" />
          </Form.Item>
          
          <Form.Item
            name="scheduledAt"
            label="排程發送時間"
          >
            <DatePicker
              showTime
              format="YYYY-MM-DD HH:mm:ss"
              placeholder="選擇發送時間（可選）"
            />
          </Form.Item>
          
          <Form.Item
            name="variables"
            label="變數值"
          >
            <TextArea
              rows={3}
              placeholder="JSON格式，例如: {&quot;customerName&quot;: &quot;張三&quot;, &quot;orderId&quot;: &quot;ORD-001&quot;}"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default NotificationManagement;
