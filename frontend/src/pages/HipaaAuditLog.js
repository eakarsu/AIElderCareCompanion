import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export default function HipaaAuditLog({ token, user }) {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ action: '', entity_type: '', patient: '' });

  const load = async () => {
    setLoading(true); setError('');
    try {
      const qs = new URLSearchParams({ page, limit: 50, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) });
      const r = await fetch(`${API}/audit-log?${qs}`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await r.json();
      if (!r.ok) throw new Error(json.error || 'Failed to load');
      setData(json.data || []);
      setPagination(json.pagination || {});
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page, filters]);

  if (user && !['admin', 'nurse'].includes(user.role)) {
    return (
      <div style={{ padding: 24 }}>
        <h1>HIPAA Audit Log</h1>
        <div style={{ background: '#fee2e2', color: '#991b1b', padding: 16, borderRadius: 8 }}>
          Access denied. Admin or Nurse role required.
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <button onClick={() => navigate('/')} style={{ marginBottom: 16 }}>&larr; Dashboard</button>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>HIPAA Audit Log</h1>
      <p style={{ color: '#6b7280' }}>Tracks every PHI access and AI analysis. Required for HIPAA compliance audits.</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <input placeholder="Action (e.g. AI_ANALYSIS)" value={filters.action} onChange={(e) => { setFilters({ ...filters, action: e.target.value }); setPage(1); }} style={{ padding: 8, border: '1px solid #d1d5db', borderRadius: 4 }} />
        <input placeholder="Entity type" value={filters.entity_type} onChange={(e) => { setFilters({ ...filters, entity_type: e.target.value }); setPage(1); }} style={{ padding: 8, border: '1px solid #d1d5db', borderRadius: 4 }} />
        <input placeholder="Patient identifier" value={filters.patient} onChange={(e) => { setFilters({ ...filters, patient: e.target.value }); setPage(1); }} style={{ padding: 8, border: '1px solid #d1d5db', borderRadius: 4 }} />
        <button onClick={load} style={{ padding: '8px 14px', background: '#4F46E5', color: 'white', border: 'none', borderRadius: 4 }}>Refresh</button>
      </div>

      {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: 12, borderRadius: 6 }}>{error}</div>}
      {loading ? <div>Loading...</div> : (
        <>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f3f4f6', textAlign: 'left' }}>
                <th style={{ padding: 8 }}>When</th>
                <th style={{ padding: 8 }}>User</th>
                <th style={{ padding: 8 }}>Role</th>
                <th style={{ padding: 8 }}>Action</th>
                <th style={{ padding: 8 }}>Entity</th>
                <th style={{ padding: 8 }}>Patient</th>
                <th style={{ padding: 8 }}>IP</th>
                <th style={{ padding: 8 }}>Redacted?</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: 8 }}>{new Date(row.created_at).toLocaleString()}</td>
                  <td style={{ padding: 8 }}>{row.user_email || row.user_id || '-'}</td>
                  <td style={{ padding: 8 }}>{row.user_role || '-'}</td>
                  <td style={{ padding: 8 }}><code>{row.action}</code></td>
                  <td style={{ padding: 8 }}>{row.entity_type}{row.entity_id ? ` #${row.entity_id}` : ''}</td>
                  <td style={{ padding: 8 }}>{row.patient_identifier || '-'}</td>
                  <td style={{ padding: 8, fontSize: 11, color: '#6b7280' }}>{row.ip_address || '-'}</td>
                  <td style={{ padding: 8 }}>
                    {row.phi_redacted ? <span style={{ color: '#16a34a' }}>YES</span> : <span style={{ color: '#dc2626' }}>NO</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {pagination.totalPages > 1 && (
            <div style={{ marginTop: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} style={{ padding: '6px 12px' }}>Prev</button>
              <span>Page {pagination.page} of {pagination.totalPages} ({pagination.total} entries)</span>
              <button disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)} style={{ padding: '6px 12px' }}>Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
