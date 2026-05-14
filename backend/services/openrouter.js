const https = require('https');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

/**
 * Centralized OpenRouter call. Returns the full parsed response.
 */
function callOpenRouter(messages, options = {}) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: options.model || OPENROUTER_MODEL,
      messages,
      max_tokens: options.max_tokens || 2000,
      temperature: options.temperature ?? 0.7
    });

    const reqOptions = {
      hostname: 'openrouter.ai',
      path: '/api/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'AI Elder Care Companion'
      }
    };

    const req = https.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
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

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

module.exports = { callOpenRouter, OPENROUTER_MODEL };
