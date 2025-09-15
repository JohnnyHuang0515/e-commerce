// 雙層主鍵映射工具
const { postgresPool } = require('../config/database');

/**
 * 根據 public_id 獲取內部 ID 和 public_id 的映射
 * @param {string} tableName - 表名
 * @param {string} publicId - 公開 ID
 * @returns {Object|null} 包含 internal_id 和 public_id 的對象
 */
const getIdMapping = async (tableName, publicId) => {
  try {
    const result = await postgresPool.query(`
      SELECT ${tableName}_id as internal_id, public_id
      FROM ${tableName}
      WHERE public_id = $1
    `, [publicId]);
    
    return result.rows[0] || null;
  } catch (error) {
    console.error(`ID 映射查詢失敗 (${tableName}, ${publicId}):`, error);
    return null;
  }
};

/**
 * 根據內部 ID 獲取 public_id
 * @param {string} tableName - 表名
 * @param {number} internalId - 內部 ID
 * @returns {string|null} public_id
 */
const getPublicId = async (tableName, internalId) => {
  try {
    const result = await postgresPool.query(`
      SELECT public_id
      FROM ${tableName}
      WHERE ${tableName}_id = $1
    `, [internalId]);
    
    return result.rows[0]?.public_id || null;
  } catch (error) {
    console.error(`獲取 Public ID 失敗 (${tableName}, ${internalId}):`, error);
    return null;
  }
};

/**
 * 批量獲取 ID 映射
 * @param {string} tableName - 表名
 * @param {string[]} publicIds - 公開 ID 列表
 * @returns {Object[]} 映射對象列表
 */
const getBatchIdMappings = async (tableName, publicIds) => {
  try {
    if (!publicIds || publicIds.length === 0) {
      return [];
    }
    
    const placeholders = publicIds.map((_, index) => `$${index + 1}`).join(',');
    const result = await postgresPool.query(`
      SELECT ${tableName}_id as internal_id, public_id
      FROM ${tableName}
      WHERE public_id IN (${placeholders})
    `, publicIds);
    
    return result.rows;
  } catch (error) {
    console.error(`批量 ID 映射查詢失敗 (${tableName}):`, error);
    return [];
  }
};

/**
 * 批量獲取 public_id
 * @param {string} tableName - 表名
 * @param {number[]} internalIds - 內部 ID 列表
 * @returns {string[]} public_id 列表
 */
const getBatchPublicIds = async (tableName, internalIds) => {
  try {
    if (!internalIds || internalIds.length === 0) {
      return [];
    }
    
    const placeholders = internalIds.map((_, index) => `$${index + 1}`).join(',');
    const result = await postgresPool.query(`
      SELECT public_id
      FROM ${tableName}
      WHERE ${tableName}_id IN (${placeholders})
    `, internalIds);
    
    return result.rows.map(row => row.public_id);
  } catch (error) {
    console.error(`批量獲取 Public ID 失敗 (${tableName}):`, error);
    return [];
  }
};

/**
 * 檢查 public_id 是否存在
 * @param {string} tableName - 表名
 * @param {string} publicId - 公開 ID
 * @returns {boolean} 是否存在
 */
const existsPublicId = async (tableName, publicId) => {
  try {
    const result = await postgresPool.query(`
      SELECT 1
      FROM ${tableName}
      WHERE public_id = $1
      LIMIT 1
    `, [publicId]);
    
    return result.rows.length > 0;
  } catch (error) {
    console.error(`檢查 Public ID 存在性失敗 (${tableName}, ${publicId}):`, error);
    return false;
  }
};

/**
 * 檢查內部 ID 是否存在
 * @param {string} tableName - 表名
 * @param {number} internalId - 內部 ID
 * @returns {boolean} 是否存在
 */
const existsInternalId = async (tableName, internalId) => {
  try {
    const result = await postgresPool.query(`
      SELECT 1
      FROM ${tableName}
      WHERE ${tableName}_id = $1
      LIMIT 1
    `, [internalId]);
    
    return result.rows.length > 0;
  } catch (error) {
    console.error(`檢查內部 ID 存在性失敗 (${tableName}, ${internalId}):`, error);
    return false;
  }
};

/**
 * 生成新的 UUID
 * @returns {string} UUID
 */
