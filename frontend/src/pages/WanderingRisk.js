import React, { useEffect, useState } from 'react';

function WanderingRisk({ token }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/api/wandering-risk', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then(setData)
      .catch(() => setData(null));
  }, [token]);

  if (!data) return <div className="feature-page"><h1>Wandering Risk</h1><p>Loading risk review...</p></div>;

  return (
    <div className="feature-page">
      <h1>Wandering Risk</h1>
      <p>Combine door events, sleep changes, cognitive routines, and care-plan signals into a resident risk queue.</p>
      <div className="feature-grid">
        {Object.entries(data.summary).map(([key, value]) => (
          <div className="feature-card" key={key}>
            <h3>{value}</h3>
            <p>{key.replace(/([A-Z])/g, ' $1')}</p>
          </div>
        ))}
      </div>
      <div className="feature-grid">
        <section className="feature-card">
          <h2>Risk Signals</h2>
          {data.signals.map((signal) => (
            <div key={signal.signal} className="activity-item">
              <strong>{signal.signal}</strong>
              <p>{signal.weight} weight - {signal.observation}</p>
            </div>
          ))}
        </section>
        <section className="feature-card">
          <h2>Resident Queue</h2>
          {data.residents.map((resident) => (
            <div key={resident.name} className="activity-item">
              <strong>{resident.name} - {resident.risk}</strong>
              <p>{resident.lastSignal}</p>
              <small>{resident.action}</small>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

export default WanderingRisk;
