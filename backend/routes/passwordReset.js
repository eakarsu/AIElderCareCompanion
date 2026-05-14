/**
 * Password reset flow.
 * POST /api/auth/forgot-password   { email } => issues token (returned in response in dev; emailed in prod)
 * POST /api/auth/reset-password    { token, new_password }
 * POST /api/auth/change-password   { current_password, new_password } (auth required)
 */
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const pool = require('../db');
const auth = require('../middleware/auth');

let columnsEnsured = false;
async function ensureResetColumns() {
  if (columnsEnsured) return;
  try {
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(128)');
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP');
  } catch { /* table may not exist yet */ }
  columnsEnsured = true;
}

router.post('/forgot-password', async (req, res) => {
  try {
    await ensureResetColumns();
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'email is required' });

    const userResult = await pool.query('SELECT id, email FROM users WHERE email = $1', [email]);
    // Always return success (don't leak existence)
    if (userResult.rows.length === 0) {
      return res.json({ message: 'If that email exists, a reset link has been sent.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await pool.query(
      'UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE id = $3',
      [token, expiry, userResult.rows[0].id]
    );

    // In production, this would email the link. In dev, return the token directly.
    const debugToken = process.env.NODE_ENV !== 'production' ? token : undefined;
    res.json({
      message: 'If that email exists, a reset link has been sent.',
      ...(debugToken ? { debug_token: debugToken } : {})
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    await ensureResetColumns();
    const { token, new_password } = req.body;
    if (!token || !new_password) {
      return res.status(400).json({ error: 'token and new_password are required' });
    }
    if (new_password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const r = await pool.query(
      'SELECT id FROM users WHERE reset_token = $1 AND reset_token_expiry > NOW()',
      [token]
    );
    if (r.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    const hashed = await bcrypt.hash(new_password, 10);
    await pool.query(
      'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expiry = NULL WHERE id = $2',
      [hashed, r.rows[0].id]
    );

    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/change-password', auth, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'current_password and new_password required' });
    }
    if (new_password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const userId = req.user?.id || req.user?.userId;
    const u = await pool.query('SELECT id, password_hash FROM users WHERE id = $1', [userId]);
    if (u.rows.length === 0) return res.status(404).json({ error: 'User not found' });

    const valid = await bcrypt.compare(current_password, u.rows[0].password_hash);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });

    const hashed = await bcrypt.hash(new_password, 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashed, userId]);

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
