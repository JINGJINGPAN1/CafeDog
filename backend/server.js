const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const session = require('express-session');
const { MongoStore } = require('connect-mongo');
const passport = require('passport');

const { client } = require('./src/db');
require('./src/auth/passport');
const { cafesRouter } = require('./src/routes/cafes');
const { postsRouter } = require('./src/routes/posts');
const { authRouter } = require('./src/routes/auth');
const { socialRouter } = require('./src/routes/social');
const { uploadsRouter } = require('./src/routes/uploads');
const { placesRouter } = require('./src/routes/places');

const app = express();
const port = Number(process.env.PORT) || 5001;

// 1. encode the json data from frontend
app.use(express.json());

// 2. sessions (cookie-based auth)
if (process.env.NODE_ENV === 'production') {
  // needed when deployed behind a proxy (Render/Fly/etc)
  app.set('trust proxy', 1);
}

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret && process.env.NODE_ENV === 'production') {
  console.error('Missing SESSION_SECRET in environment variables');
  process.exit(1);
}

app.use(
  session({
    name: 'cafedog.sid',
    secret: sessionSecret || 'dev-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
    store: MongoStore.create({
      client,
      dbName: 'cafedog',
      collectionName: 'sessions',
      stringify: false,
    }),
  }),
);

// 2b. passport (session-based auth)
app.use(passport.initialize());
app.use(passport.session());

// 3. API routes
app.use('/api', authRouter);
app.use('/api', cafesRouter);
app.use('/api', postsRouter);
app.use('/api', socialRouter);
app.use('/api', uploadsRouter);
app.use('/api', placesRouter);

// 4. serve frontend (same-origin) in production
const distPath = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(distPath));

app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// 4. start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
