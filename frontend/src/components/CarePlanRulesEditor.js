import React, { useState, useEffect, useCallback } from 'react';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const EMPTY = { patient: 'Eleanor Williams', type: 'medication', name: '', schedule: '08:00', alert: '', priority: 'medium', active: true };

export default function CarePlanRulesEditor({ token }) {
  const [rules, setRules] = useState([]);
  const [draft, setDraft] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/custom-views/care-rules`, { headers: { Authorization: `Bearer ${token}` } });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'failed');
      setRules(j.rules || []);
    } catch (e) { setStatus(`Error: ${e.message}`); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setStatus('');
    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId
        ? `${API}/custom-views/care-rules/${editingId}`
        : `${API}/custom-views/care-rules`;
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(draft),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'save failed');
      setDraft(EMPTY); setEditingId(null); setStatus(editingId ? 'Updated' : 'Created');
      load();
    } catch (e) { setStatus(`Error: ${e.message}`); }
  };

  const remove = async (id) => {
    try {
      const r = await fetch(`${API}/custom-views/care-rules/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error('delete failed');
      setStatus('Deleted'); load();
    } catch (e) { setStatus(`Error: ${e.message}`); }
  };

  const startEdit = (r) => { setDraft(r); setEditingId(r.id); };

  return (
    <div data-testid="care-plan-rules-editor" style={{ background: '#fff', padding: 16, borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
      <h3 style={{ margin: '0 0 8px', color: '#0f766e' }}>Care Plan Rules Editor</h3>
      <p style={{ fontSize: 13, color: '#64748b', marginTop: 0 }}>Manage medication schedules, activity rules, and alert triggers.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 8 }}>
        <input placeholder="Patient" value={draft.patient} onChange={e => setDraft({ ...draft, patient: e.target.value })} style={{ padding: 6 }} />
        <select value={draft.type} onChange={e => setDraft({ ...draft, type: e.target.value })} style={{ padding: 6 }}>
          <option>medication</option><option>activity</option><option>check</option>
        </select>
        <input placeholder="Name" value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} style={{ padding: 6 }} />
        <input placeholder="Schedule HH:MM,HH:MM" value={draft.schedule} onChange={e => setDraft({ ...draft, schedule: e.target.value })} style={{ padding: 6 }} />
        <input placeholder="Alert message" value={draft.alert} onChange={e => setDraft({ ...draft, alert: e.target.value })} style={{ padding: 6, gridColumn: 'span 2' }} />
        <select value={draft.priority} onChange={e => setDraft({ ...draft, priority: e.target.value })} style={{ padding: 6 }}>
          <option>low</option><option>medium</option><option>high</option>
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          <input type="checkbox" checked={draft.active} onChange={e => setDraft({ ...draft, active: e.target.checked })} />
          Active
        </label>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button onClick={save} style={{ padding: '8px 14px', background: '#0f766e', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
          {editingId ? 'Update Rule' : 'Add Rule'}
        </button>
        {editingId && (
          <button onClick={() => { setDraft(EMPTY); setEditingId(null); }} style={{ padding: '8px 14px', background: '#64748b', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
            Cancel
          </button>
        )}
        {status && <span style={{ fontSize: 13, alignSelf: 'center', color: status.startsWith('Error') ? '#b91c1c' : '#15803d' }}>{status}</span>}
      </div>

      <div style={{ maxHeight: 280, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 6 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead style={{ background: '#f1f5f9' }}>
            <tr>
              <th style={{ padding: 6, textAlign: 'left' }}>Patient</th>
              <th style={{ padding: 6, textAlign: 'left' }}>Type</th>
              <th style={{ padding: 6, textAlign: 'left' }}>Name</th>
              <th style={{ padding: 6, textAlign: 'left' }}>Schedule</th>
              <th style={{ padding: 6, textAlign: 'left' }}>Priority</th>
              <th style={{ padding: 6 }}>Active</th>
              <th style={{ padding: 6 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={7} style={{ padding: 12, textAlign: 'center' }}>Loading...</td></tr>}
            {!loading && rules.length === 0 && <tr><td colSpan={7} style={{ padding: 12, textAlign: 'center' }}>No rules</td></tr>}
            {rules.map(r => (
              <tr key={r.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                <td style={{ padding: 6 }}>{r.patient}</td>
                <td style={{ padding: 6 }}>{r.type}</td>
                <td style={{ padding: 6 }}>{r.name}</td>
                <td style={{ padding: 6 }}>{r.schedule}</td>
                <td style={{ padding: 6 }}>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: 4,
                    background: r.priority === 'high' ? '#fee2e2' : r.priority === 'medium' ? '#fef3c7' : '#dbeafe',
                    color: r.priority === 'high' ? '#991b1b' : r.priority === 'medium' ? '#92400e' : '#1e40af',
                  }}>{r.priority}</span>
                </td>
                <td style={{ padding: 6, textAlign: 'center' }}>{r.active ? 'Yes' : 'No'}</td>
                <td style={{ padding: 6 }}>
                  <button onClick={() => startEdit(r)} style={{ padding: '4px 8px', marginRight: 4, fontSize: 12 }}>Edit</button>
                  <button onClick={() => remove(r.id)} style={{ padding: '4px 8px', fontSize: 12, background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
