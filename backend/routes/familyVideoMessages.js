// Family video messages: record video messages to be sent on specific dates
// (legacy letters). v0 accepts base64 video URL and schedules delivery.
const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// POST /api/family-video/schedule { patient_id, from_user_id, to_user_id, video_url, deliver_at }
router.post('/schedule', auth, async (req, res) => {
  try {
    const { patient_id, from_user_id, to_user_id, video_url, deliver_at, message_text } = req.body || {};
    if (!patient_id || !video_url || !deliver_at) return res.status(400).json({ error: 'patient_id, video_url, deliver_at required' });
    const when = new Date(deliver_at);
    if (Number.isNaN(when.getTime())) return res.status(400).json({ error: 'invalid deliver_at' });

    let id = null;
    try {
      const r = await pool.query(
        `INSERT INTO family_video_messages (patient_id, from_user_id, to_user_id, video_url, message_text, deliver_at, status, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,'scheduled',NOW()) RETURNING id`,
        [patient_id, from_user_id || req.user?.id, to_user_id || null, video_url, message_text || null, when]
      );
      id = r.rows[0].id;
    } catch (e) {
      // table missing — fall back to family_messages JSON column
      try {
        const r = await pool.query(
          `INSERT INTO family_messages (patient_id, sender_id, recipient_id, content, scheduled_for, created_at)
           VALUES ($1,$2,$3,$4,$5,NOW()) RETURNING id`,
          [patient_id, from_user_id || req.user?.id, to_user_id || null, JSON.stringify({ video_url, message_text }), when]
        );
        id = r.rows[0].id;
      } catch {}
    }
    return res.json({ id, patient_id, deliver_at: when.toISOString(), status: 'scheduled' });
  } catch (e) {
    return res.status(500).json({ error: 'schedule failed' });
  }
});

// GET /api/family-video/due — cron pulls due messages
router.get('/due', auth, async (req, res) => {
  try {
    let rows = [];
    try {
      const r = await pool.query(`SELECT * FROM family_video_messages WHERE status='scheduled' AND deliver_at <= NOW() LIMIT 100`);
      rows = r.rows;
    } catch {}
    return res.json({ due_count: rows.length, messages: rows });
  } catch (e) {
    return res.status(500).json({ error: 'lookup failed' });
  }
});

module.exports = router;
