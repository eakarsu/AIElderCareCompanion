const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = rateLimit;

const aiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => {
    if (req.user && req.user.id) return `user:${req.user.id}`;
    return ipKeyGenerator(req);
  },
  message: { error: 'AI rate limit exceeded. Max 20 requests/hour.' }
});

module.exports = { aiRateLimiter };
