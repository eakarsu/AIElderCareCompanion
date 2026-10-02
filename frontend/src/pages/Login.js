import React, { useState } from 'react';

function __demoAutofill() {
  (async () => {
    let email = "";
    let password = "";
    try {
      const response = await fetch("/api/auth/demo-credentials", { cache: "no-store" });
      if (response.ok) {
        const data = await response.json();
        email = data.email || data.username || "";
        password = data.password || "";
      }
    } catch (error) {
      /* fall back to build-time credentials below */
    }
    if (!email || !password) {
      const env = (typeof process !== "undefined" && process.env) ? process.env : {};
      email = email || env.REACT_APP_DEMO_EMAIL || env.VITE_DEMO_EMAIL || "";
      password = password || env.REACT_APP_DEMO_PASSWORD || env.VITE_DEMO_PASSWORD || "";
    }
    const form = document.querySelector("form");
    const setValue = (element, value) => {
      if (!element) return;
      const prototype = element.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(prototype, "value").set;
      setter.call(element, value);
      element.dispatchEvent(new Event("input", { bubbles: true }));
    };
    const scope = form || document;
    setValue(scope.querySelector('input[type="email"], input[name="email"], input[name="username"]') || scope.querySelectorAll("input")[0], email);
    setValue(scope.querySelector('input[type="password"], input[name="password"]') || scope.querySelectorAll("input")[1], password);
    window.setTimeout(() => {
      if (form && typeof form.requestSubmit === "function") {
        form.requestSubmit();
      } else {
        const submit = scope.querySelector('button[type="submit"], input[type="submit"]');
        if (submit) submit.click();
      }
    }, 50);
  })();
}

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
const demoPassword = process.env.REACT_APP_ENABLE_DEMO_CREDENTIAL_AUTOFILL === 'true'
  ? process.env.REACT_APP_DEMO_PASSWORD || ''
  : '';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      onLogin(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (role) => {
    const creds = {
      admin: { email: 'admin@eldercare.com', password: demoPassword },
      nurse: { email: 'nurse@eldercare.com', password: demoPassword },
      caregiver: { email: 'caregiver@eldercare.com', password: demoPassword },
    };
    setEmail(creds[role].email);
    setPassword(creds[role].password);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <div className="login-logo">&#x1F3E5;</div>
          <h1>AI Elder Care Companion</h1>
          <p>Comprehensive care management powered by artificial intelligence</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="quick-login">
          <p>Quick Login:</p>
          <div className="quick-login-buttons">
            <button onClick={__demoAutofill} className="quick-btn admin">
              Auto Fill Demo Credentials
            </button>
            <button disabled={!demoPassword} onClick={() => fillCredentials('nurse')} className="quick-btn nurse">
              Nurse
            </button>
            <button disabled={!demoPassword} onClick={() => fillCredentials('caregiver')} className="quick-btn caregiver">
              Caregiver
            </button>
          </div>
        </div>

        <div className="login-features">
          <div className="feature-item">
            <span>&#x1F48A;</span>
            <span>Medication Management</span>
          </div>
          <div className="feature-item">
            <span>&#x26A0;</span>
            <span>Fall Detection</span>
          </div>
          <div className="feature-item">
            <span>&#x1F916;</span>
            <span>AI-Powered Insights</span>
          </div>
          <div className="feature-item">
            <span>&#x2764;</span>
            <span>Holistic Care</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
