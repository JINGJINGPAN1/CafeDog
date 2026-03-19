const express = require('express');
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');

const router = express.Router();

function cloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );
}

function ensureCloudinaryConfigured() {
  if (!cloudinaryConfigured()) return false;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  return true;
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const ok = ['image/jpeg', 'image/png', 'image/webp'].includes(String(file.mimetype));
    cb(ok ? null : new Error('Only jpeg, png, webp are allowed'), ok);
  },
});

function uploadBufferToCloudinary(buffer, { folder }) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'image',
        folder: folder || 'cafedog',
      },
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      },
    );
    stream.end(buffer);
  });
}

router.post('/uploads/image', upload.single('file'), async (req, res) => {
  try {
    if (!ensureCloudinaryConfigured()) {
      return res.status(500).json({ error: 'Cloudinary is not configured on the server.' });
    }
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: 'Missing file.' });
    }

    const result = await uploadBufferToCloudinary(req.file.buffer, { folder: 'cafedog' });
    return res.json({
      ok: true,
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    });
  } catch (err) {
    console.error('Upload image error:', err);
    return res.status(400).json({ error: err?.message ? String(err.message) : 'Upload failed' });
  }
});

module.exports = { uploadsRouter: router };

