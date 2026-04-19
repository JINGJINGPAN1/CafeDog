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
      const escaped = String(req.query.search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const rx = { $regex: escaped, $options: 'i' };
      filter.$or = [{ name: rx }, { address: rx }];
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

    const sortParam = String(req.query.sort || '').toLowerCase();
    const sort =
      sortParam === 'new' ? { _id: -1 } : null;

    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    const nearby =
      req.query.nearby === 'true' && Number.isFinite(lat) && Number.isFinite(lng);
    const radiusKm = Math.max(0.1, parseFloat(req.query.radiusKm) || 10);

    if (nearby) {
      filter.location = {
        $nearSphere: {
          $geometry: { type: 'Point', coordinates: [lng, lat] },
          $maxDistance: radiusKm * 1000,
        },
      };
    }

    // countDocuments doesn't support $nearSphere — use $geoWithin/$centerSphere
    // (same circular region) just for counting.
    const countFilter = nearby
      ? {
          ...filter,
          location: {
            $geoWithin: { $centerSphere: [[lng, lat], radiusKm / 6378.1] },
          },
        }
      : filter;
    const total = await cafesCollection.countDocuments(countFilter);

    // For "top" sort we need avgRating computed from posts, so fetch all matching
    // cafes (or paginated subset) and sort in-memory after aggregation.
    // When nearby is on, $nearSphere already orders by distance — skip custom sort.
    const isTopSort = sortParam === 'top' && !nearby;
    const cafes = isTopSort
      ? await cafesCollection.find(filter).toArray()
      : await cafesCollection
          .find(filter)
          .sort(nearby ? undefined : sort || undefined)
          .skip(skip)
          .limit(limit)
          .toArray();

    // Attach likesCount + avgRating for each cafe (for CafeCard display).
    const cafeIds = cafes.map((c) => c._id);
    const likesByCafe = new Map();
    const ratingByCafe = new Map();
    if (cafeIds.length > 0) {
      const [likeRows, ratingRows] = await Promise.all([
        db.collection('cafeLikes').aggregate([
          { $match: { cafeId: { $in: cafeIds } } },
          { $group: { _id: '$cafeId', count: { $sum: 1 } } },
        ]).toArray(),
        db.collection('posts').aggregate([
          { $match: { cafeId: { $in: cafeIds }, rating: { $type: 'number', $gt: 0 } } },
          { $group: { _id: '$cafeId', avg: { $avg: '$rating' } } },
        ]).toArray(),
      ]);
      likeRows.forEach((r) => likesByCafe.set(String(r._id), r.count));
      ratingRows.forEach((r) => ratingByCafe.set(String(r._id), Math.round(r.avg * 10) / 10));
    }

    let cafesWithMeta = cafes.map((c) => ({
      ...c,
      likesCount: likesByCafe.get(String(c._id)) || 0,
      avgRating: ratingByCafe.get(String(c._id)) ?? null,
    }));

    // For "top" sort, sort by avgRating desc then paginate in-memory
    if (isTopSort) {
      cafesWithMeta.sort((a, b) => (b.avgRating ?? -1) - (a.avgRating ?? -1));
      cafesWithMeta = cafesWithMeta.slice(skip, skip + limit);
    }

    res.json({ cafes: cafesWithMeta, total, page, limit });
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

    const [likesCount, savesCount, ratingAgg] = await Promise.all([
      likes.countDocuments({ cafeId: cafeOid }),
      saves.countDocuments({ cafeId: cafeOid }),
      db.collection('posts').aggregate([
        { $match: { cafeId: cafeOid, rating: { $type: 'number', $gt: 0 } } },
        { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
      ]).toArray(),
    ]);
    const avgRating = ratingAgg.length > 0
      ? Math.round(ratingAgg[0].avg * 10) / 10
      : null;
    const ratingsCount = ratingAgg.length > 0 ? ratingAgg[0].count : 0;

    const viewerId = req.user && req.user._id;
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
      savesCount,
      viewerHasLiked,
      viewerHasSaved,
      avgRating,
      ratingsCount,
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
    const viewerId = req.user && req.user._id;
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

    const userId = new ObjectId(String(req.user._id));
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

    const userId = new ObjectId(String(req.user._id));
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

    const userId = new ObjectId(String(req.user._id));
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

    const userId = new ObjectId(String(req.user._id));
    const db = await getDb();
    const saves = db.collection('cafeSaves');

    const existing = await saves.findOne({ cafeId, userId }, { projection: { _id: 1 } });
    if (!existing) await saves.insertOne({ cafeId, userId, createdAt: new Date() });

    const savesCount = await saves.countDocuments({ cafeId });
    res.json({ ok: true, savesCount, viewerHasSaved: true });
  } catch (err) {
    console.error('Save cafe error:', err);
    res.status(500).json({ error: 'Failed to save cafe' });
  }
});

