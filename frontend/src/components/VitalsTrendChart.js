import React, { useState, useEffect } from 'react';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export default function VitalsTrendChart({ token, patient = 'Eleanor Williams' }) {
  const [data, setData] = useState(null);
  const [days, setDays] = useState(14);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const r = await fetch(`${API}/custom-views/vitals-trend?patient=${encodeURIComponent(patient)}&days=${days}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || 'failed');
        if (!cancel) setData(j);
      } catch (e) { if (!cancel) setError(e.message); }
    })();
    return () => { cancel = true; };
  }, [token, patient, days]);

  if (error) return <div style={{ color: '#b91c1c', padding: 12 }}>Error: {error}</div>;
  if (!data) return <div style={{ padding: 12 }}>Loading vitals trend...</div>;

  const W = 640, H = 240, pad = 36;
  const n = data.series.labels.length;
  const xStep = (W - pad * 2) / Math.max(1, n - 1);
  const allHR = data.series.HR;
  const allSBP = data.series.SBP;
  const allDBP = data.series.DBP;
  const allSpO2 = data.series.SpO2;
  const yMin = 50, yMax = 170;
  const ym = v => H - pad - ((v - yMin) / (yMax - yMin)) * (H - pad * 2);
  const xm = i => pad + i * xStep;
  const toPath = arr => arr.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xm(i).toFixed(1)} ${ym(v).toFixed(1)}`).join(' ');

  return (
    <div data-testid="vitals-trend-chart" style={{ background: '#fff', padding: 16, borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h3 style={{ margin: 0, color: '#0f766e' }}>Vitals Trend (HR / BP / SpO2)</h3>
        <select value={days} onChange={e => setDays(parseInt(e.target.value))} style={{ padding: 4 }}>
          <option value={7}>7d</option>
          <option value={14}>14d</option>
          <option value={30}>30d</option>
        </select>
      </div>
      <div style={{ fontSize: 13, color: '#64748b', marginBottom: 6 }}>
        Patient: <strong>{data.patient}</strong> | Avg HR {data.summary.HR_avg} | BP {data.summary.SBP_avg}/{data.summary.DBP_avg} | SpO2 {data.summary.SpO2_avg}%
      </div>
      <svg width={W} height={H} style={{ maxWidth: '100%' }}>
        <rect x={0} y={0} width={W} height={H} fill="#f8fafc" />
        {[60, 80, 100, 120, 140, 160].map(v => (
          <line key={v} x1={pad} x2={W - pad} y1={ym(v)} y2={ym(v)} stroke="#e2e8f0" />
        ))}
        <path d={toPath(allHR)} fill="none" stroke="#dc2626" strokeWidth={2} />
        <path d={toPath(allSBP)} fill="none" stroke="#2563eb" strokeWidth={2} />
        <path d={toPath(allDBP)} fill="none" stroke="#0891b2" strokeWidth={2} />
        <path d={toPath(allSpO2)} fill="none" stroke="#16a34a" strokeWidth={2} strokeDasharray="4 2" />
        {data.series.labels.map((l, i) => (
          i % Math.ceil(n / 7) === 0 ? <text key={i} x={xm(i)} y={H - 10} fontSize={10} textAnchor="middle" fill="#64748b">{l}</text> : null
        ))}
      </svg>
      <div style={{ display: 'flex', gap: 12, fontSize: 12, marginTop: 6 }}>
        <span style={{ color: '#dc2626' }}>● HR</span>
        <span style={{ color: '#2563eb' }}>● SBP</span>
        <span style={{ color: '#0891b2' }}>● DBP</span>
        <span style={{ color: '#16a34a' }}>● SpO2</span>
      </div>
    </div>
  );
}
