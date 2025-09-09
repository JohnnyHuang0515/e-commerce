const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { User, Role, Permission } = require('../models');

// 用戶登入
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 查找用戶
    const user = await User.findOne({
      where: { email },
      include: [
        {
          model: Role,
          as: 'userRole',
          include: [
            {
              model: Permission,
              as: 'permissions'
            }
          ]
        }
      ]
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '郵箱或密碼錯誤'
      });
    }

    // 檢查用戶狀態
    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: '用戶帳號已被停用'
      });
    }

    // 驗證密碼
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: '郵箱或密碼錯誤'
      });
    }

    // 生成 JWT Token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role?.name || 'user' 
      },
      process.env.JWT_SECRET || 'your-super-secret-jwt-key-for-development',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // 更新最後登入時間
    await user.update({ last_login_at: new Date() });

    res.json({
      success: true,
      message: '登入成功',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.userRole?.name || user.role,
          permissions: user.userRole?.permissions?.map(p => p.name) || []
        }
      }
    });
  } catch (error) {
    console.error('登入錯誤:', error);
    res.status(500).json({
      success: false,
      message: '登入過程中發生錯誤'
    });
  }
};

// 用戶註冊
const register = async (req, res) => {
  try {
    const { email, password, name, role = 'user' } = req.body;

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

    // 根據角色名稱找到對應的 role_id
    const roleRecord = await Role.findOne({ where: { name: role } });
    if (!roleRecord) {
      return res.status(400).json({
        success: false,
        message: '無效的角色'
      });
    }

    // 創建用戶
    const user = await User.create({
      id: uuidv4(),
      email,
      password: hashedPassword,
      name,
      role: role,
      role_id: roleRecord.id,
      status: 'active'
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
          ]
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: '註冊成功',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: userWithRole.userRole?.name || userWithRole.role,
          permissions: userWithRole.userRole?.permissions?.map(p => p.name) || []
        }
      }
    });
  } catch (error) {
    console.error('註冊錯誤:', error);
    res.status(500).json({
      success: false,
      message: '註冊過程中發生錯誤',
      error: error.message
    });
  }
};

// 刷新 Token
const refreshToken = async (req, res) => {
  try {
    const user = req.user;

    // 生成新的 JWT Token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role?.name || 'user' 
      },
      process.env.JWT_SECRET || 'your-super-secret-jwt-key-for-development',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      success: true,
      message: 'Token 刷新成功',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.userRole?.name || user.role,
          permissions: user.userRole?.permissions?.map(p => p.name) || []
        }
      }
    });
  } catch (error) {
    console.error('Token 刷新錯誤:', error);
    res.status(500).json({
      success: false,
      message: 'Token 刷新過程中發生錯誤'
    });
  }
};

// 用戶登出
const logout = async (req, res) => {
  try {
    // 在實際應用中，這裡可以將 token 加入黑名單
    // 或者更新用戶的登出時間
    
    res.json({
      success: true,
      message: '登出成功'
    });
  } catch (error) {
    console.error('登出錯誤:', error);
    res.status(500).json({
      success: false,
      message: '登出過程中發生錯誤'
    });
  }
};

// 驗證 Token
const verifyToken = async (req, res) => {
  try {
    const user = req.user;

    res.json({
      success: true,
      message: 'Token 有效',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.userRole?.name || user.role,
          permissions: user.userRole?.permissions?.map(p => p.name) || []
        }
      }
    });
  } catch (error) {
    console.error('Token 驗證錯誤:', error);
    res.status(500).json({
      success: false,
      message: 'Token 驗證過程中發生錯誤'
    });
  }
};

module.exports = {
  login,
  register,
  refreshToken,
  logout,
  verifyToken
};
