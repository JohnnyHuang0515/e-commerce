const express = require('express');
const app = express();
const PORT = 3001;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'product-service',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Test Server 啟動成功`);
  console.log(`📡 服務地址: http://localhost:${PORT}`);
  console.log(`🏥 健康檢查: http://localhost:${PORT}/health`);
});
