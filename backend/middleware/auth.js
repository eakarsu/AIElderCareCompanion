const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '../../.env' });

function getJwtSecret() {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 32 || s.startsWith('replace-')) throw new Error('JWT_SECRET must contain at least 32 non-placeholder characters');
  return s;
}

const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }
  try {
    const decoded = jwt.verify(token, getJwtSecret());
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token.' });
  }
};

module.exports = authMiddleware;
