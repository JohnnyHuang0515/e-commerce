// scripts/seed-test-data.js
const { Client } = require('pg');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// --- 配置 ---
const pgConfig = {
  user: process.env.POSTGRES_USER || 'admin',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'ecommerce_transactions',
  password: process.env.POSTGRES_PASSWORD || 'password123',
  port: process.env.POSTGRES_PORT || 5432,
};

const mongoURI = process.env.MONGODB_URI || 'mongodb://admin:password123@localhost:27017/ecommerce?authSource=admin';

const usersToCreate = [
  { email: 'admin@ecommerce.com', name: '系統管理員', role: 'ADMIN' },
  { email: 'merchant@ecommerce.com', name: '商家', role: 'MERCHANT' },
  { email: 'staff@ecommerce.com', name: '員工', role: 'STAFF' },
  { email: 'customer1@ecommerce.com', name: '張小明', role: 'CUSTOMER' },
  { email: 'customer2@ecommerce.com', name: '李美華', role: 'CUSTOMER' },
  { email: 'customer3@ecommerce.com', name: '王大偉', role: 'CUSTOMER' },
  { email: 'customer4@ecommerce.com', name: '陳小芳', role: 'CUSTOMER' },
  { email: 'customer5@ecommerce.com', name: '林志強', role: 'CUSTOMER' },
  { email: 'customer6@ecommerce.com', name: '黃淑芬', role: 'CUSTOMER' },
  { email: 'customer7@ecommerce.com', name: '劉建國', role: 'CUSTOMER' },
  { email: 'customer8@ecommerce.com', name: '吳雅婷', role: 'CUSTOMER' },
  { email: 'customer9@ecommerce.com', name: '鄭雅文', role: 'CUSTOMER' },
  { email: 'customer10@ecommerce.com', name: '許志明', role: 'CUSTOMER' },
];

const categoriesToCreate = [
    { name: '電子產品', description: '最新最酷的電子產品' },
    { name: '服飾配件', description: '引領潮流的服飾與配件' },
    { name: '家居生活', description: '提升您的生活品質' },
    { name: '美妝保養', description: '呵護您的肌膚' },
    { name: '運動戶外', description: '探索戶外，保持健康' },
];

const productsToCreate = {
    '電子產品': [
        { name: 'MacBook Pro 14吋', description: 'M3 晶片，專業級筆記型電腦', price: 59900, brand: 'Apple', tags: ['筆電', 'MacBook', '專業'] },
        { name: 'AirPods Pro 2', description: '主動降噪無線耳機', price: 7490, brand: 'Apple', tags: ['耳機', '降噪', '無線'] },
        { name: 'iPhone 15 Pro', description: '鈦金屬設計，A17 Pro 晶片', price: 36900, brand: 'Apple', tags: ['手機', 'iPhone', '旗艦'] },
        { name: 'iPad Air', description: 'M2 晶片，10.9吋 Liquid Retina 顯示器', price: 18900, brand: 'Apple', tags: ['平板', 'iPad', '創作'] },
    ],
    '服飾配件': [
        { name: 'Levi\'s 501 經典牛仔褲', description: '原創直筒剪裁，100% 純棉', price: 2990, brand: 'Levi\'s', tags: ['牛仔褲', '經典', '直筒'] },
        { name: 'Uniqlo U 純棉T恤', description: '簡約設計，舒適材質', price: 590, brand: 'Uniqlo', tags: ['T恤', '純棉', '基本款'] },
        { name: 'Coach 經典皮帶', description: '真皮材質，精緻工藝', price: 4500, brand: 'Coach', tags: ['皮帶', '真皮', '精品'] },
        { name: 'Ray-Ban 經典太陽眼鏡', description: 'UV400 防護，經典設計', price: 3500, brand: 'Ray-Ban', tags: ['太陽眼鏡', '經典', '防護'] },
    ],
    '家居生活': [
        { name: 'Dyson V15 無線吸塵器', description: '強力吸力，智能感應', price: 24900, brand: 'Dyson', tags: ['吸塵器', '無線', '智能'] },
        { name: 'Tempur 記憶枕', description: '人體工學設計，改善睡眠', price: 8900, brand: 'Tempur', tags: ['枕頭', '記憶棉', '睡眠'] },
        { name: 'MUJI 香氛機', description: '超音波香氛擴散器', price: 1200, brand: 'MUJI', tags: ['香氛', '擴香', '放鬆'] },
        { name: 'WMF 不鏽鋼鍋具組', description: '德國工藝，專業級廚具', price: 8900, brand: 'WMF', tags: ['鍋具', '不鏽鋼', '德國'] },
    ],
    '美妝保養': [
        { name: 'SK-II 青春露', description: '經典保養精華，Pitera 成分', price: 4500, brand: 'SK-II', tags: ['精華', '抗老', '經典'] },
        { name: 'La Mer 經典乳霜', description: '奢華保養，深海修護', price: 12000, brand: 'La Mer', tags: ['乳霜', '奢華', '修護'] },
        { name: 'Chanel 經典唇膏', description: '絲絨質地，持久顯色', price: 1500, brand: 'Chanel', tags: ['唇膏', '經典', '絲絨'] },
        { name: 'Estée Lauder 小棕瓶', description: '夜間修護精華', price: 3200, brand: 'Estée Lauder', tags: ['精華', '修護', '夜間'] },
    ],
    '運動戶外': [
        { name: 'Nike Air Max 270', description: '氣墊跑鞋，舒適緩震', price: 4200, brand: 'Nike', tags: ['跑鞋', '氣墊', '舒適'] },
        { name: 'Adidas 運動上衣', description: 'ClimaLite 排汗材質', price: 1200, brand: 'Adidas', tags: ['運動服', '排汗', '透氣'] },
        { name: 'The North Face 衝鋒衣', description: 'Gore-Tex 防水材質', price: 8500, brand: 'The North Face', tags: ['衝鋒衣', '防水', '戶外'] },
        { name: 'Lululemon 瑜珈墊', description: '5mm 厚度，防滑設計', price: 2800, brand: 'Lululemon', tags: ['瑜珈墊', '防滑', '專業'] },
    ],
};


