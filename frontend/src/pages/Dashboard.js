import React from 'react';
import { useNavigate } from 'react-router-dom';

const features = [
  { key: 'medications', title: 'Medication Management', icon: '\uD83D\uDC8A', desc: 'Track medications, dosages, schedules, and interactions', color: '#4F46E5' },
  { key: 'fall-alerts', title: 'Fall Detection Alerts', icon: '\u26A0\uFE0F', desc: 'Monitor fall events, severity, and response status', color: '#DC2626' },
  { key: 'social-engagement', title: 'Social Engagement', icon: '\uD83E\uDD1D', desc: 'Track social activities and mood improvements', color: '#059669' },
  { key: 'health-monitoring', title: 'Health Monitoring', icon: '\uD83E\uDE7A', desc: 'Monitor vitals, blood pressure, glucose, and more', color: '#0891B2' },
  { key: 'appointments', title: 'Appointment Scheduling', icon: '\uD83D\uDCC5', desc: 'Manage doctor visits and medical appointments', color: '#7C3AED' },
  { key: 'emergency-contacts', title: 'Emergency Contacts', icon: '\uD83D\uDCDE', desc: 'Quick access to emergency contacts and proxies', color: '#E11D48' },
  { key: 'daily-activities', title: 'Daily Activity Tracking', icon: '\u2705', desc: 'Monitor daily routines and task completion', color: '#16A34A' },
  { key: 'meal-planning', title: 'Nutrition & Meal Planning', icon: '\uD83C\uDF4E', desc: 'Plan nutritious meals with dietary restrictions', color: '#EA580C' },
  { key: 'cognitive-exercises', title: 'Cognitive Exercises', icon: '\uD83E\uDDE0', desc: 'Brain games and cognitive health tracking', color: '#9333EA' },
  { key: 'caregiver-notes', title: 'Caregiver Notes', icon: '\uD83D\uDCDD', desc: 'Document observations, shifts, and patient updates', color: '#0D9488' },
  { key: 'sleep-tracking', title: 'Sleep Tracking', icon: '\uD83D\uDE34', desc: 'Monitor sleep patterns and quality', color: '#4338CA' },
  { key: 'mood-tracking', title: 'Mood & Wellness', icon: '\uD83D\uDE0A', desc: 'Track emotional well-being and mental health', color: '#CA8A04' },
  { key: 'transportation', title: 'Transportation Services', icon: '\uD83D\uDE97', desc: 'Schedule rides to appointments and activities', color: '#2563EB' },
  { key: 'home-safety', title: 'Home Safety Checks', icon: '\uD83C\uDFE0', desc: 'Identify hazards and track safety improvements', color: '#D97706' },
  { key: 'telemedicine', title: 'Telemedicine', icon: '\uD83D\uDCBB', desc: 'Virtual doctor visits and remote consultations', color: '#6D28D9' },
  { key: 'hydration', title: 'Hydration Tracking', icon: '\uD83D\uDCA7', desc: 'Monitor daily fluid intake and hydration goals', color: '#0EA5E9' },
  { key: 'physical-therapy', title: 'Physical Therapy', icon: '\uD83C\uDFCB\uFE0F', desc: 'Track PT sessions, exercises, and rehabilitation progress', color: '#10B981' },
  { key: 'medical-records', title: 'Medical Records', icon: '\uD83D\uDCC4', desc: 'Store diagnoses, lab results, and medical history', color: '#6366F1' },
  { key: 'allergies', title: 'Allergy Tracking', icon: '\uD83E\uDD27', desc: 'Track allergens, reactions, and treatments', color: '#F43F5E' },
  { key: 'immunizations', title: 'Immunization Records', icon: '\uD83D\uDC89', desc: 'Track vaccinations and upcoming due dates', color: '#8B5CF6' },
  { key: 'visitor-log', title: 'Visitor Log', icon: '\uD83D\uDC65', desc: 'Track visits from family, friends, and professionals', color: '#F59E0B' },
  { key: 'care-plans', title: 'Care Plans', icon: '\uD83D\uDCCB', desc: 'Manage care goals, interventions, and reviews', color: '#14B8A6' },
  { key: 'incident-reports', title: 'Incident Reports', icon: '\uD83D\uDEA8', desc: 'Document incidents, responses, and follow-ups', color: '#EF4444' },
  { key: 'insurance', title: 'Insurance Info', icon: '\uD83D\uDEE1\uFE0F', desc: 'Track insurance policies, coverage, and claims', color: '#3B82F6' },
  { key: 'wound-care', title: 'Wound Care', icon: '\uD83E\uDE79', desc: 'Monitor wound healing, dressings, and treatments', color: '#EC4899' },
  { key: 'billing', title: 'Billing & Payments', icon: '\uD83D\uDCB0', desc: 'Track care costs, insurance claims, and payments', color: '#22C55E' },
  { key: 'family-messages', title: 'Family Messages', icon: '\uD83D\uDCE8', desc: 'Communication between family and care team', color: '#A855F7' },
  { key: 'legal-documents', title: 'Legal Documents', icon: '\u2696\uFE0F', desc: 'Manage POA, living wills, and legal paperwork', color: '#78716C' },
  { key: 'grocery-shopping', title: 'Grocery Shopping', icon: '\uD83D\uDED2', desc: 'Shopping lists with dietary needs and preferences', color: '#F97316' },
  { key: 'housekeeping', title: 'Housekeeping', icon: '\uD83E\uDDF9', desc: 'Track cleaning tasks, schedules, and assignments', color: '#06B6D4' },
  { key: 'medical-equipment', title: 'Medical Equipment', icon: '\uD83E\uDE7C', desc: 'Track devices, maintenance, and warranties', color: '#64748B' },
  { key: 'ai-assistant', title: 'AI Care Assistant', icon: '\uD83E\uDD16', desc: 'AI-powered care insights and recommendations', color: '#0F766E' },
];

const Dashboard = ({ token }) => {
  const navigate = useNavigate();

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Care Dashboard</h1>
        <p>Comprehensive AI-powered elder care management</p>
      </div>
      <div className="dashboard-grid">
        {features.map((f) => (
          <div
            key={f.key}
            className="dashboard-card"
            onClick={() => navigate(`/${f.key}`)}
            style={{ borderTopColor: f.color }}
          >
            <div className="card-icon" style={{ backgroundColor: f.color + '15', color: f.color }}>
              {f.icon}
            </div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
            <div className="card-arrow" style={{ color: f.color }}>&#x2192;</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
