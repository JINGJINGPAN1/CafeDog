const express = require('express');
const { getDb, ObjectId } = require('../db');
const { requireAuth } = require('../middleware/requireAuth');

const router = express.Router();

function parseObjectId(id) {
  if (!ObjectId.isValid(String(id))) return null;
  return new ObjectId(String(id));
}

router.get('/cafes', async (req, res) => {
  try {
    const db = await getDb();
    const cafesCollection = db.collection('cafes');

    const filter = {};
    if (req.query.search) {
      filter.name = { $regex: req.query.search, $options: 'i' };
    }
    if (req.query.wifi === 'true') {
      filter.has_good_wifi = true;
    }
    if (req.query.quiet === 'true') {
      filter.is_quiet = true;
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 12));
    const skip = (page - 1) * limit;

    const total = await cafesCollection.countDocuments(filter);
    const cafes = await cafesCollection
      .find(filter)
      .skip(skip)
      .limit(limit)
      .toArray();

    // Attach likesCount for each cafe (for CafeCard display).
    const cafeIds = cafes.map((c) => c._id);
    const likesByCafe = new Map();
    if (cafeIds.length > 0) {
      const rows = await db
        .collection('cafeLikes')
        .aggregate([
          { $match: { cafeId: { $in: cafeIds } } },
          { $group: { _id: '$cafeId', count: { $sum: 1 } } },
        ])
        .toArray();
      rows.forEach((r) => likesByCafe.set(String(r._id), r.count));
    }

    const cafesWithLikes = cafes.map((c) => ({
      ...c,
      likesCount: likesByCafe.get(String(c._id)) || 0,
    }));

    res.json({ cafes: cafesWithLikes, total, page, limit });
  } catch (error) {
    console.error('Error fetching cafes:', error);
    res.status(500).json({ error: 'Failed to fetch cafes' });
  }
});

router.get('/cafes/:id', async (req, res) => {
  try {
    const cafeId = req.params.id;
    if (!ObjectId.isValid(String(cafeId))) {
      return res.status(400).json({ error: 'Invalid cafe ID format.' });
    }

    const db = await getDb();
    const cafesCollection = db.collection('cafes');
    const cafeOid = new ObjectId(String(cafeId));
    const cafe = await cafesCollection.findOne({ _id: cafeOid });

    if (!cafe) {
      return res.status(404).json({ error: "Can't find the cafe!" });
    }

    const likes = db.collection('cafeLikes');
    const saves = db.collection('cafeSaves');

    const likesCount = await likes.countDocuments({ cafeId: cafeOid });
    const viewerId = req.session && req.session.userId;
    let viewerHasLiked = false;
    let viewerHasSaved = false;
    if (viewerId && ObjectId.isValid(String(viewerId))) {
      const userOid = new ObjectId(String(viewerId));
      const [liked, saved] = await Promise.all([
        likes.findOne({ cafeId: cafeOid, userId: userOid }, { projection: { _id: 1 } }),
        saves.findOne({ cafeId: cafeOid, userId: userOid }, { projection: { _id: 1 } }),
      ]);
      viewerHasLiked = Boolean(liked);
      viewerHasSaved = Boolean(saved);
    }

    res.status(200).json({
      ...cafe,
      likesCount,
      viewerHasLiked,
      viewerHasSaved,
    });
  } catch (error) {
    console.error('Error finding cafe:', error);
    res.status(500).json({ error: 'Server error or invalid ID format.' });
  }
});

// Cafe likes
router.get('/cafes/:id/likes', async (req, res) => {
  try {
    const cafeId = parseObjectId(req.params.id);
    if (!cafeId) return res.status(400).json({ error: 'Invalid cafe ID format.' });

    const db = await getDb();
    const likes = db.collection('cafeLikes');

    const count = await likes.countDocuments({ cafeId });
    const viewerId = req.session && req.session.userId;
    let viewerHasLiked = false;
    if (viewerId && ObjectId.isValid(String(viewerId))) {
      const userId = new ObjectId(String(viewerId));
      const existing = await likes.findOne({ cafeId, userId }, { projection: { _id: 1 } });
      viewerHasLiked = Boolean(existing);
    }

    res.json({ count, viewerHasLiked });
  } catch (err) {
    console.error('Get cafe likes error:', err);
    res.status(500).json({ error: 'Failed to fetch likes' });
  }
});

router.post('/cafes/:id/likes', requireAuth, async (req, res) => {
  try {
    const cafeId = parseObjectId(req.params.id);
    if (!cafeId) return res.status(400).json({ error: 'Invalid cafe ID format.' });

    const userId = new ObjectId(String(req.session.userId));
    const db = await getDb();
    const likes = db.collection('cafeLikes');

    const existing = await likes.findOne({ cafeId, userId }, { projection: { _id: 1 } });
    if (!existing) await likes.insertOne({ cafeId, userId, createdAt: new Date() });

    const count = await likes.countDocuments({ cafeId });
    res.json({ ok: true, count, viewerHasLiked: true });
  } catch (err) {
    console.error('Like cafe error:', err);
    res.status(500).json({ error: 'Failed to like cafe' });
  }
});

router.delete('/cafes/:id/likes', requireAuth, async (req, res) => {
  try {
    const cafeId = parseObjectId(req.params.id);
    if (!cafeId) return res.status(400).json({ error: 'Invalid cafe ID format.' });

    const userId = new ObjectId(String(req.session.userId));
    const db = await getDb();
    const likes = db.collection('cafeLikes');

    await likes.deleteOne({ cafeId, userId });
    const count = await likes.countDocuments({ cafeId });
    res.json({ ok: true, count, viewerHasLiked: false });
  } catch (err) {
    console.error('Unlike cafe error:', err);
    res.status(500).json({ error: 'Failed to unlike cafe' });
  }
});

