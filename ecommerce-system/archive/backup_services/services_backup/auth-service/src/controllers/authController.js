const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 🔐 認證控制器
class AuthController {
  // 管理員登入
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // 簡化版本：直接返回成功，不做實際驗證
      // TODO: 實作真實的登入驗證
      // const user = await User.findOne({ email });
      // if (!user) {
      //   return res.status(401).json({
      //     success: false,
      //     error: {
      //       code: 'INVALID_CREDENTIALS',
      //       message: '帳號或密碼錯誤'
      //     }
      //   });
      // }
      
      // const isValidPassword = await bcrypt.compare(password, user.password);
      // if (!isValidPassword) {
      //   return res.status(401).json({
      //     success: false,
      //     error: {
      //       code: 'INVALID_CREDENTIALS',
      //       message: '帳號或密碼錯誤'
      //     }
      //   });
      // }

      // 生成 JWT Token
      const token = jwt.sign(
        {
          userId: 'mock-user-id',
          email: email || 'admin@ecommerce.com',
          role: 'admin',
          permissions: ['users:read', 'users:write', 'orders:read', 'orders:write']
        },
        process.env.JWT_SECRET || 'dev-secret',
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );

      // 更新登入統計
      // await User.findByIdAndUpdate(user._id, {
      //   $inc: { 'statistics.loginCount': 1 },
      //   $set: { 'statistics.lastLoginAt': new Date() }
      // });

      res.json({
        success: true,
        data: {
          token,
          user: {
            id: 'mock-user-id',
            email: email || 'admin@ecommerce.com',
            name: '管理員',
            role: 'admin',
            permissions: ['users:read', 'users:write', 'orders:read', 'orders:write']
          }
        },
        message: '登入成功'
      });
    } catch (error) {
      console.error('登入錯誤:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '伺服器內部錯誤'
        }
      });
    }
  }

  // 管理員登出
  async logout(req, res) {
    try {
      // TODO: 實作登出邏輯（例如將 Token 加入黑名單）
      res.json({
        success: true,
        message: '登出成功'
      });
    } catch (error) {
      console.error('登出錯誤:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '伺服器內部錯誤'
        }
      });
    }
  }

  // 取得管理員資料
  async getProfile(req, res) {
    try {
      // TODO: 從 Token 中取得真實用戶資料
      // const user = await User.findById(req.user.userId).select('-password');
      
      res.json({
        success: true,
        data: {
          id: 'mock-user-id',
          email: 'admin@ecommerce.com',
          name: '管理員',
          role: 'admin',
          permissions: ['users:read', 'users:write', 'orders:read', 'orders:write'],
          profile: {
            birthday: null,
            gender: null,
            address: null
          },
          preferences: {
            language: 'zh-TW',
            currency: 'TWD',
            notifications: {
              email: true,
              sms: false,
              push: true
            }
          },
          statistics: {
            totalOrders: 0,
            totalSpent: 0,
            lastLoginAt: new Date(),
            loginCount: 1
          }
        }
      });
    } catch (error) {
      console.error('取得資料錯誤:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '伺服器內部錯誤'
        }
      });
    }
  }

  // 修改密碼
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;

      // TODO: 實作密碼修改邏輯
      // const user = await User.findById(req.user.userId);
      // const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      // if (!isValidPassword) {
      //   return res.status(400).json({
      //     success: false,
      //     error: {
      //       code: 'INVALID_PASSWORD',
      //       message: '目前密碼錯誤'
      //     }
      //   });
      // }

      // const hashedPassword = await bcrypt.hash(newPassword, 12);
      // await User.findByIdAndUpdate(user._id, { password: hashedPassword });

      res.json({
        success: true,
        message: '密碼修改成功'
      });
    } catch (error) {
      console.error('修改密碼錯誤:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '伺服器內部錯誤'
        }
      });
    }
  }

  // 重新整理 Token
  async refreshToken(req, res) {
    try {
      // TODO: 實作 Token 重新整理邏輯
      const newToken = jwt.sign(
        {
          userId: 'mock-user-id',
          email: 'admin@ecommerce.com',
          role: 'admin',
          permissions: ['users:read', 'users:write', 'orders:read', 'orders:write']
        },
        process.env.JWT_SECRET || 'dev-secret',
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );

      res.json({
        success: true,
        data: {
          token: newToken
        },
        message: 'Token 重新整理成功'
      });
    } catch (error) {
      console.error('重新整理 Token 錯誤:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '伺服器內部錯誤'
        }
      });
    }
  }
}

module.exports = new AuthController();
