const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('Missing MONGODB_URI');
  process.exit(1);
}

const MIN_REVIEWS = 2;
const MAX_REVIEWS = 4;

const TEXT_SNIPPETS = [
  'Great coffee and cozy vibes.',
  'Perfect for a quick work session.',
  'Espresso was on point.',
  'Staff was friendly, drinks came fast.',
  'Nice spot to catch up with friends.',
  'Latte art was beautiful.',
  'Good wifi, decent seating.',
  'Came here to study — pretty quiet corner.',
  'Pastries were fresh, cold brew was strong.',
  'Will definitely come back.',
  'Solid neighborhood spot.',
  'Loved the aesthetic here.',
];

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function sample(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Generate `count` integer ratings in [1..5] whose sum === target * count.
function generateRatings(target, count) {
  const sumTarget = target * count;
  const ratings = [];
  let remaining = sumTarget;
  for (let i = 0; i < count; i++) {
    const leftSlots = count - i - 1;
    const maxAllowed = Math.min(5, remaining - leftSlots * 1);
    const minAllowed = Math.max(1, remaining - leftSlots * 5);
    const r = randInt(minAllowed, maxAllowed);
    ratings.push(r);
    remaining -= r;
  }
  return ratings;
}

async function main() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db('cafedog');
  const cafes = db.collection('cafes');
  const posts = db.collection('posts');
  const users = db.collection('users');

  const userDocs = await users.find({}, { projection: { _id: 1, username: 1 } }).toArray();
  if (!userDocs.length) {
    console.error('No users found. Run `node scripts/seed.js` first.');
    await client.close();
    return;
  }

  const googleCafes = await cafes.find({ googlePlaceId: { $exists: true } }).toArray();
  console.log(`Found ${googleCafes.length} Google-seeded cafes`);

  const cafeIdsWithPosts = new Set(
    (
      await posts
        .aggregate([
          { $match: { cafeId: { $in: googleCafes.map((c) => c._id) } } },
          { $group: { _id: '$cafeId' } },
        ])
        .toArray()
    ).map((r) => String(r._id)),
  );

  const targets = googleCafes.filter((c) => !cafeIdsWithPosts.has(String(c._id)));
  console.log(`${targets.length} cafes need fake reviews\n`);

  const batch = [];
  for (const cafe of targets) {
    const targetRating = Math.min(5, Math.max(1, Math.round(cafe.rating || 4)));
    const count = randInt(MIN_REVIEWS, MAX_REVIEWS);
    const ratings = generateRatings(targetRating, count);
    for (const r of ratings) {
      const author = sample(userDocs);
      batch.push({
        cafeId: cafe._id,
        authorId: author._id,
        author: author.username || 'Anonymous',
        text: sample(TEXT_SNIPPETS),
        photoUrl: '',
        rating: r,
        createdAt: new Date(Date.now() - randInt(0, 1000 * 60 * 60 * 24 * 30)),
      });
    }
  }

  if (batch.length === 0) {
    console.log('No reviews to create.');
  } else {
    const result = await posts.insertMany(batch);
    console.log(
      `Inserted ${result.insertedCount} fake reviews across ${targets.length} cafes.`,
    );
  }

  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
