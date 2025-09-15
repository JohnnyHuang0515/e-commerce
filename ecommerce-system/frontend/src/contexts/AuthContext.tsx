import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { App } from 'antd';

interface User {
  _id: string;
  username: string;
  email: string;
  role: string;
  avatar?: string;
  permissions?: string[];
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { message } = App.useApp();

  useEffect(() => {
    console.log('AuthContext 初始化開始');
    // 檢查本地存儲中的認證信息
    const storedToken = localStorage.getItem('auth_token');
    const userInfo = localStorage.getItem('user_info');

    console.log('從 localStorage 讀取:', { 
      hasToken: !!storedToken, 
      hasUserInfo: !!userInfo,
      tokenPreview: storedToken ? storedToken.substring(0, 20) + '...' : null
    });

    if (storedToken && userInfo) {
      try {
        const parsedUser = JSON.parse(userInfo);
        console.log('解析用戶信息成功:', parsedUser);
        setUser(parsedUser);
        setToken(storedToken);
        console.log('AuthContext 狀態已恢復');
      } catch (error) {
        console.error('解析用戶信息失敗:', error);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_info');
        setUser(null);
        setToken(null);
      }
    } else {
      // 如果沒有 token 或 userInfo，清除狀態
      console.log('沒有找到認證信息，清除狀態');
      setUser(null);
      setToken(null);
    }
    
    setIsLoading(false);
    console.log('AuthContext 初始化完成');
  }, []);

  const login = (newToken: string, userData: User) => {
    console.log('AuthContext login 被調用:', { newToken: newToken.substring(0, 20) + '...', userData });
    localStorage.setItem('auth_token', newToken);
    localStorage.setItem('user_info', JSON.stringify(userData));
    setUser(userData);
    setToken(newToken);
    console.log('AuthContext 狀態已更新');
    message.success('登入成功！');
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_info');
    setUser(null);
    setToken(null);
    message.success('已登出');
  };

  const updateUser = (userData: User) => {
    localStorage.setItem('user_info', JSON.stringify(userData));
    setUser(userData);
  };

  const isAuthenticated = !!(user && token);
  
  console.log('AuthContext 狀態:', { 
    user: user?.username, 
    hasToken: !!token, 
    isAuthenticated, 
    isLoading 
  });

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
