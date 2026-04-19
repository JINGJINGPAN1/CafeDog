const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('Missing MONGODB_URI');
  process.exit(1);
}

const APPLY = process.argv.includes('--apply');

async function main() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db('cafedog');
  const posts = db.collection('posts');

  // Find (authorId, cafeId) pairs with more than one post
  const dupGroups = await posts
    .aggregate([
      { $match: { authorId: { $type: 'objectId' } } },
      {
        $group: {
          _id: { authorId: '$authorId', cafeId: '$cafeId' },
          ids: { $push: { id: '$_id', createdAt: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $match: { count: { $gt: 1 } } },
    ])
    .toArray();

  if (dupGroups.length === 0) {
    console.log('No duplicate (authorId, cafeId) pairs found. Nothing to do.');
    await client.close();
    return;
  }

  console.log(`Found ${dupGroups.length} duplicate groups.`);

  const toDelete = [];
  for (const g of dupGroups) {
    // Keep most recent; delete the rest
    const sorted = g.ids
      .slice()
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    const [keep, ...drop] = sorted;
    console.log(
      `  author=${g._id.authorId} cafe=${g._id.cafeId} total=${g.count} keep=${keep.id} drop=${drop.length}`,
    );
    drop.forEach((d) => toDelete.push(d.id));
  }

  console.log(`\nTotal posts to delete: ${toDelete.length}`);

  if (!APPLY) {
    console.log('\nDry run. Re-run with --apply to delete.');
    await client.close();
    return;
  }

  const result = await posts.deleteMany({ _id: { $in: toDelete } });
  console.log(`Deleted ${result.deletedCount} duplicate posts.`);

  // Also clean up related likes/comments pointing to deleted posts
  const likesRes = await db.collection('likes').deleteMany({ postId: { $in: toDelete } });
  const commentsRes = await db.collection('comments').deleteMany({ postId: { $in: toDelete } });
  console.log(`Deleted ${likesRes.deletedCount} orphan likes, ${commentsRes.deletedCount} orphan comments.`);

  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
