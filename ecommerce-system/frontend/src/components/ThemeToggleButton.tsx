import React from 'react';

interface ThemeToggleButtonProps {
  theme: 'light' | 'dark';
  onClick: () => void;
}

/**
 * 一個簡單的 UI 按鈕，用於觸發淺色和深色模式之間的切換。
 */
export const ThemeToggleButton: React.FC<ThemeToggleButtonProps> = ({ theme, onClick }) => {
  const buttonStyle: React.CSSProperties = {
    position: 'fixed',
    top: '1rem',
    right: '1rem',
    zIndex: 9999,
    padding: '8px 16px',
    fontSize: '14px',
    cursor: 'pointer',
    border: '1px solid var(--border-primary)',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    borderRadius: '6px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    transition: 'all 0.2s ease',
  };

  return (
    <button onClick={onClick} style={buttonStyle} aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
};
