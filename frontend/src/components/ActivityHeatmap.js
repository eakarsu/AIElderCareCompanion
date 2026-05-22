import React, { useState, useEffect } from 'react';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export default function ActivityHeatmap({ token, patient = 'Eleanor Williams' }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const r = await fetch(`${API}/custom-views/activity-heatmap?patient=${encodeURIComponent(patient)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || 'failed');
        if (!cancel) setData(j);
      } catch (e) { if (!cancel) setError(e.message); }
    })();
    return () => { cancel = true; };
  }, [token, patient]);

  if (error) return <div style={{ color: '#b91c1c', padding: 12 }}>Error: {error}</div>;
  if (!data) return <div style={{ padding: 12 }}>Loading activity heatmap...</div>;

  const colorFor = v => {
    const t = v / data.max;
    const r = Math.round(255 - 145 * t);
    const g = Math.round(247 - 64 * t);
    const b = Math.round(237 - 100 * t);
    return `rgb(${r},${g},${b})`;
  };

  return (
    <div data-testid="activity-heatmap" style={{ background: '#fff', padding: 16, borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
      <h3 style={{ margin: '0 0 8px', color: '#7c3aed' }}>Activity Engagement Heatmap</h3>
      <div style={{ fontSize: 13, color: '#64748b', marginBottom: 10 }}>
        Patient: <strong>{data.patient}</strong> | Total weekly engagement score: {data.total_engagement}
      </div>
      <table style={{ borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr>
            <th style={{ padding: '4px 8px', textAlign: 'left' }}></th>
            {data.days.map(d => <th key={d} style={{ padding: '4px 8px' }}>{d}</th>)}
          </tr>
        </thead>
        <tbody>
          {data.grid.map(row => (
            <tr key={row.activity}>
              <td style={{ padding: '4px 8px', fontWeight: 600 }}>{row.activity}</td>
              {row.values.map((v, i) => (
                <td key={i} style={{
                  padding: 0,
                  width: 44,
                  height: 30,
                  background: colorFor(v),
                  textAlign: 'center',
                  border: '1px solid #f1f5f9',
                  color: v > 6 ? '#fff' : '#334155',
                }}>{v}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 10, fontSize: 11, color: '#64748b' }}>Scale: 0 (none) → 10 (high engagement)</div>
    </div>
  );
}
