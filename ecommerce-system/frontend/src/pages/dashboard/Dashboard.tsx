import React, { useState, useEffect, useRef } from 'react';
import { Row, Col, Card, Typography, Spin, Alert, Button } from 'antd';
import { 
  ShoppingOutlined, 
  FileTextOutlined, 
  UserOutlined, 
  ReloadOutlined,
  LineChartOutlined,
  TrophyOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined
} from '@ant-design/icons';
import PageHeader from '../../components/common/PageHeader';
import DashboardService from '../../services/dashboardService';
import { DashboardOverview as OverviewData } from '../../types/api';
import { 
  getDailySalesData, 
  getOrderStatusData, 
  getPopularProductsData,
  DailySalesData,
  OrderStatusData,
  PopularProduct
} from '../../services/api';
import { useTheme } from '../../hooks/useTheme';
import './Dashboard.less';

const { Text } = Typography;

// 錢幣SVG圖標組件 - 與圖表提示框一致的設計
const MoneyIcon: React.FC<{ size?: number; color?: string; className?: string }> = ({ 
  size = 16, 
  color = '#52c41a', 
  className 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 1024 1024" 
    style={{ fill: color }}
    className={className}
  >
    <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372zm47.7-395.2l-25.4-5.9V348.6c38 5.2 61.5 29 65.5 58.2.5 4 3.9 6.9 7.9 6.9h44.9c4.7 0 8.4-4.1 8-8.8-6.1-62.3-57.4-102.3-125.9-109.2V263c0-4.4-3.6-8-8-8h-28.1c-4.4 0-8 3.6-8 8v33c-70.8 6.9-126.2 46-126.2 119 0 67.6 49.8 100.2 102.1 112.7l24.7 6.3v142.7c-44.2-5.9-69-29.5-74.1-61.3-.6-3.8-4-6.6-7.9-6.6H363c-4.7 0-8.4 4-8 8.7 4.5 55 46.2 105.6 135.2 112.1V761c0 4.4 3.6 8 8 8h28.4c4.4 0 8-3.6 8-8.1l-.2-31.7c78.3-6.9 134.3-48.8 134.3-124-.1-69.4-44.2-100.4-109-116.4zm-68.6-16.2c-5.6-1.6-10.3-3.1-15-5-33.8-12.2-49.5-31.9-49.5-57.3 0-36.3 27.5-57 64.5-61.7v124zM534.3 677V543.3c3.1.9 5.9 1.6 8.8 2.2 47.3 14.4 63.2 34.4 63.2 65.1 0 39.1-29.4 62.6-72 66.4z"/>
  </svg>
);

// 現代化戰略性儀表板樣式 - 黑色主題
const strategicStyles = `
  .kpi-card {
    background: #1a1a1a;
    border: 1px solid #333333;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(255, 255, 255, 0.05);
    transition: all 0.3s ease;
    overflow: hidden;
    position: relative;
  }
  
  .kpi-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #1890ff, #52c41a, #faad14, #ff4d4f);
    background-size: 200% 100%;
    animation: kpiGradient 3s ease-in-out infinite;
  }
  
  @keyframes kpiGradient {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }
  
  .kpi-card:hover {
    box-shadow: 0 8px 24px rgba(255, 255, 255, 0.1);
    transform: translateY(-4px);
  }
  
  .revenue-card::before {
    background: linear-gradient(90deg, #059669, #10b981);
  }
  
  .orders-card::before {
    background: linear-gradient(90deg, #1e40af, #3b82f6);
  }
  
  .customers-card::before {
    background: linear-gradient(90deg, #7c3aed, #8b5cf6);
  }
  
  .products-card::before {
    background: linear-gradient(90deg, #d97706, #f59e0b);
  }
  
  .chart-card {
    background: #1a1a1a;
    border: 1px solid #333333;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(255, 255, 255, 0.05);
    transition: all 0.3s ease;
    overflow: hidden;
  }
  
  .chart-card:hover {
    box-shadow: 0 8px 24px rgba(255, 255, 255, 0.1);
    transform: translateY(-2px);
  }
  
  .chart-card .ant-card-head {
    background: linear-gradient(135deg, #1a1a1a 0%, #262626 100%);
    border-bottom: 1px solid #333333;
    padding: 16px 24px;
  }
  
  .chart-card .ant-card-head-title {
    font-weight: 600;
    color: #ffffff;
    font-size: 16px;
  }
`;

// 注入樣式
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = strategicStyles;
  document.head.appendChild(styleElement);
}

