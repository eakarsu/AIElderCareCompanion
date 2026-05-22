import React, { useState } from 'react';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export default function WeeklyCareSummaryPDF({ token, patient = 'Eleanor Williams' }) {
  const [downloading, setDownloading] = useState(false);
  const [status, setStatus] = useState('');
  const [lastUrl, setLastUrl] = useState('');

  const download = async () => {
    setDownloading(true);
    setStatus('');
    try {
      const r = await fetch(`${API}/custom-views/weekly-summary-pdf?patient=${encodeURIComponent(patient)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      setLastUrl(url);
      const a = document.createElement('a');
      a.href = url;
      a.download = `weekly_care_${patient.replace(/\s+/g, '_')}.pdf`;
      a.click();
      setStatus(`Downloaded (${Math.round(blob.size / 1024)} KB)`);
    } catch (e) { setStatus(`Error: ${e.message}`); }
    finally { setDownloading(false); }
  };

  return (
    <div data-testid="weekly-summary-pdf" style={{ background: '#fff', padding: 16, borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
      <h3 style={{ margin: '0 0 8px', color: '#b45309' }}>Weekly Care Summary PDF</h3>
      <p style={{ fontSize: 13, color: '#64748b', marginTop: 0 }}>
        Generates a one-page PDF report with vitals averages, medication adherence, activities, incidents, and active care plan rules for <strong>{patient}</strong>.
      </p>
      <button
        onClick={download}
        disabled={downloading}
        style={{
          padding: '10px 16px',
          background: '#b45309',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          cursor: 'pointer',
          fontWeight: 600,
        }}
      >
        {downloading ? 'Generating...' : 'Download Weekly Summary PDF'}
      </button>
      {status && <div style={{ marginTop: 8, fontSize: 13, color: status.startsWith('Error') ? '#b91c1c' : '#15803d' }}>{status}</div>}
      {lastUrl && (
        <div style={{ marginTop: 6, fontSize: 12 }}>
          <a href={lastUrl} target="_blank" rel="noreferrer">Open last PDF in new tab</a>
        </div>
      )}
    </div>
  );
}
