const jwt = require('jsonwebtoken');

const config = require('../config/env');
const { getUserByPublicId } = require('../services/userService');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: '缺少認證令牌',
      });
    }

    const decoded = jwt.verify(token, config.jwt.secret);
    const user = await getUserByPublicId(decoded.public_id);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: '無效的用戶',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('認證失敗:', error);
    res.status(401).json({
      success: false,
      error: '認證令牌無效',
    });
  }
};

module.exports = {
  authenticateToken,
};
