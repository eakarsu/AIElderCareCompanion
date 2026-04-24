import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const aiFeatures = [
  { key: 'medication-analysis', title: 'Medication Analysis', icon: '\uD83D\uDC8A', desc: 'Analyze drug interactions and recommendations', color: '#4F46E5' },
  { key: 'fall-risk-assessment', title: 'Fall Risk Assessment', icon: '\u26A0\uFE0F', desc: 'Evaluate fall risk and prevention strategies', color: '#DC2626' },
  { key: 'health-summary', title: 'Health Summary', icon: '\uD83E\uDE7A', desc: 'Generate comprehensive health overview', color: '#0891B2' },
  { key: 'social-recommendations', title: 'Social Recommendations', icon: '\uD83E\uDD1D', desc: 'Personalized social activity suggestions', color: '#059669' },
  { key: 'meal-plan', title: 'Meal Plan Generator', icon: '\uD83C\uDF4E', desc: 'Create nutritious meal plans', color: '#EA580C' },
  { key: 'cognitive-exercises', title: 'Cognitive Exercise Ideas', icon: '\uD83E\uDDE0', desc: 'AI-generated brain exercises', color: '#9333EA' },
  { key: 'sleep-analysis', title: 'Sleep Analysis', icon: '\uD83D\uDE34', desc: 'Analyze sleep patterns and quality', color: '#4338CA' },
  { key: 'mood-insights', title: 'Mood & Mental Health', icon: '\uD83D\uDE0A', desc: 'Mental health insights and support', color: '#CA8A04' },
  { key: 'safety-evaluation', title: 'Home Safety Evaluation', icon: '\uD83C\uDFE0', desc: 'AI-powered safety assessment', color: '#D97706' },
  { key: 'care-plan', title: 'Care Plan Generator', icon: '\uD83D\uDCCB', desc: 'Comprehensive care plan creation', color: '#0F766E' },
  { key: 'chat', title: 'General AI Chat', icon: '\uD83E\uDD16', desc: 'Ask any elder care question', color: '#6D28D9' },
];

const defaultPrompts = {
  'medication-analysis': { medications: ['Lisinopril 10mg', 'Metformin 500mg', 'Aspirin 81mg'], patient_info: { age: 78, name: 'Eleanor Williams', conditions: ['hypertension', 'type 2 diabetes'] } },
  'fall-risk-assessment': { patient_data: { name: 'Robert Thompson', age: 82, mobility: 'moderate limitations', vision: 'uses glasses', medications_count: 4 }, history: [{ date: '2024-11-14', location: 'Bedroom', severity: 'medium' }] },
  'health-summary': { patient_name: 'Margaret Davis', vitals: [{ type: 'Blood Pressure', value: '142/88', status: 'elevated' }, { type: 'Heart Rate', value: '72 bpm', status: 'normal' }, { type: 'Oxygen', value: '96%', status: 'normal' }] },
  'social-recommendations': { patient_profile: { name: 'James Wilson', age: 80, interests: ['music', 'gardening', 'chess'], mobility: 'good', cognitive_status: 'mild decline' }, current_activities: ['chess', 'garden maintenance'] },
  'meal-plan': { dietary_needs: { calories: 1800, protein: 'adequate', fiber: 'high' }, restrictions: ['low sodium', 'diabetic-friendly'], preferences: { cuisine: 'American', dislikes: ['spicy food'] } },
  'cognitive-exercises': { difficulty: 'medium', interests: ['history', 'music', 'puzzles'], cognitive_status: 'mild cognitive impairment' },
  'sleep-analysis': { sleep_data: [{ date: '2024-11-15', hours: 6.5, quality: 'poor', interruptions: 3 }, { date: '2024-11-14', hours: 8.0, quality: 'fair', interruptions: 2 }], patient_info: { name: 'Betty Anderson', age: 85, conditions: ['CHF', 'anxiety'] } },
  'mood-insights': { mood_data: [{ date: '2024-11-15', mood: 'sad', energy: 3, anxiety: 5 }, { date: '2024-11-14', mood: 'grateful', energy: 6, anxiety: 3 }], patient_info: { name: 'Betty Anderson', age: 85, social_support: 'limited' } },
  'safety-evaluation': { home_data: { rooms: ['bathroom', 'bedroom', 'kitchen', 'stairs'], known_hazards: ['wet bathroom floor', 'uneven stairs'] }, patient_mobility: { uses_walker: false, balance_issues: true, vision_impaired: false } },
  'care-plan': { patient_profile: { name: 'Harold Martinez', age: 79, conditions: ['dementia', 'diabetes', 'neuropathy'] }, conditions: ['vascular dementia', 'type 2 diabetes'], goals: ['maintain cognitive function', 'manage blood sugar', 'prevent falls'] },
  'chat': { message: '' },
};