// --- MongoDB Models (Mongoose) ---
const Product = mongoose.model('Product', new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    brand: { type: String, required: true },
    category: { type: String, required: true },
    stock: { type: Number, required: true, default: 0 },
    tags: [String],
    image: { type: String, default: '/images/placeholder.jpg' },
    status: { type: String, default: 'active' },
    sku: { type: String, unique: true },
    images: [String],
    attributes: { type: Object, default: {} },
    view_count: { type: Number, default: 0 },
    sales_count: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    review_count: { type: Number, default: 0 },
}, { timestamps: true }));

const Category = mongoose.model('Category', new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    level: { type: Number, default: 0 },
    parent_id: { type: String },
    sort_order: { type: Number, default: 0 },
    status: { type: String, default: 'active' },
}, { timestamps: true }));

// 分析相關模型
const Analytics = mongoose.model('Analytics', new mongoose.Schema({
    type: { type: String, required: true },
    data: { type: Object, required: true },
    date: { type: Date, default: Date.now },
    period: { type: String, default: 'daily' },
}, { timestamps: true }));

const DashboardOverview = mongoose.model('DashboardOverview', new mongoose.Schema({
    total_sales: { type: Number, default: 0 },
    total_orders: { type: Number, default: 0 },
    total_users: { type: Number, default: 0 },
    total_products: { type: Number, default: 0 },
    period: { type: String, default: 'month' },
    date: { type: Date, default: Date.now },
}, { timestamps: true }));

const UserBehavior = mongoose.model('UserBehavior', new mongoose.Schema({
    user_id: { type: String, required: true },
    action: { type: String, required: true },
    product_id: { type: String },
    page: { type: String },
    duration: { type: Number },
    metadata: { type: Object },
}, { timestamps: true }));

const SystemHealth = mongoose.model('SystemHealth', new mongoose.Schema({
    service: { type: String, required: true },
    status: { type: String, required: true },
    response_time: { type: Number, default: 0 },
    memory_usage: { type: Number, default: 0 },
    cpu_usage: { type: Number, default: 0 },
    error_count: { type: Number, default: 0 },
}, { timestamps: true }));


