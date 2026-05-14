import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import FeaturePage from './pages/FeaturePage';
import AIAssistant from './pages/AIAssistant';
import MedicationInteractionAlert from './pages/MedicationInteractionAlert';
import CaregiverChat from './pages/CaregiverChat';
import HipaaAuditLog from './pages/HipaaAuditLog';
import Navbar from './components/Navbar';
import './styles/App.css';

import Batch03Features from './pages/Batch03Features';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'));

  const handleLogin = (tokenVal, userVal) => {
    localStorage.setItem('token', tokenVal);
    localStorage.setItem('user', JSON.stringify(userVal));
    setToken(tokenVal);
    setUser(userVal);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Router>
      <div className="app">
        <Navbar user={user} onLogout={handleLogout} />
        <main className="main-content">
          <Routes>
          <Route path="/batch03" element={<Batch03Features />} />
            <Route path="/" element={<Dashboard token={token} />} />
            <Route path="/medications" element={<FeaturePage feature="medications" title="Medication Management" token={token} />} />
            <Route path="/fall-alerts" element={<FeaturePage feature="fall-alerts" title="Fall Detection Alerts" token={token} />} />
            <Route path="/social-engagement" element={<FeaturePage feature="social-engagement" title="Social Engagement" token={token} />} />
            <Route path="/health-monitoring" element={<FeaturePage feature="health-monitoring" title="Health Monitoring" token={token} />} />
            <Route path="/appointments" element={<FeaturePage feature="appointments" title="Appointment Scheduling" token={token} />} />
            <Route path="/emergency-contacts" element={<FeaturePage feature="emergency-contacts" title="Emergency Contacts" token={token} />} />
            <Route path="/daily-activities" element={<FeaturePage feature="daily-activities" title="Daily Activity Tracking" token={token} />} />
            <Route path="/meal-planning" element={<FeaturePage feature="meal-planning" title="Nutrition & Meal Planning" token={token} />} />
            <Route path="/cognitive-exercises" element={<FeaturePage feature="cognitive-exercises" title="Cognitive Exercises" token={token} />} />
            <Route path="/caregiver-notes" element={<FeaturePage feature="caregiver-notes" title="Caregiver Notes" token={token} />} />
            <Route path="/sleep-tracking" element={<FeaturePage feature="sleep-tracking" title="Sleep Tracking" token={token} />} />
            <Route path="/mood-tracking" element={<FeaturePage feature="mood-tracking" title="Mood & Wellness" token={token} />} />
            <Route path="/transportation" element={<FeaturePage feature="transportation" title="Transportation Services" token={token} />} />
            <Route path="/home-safety" element={<FeaturePage feature="home-safety" title="Home Safety Checks" token={token} />} />
            <Route path="/telemedicine" element={<FeaturePage feature="telemedicine" title="Telemedicine" token={token} />} />
            <Route path="/hydration" element={<FeaturePage feature="hydration" title="Hydration Tracking" token={token} />} />
            <Route path="/physical-therapy" element={<FeaturePage feature="physical-therapy" title="Physical Therapy" token={token} />} />
            <Route path="/medical-records" element={<FeaturePage feature="medical-records" title="Medical Records" token={token} />} />
            <Route path="/allergies" element={<FeaturePage feature="allergies" title="Allergy Tracking" token={token} />} />
            <Route path="/immunizations" element={<FeaturePage feature="immunizations" title="Immunization Records" token={token} />} />
            <Route path="/visitor-log" element={<FeaturePage feature="visitor-log" title="Visitor Log" token={token} />} />
            <Route path="/care-plans" element={<FeaturePage feature="care-plans" title="Care Plans" token={token} />} />
            <Route path="/incident-reports" element={<FeaturePage feature="incident-reports" title="Incident Reports" token={token} />} />
            <Route path="/insurance" element={<FeaturePage feature="insurance" title="Insurance Info" token={token} />} />
            <Route path="/wound-care" element={<FeaturePage feature="wound-care" title="Wound Care" token={token} />} />
            <Route path="/billing" element={<FeaturePage feature="billing" title="Billing & Payments" token={token} />} />
            <Route path="/family-messages" element={<FeaturePage feature="family-messages" title="Family Messages" token={token} />} />
            <Route path="/legal-documents" element={<FeaturePage feature="legal-documents" title="Legal Documents" token={token} />} />
            <Route path="/grocery-shopping" element={<FeaturePage feature="grocery-shopping" title="Grocery Shopping" token={token} />} />
            <Route path="/housekeeping" element={<FeaturePage feature="housekeeping" title="Housekeeping" token={token} />} />
            <Route path="/medical-equipment" element={<FeaturePage feature="medical-equipment" title="Medical Equipment" token={token} />} />
            <Route path="/ai-assistant" element={<AIAssistant token={token} />} />
            <Route path="/medication-interaction-alert" element={<MedicationInteractionAlert token={token} />} />
            <Route path="/caregiver-chat" element={<CaregiverChat token={token} />} />
            <Route path="/hipaa-audit-log" element={<HipaaAuditLog token={token} user={user} />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
