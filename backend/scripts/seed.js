const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const bcrypt = require('bcrypt');
const { MongoClient, ObjectId } = require('mongodb');

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('Missing MONGODB_URI in environment variables');
  process.exit(1);
}

const DROP = process.argv.includes('--drop');

function sample(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomText() {
  const starts = [
    'Loved the vibe today.',
    'Perfect place to study.',
    'Great espresso and friendly staff.',
    'Came here for a quick break.',
    'Tried something new and it was awesome.',
  ];
  const ends = [
    'Would come again.',
    'WiFi was solid.',
    'A bit noisy but still fun.',
    'Highly recommend the cold brew.',
    'Lighting is perfect for photos.',
  ];
  return `${sample(starts)} ${sample(ends)}`;
}

async function main() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('cafedog');

  const cafes = db.collection('cafes');
  const posts = db.collection('posts');
  const users = db.collection('users');

  if (DROP) {
    await Promise.allSettled([cafes.drop(), posts.drop(), users.drop()]);
  }

  const cafeCount = await cafes.countDocuments();
  const userCount = await users.countDocuments();

  const cafesToCreate = cafeCount > 0 ? 0 : 50;
  const usersToCreate = userCount > 0 ? 0 : 50;

  const cafeDocs = [];
  for (let i = 0; i < cafesToCreate; i++) {
    cafeDocs.push({
      name: `Cafe ${i + 1}`,
      address: `${randInt(1, 999)} Main St`,
      has_good_wifi: Math.random() > 0.35,
      is_quiet: Math.random() > 0.45,
      rating: Number((Math.random() * 2 + 3).toFixed(1)),
      cover_image: '',
    });
  }

  if (cafeDocs.length) {
    await cafes.insertMany(cafeDocs);
  }

  const userDocs = [];
  const seededPasswordHash = await bcrypt.hash('password123', 10);
  for (let i = 0; i < usersToCreate; i++) {
    userDocs.push({
      email: `user${i + 1}@example.com`,
      username: `user${i + 1}`,
      passwordHash: seededPasswordHash,
      createdAt: new Date(),
    });
  }

  if (userDocs.length) {
    await users.insertMany(userDocs);
  }

  const cafeIds = (await cafes.find({}, { projection: { _id: 1 } }).toArray()).map((c) => c._id);
  const userIds = (await users.find({}, { projection: { _id: 1, username: 1 } }).toArray()).map(
    (u) => ({
      _id: u._id,
      username: u.username,
    }),
  );

  if (!cafeIds.length) throw new Error('No cafes available for seeding posts.');

  const targetPosts = 1000;
  const existingPosts = await posts.countDocuments();
  const postsToCreate = Math.max(0, targetPosts - existingPosts);

  const batchSize = 250;
  for (let offset = 0; offset < postsToCreate; offset += batchSize) {
    const batch = [];
    const n = Math.min(batchSize, postsToCreate - offset);
    for (let i = 0; i < n; i++) {
      const cafeId = sample(cafeIds);
      const author = sample(userIds);
      batch.push({
        cafeId: new ObjectId(String(cafeId)),
        authorId: author ? author._id : null,
        author: author ? author.username : 'Anonymous',
        text: randomText(),
        photoUrl: '',
        rating: randInt(1, 5),
        createdAt: new Date(Date.now() - randInt(0, 1000 * 60 * 60 * 24 * 30)),
      });
    }
    if (batch.length) await posts.insertMany(batch);
  }

  const finalCafeCount = await cafes.countDocuments();
  const finalUserCount = await users.countDocuments();
  const finalPostCount = await posts.countDocuments();

  console.log(
    JSON.stringify(
      {
        dropped: DROP,
        cafes: finalCafeCount,
        users: finalUserCount,
        posts: finalPostCount,
      },
      null,
      2,
    ),
  );

  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
