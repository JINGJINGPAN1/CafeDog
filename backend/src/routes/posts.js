const express = require('express');
const { requireAuth } = require('../middleware/requireAuth');
const { getDb, ObjectId } = require('../db');

const router = express.Router();

async function resolveAuthorFromSession(req, db) {
  const id = req.user && req.user._id;
  if (!id || !ObjectId.isValid(String(id))) return null;

  const users = db.collection('users');
  const user = await users.findOne(
    { _id: new ObjectId(String(id)) },
    { projection: { username: 1, email: 1 } },
  );
  if (!user) return null;
  return { authorId: user._id, authorName: user.username || user.email || 'User' };
}

async function createPost(req, res) {
  try {
    const { cafeId, author, text, photoUrl, rating } = req.body || {};

    if (!cafeId || !text) {
      return res.status(400).json({ error: 'Missing required fields: cafeId, text' });
    }
    if (!ObjectId.isValid(String(cafeId))) {
      return res.status(400).json({ error: 'Invalid cafe ID format.' });
    }

    const db = await getDb();
    const sessionAuthor = await resolveAuthorFromSession(req, db);
    const cafeOid = new ObjectId(String(cafeId));

    const postsCollection = db.collection('posts');

    if (sessionAuthor) {
      const existing = await postsCollection.findOne({
        authorId: sessionAuthor.authorId,
        cafeId: cafeOid,
      });
      if (existing) {
        return res.status(409).json({
          error: 'You have already reviewed this cafe. Edit your existing review instead.',
          postId: existing._id,
        });
      }
    }

    const createdAt = new Date();
    const newPost = {
      cafeId: cafeOid,
      authorId: sessionAuthor ? sessionAuthor.authorId : null,
      author: sessionAuthor ? sessionAuthor.authorName : String(author || 'Anonymous'),
      text: String(text),
      photoUrl: photoUrl != null && photoUrl !== '' ? String(photoUrl) : '',
      rating: rating != null && rating !== '' ? Number(rating) : 5,
      createdAt,
    };

    try {
      const result = await postsCollection.insertOne(newPost);
      res.status(201).json({
        message: 'Post successfully created.',
        postId: result.insertedId,
      });
    } catch (err) {
      if (err && err.code === 11000) {
        return res.status(409).json({
          error: 'You have already reviewed this cafe. Edit your existing review instead.',
        });
      }
      throw err;
    }
  } catch (error) {
    console.error('Error creating post: ', error);
    res.status(500).json({ error: 'Server error while creating the post.' });
  }
}

async function getMyPostForCafe(req, res) {
  try {
    const cafeId = req.params.id;
    if (!ObjectId.isValid(String(cafeId))) {
      return res.status(400).json({ error: 'Invalid cafe ID format.' });
    }
    const viewerId = req.user && req.user._id;
    if (!viewerId || !ObjectId.isValid(String(viewerId))) {
      return res.json({ post: null });
    }
    const db = await getDb();
    const post = await db.collection('posts').findOne({
      authorId: new ObjectId(String(viewerId)),
      cafeId: new ObjectId(String(cafeId)),
    });
    res.json({ post: post || null });
  } catch (error) {
    console.error('Error fetching my post:', error);
    res.status(500).json({ error: 'Failed to fetch your post.' });
  }
}

