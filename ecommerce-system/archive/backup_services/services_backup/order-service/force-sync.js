const { sequelize, Order, OrderItem } = require('./src/models');

async function forceSync() {
  try {
    console.log('🔄 強制同步資料庫...');
    
    // 強制同步，會刪除現有表並重新創建
    await sequelize.sync({ force: true });
    
    console.log('✅ 資料庫強制同步完成');
    console.log('📋 檢查 Order 模型屬性:');
    console.log(Object.keys(Order.rawAttributes));
    
  } catch (error) {
    console.error('❌ 強制同步失敗:', error);
  } finally {
    await sequelize.close();
  }
}

forceSync();

