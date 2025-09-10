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
    // 檢查本地存儲中的認證信息
    const storedToken = localStorage.getItem('auth_token');
    const userInfo = localStorage.getItem('user_info');

    if (storedToken && userInfo) {
      try {
        const parsedUser = JSON.parse(userInfo);
        setUser(parsedUser);
        setToken(storedToken);
      } catch (error) {
        console.error('解析用戶信息失敗:', error);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_info');
      }
    }
    
    setIsLoading(false);
  }, []);

  const login = (newToken: string, userData: User) => {
    localStorage.setItem('auth_token', newToken);
    localStorage.setItem('user_info', JSON.stringify(userData));
    setUser(userData);
    setToken(newToken);
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

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user,
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
