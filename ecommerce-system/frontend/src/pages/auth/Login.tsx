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
import {
  UserOutlined,
  LockOutlined,
  ShoppingOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
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
      // 模擬登入 API 調用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 模擬登入成功
      if (values.username === 'admin' && values.password === 'admin123') {
        const mockUser = {
          _id: '1',
          username: 'admin',
          email: 'admin@example.com',
          role: '系統管理員',
          permissions: ['read', 'write', 'admin'],
        };
        
        const mockToken = 'mock-jwt-token-' + Date.now();
        
        login(mockToken, mockUser);
        navigate(from, { replace: true });
      } else {
        message.error('用戶名或密碼錯誤');
      }
    } catch (error: any) {
      message.error('登入失敗，請檢查網路連接');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    form.setFieldsValue({
      username: 'admin',
      password: 'admin123',
    });
  };

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="login-content">
          <Row justify="center" align="middle" style={{ minHeight: '100vh' }}>
            <Col xs={24} sm={24} md={20} lg={16} xl={14}>
              <Card className="login-card" bordered={false}>
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
                      演示帳號: admin / admin123
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
            </Col>
          </Row>
        </div>
      </div>
    </div>
  );
};

export default Login;
