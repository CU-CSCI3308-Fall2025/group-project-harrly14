require('dotenv').config();
const express = require('express');
const path = require('path');
const handlebars = require('express-handlebars');
const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);

const authRoutes = require('./routes/auth');
const pageRoutes = require('./routes/pages');
const auth = require('./middleware/auth');

const app = express();

// Trust proxy for secure cookies on Render
app.set('trust proxy', 1);

// ------------------ Handlebars Setup ------------------
const hbs = handlebars.create({
  extname: 'hbs',
  layoutsDir: path.join(__dirname, 'views', 'layouts'),
  partialsDir: path.join(__dirname, 'views', 'partials'),
});

app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// ------------------ Database ------------------
const db = require('./config/database');

// Ensure session table exists
db.none(`CREATE TABLE IF NOT EXISTS "session" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL,
  PRIMARY KEY ("sid")
)`).then(() => {
  return db.none(`CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire")`);
}).then(() => {
  console.log('Session table and index ensured');
}).catch(err => {
  console.error('Error ensuring session table:', err);
});

// ------------------ Middleware ------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from /public
app.use(express.static(path.join(__dirname, 'public')));

// Add CSP headers to allow Google Maps
app.use((req, res, next) => {
  res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline' https://maps.googleapis.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com; img-src 'self' data: https://*.googleapis.com; connect-src 'self' https://maps.googleapis.com https://cdn.jsdelivr.net; font-src https://fonts.gstatic.com;");
  next();
});

// ------------------ Session ------------------
let sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  if (process.env.NODE_ENV === 'development') {
    console.warn('Warning: SESSION_SECRET is not set. Using insecure fallback for development.');
    sessionSecret = 'dev_insecure_secret_' + Math.random().toString(36).slice(2);
  } else {
    throw new Error('SESSION_SECRET environment variable is required for secure sessions.');
  }
}

// use PostgreSQL-backed store
app.use(session({
  store: new PgSession({
    pgPromise: db,
    tableName: 'session'
  }),
  secret: sessionSecret,
  saveUninitialized: false,
  resave: false,
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  }
}));

// expose req.session.user to all handlebars views
app.use((req, res, next) => {
  res.locals.user = req.session && req.session.user ? req.session.user : null;
  next();
});

// ------------------ Routes ------------------
// Public routes
app.use('/', pageRoutes);
app.use('/', authRoutes);

// Mount new API route for parking lot polygons
app.use('/parking-lots.js', require('./routes/parking_lots'));
app.use('/api/parking-sessions', require('./routes/parking_sessions'));
app.use('/api/report', require('./routes/report'));
app.use('/api/users', require('./routes/users'));

// Welcome test route
app.get('/welcome', (req, res) => {
  res.json({ status: 'success', message: 'Welcome!' });
});

app.get("/api/availability/:lotId", async (req, res) => {
  const lotId = req.params.lotId;
  try {
    const row = await db.oneOrNone(
      'SELECT capacity, current_occupancy FROM parking_lots WHERE lot_id = $1',
      [lotId]
    );
    if (!row) {
      return res.status(404).json({ error: 'Lot not found' });
    }
    const available = (row.capacity || 0) - (row.current_occupancy || 0);
    return res.json({ available });
  } catch (err) {
    console.error('DB error:', err);
    return res.status(500).json({ error: 'Database error' });
  }
});

// Protected routes mounted after auth middleware
app.use(auth);
// Example: app.use('/api/user', require('./routes/user'));

// ------------------ Server ------------------
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// ------------------ Graceful shutdown ------------------
function gracefulShutdown(signal) {
  console.log(`Received ${signal}, starting graceful shutdown...`);
  const shutdownTimeout = setTimeout(() => {
    console.error('Graceful shutdown timed out, forcing exit');
    process.exit(1);
  }, 10000);

  server.close(() => {
    clearTimeout(shutdownTimeout);
    if (db && db.$pgp && typeof db.$pgp.end === 'function') {
      db.$pgp.end();
    }
    process.exit(0);
  });
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  gracefulShutdown('UncaughtException');
});

module.exports = server;
