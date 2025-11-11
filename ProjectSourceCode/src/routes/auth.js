const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/database');
// Comment this out if you want to test without login
const isAuthenticated = require('../middleware/auth');

router.get('/register', (req, res) => {
  const message = req.session.message;
  const error = req.session.error;
  delete req.session.message;
  delete req.session.error;
  res.render('pages/register', { message, error });
});

router.get('/login', (req, res) => {
  const message = req.query.message || req.session.message;
  const error = (req.query.error !== undefined)
    ? (req.query.error === 'true' || req.query.error === '1')
    : req.session.error;
  delete req.session.message;
  delete req.session.error;
  res.render('pages/login', { message, error });
});

router.post('/register', async (req, res) => {
  try {
    const hashRounds = process.env.RUN_TESTS ==='true' ? 2 : 10;
    const hashedPassword = await bcrypt.hash(req.body.password, hashRounds); 
    await db.none('INSERT INTO users (username, email, password) VALUES ($1, $2, $3)', [req.body.username, req.body.email, hashedPassword]);
    res.json({ message: 'Success' });
  } catch (err) {
    console.error(err);
    if (err.code === '23505') {
      res.status(400).json({ message: 'Username already exists' });
    } else {
      res.status(500).json({ message: 'Error registering user' });
    }
  }
});

router.post('/login', async (req, res) => {
  try {
    if (!req.body.username || !req.body.password) {
      req.session.message = 'Please provide a username and password';
      req.session.error = true;
      return res.redirect('/login');
    }

    const username = req.body.username;
    const findUserQuery = `SELECT username,password FROM users WHERE username = $1`;
    let user = await db.oneOrNone(findUserQuery, [username]);

    if (!user) {
      req.session.message = 'No username found. Please register first.';
      req.seqssion.error = true;
      return res.redirect('/register');
    }

    const match = await bcrypt.compare(req.body.password, user.password);
    if (!match) {
      req.session.message = 'Incorrect username or password.';
      req.session.error = true;
      return res.redirect('/login');
    }

    req.session.user = user.username;
    req.session.save(() => res.redirect('/home'));
  } catch (err) {
    console.log('Login error:', err);
    req.session.message = 'An error occurred during login. Please try again.';
    req.session.error = true;
    return res.redirect('/login');
  }
});

// Protected home route. Comment this out if you want to test without login
router.get('/home', isAuthenticated, (req, res) => {
  res.render('pages/home', { username: req.session.user });
});

router.get('/logout', (req, res) => {
  const msg = 'Logged out successfully';
  req.session.destroy(() => {
    return res.redirect(`/login?message=${encodeURIComponent(msg)}&error=false`);
  });
});

module.exports = router;