const formatAIResponse = (text) => {
  if (!text) return null;
  const lines = text.split('\n');
  const elements = [];
  let currentList = [];
  let listType = null;

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="ai-list">
          {currentList.map((item, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: item.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
          ))}
        </ul>
      );
      currentList = [];
    }
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList();
      return;
    }
    if (trimmed.startsWith('### ')) {
      flushList();
      elements.push(<h4 key={idx} className="ai-h4">{trimmed.slice(4)}</h4>);
    } else if (trimmed.startsWith('## ')) {
      flushList();
      elements.push(<h3 key={idx} className="ai-h3">{trimmed.slice(3)}</h3>);
    } else if (trimmed.startsWith('# ')) {
      flushList();
      elements.push(<h2 key={idx} className="ai-h2">{trimmed.slice(2)}</h2>);
    } else if (trimmed.match(/^\d+\.\s/) || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const content = trimmed.replace(/^(\d+\.\s|-\s|\*\s)/, '');
      currentList.push(content);
    } else if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
      flushList();
      elements.push(<p key={idx} className="ai-bold"><strong>{trimmed.slice(2, -2)}</strong></p>);
    } else {
      flushList();
      elements.push(
        <p key={idx} className="ai-text" dangerouslySetInnerHTML={{ __html: trimmed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
      );
    }
  });
  flushList();
  return elements;
};

const AIAssistant = ({ token }) => {
  const navigate = useNavigate();
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [chatMessage, setChatMessage] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAnalyze = async (featureKey) => {
    setLoading(true);
    setError('');
    setResponse(null);

    try {
      let body = defaultPrompts[featureKey];
      if (featureKey === 'chat') {
        if (!chatMessage.trim()) {
          setError('Please enter a message');
          setLoading(false);
          return;
        }
        body = { message: chatMessage, context: { type: 'elder_care_consultation' } };
      }

      const res = await fetch(`${API}/ai/${featureKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI request failed');
      setResponse(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getResponseContent = () => {
    if (!response) return null;
    return response.analysis || response.assessment || response.summary ||
           response.recommendations || response.plan || response.exercises ||
           response.insights || response.evaluation || response.response;
  };

  return (
    <div className="ai-assistant-page">
      <div className="feature-header">
        <div className="feature-header-left">
          <button className="back-btn" onClick={() => navigate('/')}>&#x2190; Dashboard</button>
          <h1>AI Care Assistant</h1>
        </div>
      </div>

      {!selectedFeature ? (
        <div className="ai-grid">
          {aiFeatures.map((f) => (
            <div
              key={f.key}
              className="ai-card"
              onClick={() => setSelectedFeature(f)}
              style={{ borderLeftColor: f.color }}
            >
              <div className="ai-card-icon" style={{ color: f.color }}>{f.icon}</div>
              <div className="ai-card-content">
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
              <div className="ai-card-arrow" style={{ color: f.color }}>&#x2192;</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="ai-detail">
          <button className="back-btn" onClick={() => { setSelectedFeature(null); setResponse(null); setError(''); }}>
            &#x2190; Back to AI Features
          </button>

          <div className="ai-feature-header" style={{ borderLeftColor: selectedFeature.color }}>
            <span className="ai-feature-icon" style={{ color: selectedFeature.color }}>{selectedFeature.icon}</span>
            <div>
              <h2>{selectedFeature.title}</h2>
              <p>{selectedFeature.desc}</p>
            </div>
          </div>

          {selectedFeature.key === 'chat' && (
            <div className="chat-input-area">
              <textarea
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Ask any elder care question... e.g., 'What are the best exercises for elderly patients with arthritis?'"
                rows={4}
                className="chat-textarea"
              />
            </div>
          )}

          <button
            className="analyze-btn"
            onClick={() => handleAnalyze(selectedFeature.key)}
            disabled={loading}
            style={{ backgroundColor: selectedFeature.color }}
          >
            {loading ? (
              <span className="loading-spinner">Analyzing...</span>
            ) : (
              selectedFeature.key === 'chat' ? 'Send Message' : 'Run AI Analysis'
            )}
          </button>

          {error && <div className="ai-error">{error}</div>}

          {response && (
            <div className="ai-response">
              <div className="ai-response-header">
                <h3>AI Response</h3>
                {response.model && (
                  <span className="ai-model-badge">Model: {response.model}</span>
                )}
                {response.usage && (
                  <span className="ai-usage-badge">
                    Tokens: {response.usage.prompt_tokens + response.usage.completion_tokens}
                  </span>
                )}
              </div>
              <div className="ai-response-body">
                {formatAIResponse(getResponseContent())}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIAssistant;
