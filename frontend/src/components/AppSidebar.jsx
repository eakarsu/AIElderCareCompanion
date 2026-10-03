import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import './AppSidebar.css';

const LINKS = [
  { to: '/insights/timeline', label: 'Timeline View', group: 'Insights' },
  { to: '/codex/custom-viz', label: 'Custom Viz', group: 'Insights' },
  { to: '/codex/operations', label: 'Operations', group: 'Insights' },
  { to: '/batch03', label: 'Batch03 Features', group: 'Workspace' },
  { to: '/', label: 'Dashboard', group: 'Workspace' },
  { to: '/medications', label: 'Feature', group: 'Workspace' },
  { to: '/fall-alerts', label: 'Feature', group: 'Workspace' },
  { to: '/social-engagement', label: 'Feature', group: 'Workspace' },
  { to: '/health-monitoring', label: 'Feature', group: 'Workspace' },
  { to: '/appointments', label: 'Feature', group: 'Workspace' },
  { to: '/emergency-contacts', label: 'Feature', group: 'Workspace' },
  { to: '/daily-activities', label: 'Feature', group: 'Workspace' },
  { to: '/meal-planning', label: 'Feature', group: 'Workspace' },
  { to: '/cognitive-exercises', label: 'Feature', group: 'Workspace' },
  { to: '/caregiver-notes', label: 'Feature', group: 'Workspace' },
  { to: '/sleep-tracking', label: 'Feature', group: 'Workspace' },
  { to: '/mood-tracking', label: 'Feature', group: 'Workspace' },
  { to: '/transportation', label: 'Feature', group: 'Workspace' },
  { to: '/home-safety', label: 'Feature', group: 'Workspace' },
  { to: '/telemedicine', label: 'Feature', group: 'Workspace' },
  { to: '/hydration', label: 'Feature', group: 'Workspace' },
  { to: '/physical-therapy', label: 'Feature', group: 'Workspace' },
  { to: '/medical-records', label: 'Feature', group: 'Workspace' },
  { to: '/allergies', label: 'Feature', group: 'Workspace' },
  { to: '/immunizations', label: 'Feature', group: 'Workspace' },
  { to: '/visitor-log', label: 'Feature', group: 'Workspace' },
  { to: '/care-plans', label: 'Feature', group: 'Workspace' },
  { to: '/incident-reports', label: 'Feature', group: 'Workspace' },
  { to: '/insurance', label: 'Feature', group: 'Workspace' },
  { to: '/wound-care', label: 'Feature', group: 'Workspace' },
  { to: '/billing', label: 'Feature', group: 'Workspace' },
  { to: '/family-messages', label: 'Feature', group: 'Workspace' },
  { to: '/legal-documents', label: 'Feature', group: 'Workspace' },
  { to: '/grocery-shopping', label: 'Feature', group: 'Workspace' },
  { to: '/housekeeping', label: 'Feature', group: 'Workspace' },
  { to: '/medical-equipment', label: 'Feature', group: 'Workspace' },
  { to: '/ai-assistant', label: 'AI Assistant', group: 'Workspace' },
  { to: '/medication-interaction-alert', label: 'Medication Interaction Alert', group: 'Workspace' },
  { to: '/wandering-risk', label: 'Wandering Risk', group: 'Workspace' },
  { to: '/caregiver-chat', label: 'Caregiver Chat', group: 'Workspace' },
  { to: '/hipaa-audit-log', label: 'Hipaa Audit Log', group: 'Workspace' },
  { to: '/custom-views', label: 'Custom Views', group: 'Workspace' },
];

export default function AppSidebar() {
  const [query, setQuery] = useState('');
  const visible = LINKS.filter(link => link.label.toLowerCase().includes(query.toLowerCase().trim()));
  return <aside className="codex-side" aria-label="Application navigation">
    <div className="codex-side-brand"><strong>AIElder Care Companion</strong><span>Workspace</span></div>
    <label className="codex-side-search-label" htmlFor="codex-side-search">Find a section</label>
    <input id="codex-side-search" className="codex-side-search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search navigation" />
    <nav className="codex-side-links" aria-label="Sections">
      {['Workspace', 'AI tools', 'Insights'].map(group => {
        const items = visible.filter(link => link.group === group);
        return items.length ? <div className="codex-side-group" key={group}>
          <span className="codex-side-heading">{group}</span>
          {items.map(link => <NavLink key={link.to} to={link.to} end={link.to === '/'} className={({ isActive }) => `codex-side-link${isActive ? ' active' : ''}`}>{link.label}</NavLink>)}
        </div> : null;
      })}
      {visible.length === 0 && <p className="codex-side-empty">No matching sections</p>}
    </nav>
  </aside>;
}
