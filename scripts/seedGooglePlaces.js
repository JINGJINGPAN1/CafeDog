require('dotenv').config();

const { MongoClient } = require('mongodb');
const { v2: cloudinary } = require('cloudinary');

const GOOGLE_API_KEY = process.env.Maps_API_KEY;
const MONGODB_URI = process.env.MONGODB_URI;

if (!GOOGLE_API_KEY) {
  console.error('Missing Maps_API_KEY in .env');
  process.exit(1);
}
if (!MONGODB_URI) {
  console.error('Missing MONGODB_URI in .env');
  process.exit(1);
}
if (
  !process.env.CLOUDINARY_CLOUD_NAME ||
  !process.env.CLOUDINARY_API_KEY ||
  !process.env.CLOUDINARY_API_SECRET
) {
  console.error('Missing Cloudinary credentials in .env');
  process.exit(1);
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Usage: node scripts/seedGooglePlaces.js --limit 10
const limitArg = process.argv.find((a) => a.startsWith('--limit'));
const limitVal = limitArg ? Number(process.argv[process.argv.indexOf(limitArg) + 1]) : null;
const TARGET = limitVal && limitVal > 0 ? limitVal : 1000;

// 20 major US city centers
const CITY_CENTERS = [
  { name: 'San Francisco', lat: 37.7749, lng: -122.4194 },
  { name: 'Seattle', lat: 47.6062, lng: -122.3321 },
  { name: 'New York', lat: 40.7128, lng: -74.006 },
  { name: 'Los Angeles', lat: 34.0522, lng: -118.2437 },
  { name: 'Chicago', lat: 41.8781, lng: -87.6298 },
  { name: 'Portland', lat: 45.5155, lng: -122.6789 },
  { name: 'Austin', lat: 30.2672, lng: -97.7431 },
  { name: 'Denver', lat: 39.7392, lng: -104.9903 },
  { name: 'Boston', lat: 42.3601, lng: -71.0589 },
  { name: 'Washington DC', lat: 38.9072, lng: -77.0369 },
  { name: 'Miami', lat: 25.7617, lng: -80.1918 },
  { name: 'Nashville', lat: 36.1627, lng: -86.7816 },
  { name: 'Philadelphia', lat: 39.9526, lng: -75.1652 },
  { name: 'San Diego', lat: 32.7157, lng: -117.1611 },
  { name: 'Minneapolis', lat: 44.9778, lng: -93.265 },
  { name: 'Atlanta', lat: 33.749, lng: -84.388 },
  { name: 'Dallas', lat: 32.7767, lng: -96.797 },
  { name: 'Phoenix', lat: 33.4484, lng: -112.074 },
  { name: 'Salt Lake City', lat: 40.7608, lng: -111.891 },
  { name: 'New Orleans', lat: 29.9511, lng: -90.0715 },
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// --- Google Places API (New) ---

async function fetchNearby(lat, lng, radius, pageToken) {
  const url = 'https://places.googleapis.com/v1/places:searchNearby';

  const body = {
    includedTypes: ['cafe'],
    maxResultCount: 20,
    locationRestriction: {
      circle: {
        center: { latitude: lat, longitude: lng },
        radius: radius,
      },
    },
  };

  const headers = {
    'Content-Type': 'application/json',
    'X-Goog-Api-Key': GOOGLE_API_KEY,
    'X-Goog-FieldMask':
      'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.photos',
  };

  if (pageToken) {
    headers['X-Goog-PageToken'] = pageToken;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google API HTTP ${res.status}: ${text}`);
  }

  const data = await res.json();
  return {
    results: data.places || [],
    nextPageToken: data.nextPageToken || null,
  };
}

async function fetchAllPagesForCenter(lat, lng, radius, maxResults) {
  const allResults = [];
  let pageToken = null;

  for (let page = 0; page < 3; page++) {
    if (pageToken) await sleep(2000);

    const { results, nextPageToken } = await fetchNearby(lat, lng, radius, pageToken);
    allResults.push(...results);

    if (allResults.length >= maxResults || !nextPageToken) break;
    pageToken = nextPageToken;
  }

  return allResults;
}

// --- Photo: Google → Cloudinary ---

async function downloadGooglePhoto(photoName) {
  const googleUrl = `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=800&key=${GOOGLE_API_KEY}`;
  const res = await fetch(googleUrl, { redirect: 'follow' });
  if (!res.ok) return null;
  return Buffer.from(await res.arrayBuffer());
}

function uploadBufferToCloudinary(buffer, publicId) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'image',
        folder: 'cafedog/seed',
        public_id: publicId,
        overwrite: false,
      },
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      },
    );
    stream.end(buffer);
  });
}

async function uploadPhotoToCloudinary(photoName, placeId) {
  try {
    const buffer = await downloadGooglePhoto(photoName);
    if (!buffer) return '';
    const result = await uploadBufferToCloudinary(buffer, placeId);
    return result.secure_url;
  } catch (err) {
    console.error(`    Photo upload failed for ${placeId}: ${err.message}`);
    return '';
  }
}

// --- Transform ---

function transformPlace(place) {
  const photoRef = place.photos && place.photos.length > 0 ? place.photos[0].name : null;

  const location = place.location
    ? { type: 'Point', coordinates: [place.location.longitude, place.location.latitude] }
    : null;

  return {
    name: place.displayName?.text || '',
    address: place.formattedAddress || '',
    location,
    rating: place.rating ? Math.min(5, Math.max(1, Math.round(place.rating))) : 4,
    cover_image: '', // will be filled after Cloudinary upload
    has_good_wifi: Math.random() > 0.4,
    is_quiet: Math.random() > 0.5,
    googlePlaceId: place.id,
    _photoRef: photoRef, // temp field, removed before DB insert
  };
}

// --- Main ---

async function main() {
  console.log(`Target: ${TARGET} unique cafes (Google Places → Cloudinary)\n`);

  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db('cafedog');
  const collection = db.collection('cafes');

  const existingDocs = await collection
    .find({ googlePlaceId: { $exists: true } }, { projection: { googlePlaceId: 1 } })
    .toArray();
  const seenPlaceIds = new Set(existingDocs.map((d) => d.googlePlaceId));
  console.log(`Found ${seenPlaceIds.size} existing cafes in DB, will skip duplicates.\n`);

  const cafes = [];

  // Step 1: Fetch cafe data from Google Places
  for (let i = 0; i < CITY_CENTERS.length; i++) {
    if (cafes.length >= TARGET) break;

    const city = CITY_CENTERS[i];
    console.log(
      `[${i + 1}/${CITY_CENTERS.length}] Searching ${city.name} (${city.lat}, ${city.lng})...`,
    );

    try {
      const radii = [2000, 5000];

      for (const radius of radii) {
        if (cafes.length >= TARGET) break;

        const results = await fetchAllPagesForCenter(
          city.lat,
          city.lng,
          radius,
          TARGET - cafes.length,
        );

        let added = 0;
        for (const place of results) {
          if (cafes.length >= TARGET) break;
          if (seenPlaceIds.has(place.id)) continue;

          seenPlaceIds.add(place.id);
          cafes.push(transformPlace(place));
          added++;
        }

        console.log(
          `  radius=${radius}m -> ${results.length} results, ${added} new | total: ${cafes.length}`,
        );

        await sleep(500);
      }
    } catch (err) {
      console.error(`  Error for ${city.name}: ${err.message}`);
    }

    await sleep(1000);
  }

  // Step 2: Upload photos to Cloudinary
  console.log(`\nUploading ${cafes.length} photos to Cloudinary...`);

  for (let i = 0; i < cafes.length; i++) {
    const cafe = cafes[i];
    if (cafe._photoRef) {
      const cloudinaryUrl = await uploadPhotoToCloudinary(cafe._photoRef, cafe.googlePlaceId);
      cafe.cover_image = cloudinaryUrl;
      // Small delay to avoid Cloudinary rate limits
      if ((i + 1) % 10 === 0) await sleep(1000);
    }
    delete cafe._photoRef;

    if ((i + 1) % 10 === 0 || i === cafes.length - 1) {
      console.log(`  [${i + 1}/${cafes.length}] photos uploaded`);
    }
  }

  // Step 3: Insert into MongoDB
  console.log(`\nInserting ${cafes.length} cafes into MongoDB...`);

  try {
    if (cafes.length > 0) {
      const result = await collection.insertMany(cafes);
      console.log(`Inserted ${result.insertedCount} cafes.`);
    } else {
      console.log('No new cafes to insert.');
    }
  } finally {
    await client.close();
  }

  console.log('Done!');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
