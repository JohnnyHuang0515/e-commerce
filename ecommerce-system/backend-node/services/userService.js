const { postgresPool } = require('../config/database');

const getUserByPublicId = async (publicId) => {
  if (!publicId) {
    return null;
  }

  try {
    const result = await postgresPool.query(
      `SELECT id, public_id, name, email, status, created_at, updated_at
       FROM users
       WHERE public_id = $1`,
      [publicId]
    );

    return result.rows[0] || null;
  } catch (error) {
    console.error('查詢用戶失敗:', error);
    return null;
  }
};

const getUserByEmail = async (email) => {
  if (!email) {
    return null;
  }

  try {
    const result = await postgresPool.query(
      `SELECT id, email, password, name, role, status, created_at, updated_at
       FROM users
       WHERE email = $1`,
      [email]
    );

    return result.rows[0] || null;
  } catch (error) {
    console.error('查詢用戶失敗:', error);
    return null;
  }
};

module.exports = {
  getUserByPublicId,
  getUserByEmail,
};
