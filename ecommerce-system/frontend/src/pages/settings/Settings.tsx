import React, { useState } from 'react';
import { 
  Row, 
  Col, 
  Card, 
  Form, 
  Input, 
  Switch, 
  Button, 
  Space, 
  message, 
  Tabs,
  Divider,
  Upload,
  InputNumber,
  Select
} from 'antd';
import { 
  SettingOutlined,
  SaveOutlined,
  ReloadOutlined,
  UploadOutlined,
  DownloadOutlined,
  SecurityScanOutlined,
  GlobalOutlined,
  MailOutlined,
  DatabaseOutlined
} from '@ant-design/icons';
import PageHeader from '../../components/common/PageHeader';
import './Settings.less';

// 移除未使用的導入
// TabPane 已棄用，使用 items 屬性

const Settings: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // 模擬設定數據
  const [settings, setSettings] = useState({
    // 基本設定
    siteName: '電商管理系統',
    siteDescription: '專業的電商管理平台',
    siteLogo: '',
    siteFavicon: '',
    
    // 系統設定
    maintenanceMode: false,
    registrationEnabled: true,
    emailVerification: true,
    maxUploadSize: 10,
    sessionTimeout: 30,
    
    // 郵件設定
    smtpHost: 'smtp.example.com',
    smtpPort: 587,
    smtpUser: 'admin@example.com',
    smtpPassword: '',
    smtpSecure: true,
    
    // 支付設定
    paymentMethods: ['alipay', 'wechat', 'bank'],
    defaultCurrency: 'CNY',
    taxRate: 0.1,
    
    // 安全設定
    passwordMinLength: 8,
    passwordRequireSpecial: true,
    loginAttempts: 5,
    lockoutDuration: 30,
    twoFactorAuth: false,
    
    // 通知設定
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    orderNotifications: true,
    userNotifications: true,
  });

  // 處理函數
  const handleSave = async (values: any) => {
    setLoading(true);
    try {
      // TODO: 實作保存設定的 API 調用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSettings({ ...settings, ...values });
      message.success('設定保存成功');
    } catch (error: any) {
      message.error(error.message || '保存失敗');
    } finally {
      setLoading(false);
    }
  };

  // Tabs items 配置
  const tabItems = [
    {
      key: 'basic',
      label: (
        <Space>
          <GlobalOutlined />
          <span>基本設定</span>
        </Space>
      ),
      children: (
        <>
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={12}>
              <Form.Item
                name="siteName"
                label="網站名稱"
                rules={[{ required: true, message: '請輸入網站名稱' }]}
              >
                <Input placeholder="請輸入網站名稱" />
              </Form.Item>
            </Col>
            <Col xs={24} lg={12}>
              <Form.Item name="siteDescription" label="網站描述">
                <Input placeholder="請輸入網站描述" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[24, 24]}>
            <Col xs={24} lg={12}>
              <Form.Item name="siteUrl" label="網站網址">
                <Input placeholder="請輸入網站網址" />
              </Form.Item>
            </Col>
            <Col xs={24} lg={12}>
              <Form.Item name="adminEmail" label="管理員信箱">
                <Input placeholder="請輸入管理員信箱" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[24, 24]}>
            <Col xs={24} lg={12}>
              <Form.Item name="timezone" label="時區">
                <Select
                  placeholder="請選擇時區"
                  options={[
                    { value: 'Asia/Taipei', label: '台北時間 (UTC+8)' },
                    { value: 'Asia/Shanghai', label: '上海時間 (UTC+8)' },
                    { value: 'UTC', label: '世界協調時間 (UTC)' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} lg={12}>
              <Form.Item name="language" label="預設語言">
                <Select
                  placeholder="請選擇語言"
                  options={[
                    { value: 'zh-TW', label: '繁體中文' },
                    { value: 'zh-CN', label: '簡體中文' },
                    { value: 'en', label: 'English' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>
        </>
      ),
    },
    {
      key: 'security',
      label: (
        <Space>
          <SecurityScanOutlined />
          <span>安全設定</span>
        </Space>
      ),
      children: (
        <>
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={12}>
              <Form.Item name="enableTwoFactor" label="雙重驗證" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={24} lg={12}>
              <Form.Item name="sessionTimeout" label="會話超時時間 (分鐘)">
                <InputNumber min={5} max={1440} placeholder="請輸入超時時間" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[24, 24]}>
            <Col xs={24} lg={12}>
              <Form.Item name="maxLoginAttempts" label="最大登入嘗試次數">
                <InputNumber min={3} max={10} placeholder="請輸入最大嘗試次數" />
              </Form.Item>
            </Col>
            <Col xs={24} lg={12}>
              <Form.Item name="lockoutDuration" label="鎖定時間 (分鐘)">
                <InputNumber min={5} max={60} placeholder="請輸入鎖定時間" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[24, 24]}>
            <Col xs={24}>
              <Form.Item name="allowedIPs" label="允許的 IP 地址">
                <Select mode="tags" placeholder="請輸入 IP 地址" />
              </Form.Item>
            </Col>
          </Row>
        </>
      ),
    },
    {
      key: 'email',
      label: (
        <Space>
          <MailOutlined />
          <span>郵件設定</span>
        </Space>
      ),
      children: (
        <>
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={12}>
              <Form.Item name="smtpHost" label="SMTP 主機">
                <Input placeholder="請輸入 SMTP 主機" />
              </Form.Item>
            </Col>
            <Col xs={24} lg={12}>
              <Form.Item name="smtpPort" label="SMTP 端口">
                <InputNumber min={1} max={65535} placeholder="請輸入端口" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[24, 24]}>
            <Col xs={24} lg={12}>
              <Form.Item name="smtpUsername" label="SMTP 用戶名">
                <Input placeholder="請輸入用戶名" />
              </Form.Item>
            </Col>
            <Col xs={24} lg={12}>
              <Form.Item name="smtpPassword" label="SMTP 密碼">
                <Input.Password placeholder="請輸入密碼" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[24, 24]}>
            <Col xs={24} lg={12}>
              <Form.Item name="smtpSecure" label="使用 SSL" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={24} lg={12}>
              <Form.Item name="fromEmail" label="發件人信箱">
                <Input placeholder="請輸入發件人信箱" />
              </Form.Item>
            </Col>
          </Row>
        </>
      ),
    },
    {
      key: 'storage',
      label: (
        <Space>
          <DatabaseOutlined />
          <span>儲存設定</span>
        </Space>
      ),
      children: (
        <>
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={12}>
              <Form.Item name="storageType" label="儲存類型">
                <Select
                  placeholder="請選擇儲存類型"
                  options={[
                    { value: 'local', label: '本地儲存' },
                    { value: 's3', label: 'Amazon S3' },
                    { value: 'oss', label: '阿里雲 OSS' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} lg={12}>
              <Form.Item name="maxFileSize" label="最大檔案大小 (MB)">
                <InputNumber min={1} max={1024} placeholder="請輸入最大檔案大小" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[24, 24]}>
            <Col xs={24} lg={12}>
              <Form.Item name="allowedFileTypes" label="允許的檔案類型">
                <Select mode="tags" placeholder="請輸入檔案類型" />
              </Form.Item>
            </Col>
            <Col xs={24} lg={12}>
              <Form.Item name="enableCompression" label="啟用壓縮" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>
        </>
      ),
    },
    {
      key: 'advanced',
      label: (
        <Space>
          <SettingOutlined />
          <span>進階設定</span>
        </Space>
      ),
      children: (
        <>
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={12}>
              <Form.Item name="enableDebug" label="啟用除錯模式" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={24} lg={12}>
              <Form.Item name="logLevel" label="日誌等級">
                <Select
                  placeholder="請選擇日誌等級"
                  options={[
                    { value: 'error', label: '錯誤' },
                    { value: 'warn', label: '警告' },
                    { value: 'info', label: '資訊' },
                    { value: 'debug', label: '除錯' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[24, 24]}>
            <Col xs={24} lg={12}>
              <Form.Item name="cacheTimeout" label="快取超時時間 (秒)">
                <InputNumber min={60} max={86400} placeholder="請輸入超時時間" />
              </Form.Item>
            </Col>
            <Col xs={24} lg={12}>
              <Form.Item name="enableAnalytics" label="啟用分析" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>
        </>
      ),
    },
  ];

  const handleReset = () => {
    form.resetFields();
    message.info('設定已重置');
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'settings.json';
    link.click();
    URL.revokeObjectURL(url);
    message.success('設定導出成功');
  };

  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedSettings = JSON.parse(e.target?.result as string);
        setSettings({ ...settings, ...importedSettings });
        form.setFieldsValue(importedSettings);
        message.success('設定導入成功');
      } catch (error) {
        message.error('導入失敗：文件格式錯誤');
      }
    };
    reader.readAsText(file);
    return false; // 阻止上傳
  };

  return (
    <div className="settings-page">
      <PageHeader
        title="系統設定"
        subtitle="管理系統配置和參數"
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={handleReset}>
              重置
            </Button>
            <Button icon={<DownloadOutlined />} onClick={handleExport}>
              導出
            </Button>
            <Upload
              beforeUpload={handleImport}
              showUploadList={false}
            >
              <Button icon={<UploadOutlined />}>
                導入
              </Button>
            </Upload>
          </Space>
        }
      />

      <Card className="settings-content">
        <Form
          form={form}
          layout="vertical"
          initialValues={settings}
          onFinish={handleSave}
        >
          <Tabs defaultActiveKey="basic" items={tabItems} />

          <Divider />

          <div className="settings-actions">
            <Space>
              <Button 
                type="primary" 
                htmlType="submit" 
                icon={<SaveOutlined />}
                loading={loading}
              >
                保存設定
              </Button>
              <Button onClick={handleReset}>
                重置
              </Button>
            </Space>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default Settings;
