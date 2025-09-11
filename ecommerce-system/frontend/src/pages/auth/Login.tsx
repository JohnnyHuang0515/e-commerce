import React, { useState } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Typography,
  Space,
  message,
  Divider,
  Row,
  Col,
} from 'antd';
import { AuthService } from '../../services/authService';
import {
  UserOutlined,
  LockOutlined,
  ShoppingOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
// 移除複雜的動畫組件
import './Login.less';

const { Title, Text } = Typography;

const Login: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleLogin = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      // 使用真實的 API 登入
      const response = await AuthService.login({ 
        email: values.username, 
        password: values.password 
      });
      
      if (response.success && response.data) {
        const userData = {
          _id: response.data.user.id,
          username: response.data.user.name,
          email: response.data.user.email,
          role: response.data.user.role,
          permissions: response.data.user.permissions || []
        };
        
        login(response.data.token, userData);
        navigate(from, { replace: true });
      } else {
        message.error('登入失敗，請檢查用戶名和密碼');
      }
    } catch (error: any) {
      console.error('登入錯誤:', error);
      message.error('登入失敗，請檢查網路連接');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    form.setFieldsValue({
      username: 'admin@example.com',
      password: 'Admin123',
    });
  };

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="login-content">
          <Card className="login-card" variant="borderless">
                <div className="login-header">
                  <div className="logo-section">
                    <ShoppingOutlined className="logo-icon" />
                    <Title level={1} className="logo-title">
                      電商管理系統
                    </Title>
                  </div>
                  <Text type="secondary" className="login-subtitle">
                    歡迎登入管理後台
                  </Text>
                </div>

                <Form
                  form={form}
                  name="login"
                  onFinish={handleLogin}
                  autoComplete="off"
                  size="large"
                  className="login-form"
                >
                  <Form.Item
                    name="username"
                    rules={[
                      { required: true, message: '請輸入用戶名' },
                      { min: 3, message: '用戶名至少3個字符' },
                    ]}
                  >
                    <Input
                      prefix={<UserOutlined />}
                      placeholder="請輸入用戶名"
                      className="login-input"
                    />
                  </Form.Item>

                  <Form.Item
                    name="password"
                    rules={[
                      { required: true, message: '請輸入密碼' },
                      { min: 6, message: '密碼至少6個字符' },
                    ]}
                  >
                    <Input.Password
                      prefix={<LockOutlined />}
                      placeholder="請輸入密碼"
                      className="login-input"
                      iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                    />
                  </Form.Item>

                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      className="login-button"
                      loading={loading}
                      block
                    >
                      登入
                    </Button>
                  </Form.Item>
                </Form>

                <Divider>
                  <Text type="secondary">或</Text>
                </Divider>

                <div className="demo-section">
                  <Button
                    type="dashed"
                    onClick={handleDemoLogin}
                    block
                    className="demo-button"
                  >
                    使用演示帳號
                  </Button>
                  <div className="demo-info">
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      演示帳號: admin@example.com / Admin123
                    </Text>
                  </div>
                </div>

                <div className="login-footer">
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Text type="secondary" style={{ fontSize: '12px', textAlign: 'center' }}>
                      電商管理系統 v1.0.0
                    </Text>
                    <Text type="secondary" style={{ fontSize: '12px', textAlign: 'center' }}>
                      © 2025 All Rights Reserved
                    </Text>
                  </Space>
                </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;