async function listPostsByCafe(req, res) {
  try {
    const cafeId = req.params.id;
    if (!ObjectId.isValid(String(cafeId))) {
      return res.status(400).json({ error: 'Invalid cafe ID format.' });
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const db = await getDb();
    const postsCollection = db.collection('posts');
    const cafeOid = new ObjectId(String(cafeId));

    const total = await postsCollection.countDocuments({ cafeId: cafeOid });
    const posts = await postsCollection
      .find({ cafeId: cafeOid })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Attach likesCount + viewerHasLiked to each post
    const viewerId = req.user && req.user._id;
    const viewerOid =
      viewerId && ObjectId.isValid(String(viewerId)) ? new ObjectId(String(viewerId)) : null;

    async function hydrateMeta(list) {
      const postIds = list.map((p) => p._id);
      const likesByPost = new Map();
      if (postIds.length > 0) {
        const rows = await db
          .collection('likes')
          .aggregate([
            { $match: { postId: { $in: postIds } } },
            { $group: { _id: '$postId', count: { $sum: 1 } } },
          ])
          .toArray();
        rows.forEach((r) => likesByPost.set(String(r._id), r.count));
      }

      const repliesByPost = new Map();
      if (postIds.length > 0) {
        const rows = await db
          .collection('comments')
          .aggregate([
            { $match: { postId: { $in: postIds } } },
            { $group: { _id: '$postId', count: { $sum: 1 } } },
          ])
          .toArray();
        rows.forEach((r) => repliesByPost.set(String(r._id), r.count));
      }

      // Hydrate latest author display name from users collection
      const authorIds = [
        ...new Set(
          list
            .map((p) => p.authorId)
            .filter((id) => id && ObjectId.isValid(String(id)))
            .map((id) => String(id)),
        ),
      ].map((id) => new ObjectId(id));

      const authorMap = new Map();
      if (authorIds.length > 0) {
        const userDocs = await db
          .collection('users')
          .find({ _id: { $in: authorIds } }, { projection: { username: 1, email: 1 } })
          .toArray();
        userDocs.forEach((u) => authorMap.set(String(u._id), u.username || u.email || 'User'));
      }

      let likedSet = new Set();
      if (viewerOid && postIds.length > 0) {
        const likedRows = await db
          .collection('likes')
          .find({ userId: viewerOid, postId: { $in: postIds } }, { projection: { postId: 1 } })
          .toArray();
        likedSet = new Set(likedRows.map((r) => String(r.postId)));
      }

      return list.map((p) => ({
        ...p,
        author: p.authorId ? authorMap.get(String(p.authorId)) || p.author : p.author,
        likesCount: likesByPost.get(String(p._id)) || 0,
        viewerHasLiked: likedSet.has(String(p._id)),
        repliesCount: repliesByPost.get(String(p._id)) || 0,
      }));
    }

    // Backward compatibility: If posts collection is empty, fall back to legacy "reviews".
    if (posts.length === 0 && page === 1) {
      const reviewsCollection = db.collection('reviews');
      const legacyTotal = await reviewsCollection.countDocuments({ cafeId: cafeOid });
      const legacyReviews = await reviewsCollection
        .find({ cafeId: cafeOid })
        .sort({ createAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();

      const normalized = legacyReviews.map((p) => ({
        ...p,
        createdAt: p.createdAt || p.createAt || null,
        authorId: p.authorId || null,
      }));

      const hydrated = await hydrateMeta(normalized);
      return res.json({ posts: hydrated, total: legacyTotal, page, limit });
    }

    const hydrated = await hydrateMeta(posts);
    res.json({ posts: hydrated, total, page, limit });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
}

// Canonical routes
router.post('/posts', requireAuth, createPost);
router.get('/cafes/:id/posts', listPostsByCafe);
router.get('/cafes/:id/my-post', getMyPostForCafe);

// Query-based route
router.get('/posts', async (req, res) => {
  const cafeId = req.query.cafeId || req.query.cafe_id;
  if (!cafeId) {
    return res.status(400).json({ error: 'Missing required query param: cafeId' });
  }
  req.params.id = String(cafeId);
  return listPostsByCafe(req, res);
});

router.delete('/posts/:postId', requireAuth, async (req, res) => {
  try {
    const postId = req.params.postId;
    if (!ObjectId.isValid(String(postId))) {
      return res.status(400).json({ error: 'Invalid post ID.' });
    }

    const db = await getDb();
    const post = await db.collection('posts').findOne({ _id: new ObjectId(String(postId)) });

    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }
    if (String(post.authorId) !== String(req.user._id)) {
      return res.status(403).json({ error: 'You can only delete your own posts.' });
    }

    await db.collection('posts').deleteOne({ _id: new ObjectId(String(postId)) });
    res.json({ message: 'Post deleted.' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Failed to delete post.' });
  }
});

router.put('/posts/:postId', requireAuth, async (req, res) => {
  try {
    const postId = req.params.postId;
    if (!ObjectId.isValid(String(postId))) {
      return res.status(400).json({ error: 'Invalid post ID.' });
    }

    const db = await getDb();
    const post = await db.collection('posts').findOne({ _id: new ObjectId(String(postId)) });

    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }
    if (String(post.authorId) !== String(req.user._id)) {
      return res.status(403).json({ error: 'You can only edit your own posts.' });
    }

    const { text, photoUrl, rating } = req.body || {};
    if (!text) {
      return res.status(400).json({ error: 'Text is required.' });
    }

    const updates = {
      text: String(text),
      photoUrl: photoUrl != null && photoUrl !== '' ? String(photoUrl) : '',
      rating: rating != null && rating !== '' ? Number(rating) : post.rating,
      updatedAt: new Date(),
    };

    await db
      .collection('posts')
      .updateOne({ _id: new ObjectId(String(postId)) }, { $set: updates });

    res.json({ message: 'Post updated.' });
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ error: 'Failed to update post.' });
  }
});

// Deprecated aliases
router.post('/reviews', requireAuth, createPost);
router.get('/cafes/:id/reviews', listPostsByCafe);

module.exports = { postsRouter: router };
