const express = require('express');
const bcrypt = require('bcrypt');
const { getDb, ObjectId } = require('../db');

const router = express.Router();

function sanitizeUser(u) {
  return {
    _id: u._id,
    email: u.email,
    username: u.username,
    createdAt: u.createdAt,
  };
}

router.post('/auth/register', async (req, res) => {
  try {
    const { email, password, username } = req.body || {};
    if (!email || !password || !username) {
      return res.status(400).json({ error: 'Missing required fields: email, password, username' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedUsername = String(username).trim();
    if (normalizedPasswordTooShort(password)) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const db = await getDb();
    const users = db.collection('users');

    const existing = await users.findOne({ email: normalizedEmail }, { projection: { _id: 1 } });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(String(password), 12);
    const now = new Date();

    const userDoc = {
      email: normalizedEmail,
      username: normalizedUsername,
      passwordHash,
      createdAt: now,
    };

    const result = await users.insertOne(userDoc);
    const user = { ...userDoc, _id: result.insertedId };

    req.session.userId = String(user._id);
    res.status(201).json({ user: sanitizeUser(user) });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Failed to register' });
  }
});

router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Missing required fields: email, password' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const db = await getDb();
    const users = db.collection('users');

    const user = await users.findOne({ email: normalizedEmail });
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const ok = await bcrypt.compare(String(password), String(user.passwordHash || ''));
    if (!ok) return res.status(401).json({ error: 'Invalid email or password' });

    req.session.userId = String(user._id);
    res.json({ user: sanitizeUser(user) });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Failed to login' });
  }
});

router.post('/auth/logout', async (req, res) => {
  try {
    req.session.destroy(() => {
      res.json({ ok: true });
    });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ error: 'Failed to logout' });
  }
});

router.get('/me', async (req, res) => {
  try {
    const userId = req.session && req.session.userId;
    if (!userId || !ObjectId.isValid(String(userId))) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const db = await getDb();
    const users = db.collection('users');
    const user = await users.findOne(
      { _id: new ObjectId(String(userId)) },
      { projection: { passwordHash: 0 } },
    );
    if (!user) return res.status(401).json({ error: 'Not authenticated' });

    res.json({ user: sanitizeUser(user) });
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ error: 'Failed to fetch current user' });
  }
});

function normalizedPasswordTooShort(password) {
  return String(password).length < 8;
}

module.exports = { authRouter: router };