// Cafe saves
router.get('/cafes/:id/saved', requireAuth, async (req, res) => {
  try {
    const cafeId = parseObjectId(req.params.id);
    if (!cafeId) return res.status(400).json({ error: 'Invalid cafe ID format.' });

    const userId = new ObjectId(String(req.session.userId));
    const db = await getDb();
    const saves = db.collection('cafeSaves');

    const existing = await saves.findOne({ cafeId, userId }, { projection: { _id: 1 } });
    res.json({ viewerHasSaved: Boolean(existing) });
  } catch (err) {
    console.error('Get cafe saved error:', err);
    res.status(500).json({ error: 'Failed to fetch saved state' });
  }
});

router.post('/cafes/:id/saved', requireAuth, async (req, res) => {
  try {
    const cafeId = parseObjectId(req.params.id);
    if (!cafeId) return res.status(400).json({ error: 'Invalid cafe ID format.' });

    const userId = new ObjectId(String(req.session.userId));
    const db = await getDb();
    const saves = db.collection('cafeSaves');

    const existing = await saves.findOne({ cafeId, userId }, { projection: { _id: 1 } });
    if (!existing) await saves.insertOne({ cafeId, userId, createdAt: new Date() });

    res.json({ ok: true, viewerHasSaved: true });
  } catch (err) {
    console.error('Save cafe error:', err);
    res.status(500).json({ error: 'Failed to save cafe' });
  }
});

router.delete('/cafes/:id/saved', requireAuth, async (req, res) => {
  try {
    const cafeId = parseObjectId(req.params.id);
    if (!cafeId) return res.status(400).json({ error: 'Invalid cafe ID format.' });

    const userId = new ObjectId(String(req.session.userId));
    const db = await getDb();
    const saves = db.collection('cafeSaves');

    await saves.deleteOne({ cafeId, userId });
    res.json({ ok: true, viewerHasSaved: false });
  } catch (err) {
    console.error('Unsave cafe error:', err);
    res.status(500).json({ error: 'Failed to unsave cafe' });
  }
});

router.delete('/cafes/:id', requireAuth, async (req, res) => {
  try {
    const cafeId = req.params.id;
    if (!cafeId || !ObjectId.isValid(String(cafeId))) {
      return res.status(400).json({ error: 'Invalid cafe ID format.' });
    }

    const db = await getDb();
    const cafesCollection = db.collection('cafes');
    const cafe = await cafesCollection.findOne({ _id: new ObjectId(String(cafeId)) });

    if (!cafe) {
      return res.status(404).json({ error: 'Cafe not found or already deleted.' });
    }
    if (String(cafe.createdBy) !== String(req.session.userId)) {
      return res.status(403).json({ error: 'You can only delete your own cafes.' });
    }

    await cafesCollection.deleteOne({ _id: new ObjectId(String(cafeId)) });
    res.status(200).json({ message: 'Cafe successfully deleted!' });
  } catch (error) {
    console.error('Error deleting cafe:', error);
    res.status(500).json({ error: 'Server error during deletion.' });
  }
});


router.put('/cafes/:id', requireAuth, async (req, res) => {
  try {
    const cafeId = req.params.id;
    if (!cafeId || !ObjectId.isValid(String(cafeId))) {
      return res.status(400).json({ error: 'Invalid cafe ID format.' });
    }

    const db = await getDb();
    const cafe = await db.collection('cafes').findOne({ _id: new ObjectId(String(cafeId)) });

    if (!cafe) {
      return res.status(404).json({ error: 'Cafe not found.' });
    }
    if (String(cafe.createdBy) !== String(req.session.userId)) {
      return res.status(403).json({ error: 'You can only edit your own cafes.' });
    }

    const { name, address, has_good_wifi, is_quiet, rating, cover_image } = req.body || {};
    if (!name || !address) {
      return res.status(400).json({ error: 'Name and address are required.' });
    }

    const updates = {
      name: String(name),
      address: String(address),
      has_good_wifi: Boolean(has_good_wifi),
      is_quiet: Boolean(is_quiet),
      rating: rating != null && rating !== '' ? Number(rating) : null,
      cover_image: cover_image ? String(cover_image) : '',
    };

    await db.collection('cafes').updateOne(
      { _id: new ObjectId(String(cafeId)) },
      { $set: updates },
    );

    res.json({ message: 'Cafe updated successfully.' });
  } catch (error) {
    console.error('Error updating cafe:', error);
    res.status(500).json({ error: 'Failed to update cafe.' });
  }
});

router.post('/cafes', async (req, res) => {
  try {
    const { name, address, has_good_wifi, is_quiet, rating, cover_image } = req.body || {};
    if (!name || !address) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const sessionUserId = req.session && req.session.userId;
    const newCafe = {
      name: String(name),
      address: String(address),
      has_good_wifi: Boolean(has_good_wifi),
      is_quiet: Boolean(is_quiet),
      rating: rating != null && rating !== '' ? Number(rating) : null,
      cover_image: cover_image ? String(cover_image) : '',
      createdBy: sessionUserId && ObjectId.isValid(String(sessionUserId))
        ? new ObjectId(String(sessionUserId))
        : null,
    };

    const db = await getDb();
    const cafesCollection = db.collection('cafes');
    const result = await cafesCollection.insertOne(newCafe);

    res.status(201).json({
      message: 'Cafe created successfully',
      insertedId: result.insertedId,
    });
  } catch (error) {
    console.error('Error creating cafe:', error);
    res.status(500).json({ error: 'Failed to create cafe' });
  }
});

module.exports = { cafesRouter: router };
