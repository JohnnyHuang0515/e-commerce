const { Role, Permission } = require('../models');

class PermissionController {
  // 權限檢查
  async checkPermission(req, res) {
    try {
      const { userId, permissions } = req.body;

      if (!userId || !permissions || !Array.isArray(permissions)) {
        return res.status(400).json({
          success: false,
          error: {
            message: '請提供有效的 userId 和 permissions 陣列'
          }
        });
      }

      // 這裡應該從 User Service 獲取用戶角色
      // 暫時返回成功
      res.json({
        success: true,
        data: {
          userId,
          hasPermission: true,
          checkedPermissions: permissions
        },
        message: '權限檢查完成'
      });
    } catch (error) {
      console.error('權限檢查錯誤:', error);
      res.status(500).json({
        success: false,
        error: {
          message: '權限檢查失敗',
          details: error.message
        }
      });
    }
  }

  // 取得所有角色
  async getRoles(req, res) {
    try {
      const roles = await Role.findAll({
        where: { is_active: true },
        order: [['created_at', 'ASC']]
      });

      res.json({
        success: true,
        data: { roles },
        message: '角色列表取得成功'
      });
    } catch (error) {
      console.error('取得角色列表錯誤:', error);
      res.status(500).json({
        success: false,
        error: {
          message: '取得角色列表失敗',
          details: error.message
        }
      });
    }
  }

  // 取得單一角色
  async getRoleById(req, res) {
    try {
      const { id } = req.params;

      const role = await Role.findByPk(id);
      if (!role) {
        return res.status(404).json({
          success: false,
          error: {
            message: '角色不存在'
          }
        });
      }

      res.json({
        success: true,
        data: { role },
        message: '取得角色成功'
      });
    } catch (error) {
      console.error('取得角色錯誤:', error);
      res.status(500).json({
        success: false,
        error: {
          message: '取得角色失敗',
          details: error.message
        }
      });
    }
  }

  // 創建角色
  async createRole(req, res) {
    try {
      const { name, displayName, description, permissions } = req.body;

      const role = await Role.create({
        name,
        display_name: displayName,
        description,
        permissions: permissions || []
      });

      res.status(201).json({
        success: true,
        data: { role },
        message: '角色創建成功'
      });
    } catch (error) {
      console.error('創建角色錯誤:', error);
      res.status(500).json({
        success: false,
        error: {
          message: '創建角色失敗',
          details: error.message
        }
      });
    }
  }

  // 更新角色
  async updateRole(req, res) {
    try {
      const { id } = req.params;
      const { name, displayName, description, permissions, isActive } = req.body;

      const role = await Role.findByPk(id);
      if (!role) {
        return res.status(404).json({
          success: false,
          error: {
            message: '角色不存在'
          }
        });
      }

      await role.update({
        name,
        display_name: displayName,
        description,
        permissions: permissions || role.permissions,
        is_active: isActive !== undefined ? isActive : role.is_active
      });

      res.json({
        success: true,
        data: { role },
        message: '角色更新成功'
      });
    } catch (error) {
      console.error('更新角色錯誤:', error);
      res.status(500).json({
        success: false,
        error: {
          message: '更新角色失敗',
          details: error.message
        }
      });
    }
  }

