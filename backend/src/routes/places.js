const express = require('express');

const router = express.Router();

// Proxy Google Places photos so the API key never reaches the client.
// DB stores only the photo reference (e.g. "places/xxx/photos/yyy").
// Frontend requests: /api/places/photo?ref=places/xxx/photos/yyy
router.get('/places/photo', async (req, res) => {
  const photoRef = req.query.ref;
  if (!photoRef) {
    return res.status(400).json({ error: 'Missing ref parameter' });
  }

  const apiKey =
    process.env.GOOGLE_MAPS_API_KEY ||
    process.env.Maps_API_KEY ||
    process.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server missing Maps API key' });
  }

  const googleUrl = `https://places.googleapis.com/v1/${photoRef}/media?maxWidthPx=800&key=${apiKey}`;

  try {
    const response = await fetch(googleUrl, { redirect: 'follow' });
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch photo from Google' });
    }

    const contentType = response.headers.get('content-type');
    if (contentType) res.set('Content-Type', contentType);
    res.set('Cache-Control', 'public, max-age=86400'); // cache 24h

    const buffer = Buffer.from(await response.arrayBuffer());
    res.send(buffer);
  } catch (err) {
    console.error('Places photo proxy error:', err);
    res.status(500).json({ error: 'Failed to proxy photo' });
  }
});

module.exports = { placesRouter: router };