// --- 主函式 ---
async function seed() {
  const pgClient = new Client(pgConfig);
  try {
    // --- 連接資料庫 ---
    console.log('🔄 正在連接資料庫...');
    await pgClient.connect();
    console.log('✅ PostgreSQL 連線成功');
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB 連線成功');

    // --- 新增使用者 ---
    console.log('🔄 正在新增使用者...');
    const hashedPassword = await bcrypt.hash('password123', 10);
    for (const user of usersToCreate) {
      const roleResult = await pgClient.query("SELECT id FROM roles WHERE name = $1", [user.role]);
      if (roleResult.rows.length === 0) {
        console.warn(`🟡 角色 ${user.role} 不存在，略過使用者 ${user.email}`);
        continue;
      }
      const roleId = roleResult.rows[0].id;
      
      await pgClient.query(
        "INSERT INTO users (email, password, name, role, role_id, status, email_verified_at) VALUES ($1, $2, $3, $4, $5, 'active', NOW()) ON CONFLICT (email) DO NOTHING",
        [user.email, hashedPassword, user.name, user.role, roleId]
      );
    }
    console.log('✅ 使用者新增完成');

    // --- 新增分類 ---
    console.log('🔄 正在新增分類...');
    await Category.deleteMany({});
    const createdCategories = await Category.insertMany(categoriesToCreate);
    console.log('✅ 分類新增完成');

    // --- 新增產品 ---
    console.log('🔄 正在新增產品...');
    await Product.deleteMany({});
    const allProducts = [];
    for (const category of createdCategories) {
        const products = productsToCreate[category.name].map(p => ({ 
            ...p, 
            category: category.name,
            stock: Math.floor(Math.random() * 100) + 10, // 10-110 庫存
            sku: `SKU-${p.name.replace(/\s/g, '')}`,
            attributes: {},
            view_count: Math.floor(Math.random() * 1000) + 100,
            sales_count: Math.floor(Math.random() * 100) + 10,
            rating: Math.round((Math.random() * 2 + 3) * 10) / 10, // 3.0-5.0
            review_count: Math.floor(Math.random() * 50) + 5
        }));
        const insertedProducts = await Product.insertMany(products);
        allProducts.push(...insertedProducts);
    }
    console.log('✅ 產品新增完成');

    // --- 新增庫存資料 (PostgreSQL) ---
    console.log('🔄 正在新增庫存資料...');
    for (const product of allProducts) {
        const productUuid = uuidv4(); // 生成 UUID 作為庫存記錄的產品 ID
        await pgClient.query(
            `INSERT INTO inventory (product_id, sku, quantity, reserved_quantity, reorder_point, status)
             VALUES ($1, $2, $3, $4, $5, 'active') ON CONFLICT (sku) DO NOTHING`,
            [productUuid, `SKU-${product.name.replace(/\s/g, '')}`, 
             Math.floor(Math.random() * 100) + 50, Math.floor(Math.random() * 10), 20]
        );
    }
    console.log('✅ 庫存資料新增完成');

    // --- 新增訂單 ---
    console.log('🔄 正在新增訂單...');
    
    // 清理舊訂單資料
    await pgClient.query("DELETE FROM order_items");
    await pgClient.query("DELETE FROM orders");
    await pgClient.query("DELETE FROM payments");
    await pgClient.query("DELETE FROM logistics");
    console.log('🧹 舊訂單資料已清理');
    
    const allCustomers = await pgClient.query("SELECT id FROM users WHERE role IN ('CUSTOMER', 'customer')");
    const productsForOrders = await Product.find();

    console.log(`📊 找到 ${allCustomers.rows.length} 個客戶，${productsForOrders.length} 個商品`);
    
    // 生成過去30天的訂單數據，更真實的分布
    const today = new Date();
    let totalOrdersCreated = 0;
    
    // 定義熱門商品（更容易被選中）
    const popularProducts = productsForOrders.slice(0, 6); // 前6個商品為熱門商品
    const popularProductIds = popularProducts.map(p => p._id.toString());
    
    for (let dayOffset = 29; dayOffset >= 0; dayOffset--) {
        const orderDate = new Date(today);
        orderDate.setDate(orderDate.getDate() - dayOffset);
        
        // 週末訂單較少，平日較多
        const isWeekend = orderDate.getDay() === 0 || orderDate.getDay() === 6;
        const baseOrderCount = isWeekend ? 2 : 4;
        const dailyOrderCount = baseOrderCount + Math.floor(Math.random() * 3);
        
        for (let i = 0; i < dailyOrderCount; i++) {
            // 隨機選擇客戶
            const randomCustomer = allCustomers.rows[Math.floor(Math.random() * allCustomers.rows.length)];
            const customerId = randomCustomer.id;
            
            // 選擇商品 - 熱門商品有更高機率被選中
            let orderProducts = [];
            const productCount = Math.floor(Math.random() * 2) + 1; // 1-2個商品
            
            for (let j = 0; j < productCount; j++) {
                let selectedProduct;
                // 60% 機率選擇熱門商品
                if (Math.random() < 0.6 && popularProducts.length > 0) {
                    selectedProduct = popularProducts[Math.floor(Math.random() * popularProducts.length)];
                } else {
                    selectedProduct = productsForOrders[Math.floor(Math.random() * productsForOrders.length)];
                }
                
                if (selectedProduct && !orderProducts.find(p => p._id.toString() === selectedProduct._id.toString())) {
                    orderProducts.push(selectedProduct);
                }
            }
            
            if (orderProducts.length === 0) continue;
            
            const subtotal = orderProducts.reduce((sum, p) => sum + p.price, 0);
            const shipping = subtotal > 10000 ? 0 : 150; // 滿10000免運費
            const total = subtotal + shipping;

            // 訂單狀態分布：85%完成，10%處理中，5%待處理
            const statusRand = Math.random();
            let randomStatus;
            if (statusRand < 0.85) {
                randomStatus = 'COMPLETED';
            } else if (statusRand < 0.95) {
                randomStatus = 'PROCESSING';
            } else {
                randomStatus = 'PENDING';
            }

            const orderResult = await pgClient.query(
                `INSERT INTO orders (order_number, user_id, status, total_amount, subtotal, shipping_amount, shipping_address, billing_address, payment_status, payment_method, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, $5, $6, '{}', '{}', 'SUCCESS', 'CREDIT_CARD', $7, $7) RETURNING id`,
                [`ORDER-${orderDate.getTime()}-${i}`, customerId, randomStatus, total, subtotal, shipping, orderDate]
            );
            const orderId = orderResult.rows[0].id;

            // 為每個商品創建訂單項目
            for (const product of orderProducts) {
                const quantity = Math.floor(Math.random() * 2) + 1; // 1-2件
                const unitPrice = product.price;
                const totalPrice = unitPrice * quantity;
                
                await pgClient.query(
                    `INSERT INTO order_items (order_id, product_id, product_name, product_sku, quantity, unit_price, total_price)
                     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                    [orderId, product._id.toString(), product.name, `SKU-${product.name.replace(/\s/g, '')}`, quantity, unitPrice, totalPrice]
                );
            }
            
            totalOrdersCreated++;
        }
    }
    console.log(`✅ 訂單新增完成 - 總共創建了 ${totalOrdersCreated} 個訂單`);

    // --- 新增支付記錄 ---
    console.log('🔄 正在新增支付記錄...');
    const completedOrders = await pgClient.query("SELECT id, total_amount FROM orders WHERE status = 'COMPLETED'");
    for (const order of completedOrders.rows) {
        await pgClient.query(
            `INSERT INTO payments (order_id, payment_method, payment_provider, amount, currency, status, processed_at)
             VALUES ($1, 'CREDIT_CARD', 'Stripe', $2, 'TWD', 'SUCCESS', NOW()) ON CONFLICT DO NOTHING`,
            [order.id, order.total_amount]
        );
    }
    console.log('✅ 支付記錄新增完成');

    // --- 新增物流記錄 ---
    console.log('🔄 正在新增物流記錄...');
    for (const order of completedOrders.rows) {
        await pgClient.query(
            `INSERT INTO logistics (order_id, shipping_method, carrier, tracking_number, status, shipping_address, estimated_delivery, shipping_cost)
             VALUES ($1, 'STANDARD', '黑貓宅急便', $2, 'delivered', '{}', NOW() - INTERVAL '2 days', 150) ON CONFLICT DO NOTHING`,
            [order.id, `TRK${order.id.toString().substring(0, 8).toUpperCase()}`]
        );
    }
    console.log('✅ 物流記錄新增完成');

    // --- 新增 MongoDB 分析資料 ---
    console.log('🔄 正在新增分析資料...');
    
    // 清理舊的分析資料
    await Analytics.deleteMany({});
    await DashboardOverview.deleteMany({});
    await UserBehavior.deleteMany({});
    await SystemHealth.deleteMany({});

    // 生成儀表板概覽資料
    const totalSales = await pgClient.query("SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE status = 'COMPLETED'");
    const totalOrders = await pgClient.query("SELECT COUNT(*) as total FROM orders");
    const totalUsers = await pgClient.query("SELECT COUNT(*) as total FROM users WHERE role = 'CUSTOMER'");
    
    await DashboardOverview.create({
        total_sales: parseFloat(totalSales.rows[0].total),
        total_orders: parseInt(totalOrders.rows[0].total),
        total_users: parseInt(totalUsers.rows[0].total),
        total_products: allProducts.length,
        period: 'month',
        date: new Date()
    });

    // 生成用戶行為資料
    const customerIds = await pgClient.query("SELECT id FROM users WHERE role IN ('CUSTOMER', 'customer')");
    const behaviors = ['view_product', 'add_to_cart', 'purchase', 'search', 'browse_category'];
    const pages = ['home', 'product', 'category', 'cart', 'checkout'];
    
    for (let i = 0; i < 200; i++) {
        const randomCustomer = customerIds.rows[Math.floor(Math.random() * customerIds.rows.length)];
        const randomProduct = allProducts[Math.floor(Math.random() * allProducts.length)];
        
        await UserBehavior.create({
            user_id: randomCustomer.id,
            action: behaviors[Math.floor(Math.random() * behaviors.length)],
            product_id: randomProduct._id.toString(),
            page: pages[Math.floor(Math.random() * pages.length)],
            duration: Math.floor(Math.random() * 300) + 30,
            metadata: { 
                device: Math.random() > 0.5 ? 'mobile' : 'desktop',
                browser: 'Chrome',
                referrer: 'direct'
            }
        });
    }

    // 生成系統健康監控資料
    const services = ['auth-service', 'product-service', 'order-service', 'dashboard-service', 'payment-service'];
    for (const service of services) {
        await SystemHealth.create({
            service: service,
            status: Math.random() > 0.1 ? 'healthy' : 'warning',
            response_time: Math.floor(Math.random() * 100) + 50,
            memory_usage: Math.floor(Math.random() * 30) + 40,
            cpu_usage: Math.floor(Math.random() * 20) + 30,
            error_count: Math.floor(Math.random() * 5)
        });
    }

    // 生成分析報表資料
    for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        await Analytics.create({
            type: 'daily_sales',
            data: {
                date: date.toISOString().split('T')[0],
                sales: Math.floor(Math.random() * 50000) + 10000,
                orders: Math.floor(Math.random() * 20) + 5,
                users: Math.floor(Math.random() * 10) + 2
            },
            period: 'daily',
            date: date
        });
    }

    console.log('✅ 分析資料新增完成');

    // 顯示統計信息
    console.log('\n📊 數據統計:');
    const orderStats = await pgClient.query("SELECT status, COUNT(*) as count FROM orders GROUP BY status");
    console.log('訂單狀態分布:');
    orderStats.rows.forEach(row => {
        console.log(`  ${row.status}: ${row.count} 筆`);
    });
    
    const productStats = await pgClient.query(`
        SELECT oi.product_name, COUNT(*) as sales_count, SUM(oi.quantity) as total_quantity, SUM(oi.total_price) as total_sales
        FROM order_items oi 
        JOIN orders o ON oi.order_id = o.id 
        WHERE o.status = 'COMPLETED' 
        GROUP BY oi.product_name 
        ORDER BY sales_count DESC 
        LIMIT 5
    `);
    console.log('\n熱門商品 TOP 5:');
    productStats.rows.forEach((row, index) => {
        console.log(`  ${index + 1}. ${row.product_name} - 銷售 ${row.sales_count} 次，總額 ${row.total_sales} 元`);
    });

    console.log('\n📈 分析資料統計:');
    console.log(`  用戶行為記錄: ${await UserBehavior.countDocuments()} 筆`);
    console.log(`  系統健康監控: ${await SystemHealth.countDocuments()} 筆`);
    console.log(`  分析報表: ${await Analytics.countDocuments()} 筆`);

  } catch (error) {
    console.error('❌ 執行腳本時發生錯誤:', error.message);
    console.error('詳細錯誤:', error);
    process.exit(1);
  } finally {
    try {
      await pgClient.end();
      await mongoose.disconnect();
      console.log('🔌 資料庫連線已關閉');
    } catch (closeError) {
      console.error('⚠️ 關閉資料庫連線時發生錯誤:', closeError.message);
    }
  }
}

seed();
