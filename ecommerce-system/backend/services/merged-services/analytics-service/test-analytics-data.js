const mongoose = require('mongoose');

// 連接 MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://admin:password123@localhost:27017/ecommerce?authSource=admin', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB 連接成功');
  } catch (error) {
    console.error('❌ MongoDB 連接失敗:', error);
    process.exit(1);
  }
};

// 內嵌模型定義 (與控制器相同)
const salesAnalyticsSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  total_sales: {
    type: Number,
    default: 0
  },
  total_orders: {
    type: Number,
    default: 0
  },
  total_users: {
    type: Number,
    default: 0
  },
  average_order_value: {
    type: Number,
    default: 0
  },
  conversion_rate: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  collection: 'sales_analytics'
});

const userBehaviorSchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true
  },
  item_id: {
    type: String
  },
  item_type: {
    type: String
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  session_id: {
    type: String,
    required: true
  }
}, {
  timestamps: true,
  collection: 'user_behaviors'
});

const productPerformanceSchema = new mongoose.Schema({
  product_id: {
    type: String,
    required: true
  },
  product_name: {
    type: String,
    required: true
  },
  views: {
    type: Number,
    default: 0
  },
  clicks: {
    type: Number,
    default: 0
  },
  purchases: {
    type: Number,
    default: 0
  },
  revenue: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  collection: 'product_performance'
});

// 創建模型
const SalesAnalytics = mongoose.model('SalesAnalytics', salesAnalyticsSchema);
const UserBehavior = mongoose.model('UserBehavior', userBehaviorSchema);
const ProductPerformance = mongoose.model('ProductPerformance', productPerformanceSchema);

// 生成測試數據
const generateTestData = async () => {
  console.log('🚀 開始生成分析測試數據...');
  
  // 1. 生成銷售分析數據
  const salesData = [];
  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    salesData.push({
      date: date,
      total_sales: Math.floor(Math.random() * 10000) + 1000,
      total_orders: Math.floor(Math.random() * 100) + 10,
      total_users: Math.floor(Math.random() * 50) + 5,
      average_order_value: Math.floor(Math.random() * 500) + 100,
      conversion_rate: Math.random() * 5 + 1
    });
  }
  
  await SalesAnalytics.deleteMany({});
  await SalesAnalytics.insertMany(salesData);
  console.log('✅ 銷售分析數據生成完成');
  
  // 2. 生成用戶行為數據
  const behaviorData = [];
  const actions = ['view', 'click', 'search', 'purchase', 'add_to_cart', 'remove_from_cart'];
  const itemTypes = ['product', 'category', 'page'];
  
  for (let i = 0; i < 200; i++) {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 30));
    
    behaviorData.push({
      user_id: `user_${Math.floor(Math.random() * 20) + 1}`,
      action: actions[Math.floor(Math.random() * actions.length)],
      item_id: `item_${Math.floor(Math.random() * 50) + 1}`,
      item_type: itemTypes[Math.floor(Math.random() * itemTypes.length)],
      metadata: {
        page: `/page_${Math.floor(Math.random() * 10) + 1}`,
        duration: Math.floor(Math.random() * 300) + 10
      },
      session_id: `session_${Math.floor(Math.random() * 50) + 1}`,
      created_at: date
    });
  }
  
  await UserBehavior.deleteMany({});
  await UserBehavior.insertMany(behaviorData);
  console.log('✅ 用戶行為數據生成完成');
  
  // 3. 生成產品性能數據
  const productData = [];
  const products = [
    { id: 'product_001', name: 'iPhone 15 Pro' },
    { id: 'product_002', name: 'Samsung Galaxy S24' },
    { id: 'product_003', name: 'MacBook Pro M3' },
    { id: 'product_004', name: 'AirPods Pro 2' },
    { id: 'product_005', name: 'Nike Air Max 270' },
    { id: 'product_006', name: 'Sony WH-1000XM5' },
    { id: 'product_007', name: 'iPad Pro 12.9' },
    { id: 'product_008', name: 'Dell XPS 13' },
    { id: 'product_009', name: 'Canon EOS R5' },
    { id: 'product_010', name: 'Tesla Model 3' }
  ];
  
  for (const product of products) {
    const views = Math.floor(Math.random() * 1000) + 100;
    const clicks = Math.floor(views * (Math.random() * 0.3 + 0.1));
    const purchases = Math.floor(clicks * (Math.random() * 0.2 + 0.05));
    const revenue = purchases * (Math.floor(Math.random() * 1000) + 100);
    
    productData.push({
      product_id: product.id,
      product_name: product.name,
      views: views,
      clicks: clicks,
      purchases: purchases,
      revenue: revenue,
      created_at: new Date()
    });
  }
  
  await ProductPerformance.deleteMany({});
  await ProductPerformance.insertMany(productData);
  console.log('✅ 產品性能數據生成完成');
  
  console.log('🎉 所有分析測試數據生成完成！');
};

// 主函數
const main = async () => {
  await connectDB();
  await generateTestData();
  await mongoose.disconnect();
  console.log('✅ 資料庫連接已關閉');
};

// 執行
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { generateTestData };
