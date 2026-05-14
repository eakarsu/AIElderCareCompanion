const pool = require('../db');

let tableEnsured = false;

async function ensureTable() {
  if (tableEnsured) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ai_results (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      endpoint VARCHAR(100) NOT NULL,
      entity_type VARCHAR(100),
      entity_id VARCHAR(100),
      request_payload JSONB,
      ai_results JSONB,
      model VARCHAR(200),
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
  await pool.query('CREATE INDEX IF NOT EXISTS idx_ai_results_endpoint ON ai_results(endpoint);');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_ai_results_entity ON ai_results(entity_type, entity_id);');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_ai_results_user ON ai_results(user_id);');
  tableEnsured = true;
}

/**
 * Persist an AI result row. Best-effort — does not throw on errors so AI endpoints
 * remain functional even if persistence fails.
 */
async function persistAIResult({ userId, endpoint, entityType, entityId, requestPayload, aiResults, model }) {
  try {
    await ensureTable();
    await pool.query(
      `INSERT INTO ai_results (user_id, endpoint, entity_type, entity_id, request_payload, ai_results, model)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        userId || null,
        endpoint,
        entityType || null,
        entityId != null ? String(entityId) : null,
        requestPayload ? JSON.stringify(requestPayload) : null,
        aiResults ? JSON.stringify(aiResults) : null,
        model || null
      ]
    );
  } catch (err) {
    // Swallow — log only
    console.error('persistAIResult error:', err.message);
  }
}

module.exports = { persistAIResult, ensureTable };
