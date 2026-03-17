const { ObjectId } = require('../db');

function requireAuth(req, res, next) {
  const userId = req.session && req.session.userId;
  if (!userId || !ObjectId.isValid(String(userId))) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
}

module.exports = { requireAuth };
