const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const { getDb, ObjectId } = require('../db');

passport.use(
  new LocalStrategy(
    { usernameField: 'email', passwordField: 'password', session: true },
    async (email, password, done) => {
      try {
        const normalizedEmail = String(email || '')
          .trim()
          .toLowerCase();
        const pw = String(password || '');
        if (!normalizedEmail || !pw) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        const db = await getDb();
        const users = db.collection('users');
        const user = await users.findOne({ email: normalizedEmail });
        if (!user) return done(null, false, { message: 'Invalid email or password' });

        const ok = await bcrypt.compare(pw, String(user.passwordHash || ''));
        if (!ok) return done(null, false, { message: 'Invalid email or password' });

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    },
  ),
);

passport.serializeUser((user, done) => {
  done(null, String(user._id));
});

passport.deserializeUser(async (id, done) => {
  try {
    if (!id || !ObjectId.isValid(String(id))) return done(null, false);

    const db = await getDb();
    const user = await db
      .collection('users')
      .findOne({ _id: new ObjectId(String(id)) }, { projection: { passwordHash: 0 } });
    if (!user) return done(null, false);
    return done(null, user);
  } catch (err) {
    return done(err);
  }
});

module.exports = { passport };
