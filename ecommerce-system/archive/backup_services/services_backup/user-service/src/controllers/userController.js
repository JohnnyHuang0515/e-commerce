const { User, UserProfile, sequelize } = require('../models');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');

class UserController {
  // 取得用戶列表
  async getUsers(req, res) {
    try {
      const { page = 1, limit = 10, search, membership_level, is_active, sortBy = 'created_at', sortOrder = 'DESC' } = req.query;
      
      // 建立查詢條件
      const where = {};
      if (search) {
        where[Op.or] = [
          { username: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } },
          { first_name: { [Op.iLike]: `%${search}%` } },
          { last_name: { [Op.iLike]: `%${search}%` } }
        ];
      }
      if (membership_level) where.membership_level = membership_level;
      if (is_active !== undefined) where.is_active = is_active === 'true';

      // 計算分頁
      const offset = (page - 1) * limit;
      
      // 處理排序欄位名稱映射
      const sortFieldMap = {
        'createdAt': 'created_at',
        'updatedAt': 'updated_at',
        'username': 'username',
        'email': 'email',
        'role': 'membership_level',
        'status': 'is_active'
      };
      const dbSortBy = sortFieldMap[sortBy] || sortBy;
      
      // 執行查詢
      const { count, rows: users } = await User.findAndCountAll({
        where,
        include: [{
          model: UserProfile,
          as: 'profile',
          required: false
        }],
        order: [[dbSortBy, sortOrder.toUpperCase()]],
        offset: parseInt(offset),
        limit: parseInt(limit),
        attributes: { exclude: ['password_hash'] }
      });

      res.json({
        success: true,
        data: {
          users,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            pages: Math.ceil(count / limit)
          }
        },
        message: '用戶列表取得成功'
      });
    } catch (error) {
      console.error('取得用戶列表錯誤:', error);
      res.status(500).json({
        success: false,
        error: {
          message: '取得用戶列表失敗',
          details: error.message
        }
      });
    }
  }

  // 取得單一用戶
  async getUserById(req, res) {
    try {
      const { id } = req.params;
      
      const user = await User.findByPk(id, {
        include: [{
          model: UserProfile,
          as: 'profile',
          required: false
        }],
        attributes: { exclude: ['password_hash'] }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: {
            message: '用戶不存在'
          }
        });
      }

      res.json({
        success: true,
        data: { user },
        message: '取得用戶成功'
      });
    } catch (error) {
      console.error('取得用戶錯誤:', error);
      res.status(500).json({
        success: false,
        error: {
          message: '取得用戶失敗',
          details: error.message
        }
      });
    }
  }

  // 創建用戶
  async createUser(req, res) {
    try {
      const { username, email, password, phone, first_name, last_name, membership_level = 'BRONZE' } = req.body;

      // 檢查用戶是否已存在
      const existingUser = await User.findOne({
        where: {
          [Op.or]: [
            { email: email.toLowerCase() },
            { username }
          ]
        }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: {
            message: '用戶已存在',
            details: existingUser.email === email.toLowerCase() ? '電子郵件已被使用' : '用戶名已被使用'
          }
        });
      }

      // 加密密碼
      const password_hash = await bcrypt.hash(password, 12);

      // 創建用戶
      const user = await User.create({
        username,
        email: email.toLowerCase(),
        password_hash,
        phone,
        first_name,
        last_name,
        membership_level
      });

      // 創建用戶資料
      await UserProfile.create({
        user_id: user.id,
        preferences: {
          language: 'zh-TW',
          currency: 'TWD',
          timezone: 'Asia/Taipei',
          notifications: {
            email: true,
            sms: false,
            push: true
          }
        }
      });

      // 重新查詢包含資料的用戶
      const userWithProfile = await User.findByPk(user.id, {
        include: [{
          model: UserProfile,
          as: 'profile',
          required: false
        }],
        attributes: { exclude: ['password_hash'] }
      });

      res.status(201).json({
        success: true,
        data: { user: userWithProfile },
        message: '用戶創建成功'
      });
    } catch (error) {
      console.error('創建用戶錯誤:', error);
      res.status(500).json({
        success: false,
        error: {
          message: '創建用戶失敗',
          details: error.message
        }
      });
    }
  }

  // 更新用戶
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { username, email, phone, first_name, last_name, membership_level, is_active } = req.body;

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: {
            message: '用戶不存在'
          }
        });
      }

      // 檢查電子郵件是否被其他用戶使用
      if (email && email !== user.email) {
        const existingUser = await User.findOne({
          where: {
            email: email.toLowerCase(),
            id: { [Op.ne]: id }
          }
        });
        if (existingUser) {
          return res.status(400).json({
            success: false,
            error: {
              message: '電子郵件已被其他用戶使用'
            }
          });
        }
      }

      // 更新用戶
      await user.update({
        username: username || user.username,
        email: email ? email.toLowerCase() : user.email,
        phone: phone || user.phone,
        first_name: first_name || user.first_name,
        last_name: last_name || user.last_name,
        membership_level: membership_level || user.membership_level,
        is_active: is_active !== undefined ? is_active : user.is_active
      });

      // 重新查詢用戶
      const updatedUser = await User.findByPk(id, {
        include: [{
          model: UserProfile,
          as: 'profile',
          required: false
        }],
        attributes: { exclude: ['password_hash'] }
      });

      res.json({
        success: true,
        data: { user: updatedUser },
        message: '用戶更新成功'
      });
    } catch (error) {
      console.error('更新用戶錯誤:', error);
      res.status(500).json({
        success: false,
        error: {
          message: '更新用戶失敗',
          details: error.message
        }
      });
    }
  }

  // 刪除用戶
  async deleteUser(req, res) {
    try {
      const { id } = req.params;

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: {
            message: '用戶不存在'
          }
        });
      }

      // 軟刪除：設置為非活躍狀態
      await user.update({ is_active: false });

      res.json({
        success: true,
        message: '用戶刪除成功'
      });
    } catch (error) {
      console.error('刪除用戶錯誤:', error);
      res.status(500).json({
        success: false,
        error: {
          message: '刪除用戶失敗',
          details: error.message
        }
      });
    }
  }

  // 用戶登入
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // 查找用戶
      const user = await User.findOne({
        where: { email: email.toLowerCase() },
        include: [{
          model: UserProfile,
          as: 'profile',
          required: false
        }]
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          error: {
            message: '無效的登入憑證'
          }
        });
      }

      // 檢查密碼
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          error: {
            message: '無效的登入憑證'
          }
        });
      }

      // 檢查用戶狀態
      if (!user.is_active) {
        return res.status(401).json({
          success: false,
          error: {
            message: '帳戶已被停用'
          }
        });
      }

      // 更新最後登入時間
      await user.updateLastLogin();

      // 返回用戶資訊（不包含密碼）
      const userData = user.toJSON();
      delete userData.password_hash;

      res.json({
        success: true,
        data: { user: userData },
        message: '登入成功'
      });
    } catch (error) {
      console.error('登入錯誤:', error);
      res.status(500).json({
        success: false,
        error: {
          message: '登入失敗',
          details: error.message
        }
      });
    }
  }

  // 取得用戶概覽統計
  async getUsersOverview(req, res) {
    try {
      const totalUsers = await User.count();
      const activeUsers = await User.count({ where: { is_active: true } });
      
      const membershipStats = await User.findAll({
        attributes: [
          'membership_level',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['membership_level'],
        raw: true
      });

      const recentUsers = await User.findAll({
        where: { is_active: true },
        order: [['created_at', 'DESC']],
        limit: 5,
        attributes: ['id', 'username', 'email', 'created_at']
      });

      res.json({
        success: true,
        data: {
          totalUsers,
          activeUsers,
          membershipStats,
          recentUsers
        },
        message: '用戶概覽統計取得成功'
      });
    } catch (error) {
      console.error('取得用戶概覽統計錯誤:', error);
      res.status(500).json({
        success: false,
        error: {
          message: '取得用戶概覽統計失敗',
          details: error.message
        }
      });
    }
  }

  // 更新用戶角色
  async updateUserRole(req, res) {
    try {
      const { id } = req.params;
      const { membership_level } = req.body;

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: {
            message: '用戶不存在'
          }
        });
      }

      await user.update({ membership_level });

      const updatedUser = await User.findByPk(id, {
        include: [{
          model: UserProfile,
          as: 'profile',
          required: false
        }],
        attributes: { exclude: ['password_hash'] }
      });

      res.json({
        success: true,
        data: { user: updatedUser },
        message: '用戶角色更新成功'
      });
    } catch (error) {
      console.error('更新用戶角色錯誤:', error);
      res.status(500).json({
        success: false,
        error: {
          message: '更新用戶角色失敗',
          details: error.message
        }
      });
    }
  }

  // 取得用戶統計資料
  async getUserStats(req, res) {
    try {
      // 基本統計
      const totalUsers = await User.count();
      const activeUsers = await User.count({ where: { is_active: true } });
      const vipUsers = await User.count({ where: { membership_level: 'VIP' } });
      const adminUsers = await User.count({ where: { membership_level: 'PLATINUM' } });
      
      // 最近註冊的用戶
      const recentUsers = await User.findAll({
        attributes: ['id', 'username', 'email', 'membership_level', 'is_active', 'created_at'],
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
            username: user.username,
            email: user.email,
            role: user.membership_level,
            status: user.is_active ? 'active' : 'inactive',
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
  }

  // 取得用戶統計資料
  async getUserAnalytics(req, res) {
    try {
      const { id } = req.params;

      const user = await User.findByPk(id, {
        attributes: ['id', 'username', 'email', 'last_login_at', 'created_at']
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: {
            message: '用戶不存在'
          }
        });
      }

      // 這裡可以添加更多統計查詢，比如訂單數量、消費金額等
      res.json({
        success: true,
        data: {
          userId: user.id,
          username: user.username,
          email: user.email,
          lastLogin: user.last_login_at,
          memberSince: user.created_at,
          // 這些數據需要從其他服務獲取
          totalOrders: 0,
          totalSpent: 0,
          loginCount: 0
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
  }
}

module.exports = new UserController();
