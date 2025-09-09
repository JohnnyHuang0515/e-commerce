const { User, UserProfile, Role, Permission } = require('../models');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');

// 獲取用戶列表
const getUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      role = '',
      status = ''
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {};

    // 搜尋條件
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // 角色篩選
    if (role) {
      whereClause.role = role;
    }

    // 狀態篩選
    if (status) {
      whereClause.status = status;
    }

    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: UserProfile,
          as: 'profile',
          required: false
        },
        {
          model: Role,
          as: 'userRole',
          include: [
            {
              model: Permission,
              as: 'permissions'
            }
          ],
          required: false
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        users: users.map(user => ({
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.userRole?.name || user.role,
          status: user.status,
          last_login_at: user.last_login_at,
          created_at: user.created_at,
          updated_at: user.updated_at,
          profile: user.profile
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
    console.error('獲取用戶列表錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取用戶列表時發生錯誤'
    });
  }
};

// 獲取用戶概覽統計
const getUserOverview = async (req, res) => {
  try {
    const totalUsers = await User.count();
    const activeUsers = await User.count({ where: { status: 'active' } });
    const inactiveUsers = await User.count({ where: { status: 'inactive' } });
    const suspendedUsers = await User.count({ where: { status: 'suspended' } });

    // 按角色統計
    const roleStats = await User.findAll({
      attributes: [
        'role',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['role'],
      raw: true
    });

    // 最近註冊的用戶
    const recentUsers = await User.findAll({
      attributes: ['id', 'name', 'email', 'created_at'],
      order: [['created_at', 'DESC']],
      limit: 5
    });

    res.json({
      success: true,
      data: {
        total: totalUsers,
        active: activeUsers,
        inactive: inactiveUsers,
        suspended: suspendedUsers,
        roleStats: roleStats.reduce((acc, item) => {
          acc[item.role] = parseInt(item.count);
          return acc;
        }, {}),
        recentUsers
      }
    });
  } catch (error) {
    console.error('獲取用戶概覽錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取用戶概覽時發生錯誤'
    });
  }
};

// 獲取用戶詳情
const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByPk(userId, {
      include: [
        {
          model: UserProfile,
          as: 'profile',
          required: false
        },
        {
          model: Role,
          as: 'userRole',
          include: [
            {
              model: Permission,
              as: 'permissions'
            }
          ],
          required: false
        }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用戶不存在'
      });
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role?.name || user.role,
        status: user.status,
        last_login_at: user.last_login_at,
        email_verified_at: user.email_verified_at,
        created_at: user.created_at,
        updated_at: user.updated_at,
        profile: user.profile,
        permissions: user.userRole?.permissions?.map(p => p.name) || []
      }
    });
  } catch (error) {
    console.error('獲取用戶詳情錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取用戶詳情時發生錯誤'
    });
  }
};

// 創建新用戶
const createUser = async (req, res) => {
  try {
    const { email, password, name, role = 'user', status = 'active' } = req.body;

    // 檢查用戶是否已存在
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: '該郵箱已被註冊'
      });
    }

    // 加密密碼
    const hashedPassword = await bcrypt.hash(password, 12);

    // 創建用戶
    const user = await User.create({
      email,
      password: hashedPassword,
      name,
      role,
      status
    });

    // 獲取用戶角色和權限
    const userWithRole = await User.findByPk(user.id, {
      include: [
        {
          model: Role,
          as: 'userRole',
          include: [
            {
              model: Permission,
              as: 'permissions'
            }
          ],
          required: false
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: '用戶創建成功',
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: userWithRole.role?.name || user.role,
        status: user.status,
        created_at: user.created_at
      }
    });
  } catch (error) {
    console.error('創建用戶錯誤:', error);
    res.status(500).json({
      success: false,
      message: '創建用戶時發生錯誤'
    });
  }
};

// 更新用戶資料
const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, email, role, status } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用戶不存在'
      });
    }

    // 檢查郵箱是否被其他用戶使用
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ 
        where: { 
          email, 
          id: { [Op.ne]: userId } 
        } 
      });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: '該郵箱已被其他用戶使用'
        });
      }
    }

    // 更新用戶資料
    await user.update({
      ...(name && { name }),
      ...(email && { email }),
      ...(role && { role }),
      ...(status && { status })
    });

    res.json({
      success: true,
      message: '用戶資料更新成功',
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        updated_at: user.updated_at
      }
    });
  } catch (error) {
    console.error('更新用戶錯誤:', error);
    res.status(500).json({
      success: false,
      message: '更新用戶時發生錯誤'
    });
  }
};

// 刪除用戶
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用戶不存在'
      });
    }

    // 不能刪除自己
    if (user.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: '不能刪除自己的帳號'
      });
    }

    await user.destroy();

    res.json({
      success: true,
      message: '用戶刪除成功'
    });
  } catch (error) {
    console.error('刪除用戶錯誤:', error);
    res.status(500).json({
      success: false,
      message: '刪除用戶時發生錯誤'
    });
  }
};

// 更新用戶角色
const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用戶不存在'
      });
    }

    await user.update({ role });

    res.json({
      success: true,
      message: '用戶角色更新成功',
      data: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('更新用戶角色錯誤:', error);
    res.status(500).json({
      success: false,
      message: '更新用戶角色時發生錯誤'
    });
  }
};

// 獲取用戶統計分析
const getUserAnalytics = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用戶不存在'
      });
    }

    // 這裡可以添加更多統計邏輯
    // 例如：登入次數、活動記錄等

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status,
          last_login_at: user.last_login_at,
          created_at: user.created_at
        },
        analytics: {
          // 可以添加更多統計數據
          total_logins: 0,
          last_activity: user.last_login_at
        }
      }
    });
  } catch (error) {
    console.error('獲取用戶統計錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取用戶統計時發生錯誤'
    });
  }
};

// 獲取用戶統計資料
const getUserStats = async (req, res) => {
  try {
    // 基本統計
    const totalUsers = await User.count();
    const activeUsers = await User.count({ where: { status: 'active' } });
    const vipUsers = await User.count({ where: { role: 'vip' } });
    const adminUsers = await User.count({ where: { role: 'admin' } });
    
    // 最近註冊的用戶
    const recentUsers = await User.findAll({
      attributes: ['id', 'name', 'email', 'role', 'status', 'created_at'],
      order: [['created_at', 'DESC']],
      limit: 5
    });

    res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        vipUsers,
        adminUsers,
        inactiveUsers: totalUsers - activeUsers,
        recentUsers: recentUsers.map(user => ({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          createdAt: user.created_at
        }))
      },
      message: '用戶統計資料取得成功'
    });
  } catch (error) {
    console.error('取得用戶統計資料錯誤:', error);
    res.status(500).json({
      success: false,
      error: {
        message: '取得用戶統計資料失敗',
        details: error.message
      }
    });
  }
};

module.exports = {
  getUsers,
  getUserOverview,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateUserRole,
  getUserAnalytics,
  getUserStats
};
