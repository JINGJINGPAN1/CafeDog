const express = require('express');
const { getDb, ObjectId } = require('../db');
const { requireAuth } = require('../middleware/requireAuth');

const router = express.Router();

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

    const cafes = await cafesCollection.find(filter).toArray();
    res.json(cafes);
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
    const cafe = await cafesCollection.findOne({ _id: new ObjectId(String(cafeId)) });

    if (!cafe) {
      return res.status(404).json({ error: "Can't find the cafe!" });
    }

    res.status(200).json(cafe);
  } catch (error) {
    console.error('Error finding cafe:', error);
    res.status(500).json({ error: 'Server error or invalid ID format.' });
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
