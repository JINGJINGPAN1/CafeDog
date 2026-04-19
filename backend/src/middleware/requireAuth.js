const { ObjectId } = require('../db');

function requireAuth(req, res, next) {
  const id = req.user && req.user._id;
  if (!id || !ObjectId.isValid(String(id))) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
}

module.exports = { requireAuth };
