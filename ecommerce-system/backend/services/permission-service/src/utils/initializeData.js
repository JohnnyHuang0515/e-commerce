const Permission = require('../models/Permission');
const Role = require('../models/Role');
const UserRole = require('../models/UserRole');

/**
 * 初始化系統默認權限
 */
async function initializePermissions() {
  try {
    const defaultPermissions = [
      // 用戶管理權限
      { name: 'users:read', description: '查看用戶', module: 'users', action: 'read', category: '用戶管理' },
      { name: 'users:write', description: '編輯用戶', module: 'users', action: 'write', category: '用戶管理' },
      { name: 'users:delete', description: '刪除用戶', module: 'users', action: 'delete', category: '用戶管理' },
      { name: 'users:manage', description: '管理用戶', module: 'users', action: 'manage', category: '用戶管理' },

      // 商品管理權限
      { name: 'products:read', description: '查看商品', module: 'products', action: 'read', category: '商品管理' },
      { name: 'products:write', description: '編輯商品', module: 'products', action: 'write', category: '商品管理' },
      { name: 'products:delete', description: '刪除商品', module: 'products', action: 'delete', category: '商品管理' },
      { name: 'products:manage', description: '管理商品', module: 'products', action: 'manage', category: '商品管理' },

      // 訂單管理權限
      { name: 'orders:read', description: '查看訂單', module: 'orders', action: 'read', category: '訂單管理' },
      { name: 'orders:write', description: '編輯訂單', module: 'orders', action: 'write', category: '訂單管理' },
      { name: 'orders:delete', description: '刪除訂單', module: 'orders', action: 'delete', category: '訂單管理' },
      { name: 'orders:manage', description: '管理訂單', module: 'orders', action: 'manage', category: '訂單管理' },

      // 數據分析權限
      { name: 'analytics:read', description: '查看分析', module: 'analytics', action: 'read', category: '數據分析' },
      { name: 'analytics:write', description: '編輯分析', module: 'analytics', action: 'write', category: '數據分析' },
      { name: 'analytics:manage', description: '管理分析', module: 'analytics', action: 'manage', category: '數據分析' },

      // 系統設定權限
      { name: 'settings:read', description: '查看設定', module: 'settings', action: 'read', category: '系統設定' },
      { name: 'settings:write', description: '編輯設定', module: 'settings', action: 'write', category: '系統設定' },
      { name: 'settings:manage', description: '管理設定', module: 'settings', action: 'manage', category: '系統設定' },

      // 權限管理權限
      { name: 'permissions:read', description: '查看權限', module: 'permissions', action: 'read', category: '權限管理' },
      { name: 'permissions:write', description: '編輯權限', module: 'permissions', action: 'write', category: '權限管理' },
      { name: 'permissions:manage', description: '管理權限', module: 'permissions', action: 'manage', category: '權限管理' },

      // 管理員權限
      { name: 'admin:*', description: '超級管理員', module: 'admin', action: '*', category: '系統管理' },
    ];

    for (const permissionData of defaultPermissions) {
      await Permission.findOneAndUpdate(
        { name: permissionData.name },
        permissionData,
        { upsert: true, new: true }
      );
    }

    console.log('✅ 默認權限初始化完成');
    return true;
  } catch (error) {
    console.error('❌ 權限初始化失敗:', error);
    return false;
  }
}

/**
 * 初始化系統默認角色
 */
async function initializeRoles() {
  try {
    // 獲取已創建的權限
    const permissions = await Permission.find({ isActive: true });
    const permissionMap = {};
    permissions.forEach(p => {
      permissionMap[p.name] = p._id;
    });

    const defaultRoles = [
      {
        name: 'admin',
        description: '系統管理員',
        permissions: [permissionMap['admin:*']].filter(Boolean),
      },
      {
        name: 'manager',
        description: '管理員',
        permissions: [
          permissionMap['users:read'], permissionMap['users:write'], permissionMap['users:manage'],
          permissionMap['products:read'], permissionMap['products:write'], permissionMap['products:manage'],
          permissionMap['orders:read'], permissionMap['orders:write'], permissionMap['orders:manage'],
          permissionMap['analytics:read'], permissionMap['analytics:manage'],
          permissionMap['settings:read'], permissionMap['settings:write'],
        ].filter(Boolean),
      },
      {
        name: 'staff',
        description: '員工',
        permissions: [
          permissionMap['products:read'], permissionMap['products:write'],
          permissionMap['orders:read'], permissionMap['orders:write'],
          permissionMap['analytics:read'],
        ].filter(Boolean),
      },
      {
        name: 'customer',
        description: '客戶',
        permissions: [
          permissionMap['products:read'],
          permissionMap['orders:read'],
        ].filter(Boolean),
      },
    ];

    for (const roleData of defaultRoles) {
      await Role.findOneAndUpdate(
        { name: roleData.name },
        roleData,
        { upsert: true, new: true }
      );
    }

    console.log('✅ 默認角色初始化完成');
    return true;
  } catch (error) {
    console.error('❌ 角色初始化失敗:', error);
    return false;
  }
}

/**
 * 初始化系統數據
 */
async function initializeSystemData() {
  try {
    console.log('🚀 開始初始化系統數據...');
    
    const permissionResult = await initializePermissions();
    const roleResult = await initializeRoles();
    
    if (permissionResult && roleResult) {
      console.log('✅ 系統數據初始化完成');
      return true;
    } else {
      console.log('⚠️ 系統數據初始化部分失敗');
      return false;
    }
  } catch (error) {
    console.error('❌ 系統數據初始化失敗:', error);
    return false;
  }
}

module.exports = {
  initializePermissions,
  initializeRoles,
  initializeSystemData
};