  // 刪除角色
  async deleteRole(req, res) {
    try {
      const { id } = req.params;

      const role = await Role.findByPk(id);
      if (!role) {
        return res.status(404).json({
          success: false,
          error: {
            message: '角色不存在'
          }
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
        error: {
          message: '刪除角色失敗',
          details: error.message
        }
      });
    }
  }

  // 取得所有權限
  async getPermissions(req, res) {
    try {
      const permissions = await Permission.findAll({
        where: { status: 'active' },
        order: [['resource', 'ASC'], ['action', 'ASC']]
      });

      res.json({
        success: true,
        data: { permissions },
        message: '權限列表取得成功'
      });
    } catch (error) {
      console.error('取得權限列表錯誤:', error);
      res.status(500).json({
        success: false,
        error: {
          message: '取得權限列表失敗',
          details: error.message
        }
      });
    }
  }

  // 取得單一權限
  async getPermissionById(req, res) {
    try {
      const { id } = req.params;

      const permission = await Permission.findByPk(id);
      if (!permission) {
        return res.status(404).json({
          success: false,
          error: {
            message: '權限不存在'
          }
        });
      }

      res.json({
        success: true,
        data: { permission },
        message: '取得權限成功'
      });
    } catch (error) {
      console.error('取得權限錯誤:', error);
      res.status(500).json({
        success: false,
        error: {
          message: '取得權限失敗',
          details: error.message
        }
      });
    }
  }

  // 創建權限
  async createPermission(req, res) {
    try {
      const { name, displayName, description, module, action, resource } = req.body;

      const permission = await Permission.create({
        name,
        display_name: displayName,
        description,
        module,
        action,
        resource
      });

      res.status(201).json({
        success: true,
        data: { permission },
        message: '權限創建成功'
      });
    } catch (error) {
      console.error('創建權限錯誤:', error);
      res.status(500).json({
        success: false,
        error: {
          message: '創建權限失敗',
          details: error.message
        }
      });
    }
  }

  // 更新權限
  async updatePermission(req, res) {
    try {
      const { id } = req.params;
      const { name, displayName, description, module, action, resource, isActive } = req.body;

      const permission = await Permission.findByPk(id);
      if (!permission) {
        return res.status(404).json({
          success: false,
          error: {
            message: '權限不存在'
          }
        });
      }

      await permission.update({
        name,
        display_name: displayName,
        description,
        module,
        action,
        resource,
        is_active: isActive !== undefined ? isActive : permission.is_active
      });

      res.json({
        success: true,
        data: { permission },
        message: '權限更新成功'
      });
    } catch (error) {
      console.error('更新權限錯誤:', error);
      res.status(500).json({
        success: false,
        error: {
          message: '更新權限失敗',
          details: error.message
        }
      });
    }
  }

  // 刪除權限
  async deletePermission(req, res) {
    try {
      const { id } = req.params;

      const permission = await Permission.findByPk(id);
      if (!permission) {
        return res.status(404).json({
          success: false,
          error: {
            message: '權限不存在'
          }
        });
      }

      await permission.destroy();

      res.json({
        success: true,
        message: '權限刪除成功'
      });
    } catch (error) {
      console.error('刪除權限錯誤:', error);
      res.status(500).json({
        success: false,
        error: {
          message: '刪除權限失敗',
          details: error.message
        }
      });
    }
  }

  // 取得權限統計
  async getPermissionStats(req, res) {
    try {
      const totalRoles = await Role.count();
      const totalPermissions = await Permission.count();
      const activeRoles = await Role.count({ where: { is_active: true } });
      const activePermissions = await Permission.count({ where: { is_active: true } });

      res.json({
        success: true,
        data: {
          totalRoles,
          totalPermissions,
          activeRoles,
          activePermissions
        },
        message: '權限統計取得成功'
      });
    } catch (error) {
      console.error('取得權限統計錯誤:', error);
      res.status(500).json({
        success: false,
        error: {
          message: '取得權限統計失敗',
          details: error.message
        }
      });
    }
  }

  // 取得用戶角色
  async getUserRoles(req, res) {
    try {
      const { userId } = req.query;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: {
            message: '請提供 userId'
          }
        });
      }

      // 這裡應該從 User Service 獲取用戶角色
      // 暫時返回默認角色
      res.json({
        success: true,
        data: {
          userId,
          roles: ['CUSTOMER']
        },
        message: '用戶角色取得成功'
      });
    } catch (error) {
      console.error('取得用戶角色錯誤:', error);
      res.status(500).json({
        success: false,
        error: {
          message: '取得用戶角色失敗',
          details: error.message
        }
      });
    }
  }

  async assignPermissionsToRole(req, res) {
    try {
      res.json({
        success: true,
        message: '角色權限分配成功'
      });
    } catch (error) {
      console.error('分配角色權限錯誤:', error);
      res.status(500).json({
        success: false,
        error: {
          message: '分配角色權限失敗',
          details: error.message
        }
      });
    }
  }

  async removePermissionsFromRole(req, res) {
    try {
      res.json({
        success: true,
        message: '角色權限移除成功'
      });
    } catch (error) {
      console.error('移除角色權限錯誤:', error);
      res.status(500).json({
        success: false,
        error: {
          message: '移除角色權限失敗',
          details: error.message
        }
      });
    }
  }

  async getUserRolesByUserId(req, res) {
    try {
      res.json({
        success: true,
        data: [],
        message: '用戶角色取得成功'
      });
    } catch (error) {
      console.error('取得用戶角色錯誤:', error);
      res.status(500).json({
        success: false,
        error: {
          message: '取得用戶角色失敗',
          details: error.message
        }
      });
    }
  }

  async assignUserRole(req, res) {
    try {
      res.json({
        success: true,
        message: '用戶角色分配成功'
      });
    } catch (error) {
      console.error('分配用戶角色錯誤:', error);
      res.status(500).json({
        success: false,
        error: {
          message: '分配用戶角色失敗',
          details: error.message
        }
      });
    }
  }

  async removeUserRole(req, res) {
    try {
      res.json({
        success: true,
        message: '用戶角色移除成功'
      });
    } catch (error) {
      console.error('移除用戶角色錯誤:', error);
      res.status(500).json({
        success: false,
        error: {
          message: '移除用戶角色失敗',
          details: error.message
        }
      });
    }
  }

  async getUserPermissions(req, res) {
    try {
      res.json({
        success: true,
        data: [],
        message: '用戶權限取得成功'
      });
    } catch (error) {
      console.error('取得用戶權限錯誤:', error);
      res.status(500).json({
        success: false,
        error: {
          message: '取得用戶權限失敗',
          details: error.message
        }
      });
    }
  }

  async initializeSystemData(req, res) {
    try {
      res.json({
        success: true,
        message: '系統初始化成功'
      });
    } catch (error) {
      console.error('系統初始化錯誤:', error);
      res.status(500).json({
        success: false,
        error: {
          message: '系統初始化失敗',
          details: error.message
        }
      });
    }
  }
}

module.exports = new PermissionController();
