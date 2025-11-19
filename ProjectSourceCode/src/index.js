require('dotenv').config();
const express = require('express');
const path = require('path');
const handlebars = require('express-handlebars');
const session = require('express-session');

const authRoutes = require('./routes/auth');
const pageRoutes = require('./routes/pages');
const auth = require('./middleware/auth');

const app = express();

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

// ------------------ Middleware ------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from /public
app.use(express.static(path.join(__dirname, 'public')));

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

app.use(session({
  secret: sessionSecret,
  saveUninitialized: false,
  resave: false,
}));

// expose req.session.user to all handlebars views
app.use((req, res, next) => {
  res.locals.user = req.session && req.session.user ? req.session.user : null;
  next();
});

// ------------------ Routes ------------------
// Public routes
app.use('/', authRoutes);
app.use('/', pageRoutes);

// Mount new API route for parking lot polygons
app.use('/parking-lots.js', require('./routes/parking_lots'));
app.use('/api/parking-sessions', require('./routes/parking_sessions'));


// Welcome test route
app.get('/welcome', (req, res) => {
  res.json({ status: 'success', message: 'Welcome!' });
});

app.get("/api/availability/:lotId", (req, res) => {
  const lotId = req.params.lotId;

  db.query(
    "SELECT available_spots FROM parking_lots WHERE lot_id = $1",
    [lotId],
    (err, results) => {
      if (err) {
        console.error("DB error:", err);
        return res.status(500).json({ error: "Database error" });
      }

      console.log("DB results:", results);

      if (results.rows.length === 0) {
        return res.json({ available: "Unknown" });
      }

      res.json({ available: results.rows[0].available_spots });
    }
  );
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
