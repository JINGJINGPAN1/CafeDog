const express = require('express');
const { getDb, ObjectId } = require('../db');
const { requireAuth } = require('../middleware/requireAuth');

const router = express.Router();

function parseObjectId(id) {
  if (!ObjectId.isValid(String(id))) return null;
  return new ObjectId(String(id));
}

// Likes
router.get('/posts/:postId/likes', async (req, res) => {
  try {
    const postId = parseObjectId(req.params.postId);
    if (!postId) return res.status(400).json({ error: 'Invalid postId' });

    const db = await getDb();
    const likes = db.collection('likes');

    const count = await likes.countDocuments({ postId });
    const viewerId = req.user && req.user._id;
    let viewerHasLiked = false;
    if (viewerId && ObjectId.isValid(String(viewerId))) {
      const userId = new ObjectId(String(viewerId));
      const existing = await likes.findOne({ postId, userId }, { projection: { _id: 1 } });
      viewerHasLiked = Boolean(existing);
    }

    res.json({ count, viewerHasLiked });
  } catch (err) {
    console.error('Get likes error:', err);
    res.status(500).json({ error: 'Failed to fetch likes' });
  }
});

router.post('/posts/:postId/likes', requireAuth, async (req, res) => {
  try {
    const postId = parseObjectId(req.params.postId);
    if (!postId) return res.status(400).json({ error: 'Invalid postId' });

    const userId = new ObjectId(String(req.user._id));

    const db = await getDb();
    const likes = db.collection('likes');

    const existing = await likes.findOne({ postId, userId }, { projection: { _id: 1 } });
    if (!existing) {
      await likes.insertOne({ postId, userId, createdAt: new Date() });
    }

    const count = await likes.countDocuments({ postId });
    res.json({ ok: true, count, viewerHasLiked: true });
  } catch (err) {
    console.error('Like error:', err);
    res.status(500).json({ error: 'Failed to like post' });
  }
});

router.delete('/posts/:postId/likes', requireAuth, async (req, res) => {
  try {
    const postId = parseObjectId(req.params.postId);
    if (!postId) return res.status(400).json({ error: 'Invalid postId' });

    const userId = new ObjectId(String(req.user._id));

    const db = await getDb();
    const likes = db.collection('likes');

    await likes.deleteOne({ postId, userId });
    const count = await likes.countDocuments({ postId });
    res.json({ ok: true, count, viewerHasLiked: false });
  } catch (err) {
    console.error('Unlike error:', err);
    res.status(500).json({ error: 'Failed to unlike post' });
  }
});

// Comments (full CRUD)
router.get('/posts/:postId/comments', async (req, res) => {
  try {
    const postId = parseObjectId(req.params.postId);
    if (!postId) return res.status(400).json({ error: 'Invalid postId' });

    const db = await getDb();
    const comments = db.collection('comments');
    const users = db.collection('users');

    const list = await comments.find({ postId }).sort({ createdAt: -1 }).toArray();

    const userIds = [
      ...new Set(list.map((c) => String(c.userId)).filter((id) => ObjectId.isValid(id))),
    ].map((id) => new ObjectId(id));

    const userDocs = userIds.length
      ? await users
          .find({ _id: { $in: userIds } }, { projection: { username: 1, email: 1 } })
          .toArray()
      : [];

    const userMap = new Map(userDocs.map((u) => [String(u._id), u.username || u.email || 'User']));

    const hydrated = list.map((c) => ({
      ...c,
      authorUsername: userMap.get(String(c.userId)) || 'User',
    }));

    res.json(hydrated);
  } catch (err) {
    console.error('List comments error:', err);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

router.post('/posts/:postId/comments', requireAuth, async (req, res) => {
  try {
    const postId = parseObjectId(req.params.postId);
    if (!postId) return res.status(400).json({ error: 'Invalid postId' });

    const { text } = req.body || {};
    if (!text || !String(text).trim()) return res.status(400).json({ error: 'Missing text' });

    const userId = new ObjectId(String(req.user._id));
    const now = new Date();

    const db = await getDb();
    const comments = db.collection('comments');

    const doc = {
      postId,
      userId,
      text: String(text).trim(),
      createdAt: now,
      updatedAt: null,
    };

    const result = await comments.insertOne(doc);
    res.status(201).json({ ...doc, _id: result.insertedId });
  } catch (err) {
    console.error('Create comment error:', err);
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

router.patch('/comments/:commentId', requireAuth, async (req, res) => {
  try {
    const commentId = parseObjectId(req.params.commentId);
    if (!commentId) return res.status(400).json({ error: 'Invalid commentId' });

    const { text } = req.body || {};
    if (!text || !String(text).trim()) return res.status(400).json({ error: 'Missing text' });

    const userId = new ObjectId(String(req.user._id));

    const db = await getDb();
    const comments = db.collection('comments');

    const existing = await comments.findOne({ _id: commentId });
    if (!existing) return res.status(404).json({ error: 'Comment not found' });
    if (String(existing.userId) !== String(userId))
      return res.status(403).json({ error: 'Forbidden' });

    const updatedAt = new Date();
    await comments.updateOne(
      { _id: commentId },
      { $set: { text: String(text).trim(), updatedAt } },
    );

    const updated = await comments.findOne({ _id: commentId });
    res.json(updated);
  } catch (err) {
    console.error('Update comment error:', err);
    res.status(500).json({ error: 'Failed to update comment' });
  }
});

router.delete('/comments/:commentId', requireAuth, async (req, res) => {
  try {
    const commentId = parseObjectId(req.params.commentId);
    if (!commentId) return res.status(400).json({ error: 'Invalid commentId' });

    const userId = new ObjectId(String(req.user._id));

    const db = await getDb();
    const comments = db.collection('comments');

    const existing = await comments.findOne({ _id: commentId });
    if (!existing) return res.status(404).json({ error: 'Comment not found' });
    if (String(existing.userId) !== String(userId))
      return res.status(403).json({ error: 'Forbidden' });

    await comments.deleteOne({ _id: commentId });
    res.json({ ok: true });
  } catch (err) {
    console.error('Delete comment error:', err);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

module.exports = { socialRouter: router };
