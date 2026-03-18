const express = require('express');
const { requireAuth } = require('../middleware/requireAuth');
const { getDb, ObjectId } = require('../db');

const router = express.Router();

async function resolveAuthorFromSession(req, db) {
  const sessionUserId = req.session && req.session.userId;
  if (!sessionUserId || !ObjectId.isValid(String(sessionUserId))) return null;

  const users = db.collection('users');
  const user = await users.findOne(
    { _id: new ObjectId(String(sessionUserId)) },
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

    const createdAt = new Date();
    const newPost = {
      cafeId: new ObjectId(String(cafeId)),
      authorId: sessionAuthor ? sessionAuthor.authorId : null,
      author: sessionAuthor ? sessionAuthor.authorName : String(author || 'Anonymous'),
      text: String(text),
      photoUrl: photoUrl != null && photoUrl !== '' ? String(photoUrl) : '',
      rating: rating != null && rating !== '' ? Number(rating) : 5,
      createdAt,
    };

    const postsCollection = db.collection('posts');
    const result = await postsCollection.insertOne(newPost);

    res.status(201).json({
      message: 'Post successfully created.',
      postId: result.insertedId,
    });
  } catch (error) {
    console.error('Error creating post: ', error);
    res.status(500).json({ error: 'Server error while creating the post.' });
  }
}

async function listPostsByCafe(req, res) {
  try {
    const cafeId = req.params.id;
    if (!ObjectId.isValid(String(cafeId))) {
      return res.status(400).json({ error: 'Invalid cafe ID format.' });
    }

    const db = await getDb();
    const postsCollection = db.collection('posts');

    const posts = await postsCollection
      .find({ cafeId: new ObjectId(String(cafeId)) })
      .sort({ createdAt: -1 })
      .toArray();

    // Backward compatibility: If posts collection is empty, fall back to legacy "reviews".
    if (posts.length === 0) {
      const reviewsCollection = db.collection('reviews');
      const legacyReviews = await reviewsCollection
        .find({ cafeId: new ObjectId(String(cafeId)) })
        .sort({ createAt: -1 })
        .toArray();

      const normalized = legacyReviews.map((p) => ({
        ...p,
        createdAt: p.createdAt || p.createAt || null,
        authorId: p.authorId || null,
      }));

      return res.json(normalized);
    }

    res.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
}

// Canonical routes
router.post('/posts', createPost);
router.get('/cafes/:id/posts', listPostsByCafe);

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
    if (String(post.authorId) !== String(req.session.userId)) {
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
    if (String(post.authorId) !== String(req.session.userId)) {
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

    await db.collection('posts').updateOne(
      { _id: new ObjectId(String(postId)) },
      { $set: updates }
    );

    res.json({ message: 'Post updated.' });
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ error: 'Failed to update post.' });
  }
});


// Deprecated aliases
router.post('/reviews', createPost);
router.get('/cafes/:id/reviews', listPostsByCafe);

module.exports = { postsRouter: router };
