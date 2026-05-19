// Custom Views routes for Elder Care Companion
// 4 endpoints: vitals trend, activity heatmap, weekly summary PDF, care plan rules CRUD
const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = rateLimit;

// Lightweight rate limit
const cvLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  keyGenerator: (req) => {
    if (req.user && req.user.id) return `user:${req.user.id}`;
    return ipKeyGenerator(req);
  },
  message: { error: 'Custom views rate limit exceeded' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(cvLimiter);

// ---- In-memory care plan rules store (seeded) ----
let carePlanRules = [
  { id: 1, patient: 'Eleanor Williams', type: 'medication', name: 'Lisinopril 10mg', schedule: '08:00', alert: 'BP check after dose', priority: 'high', active: true },
  { id: 2, patient: 'Eleanor Williams', type: 'medication', name: 'Metformin 500mg', schedule: '08:00,18:00', alert: 'Take with meals', priority: 'high', active: true },
  { id: 3, patient: 'Robert Thompson', type: 'medication', name: 'Aspirin 81mg', schedule: '09:00', alert: 'Check for bruising', priority: 'medium', active: true },
  { id: 4, patient: 'Margaret Davis', type: 'activity', name: 'Walking exercise', schedule: '10:00', alert: 'Assist with walker', priority: 'medium', active: true },
  { id: 5, patient: 'James Wilson', type: 'medication', name: 'Donepezil 5mg', schedule: '20:00', alert: 'Monitor cognitive symptoms', priority: 'high', active: true },
  { id: 6, patient: 'Betty Anderson', type: 'check', name: 'Blood glucose check', schedule: '07:00,12:00,18:00', alert: 'Notify if >180 or <70', priority: 'high', active: true },
  { id: 7, patient: 'Harold Martinez', type: 'activity', name: 'Cognitive exercise', schedule: '14:00', alert: 'Track session duration', priority: 'low', active: true },
];
let nextRuleId = 8;

// ===== 1) VIZ: Vitals trend (HR/BP/SpO2 over time) =====
router.get('/vitals-trend', (req, res) => {
  try {
    const patient = req.query.patient || 'Eleanor Williams';
    const days = Math.min(30, Math.max(3, parseInt(req.query.days) || 14));
    const today = new Date();
    const series = { HR: [], SBP: [], DBP: [], SpO2: [], labels: [] };
    // Seeded deterministic-ish pseudo data
    let seed = patient.length * 7 + 31;
    const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 24 * 3600 * 1000);
      const label = d.toISOString().slice(5, 10);
      series.labels.push(label);
      series.HR.push(Math.round(68 + rnd() * 16));
      series.SBP.push(Math.round(118 + rnd() * 28));
      series.DBP.push(Math.round(72 + rnd() * 14));
      series.SpO2.push(Math.round(94 + rnd() * 5));
    }
    const avg = arr => Math.round(arr.reduce((s, n) => s + n, 0) / arr.length);
    res.json({
      patient,
      days,
      series,
      summary: {
        HR_avg: avg(series.HR),
        SBP_avg: avg(series.SBP),
        DBP_avg: avg(series.DBP),
        SpO2_avg: avg(series.SpO2),
      },
      generated_at: new Date().toISOString(),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ===== 2) VIZ: Activity engagement heatmap (activity x day) =====
router.get('/activity-heatmap', (req, res) => {
  try {
    const patient = req.query.patient || 'Eleanor Williams';
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const activities = ['Walking', 'Reading', 'Music', 'Games', 'Social', 'Therapy', 'Meals'];
    let seed = patient.length * 11 + 13;
    const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    const grid = activities.map(act => ({
      activity: act,
      values: days.map(() => Math.round(rnd() * 10)), // 0-10 engagement score
    }));
    const totalEngagement = grid.reduce((s, row) => s + row.values.reduce((a, b) => a + b, 0), 0);
    const max = 10;
    res.json({
      patient,
      days,
      activities,
      grid,
      max,
      total_engagement: totalEngagement,
      generated_at: new Date().toISOString(),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ===== 3) NON-VIZ: Weekly care summary PDF =====
router.get('/weekly-summary-pdf', (req, res) => {
  try {
    const patient = req.query.patient || 'Eleanor Williams';
    const week = req.query.week || new Date().toISOString().slice(0, 10);
    const activeRules = carePlanRules.filter(r => r.active && (r.patient === patient || !req.query.patient));
    // Minimal valid PDF (single page, plain text) — no external deps
    const lines = [
      `Weekly Care Summary`,
      `Patient: ${patient}`,
      `Week ending: ${week}`,
      `Generated: ${new Date().toISOString()}`,
      ``,
      `Vitals Avg (sim): HR 76 bpm  BP 128/80  SpO2 96%`,
      `Medications adhered: 18/21 doses (85.7%)`,
      `Activities completed: 12 sessions across 7 days`,
      `Incidents: 0  Falls: 0  Alerts triggered: 2`,
      ``,
      `Active Care Plan Rules (${activeRules.length}):`,
    ];
    activeRules.slice(0, 15).forEach((r, i) => {
      lines.push(`${i + 1}. [${r.type}] ${r.name} @ ${r.schedule}  (${r.priority})`);
    });
    lines.push('');
    lines.push('Caregiver Notes: Patient stable. Sleep improved this week.');
    lines.push('Recommendations: Continue current care plan. Re-evaluate in 7 days.');

    // Build PDF bytes manually
    const escape = s => s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
    let textOps = 'BT\n/F1 12 Tf\n50 770 Td\n14 TL\n';
    lines.forEach((l, i) => {
      textOps += `(${escape(l)}) Tj\nT*\n`;
    });
    textOps += 'ET';

    const objects = [];
    objects.push('<< /Type /Catalog /Pages 2 0 R >>');
    objects.push('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
    objects.push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>');
    objects.push(`<< /Length ${Buffer.byteLength(textOps)} >>\nstream\n${textOps}\nendstream`);
    objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');

    let pdf = '%PDF-1.4\n';
    const offsets = [];
    objects.forEach((obj, i) => {
      offsets.push(Buffer.byteLength(pdf));
      pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`;
    });
    const xrefPos = Buffer.byteLength(pdf);
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    offsets.forEach(off => {
      pdf += String(off).padStart(10, '0') + ' 00000 n \n';
    });
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`;

    const buf = Buffer.from(pdf, 'binary');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="weekly_care_${patient.replace(/\s+/g, '_')}_${week}.pdf"`);
    res.send(buf);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ===== 4) NON-VIZ: Care plan rules editor CRUD =====
router.get('/care-rules', (req, res) => {
  const { patient, type } = req.query;
  let out = carePlanRules.slice();
  if (patient) out = out.filter(r => r.patient === patient);
  if (type) out = out.filter(r => r.type === type);
  res.json({ rules: out, count: out.length });
});

router.post('/care-rules', (req, res) => {
  try {
    const { patient, type, name, schedule, alert, priority, active } = req.body || {};
    if (!patient || !name) return res.status(400).json({ error: 'patient and name required' });
    const rule = {
      id: nextRuleId++,
      patient,
      type: type || 'medication',
      name,
      schedule: schedule || '08:00',
      alert: alert || '',
      priority: priority || 'medium',
      active: active !== false,
    };
    carePlanRules.push(rule);
    res.status(201).json(rule);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/care-rules/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const idx = carePlanRules.findIndex(r => r.id === id);
  if (idx === -1) return res.status(404).json({ error: 'rule not found' });
  carePlanRules[idx] = { ...carePlanRules[idx], ...req.body, id };
  res.json(carePlanRules[idx]);
});

router.delete('/care-rules/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const idx = carePlanRules.findIndex(r => r.id === id);
  if (idx === -1) return res.status(404).json({ error: 'rule not found' });
  const [removed] = carePlanRules.splice(idx, 1);
  res.json({ removed });
});

module.exports = router;
