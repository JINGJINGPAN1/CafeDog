const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', 'frontend', '.env') });

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;
const API_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY;

if (!MONGODB_URI) {
  console.error('Missing MONGODB_URI');
  process.exit(1);
}
if (!API_KEY) {
  console.error('Missing GOOGLE_MAPS_API_KEY');
  process.exit(1);
}

const APPLY = process.argv.includes('--apply');
const PRECISE_TYPES = new Set([
  'street_address',
  'premise',
  'subpremise',
  'point_of_interest',
  'establishment',
]);
const PRECISE_LOCATION_TYPES = new Set(['ROOFTOP', 'RANGE_INTERPOLATED']);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function geocodeOnce(address) {
  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
  url.searchParams.set('address', address);
  url.searchParams.set('components', 'country:US');
  url.searchParams.set('region', 'us');
  url.searchParams.set('key', API_KEY);
  const res = await fetch(url);
  return res.json();
}

async function geocode(address) {
  let data = await geocodeOnce(address);
  if (data.status === 'REQUEST_DENIED') {
    await sleep(3000);
    data = await geocodeOnce(address);
  }
  return data;
}

function classify(result) {
  if (!result) return 'none';
  const types = result.types || [];
  const locType = result.geometry?.location_type;
  const preciseType = types.some((t) => PRECISE_TYPES.has(t));
  const preciseLoc = PRECISE_LOCATION_TYPES.has(locType);
  if (preciseType || preciseLoc) return 'precise';
  return 'vague';
}

async function main() {
  console.log(APPLY ? '== APPLY mode ==' : '== DRY RUN (pass --apply to write) ==');
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db('cafedog');
  const cafes = db.collection('cafes');

  const query = {
    $or: [
      { location: { $exists: false } },
      { 'location.coordinates': { $exists: false } },
      { 'location.coordinates.0': { $type: 'null' } },
    ],
  };
  const docs = await cafes.find(query).toArray();
  console.log(`Found ${docs.length} cafes without valid location\n`);

  const stats = { precise: 0, vague: 0, none: 0, noAddress: 0, errors: 0 };
  const vagueList = [];
  const noneList = [];

  for (const cafe of docs) {
    const label = `${cafe.name} (${cafe._id})`;
    if (!cafe.address || !cafe.address.trim()) {
      console.log(`[skip:no-address] ${label}`);
      stats.noAddress += 1;
      continue;
    }
    try {
      const data = await geocode(cafe.address);
      if (data.status === 'ZERO_RESULTS') {
        console.log(`[none]     ${label} — "${cafe.address}"`);
        stats.none += 1;
        noneList.push({ id: cafe._id.toString(), name: cafe.name, address: cafe.address });
        await sleep(100);
        continue;
      }
      if (data.status !== 'OK') {
        console.log(
          `[error]    ${label} — status=${data.status}${data.error_message ? ' — ' + data.error_message : ''}`,
        );
        stats.errors += 1;
        await sleep(200);
        continue;
      }
      if (!data.results || data.results.length === 0) {
        console.log(`[none]     ${label} — "${cafe.address}" (empty results)`);
        stats.none += 1;
        noneList.push({ id: cafe._id.toString(), name: cafe.name, address: cafe.address });
        await sleep(100);
        continue;
      }
      const top = data.results[0];
      const kind = classify(top);
      if (kind !== 'precise') {
        console.log(
          `[vague]    ${label} — "${cafe.address}" → "${top.formatted_address}" (types=${top.types.join(',')})`,
        );
        stats.vague += 1;
        vagueList.push({
          id: cafe._id.toString(),
          name: cafe.name,
          address: cafe.address,
          resolved: top.formatted_address,
        });
        await sleep(100);
        continue;
      }
      const lat = top.geometry.location.lat;
      const lng = top.geometry.location.lng;
      const placeId = top.place_id;
      console.log(
        `[precise]  ${label} — "${cafe.address}" → (${lat.toFixed(5)}, ${lng.toFixed(5)}) types=${top.types.join(',')}`,
      );
      if (APPLY) {
        await cafes.updateOne(
          { _id: cafe._id },
          {
            $set: {
              location: { type: 'Point', coordinates: [lng, lat] },
              lat,
              lng,
              placeId,
              formattedAddress: top.formatted_address,
            },
          },
        );
      }
      stats.precise += 1;
      await sleep(100);
    } catch (err) {
      console.error(`[error]    ${label} —`, err.message);
      stats.errors += 1;
      await sleep(200);
    }
  }

  console.log('\n== Summary ==');
  console.log(`  precise (${APPLY ? 'updated' : 'would update'}): ${stats.precise}`);
  console.log(`  vague (skipped):   ${stats.vague}`);
  console.log(`  no result:         ${stats.none}`);
  console.log(`  no address:        ${stats.noAddress}`);
  console.log(`  errors:            ${stats.errors}`);

  if (vagueList.length > 0) {
    console.log('\n== Vague (likely test data) ==');
    vagueList.forEach((c) => console.log(`  ${c.id}  ${c.name}  "${c.address}"`));
  }
  if (noneList.length > 0) {
    console.log('\n== No result (likely junk) ==');
    noneList.forEach((c) => console.log(`  ${c.id}  ${c.name}  "${c.address}"`));
  }

  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
