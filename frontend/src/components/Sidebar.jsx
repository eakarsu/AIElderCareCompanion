import React from 'react';
import { NavLink } from 'react-router-dom';

const LINKS = [
  { to: "/batch03", label: "Batch03 Features" },
  { to: "/medications", label: "Feature Page" },
  { to: "/fall-alerts", label: "Feature Page" },
  { to: "/social-engagement", label: "Feature Page" },
  { to: "/health-monitoring", label: "Feature Page" },
  { to: "/appointments", label: "Feature Page" },
  { to: "/emergency-contacts", label: "Feature Page" },
  { to: "/daily-activities", label: "Feature Page" },
  { to: "/meal-planning", label: "Feature Page" },
  { to: "/cognitive-exercises", label: "Feature Page" },
  { to: "/caregiver-notes", label: "Feature Page" },
  { to: "/sleep-tracking", label: "Feature Page" },
  { to: "/mood-tracking", label: "Feature Page" },
  { to: "/transportation", label: "Feature Page" },
  { to: "/home-safety", label: "Feature Page" },
  { to: "/telemedicine", label: "Feature Page" },
  { to: "/hydration", label: "Feature Page" },
  { to: "/physical-therapy", label: "Feature Page" },
  { to: "/medical-records", label: "Feature Page" },
  { to: "/allergies", label: "Feature Page" },
  { to: "/immunizations", label: "Feature Page" },
  { to: "/visitor-log", label: "Feature Page" },
  { to: "/care-plans", label: "Feature Page" },
  { to: "/incident-reports", label: "Feature Page" },
  { to: "/insurance", label: "Feature Page" },
  { to: "/wound-care", label: "Feature Page" },
  { to: "/billing", label: "Feature Page" },
  { to: "/family-messages", label: "Feature Page" },
  { to: "/legal-documents", label: "Feature Page" },
  { to: "/grocery-shopping", label: "Feature Page" },
  { to: "/housekeeping", label: "Feature Page" },
  { to: "/medical-equipment", label: "Feature Page" },
  { to: "/ai-assistant", label: "AIAssistant" },
  { to: "/medication-interaction-alert", label: "Medication Interaction Alert" },
  { to: "/wandering-risk", label: "Wandering Risk" },
  { to: "/caregiver-chat", label: "Caregiver Chat" },
  { to: "/hipaa-audit-log", label: "Hipaa Audit Log" },
  { to: "/custom-views", label: "Custom Views Page" },
];

const CSS = `
.app-shell{display:grid;grid-template-columns:264px 1fr;min-height:100vh}
.sidebar{background:#0b1220;color:#fff;padding:22px 14px;position:sticky;top:0;height:100vh;overflow:auto;display:flex;flex-direction:column;gap:6px}
.sidebar-brand{padding:6px 10px 16px;border-bottom:1px solid #ffffff18;margin-bottom:10px}
.sidebar-brand .eyebrow{text-transform:uppercase;letter-spacing:.16em;font-size:11px;font-weight:800;color:#7dd3fc}
.sidebar-brand h1{font-size:17px;margin:8px 0 0;line-height:1.25;word-break:break-word}
.sidebar-nav{display:flex;flex-direction:column;gap:2px;flex:1;overflow:auto}
.sidebar-nav a{display:block;border-radius:10px;color:#94a3b8;padding:9px 12px;text-decoration:none;font-weight:600;font-size:13.5px}
.sidebar-nav a:hover{background:#ffffff12;color:#fff}
.sidebar-nav a.active{background:#2563eb;color:#fff}
.sidebar-foot{margin-top:12px;padding-top:12px;border-top:1px solid #ffffff18;display:flex;flex-direction:column;gap:8px}
.sidebar-user{font-size:12px;color:#cbd5e1}
.sidebar-logout{border:0;border-radius:10px;padding:10px 12px;font-weight:800;cursor:pointer;background:#1e293b;color:#e2e8f0}
.sidebar-logout:hover{background:#334155}
@media(max-width:900px){.app-shell{grid-template-columns:1fr}.sidebar{position:relative;height:auto}}
`;

export default function Sidebar({ user, onLogout }) {
  return (
    <>
      <style>{CSS}</style>
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="eyebrow">Sidebar app</span>
          <h1>AIElderCareCompanion</h1>
        </div>
        <nav className="sidebar-nav">
          {LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.to === '/'} className={({ isActive }) => (isActive ? 'active' : '')}>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-foot">
          {user && <span className="sidebar-user">{user.name || user.email || 'Signed in'}</span>}
          <button className="sidebar-logout" onClick={onLogout}>Logout</button>
        </div>
      </aside>
    </>
  );
}