router.delete('/cafes/:id/saved', requireAuth, async (req, res) => {
  try {
    const cafeId = parseObjectId(req.params.id);
    if (!cafeId) return res.status(400).json({ error: 'Invalid cafe ID format.' });

    const userId = new ObjectId(String(req.user._id));
    const db = await getDb();
    const saves = db.collection('cafeSaves');

    await saves.deleteOne({ cafeId, userId });
    const savesCount = await saves.countDocuments({ cafeId });
    res.json({ ok: true, savesCount, viewerHasSaved: false });
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
    if (String(cafe.createdBy) !== String(req.user._id)) {
      return res.status(403).json({ error: 'You can only delete your own cafes.' });
    }

    const cafeOid = new ObjectId(String(cafeId));

    // Find all posts belonging to this cafe so we can clean up their likes/comments
    const postIds = (
      await db
        .collection('posts')
        .find({ cafeId: cafeOid }, { projection: { _id: 1 } })
        .toArray()
    ).map((p) => p._id);

    // Cascade delete all related data
    await Promise.all([
      // Delete the cafe itself
      cafesCollection.deleteOne({ _id: cafeOid }),
      // Delete all posts for this cafe
      db.collection('posts').deleteMany({ cafeId: cafeOid }),
      // Delete cafe-level likes and saves
      db.collection('cafeLikes').deleteMany({ cafeId: cafeOid }),
      db.collection('cafeSaves').deleteMany({ cafeId: cafeOid }),
      // Delete post-level likes and comments
      ...(postIds.length > 0
        ? [
            db.collection('likes').deleteMany({ postId: { $in: postIds } }),
            db.collection('comments').deleteMany({ postId: { $in: postIds } }),
          ]
        : []),
    ]);

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
    if (String(cafe.createdBy) !== String(req.user._id)) {
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

    await db
      .collection('cafes')
      .updateOne({ _id: new ObjectId(String(cafeId)) }, { $set: updates });

    res.json({ message: 'Cafe updated successfully.' });
  } catch (error) {
    console.error('Error updating cafe:', error);
    res.status(500).json({ error: 'Failed to update cafe.' });
  }
});

router.post('/cafes', requireAuth, async (req, res) => {
  try {
    const { name, address, has_good_wifi, is_quiet, rating, cover_image, lat, lng, placeId } =
      req.body || {};
    if (!name || !address) {
      return res.status(400).json({ error: 'Name and address are required.' });
    }

    const latNum = Number(lat);
    const lngNum = Number(lng);
    if (
      !Number.isFinite(latNum) ||
      !Number.isFinite(lngNum) ||
      latNum < -90 ||
      latNum > 90 ||
      lngNum < -180 ||
      lngNum > 180
    ) {
      return res
        .status(400)
        .json({ error: 'Please pick an address from the dropdown suggestions.' });
    }

    const db = await getDb();
    const cafesCollection = db.collection('cafes');

    if (placeId) {
      const existing = await cafesCollection.findOne(
        { placeId: String(placeId) },
        { projection: { _id: 1, name: 1 } },
      );
      if (existing) {
        return res.status(409).json({
          error: `This cafe has already been recommended${existing.name ? ` as "${existing.name}"` : ''}.`,
          existingId: existing._id,
        });
      }
    }

    const newCafe = {
      name: String(name),
      address: String(address),
      has_good_wifi: Boolean(has_good_wifi),
      is_quiet: Boolean(is_quiet),
      rating: rating != null && rating !== '' ? Number(rating) : null,
      cover_image: cover_image ? String(cover_image) : '',
      location: { type: 'Point', coordinates: [lngNum, latNum] },
      placeId: placeId ? String(placeId) : null,
      createdBy: new ObjectId(String(req.user._id)),
    };
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