const generateUUID = () => {
  const { v4: uuidv4 } = require('uuid');
  return uuidv4();
};

/**
 * 生成新的 ULID
 * @returns {string} ULID
 */
const generateULID = () => {
  const { ulid } = require('ulid');
  return ulid();
};

/**
 * 驗證 UUID 格式
 * @param {string} uuid - UUID 字符串
 * @returns {boolean} 是否為有效 UUID
 */
const isValidUUID = (uuid) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * 驗證 ULID 格式
 * @param {string} ulid - ULID 字符串
 * @returns {boolean} 是否為有效 ULID
 */
const isValidULID = (ulid) => {
  const ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/;
  return ulidRegex.test(ulid);
};

/**
 * 創建 ID 映射記錄（用於新記錄）
 * @param {string} tableName - 表名
 * @param {number} internalId - 內部 ID
 * @param {string} publicId - 公開 ID
 * @returns {boolean} 是否成功
 */
const createIdMapping = async (tableName, internalId, publicId) => {
  try {
    await postgresPool.query(`
      UPDATE ${tableName}
      SET public_id = $1
      WHERE ${tableName}_id = $2
    `, [publicId, internalId]);
    
    return true;
  } catch (error) {
    console.error(`創建 ID 映射失敗 (${tableName}, ${internalId}, ${publicId}):`, error);
    return false;
  }
};

/**
 * 刪除 ID 映射（軟刪除時使用）
 * @param {string} tableName - 表名
 * @param {string} publicId - 公開 ID
 * @returns {boolean} 是否成功
 */
const deleteIdMapping = async (tableName, publicId) => {
  try {
    await postgresPool.query(`
      UPDATE ${tableName}
      SET public_id = NULL, deleted_at = NOW()
      WHERE public_id = $1
    `, [publicId]);
    
    return true;
  } catch (error) {
    console.error(`刪除 ID 映射失敗 (${tableName}, ${publicId}):`, error);
    return false;
  }
};

/**
 * 恢復 ID 映射（恢復軟刪除時使用）
 * @param {string} tableName - 表名
 * @param {string} publicId - 公開 ID
 * @param {string} newPublicId - 新的公開 ID
 * @returns {boolean} 是否成功
 */
const restoreIdMapping = async (tableName, publicId, newPublicId) => {
  try {
    await postgresPool.query(`
      UPDATE ${tableName}
      SET public_id = $1, deleted_at = NULL
      WHERE public_id = $2
    `, [newPublicId, publicId]);
    
    return true;
  } catch (error) {
    console.error(`恢復 ID 映射失敗 (${tableName}, ${publicId}):`, error);
    return false;
  }
};

/**
 * 獲取表的下一個內部 ID（用於插入新記錄）
 * @param {string} tableName - 表名
 * @returns {number|null} 下一個內部 ID
 */
const getNextInternalId = async (tableName) => {
  try {
    const result = await postgresPool.query(`
      SELECT MAX(${tableName}_id) + 1 as next_id
      FROM ${tableName}
    `);
    
    return result.rows[0]?.next_id || 1;
  } catch (error) {
    console.error(`獲取下一個內部 ID 失敗 (${tableName}):`, error);
    return null;
  }
};

/**
 * 批量創建 ID 映射
 * @param {string} tableName - 表名
 * @param {Object[]} mappings - 映射對象列表 [{internalId, publicId}, ...]
 * @returns {boolean} 是否成功
 */
const createBatchIdMappings = async (tableName, mappings) => {
  try {
    if (!mappings || mappings.length === 0) {
      return true;
    }
    
    const client = await postgresPool.connect();
    try {
      await client.query('BEGIN');
      
      for (const mapping of mappings) {
        await client.query(`
          UPDATE ${tableName}
          SET public_id = $1
          WHERE ${tableName}_id = $2
        `, [mapping.publicId, mapping.internalId]);
      }
      
      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(`批量創建 ID 映射失敗 (${tableName}):`, error);
    return false;
  }
};

module.exports = {
  getIdMapping,
  getPublicId,
  getBatchIdMappings,
  getBatchPublicIds,
  existsPublicId,
  existsInternalId,
  generateUUID,
  generateULID,
  isValidUUID,
  isValidULID,
  createIdMapping,
  deleteIdMapping,
  restoreIdMapping,
  getNextInternalId,
  createBatchIdMappings
};
