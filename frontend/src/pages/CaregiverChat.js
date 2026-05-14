import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

/**
 * Multi-turn AI chat for caregivers with conversation persistence.
 * The backend persists chat_history per conversation_id and includes the
 * last 6 messages as context. PHI is redacted before being sent to the AI.
 */
export default function CaregiverChat({ token }) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [patientId, setPatientId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', content: input };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setLoading(true);
    setError('');
    try {
      const r = await fetch(`${API}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          message: userMsg.content,
          conversation_id: conversationId,
          patient_id: patientId || null
        })
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Chat failed');
      setConversationId(data.conversation_id);
      setMessages((m) => [...m, { role: 'assistant', content: data.response }]);
    } catch (e) {
      setError(e.message);
      setMessages((m) => [...m, { role: 'system', content: 'Error: ' + e.message }]);
    } finally {
      setLoading(false);
    }
  };

  const startNew = () => {
    setMessages([]);
    setConversationId(null);
  };

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto', height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column' }}>
      <button onClick={() => navigate('/')} style={{ marginBottom: 16, alignSelf: 'flex-start' }}>&larr; Dashboard</button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>AI Care Chat</h1>
          <div style={{ fontSize: 12, color: '#6b7280' }}>
            Conversation: {conversationId || 'new'} &middot; PHI redacted before AI calls
          </div>
        </div>
        <button onClick={startNew} style={{ padding: '6px 14px', background: '#e5e7eb', border: 'none', borderRadius: 6 }}>New Conversation</button>
      </div>

      <input
        value={patientId}
        onChange={(e) => setPatientId(e.target.value)}
        placeholder="Patient context (optional)"
        style={{ padding: 8, marginBottom: 8, border: '1px solid #d1d5db', borderRadius: 6 }}
      />

      <div style={{ flex: 1, overflowY: 'auto', padding: 16, background: '#f9fafb', borderRadius: 8, marginBottom: 12 }}>
        {messages.length === 0 && (
          <div style={{ color: '#9ca3af', textAlign: 'center', padding: 40 }}>
            Ask a question to get started. Examples:<br />
            <em>"What signs of cognitive decline should I watch for?"</em><br />
            <em>"How do I help with sundowning behavior?"</em>
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              margin: '8px 0',
              padding: 12,
              borderRadius: 8,
              background: m.role === 'user' ? '#dbeafe' : m.role === 'system' ? '#fee2e2' : '#fff',
              border: '1px solid ' + (m.role === 'user' ? '#bfdbfe' : m.role === 'system' ? '#fecaca' : '#e5e7eb')
            }}
          >
            <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4, textTransform: 'uppercase' }}>{m.role}</div>
            <div style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>
          </div>
        ))}
        {loading && <div style={{ color: '#6b7280', fontStyle: 'italic' }}>AI is thinking...</div>}
        <div ref={bottomRef} />
      </div>

      {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: 8, borderRadius: 4, marginBottom: 8 }}>{error}</div>}

      <div style={{ display: 'flex', gap: 8 }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Type your question (Enter to send, Shift+Enter for newline)"
          rows={2}
          style={{ flex: 1, padding: 10, border: '1px solid #d1d5db', borderRadius: 6, resize: 'none' }}
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          style={{ padding: '10px 24px', background: '#4F46E5', color: 'white', border: 'none', borderRadius: 6, cursor: loading ? 'wait' : 'pointer' }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
