import React from 'react';
import { Button } from 'antd';
import { SunOutlined, MoonOutlined } from '@ant-design/icons';

interface HeaderThemeToggleProps {
  theme: 'light' | 'dark';
  onClick: () => void;
}

export const HeaderThemeToggle: React.FC<HeaderThemeToggleProps> = ({ theme, onClick }) => {
  return (
    <Button
      type="text"
      icon={theme === 'light' ? <MoonOutlined /> : <SunOutlined />}
      onClick={onClick}
      className="theme-toggle-btn"
      title={`切換到${theme === 'light' ? '深色' : '淺色'}模式`}
    />
  );
};
