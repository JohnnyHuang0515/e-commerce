const { Role, Permission, RolePermission } = require('../models');
const { Op } = require('sequelize');

// 獲取權限列表
const getPermissions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      resource = ''
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {};

    // 搜尋條件
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // 資源篩選
    if (resource) {
      whereClause.resource = resource;
    }

    const { count, rows: permissions } = await Permission.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        permissions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('獲取權限列表錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取權限列表時發生錯誤'
    });
  }
};

// 獲取角色列表
const getRoles = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = ''
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {};

    // 搜尋條件
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows: roles } = await Role.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Permission,
          as: 'permissions',
          through: { attributes: [] }
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        roles: roles.map(role => ({
          id: role.id,
          name: role.name,
          description: role.description,
          is_system: role.is_system,
          status: role.status,
          permissions: role.permissions.map(p => ({
            id: p.id,
            name: p.name,
            resource: p.resource,
            action: p.action
          })),
          created_at: role.created_at,
          updated_at: role.updated_at
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('獲取角色列表錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取角色列表時發生錯誤'
    });
  }
};

// 獲取角色詳情
const getRoleById = async (req, res) => {
  try {
    const { roleId } = req.params;

    const role = await Role.findByPk(roleId, {
      include: [
        {
          model: Permission,
          as: 'permissions',
          through: { attributes: [] }
        }
      ]
    });

    if (!role) {
      return res.status(404).json({
        success: false,
        message: '角色不存在'
      });
    }

    res.json({
      success: true,
      data: {
        id: role.id,
        name: role.name,
        description: role.description,
        is_system: role.is_system,
        status: role.status,
        permissions: role.permissions.map(p => ({
          id: p.id,
          name: p.name,
          resource: p.resource,
          action: p.action,
          module: p.module
        })),
        created_at: role.created_at,
        updated_at: role.updated_at
      }
    });
  } catch (error) {
    console.error('獲取角色詳情錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取角色詳情時發生錯誤'
    });
  }
};

// 創建新角色
const createRole = async (req, res) => {
  try {
    const { name, description, permissions = [] } = req.body;

    // 檢查角色是否已存在
    const existingRole = await Role.findOne({ where: { name } });
    if (existingRole) {
      return res.status(409).json({
        success: false,
        message: '角色名稱已存在'
      });
    }

    // 創建角色
    const role = await Role.create({
      name,
      description,
      is_system: false,
      status: 'active'
    });

    // 分配權限
    if (permissions.length > 0) {
      const permissionRecords = permissions.map(permissionId => ({
        role_id: role.id,
        permission_id: permissionId,
        granted_by: req.user.id
      }));

      await RolePermission.bulkCreate(permissionRecords);
    }

    // 獲取完整的角色資料
    const roleWithPermissions = await Role.findByPk(role.id, {
      include: [
        {
          model: Permission,
          as: 'permissions',
          through: { attributes: [] }
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: '角色創建成功',
      data: {
        id: role.id,
        name: role.name,
        description: role.description,
        permissions: roleWithPermissions.permissions.map(p => ({
          id: p.id,
          name: p.name,
          resource: p.resource,
          action: p.action
        })),
        created_at: role.created_at
      }
    });
  } catch (error) {
    console.error('創建角色錯誤:', error);
    res.status(500).json({
      success: false,
      message: '創建角色時發生錯誤'
    });
  }
};

// 更新角色
const updateRole = async (req, res) => {
  try {
    const { roleId } = req.params;
    const { name, description } = req.body;

    const role = await Role.findByPk(roleId);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: '角色不存在'
      });
    }

    // 系統角色不能修改名稱
    if (role.is_system && name && name !== role.name) {
      return res.status(400).json({
        success: false,
        message: '系統角色不能修改名稱'
      });
    }

    // 檢查名稱是否被其他角色使用
    if (name && name !== role.name) {
      const existingRole = await Role.findOne({ 
        where: { 
          name, 
          id: { [Op.ne]: roleId } 
        } 
      });
      if (existingRole) {
        return res.status(409).json({
          success: false,
          message: '角色名稱已被使用'
        });
      }
    }

    // 更新角色
    await role.update({
      ...(name && { name }),
      ...(description && { description })
    });

    res.json({
      success: true,
      message: '角色更新成功',
      data: {
        id: role.id,
        name: role.name,
        description: role.description,
        updated_at: role.updated_at
      }
    });
  } catch (error) {
    console.error('更新角色錯誤:', error);
    res.status(500).json({
      success: false,
      message: '更新角色時發生錯誤'
    });
  }
};

// 刪除角色
const deleteRole = async (req, res) => {
  try {
    const { roleId } = req.params;

    const role = await Role.findByPk(roleId);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: '角色不存在'
      });
    }

    // 系統角色不能刪除
    if (role.is_system) {
      return res.status(400).json({
        success: false,
        message: '系統角色不能刪除'
      });
    }

    // 檢查是否有用戶使用此角色
    const userCount = await User.count({ where: { role_id: roleId } });
    if (userCount > 0) {
      return res.status(400).json({
        success: false,
        message: `有 ${userCount} 個用戶正在使用此角色，無法刪除`
      });
    }

    await role.destroy();

    res.json({
      success: true,
      message: '角色刪除成功'
    });
  } catch (error) {
    console.error('刪除角色錯誤:', error);
    res.status(500).json({
      success: false,
      message: '刪除角色時發生錯誤'
    });
  }
};

// 更新角色權限
const updateRolePermissions = async (req, res) => {
  try {
    const { roleId } = req.params;
    const { permissions } = req.body;

    const role = await Role.findByPk(roleId);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: '角色不存在'
      });
    }

    // 刪除現有權限
    await RolePermission.destroy({
      where: { role_id: roleId }
    });

    // 添加新權限
    if (permissions && permissions.length > 0) {
      const permissionRecords = permissions.map(permissionId => ({
        role_id: roleId,
        permission_id: permissionId,
        granted_by: req.user.id
      }));

      await RolePermission.bulkCreate(permissionRecords);
    }

    // 獲取更新後的角色資料
    const roleWithPermissions = await Role.findByPk(roleId, {
      include: [
        {
          model: Permission,
          as: 'permissions',
          through: { attributes: [] }
        }
      ]
    });

    res.json({
      success: true,
      message: '角色權限更新成功',
      data: {
        id: role.id,
        name: role.name,
        permissions: roleWithPermissions.permissions.map(p => ({
          id: p.id,
          name: p.name,
          resource: p.resource,
          action: p.action
        }))
      }
    });
  } catch (error) {
    console.error('更新角色權限錯誤:', error);
    res.status(500).json({
      success: false,
      message: '更新角色權限時發生錯誤'
    });
  }
};

// 檢查用戶權限
const checkPermission = async (req, res) => {
  try {
    const { resource, action } = req.body;
    const user = req.user;

    // 管理員擁有所有權限
    if (user.role === 'admin') {
      return res.json({
        success: true,
        data: {
          hasPermission: true,
          reason: 'admin_role'
        }
      });
    }

    // 檢查用戶是否有特定權限
    const hasPermission = user.permissions.some(permission => 
      permission.resource === resource && permission.action === action
    );

    res.json({
      success: true,
      data: {
        hasPermission,
        reason: hasPermission ? 'user_permission' : 'insufficient_permission'
      }
    });
  } catch (error) {
    console.error('檢查權限錯誤:', error);
    res.status(500).json({
      success: false,
      message: '檢查權限時發生錯誤'
    });
  }
};

module.exports = {
  getPermissions,
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  updateRolePermissions,
  checkPermission
};
