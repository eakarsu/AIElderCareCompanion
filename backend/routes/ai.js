const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const https = require('https');
const http = require('http');
require('dotenv').config({ path: '../../.env' });

function callOpenRouter(prompt, context) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5',
      messages: [
        {
          role: 'system',
          content: `You are an AI Elder Care Companion assistant. You help caregivers and healthcare professionals manage elderly patient care. Provide helpful, empathetic, and medically-informed responses. Always recommend consulting with healthcare professionals for medical decisions. Format your responses in a clear, organized manner with sections and bullet points where appropriate.`
        },
        {
          role: 'user',
          content: context ? `Context: ${JSON.stringify(context)}\n\n${prompt}` : prompt
        }
      ],
      max_tokens: 1500,
      temperature: 0.7
    });

    const url = new URL('https://openrouter.ai/api/v1/chat/completions');
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'AI Elder Care Companion'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (parsed.error) {
            reject(new Error(parsed.error.message || 'OpenRouter API error'));
          } else {
            resolve(parsed);
          }
        } catch (e) {
          reject(new Error('Failed to parse OpenRouter response'));
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.write(data);
    req.end();
  });
}

// Medication Analysis
router.post('/medication-analysis', auth, async (req, res) => {
  try {
    const { medications, patient_info } = req.body;
    const result = await callOpenRouter(
      `Analyze the following medications for potential interactions, side effects, and recommendations for an elderly patient:\n\nMedications: ${JSON.stringify(medications)}\nPatient Info: ${JSON.stringify(patient_info)}\n\nProvide:\n1. Potential drug interactions\n2. Common side effects for elderly patients\n3. Timing recommendations\n4. Things to watch for\n5. General wellness tips`,
      { type: 'medication_analysis' }
    );
    const content = result.choices?.[0]?.message?.content || 'No response generated';
    res.json({ analysis: content, model: result.model, usage: result.usage });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Fall Risk Assessment
router.post('/fall-risk-assessment', auth, async (req, res) => {
  try {
    const { patient_data, history } = req.body;
    const result = await callOpenRouter(
      `Perform a fall risk assessment for an elderly patient based on the following data:\n\nPatient Data: ${JSON.stringify(patient_data)}\nFall History: ${JSON.stringify(history)}\n\nProvide:\n1. Overall risk level (Low/Medium/High/Critical)\n2. Key risk factors identified\n3. Recommended preventive measures\n4. Environmental modifications suggested\n5. Exercise recommendations\n6. When to seek immediate medical attention`,
      { type: 'fall_risk_assessment' }
    );
    const content = result.choices?.[0]?.message?.content || 'No response generated';
    res.json({ assessment: content, model: result.model, usage: result.usage });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Health Summary
router.post('/health-summary', auth, async (req, res) => {
  try {
    const { vitals, patient_name } = req.body;
    const result = await callOpenRouter(
      `Generate a comprehensive health summary for elderly patient ${patient_name} based on these vitals:\n\n${JSON.stringify(vitals)}\n\nProvide:\n1. Overall health status assessment\n2. Vitals that need attention\n3. Trends to monitor\n4. Lifestyle recommendations\n5. When to contact a physician`,
      { type: 'health_summary' }
    );
    const content = result.choices?.[0]?.message?.content || 'No response generated';
    res.json({ summary: content, model: result.model, usage: result.usage });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Social Engagement Recommendations
router.post('/social-recommendations', auth, async (req, res) => {
  try {
    const { patient_profile, current_activities } = req.body;
    const result = await callOpenRouter(
      `Recommend social engagement activities for an elderly patient:\n\nProfile: ${JSON.stringify(patient_profile)}\nCurrent Activities: ${JSON.stringify(current_activities)}\n\nProvide:\n1. Personalized activity suggestions\n2. Group activities suitable for their abilities\n3. Technology-assisted social options\n4. Family engagement ideas\n5. Community resources to explore\n6. Benefits of each suggested activity`,
      { type: 'social_recommendations' }
    );
    const content = result.choices?.[0]?.message?.content || 'No response generated';
    res.json({ recommendations: content, model: result.model, usage: result.usage });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Meal Plan Generator
router.post('/meal-plan', auth, async (req, res) => {
  try {
    const { dietary_needs, restrictions, preferences } = req.body;
    const result = await callOpenRouter(
      `Create a nutritious meal plan for an elderly patient:\n\nDietary Needs: ${JSON.stringify(dietary_needs)}\nRestrictions: ${JSON.stringify(restrictions)}\nPreferences: ${JSON.stringify(preferences)}\n\nProvide:\n1. Recommended daily meal plan (breakfast, lunch, dinner, snacks)\n2. Nutritional benefits of each meal\n3. Easy preparation tips\n4. Hydration recommendations\n5. Supplements to consider\n6. Foods to avoid`,
      { type: 'meal_plan' }
    );
    const content = result.choices?.[0]?.message?.content || 'No response generated';
    res.json({ plan: content, model: result.model, usage: result.usage });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Cognitive Exercise Generator
router.post('/cognitive-exercises', auth, async (req, res) => {
  try {
    const { difficulty, interests, cognitive_status } = req.body;
    const result = await callOpenRouter(
      `Suggest cognitive exercises for an elderly patient:\n\nDifficulty Level: ${difficulty}\nInterests: ${JSON.stringify(interests)}\nCognitive Status: ${cognitive_status}\n\nProvide:\n1. 5 specific cognitive exercises with instructions\n2. Expected benefits of each exercise\n3. How to track progress\n4. Adaptations for different ability levels\n5. Warning signs to watch for\n6. How to make exercises engaging and fun`,
      { type: 'cognitive_exercises' }
    );
    const content = result.choices?.[0]?.message?.content || 'No response generated';
    res.json({ exercises: content, model: result.model, usage: result.usage });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Sleep Analysis
router.post('/sleep-analysis', auth, async (req, res) => {
  try {
    const { sleep_data, patient_info } = req.body;
    const result = await callOpenRouter(
      `Analyze sleep patterns for an elderly patient:\n\nSleep Data: ${JSON.stringify(sleep_data)}\nPatient Info: ${JSON.stringify(patient_info)}\n\nProvide:\n1. Sleep quality assessment\n2. Identified sleep issues\n3. Sleep hygiene recommendations\n4. Environmental adjustments\n5. When to consult a sleep specialist\n6. Natural sleep aids appropriate for elderly`,
      { type: 'sleep_analysis' }
    );
    const content = result.choices?.[0]?.message?.content || 'No response generated';
    res.json({ analysis: content, model: result.model, usage: result.usage });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Mood & Mental Health Insights
router.post('/mood-insights', auth, async (req, res) => {
  try {
    const { mood_data, patient_info } = req.body;
    const result = await callOpenRouter(
      `Provide mental health insights for an elderly patient:\n\nMood Data: ${JSON.stringify(mood_data)}\nPatient Info: ${JSON.stringify(patient_info)}\n\nProvide:\n1. Mood pattern analysis\n2. Potential concerns (depression, anxiety, isolation)\n3. Coping strategy suggestions\n4. Activities to improve mood\n5. When to seek professional help\n6. Caregiver support recommendations`,
      { type: 'mood_insights' }
    );
    const content = result.choices?.[0]?.message?.content || 'No response generated';
    res.json({ insights: content, model: result.model, usage: result.usage });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Home Safety Evaluation
router.post('/safety-evaluation', auth, async (req, res) => {
  try {
    const { home_data, patient_mobility } = req.body;
    const result = await callOpenRouter(
      `Evaluate home safety for an elderly patient:\n\nHome Data: ${JSON.stringify(home_data)}\nPatient Mobility: ${JSON.stringify(patient_mobility)}\n\nProvide:\n1. Room-by-room safety assessment\n2. Priority hazards to address\n3. Recommended modifications\n4. Assistive devices to consider\n5. Emergency preparedness checklist\n6. Cost-effective safety improvements`,
      { type: 'safety_evaluation' }
    );
    const content = result.choices?.[0]?.message?.content || 'No response generated';
    res.json({ evaluation: content, model: result.model, usage: result.usage });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Care Plan Generator
router.post('/care-plan', auth, async (req, res) => {
  try {
    const { patient_profile, conditions, goals } = req.body;
    const result = await callOpenRouter(
      `Generate a comprehensive care plan for an elderly patient:\n\nPatient Profile: ${JSON.stringify(patient_profile)}\nConditions: ${JSON.stringify(conditions)}\nGoals: ${JSON.stringify(goals)}\n\nProvide:\n1. Daily care routine\n2. Medication management schedule\n3. Physical activity plan\n4. Nutrition guidelines\n5. Social engagement plan\n6. Monitoring and check-in schedule\n7. Emergency protocols\n8. Caregiver self-care reminders`,
      { type: 'care_plan' }
    );
    const content = result.choices?.[0]?.message?.content || 'No response generated';
    res.json({ plan: content, model: result.model, usage: result.usage });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// General Chat
router.post('/chat', auth, async (req, res) => {
  try {
    const { message, context } = req.body;
    const result = await callOpenRouter(message, context);
    const content = result.choices?.[0]?.message?.content || 'No response generated';
    res.json({ response: content, model: result.model, usage: result.usage });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
