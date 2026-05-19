import React, { useState } from 'react';
import VitalsTrendChart from '../components/VitalsTrendChart';
import ActivityHeatmap from '../components/ActivityHeatmap';
import WeeklyCareSummaryPDF from '../components/WeeklyCareSummaryPDF';
import CarePlanRulesEditor from '../components/CarePlanRulesEditor';

const PATIENTS = ['Eleanor Williams', 'Robert Thompson', 'Margaret Davis', 'James Wilson', 'Betty Anderson', 'Harold Martinez'];

export default function CustomViewsPage({ token }) {
  const [patient, setPatient] = useState(PATIENTS[0]);

  return (
    <div data-testid="custom-views-page" style={{ padding: 24, maxWidth: 1280, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, color: '#0f172a' }}>Care Views</h1>
          <p style={{ margin: '4px 0 0', color: '#64748b' }}>Custom dashboards for vitals, engagement, summaries, and care plan rules.</p>
        </div>
        <div>
          <label style={{ fontSize: 13, marginRight: 8, color: '#475569' }}>Patient:</label>
          <select value={patient} onChange={e => setPatient(e.target.value)} style={{ padding: 6, borderRadius: 4, border: '1px solid #cbd5e1' }}>
            {PATIENTS.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <VitalsTrendChart token={token} patient={patient} />
        <ActivityHeatmap token={token} patient={patient} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
        <WeeklyCareSummaryPDF token={token} patient={patient} />
        <CarePlanRulesEditor token={token} />
      </div>
    </div>
  );
}
