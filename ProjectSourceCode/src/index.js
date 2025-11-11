require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');
const handlebars = require('express-handlebars');
const session = require('express-session');

const authRoutes = require('./routes/auth');
const pageRoutes = require('./routes/pages')
const auth = require('./middleware/auth');

const hbs = handlebars.create({
  extname: 'hbs',
  layoutsDir: path.join(__dirname, 'views', 'layouts'),
  partialsDir: path.join(__dirname, 'views', 'partials'),
});

app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Validate SESSION_SECRET: require it in non-development environments
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
app.use(express.static(path.join(__dirname, 'public')));

// public auth routes
app.use('/', authRoutes);
app.use('/', pageRoutes);

// Welcome route for testing
app.get('/welcome', (req, res) => {
  res.json({status: 'success', message: 'Welcome!'});
});

// protected routes mounted after this line
app.use(auth)
// example routes that could be protected
// app.use('api/user', require('./routes/user'));
// app.use('api/reports', require('./routes/reports '));


const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

const db = require('./config/database');

// stuff to make the shutdown of containers more graceful
// shoutout to computer systems for teaching me the basis of this stuff
function gracefulShutdown(signal) {
  console.log(`Received ${signal}, starting graceful shutdown...`);
  server.close(() => {
    if (db && db.$pgp && typeof db.$pgp.end == 'function') {
      db.$pgp.end();
    }
    process.exit(0);
  });

  setTimeout(() => {
    console.error('Graceful shutdown timed out, forcing exit');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('uncaughtException', (err) => {
  gracefulShutdown('uncaughtException');
});

module.exports = server;