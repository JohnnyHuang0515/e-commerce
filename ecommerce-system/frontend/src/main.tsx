import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// 導入現代化設計系統
import './styles/modern-design-system.css';
import './styles/login-modern.css';
import './styles/layout-modern.css';
import './styles/dashboard-modern.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);