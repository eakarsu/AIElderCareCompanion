const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config({ path: '../.env' });

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

// Security headers
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false
}));

// CORS — supports comma-separated origins in CORS_ORIGIN for multi-domain production deployments
const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : ['http://localhost:3000'];
app.use(cors({
  origin: corsOrigins.length === 1 ? corsOrigins[0] : corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/auth', require('./routes/passwordReset'));
app.use('/api/audit-log', require('./routes/auditLog'));
app.use('/api/medications', require('./routes/medications'));
app.use('/api/fall-alerts', require('./routes/fallAlerts'));
app.use('/api/social-engagement', require('./routes/socialEngagement'));
app.use('/api/health-monitoring', require('./routes/healthMonitoring'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/emergency-contacts', require('./routes/emergencyContacts'));
app.use('/api/daily-activities', require('./routes/dailyActivities'));
app.use('/api/meal-planning', require('./routes/mealPlanning'));
app.use('/api/cognitive-exercises', require('./routes/cognitiveExercises'));
app.use('/api/caregiver-notes', require('./routes/caregiverNotes'));
app.use('/api/sleep-tracking', require('./routes/sleepTracking'));
app.use('/api/mood-tracking', require('./routes/moodTracking'));
app.use('/api/transportation', require('./routes/transportation'));
app.use('/api/home-safety', require('./routes/homeSafety'));
app.use('/api/telemedicine', require('./routes/telemedicine'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/ai', require('./routes/aiNew'));
app.use('/api/ai', require('./routes/aiClinical'));
app.use('/api/ai', require('./routes/aiBacklog'));
app.use('/api/hydration', require('./routes/hydration'));
app.use('/api/physical-therapy', require('./routes/physicalTherapy'));
app.use('/api/medical-records', require('./routes/medicalRecords'));
app.use('/api/allergies', require('./routes/allergies'));
app.use('/api/immunizations', require('./routes/immunizations'));
app.use('/api/visitor-log', require('./routes/visitorLog'));
app.use('/api/care-plans', require('./routes/carePlans'));
app.use('/api/incident-reports', require('./routes/incidentReports'));
app.use('/api/insurance', require('./routes/insurance'));
app.use('/api/wound-care', require('./routes/woundCare'));
app.use('/api/billing', require('./routes/billing'));
app.use('/api/family-messages', require('./routes/familyMessages'));
app.use('/api/legal-documents', require('./routes/legalDocuments'));
app.use('/api/grocery-shopping', require('./routes/groceryShopping'));
app.use('/api/housekeeping', require('./routes/housekeeping'));
app.use('/api/medical-equipment', require('./routes/medicalEquipment'));
app.use('/api/realtime-health', require('./routes/realtimeHealthMonitor'));
app.use('/api/voice-medication', require('./routes/voiceMedication'));
app.use('/api/agentic-health-coach', require('./routes/agenticHealthCoach'));
app.use('/api/family-video', require('./routes/familyVideoMessages'));
app.use('/api/pet-care', require('./routes/petCare'));
app.use('/api/advance-directive', require('./routes/advanceDirectiveChat'));
app.use('/api/nursing-home-transition', require('./routes/nursingHomeTransition'));
app.use('/api/wandering-risk', require('./routes/wanderingRisk'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount custom views BEFORE 404/listen
app.use('/api/custom-views', require('./routes/customViews'));


// === Batch 03 Gaps & Frontend Mounts ===
try {
  const _batch03 = require('./routes/batch03Gaps');
  if (typeof authenticateToken === 'function') app.use('/api', authenticateToken, _batch03);
  else app.use('/api', _batch03);
} catch (_e) { /* batch03 gap routes optional */ }

app.listen(PORT, () => {
  console.log(`Elder Care Backend running on port ${PORT}`);
});