// 銷售圖表組件 - 滿版無標籤版本
const SalesChart: React.FC<{ data: Array<{date: string; sales: number}> }> = ({ data }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    if (!canvasRef.current || !data.length) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 設置畫布尺寸
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // 根據主題設置背景色
    const isDark = theme === 'dark';
    const backgroundColor = isDark ? '#000000' : '#ffffff';

    // 清除畫布並設置背景
    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, rect.width, rect.height);

    // 設置樣式 - 更大顯示
    const padding = 40;
    const chartWidth = rect.width - padding * 2;
    const chartHeight = rect.height - padding * 2;

    // 計算數據範圍
    const maxSales = Math.max(...data.map(d => d.sales));
    const minSales = Math.min(...data.map(d => d.sales));
    const salesRange = maxSales - minSales || 1;

    // 繪製網格線
    const gridColor = isDark ? '#333333' : '#f0f0f0';
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(padding + chartWidth, y);
      ctx.stroke();
    }

    // 繪製陰影區域
    ctx.beginPath();
    ctx.moveTo(padding, padding + chartHeight);
    
    data.forEach((point, index) => {
      const x = padding + (chartWidth / (data.length - 1)) * index;
      const y = padding + chartHeight - ((point.sales - minSales) / salesRange) * chartHeight;
      ctx.lineTo(x, y);
    });
    
    ctx.lineTo(padding + chartWidth, padding + chartHeight);
    ctx.closePath();

    // 創建漸變陰影
    const gradient = ctx.createLinearGradient(0, padding, 0, padding + chartHeight);
    gradient.addColorStop(0, 'rgba(24, 144, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(24, 144, 255, 0.05)');
    ctx.fillStyle = gradient;
    ctx.fill();

    // 繪製折線
    ctx.beginPath();
    ctx.strokeStyle = '#1890ff';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    data.forEach((point, index) => {
      const x = padding + (chartWidth / (data.length - 1)) * index;
      const y = padding + chartHeight - ((point.sales - minSales) / salesRange) * chartHeight;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // 移除數據點繪製，實現簡潔效果

    // 移除Y軸標籤繪製，實現滿版效果

    // 移除X軸標籤繪製，實現滿版效果

  }, [data, theme]);

  // 滑鼠懸停事件處理
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !data.length) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;

    const padding = 40;
    const chartWidth = rect.width - padding * 2;

    // 計算最接近的數據點
    const dataIndex = Math.round(((x - padding) / chartWidth) * (data.length - 1));
    const clampedIndex = Math.max(0, Math.min(dataIndex, data.length - 1));
    const point = data[clampedIndex];

    if (point) {
      // 移除舊的提示框
      const oldTooltip = document.getElementById('chart-tooltip');
      if (oldTooltip) {
        oldTooltip.remove();
      }
      
      // 創建新的提示框
      const tooltip = document.createElement('div');
      tooltip.id = 'chart-tooltip';
      tooltip.style.cssText = `
        position: fixed !important;
        left: ${e.clientX + 5}px !important;
        top: ${e.clientY - 60 - 5}px !important;
        z-index: 1000 !important;
        pointer-events: none !important;
        transform: none !important;
        margin: 0 !important;
        padding: 0 !important;
        border: none !important;
      `;
      
      // 設置提示框內容
      const displayDate = new Date(point.date).toLocaleDateString('zh-TW', { 
        month: 'long', 
        day: 'numeric',
        weekday: 'short'
      });
      
      tooltip.innerHTML = `
        <div style="background: rgba(0,0,0,0.9); color: white; padding: 10px 14px; border-radius: 6px; font-size: 13px; white-space: nowrap; box-shadow: 0 4px 12px rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1);">
          <div style="font-weight: bold; margin-bottom: 4px;">${displayDate}</div>
          <div style="color: #52c41a; display: flex; align-items: center; gap: 4px;">
            當日銷售額: 
            <svg width="12" height="12" viewBox="0 0 1024 1024" style="fill: #52c41a;">
              <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372zm47.7-395.2l-25.4-5.9V348.6c38 5.2 61.5 29 65.5 58.2.5 4 3.9 6.9 7.9 6.9h44.9c4.7 0 8.4-4.1 8-8.8-6.1-62.3-57.4-102.3-125.9-109.2V263c0-4.4-3.6-8-8-8h-28.1c-4.4 0-8 3.6-8 8v33c-70.8 6.9-126.2 46-126.2 119 0 67.6 49.8 100.2 102.1 112.7l24.7 6.3v142.7c-44.2-5.9-69-29.5-74.1-61.3-.6-3.8-4-6.6-7.9-6.6H363c-4.7 0-8.4 4-8 8.7 4.5 55 46.2 105.6 135.2 112.1V761c0 4.4 3.6 8 8 8h28.4c4.4 0 8-3.6 8-8.1l-.2-31.7c78.3-6.9 134.3-48.8 134.3-124-.1-69.4-44.2-100.4-109-116.4zm-68.6-16.2c-5.6-1.6-10.3-3.1-15-5-33.8-12.2-49.5-31.9-49.5-57.3 0-36.3 27.5-57 64.5-61.7v124zM534.3 677V543.3c3.1.9 5.9 1.6 8.8 2.2 47.3 14.4 63.2 34.4 63.2 65.1 0 39.1-29.4 62.6-72 66.4z"/>
            </svg>
            NT$ ${point.sales.toLocaleString()}
          </div>
        </div>
      `;
      
      // 添加到文檔
      document.body.appendChild(tooltip);
    }
  };

  const handleMouseLeave = () => {
    // 移除動態創建的提示框
    const tooltip = document.getElementById('chart-tooltip');
    if (tooltip) {
      tooltip.remove();
    }
  };

  return (
    <div style={{ position: 'relative', height: '400px', width: '100%' }}>
      <canvas
        ref={canvasRef}
        style={{ 
          width: '100%', 
          height: '100%',
          borderRadius: '8px',
          cursor: 'crosshair'
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
      <div
        ref={tooltipRef}
        style={{
          position: 'fixed',
          display: 'none',
          zIndex: 1000,
          pointerEvents: 'none',
          left: '0px',
          top: '0px',
          transform: 'none'
        }}
      />
    </div>
  );
};

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overviewData, setOverviewData] = useState<OverviewData | null>(null);
  
  // 圖表數據狀態
  const [dailySalesData, setDailySalesData] = useState<DailySalesData[]>([]);
  const [orderStatusData, setOrderStatusData] = useState<OrderStatusData[]>([]);
  const [topProducts, setTopProducts] = useState<PopularProduct[]>([]);
  const [productFilter, setProductFilter] = useState('totalSales');

  // 篩選選項
  const filterOptions = [
    { key: 'price', label: '單件價格', sort: (a: PopularProduct, b: PopularProduct) => b.price - a.price },
    { key: 'salesCount', label: '銷售件數', sort: (a: PopularProduct, b: PopularProduct) => b.salesCount - a.salesCount },
    { key: 'totalSales', label: '總銷售額', sort: (a: PopularProduct, b: PopularProduct) => b.totalSales - a.totalSales }
  ];

  // 根據篩選條件排序商品
  const sortedProducts = [...topProducts].sort(filterOptions.find(opt => opt.key === productFilter)?.sort);

  // 過濾當月數據
  const filteredDailySalesData = dailySalesData.filter(item => {
    const itemDate = new Date(item.date);
    const now = new Date();
    return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
  });



  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 獲取概覽數據（包含增長率）
      const overviewData = await DashboardService.getOverview();
      if (overviewData.success) {
        setOverviewData(overviewData.data);
      }
    } catch (err) {
      console.error('概覽數據獲取失敗:', err);
    }
    
    try {
      // 獲取每日銷售數據
      const dailySalesData = await getDailySalesData('month');
      if (dailySalesData.success) {
        setDailySalesData(dailySalesData.data || []);
      } else {
        setDailySalesData([]);
      }
    } catch (err) {
      console.error('每日銷售數據獲取失敗:', err);
      setDailySalesData([]);
    }
    
    try {
      // 獲取訂單狀態數據
      const orderStatusData = await getOrderStatusData();
      if (orderStatusData.success) {
        setOrderStatusData(orderStatusData.data);
      }
    } catch (err) {
      console.error('訂單狀態數據獲取失敗:', err);
    }
    
    try {
      // 獲取熱門商品數據
      const popularProductsData = await getPopularProductsData(10);
      if (popularProductsData.success) {
        setTopProducts(popularProductsData.data);
      }
    } catch (err) {
      console.error('熱門商品數據獲取失敗:', err);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const statCards = overviewData ? [
    {
      title: '當月總營收',
      value: overviewData.summary.totalSales,
      prefix: <MoneyIcon size={20} color="#52c41a" />,
      suffix: '元',
      growth: overviewData.growth.salesGrowth,
      className: 'revenue-card',
    },
    {
      title: '當月總訂單數',
      value: overviewData.summary.totalOrders,
      prefix: <FileTextOutlined />,
      suffix: '筆',
      growth: overviewData.growth.ordersGrowth,
      className: 'orders-card',
    },
    {
      title: '當月總客戶數',
      value: overviewData.summary.totalUsers,
      prefix: <UserOutlined />,
      suffix: '人',
      growth: overviewData.growth.usersGrowth,
      className: 'customers-card',
    },
    {
      title: '當月商品總數',
      value: overviewData.summary.totalProducts,
      prefix: <ShoppingOutlined />,
      suffix: '件',
      growth: 3.1, // 模擬商品增長率
      className: 'products-card',
    },
  ] : [];

  return (
    <div className="dashboard-page">
      <PageHeader
        title="戰略性儀表板"
        subtitle="高層管理決策支持系統 - 關鍵業務指標總覽"
        extra={
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrophyOutlined style={{ color: '#faad14' }} />
              <Text type="secondary">管理層專用</Text>
            </div>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={fetchDashboardData}
              loading={loading}
            >
              刷新數據
            </Button>
          </div>
        }
      />

      {error && (
        <Alert
          message="數據加載失敗"
          description={error}
          type="warning"
          showIcon
          closable
          onClose={() => setError(null)}
          style={{ marginBottom: 24 }}
        />
      )}


      <Spin spinning={loading}>
        <div className="dashboard-content">
          {/* 當月每日銷售額圖表 */}
          <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
            <Col span={24}>
              <Card 
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <LineChartOutlined style={{ color: '#1890ff' }} />
                    <span>當月每日銷售額趨勢</span>
                  </div>
                }
                className="chart-card"
              >
                <SalesChart data={filteredDailySalesData} />
              </Card>
            </Col>
          </Row>

          {/* KPI指標卡片 */}
          <Row gutter={[24, 24]} className="stats-row" style={{ marginBottom: '32px' }}>
            {statCards.map((card, index) => (
              <Col xs={24} sm={12} lg={6} key={index}>
                <Card className={`kpi-card ${card.className}`}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ 
                      fontSize: '28px', 
                      fontWeight: 'bold',
                      color: card.growth >= 0 ? '#52c41a' : '#ff4d4f',
                      marginBottom: '8px'
                    }}>
                      {card.prefix} {card.value?.toLocaleString()} {card.suffix}
                    </div>
                    <div style={{ 
                      fontSize: '14px', 
                      color: '#d9d9d9',
                      marginBottom: '8px'
                    }}>
                      {card.title}
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      height: '20px'
                    }}>
                      {card.title !== '商品總數' && (
                        <>
                          <span style={{ color: card.growth >= 0 ? '#52c41a' : '#ff4d4f' }}>
                            {card.growth >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                          </span>
                          <span style={{ 
                            marginLeft: '4px',
                            color: card.growth >= 0 ? '#52c41a' : '#ff4d4f'
                          }}>
                            {card.growth >= 0 ? '+' : ''}{card.growth}%
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>

          {/* 業務分析區域 */}
          <Row gutter={[24, 24]} className="charts-row">
            {/* 訂單狀態分布 */}
            <Col xs={24} lg={12}>
              <Card 
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileTextOutlined style={{ color: '#1890ff' }} />
                    <span>當月訂單狀態分布</span>
                  </div>
                }
                className="chart-card"
              >
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: '16px',
                  padding: '10px 0',
                  width: '100%'
                }}>
                {(() => {
                  // 定義要顯示的四種狀態
                  const targetStatuses = ['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED'];
                  
                  // 訂單狀態中文映射
                  const statusLabels: { [key: string]: string } = {
                    'PENDING': '待處理',
                    'PROCESSING': '處理中',
                    'COMPLETED': '已完成',
                    'CANCELLED': '已取消'
                  };
                  
                  // 訂單狀態顏色映射
                  const statusColors: { [key: string]: string } = {
                    'PENDING': '#faad14',
                    'PROCESSING': '#1890ff',
                    'COMPLETED': '#52c41a',
                    'CANCELLED': '#ff4d4f'
                  };
                  
                  // 計算總數（只計算這四種狀態）
                  const totalCount = orderStatusData
                    .filter(item => targetStatuses.includes(item.status))
                    .reduce((sum, status) => sum + status.count, 0);
                  
                  // 為每種狀態創建數據，如果沒有數據則設為0
                  return targetStatuses.map((status, index) => {
                    const existingItem = orderStatusData.find(item => item.status === status);
                    const count = existingItem ? existingItem.count : 0;
                    const percentage = totalCount > 0 ? (count / totalCount) * 100 : 0;
                    const displayPercentage = Math.round(percentage);
                    const statusLabel = statusLabels[status];
                    const color = statusColors[status];
                  
                  return (
                    <div key={index} style={{ 
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      padding: '20px 24px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      minWidth: '140px',
                      width: '100%'
                    }}>
                      <div style={{ 
                        textAlign: 'center',
                        marginBottom: '12px',
                        width: '100%'
                      }}>
                        <h4 style={{ 
                          fontSize: '16px', 
                          fontWeight: 'bold',
                          color: '#ffffff',
                          margin: '0 0 6px 0',
                          padding: '0'
                        }}>
                          {statusLabel}
                        </h4>
                        <p style={{ 
                          fontSize: '14px',
                          color: '#bfbfbf',
                          margin: '0',
                          padding: '0'
                        }}>
                          {count} ({displayPercentage}%)
                        </p>
                      </div>
                      <div style={{ width: '100%', padding: '0 8px' }}>
                        <div style={{
                          width: '100%',
                          height: '8px',
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          borderRadius: '4px',
                          overflow: 'hidden',
                          position: 'relative'
                        }}>
                          <div style={{
                            width: `${percentage}%`,
                            height: '100%',
                            backgroundColor: color,
                            borderRadius: '4px',
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                      </div>
                  </div>
                  );
                  });
                })()}
                </div>
              </Card>
            </Col>

            {/* 熱門商品 */}
            <Col xs={24} lg={12}>
              <Card 
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <TrophyOutlined style={{ color: '#faad14' }} />
                    <span>當月熱銷排行榜</span>
                  </div>
                }
                className="chart-card"
                styles={{
                  header: {
                    padding: '8px 20px !important',
                    marginBottom: '0 !important'
                  },
                  body: { 
                    padding: '0 !important',
                    display: 'block !important',
                    alignItems: 'unset !important',
                    justifyContent: 'unset !important',
                    minHeight: 'unset !important',
                    marginTop: '0 !important'
                  }
                }}
              >
                {/* 獨立容器，不受父元素CSS影響 */}
                <div style={{
                  padding: '0px 20px 20px 20px',
                  display: 'block',
                  width: '100%',
                  height: '100%'
                }}>
                  {/* 篩選標籤 */}
                  <div style={{ 
                    display: 'flex', 
                    gap: '8px', 
                    marginTop: '-8px',
                    marginBottom: '12px',
                    flexWrap: 'wrap'
                  }}>
                    {filterOptions.map((option) => (
                      <div
                        key={option.key}
                        onClick={() => setProductFilter(option.key)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '16px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          background: productFilter === option.key 
                            ? 'linear-gradient(45deg, #1890ff, #40a9ff)'
                            : 'rgba(255, 255, 255, 0.1)',
                          color: productFilter === option.key ? '#fff' : '#bfbfbf',
                          border: productFilter === option.key 
                            ? '1px solid #1890ff' 
                            : '1px solid rgba(255, 255, 255, 0.2)'
                        }}
                      >
                        {option.label}
                      </div>
                    ))}
                  </div>

                  {/* 商品卡片網格 */}
                  <div style={{ 
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '12px'
                  }}>
                  {sortedProducts.slice(0, 4).map((product, index) => {
                    const rank = index + 1;
                    const currentFilter = filterOptions.find(opt => opt.key === productFilter);
                    // 使用原始數據計算最大值，而不是排序後的數據
                    const maxValue = Math.max(...topProducts.map(p => p[currentFilter?.key as keyof typeof p] as number));
                    const currentValue = product[currentFilter?.key as keyof typeof product] as number;
                    const percentage = maxValue > 0 ? (currentValue / maxValue) * 100 : 0;
                    
                    return (
                      <div key={product.id} style={{ 
                        position: 'relative',
                        background: rank <= 3 
                          ? `linear-gradient(135deg, ${rank === 1 ? '#ffd700' : rank === 2 ? '#c0c0c0' : '#cd7f32'}20, transparent)`
                          : 'rgba(255, 255, 255, 0.02)',
                        border: `2px solid ${rank === 1 ? '#ffd700' : rank === 2 ? '#c0c0c0' : rank === 3 ? '#cd7f32' : '#333333'}`,
                        borderRadius: '12px',
                        padding: '12px',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer',
                        height: '130px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                      }}>
                        {/* 排名徽章 */}
                        <div style={{
                          position: 'absolute',
                          top: '-8px',
                          left: '12px',
                          background: rank === 1 ? '#ffd700' : rank === 2 ? '#c0c0c0' : rank === 3 ? '#cd7f32' : '#1890ff',
                          color: rank <= 3 ? '#000' : '#fff',
                          borderRadius: '50%',
                          width: '28px',
                          height: '28px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
                        }}>
                          {rank <= 3 ? '🏆' : rank}
                        </div>

                        {/* 商品名稱 */}
                        <div style={{ 
                          fontWeight: 'bold', 
                          fontSize: '14px',
                          color: '#ffffff',
                          marginTop: '8px',
                          lineHeight: '1.2'
                        }}>
                          {product.name}
                        </div>

                        {/* 數據顯示 */}
                        <div style={{ 
                          fontSize: '11px', 
                          color: '#bfbfbf',
                          marginBottom: '8px'
                        }}>
                          <div style={{ marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            單價: <MoneyIcon size={10} color="#bfbfbf" />{product.price.toLocaleString()}
                          </div>
                          <div style={{ marginBottom: '2px' }}>
                            銷售: {product.salesCount} 件
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            營收: <MoneyIcon size={10} color="#52c41a" />{product.totalSales.toLocaleString()}
                          </div>
                        </div>

                        {/* 進度條 */}
                        <div style={{ 
                          position: 'relative'
                        }}>
                          <div style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            height: '4px',
                            borderRadius: '2px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              background: rank === 1 
                                ? 'linear-gradient(90deg, #ffd700, #ffed4e)'
                                : rank === 2 
                                ? 'linear-gradient(90deg, #c0c0c0, #e8e8e8)'
                                : rank === 3
                                ? 'linear-gradient(90deg, #cd7f32, #daa520)'
                                : 'linear-gradient(90deg, #1890ff, #40a9ff)',
                              height: '100%',
                              width: `${percentage}%`,
                              borderRadius: '2px',
                              transition: 'width 0.8s ease',
                              boxShadow: rank <= 3 ? '0 0 6px rgba(255, 215, 0, 0.4)' : 'none'
                            }} />
                          </div>
                          <div style={{
                            position: 'absolute',
                            right: '0',
                            top: '-18px',
                            fontSize: '9px',
                            color: '#bfbfbf',
                            fontWeight: 'bold'
                          }}>
                            {percentage.toFixed(0)}%
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </div>
      </Spin>
    </div>
  );
};

export default Dashboard;
