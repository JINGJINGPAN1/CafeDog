const express = require('express');
const bcrypt = require('bcrypt');
const passport = require('passport');
const { getDb, ObjectId } = require('../db');
const { requireAuth } = require('../middleware/requireAuth');

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

    req.login(user, (err) => {
      if (err) {
        console.error('Register login error:', err);
        return res.status(500).json({ error: 'Failed to register' });
      }
      return res.status(201).json({ user: sanitizeUser(user) });
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Failed to register' });
  }
});

router.post('/auth/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      return res.status(401).json({ error: info?.message || 'Invalid email or password' });
    }
    req.logIn(user, (err2) => {
      if (err2) return next(err2);
      return res.json({ user: sanitizeUser(user) });
    });
  })(req, res, next);
});

router.post('/auth/logout', async (req, res) => {
  try {
    req.logout((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ error: 'Failed to logout' });
      }
      req.session.destroy(() => {
        res.clearCookie('cafedog.sid');
        res.json({ ok: true });
      });
    });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ error: 'Failed to logout' });
  }
});

router.get('/me', async (req, res) => {
  try {
    const id = req.user && req.user._id;
    if (!id || !ObjectId.isValid(String(id))) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    res.json({ user: sanitizeUser(req.user) });
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ error: 'Failed to fetch current user' });
  }
});

router.patch('/me', requireAuth, async (req, res) => {
  try {
    const userId = new ObjectId(String(req.user._id));
    const { username, password } = req.body || {};

    const updates = {};
    if (username != null) {
      const u1 = String(username).trim();
      if (!u1) return res.status(400).json({ error: 'Nickname cannot be empty' });
      updates.username = u1;
    }
    if (password != null && String(password).trim()) {
      if (normalizedPasswordTooShort(password)) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
      }
      updates.passwordHash = await bcrypt.hash(String(password), 12);
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No changes provided' });
    }

    const db = await getDb();
    await db.collection('users').updateOne({ _id: userId }, { $set: updates });

    const user = await db
      .collection('users')
      .findOne({ _id: userId }, { projection: { passwordHash: 0 } });
    res.json({ ok: true, user: sanitizeUser(user) });
  } catch (err) {
    console.error('Update me error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

router.get('/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    if (!ObjectId.isValid(String(userId))) {
      return res.status(400).json({ error: 'Invalid user ID.' });
    }

    const db = await getDb();
    const oid = new ObjectId(String(userId));
    const viewerId = req.user && req.user._id;
    const isSelf =
      viewerId && ObjectId.isValid(String(viewerId)) ? String(viewerId) === String(userId) : false;

    const user = await db
      .collection('users')
      .findOne({ _id: oid }, { projection: { passwordHash: 0 } });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const posts = await db
      .collection('posts')
      .find({ authorId: oid })
      .sort({ createdAt: -1 })
      .toArray();

    const cafes = await db.collection('cafes').find({ createdBy: oid }).sort({ _id: -1 }).toArray();

    // Saved cafes are personal; only return them for self profile.
    let savedCafes = [];
    if (isSelf) {
      const saves = await db
        .collection('cafeSaves')
        .find({ userId: oid })
        .sort({ createdAt: -1 })
        .toArray();
      const savedCafeIds = saves.map((s) => s.cafeId).filter(Boolean);
      if (savedCafeIds.length > 0) {
        const cafeDocs = await db
          .collection('cafes')
          .find({ _id: { $in: savedCafeIds } })
          .toArray();
        const cafeMap = new Map(cafeDocs.map((c) => [String(c._id), c]));
        savedCafes = savedCafeIds.map((id) => cafeMap.get(String(id))).filter(Boolean);
      }
    }

    // Liked posts are also personal; only return them for self profile.
    let likedPosts = [];
    if (isSelf) {
      const likesDocs = await db.collection('likes').find({ userId: oid }).toArray();
      const likedPostIds = likesDocs.map((l) => l.postId).filter(Boolean);
      if (likedPostIds.length > 0) {
        likedPosts = await db
          .collection('posts')
          .find({ _id: { $in: likedPostIds } })
          .sort({ createdAt: -1 })
          .toArray();
      }
    }

    // Liked cafes are also personal; only return them for self profile.
    let likedCafes = [];
    if (isSelf) {
      const cafeLikesDocs = await db
        .collection('cafeLikes')
        .find({ userId: oid })
        .sort({ createdAt: -1 })
        .toArray();
      const likedCafeIds = cafeLikesDocs.map((l) => l.cafeId).filter(Boolean);
      if (likedCafeIds.length > 0) {
        const cafeDocs = await db
          .collection('cafes')
          .find({ _id: { $in: likedCafeIds } })
          .toArray();
        const cafeMap = new Map(cafeDocs.map((c) => [String(c._id), c]));
        likedCafes = likedCafeIds.map((id) => cafeMap.get(String(id))).filter(Boolean);
      }
    }

    res.json({
      user: sanitizeUser(user),
      posts,
      cafes,
      likedPosts,
      likedCafes,
      savedCafes,
    });
  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).json({ error: 'Failed to fetch profile.' });
  }
});

function normalizedPasswordTooShort(password) {
  return String(password).length < 8;
}

module.exports = { authRouter: router };
