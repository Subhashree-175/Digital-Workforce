const { query } = require('../config/db');

/**
 * Records an audit entry for transparency & accountability.
 * @param {number|null} userId  - acting user
 * @param {string} action       - e.g. 'LOGIN', 'WORKLOG_SUBMIT', 'EVAL_APPROVE'
 * @param {string} entityType   - table/entity name
 * @param {number|null} entityId
 * @param {object} details      - extra context stored as JSONB
 */
async function writeAudit(userId, action, entityType, entityId = null, details = {}) {
  try {
    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, action, entityType, entityId, JSON.stringify(details)]
    );
  } catch (err) {
    // Audit failures must never break the primary action.
    console.error('⚠️ Audit write failed:', err.message);
  }
}

module.exports = { writeAudit };