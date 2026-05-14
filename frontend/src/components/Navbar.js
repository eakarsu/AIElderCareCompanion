import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = ({ user, onLogout }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/" className="navbar-logo">
          <span className="logo-icon">&#x1F3E5;</span>
          <span className="logo-text">ElderCare AI</span>
        </Link>
        <button className="navbar-toggle" onClick={() => setMenuOpen(!menuOpen)}>
          &#9776;
        </button>
      </div>
      <div className={`navbar-menu ${menuOpen ? 'open' : ''}`}>
        <Link to="/" className={location.pathname === '/' ? 'active' : ''} onClick={() => setMenuOpen(false)}>Dashboard</Link>
        <Link to="/ai-assistant" className={location.pathname === '/ai-assistant' ? 'active' : ''} onClick={() => setMenuOpen(false)}>AI Assistant</Link>
        <Link to="/medication-interaction-alert" className={location.pathname === '/medication-interaction-alert' ? 'active' : ''} onClick={() => setMenuOpen(false)}>Med Interactions</Link>
        <Link to="/caregiver-chat" className={location.pathname === '/caregiver-chat' ? 'active' : ''} onClick={() => setMenuOpen(false)}>Care Chat</Link>
        {user && ['admin', 'nurse'].includes(user.role) && (
          <Link to="/hipaa-audit-log" className={location.pathname === '/hipaa-audit-log' ? 'active' : ''} onClick={() => setMenuOpen(false)}>Audit Log</Link>
        )}
        <div className="navbar-user">
          <span className="user-info">{user?.name} ({user?.role})</span>
          <button onClick={onLogout} className="logout-btn">Logout</button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
