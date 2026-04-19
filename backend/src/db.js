const { MongoClient, ObjectId } = require('mongodb');

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error('Missing MONGODB_URI in environment variables');
}

const client = new MongoClient(uri);
let cachedDb = null;

async function getDb() {
  if (cachedDb) return cachedDb;
  await client.connect();
  cachedDb = client.db('cafedog');
  try {
    await cachedDb.collection('cafes').createIndex({ location: '2dsphere' });
  } catch (err) {
    console.error('Failed to create 2dsphere index:', err);
  }
  try {
    await cachedDb.collection('posts').createIndex(
      { authorId: 1, cafeId: 1 },
      {
        unique: true,
        partialFilterExpression: { authorId: { $type: 'objectId' } },
        name: 'uniq_author_cafe',
      },
    );
  } catch (err) {
    console.error(
      'Failed to create unique (authorId, cafeId) index on posts — run scripts/dedupeReviews.js first:',
      err.message,
    );
  }
  return cachedDb;
}

module.exports = {
  client,
  getDb,
  ObjectId,
};
