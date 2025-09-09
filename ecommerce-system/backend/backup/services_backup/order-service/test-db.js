const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('ecommerce_transactions', 'admin', 'password123', {
  host: 'localhost',
  port: 5432,
  dialect: 'postgres',
  logging: console.log
});

async function testDB() {
  try {
    await sequelize.authenticate();
    console.log('✅ 連線成功');
    
    // 檢查 orders 表是否存在
    const [results] = await sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'orders' 
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Orders 表結構:');
    results.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type}`);
    });
    
    // 檢查 order_items 表是否存在
    const [itemResults] = await sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'order_items' 
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Order Items 表結構:');
    itemResults.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type}`);
    });
    
  } catch (error) {
    console.error('❌ 錯誤:', error.message);
  } finally {
    await sequelize.close();
  }
}

testDB();

