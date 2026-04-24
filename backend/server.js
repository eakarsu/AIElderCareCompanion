const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: '../.env' });

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
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

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Elder Care Backend running on port ${PORT}`);
});
