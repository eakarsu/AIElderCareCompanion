import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const severityColor = (s) => ({
  minor: '#16a34a',
  moderate: '#ca8a04',
  major: '#ea580c',
  contraindicated: '#dc2626',
  low: '#16a34a',
  high: '#dc2626',
  critical: '#7f1d1d'
})[(s || '').toLowerCase()] || '#6b7280';

export default function MedicationInteractionAlert({ token }) {
  const navigate = useNavigate();
  const [patientId, setPatientId] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const runCheck = async () => {
    if (!patientId) { setError('Patient ID/name required'); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      const r = await fetch(`${API}/ai/medication-interaction-alert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ patient_id: patientId })
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Request failed');
      setResult(data);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <button onClick={() => navigate('/')} style={{ marginBottom: 16 }}>&larr; Dashboard</button>
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>Medication Interaction Alert</h1>
      <p style={{ color: '#6b7280' }}>AI-powered drug interaction analysis using all active medications for a patient. Patient names are PHI-redacted before sending to the AI provider.</p>

      <div style={{ display: 'flex', gap: 12, marginTop: 24, marginBottom: 24, padding: 16, background: '#f9fafb', borderRadius: 8 }}>
        <input
          value={patientId}
          onChange={(e) => setPatientId(e.target.value)}
          placeholder="Patient ID or Name (e.g. Eleanor Williams)"
          style={{ flex: 1, padding: 10, border: '1px solid #d1d5db', borderRadius: 6 }}
        />
        <button
          onClick={runCheck}
          disabled={loading}
          style={{ padding: '10px 20px', background: '#4F46E5', color: 'white', border: 'none', borderRadius: 6, cursor: loading ? 'wait' : 'pointer' }}
        >
          {loading ? 'Analyzing...' : 'Run Interaction Check'}
        </button>
      </div>

      {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: 12, borderRadius: 6 }}>{error}</div>}

      {result && (
        <div>
          <div style={{
            background: severityColor(result.analysis?.overall_risk),
            color: 'white', padding: 16, borderRadius: 8, marginBottom: 16
          }}>
            <div style={{ fontSize: 12, opacity: 0.9 }}>OVERALL RISK</div>
            <div style={{ fontSize: 24, fontWeight: 700, textTransform: 'uppercase' }}>{result.analysis?.overall_risk || 'Unknown'}</div>
            <div style={{ marginTop: 8 }}>{result.analysis?.summary}</div>
          </div>

          {result.analysis?.urgent_review_needed && (
            <div style={{ background: '#fef2f2', border: '2px solid #dc2626', color: '#991b1b', padding: 12, borderRadius: 8, marginBottom: 16, fontWeight: 600 }}>
              URGENT: Physician review needed
            </div>
          )}

          <h3 style={{ marginTop: 24 }}>Active Medications ({result.medication_count})</h3>
          <ul>
            {(result.medications || []).map((m, i) => (
              <li key={i}><strong>{m.medication_name}</strong> &mdash; {m.dosage} ({m.frequency})</li>
            ))}
          </ul>

          <h3 style={{ marginTop: 24 }}>Interactions ({result.analysis?.interactions?.length || 0})</h3>
          {(result.analysis?.interactions || []).map((it, i) => (
            <div key={i} style={{ borderLeft: `4px solid ${severityColor(it.severity)}`, padding: 12, margin: '8px 0', background: '#f9fafb', borderRadius: 4 }}>
              <div style={{ fontWeight: 600 }}>{it.drug_a} &harr; {it.drug_b} &mdash; <span style={{ color: severityColor(it.severity) }}>{it.severity?.toUpperCase()}</span> (score {it.severity_score}/10)</div>
              <div style={{ marginTop: 4 }}><strong>Effect:</strong> {it.clinical_effect}</div>
              <div><strong>Recommendation:</strong> {it.recommendation}</div>
            </div>
          ))}

          {(result.analysis?.timing_conflicts || []).length > 0 && (
            <>
              <h3 style={{ marginTop: 24 }}>Timing Conflicts</h3>
              {result.analysis.timing_conflicts.map((tc, i) => (
                <div key={i} style={{ padding: 12, margin: '8px 0', background: '#fef3c7', borderRadius: 4 }}>
                  <div><strong>{(tc.medications || []).join(' + ')}</strong></div>
                  <div>{tc.issue}</div>
                  <div style={{ marginTop: 4 }}><em>{tc.recommendation}</em></div>
                </div>
              ))}
            </>
          )}

          <h3 style={{ marginTop: 24 }}>Monitoring Required</h3>
          <ul>{(result.analysis?.monitoring_required || []).map((m, i) => <li key={i}>{m}</li>)}</ul>

          <div style={{ marginTop: 24, padding: 12, background: '#f3f4f6', borderRadius: 6, fontSize: 12, color: '#6b7280' }}>
            Model: {result.model} &middot; PHI redacted before AI call
          </div>
        </div>
      )}
    </div>
  );
}
