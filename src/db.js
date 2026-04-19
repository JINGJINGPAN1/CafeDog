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
  return cachedDb;
}

module.exports = {
  client,
  getDb,
  ObjectId,
};
